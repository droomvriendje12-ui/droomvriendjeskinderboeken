"""
Blog posts API - reads from Supabase blog_posts table.
Falls back to an empty array if the table doesn't exist yet (graceful degradation).
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/blogs", tags=["blogs"])

_supabase = None


def set_supabase_client(client):
    global _supabase
    _supabase = client


@router.get("")
async def list_blog_posts(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
):
    """Return all published blog posts. Public endpoint."""
    if _supabase is None:
        return {"posts": [], "total": 0}
    try:
        q = _supabase.table("blog_posts").select("*").eq("is_published", True)
        if category:
            q = q.eq("category", category)
        if featured is not None:
            q = q.eq("featured", featured)
        result = q.order("published_at", desc=True).limit(limit).execute()
        rows = result.data or []
        return {"posts": rows, "total": len(rows)}
    except Exception as e:
        # Table might not exist yet — silent fallback
        msg = str(e)
        if "blog_posts" in msg and ("does not exist" in msg or "not found" in msg):
            logger.info("blog_posts table not yet provisioned, returning empty list")
        else:
            logger.warning(f"blog list error: {msg}")
        return {"posts": [], "total": 0}


@router.get("/{slug}")
async def get_blog_post(slug: str):
    """Get single blog post by slug."""
    if _supabase is None:
        raise HTTPException(status_code=404, detail="Niet gevonden")
    try:
        result = (_supabase.table("blog_posts")
                  .select("*")
                  .eq("slug", slug)
                  .eq("is_published", True)
                  .limit(1).execute())
        if not result.data:
            raise HTTPException(status_code=404, detail="Niet gevonden")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"blog detail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
