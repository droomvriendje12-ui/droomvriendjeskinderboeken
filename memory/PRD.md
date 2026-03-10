# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI, @supabase/supabase-js
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL) + MongoDB (funnel events + email queue)
- **Bestandsopslag:** Supabase Storage
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API
- **Adres Lookup:** PDOK (NL) + Nominatim/OpenStreetMap (BE) - gratis
- **Realtime:** Supabase Realtime
- **Analytics:** Custom Funnel Tracking (MongoDB)

## Wat is Geimplementeerd

### Voltooide Features
- [x] MongoDB naar Supabase volledige migratie
- [x] Productbeheer + Supabase Storage
- [x] Bestelflow met Mollie
- [x] Admin dashboard met echte Supabase stats
- [x] Review systeem + avatars met eerste letter
- [x] TransIP SMTP emails (bestelling, tracking, review-verzoek)
- [x] Cadeaubon systeem (Supabase)
- [x] Supabase Realtime op Admin Dashboard
- [x] Checkout Mobile-First Reconstructie
- [x] Apple Pay knop responsive (10 mrt 2026)
- [x] Adres lookup NL + Belgie (10 mrt 2026)
- [x] Dashboard data integrity (10 mrt 2026)
- [x] Funnel Tracking (10 mrt 2026)
- [x] **P0 Bug Fix: Betaalknoppen checkout** (10 mrt 2026)
  - Apple Pay gebruikt nu formRef.requestSubmit() i.p.v. hidden button click
  - Mobiele sticky betaalbar verplaatst buiten overflowX:hidden container
  - Desktop "Veilig betalen" knop werkt correct
- [x] **P1 Feature: CSV Import & Email Verzending** (10 mrt 2026)
  - Backend: POST /api/email/csv/import (CSV upload, validatie, dedup, bron tracking)
  - Backend: GET /api/email/csv/queue (wachtrij bekijken met source filter)
  - Backend: DELETE /api/email/csv/queue (wachtrij opruimen)
  - Frontend: CSV Import knop op /admin/email-templates pagina
  - Validatie: email formaat, duplicaten in CSV en bestaande queue
  - Analytics: source kolom voor tracking herkomst

## Key API Endpoints
- `GET /api/address/lookup?postcode=...&huisnummer=...` - NL+BE adres auto-fill
- `POST /api/funnel/event` - Track customer journey events
- `GET /api/admin/funnel-stats?days=30` - Funnel statistics met drop-off
- `GET /api/admin/dashboard?days=30` - Dashboard stats (echte Supabase data)
- `POST /api/email/csv/import` - CSV contacten importeren
- `GET /api/email/csv/queue` - Email wachtrij bekijken
- `DELETE /api/email/csv/queue` - Email wachtrij opruimen

## Key Files
- `frontend/src/pages/CheckoutPage.jsx` - Checkout met formRef voor betaalknop fix
- `frontend/src/pages/admin/EmailTemplates.jsx` - CSV Import UI
- `backend/routes/csv_import.py` - CSV import endpoints
- `backend/server.py` - Hoofd server met alle routes

## Openstaande Taken
### P2 - Toekomstig
- [ ] E-commerce flow verbeteringen (checkout, productpagina's, winkelwagen)
- [ ] Admin interface verfijning (styling, navigatie, performance)
- [ ] MongoDB database casing issue monitoren

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
