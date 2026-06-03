"""
FASE 2 — Gepersonaliseerde kinderboeken-module.

Flow:
  1. Klant kiest pakket (Solo/Duo/Trio), formaat (Standaard/Premium), thema, kind(eren).
  2. /preview  -> genereert (privacy-veilig) een cartoon-AVATAR per kind uit de foto
     (de échte foto wordt NOOIT opgeslagen), het volledige verhaal (GPT-5.2) en de
     eerste 2 geïllustreerde pagina's (Nano Banana). Gratis, geen e-mail vereist.
  3. /order   -> maakt een echte order + Mollie-betaling, gekoppeld aan het boek.
  4. Na betaling (webhook of /mijn-boek-pagina) worden de overige pagina's gegenereerd
     en wordt een volledige PDF gebouwd + opgeslagen. "Mijn Boek" toont voortgang,
     bladerbare pagina's en de download.

Levermodel: digitale PDF (altijd) + optioneel gedrukt exemplaar (fysieke verzending NL/BE).

AI: GPT-5.2 (tekst) + Gemini Nano Banana (illustraties) via de Emergent Universal Key,
exact zoals story_generator.py — hergebruik van de bestaande, werkende integratie.
"""
import os
import io
import re
import json
import uuid
import base64
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kids-book", tags=["kids-book"])

_db = None
supabase = None

# ── Configuratie (single source of truth, ook voor de frontend) ─────────────
PACKAGES = {
    "solo": {"label": "Solo", "children": 1, "price": 24.95, "desc": "1 kind als held van het verhaal"},
    "duo": {"label": "Duo", "children": 2, "price": 34.95, "desc": "2 kinderen samen op avontuur"},
    "trio": {"label": "Trio", "children": 3, "price": 44.95, "desc": "3 kinderen samen op avontuur"},
}
FORMATS = {
    "standaard": {"label": "Standaard", "pages": 16, "story_pages": 12, "extra": 0.0,
                  "desc": "± 16 pagina's, zachte aquarelstijl, digitale PDF"},
    "premium": {"label": "Premium", "pages": 24, "story_pages": 20, "extra": 10.0,
                "desc": "± 24 pagina's, extra illustraties + luxe cadeau-omslag"},
}
PHYSICAL_PRICE = 19.95  # gedrukt exemplaar incl. verzending NL/BE
THEMES = [
    {"key": "ruimte", "label": "Ruimte-avontuur", "emoji": "🚀"},
    {"key": "onderzee", "label": "Onderzeese wereld", "emoji": "🐠"},
    {"key": "sprookjesbos", "label": "Sprookjesbos", "emoji": "🧚"},
    {"key": "dierenredder", "label": "Dappere Dierenredder", "emoji": "🦁"},
    {"key": "dokter", "label": "Kleine Dokter", "emoji": "🩺"},
    {"key": "bouwmeester", "label": "Kleine Bouwmeester", "emoji": "🏗️"},
    {"key": "piraten", "label": "Piraten-schateiland", "emoji": "🏴‍☠️"},
    {"key": "droomwereld", "label": "Magische Droomwereld", "emoji": "✨"},
    {"key": "eigen", "label": "Eigen idee", "emoji": "🌟", "custom": True},
]
THEME_LABELS = {t["key"]: t["label"] for t in THEMES}

PREVIEW_PAGES = 2
PREVIEW_DAILY_LIMIT = 3
TEXT_MODEL = "gpt-5.2"
IMAGE_MODEL = "gemini-3.1-flash-image-preview"
MAX_PHOTO_CHARS = 5_000_000  # ~3.5MB foto na base64
PUBLIC_BUCKET = "product-images"
PRIVATE_BUCKET = "digital-products"
IMG_PREFIX = "kids-books"
SIGNED_URL_LIFETIME = 600  # 10 min


def set_database(database):
    global _db
    _db = database


def set_supabase_client(client):
    global supabase
    supabase = client


# ── Helpers ─────────────────────────────────────────────────────────────────
def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _strip_b64(data: Optional[str]) -> Optional[str]:
    if not data:
        return None
    if "," in data and data.strip().startswith("data:"):
        data = data.split(",", 1)[1]
    return data.strip()


def _calc_price(package: str, fmt: str, physical: bool) -> float:
    base = PACKAGES.get(package, PACKAGES["solo"])["price"]
    extra = FORMATS.get(fmt, FORMATS["standaard"])["extra"]
    return round(base + extra + (PHYSICAL_PRICE if physical else 0.0), 2)


def _theme_text(theme: str, custom: Optional[str]) -> str:
    if theme == "eigen":
        return (custom or "").strip() or "Een magisch avontuur"
    return THEME_LABELS.get(theme, theme)


def _downscale_to_bytes(raw: bytes, max_px: int = 1024, quality: int = 82) -> bytes:
    """Verklein/normaliseer een afbeelding naar JPEG om opslag + PDF klein te houden."""
    from PIL import Image
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    if max(w, h) > max_px:
        if w >= h:
            im = im.resize((max_px, int(h * max_px / w)), Image.LANCZOS)
        else:
            im = im.resize((int(w * max_px / h), max_px), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality, optimize=True)
    return buf.getvalue()


# ── AI-generatie ──────────────────────────────────────────────────────────--
async def _invoke_image(text: str, file_contents: list, api_key: str, tag: str = "img", attempts: int = 2) -> Optional[bytes]:
    """Roep Nano Banana aan en geef de ruwe afbeeldingsbytes terug (met retry).

    Retryt NIET bij een budget-fout (dat is geen transiënte fout)."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    last = None
    for attempt in range(1, attempts + 1):
        try:
            chat = (
                LlmChat(api_key=api_key, session_id=f"kb-{tag}-{uuid.uuid4().hex[:8]}",
                        system_message="Je bent een illustrator van kinderboeken.")
                .with_model("gemini", IMAGE_MODEL).with_params(modalities=["image", "text"])
            )
            msg = UserMessage(text=text, file_contents=file_contents) if file_contents else UserMessage(text=text)
            _, images = await chat.send_message_multimodal_response(msg)
            if images:
                return base64.b64decode(images[0]["data"])
            last = "geen afbeelding ontvangen"
        except Exception as exc:
            last = str(exc)
            if "budget" in last.lower():
                logger.error(f"[kids-book] LLM-budget op ({tag}): {last}")
                break
            logger.warning(f"[kids-book] {tag} poging {attempt}/{attempts} mislukt: {exc}")
            await asyncio.sleep(1.0)
    logger.warning(f"[kids-book] {tag} definitief mislukt: {last}")
    return None


async def _gen_avatar(child: dict, api_key: str) -> Optional[str]:
    """Genereer een privacy-veilige cartoon-avatar van het kind (data-URL JPEG).

    De échte foto wordt alleen in-memory als referentie gebruikt; we slaan
    uitsluitend de gestileerde tekening op.
    """
    from emergentintegrations.llm.chat import ImageContent
    name = (child.get("name") or "het kind").strip()
    age = (child.get("age") or "").strip()
    gender = (child.get("gender") or "").strip()
    photo = _strip_b64(child.get("photo_base64"))
    desc = f"a {age}-year-old " if age else "a young "
    desc += {"jongen": "boy", "meisje": "girl"}.get(gender, "child")
    prompt = (
        f"Create a warm, friendly children's-book cartoon avatar (soft watercolor / pastel style) "
        f"of {desc} named {name}. Head and shoulders, gentle happy smile, simple neutral background. "
        f"NOT a photo — a sweet hand-illustrated storybook character. No text in the image."
    )
    refs = []
    if photo:
        prompt += " Base the character's look on the reference photo (hair, skin tone, vibe)."
        refs = [ImageContent(photo)]
    raw = await _invoke_image(prompt, refs, api_key, tag="av")
    if raw:
        try:
            small = _downscale_to_bytes(raw, max_px=640, quality=82)
            return "data:image/jpeg;base64," + base64.b64encode(small).decode()
        except Exception as exc:
            logger.warning(f"[kids-book] avatar-downscale mislukt voor {name}: {exc}")
    return None


async def _gen_book_text(spec: dict, api_key: str) -> dict:
    """Genereer titel + alle pagina's (tekst + scenebeschrijving) via GPT-5.2."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    children = spec["children"]
    names = [c["name"].strip() for c in children if c.get("name")]
    main = names[0] if names else "het kind"
    others = ", ".join(names[1:]) if len(names) > 1 else ""
    theme = spec["theme_label"]
    n_pages = FORMATS[spec["format"]]["story_pages"]
    ages = ", ".join([f"{c['name']} ({c.get('age','?')})" for c in children if c.get("name")])

    system_message = (
        "Je bent een liefdevolle Nederlandse kinderboekenschrijver. Je schrijft warme, "
        "leeftijdsgeschikte, ritmische verhalen waarin het kind de held is. Toon: vrolijk, "
        "geruststellend, fantasierijk. Antwoord UITSLUITEND met geldige JSON, geen markdown."
    )
    prompt = (
        f"Schrijf een gepersonaliseerd kinderverhaal in het Nederlands.\n"
        f"Hoofdpersoon: {main}{f' — samen met {others}' if others else ''}\n"
        f"Kinderen + leeftijd: {ages}\n"
        f"Thema: {theme}\n"
        f"Het verhaal heeft precies {n_pages} pagina's. Elke pagina heeft 2-4 korte, "
        f"voorleesbare zinnen ({main} staat centraal). Bouw een duidelijk begin, midden en "
        f"een warm, vrolijk einde op. Voor elke pagina geef je ook een korte Engelse "
        f"'scene'-beschrijving voor de illustrator (wat is er te zien, geen tekst in beeld).\n\n"
        "Lever exact dit JSON-object:\n"
        '{ "title": "pakkende verhaaltitel met de naam erin", '
        '"pages": [ { "text": "Nederlandse paginatekst", "scene": "English scene description" } ] }'
    )
    chat = (
        LlmChat(api_key=api_key, session_id=f"kb-txt-{uuid.uuid4().hex[:8]}",
                system_message=system_message).with_model("openai", TEXT_MODEL)
    )
    resp = await chat.send_message(UserMessage(text=prompt))
    text = (resp or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text).rsplit("```", 1)[0]
    try:
        data = json.loads(text)
        pages = data.get("pages") or []
        clean = []
        for p in pages[:n_pages]:
            clean.append({"text": (p.get("text") or "").strip(),
                          "scene": (p.get("scene") or "").strip(),
                          "image_url": None})
        if not clean:
            raise ValueError("geen pagina's")
        return {"title": (data.get("title") or f"Het avontuur van {main}").strip(), "pages": clean}
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"[kids-book] kon verhaal-JSON niet parsen: {e}")
        # Fallback: 1 pagina met de ruwe tekst
        return {"title": f"Het avontuur van {main}",
                "pages": [{"text": text[:600], "scene": f"{main} on a {theme} adventure", "image_url": None}]}


async def _gen_page_image_bytes(scene: str, theme: str, avatars: List[str], api_key: str) -> Optional[bytes]:
    """Genereer 1 pagina-illustratie (consistent personage via avatar-referentie)."""
    from emergentintegrations.llm.chat import ImageContent
    prompt = (
        f"Soft watercolor / pastel children's book illustration. Scene: {scene}. "
        f"Theme: {theme}. Keep the child character(s) visually consistent with the provided "
        f"reference avatar(s) — same hair, face and vibe. Warm, cohesive storybook style, "
        f"full color. No text, no letters in the image."
    )
    refs = [ImageContent(_strip_b64(a)) for a in avatars if a]
    raw = await _invoke_image(prompt, refs, api_key, tag="img")
    if raw:
        try:
            return _downscale_to_bytes(raw, max_px=1024, quality=84)
        except Exception as exc:
            logger.warning(f"[kids-book] pagina-downscale mislukt: {exc}")
    return None


# ── Storage ─────────────────────────────────────────────────────────────────
def _upload_public_image(book_id: str, idx: int, data: bytes) -> Optional[str]:
    if supabase is None:
        return None
    path = f"{IMG_PREFIX}/{book_id}/page-{idx}.jpg"
    try:
        supabase.storage.from_(PUBLIC_BUCKET).upload(
            path, data, {"content-type": "image/jpeg", "upsert": "true"}
        )
    except Exception as exc:
        # upsert kan falen als al bestaat -> probeer update
        logger.warning(f"[kids-book] upload page-{idx} waarschuwing: {exc}")
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    return f"{base}/storage/v1/object/public/{PUBLIC_BUCKET}/{path}"


def _fetch_image_bytes(url: str) -> Optional[bytes]:
    import requests
    for _ in range(2):
        try:
            r = requests.get(url, timeout=20)
            if r.status_code == 200 and r.content:
                return r.content
        except Exception:
            pass
    return None


def _build_pdf(book: dict) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
    from reportlab.lib import colors

    W, H = A4
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    title = book.get("title", "Mijn boek")
    names = ", ".join([ch.get("name", "") for ch in book.get("children", []) if ch.get("name")])
    pages = book.get("pages", [])

    def _draw_image_full(url, x, y, w, h):
        if not url:
            return
        data = _fetch_image_bytes(url)
        if not data:
            return
        try:
            img = ImageReader(io.BytesIO(data))
            iw, ih = img.getSize()
            ratio = min(w / iw, h / ih)
            dw, dh = iw * ratio, ih * ratio
            c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, mask="auto")
        except Exception:
            pass

    # Cover
    c.setFillColor(colors.HexColor("#FFF8F0"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    if pages and pages[0].get("image_url"):
        _draw_image_full(pages[0]["image_url"], 15 * mm, H - 150 * mm, W - 30 * mm, 130 * mm)
    c.setFillColor(colors.HexColor("#8B5E3C"))
    c.setFont("Helvetica-Bold", 26)
    for i, line in enumerate(_wrap(title, 22)):
        c.drawCentredString(W / 2, 90 * mm - i * 11 * mm, line)
    c.setFont("Helvetica-Oblique", 14)
    c.setFillColor(colors.HexColor("#A87C5A"))
    if names:
        c.drawCentredString(W / 2, 60 * mm, f"Een persoonlijk verhaal voor {names}")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#B0A89F"))
    c.drawCentredString(W / 2, 18 * mm, "Droomvriendjes · droomvriendjes.com")
    c.showPage()

    # Story pages
    for p in pages:
        c.setFillColor(colors.HexColor("#FFFDFB"))
        c.rect(0, 0, W, H, fill=1, stroke=0)
        if p.get("image_url"):
            _draw_image_full(p["image_url"], 12 * mm, H / 2 - 6 * mm, W - 24 * mm, H / 2 - 18 * mm)
        c.setFillColor(colors.HexColor("#4A4036"))
        c.setFont("Helvetica", 15)
        text = p.get("text", "")
        lines = []
        for para in text.split("\n"):
            lines.extend(_wrap(para, 52))
        y = H / 2 - 18 * mm
        for line in lines[:10]:
            c.drawCentredString(W / 2, y, line)
            y -= 8 * mm
        c.showPage()

    # End page
    c.setFillColor(colors.HexColor("#FFF8F0"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#8B5E3C"))
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(W / 2, H / 2 + 10 * mm, "Het einde")
    c.setFont("Helvetica", 13)
    c.setFillColor(colors.HexColor("#A87C5A"))
    c.drawCentredString(W / 2, H / 2 - 6 * mm, "Welterusten en droom maar lekker verder.")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#B0A89F"))
    c.drawCentredString(W / 2, 18 * mm, "Met liefde gemaakt door Droomvriendjes")
    c.showPage()
    c.save()
    return buf.getvalue()


def _wrap(text: str, width: int) -> List[str]:
    import textwrap
    return textwrap.wrap(text, width) or [""]


def _upload_pdf(book_id: str, data: bytes) -> Optional[str]:
    if supabase is None:
        return None
    path = f"{IMG_PREFIX}/{book_id}/{book_id}.pdf"
    try:
        supabase.storage.from_(PRIVATE_BUCKET).upload(
            path, data, {"content-type": "application/pdf", "upsert": "true"}
        )
        return path
    except Exception as exc:
        logger.error(f"[kids-book] PDF upload faalde: {exc}")
        return None


# ── Volledige generatie (achtergrondtaak) ────────────────────────────────────
async def _run_full_generation(book_id: str):
    book = await _db.kids_books.find_one({"_id": book_id})
    if not book or book.get("status") == "ready":
        return
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    pages = book.get("pages", [])
    avatars = book.get("avatars", [])
    theme = book.get("theme_label", "")
    done = sum(1 for p in pages if p.get("image_url"))
    await _db.kids_books.update_one(
        {"_id": book_id}, {"$set": {"status": "generating", "pages_done": done, "updated_at": _now_iso()}}
    )
    try:
        for idx, page in enumerate(pages):
            if page.get("image_url"):
                continue
            img = await _gen_page_image_bytes(page.get("scene", ""), theme, avatars, api_key)
            url = _upload_public_image(book_id, idx, img) if img else None
            pages[idx]["image_url"] = url
            await _db.kids_books.update_one(
                {"_id": book_id},
                {"$set": {f"pages.{idx}.image_url": url,
                          "pages_done": sum(1 for p in pages if p.get("image_url")),
                          "updated_at": _now_iso()}},
            )
        # Build + upload PDF
        book["pages"] = pages
        pdf_bytes = _build_pdf(book)
        pdf_path = _upload_pdf(book_id, pdf_bytes)
        await _db.kids_books.update_one(
            {"_id": book_id},
            {"$set": {"pdf_path": pdf_path, "status": "ready", "updated_at": _now_iso()}},
        )
        logger.info(f"[kids-book] boek {book_id} klaar ({len(pages)} pagina's, pdf={bool(pdf_path)})")
    except Exception as exc:
        logger.exception(f"[kids-book] volledige generatie faalde voor {book_id}")
        await _db.kids_books.update_one(
            {"_id": book_id}, {"$set": {"status": "error", "error": str(exc), "updated_at": _now_iso()}}
        )


async def _verify_book_paid(book: dict) -> bool:
    """Controleer of de bij het boek horende betaling is voldaan (DB of live Mollie)."""
    order_id = book.get("order_id")
    if order_id and supabase is not None:
        try:
            r = supabase.table("orders").select("status").eq("id", order_id).limit(1).execute()
            if r.data and r.data[0].get("status") == "paid":
                return True
        except Exception:
            pass
    pid = book.get("mollie_payment_id")
    if pid:
        try:
            from routes.orders_supabase import get_mollie_client
            mp = get_mollie_client().payments.get(pid)
            return getattr(mp, "status", None) == "paid"
        except Exception as exc:
            logger.warning(f"[kids-book] Mollie status check faalde: {exc}")
    return False


async def maybe_start_book_generation(order_id: str):
    """Aangeroepen vanuit de Mollie-webhook: start boekgeneratie zodra betaald."""
    if _db is None:
        return
    book = await _db.kids_books.find_one({"order_id": order_id})
    if not book:
        return
    if book.get("status") in ("generating", "ready"):
        return
    await _db.kids_books.update_one({"_id": book["_id"]}, {"$set": {"status": "paid", "updated_at": _now_iso()}})
    asyncio.create_task(_run_full_generation(book["_id"]))
    logger.info(f"[kids-book] generatie gestart via webhook voor boek {book['_id']}")


# ── Pydantic modellen ─────────────────────────────────────────────────────--
class BookChild(BaseModel):
    name: str
    age: Optional[str] = None
    gender: Optional[str] = None
    photo_base64: Optional[str] = None


class BookPreviewRequest(BaseModel):
    package: str
    format: str
    theme: str
    custom_theme: Optional[str] = None
    physical: Optional[bool] = False
    children: List[BookChild]


class BookOrderRequest(BaseModel):
    book_id: str
    physical: Optional[bool] = False
    customer_email: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    zipcode: Optional[str] = None
    country: Optional[str] = "NL"


# ── Endpoints ─────────────────────────────────────────────────────────────--
@router.get("/config")
async def get_config():
    return {
        "packages": PACKAGES,
        "formats": FORMATS,
        "physical_price": PHYSICAL_PRICE,
        "themes": THEMES,
        "preview_pages": PREVIEW_PAGES,
    }


@router.get("/quota")
async def quota(request: Request):
    ip = _client_ip(request)
    doc = await _db.kids_book_usage.find_one({"_id": f"{ip}:{_today()}"})
    used = doc.get("count", 0) if doc else 0
    return {"used": used, "limit": PREVIEW_DAILY_LIMIT, "remaining": max(0, PREVIEW_DAILY_LIMIT - used)}


@router.post("/preview")
async def preview(payload: BookPreviewRequest, request: Request):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI is niet geconfigureerd.")
    if payload.package not in PACKAGES:
        raise HTTPException(status_code=400, detail="Onbekend pakket.")
    if payload.format not in FORMATS:
        raise HTTPException(status_code=400, detail="Onbekend formaat.")
    expected = PACKAGES[payload.package]["children"]
    children = [c for c in payload.children if (c.name or "").strip()]
    if len(children) < 1:
        raise HTTPException(status_code=400, detail="Vul minstens de naam van je kind in.")
    if len(children) < expected:
        raise HTTPException(
            status_code=400,
            detail=f"Het {PACKAGES[payload.package]['label']}-pakket is voor {expected} "
                   f"kind{'eren' if expected > 1 else ''}. Vul {expected} namen in.",
        )
    children = children[:expected]
    for c in children:
        if c.photo_base64 and len(c.photo_base64) > MAX_PHOTO_CHARS:
            raise HTTPException(status_code=413, detail="Een foto is te groot (max 3,5 MB).")

    ip = _client_ip(request)
    udoc = await _db.kids_book_usage.find_one({"_id": f"{ip}:{_today()}"})
    used = udoc.get("count", 0) if udoc else 0
    if used >= PREVIEW_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt vandaag je {PREVIEW_DAILY_LIMIT} gratis previews gebruikt. Probeer het morgen opnieuw.",
        )

    theme_label = _theme_text(payload.theme, payload.custom_theme)
    child_dicts = [{"name": c.name.strip(), "age": (c.age or "").strip(),
                    "gender": (c.gender or "").strip(), "photo_base64": c.photo_base64} for c in children]

    spec = {
        "package": payload.package,
        "format": payload.format,
        "theme": payload.theme,
        "theme_label": theme_label,
        "children": child_dicts,
    }

    # 1) Avatars (parallel) — privacy-veilig, foto wordt niet bewaard
    avatars = await asyncio.gather(*[_gen_avatar(c, api_key) for c in child_dicts])
    avatars = [a for a in avatars if a]

    # 2) Volledige verhaaltekst
    try:
        story = await _gen_book_text(spec, api_key)
    except Exception as exc:
        logger.exception("[kids-book] verhaalgeneratie mislukt")
        raise HTTPException(status_code=502, detail=f"Het verhaal kon niet worden gegenereerd: {exc}")

    pages = story["pages"]
    book_id = str(uuid.uuid4())

    # 3) Eerste PREVIEW_PAGES illustraties (parallel)
    preview_imgs = await asyncio.gather(
        *[_gen_page_image_bytes(pages[i].get("scene", ""), theme_label, avatars, api_key)
          for i in range(min(PREVIEW_PAGES, len(pages)))]
    )
    for i, img in enumerate(preview_imgs):
        url = _upload_public_image(book_id, i, img) if img else None
        pages[i]["image_url"] = url

    price = _calc_price(payload.package, payload.format, bool(payload.physical))

    doc = {
        "_id": book_id,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "package": payload.package,
        "format": payload.format,
        "physical": bool(payload.physical),
        "theme": payload.theme,
        "theme_label": theme_label,
        # Bewaar GEEN foto's — alleen naam/leeftijd/geslacht + cartoon-avatars
        "children": [{"name": c["name"], "age": c["age"], "gender": c["gender"]} for c in child_dicts],
        "avatars": avatars,
        "title": story["title"],
        "pages": pages,
        "total_pages": len(pages),
        "price": price,
        "status": "draft",
        "pages_done": sum(1 for p in pages if p.get("image_url")),
        "order_id": None,
        "mollie_payment_id": None,
        "pdf_path": None,
    }
    await _db.kids_books.insert_one(doc)
    await _db.kids_book_usage.update_one(
        {"_id": f"{ip}:{_today()}"},
        {"$inc": {"count": 1}, "$set": {"date": _today(), "ip": ip, "updated_at": _now_iso()}},
        upsert=True,
    )

    return {
        "book_id": book_id,
        "title": story["title"],
        "theme_label": theme_label,
        "total_pages": len(pages),
        "price": price,
        "preview_pages": [
            {"text": pages[i]["text"], "image": pages[i].get("image_url")}
            for i in range(min(PREVIEW_PAGES, len(pages)))
        ],
        "remaining": max(0, PREVIEW_DAILY_LIMIT - (used + 1)),
    }


@router.post("/order")
async def create_book_order(payload: BookOrderRequest):
    book = await _db.kids_books.find_one({"_id": payload.book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Boek niet gevonden. Maak eerst een preview aan.")
    if not (payload.customer_email or "").strip():
        raise HTTPException(status_code=400, detail="E-mailadres is verplicht.")
    physical = bool(payload.physical)
    if physical and not ((payload.address or "").strip() and (payload.zipcode or "").strip() and (payload.city or "").strip()):
        raise HTTPException(status_code=400, detail="Vul een volledig verzendadres in voor het gedrukte exemplaar.")

    price = _calc_price(book["package"], book["format"], physical)
    order_id = str(uuid.uuid4())
    order_number = f"DV-{datetime.now().strftime('%Y%m%d')}-{order_id[:8].upper()}"
    fmt_label = FORMATS[book["format"]]["label"]
    pkg_label = PACKAGES[book["package"]]["label"]
    product_name = f"Gepersonaliseerd kinderboek — {pkg_label} / {fmt_label}" + (" + gedrukt" if physical else " (digitaal)")

    order_data = {
        "id": order_id,
        "order_number": order_number,
        "customer_email": payload.customer_email.strip(),
        "customer_name": (payload.customer_name or "").strip() or payload.customer_email.split("@")[0],
        "customer_phone": (payload.customer_phone or "").strip(),
        "shipping_address": (payload.address or "").strip() if physical else "",
        "shipping_city": (payload.city or "").strip() if physical else "",
        "shipping_zipcode": (payload.zipcode or "").strip() if physical else "",
        "shipping_country": (payload.country or "NL").strip().upper() if physical else "",
        "customer_notes": f"Kinderboek {book['_id']} — {'gedrukt + digitaal' if physical else 'digitaal'}",
        "subtotal": price,
        "discount_amount": 0,
        "total_amount": price,
        "currency": "EUR",
        "status": "pending",
        "created_at": _now_iso(),
    }

    if supabase is not None:
        try:
            supabase.table("orders").insert(order_data).execute()
            supabase.table("order_items").insert({
                "id": str(uuid.uuid4()), "order_id": order_id,
                "product_name": product_name, "product_sku": f"kidsbook-{book['package']}-{book['format']}",
                "quantity": 1, "unit_price": price, "total_price": price,
            }).execute()
        except Exception as exc:
            logger.error(f"[kids-book] order-insert faalde: {exc}")
            raise HTTPException(status_code=500, detail="Bestelling kon niet worden aangemaakt.")

    # Mollie-betaling
    try:
        from routes.orders_supabase import get_mollie_client, get_frontend_url, get_api_url, mollie_create_payment_with_retry
        frontend_url = get_frontend_url()
        api_url = get_api_url()
        payment_data = {
            "amount": {"currency": "EUR", "value": f"{price:.2f}"},
            "description": f"Droomvriendjes Kinderboek #{order_id[:8].upper()}",
            "redirectUrl": f"{frontend_url}/mijn-boek/{book['_id']}",
            "cancelUrl": f"{frontend_url}/kinderboek",
            "webhookUrl": f"{api_url}/api/webhook/mollie",
            "metadata": {"order_id": order_id, "book_id": book["_id"], "customer_email": payload.customer_email.strip()},
        }
        mollie_payment = mollie_create_payment_with_retry(get_mollie_client(), payment_data)
    except Exception as exc:
        logger.error(f"[kids-book] Mollie-betaling faalde: {exc}")
        raise HTTPException(status_code=502, detail="Betaling kon niet worden gestart. Probeer het opnieuw.")

    if supabase is not None:
        try:
            supabase.table("orders").update(
                {"mollie_payment_id": mollie_payment.id, "payment_method": "ideal"}
            ).eq("id", order_id).execute()
        except Exception:
            pass

    await _db.kids_books.update_one(
        {"_id": book["_id"]},
        {"$set": {"order_id": order_id, "mollie_payment_id": mollie_payment.id,
                  "physical": physical, "price": price, "updated_at": _now_iso()}},
    )

    return {"checkout_url": mollie_payment.checkout_url, "order_id": order_id, "book_id": book["_id"]}


def _book_public_view(book: dict, reveal_all: bool) -> dict:
    pages = book.get("pages", [])
    limit = len(pages) if reveal_all else min(PREVIEW_PAGES, len(pages))
    return {
        "book_id": book["_id"],
        "title": book.get("title"),
        "theme_label": book.get("theme_label"),
        "status": book.get("status"),
        "total_pages": book.get("total_pages", len(pages)),
        "pages_done": book.get("pages_done", 0),
        "price": book.get("price"),
        "package": book.get("package"),
        "format": book.get("format"),
        "physical": book.get("physical", False),
        "paid": book.get("status") in ("paid", "generating", "ready"),
        "pdf_ready": bool(book.get("pdf_path")) and book.get("status") == "ready",
        "pages": [{"text": p.get("text"), "image": p.get("image_url")} for p in pages[:limit]],
    }


@router.get("/{book_id}")
async def get_book(book_id: str):
    book = await _db.kids_books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Boek niet gevonden")
    reveal_all = book.get("status") in ("paid", "generating", "ready")
    return _book_public_view(book, reveal_all)


@router.post("/{book_id}/start-generation")
async def start_generation(book_id: str):
    book = await _db.kids_books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Boek niet gevonden")
    if book.get("status") in ("generating", "ready"):
        return _book_public_view(book, True)
    if not await _verify_book_paid(book):
        raise HTTPException(status_code=402, detail="De betaling is nog niet bevestigd. Even geduld.")
    await _db.kids_books.update_one({"_id": book_id}, {"$set": {"status": "paid", "updated_at": _now_iso()}})
    asyncio.create_task(_run_full_generation(book_id))
    book = await _db.kids_books.find_one({"_id": book_id})
    return _book_public_view(book, True)


@router.get("/{book_id}/download")
async def download_book(book_id: str):
    book = await _db.kids_books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Boek niet gevonden")
    if book.get("status") != "ready" or not book.get("pdf_path"):
        raise HTTPException(status_code=409, detail="Je boek is nog niet klaar.")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Opslag niet beschikbaar")
    try:
        signed = supabase.storage.from_(PRIVATE_BUCKET).create_signed_url(book["pdf_path"], SIGNED_URL_LIFETIME)
        url = signed.get("signedURL") or signed.get("signed_url") or signed.get("signedUrl")
        if url and url.startswith("/"):
            url = f"{os.environ.get('SUPABASE_URL', '').rstrip('/')}{url}"
        if not url:
            raise RuntimeError(f"geen signed URL: {signed}")
    except Exception as exc:
        logger.error(f"[kids-book] download-url faalde: {exc}")
        raise HTTPException(status_code=500, detail="Download-link kon niet worden gemaakt.")
    return {"url": url, "filename": f"{(book.get('title') or 'kinderboek').replace(' ', '_')}.pdf"}
