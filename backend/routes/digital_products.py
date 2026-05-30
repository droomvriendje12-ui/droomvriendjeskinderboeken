"""
Digital Products API Routes - PDF download/upload + entitlement management.

Backend ondersteunt:
- Admin: PDF uploaden naar private Supabase Storage bucket
- Admin: Lijst digitale producten en download statistieken
- Customer: Download een PDF via een one-time download token
  -> backend genereert een korte (5 min) Supabase signed URL en geeft die terug
  -> 24h venster + max 3 downloads enforced in `digital_downloads` tabel
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import logging
import uuid
import secrets
import os
import csv
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/digital-products", tags=["digital-products"])

supabase = None
verify_admin_token = None
BUCKET_NAME = "digital-products"
DOWNLOAD_WINDOW_HOURS = 24
MAX_DOWNLOADS = 3
SIGNED_URL_LIFETIME_SEC = 300  # 5 minutes


def set_supabase_client(client):
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for digital-products route")


def set_admin_verifier(verifier):
    global verify_admin_token
    verify_admin_token = verifier


security = HTTPBearer()


def _admin_check(creds: HTTPAuthorizationCredentials = Depends(security)):
    if verify_admin_token is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    return verify_admin_token(creds)


def _now():
    return datetime.now(timezone.utc)


# ============== ADMIN ENDPOINTS ==============

@router.post("/admin/upload")
async def admin_upload_pdf(
    file: UploadFile = File(...),
    product_id: Optional[str] = Form(None),
    _admin=Depends(_admin_check),
):
    """Upload een PDF naar Supabase private bucket.
    Optioneel koppelen aan een bestaand product."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Alleen PDF bestanden zijn toegestaan")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Bestand is leeg")
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Maximaal 25 MB per PDF")

    safe_name = (file.filename or "document.pdf").replace(" ", "-").replace("/", "_")
    folder = f"products/{product_id}" if product_id else "library"

    # ── Deduplicatie ────────────────────────────────────────────────────────
    # Als er al een bestand in dezelfde folder bestaat dat eindigt op
    # `-{safe_name}`, gebruiken we die hergebruikt — geen tweede upload, geen
    # tweede storage row. De file_size moet ook matchen voor zekerheid.
    existing_path = None
    try:
        listing = supabase.storage.from_(BUCKET_NAME).list(folder) or []
        for item in listing:
            name = item.get("name") or ""
            if not name.lower().endswith(safe_name.lower()):
                continue
            size = (item.get("metadata") or {}).get("size")
            if size and int(size) == len(contents):
                existing_path = f"{folder}/{name}"
                logger.info(f"Dedup hit: {existing_path} (size match)")
                break
    except Exception as dedup_err:
        logger.warning(f"Dedup-list faalde (gaat door met fresh upload): {dedup_err}")

    if existing_path:
        storage_path = existing_path
    else:
        unique = uuid.uuid4().hex[:10]
        storage_path = f"{folder}/{unique}-{safe_name}"
        try:
            supabase.storage.from_(BUCKET_NAME).upload(
                path=storage_path,
                file=contents,
                file_options={
                    "cache-control": "3600",
                    "upsert": "false",
                    "content-type": "application/pdf",
                },
            )
        except Exception as exc:
            logger.exception("PDF upload faalde")
            raise HTTPException(status_code=500, detail=f"Upload naar storage faalde: {exc}")

    # Update product als product_id meegegeven
    product_data = None
    if product_id:
        try:
            update_payload = {
                "product_type": "digital",
                "digital_file_path": storage_path,
                "digital_file_size": len(contents),
            }
            res = supabase.table("products").update(update_payload).eq("id", product_id).execute()
            product_data = res.data[0] if res.data else None
        except Exception as exc:
            logger.warning(f"Kon product {product_id} niet bijwerken: {exc}")

    return {
        "status": "ok",
        "storage_path": storage_path,
        "size": len(contents),
        "filename": file.filename,
        "product_id": product_id,
        "product": product_data,
        "deduplicated": existing_path is not None,
    }


@router.get("/admin/list")
async def admin_list_files(_admin=Depends(_admin_check)):
    """Lijst alle bestanden in de bucket en wat erbij hoort."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")

    files = []
    try:
        # Recursive list: root + 'library' + 'products/*'
        def _list(prefix: str):
            try:
                r = supabase.storage.from_(BUCKET_NAME).list(
                    prefix, {"limit": 200, "offset": 0}
                )
                return r or []
            except Exception:
                return []

        # Top-level entries
        top = _list("")
        for entry in top:
            name = entry.get("name") if isinstance(entry, dict) else None
            if not name:
                continue
            # Is folder -> recurse
            if entry.get("id") is None and entry.get("metadata") is None:
                for sub in _list(name):
                    if sub.get("id") is None and sub.get("metadata") is None:
                        # nested folder (products/<id>/)
                        for leaf in _list(f"{name}/{sub.get('name')}"):
                            files.append({
                                "name": leaf.get("name"),
                                "path": f"{name}/{sub.get('name')}/{leaf.get('name')}",
                                "size": (leaf.get("metadata") or {}).get("size", 0),
                                "updated_at": leaf.get("updated_at"),
                            })
                    else:
                        files.append({
                            "name": sub.get("name"),
                            "path": f"{name}/{sub.get('name')}",
                            "size": (sub.get("metadata") or {}).get("size", 0),
                            "updated_at": sub.get("updated_at"),
                        })
            else:
                files.append({
                    "name": entry.get("name"),
                    "path": entry.get("name"),
                    "size": (entry.get("metadata") or {}).get("size", 0),
                    "updated_at": entry.get("updated_at"),
                })
    except Exception as exc:
        logger.exception("List files faalde")
        raise HTTPException(status_code=500, detail=str(exc))

    # Stats per product
    stats = {}
    try:
        res = supabase.table("digital_downloads").select(
            "product_id, downloads_used, max_downloads, expires_at"
        ).execute()
        for d in res.data or []:
            pid = d.get("product_id")
            if not pid:
                continue
            s = stats.setdefault(pid, {"entitlements": 0, "downloads_used": 0})
            s["entitlements"] += 1
            s["downloads_used"] += d.get("downloads_used") or 0
    except Exception as exc:
        logger.warning(f"Stats ophalen faalde: {exc}")

    return {"files": files, "stats": stats}


@router.delete("/admin/file")
async def admin_delete_file(path: str, _admin=Depends(_admin_check)):
    """Verwijder een PDF uit de bucket."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")
    try:
        supabase.storage.from_(BUCKET_NAME).remove([path])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Verwijderen faalde: {exc}")
    return {"status": "ok", "path": path}


@router.get("/admin/entitlements")
async def admin_list_entitlements(_admin=Depends(_admin_check)):
    """Toon alle download-entitlements (wie heeft wat gedownload)."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")
    res = supabase.table("digital_downloads").select("*").order(
        "created_at", desc=True
    ).limit(200).execute()
    return {"entitlements": res.data or []}


def _fmt_bytes_csv(b) -> str:
    """Human-readable bestandsgrootte voor in de CSV export."""
    try:
        b = int(b or 0)
    except Exception:
        b = 0
    if b <= 0:
        return ""
    if b < 1024:
        return f"{b} B"
    if b < 1024 * 1024:
        return f"{b / 1024:.1f} KB"
    return f"{b / 1024 / 1024:.2f} MB"


@router.get("/admin/export")
async def admin_export_digital(_admin=Depends(_admin_check)):
    """Exporteer een CSV-overzicht van alle digitale producten en hun gekoppelde bestanden.

    Kolommen: Digitaal Product ID, Bestandsnaam, Gekoppelde Productnaam,
    Bestandsgrootte, Aantal Downloads.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")

    # 1) Digitale producten ophalen
    try:
        prods = supabase.table("products").select(
            "id,name,digital_file_path,digital_file_size,product_type"
        ).eq("product_type", "digital").execute()
        products = prods.data or []
    except Exception as exc:
        logger.exception("Export: producten ophalen faalde")
        raise HTTPException(status_code=500, detail=f"Producten ophalen faalde: {exc}")

    # 2) Download-aantallen aggregeren per product
    dl_map = {}
    try:
        dl = supabase.table("digital_downloads").select("product_id,downloads_used").execute()
        for d in dl.data or []:
            pid = str(d.get("product_id"))
            dl_map[pid] = dl_map.get(pid, 0) + int(d.get("downloads_used") or 0)
    except Exception as exc:
        logger.warning(f"Export: download-stats faalden (ga door met 0): {exc}")

    # 3) CSV bouwen (semicolon-delimited voor NL Excel + UTF-8 BOM)
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "Digitaal Product ID",
        "Bestandsnaam",
        "Gekoppelde Productnaam",
        "Bestandsgrootte",
        "Aantal Downloads",
    ])
    for p in sorted(products, key=lambda x: str(x.get("id") or "")):
        pid = str(p.get("id") or "")
        path = p.get("digital_file_path") or ""
        filename = path.split("/")[-1] if path else "—"
        writer.writerow([
            pid,
            filename,
            p.get("name") or "",
            _fmt_bytes_csv(p.get("digital_file_size")),
            dl_map.get(pid, 0),
        ])

    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")
    fname = f"digitale-producten-{_now().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


# ============== CUSTOMER ENDPOINTS ==============

class DownloadResponse(BaseModel):
    url: str
    filename: str
    downloads_remaining: int
    expires_at: str


@router.get("/download/{token}", response_model=DownloadResponse)
async def download_via_token(token: str):
    """Klant download endpoint - genereert tijdelijke signed URL.

    Enforced:
    - Entitlement bestaat
    - expires_at > nu
    - downloads_used < max_downloads
    - Atomically increment downloads_used
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")

    # Lookup entitlement
    res = supabase.table("digital_downloads").select("*").eq(
        "download_token", token
    ).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Download link niet gevonden of verlopen")

    ent = res.data[0]
    expires_at = ent.get("expires_at")
    try:
        if isinstance(expires_at, str):
            exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        else:
            exp_dt = expires_at
    except Exception:
        raise HTTPException(status_code=500, detail="Ongeldige verloopdatum")

    if exp_dt <= _now():
        raise HTTPException(
            status_code=410,
            detail="Deze download link is verlopen. Neem contact op via info@droomvriendjes.com."
        )

    used = int(ent.get("downloads_used") or 0)
    max_dl = int(ent.get("max_downloads") or MAX_DOWNLOADS)
    if used >= max_dl:
        raise HTTPException(
            status_code=403,
            detail=f"Maximaal aantal downloads ({max_dl}) bereikt."
        )

    file_path = ent.get("file_path")
    if not file_path:
        raise HTTPException(status_code=500, detail="Bestand niet gekoppeld aan entitlement")

    # Atomair de counter ophogen via optimistic concurrency (filter op huidige waarde).
    # Als een tweede gelijktijdig verzoek hetzelfde probeert, raakt het 0 rows.
    try:
        upd = supabase.table("digital_downloads").update({
            "downloads_used": used + 1,
            "last_downloaded_at": _now().isoformat(),
        }).eq("id", ent["id"]).eq("downloads_used", used).execute()
        if not upd.data:
            raise HTTPException(
                status_code=409,
                detail="Download bezig - probeer het over een paar seconden opnieuw."
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"Counter increment faalde: {exc}")
        # Bij echte DB fouten geven we de download niet vrij
        raise HTTPException(status_code=500, detail="Server fout bij counter")

    # Generate signed URL (short-lived)
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            file_path, SIGNED_URL_LIFETIME_SEC
        )
        signed_url = (
            signed.get("signedURL")
            or signed.get("signed_url")
            or signed.get("signedUrl")
        )
        if not signed_url:
            raise RuntimeError(f"Geen signed URL ontvangen: {signed}")
        # Maak het een volledig pad als nodig
        if signed_url.startswith("/"):
            base = os.environ.get("SUPABASE_URL", "").rstrip("/")
            signed_url = f"{base}{signed_url}"
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Signed URL genereren faalde")
        # Rollback: counter terugzetten zodat de klant geen download verliest
        try:
            supabase.table("digital_downloads").update({
                "downloads_used": used,
            }).eq("id", ent["id"]).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Download URL fout: {exc}")

    filename = file_path.split("/")[-1]
    return DownloadResponse(
        url=signed_url,
        filename=filename,
        downloads_remaining=max(0, max_dl - used - 1),
        expires_at=exp_dt.isoformat(),
    )


@router.get("/info/{token}")
async def info_via_token(token: str):
    """Info pagina (zonder counter te incrementen) - voor frontend display."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")
    res = supabase.table("digital_downloads").select("*").eq(
        "download_token", token
    ).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Download link niet gevonden")
    ent = res.data[0]
    # Voeg productinfo toe
    product = None
    if ent.get("product_id"):
        try:
            pr = supabase.table("products").select("id,name,images").eq(
                "id", ent["product_id"]
            ).limit(1).execute()
            if pr.data:
                product = pr.data[0]
        except Exception:
            pass

    # Cross-sell: zoek een actieve, ongebruikte BEDANKT-code voor deze order
    crosssell = None
    order_id = ent.get("order_id")
    customer_email = ent.get("customer_email")
    if order_id and customer_email:
        try:
            import hashlib
            suffix = hashlib.sha256(f"{order_id}-{customer_email}".encode()).hexdigest()[:6].upper()
            expected_code = f"BEDANKT{suffix}"
            cs = supabase.table("discount_codes").select(
                "code, discount_value, max_uses, current_uses, expires_at, active"
            ).eq("code", expected_code).limit(1).execute()
            if cs.data:
                row = cs.data[0]
                is_usable = (
                    row.get("active", True)
                    and (row.get("current_uses") or 0) < (row.get("max_uses") or 1)
                )
                if is_usable:
                    crosssell = {
                        "code": row["code"],
                        "discount_percentage": row.get("discount_value") or 10,
                        "expires_at": row.get("expires_at"),
                        "message": "10% korting op je eerste knuffel",
                    }
        except Exception as cs_err:
            logger.warning(f"Cross-sell lookup failed: {cs_err}")

    return {
        "token": token,
        "filename": (ent.get("file_path") or "").split("/")[-1],
        "downloads_used": ent.get("downloads_used") or 0,
        "max_downloads": ent.get("max_downloads") or MAX_DOWNLOADS,
        "expires_at": ent.get("expires_at"),
        "customer_email": ent.get("customer_email"),
        "product": product,
        "crosssell": crosssell,
    }


# ============== HELPER FOR WEBHOOK / ORDER FLOW ==============

def create_entitlements_for_order(order_id: str, items: List[dict], customer_email: str) -> List[dict]:
    """Roep deze functie aan vanuit het Mollie webhook wanneer een order op 'paid' staat.

    Voor elk item dat een digital product is, wordt een download entitlement gemaakt.
    Returns een lijst met aangemaakte tokens (om in de email te zetten).
    """
    if supabase is None:
        logger.warning("Supabase niet geconfigureerd in create_entitlements_for_order")
        return []

    created = []
    expires = _now() + timedelta(hours=DOWNLOAD_WINDOW_HOURS)
    for item in items or []:
        # order_items slaat product ID op in product_sku (alias) of product_id
        product_id = item.get("product_id") or item.get("product_sku") or item.get("id")
        if not product_id:
            continue
        # Check of product digitaal is
        try:
            pres = supabase.table("products").select(
                "id,name,product_type,digital_file_path"
            ).eq("id", str(product_id)).limit(1).execute()
            if not pres.data:
                continue
            product = pres.data[0]
        except Exception as exc:
            logger.warning(f"Product lookup faalde voor entitlement: {exc}")
            continue

        if product.get("product_type") != "digital" or not product.get("digital_file_path"):
            continue

        # Idempotency: bij Mollie webhook retries niet nogmaals een entitlement aanmaken
        try:
            existing = supabase.table("digital_downloads").select(
                "id,download_token,expires_at,max_downloads"
            ).eq("order_id", order_id).eq("product_id", str(product_id)).limit(1).execute()
            if existing.data:
                e = existing.data[0]
                logger.info(f"Entitlement bestond al voor order {order_id} + product {product_id}")
                created.append({
                    "product_name": product.get("name"),
                    "product_id": str(product_id),
                    "token": e.get("download_token"),
                    "expires_at": e.get("expires_at"),
                    "max_downloads": e.get("max_downloads") or MAX_DOWNLOADS,
                })
                continue
        except Exception as exc:
            logger.warning(f"Idempotency check faalde, ga door met aanmaken: {exc}")

        token = secrets.token_urlsafe(32)
        ent_id = str(uuid.uuid4())
        try:
            supabase.table("digital_downloads").insert({
                "id": ent_id,
                "order_id": order_id,
                "customer_email": customer_email,
                "product_id": str(product_id),
                "file_path": product["digital_file_path"],
                "download_token": token,
                "downloads_used": 0,
                "max_downloads": MAX_DOWNLOADS,
                "expires_at": expires.isoformat(),
                "created_at": _now().isoformat(),
            }).execute()
            created.append({
                "product_name": product.get("name"),
                "product_id": str(product_id),
                "token": token,
                "expires_at": expires.isoformat(),
                "max_downloads": MAX_DOWNLOADS,
            })
        except Exception as exc:
            logger.exception(f"Kon entitlement niet aanmaken: {exc}")

    return created
