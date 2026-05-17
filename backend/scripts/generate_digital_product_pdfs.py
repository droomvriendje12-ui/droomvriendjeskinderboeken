"""
Genereer 5 professionele PDF placeholders voor de Droomvriendjes digitale shop.
Op basis van top-verkopende kindslaap-printables (Etsy research).

Templates:
1. Bedtime Routine Chart (Slaapritueel-schema)
2. Sleep Tracker / Slaaplog voor ouders
3. Affirmation Cards (Liefdevolle slaap-affirmatiekaartjes)
4. Bedtime Coloring Pages (Slaap kleurplaten)
5. Visual Schedule for Toddlers (Visueel slaapschema)

Output: /tmp/digital_products/*.pdf
Upload deze via de admin UI of via een script naar Supabase Storage.
"""
import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Palette - matches Droomvriendjes brand (amber/stone warm tones)
AMBER = HexColor("#F59E0B")
AMBER_LIGHT = HexColor("#FEF3C7")
STONE_DARK = HexColor("#44403C")
STONE_MID = HexColor("#78716C")
STONE_LIGHT = HexColor("#E7E5E4")
ROSE = HexColor("#FB7185")
INDIGO = HexColor("#6366F1")
EMERALD = HexColor("#10B981")

OUT_DIR = Path("/tmp/digital_products")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _branded_header(c: canvas.Canvas, title: str, subtitle: str = ""):
    """Gestileerde header met merkstijl"""
    w, h = A4
    # Topbalk
    c.setFillColor(AMBER)
    c.rect(0, h - 4 * cm, w, 4 * cm, stroke=0, fill=1)
    # Logo tekst
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2 * cm, h - 1.5 * cm, "DROOMVRIENDJES")
    c.setFont("Helvetica", 9)
    c.drawString(2 * cm, h - 2.0 * cm, "droomvriendjes.com")
    # Titel
    c.setFont("Helvetica-Bold", 22)
    c.drawString(2 * cm, h - 3.0 * cm, title)
    if subtitle:
        c.setFont("Helvetica", 11)
        c.drawString(2 * cm, h - 3.7 * cm, subtitle)


def _branded_footer(c: canvas.Canvas, page_num: int = None):
    w, _ = A4
    c.setFillColor(STONE_MID)
    c.setFont("Helvetica", 8)
    c.drawString(2 * cm, 1.2 * cm, "© Droomvriendjes - Voor persoonlijk gebruik. Niet doorverkopen.")
    txt = "droomvriendjes.com"
    if page_num:
        txt = f"droomvriendjes.com  ·  pagina {page_num}"
    c.drawRightString(w - 2 * cm, 1.2 * cm, txt)


def gen_bedtime_routine_chart():
    """1. Slaapritueel-schema - top seller"""
    path = OUT_DIR / "01-slaapritueel-schema.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    _branded_header(c, "Slaapritueel Schema", "Het beste bedtijd-ritueel voor jouw kindje")

    # Intro
    c.setFillColor(STONE_DARK)
    c.setFont("Helvetica", 10)
    intro = [
        "Een vaste slaaproutine helpt kinderen tot rust te komen en sneller in slaap te vallen.",
        "Print dit schema, hang het op of vink af. Voor kinderen van 1 t/m 10 jaar."
    ]
    y = h - 5.5 * cm
    for line in intro:
        c.drawString(2 * cm, y, line)
        y -= 0.5 * cm

    # 7 stappen
    steps = [
        ("18:30", "Speeltijd afsluiten", "Rustige spelletjes, geen schermen"),
        ("18:45", "Avondeten", "Niet te zwaar, geen suikers"),
        ("19:00", "Warm bad", "10 minuten ontspannend"),
        ("19:20", "Pyjama & tandenpoetsen", "Samen, in dezelfde volgorde"),
        ("19:30", "Knuffel knuffel", "Pak je Droomvriendje"),
        ("19:35", "Voorleesverhaal", "Eén kort verhaal"),
        ("19:50", "Welterusten kus", "Zacht licht, gordijnen dicht"),
    ]
    y -= 0.5 * cm
    c.setStrokeColor(STONE_LIGHT)
    c.setLineWidth(0.5)
    for time, action, hint in steps:
        # Checkbox
        c.setFillColor(white)
        c.setStrokeColor(STONE_MID)
        c.rect(2 * cm, y - 0.1 * cm, 0.6 * cm, 0.6 * cm, stroke=1, fill=1)
        # Time
        c.setFillColor(AMBER)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(3.2 * cm, y, time)
        # Action
        c.setFillColor(STONE_DARK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(5.5 * cm, y, action)
        # Hint
        c.setFillColor(STONE_MID)
        c.setFont("Helvetica", 9)
        c.drawString(5.5 * cm, y - 0.4 * cm, hint)
        y -= 1.5 * cm

    # Pro tip box
    c.setFillColor(AMBER_LIGHT)
    c.rect(2 * cm, 3 * cm, w - 4 * cm, 2.2 * cm, stroke=0, fill=1)
    c.setFillColor(STONE_DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2.5 * cm, 4.5 * cm, "Pro Tip van de Droomvriendjes Experts")
    c.setFont("Helvetica", 9)
    c.drawString(2.5 * cm, 4.0 * cm, "Houd het schema 21 dagen vol. Het gemiddelde kind heeft 14-21 dagen nodig")
    c.drawString(2.5 * cm, 3.6 * cm, "om een nieuwe slaapgewoonte te internaliseren. Volhouden = winst!")

    _branded_footer(c, 1)
    c.save()
    return path


def gen_sleep_tracker():
    """2. Slaaplog - 30 dagen tracker"""
    path = OUT_DIR / "02-slaaplog-30dagen.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    _branded_header(c, "Slaaplog - 30 Dagen", "Ontdek slaappatronen van je kindje")

    # Intro
    c.setFillColor(STONE_DARK)
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, h - 5.5 * cm, "Vul elke ochtend in. Zo zie je patronen waardoor je kindje beter slaapt.")

    # Tabel header
    headers = ["Datum", "Bedtijd", "In slaap", "Wakker", "Opstaan", "Stemming", "Notities"]
    col_w = [1.8, 1.5, 1.5, 1.5, 1.5, 1.8, 5.5]
    col_w = [c_ * cm for c_ in col_w]
    start_x = 1.5 * cm
    y = h - 6.5 * cm

    # Header row
    c.setFillColor(AMBER)
    c.rect(start_x, y - 0.6 * cm, sum(col_w), 0.8 * cm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    x = start_x
    for i, hdr in enumerate(headers):
        c.drawString(x + 0.15 * cm, y - 0.35 * cm, hdr)
        x += col_w[i]
    y -= 0.8 * cm

    # 30 rijen
    c.setStrokeColor(STONE_LIGHT)
    c.setFillColor(STONE_DARK)
    c.setFont("Helvetica", 8)
    for row in range(30):
        if row % 2 == 0:
            c.setFillColor(HexColor("#FAFAF9"))
            c.rect(start_x, y - 0.55 * cm, sum(col_w), 0.6 * cm, stroke=0, fill=1)
        c.setFillColor(STONE_DARK)
        # Day number column
        c.drawString(start_x + 0.15 * cm, y - 0.35 * cm, f"Dag {row + 1}")
        # Lijn boven en kolommen
        c.line(start_x, y - 0.55 * cm, start_x + sum(col_w), y - 0.55 * cm)
        x = start_x
        for cw in col_w:
            c.line(x, y - 0.55 * cm, x, y + 0.05 * cm)
            x += cw
        c.line(x, y - 0.55 * cm, x, y + 0.05 * cm)
        y -= 0.6 * cm
        if y < 2.5 * cm:
            break

    _branded_footer(c, 1)
    c.save()
    return path


def gen_affirmation_cards():
    """3. Slaap-affirmatiekaartjes - 12 kaartjes"""
    path = OUT_DIR / "03-slaap-affirmatiekaartjes.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    _branded_header(c, "Slaap Affirmaties", "12 Liefdevolle bedtijd-affirmaties om uit te knippen")

    affirmations = [
        ("Ik voel mij veilig", "en geborgen.", ROSE),
        ("Mijn lichaam is", "moe en klaar voor slaap.", INDIGO),
        ("Ik laat mijn", "zorgen los.", EMERALD),
        ("Morgen wordt", "een mooie dag.", AMBER),
        ("Ik word omringd", "door liefde.", ROSE),
        ("Mijn ademhaling", "is rustig en diep.", INDIGO),
        ("Ik ben dapper", "en sterk.", EMERALD),
        ("Mijn bed is", "warm en zacht.", AMBER),
        ("Ik droom over", "leuke dingen.", ROSE),
        ("Mijn Droomvriendje", "past op mij.", INDIGO),
        ("Ik val zacht in", "een diepe slaap.", EMERALD),
        ("Ik word fris", "en blij wakker.", AMBER),
    ]

    # 3 cols x 4 rows = 12 kaartjes
    card_w = (w - 4 * cm - 2 * 0.5 * cm) / 3
    card_h = (h - 6 * cm - 2 * cm - 3 * 0.5 * cm) / 4
    start_x = 2 * cm
    start_y = h - 5.5 * cm - card_h

    idx = 0
    for row in range(4):
        for col in range(3):
            if idx >= len(affirmations):
                break
            line1, line2, color = affirmations[idx]
            x = start_x + col * (card_w + 0.5 * cm)
            y = start_y - row * (card_h + 0.5 * cm)
            # Dashed border (knip langs)
            c.setStrokeColor(STONE_MID)
            c.setDash(3, 3)
            c.rect(x, y, card_w, card_h, stroke=1, fill=0)
            c.setDash()
            # Inner colored band
            c.setFillColor(color)
            c.rect(x, y + card_h - 0.4 * cm, card_w, 0.4 * cm, stroke=0, fill=1)
            # Tekst
            c.setFillColor(STONE_DARK)
            c.setFont("Helvetica-Bold", 11)
            c.drawCentredString(x + card_w / 2, y + card_h / 2 + 0.3 * cm, line1)
            c.drawCentredString(x + card_w / 2, y + card_h / 2 - 0.1 * cm, line2)
            # Number badge
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(x + 0.2 * cm, y + 0.2 * cm, f"#{idx + 1}")
            idx += 1

    _branded_footer(c, 1)
    c.save()
    return path


def gen_coloring_pages():
    """4. Slaap kleurplaten - 4 paginas"""
    path = OUT_DIR / "04-slaap-kleurplaten.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    titles = [
        "Maan en sterren",
        "Knuffel in bed",
        "Het slapende dier",
        "Droomwolken",
    ]
    for idx, title in enumerate(titles):
        if idx > 0:
            c.showPage()
        _branded_header(c, f"Slaap Kleurplaat {idx + 1}", title)
        # Outline van een eenvoudige scene (line art)
        c.setStrokeColor(STONE_DARK)
        c.setLineWidth(2)

        cx = w / 2
        cy = h / 2 - 1 * cm

        if idx == 0:
            # Maan + sterren
            c.circle(cx, cy + 2 * cm, 3 * cm, stroke=1, fill=0)
            c.circle(cx + 1 * cm, cy + 2.5 * cm, 2.2 * cm, stroke=1, fill=0)  # crescent effect
            for sx, sy, ss in [(-5, 3, 0.4), (-4, -2, 0.3), (5, 1, 0.5), (3, -3, 0.3), (-2, -4, 0.4)]:
                px = cx + sx * cm
                py = cy + sy * cm
                _star(c, px, py, ss * cm)
        elif idx == 1:
            # Bed met knuffel - simpele vormen
            c.rect(cx - 5 * cm, cy - 2 * cm, 10 * cm, 4 * cm, stroke=1, fill=0)
            c.rect(cx - 5 * cm, cy + 2 * cm, 10 * cm, 1 * cm, stroke=1, fill=0)
            c.circle(cx, cy + 0.5 * cm, 1.5 * cm, stroke=1, fill=0)
            c.circle(cx - 0.6 * cm, cy + 0.8 * cm, 0.2 * cm, stroke=1, fill=0)
            c.circle(cx + 0.6 * cm, cy + 0.8 * cm, 0.2 * cm, stroke=1, fill=0)
            c.arc(cx - 0.5 * cm, cy + 0.0 * cm, cx + 0.5 * cm, cy + 0.4 * cm, 180, 180)
        elif idx == 2:
            # Slapend olifantje (heel simpel)
            c.circle(cx, cy, 3 * cm, stroke=1, fill=0)
            c.circle(cx - 4 * cm, cy + 1 * cm, 1.2 * cm, stroke=1, fill=0)
            c.line(cx - 3 * cm, cy + 0.5 * cm, cx - 5 * cm, cy - 1 * cm)
            # "Z Z Z"
            c.setFont("Helvetica-Bold", 26)
            c.drawString(cx + 3 * cm, cy + 1 * cm, "Z")
            c.drawString(cx + 4 * cm, cy + 2 * cm, "Z")
            c.drawString(cx + 5 * cm, cy + 3 * cm, "Z")
        else:
            # Wolkjes
            for ox, oy, r in [(-3, 2, 1.5), (2, 3, 1.3), (-2, -1, 1.7), (3, -2, 1.4), (0, 0, 1.8)]:
                px = cx + ox * cm
                py = cy + oy * cm
                _cloud(c, px, py, r * cm)

        _branded_footer(c, idx + 1)
    c.save()
    return path


def _star(c, cx, cy, size):
    import math
    pts = []
    for i in range(10):
        angle = math.pi / 2 + i * math.pi / 5
        r = size if i % 2 == 0 else size * 0.4
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    p = c.beginPath()
    p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    p.close()
    c.drawPath(p, stroke=1, fill=0)


def _cloud(c, cx, cy, r):
    c.circle(cx, cy, r, stroke=1, fill=0)
    c.circle(cx - r * 0.8, cy - r * 0.2, r * 0.7, stroke=1, fill=0)
    c.circle(cx + r * 0.8, cy - r * 0.2, r * 0.7, stroke=1, fill=0)
    c.circle(cx - r * 0.4, cy + r * 0.4, r * 0.6, stroke=1, fill=0)
    c.circle(cx + r * 0.4, cy + r * 0.4, r * 0.6, stroke=1, fill=0)


def gen_visual_schedule():
    """5. Visueel slaapschema voor peuters/kleuters"""
    path = OUT_DIR / "05-visueel-slaapschema-peuters.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    _branded_header(c, "Visueel Slaapschema", "Voor peuters en kleuters die nog niet kunnen lezen")

    # Intro
    c.setFillColor(STONE_DARK)
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, h - 5.5 * cm, "8 stappen in plaatjes - perfect voor zelfstandige bedtijd-routines.")

    steps = [
        ("Speeltijd stop", "Speelgoed opruimen"),
        ("Plassen", "Naar het toilet"),
        ("Tanden poetsen", "2 minuten"),
        ("Pyjama aan", "Schone pyjama"),
        ("Knuffel pakken", "Droomvriendje erbij"),
        ("Voorlezen", "Kort verhaaltje"),
        ("Lampje uit", "Zachte gloed"),
        ("Slapen", "Welterusten kus"),
    ]

    cols = 2
    box_w = (w - 4 * cm - 1 * cm) / cols
    box_h = 3 * cm
    start_x = 2 * cm
    start_y = h - 7 * cm
    for i, (title, hint) in enumerate(steps):
        row = i // cols
        col = i % cols
        x = start_x + col * (box_w + 1 * cm)
        y = start_y - row * (box_h + 0.6 * cm)
        # Box
        c.setFillColor(AMBER_LIGHT)
        c.setStrokeColor(AMBER)
        c.setLineWidth(1)
        c.roundRect(x, y - box_h, box_w, box_h, 0.3 * cm, stroke=1, fill=1)
        # Step number circle
        c.setFillColor(AMBER)
        c.circle(x + 0.7 * cm, y - 0.7 * cm, 0.45 * cm, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(x + 0.7 * cm, y - 0.95 * cm, str(i + 1))
        # Title
        c.setFillColor(STONE_DARK)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x + 1.7 * cm, y - 1.0 * cm, title)
        # Hint
        c.setFillColor(STONE_MID)
        c.setFont("Helvetica", 9)
        c.drawString(x + 1.7 * cm, y - 1.5 * cm, hint)
        # Plaatje placeholder
        c.setStrokeColor(STONE_MID)
        c.setFillColor(white)
        c.setDash(2, 2)
        c.rect(x + 0.5 * cm, y - box_h + 0.5 * cm, box_w - 1 * cm, box_h - 2.3 * cm, stroke=1, fill=1)
        c.setDash()
        c.setFillColor(STONE_MID)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(x + box_w / 2, y - box_h + 1.2 * cm, "(plaatje / sticker hier)")

    _branded_footer(c, 1)
    c.save()
    return path


def main():
    print("Genereren van PDF placeholders...")
    files = [
        gen_bedtime_routine_chart(),
        gen_sleep_tracker(),
        gen_affirmation_cards(),
        gen_coloring_pages(),
        gen_visual_schedule(),
    ]
    print("\n✅ Gegenereerd:")
    for f in files:
        size = os.path.getsize(f) / 1024
        print(f"  - {f.name}  ({size:.1f} KB)")
    print(f"\nLocatie: {OUT_DIR}")


if __name__ == "__main__":
    main()
