"""
CSV Import & Email Queue API Routes
Upload CSV with email + naam columns, validate, deduplicate, and add to email_queue
Bulk email sending with template support
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, Callable
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import re
import csv
import io
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email/csv", tags=["csv-import"])

# MongoDB database reference - will be set by main app
db = None
# Supabase client reference for templates
supabase_client = None
# Email send function reference
email_sender: Callable = None

def set_db(database):
    """Set the MongoDB database reference"""
    global db
    db = database
    logger.info("✅ MongoDB set for CSV import route")

def set_supabase(client):
    """Set the Supabase client for template access"""
    global supabase_client
    supabase_client = client

def set_email_sender(sender_fn: Callable):
    """Set the email sending function reference"""
    global email_sender
    email_sender = sender_fn


EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validate_email(email: str) -> bool:
    """Basic email format validation"""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


@router.post("/import")
async def import_csv(
    file: UploadFile = File(...),
    source: str = Form(None),
    template_id: Optional[str] = Form(None),
):
    """
    Import a CSV file containing email and naam columns.
    Validates emails, deduplicates, and adds to email_queue in MongoDB.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Alleen CSV bestanden zijn toegestaan")

    try:
        contents = await file.read()
        text = contents.decode('utf-8-sig')  # Handle BOM

        # Detect delimiter
        try:
            dialect = csv.Sniffer().sniff(text[:4096])
            reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        except csv.Error:
            # Default to comma
            reader = csv.DictReader(io.StringIO(text), delimiter=',')

        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV bestand is leeg of ongeldig")

        # Normalize column names (case-insensitive)
        col_map = {}
        for col in reader.fieldnames:
            lower = col.strip().lower()
            if lower in ('email', 'e-mail', 'emailadres', 'email_address', 'mail'):
                col_map['email'] = col
            elif lower in ('naam', 'name', 'volledige_naam', 'full_name'):
                col_map['naam'] = col
            elif lower in ('voornaam', 'firstname', 'first_name', 'first name'):
                col_map['firstname'] = col
            elif lower in ('achternaam', 'lastname', 'last_name', 'last name', 'surname'):
                col_map['lastname'] = col
            elif lower in ('straat', 'street', 'adres', 'address'):
                col_map['street'] = col
            elif lower in ('postcode', 'zipcode', 'zip_code', 'zip'):
                col_map['zipcode'] = col
            elif lower in ('stad', 'city', 'plaats', 'woonplaats'):
                col_map['city'] = col
            elif lower in ('telefoon', 'phone', 'tel', 'tel_number_complete', 'telefoonnummer'):
                col_map['phone'] = col

        if 'email' not in col_map:
            raise HTTPException(
                status_code=400,
                detail=f"Kolom 'email' niet gevonden. Gevonden kolommen: {', '.join(reader.fieldnames)}"
            )

        # Generate source tag
        source_tag = source or f"csv_import_{datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M')}"

        # Read all rows and validate
        valid_entries = []
        invalid_emails = []
        seen_emails = set()
        total_rows = 0

        for row in reader:
            total_rows += 1
            email = row.get(col_map['email'], '').strip().lower()

            # Build naam from available columns
            if 'naam' in col_map:
                naam = row.get(col_map['naam'], '').strip()
            elif 'firstname' in col_map:
                first = row.get(col_map['firstname'], '').strip()
                last = row.get(col_map.get('lastname', ''), '').strip() if 'lastname' in col_map else ''
                naam = f"{first} {last}".strip()
            else:
                naam = ''

            if not validate_email(email):
                invalid_emails.append(email or f"(rij {total_rows}: leeg)")
                continue

            if email in seen_emails:
                continue  # Skip duplicate within CSV
            seen_emails.add(email)

            valid_entries.append({
                'email': email,
                'naam': naam,
                'street': row.get(col_map.get('street', ''), '').strip() if 'street' in col_map else '',
                'zipcode': row.get(col_map.get('zipcode', ''), '').strip() if 'zipcode' in col_map else '',
                'city': row.get(col_map.get('city', ''), '').strip() if 'city' in col_map else '',
                'phone': row.get(col_map.get('phone', ''), '').strip() if 'phone' in col_map else '',
            })

        if not valid_entries:
            return {
                "success": False,
                "message": "Geen geldige e-mailadressen gevonden in het CSV bestand",
                "total_rows": total_rows,
                "valid": 0,
                "invalid": len(invalid_emails),
                "duplicates_in_csv": total_rows - len(invalid_emails),
                "added": 0,
                "skipped_existing": 0,
                "invalid_emails": invalid_emails[:20],
            }

        # Check for existing emails in the queue
        collection = db['email_queue']
        existing_cursor = collection.find(
            {"email": {"$in": [e['email'] for e in valid_entries]}},
            {"email": 1, "_id": 0}
        )
        existing_list = await existing_cursor.to_list(length=len(valid_entries))
        existing_emails = {e['email'] for e in existing_list}

        # Prepare documents for insertion (skip existing)
        now = datetime.now(timezone.utc)
        docs_to_insert = []
        skipped_existing = 0

        for entry in valid_entries:
            if entry['email'] in existing_emails:
                skipped_existing += 1
                continue

            docs_to_insert.append({
                "id": str(uuid.uuid4()),
                "email": entry['email'],
                "naam": entry['naam'],
                "street": entry.get('street', ''),
                "zipcode": entry.get('zipcode', ''),
                "city": entry.get('city', ''),
                "phone": entry.get('phone', ''),
                "source": source_tag,
                "template_id": template_id,
                "status": "pending",
                "created_at": now.isoformat(),
            })

        # Bulk insert
        added = 0
        if docs_to_insert:
            result = await collection.insert_many(docs_to_insert)
            added = len(result.inserted_ids)

        logger.info(
            f"CSV import complete: {added} added, {skipped_existing} skipped (existing), "
            f"{len(invalid_emails)} invalid, source={source_tag}"
        )

        return {
            "success": True,
            "message": f"{added} contacten succesvol toegevoegd aan de wachtrij",
            "total_rows": total_rows,
            "valid": len(valid_entries),
            "invalid": len(invalid_emails),
            "duplicates_in_csv": total_rows - len(valid_entries) - len(invalid_emails),
            "added": added,
            "skipped_existing": skipped_existing,
            "source": source_tag,
            "columns_found": list(col_map.keys()),
            "invalid_emails": invalid_emails[:20],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=500, detail=f"Import mislukt: {str(e)}")


@router.get("/queue")
async def get_csv_queue(source: Optional[str] = None, status: Optional[str] = None, limit: int = 100):
    """Get imported contacts from the email queue"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        query = {}
        if source:
            query["source"] = source
        if status:
            query["status"] = status

        cursor = db['email_queue'].find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
        items = await cursor.to_list(length=limit)

        # Get total count
        total = await db['email_queue'].count_documents(query)

        # Get source stats
        pipeline = [
            {"$group": {"_id": "$source", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20},
        ]
        sources_cursor = db['email_queue'].aggregate(pipeline)
        sources = await sources_cursor.to_list(length=20)

        return {
            "items": items,
            "total": total,
            "sources": [{"source": s["_id"], "count": s["count"]} for s in sources],
        }
    except Exception as e:
        logger.error(f"Error fetching queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/queue")
async def clear_queue(source: Optional[str] = None):
    """Clear email queue entries, optionally filtered by source"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        query = {}
        if source:
            query["source"] = source

        result = await db['email_queue'].delete_many(query)
        return {
            "success": True,
            "deleted": result.deleted_count,
            "message": f"{result.deleted_count} items verwijderd"
        }
    except Exception as e:
        logger.error(f"Error clearing queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))



class CampaignRequest(BaseModel):
    template_id: str
    source: Optional[str] = None
    batch_size: int = 25
    delay_seconds: float = 1.2


# In-memory campaign progress tracking
campaign_progress = {}


@router.post("/send-campaign")
async def send_campaign(request: CampaignRequest):
    """
    Send a bulk email campaign to contacts in the queue.
    Uses a template from Supabase and personalizes with naam.
    Sends in batches with delays to protect sender reputation.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database niet geconfigureerd")
    if supabase_client is None:
        raise HTTPException(status_code=500, detail="Template database niet geconfigureerd")
    if email_sender is None:
        raise HTTPException(status_code=500, detail="Email service niet geconfigureerd")

    # Fetch template from Supabase
    try:
        result = supabase_client.table("email_templates").select("*").eq("id", request.template_id).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Template niet gevonden")
        template = result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template ophalen mislukt: {e}")

    # Get pending contacts from queue
    query = {"status": "pending"}
    if request.source:
        query["source"] = request.source

    cursor = db['email_queue'].find(query)
    contacts = await cursor.to_list(length=5000)

    if not contacts:
        return {
            "success": True,
            "message": "Geen contacten in de wachtrij om te mailen",
            "sent": 0, "failed": 0, "total": 0
        }

    # Create campaign ID for progress tracking
    campaign_id = str(uuid.uuid4())[:8]
    total = len(contacts)
    campaign_progress[campaign_id] = {
        "total": total, "sent": 0, "failed": 0,
        "status": "running", "started_at": datetime.now(timezone.utc).isoformat()
    }

    # Process in background
    async def process_campaign():
        sent = 0
        failed = 0
        failed_emails = []

        for i, contact in enumerate(contacts):
            email = contact.get("email", "")
            naam = contact.get("naam", "")

            # Personalize template
            subject = template.get("subject", "Droomvriendjes")
            content = template.get("content", "")
            subject = subject.replace("{{naam}}", naam).replace("{{firstname}}", naam).replace("{{voornaam}}", naam)
            content = content.replace("{{naam}}", naam).replace("{{firstname}}", naam).replace("{{voornaam}}", naam)
            content = content.replace("{{email}}", email)

            # Plain text fallback
            import html as html_module
            text_content = html_module.unescape(re.sub(r'<[^>]+>', '', content))

            try:
                success = email_sender(email, subject, content, text_content)
                if success:
                    sent += 1
                    await db['email_queue'].update_one(
                        {"_id": contact["_id"]},
                        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat()}}
                    )
                else:
                    failed += 1
                    failed_emails.append(email)
                    await db['email_queue'].update_one(
                        {"_id": contact["_id"]},
                        {"$set": {"status": "failed", "error": "SMTP error"}}
                    )
            except Exception as e:
                failed += 1
                failed_emails.append(email)
                await db['email_queue'].update_one(
                    {"_id": contact["_id"]},
                    {"$set": {"status": "failed", "error": str(e)[:200]}}
                )

            # Update progress
            campaign_progress[campaign_id] = {
                "total": total, "sent": sent, "failed": failed,
                "processed": i + 1,
                "percent": round(((i + 1) / total) * 100, 1),
                "status": "running",
                "failed_emails": failed_emails[-10:]
            }

            # Delay between emails
            if i < len(contacts) - 1:
                await asyncio.sleep(request.delay_seconds)

        # Mark complete
        campaign_progress[campaign_id] = {
            "total": total, "sent": sent, "failed": failed,
            "processed": total,
            "percent": 100,
            "status": "completed",
            "failed_emails": failed_emails[:50],
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        logger.info(f"Campaign {campaign_id} complete: {sent} sent, {failed} failed out of {total}")

    # Start background task
    asyncio.create_task(process_campaign())

    return {
        "success": True,
        "campaign_id": campaign_id,
        "total": total,
        "message": f"Campagne gestart voor {total} contacten",
        "template_name": template.get("name", "Onbekend")
    }


@router.get("/campaign-progress/{campaign_id}")
async def get_campaign_progress(campaign_id: str):
    """Get the progress of a running campaign"""
    if campaign_id not in campaign_progress:
        raise HTTPException(status_code=404, detail="Campagne niet gevonden")
    return campaign_progress[campaign_id]


@router.get("/queue/stats")
async def get_queue_stats():
    """Get queue statistics grouped by source and status"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database niet geconfigureerd")

    try:
        pipeline = [
            {"$group": {
                "_id": {"source": "$source", "status": "$status"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.source": 1}}
        ]
        cursor = db['email_queue'].aggregate(pipeline)
        results = await cursor.to_list(length=500)

        stats = {}
        for r in results:
            src = r["_id"].get("source") or "onbekend"
            status = r["_id"].get("status") or "onbekend"
            if src not in stats:
                stats[src] = {"pending": 0, "sent": 0, "failed": 0, "total": 0}
            stats[src][status] = stats[src].get(status, 0) + r["count"]
            stats[src]["total"] += r["count"]

        return {"sources": stats}
    except Exception as e:
        logger.error(f"Error getting queue stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
