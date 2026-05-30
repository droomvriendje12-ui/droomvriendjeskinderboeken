"""
Email HTML processor.

Makes an arbitrary HTML email deliverable by extracting every embedded
`data:image/...;base64,...` image, hosting it on the public Supabase bucket,
and rewriting the references to public URLs.

- SVG data-URIs are rasterized to PNG (Gmail/Outlook do not render SVG <img>).
- Raster images (png/jpg/gif/webp) are uploaded as-is.
- Uploads are deduplicated by content hash (same image -> same hosted file).

This shrinks a multi-MB inlined email to a few KB of HTML referencing CDN images.
"""
import re
import hashlib
import logging

logger = logging.getLogger(__name__)

PUBLIC_BUCKET = "product-images"
ASSET_FOLDER = "email-assets"

# data:image/<mime>;base64,<payload>  (payload ends at quote, whitespace or paren)
_DATA_URI_RE = re.compile(r"data:image/([a-zA-Z0-9.+\-]+);base64,([A-Za-z0-9+/=]+)")

_EXT_BY_MIME = {
    "png": "png",
    "jpeg": "jpg",
    "jpg": "jpg",
    "gif": "gif",
    "webp": "webp",
    "svg+xml": "svg",
}


def _public_url(supabase, path: str) -> str:
    url = supabase.storage.from_(PUBLIC_BUCKET).get_public_url(path)
    return url.rstrip("?").rstrip("/") if url.endswith("?") else url


def _rasterize_svg(svg_bytes: bytes) -> bytes:
    import cairosvg
    return cairosvg.svg2png(bytestring=svg_bytes, output_width=600, background_color="white")


def process_html(html: str, supabase) -> dict:
    """Return {html, images_hosted, original_size, processed_size, errors}."""
    if supabase is None:
        raise ValueError("Supabase client is required to host images")

    original_size = len(html.encode("utf-8"))
    cache = {}   # data-uri match -> public url
    errors = []
    hosted = 0

    def _replace(match) -> str:
        nonlocal hosted
        full = match.group(0)
        if full in cache:
            return cache[full]
        mime = match.group(1).lower()
        payload = match.group(2)
        try:
            import base64
            raw = base64.b64decode(payload)
        except Exception as e:
            errors.append(f"decode failed: {e}")
            return full

        ext = _EXT_BY_MIME.get(mime, "png")
        content_type = "image/png"
        try:
            if mime == "svg+xml":
                raw = _rasterize_svg(raw)
                ext = "png"
                content_type = "image/png"
            else:
                content_type = f"image/{'jpeg' if ext == 'jpg' else ext}"
        except Exception as e:
            errors.append(f"svg rasterize failed: {e}")
            return full

        digest = hashlib.sha256(raw).hexdigest()[:24]
        path = f"{ASSET_FOLDER}/{digest}.{ext}"
        try:
            # Upsert (skip duplicate content automatically via deterministic path)
            supabase.storage.from_(PUBLIC_BUCKET).upload(
                path, raw, {"content-type": content_type, "upsert": "true"}
            )
        except Exception as e:
            # Likely already exists; that's fine — reuse the path
            if "exist" not in str(e).lower() and "duplicate" not in str(e).lower():
                errors.append(f"upload failed: {e}")
        url = _public_url(supabase, path)
        cache[full] = url
        hosted += 1
        return url

    processed = _DATA_URI_RE.sub(_replace, html)
    return {
        "html": processed,
        "images_hosted": hosted,
        "original_size": original_size,
        "processed_size": len(processed.encode("utf-8")),
        "errors": errors,
    }
