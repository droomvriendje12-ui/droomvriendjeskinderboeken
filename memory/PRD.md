# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL) + MongoDB (funnel events + email queue)
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API (iDEAL, Creditcard, Apple Pay, Google Pay, PayPal, Bancontact, in3)
- **Adres Lookup:** PDOK (NL) + Nominatim (BE)

## Voltooide Features
- [x] Supabase migratie + productbeheer + Realtime
- [x] Bestelflow met Mollie + Admin dashboard
- [x] Review systeem + TransIP emails + Cadeaubon systeem
- [x] Checkout Mobile-First + Adres Auto-fill (NL+BE)
- [x] Funnel Tracking (MongoDB)
- [x] **Betaalknoppen fix** - formRef.requestSubmit() + mobiele sticky bar
- [x] **Express Checkout** - Apple Pay, Google Pay, PayPal knoppen
- [x] **Mobiele "Betaal nu" knop** - tussen voorwaarden en trust sectie
- [x] **PayPal professioneel** - officieel PayPal logo
- [x] **CSV Import** - email/naam/adres validatie, dedup, puntkomma support (23k+ getest)
- [x] **Email Marketing Dashboard** - /admin/email-marketing
- [x] **Bulk Email Campagne** - achtergrond batch verzending met polling
- [x] **AVG/GDPR Afmeldlink** (10 mrt 2026)
  - Unieke SHA256 token per contact
  - Automatische afmeldlink footer in elke campagne email
  - Professionele uitschrijf-bevestigingspagina
  - Dashboard toont uitschrijf-statistieken (5e stat card)
  - Campagne slaat uitgeschreven contacten automatisch over

## Key API Endpoints
- `POST /api/email/csv/import` - CSV contacten importeren
- `POST /api/email/csv/send-campaign` - Bulk campagne starten
- `GET /api/email/csv/campaign-progress/{id}` - Voortgang polling
- `GET /api/email/csv/queue/stats` - Wachtrij statistieken
- `GET /api/email/csv/unsubscribe/{token}?email=...` - Uitschrijven (HTML pagina)
- `GET /api/email/csv/unsubscribe-stats` - Uitschrijf-statistieken

## Openstaande Taken
### P1 - E-commerce flow verbeteringen
- [ ] Productpagina's verbeteren
- [ ] Winkelwagen optimalisatie
- [ ] Checkout flow verfijning
### P2 - Admin interface verfijning
- [ ] Dashboard styling/performance
- [ ] Navigatie verbeteren

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
