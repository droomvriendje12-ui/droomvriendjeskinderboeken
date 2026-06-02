"""
Gepersonaliseerde AI-bedtijdverhaal-generator (gratis preview).

- Verhaaltekst: OpenAI GPT-5.2 (via Emergent Universal Key)
- Illustratie: Gemini Nano Banana (gemini-3.1-flash-image-preview), optioneel met de
  geüploade foto als referentie zodat het hoofdpersonage op het kind lijkt.
- Privacy: geüploade kinderfoto's worden NIET opgeslagen; ze worden alleen in-memory
  als referentie gebruikt voor één illustratie.
- Limiet: 2 gratis previews per IP per dag.
"""
import os
import re
import json
import base64
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/story", tags=["story"])

_db = None
DAILY_LIMIT = 2
IMAGE_MODEL = "gemini-3.1-flash-image-preview"
TEXT_MODEL = "gpt-5.2"
MAX_PHOTO_CHARS = 5_000_000  # ~3.5MB foto na base64


def set_database(database):
    global _db
    _db = database


class Character(BaseModel):
    name: str
    photo_base64: Optional[str] = None


class StoryRequest(BaseModel):
    title: Optional[str] = ""
    theme: str
    characters: List[Character]
    age: Optional[str] = None


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def _used_today(ip: str) -> int:
    doc = await _db.story_usage.find_one({"_id": f"{ip}:{_today()}"})
    return doc.get("count", 0) if doc else 0


async def _increment(ip: str):
    await _db.story_usage.update_one(
        {"_id": f"{ip}:{_today()}"},
        {"$inc": {"count": 1}, "$set": {"date": _today(), "ip": ip, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )


def _strip_b64(data: Optional[str]) -> Optional[str]:
    if not data:
        return None
    if "," in data and data.strip().startswith("data:"):
        data = data.split(",", 1)[1]
    return data.strip()


@router.get("/quota")
async def quota(request: Request):
    used = await _used_today(_client_ip(request))
    return {"used": used, "limit": DAILY_LIMIT, "remaining": max(0, DAILY_LIMIT - used)}


async def _generate_story_text(payload: StoryRequest, api_key: str) -> dict:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    names = [c.name.strip() for c in payload.characters if c.name and c.name.strip()]
    main = names[0]
    others = ", ".join(names[1:]) if len(names) > 1 else ""
    age = (payload.age or "").strip()

    system_message = (
        "Je bent een liefdevolle Nederlandse kinderboekenschrijver voor Droomvriendjes "
        "(slaapknuffels met een zacht nachtlampje en rustgevende geluiden / white noise). "
        "Je schrijft korte, geruststellende bedtijdverhalen die kinderen helpen ontspannen en in slaap vallen. "
        "Toon: warm, rustig, ritmisch, leeftijdsgeschikt. Verwerk subtiel het Droomvriendje met zijn zachte "
        "lichtje en kalmerende geluid. Eindig altijd vredig met het kind dat veilig en tevreden in slaap valt. "
        "Antwoord UITSLUITEND met geldige JSON, geen markdown."
    )
    prompt = (
        f"Schrijf een gepersonaliseerd bedtijdverhaal in het Nederlands.\n"
        f"Hoofdpersoon: {main}{f' (leeftijd {age})' if age else ''}\n"
        f"{f'Bijfiguren: {others}' + chr(10) if others else ''}"
        f"Thema: {payload.theme}\n"
        f"{f'Gewenste titel: {payload.title}' + chr(10) if (payload.title or '').strip() else ''}"
        "Lengte: 180-230 woorden, 4-5 korte alinea's. Het is een GRATIS PREVIEW, dus eindig met een zachte "
        "cliffhanger-zin die nieuwsgierig maakt naar de rest van het boek.\n\n"
        "Lever exact dit JSON-object:\n"
        '{ "title": "pakkende verhaaltitel", "story": "het verhaal met \\n tussen alinea\'s" }'
    )
    chat = LlmChat(api_key=api_key, session_id=f"story-{uuid.uuid4().hex[:8]}", system_message=system_message).with_model("openai", TEXT_MODEL)
    resp = await chat.send_message(UserMessage(text=prompt))
    text = (resp or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text).rsplit("```", 1)[0]
    try:
        data = json.loads(text)
        return {"title": (data.get("title") or payload.title or f"Het avontuur van {main}").strip(),
                "story": (data.get("story") or "").strip()}
    except json.JSONDecodeError:
        # Val terug op platte tekst
        return {"title": (payload.title or f"Het avontuur van {main}").strip(), "story": text}


async def _generate_illustration(payload: StoryRequest, api_key: str) -> Optional[str]:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    photo = _strip_b64(payload.characters[0].photo_base64) if payload.characters[0].photo_base64 else None
    scene = (
        "Een zachte, warme kinderboek-illustratie in dromerige aquarel/pastel stijl. "
        f"Een vrolijk kind knuffelt een schattige pluche slaapknuffel met een zacht gloeiend nachtlampje. "
        f"Thema: {payload.theme}. Gezellige bedtijdsfeer, sterren, kalmerend, geen tekst in de afbeelding."
    )
    try:
        chat = LlmChat(api_key=api_key, session_id=f"story-img-{uuid.uuid4().hex[:8]}", system_message="Je bent een illustrator van kinderboeken.").with_model("gemini", IMAGE_MODEL).with_params(modalities=["image", "text"])
        if photo:
            msg = UserMessage(
                text=(f"Maak op basis van het kind op de referentiefoto een vriendelijk cartoon-personage "
                      f"(géén realistische foto, een lieve geïllustreerde versie). {scene}"),
                file_contents=[ImageContent(photo)],
            )
        else:
            msg = UserMessage(text=scene)
        _, images = await chat.send_message_multimodal_response(msg)
        if images:
            img = images[0]
            return f"data:{img.get('mime_type', 'image/png')};base64,{img['data']}"
    except Exception as exc:
        logger.warning(f"Illustratie met foto mislukt, val terug op tekst-naar-beeld: {exc}")

    # Fallback: tekst-naar-beeld zonder foto
    try:
        chat = LlmChat(api_key=api_key, session_id=f"story-img2-{uuid.uuid4().hex[:8]}", system_message="Je bent een illustrator van kinderboeken.").with_model("gemini", IMAGE_MODEL).with_params(modalities=["image", "text"])
        _, images = await chat.send_message_multimodal_response(UserMessage(text=scene))
        if images:
            img = images[0]
            return f"data:{img.get('mime_type', 'image/png')};base64,{img['data']}"
    except Exception as exc:
        logger.warning(f"Illustratie tekst-naar-beeld mislukt: {exc}")
    return None


@router.post("/preview")
async def preview(payload: StoryRequest, request: Request):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI is niet geconfigureerd.")
    if not payload.characters or not (payload.characters[0].name or "").strip():
        raise HTTPException(status_code=400, detail="De naam van de hoofdpersoon is verplicht.")
    if not (payload.theme or "").strip():
        raise HTTPException(status_code=400, detail="Kies of beschrijf een thema voor het verhaal.")
    for c in payload.characters:
        if c.photo_base64 and len(c.photo_base64) > MAX_PHOTO_CHARS:
            raise HTTPException(status_code=413, detail="De foto is te groot. Gebruik een foto kleiner dan 3,5 MB.")

    ip = _client_ip(request)
    used = await _used_today(ip)
    if used >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="Je hebt vandaag je 2 gratis previews gebruikt. Probeer het morgen opnieuw of bestel het volledige boek.")

    try:
        story = await _generate_story_text(payload, api_key)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Verhaalgeneratie mislukt")
        raise HTTPException(status_code=502, detail=f"Het verhaal kon niet worden gegenereerd: {exc}")

    image = await _generate_illustration(payload, api_key)

    await _increment(ip)
    remaining = max(0, DAILY_LIMIT - (used + 1))
    return {
        "title": story["title"],
        "story": story["story"],
        "image": image,
        "remaining": remaining,
    }
