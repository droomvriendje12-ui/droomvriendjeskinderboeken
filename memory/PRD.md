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
- [x] Supabase migratie + productbeheer
- [x] Bestelflow met Mollie
- [x] Admin dashboard + Supabase Realtime
- [x] Review systeem + TransIP emails
- [x] Cadeaubon systeem + Funnel Tracking
- [x] Checkout Mobile-First + Adres Auto-fill (NL+BE)
- [x] **Betaalknoppen fix** - formRef.requestSubmit() + mobiele sticky bar
- [x] **Express Checkout** - Apple Pay, Google Pay, PayPal knoppen
- [x] **Mobiele "Betaal nu" knop** - tussen voorwaarden en trust sectie
- [x] **PayPal professioneel** - officieel PayPal logo (paypalobjects.com)
- [x] **CSV Import** - email/naam/adres validatie, dedup, puntkomma support
- [x] **Email Marketing Dashboard** - /admin/email-marketing met:
  - Stats cards (totaal, wachtend, verzonden, mislukt)
  - CSV drag-drop import met kolom auto-detectie
  - Bronnen overzicht met status per bron
  - Campagne verzending met template selectie + voortgangsbalk
  - Recente contacten lijst met status
- [x] **Bulk Email Campagne** - achtergrond batch verzending met polling

## Key API Endpoints
- `POST /api/email/csv/import` - CSV contacten importeren (23k+ getest)
- `POST /api/email/csv/send-campaign` - Bulk campagne starten
- `GET /api/email/csv/campaign-progress/{id}` - Voortgang polling
- `GET /api/email/csv/queue/stats` - Wachtrij statistieken
- `GET /api/email/csv/queue` - Contacten lijst
- `DELETE /api/email/csv/queue` - Wachtrij opruimen

## Openstaande Taken
### P2 - Toekomstig
- [ ] E-commerce flow verbeteringen
- [ ] Admin interface verfijning

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
