# Droomvriendjes - Product Requirements Document

## Originele Probleemstelling
Nederlandse e-commerce website (droomvriendjes.com) voor innovatieve slaapknuffels voor kinderen. Full-stack platform met React frontend, FastAPI backend, Supabase (primary DB) en MongoDB (analytics).

## Architectuur
- **Frontend:** React + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Databases:** Supabase (PostgreSQL - core data), MongoDB (analytics/email queue)
- **Betalingen:** Mollie (iDEAL, creditcard, PayPal, Apple Pay, Google Pay, Bancontact)
- **Email:** TransIP SMTP
- **Adres lookup:** PDOK (NL), Be-API (BE)

## Wat is geïmplementeerd

### Core E-commerce
- [x] Productpagina's met gallerij, reviews, share buttons
- [x] Winkelwagen met cross-sell
- [x] Checkout met mobiel-first design, floating labels
- [x] Adres auto-fill (NL via PDOK, BE via publieke API)
- [x] Express checkout (Apple Pay, Google Pay, PayPal) - direct naar betaaldienst
- [x] Kortingscode invoerveld in checkout (WELKOM10, LENTE25, EENMALIG2026)
- [x] Mollie betalingen met retry-logica (3 pogingen) en nette Nederlandse foutmeldingen
- [x] Mollie health check endpoint: GET /api/mollie-status
- [x] Cadeaubonnen (/cadeaubon) via Supabase

### Admin Dashboard
- [x] Real-time statistieken uit Supabase (omzet, orders, klanten)
- [x] Live bestellingen feed met polling
- [x] Conversie funnel (product_view → add_to_cart → checkout → purchase)
- [x] Dagelijkse omzet chart met echte data
- [x] Analytics sectie met echte database cijfers (geen hardcoded data)

### Email Marketing
- [x] CSV import per bestand (/admin/email-marketing)
- [x] Bulk verzending met templates en voortgangsindicator
- [x] AVG/GDPR afmeldlink (unsubscribe)
- [x] Open tracking (pixel) + Click tracking (redirect)
- [x] Verwijder-functie per bestand/campagne
- [x] Single email import endpoint (voor popup)

### Homepage Features
- [x] Exit-intent / welkomst popup (na 5 sec, 1x per sessie, 10% korting WELKOM10)
- [x] "Vertrouwen & Zekerheid" sectie (bedrijfsgegevens, betaalmethoden, verzendpartners)
- [x] Lente Sale thema (was Winter)
- [x] Product fallback naar mockData als Supabase niet bereikbaar is

### Overige
- [x] WhatsApp nummer gewijzigd naar +31684588815
- [x] Social share buttons op productpagina's
- [x] Automatische review-verzoek emails bij status "delivered"
- [x] Schema markup voor SEO

## Bekende Issues
- Supabase URL (qoykbhocordugtbvpvsl.supabase.co) is momenteel niet bereikbaar (DNS fout). Frontend valt terug op mockData.
- Mollie live key werkt alleen in productie, niet in preview-omgeving.
- WhatsApp zwevende knop wordt via GTM (extern) geladen, niet aanpasbaar in React code.

## Backlog (P2)
- E-commerce flow verbeteringen
- Admin interface verfijning
- Refactoring: grote componenten opsplitsen (MarketingCommandCenter, CheckoutPage)

## Credentials
- Admin: admin@droomvriendjes.nl / Droomvriendjes2024!
- Productie: https://droomvriendjes.com
- Preview: https://email-import.preview.emergentagent.com
