"""
AI Search Campaign Builder — generates complete Google Search campaigns with GPT-5.2.

Produces keywords (with match types), ad groups, Responsive Search Ads (headlines +
descriptions), sitelinks, callouts, structured snippets and negative keywords.
The admin reviews the result and exports a Google Ads Editor-compatible CSV.
"""
import os
import uuid
import json
import re
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ads-builder", tags=["ads-builder"])
_security = HTTPBearer(auto_error=False)

_db = None
_admin_verifier = None


def set_database(database):
    global _db
    _db = database


def set_admin_verifier(verifier):
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    if not _admin_verifier(credentials):
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return True


class CampaignRequest(BaseModel):
    product_focus: str = Field(..., min_length=2, max_length=200)   # bijv. "Slaapknuffel met nachtlampje"
    seed_keywords: List[str] = []                                   # startzoekwoorden
    daily_budget: Optional[float] = 15.0
    language: str = "nl"                                            # nl | de | fr
    final_url: Optional[str] = "https://droomvriendjes.com/knuffels"


_BRAND = (
    "Droomvriendjes verkoopt premium slaapknuffels met nachtlampje, sterrenprojector en white noise "
    "voor kinderen 0-6 jaar. USP's: 14 dagen retour, gratis verzending, 2 jaar garantie, 10.000+ "
    "tevreden ouders, morgen in huis. Zoekwoordclusters: knuffelbeer/slaapknuffel/troostknuffel, "
    "nachtlampje/white noise/slaaptrainer, kraamcadeau/baby cadeau/cadeau voor kind."
)


@router.post("/generate")
async def generate_campaign(payload: CampaignRequest, _admin=Depends(_require_admin)):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")
    lang_name = {"nl": "het Nederlands", "de": "het Duits", "fr": "het Frans"}.get(payload.language, "het Nederlands")
    seeds = ", ".join([k for k in payload.seed_keywords if k]) or payload.product_focus
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        system_message = (
            "Je bent een senior Google Ads-specialist (Search) voor Droomvriendjes. " + _BRAND +
            " Je bouwt high-intent, conversiegerichte zoekcampagnes met strakke ad group-thema's, "
            "relevante zoekwoorden (exact/phrase), sterke RSA-teksten binnen de tekenlimieten "
            "(headlines max 30 tekens, descriptions max 90 tekens), en uitsluitingen. "
            "Antwoord UITSLUITEND met geldige JSON (geen markdown)."
        )
        prompt = (
            f"Bouw een complete Google Search-campagne in {lang_name}.\n"
            f"Productfocus: {payload.product_focus}\n"
            f"Startzoekwoorden/intentie: {seeds}\n"
            f"Dagbudget: € {payload.daily_budget}\n"
            f"Final URL: {payload.final_url}\n\n"
            "Lever exact dit JSON-object:\n"
            "{\n"
            '  "campaign_name": "string",\n'
            '  "daily_budget": number,\n'
            '  "ad_groups": [\n'
            "    {\n"
            '      "name": "thema-naam",\n'
            '      "keywords": [{"text": "zoekwoord", "match": "exact|phrase"}],\n'
            '      "headlines": ["12-15 headlines, elk max 30 tekens"],\n'
            '      "descriptions": ["4 descriptions, elk max 90 tekens"]\n'
            "    }  (maak 3-4 ad groups)\n"
            "  ],\n"
            '  "sitelinks": [{"text": "max 25 tekens", "url": "https://droomvriendjes.com/..."}],\n'
            '  "callouts": ["6-8 callouts, elk max 25 tekens"],\n'
            '  "structured_snippets": {"header": "bijv. Soorten", "values": ["4-6 waarden"]},\n'
            '  "negative_keywords": ["8-12 negatieve zoekwoorden, bijv. gratis, tweedehands, vacature"]\n'
            "}\n"
            "Respecteer de tekenlimieten strikt. Gebruik de USP's in callouts."
        )
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ads-{uuid.uuid4().hex[:8]}",
            system_message=system_message,
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        text = (resp or "").strip()
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text).rsplit("```", 1)[0]
        data = json.loads(text)
        data["final_url"] = payload.final_url
        data["language"] = payload.language
        return data
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI gaf ongeldige opmaak terug, probeer opnieuw.")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Ads campaign generatie faalde")
        raise HTTPException(status_code=502, detail=f"AI-generatie mislukt: {exc}")


class ExportRequest(BaseModel):
    campaign: dict


@router.post("/export-csv")
async def export_csv(payload: ExportRequest, _admin=Depends(_require_admin)):
    """Build a Google Ads Editor-compatible CSV from a generated campaign."""
    from fastapi.responses import Response
    import csv
    import io

    c = payload.campaign
    final_url = c.get("final_url", "https://droomvriendjes.com/knuffels")
    budget = c.get("daily_budget", 15)
    cname = c.get("campaign_name", "Droomvriendjes Search")

    buf = io.StringIO()
    w = csv.writer(buf)
    # Google Ads Editor import columns (subset, widely accepted)
    w.writerow(["Campaign", "Campaign Daily Budget", "Ad Group", "Keyword", "Match Type",
                "Headline 1", "Headline 2", "Headline 3", "Description Line 1", "Description Line 2", "Final URL"])
    for ag in c.get("ad_groups", []):
        ag_name = ag.get("name", "Ad Group")
        hl = ag.get("headlines", []) + ["", "", ""]
        ds = ag.get("descriptions", []) + ["", ""]
        # one RSA row per ad group
        w.writerow([cname, budget, ag_name, "", "", hl[0], hl[1], hl[2], ds[0], ds[1], final_url])
        for kw in ag.get("keywords", []):
            mt = kw.get("match", "phrase").capitalize()
            w.writerow([cname, budget, ag_name, kw.get("text", ""), mt, "", "", "", "", "", ""])
    # negatives
    for nk in c.get("negative_keywords", []):
        w.writerow([cname, budget, "", nk, "Negative Phrase", "", "", "", "", "", ""])

    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{_slug(cname)}.csv"'},
    )


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "campaign").lower()).strip("-") or "campaign"
