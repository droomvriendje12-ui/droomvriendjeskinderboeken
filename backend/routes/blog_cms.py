"""
Blog CMS — admin-managed blog posts stored in MongoDB (`cms_blogs`).

Features:
- CRUD (create / read / update / delete) with draft/published status
- Featured-image upload to Supabase public storage (product-images/blog/cms)
- AI writer (GPT-5.2) that produces SEO/GEO/conversion-optimised content
  (SEO title, meta description, H2 structure, FAQ section, internal links,
  related products)
- Public endpoints feeding the /blogs listing and /blog/:slug pages

Existing hardcoded premium blogs stay untouched; CMS posts are merged in.
"""
import os
import io
import re
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/blog-cms", tags=["blog-cms"])
_security = HTTPBearer(auto_error=False)

_db = None
_admin_verifier = None

PUBLIC_BUCKET = "product-images"
IMG_FOLDER = "blog/cms"
IMG_BASE = None  # resolved lazily from SUPABASE_URL


def set_database(database):
    global _db
    _db = database


def set_admin_verifier(verifier):
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    admin = _admin_verifier(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return admin


# ---------------------------------------------------------------- models
class FaqItem(BaseModel):
    q: str
    a: str


class RelatedProduct(BaseModel):
    id: int
    name: str
    emoji: Optional[str] = "🧸"


class BlogPost(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    slug: Optional[str] = None
    seo_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    excerpt: Optional[str] = ""
    category: Optional[str] = "Slaaptips"
    category_color: Optional[str] = "bg-amber-100 text-amber-900"
    tags: List[str] = []
    hero_image: Optional[str] = ""
    content: str = ""                 # HTML body
    faqs: List[FaqItem] = []
    related_products: List[RelatedProduct] = []
    status: str = "draft"             # draft | published
    author: Optional[str] = "Team Droomvriendjes"
    read_minutes: Optional[int] = 6


class AiGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    keywords: List[str] = []          # 3-5 SEO/GEO keyword cluster
    category: Optional[str] = "Slaaptips"


def _slugify(text: str) -> str:
    s = (text or "").lower().strip()
    s = re.sub(r"[àáâ]", "a", s)
    s = re.sub(r"[éèê]", "e", s)
    s = re.sub(r"[ïî]", "i", s)
    s = re.sub(r"[öô]", "o", s)
    s = re.sub(r"[üû]", "u", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80] or uuid.uuid4().hex[:8]


async def _unique_slug(base: str, exclude_id: str = None) -> str:
    slug = base
    i = 2
    while True:
        q = {"slug": slug}
        if exclude_id:
            q["id"] = {"$ne": exclude_id}
        if not await _db.cms_blogs.find_one(q):
            return slug
        slug = f"{base}-{i}"
        i += 1


def _to_public(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------- admin CRUD
@router.get("/posts")
async def list_posts(status: Optional[str] = None, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    q = {}
    if status in ("draft", "published"):
        q["status"] = status
    docs = await _db.cms_blogs.find(q, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    return {"posts": docs, "total": len(docs)}


@router.get("/posts/{post_id}")
async def get_post(post_id: str, _admin=Depends(_require_admin)):
    doc = await _db.cms_blogs.find_one({"id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog niet gevonden")
    return doc


@router.post("/posts")
async def create_post(payload: BlogPost, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    base = _slugify(payload.slug or payload.title)
    slug = await _unique_slug(base)
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "slug": slug,
        "created_at": now,
        "updated_at": now,
    })
    await _db.cms_blogs.insert_one(doc)
    return _to_public(doc)


@router.put("/posts/{post_id}")
async def update_post(post_id: str, payload: BlogPost, _admin=Depends(_require_admin)):
    existing = await _db.cms_blogs.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog niet gevonden")
    base = _slugify(payload.slug or payload.title)
    slug = await _unique_slug(base, exclude_id=post_id)
    update = payload.model_dump()
    update["slug"] = slug
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await _db.cms_blogs.update_one({"id": post_id}, {"$set": update})
    doc = await _db.cms_blogs.find_one({"id": post_id}, {"_id": 0})
    return doc


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, _admin=Depends(_require_admin)):
    res = await _db.cms_blogs.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog niet gevonden")
    return {"status": "deleted"}


# ---------------------------------------------------------------- image upload
def _supabase():
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase niet geconfigureerd")
    return create_client(url, key)


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), _admin=Depends(_require_admin)):
    from PIL import Image
    raw = await file.read()
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Afbeelding te groot (max 12 MB).")
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Ongeldig afbeeldingsbestand.")
    w, h = im.size
    if w > 1280:
        im = im.resize((1280, int(h * 1280 / w)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82, optimize=True)
    data = buf.getvalue()

    path = f"{IMG_FOLDER}/{uuid.uuid4().hex}.jpg"
    sb = _supabase()
    try:
        sb.storage.from_(PUBLIC_BUCKET).upload(path, data, {"content-type": "image/jpeg", "upsert": "true"})
    except Exception as exc:
        logger.exception("Blog image upload faalde")
        raise HTTPException(status_code=502, detail=f"Upload mislukt: {exc}")
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    url = f"{base}/storage/v1/object/public/{PUBLIC_BUCKET}/{path}"
    return {"url": url}


# ---------------------------------------------------------------- AI writer
_AI_BRAND_CONTEXT = (
    "Droomvriendjes verkoopt slimme slaapknuffels met zacht nachtlampje, sterrenprojector en "
    "white noise voor kinderen van 0-6 jaar (o.a. Slimme Leeuw, Slaperig Schaapje, Bruine Beertje, "
    "Pinguïn). USP's: 14 dagen retour, gratis verzending, 2 jaar garantie, 10.000+ tevreden ouders. "
    "Productcategorieën: knuffelbeer/slaapknuffel/troostknuffel, nachtlampje/white noise/slaaptrainer, "
    "kraamcadeau/baby cadeau."
)


@router.post("/ai-generate")
async def ai_generate(payload: AiGenerateRequest, _admin=Depends(_require_admin)):
    """Generate a full SEO/GEO/conversion-optimised blog draft with GPT-5.2."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")
    kw = ", ".join([k for k in payload.keywords if k]) or payload.topic
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        system_message = (
            "Je bent een Nederlandse SEO/GEO-contentstrateeg en copywriter voor Droomvriendjes. "
            + _AI_BRAND_CONTEXT +
            " Je schrijft diepgaande, betrouwbare, emotioneel resonerende blogartikelen die ranken in "
            "Google Search, Google AI Overviews, ChatGPT Search, Gemini, Perplexity en Bing. "
            "Werk met semantische zoekwoordclusters (geen keyword stuffing), speel in op zoekintentie, "
            "vertrouwen, emotie en koopgedrag. Schrijf in vloeiend Nederlands. "
            "Antwoord UITSLUITEND met geldige JSON (geen markdown, geen uitleg)."
        )
        prompt = (
            f"Schrijf een diepgaand, conversiegericht SEO-blogartikel.\n"
            f"Onderwerp: {payload.topic}\n"
            f"Zoekwoordcluster (semantisch verwerken, natuurlijk): {kw}\n"
            f"Categorie: {payload.category}\n\n"
            "Lever exact dit JSON-object:\n"
            "{\n"
            '  "title": "pakkende H1 (max 70 tekens, bevat hoofdzoekwoord)",\n'
            '  "seo_title": "SEO title tag (max 60 tekens)",\n'
            '  "meta_description": "meta description (max 155 tekens, met CTA)",\n'
            '  "excerpt": "korte intro/samenvatting (max 160 tekens)",\n'
            '  "tags": ["5-7 relevante tags"],\n'
            '  "read_minutes": 7,\n'
            '  "content": "HTML body: gebruik <h2> en <h3> kopjes, <p>, <ul>/<li>, <strong>. '
            'Verwerk 2-3 interne links als <a href=\\"/knuffels\\">ankertekst</a> en '
            '<a href=\\"/blogs\\">gerelateerde artikelen</a>. Begin NIET met een <h1> (de titel staat al apart). '
            'Minimaal 700 woorden, met een natuurlijke call-to-action richting de producten.",\n'
            '  "faqs": [{"q": "vraag", "a": "antwoord"} x4],\n'
            '  "related_products": [{"id": 8, "name": "Liggend Schaapje - Nachtlampje", "emoji": "🐑"}]\n'
            "}\n"
            "Gebruik voor related_products realistische product-ids uit: 2,3,4,7,8."
        )
        chat = LlmChat(
            api_key=api_key,
            session_id=f"blogcms-{uuid.uuid4().hex[:8]}",
            system_message=system_message,
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        text = (resp or "").strip()
        # strip code fences if present
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text).rsplit("```", 1)[0]
        data = json.loads(text)
        data.setdefault("category", payload.category)
        return data
    except json.JSONDecodeError:
        logger.error("AI blog JSON parse faalde")
        raise HTTPException(status_code=502, detail="AI gaf ongeldige opmaak terug, probeer opnieuw.")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI blog generatie faalde")
        raise HTTPException(status_code=502, detail=f"AI-generatie mislukt: {exc}")


# ---------------------------------------------------------------- public
@router.get("/public/posts")
async def public_posts():
    if _db is None:
        return {"posts": []}
    docs = await _db.cms_blogs.find(
        {"status": "published"},
        {"_id": 0, "content": 0, "faqs": 0},
    ).sort("created_at", -1).to_list(length=200)
    return {"posts": docs}


@router.get("/public/posts/{slug}")
async def public_post(slug: str):
    if _db is None:
        raise HTTPException(status_code=404, detail="Niet gevonden")
    doc = await _db.cms_blogs.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog niet gevonden")
    return doc


# Hardcoded premium blog slugs (always in sitemap)
_STATIC_BLOG_SLUGS = [
    "waarom-huilt-baby-s-nachts", "verschil-verzwaringsknuffel-nachtlampje",
    "beste-slaapknuffel-2026", "5-tips-betere-nachtrust-kinderen",
    "hoe-helpen-kalmerende-knuffels-bij-stress", "droomvriendjes-mondriaan-samenwerking",
    "baby-knuffel-veilig-slapen-leeftijd", "slaapregressie-bij-kinderen",
    "witte-ruis-white-noise-baby", "avondroutine-kind-7-stappen",
]
_STATIC_PAGES = ["", "knuffels", "pro", "b2b", "blogs", "contact", "over-ons"]


@router.get("/sitemap.xml")
async def sitemap():
    """Dynamic sitemap incl. published CMS blog posts. Submit at
    {domain}/api/blog-cms/sitemap.xml in Google Search Console."""
    from fastapi.responses import Response
    base = "https://droomvriendjes.com"
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = []

    def add(loc, lastmod=now, prio="0.7"):
        urls.append(
            f"  <url><loc>{base}/{loc}</loc><lastmod>{lastmod}</lastmod>"
            f"<changefreq>weekly</changefreq><priority>{prio}</priority></url>"
        )

    for p in _STATIC_PAGES:
        add(p, prio="1.0" if p == "" else "0.8")
    for s in _STATIC_BLOG_SLUGS:
        add(f"blog/{s}", prio="0.7")
    if _db is not None:
        posts = await _db.cms_blogs.find(
            {"status": "published"}, {"slug": 1, "updated_at": 1}
        ).to_list(length=1000)
        for post in posts:
            lm = (post.get("updated_at") or now)[:10]
            add(f"blog/{post['slug']}", lastmod=lm, prio="0.7")

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>"
    )
    return Response(content=xml, media_type="application/xml")
