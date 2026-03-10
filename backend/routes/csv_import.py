"""
CSV Import & Email Queue API Routes
Upload CSV with email + naam columns, validate, deduplicate, and add to email_queue
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import re
import csv
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email/csv", tags=["csv-import"])

# MongoDB database reference - will be set by main app
db = None

def set_db(database):
    """Set the MongoDB database reference"""
    global db
    db = database
    logger.info("✅ MongoDB set for CSV import route")


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
            elif lower in ('naam', 'name', 'voornaam', 'firstname', 'first_name', 'volledige_naam', 'full_name'):
                col_map['naam'] = col

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
            naam = row.get(col_map.get('naam', ''), '').strip() if 'naam' in col_map else ''

            if not validate_email(email):
                invalid_emails.append(email or f"(rij {total_rows}: leeg)")
                continue

            if email in seen_emails:
                continue  # Skip duplicate within CSV
            seen_emails.add(email)

            valid_entries.append({
                'email': email,
                'naam': naam,
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
