"""
FAQ click tracking + trending ranking.
Lightweight MongoDB-backed counter; falls back gracefully when DB is unavailable.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/faq", tags=["faq"])

_db = None


def set_database(database):
    global _db
    _db = database


class ClickPayload(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)


@router.post("/click")
async def record_click(payload: ClickPayload):
    """Increment click counter for a trending FAQ id."""
    if _db is None:
        return {"status": "skipped"}
    try:
        now = datetime.now(timezone.utc)
        month_key = now.strftime("%Y-%m")
        await _db.faq_clicks.update_one(
            {"id": payload.id},
            {
                "$inc": {"count": 1, f"monthly.{month_key}": 1},
                "$set": {"last_click_at": now.isoformat()},
                "$setOnInsert": {"first_seen_at": now.isoformat()},
            },
            upsert=True,
        )
        return {"status": "ok"}
    except Exception as e:
        logger.warning(f"faq click record failed: {e}")
        return {"status": "error"}


@router.get("/trending")
async def get_trending(limit: int = 3, window: str = "all"):
    """Return top-N trending FAQ ids.
    window: 'all' (all-time count), 'month' (current calendar month).
    """
    limit = max(1, min(limit, 20))
    if _db is None:
        return {"trending": []}
    try:
        if window == "month":
            month_key = datetime.now(timezone.utc).strftime("%Y-%m")
            pipeline = [
                {"$project": {"_id": 0, "id": 1, "count": {"$ifNull": [f"$monthly.{month_key}", 0]}}},
                {"$match": {"count": {"$gt": 0}}},
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]
            items = [doc async for doc in _db.faq_clicks.aggregate(pipeline)]
            return {"trending": items, "window": "month", "month": month_key}
        cursor = _db.faq_clicks.find({}, {"_id": 0, "id": 1, "count": 1}).sort("count", -1).limit(limit)
        items = [doc async for doc in cursor]
        return {"trending": items, "window": "all"}
    except Exception as e:
        logger.warning(f"faq trending fetch failed: {e}")
        return {"trending": []}


@router.get("/admin/stats")
async def get_admin_stats():
    """Detailed click stats for the admin dashboard."""
    if _db is None:
        return {"items": [], "total_clicks": 0}
    try:
        month_key = datetime.now(timezone.utc).strftime("%Y-%m")
        items = []
        total = 0
        cursor = _db.faq_clicks.find({}, {"_id": 0}).sort("count", -1)
        async for d in cursor:
            monthly = d.get("monthly", {}) or {}
            items.append({
                "id": d.get("id"),
                "total_clicks": d.get("count", 0),
                "this_month": monthly.get(month_key, 0),
                "last_click_at": d.get("last_click_at"),
                "first_seen_at": d.get("first_seen_at"),
                "monthly_breakdown": monthly,
            })
            total += d.get("count", 0)
        return {"items": items, "total_clicks": total, "current_month": month_key}
    except Exception as e:
        logger.warning(f"faq stats fetch failed: {e}")
        return {"items": [], "total_clicks": 0}
