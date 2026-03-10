# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI, @supabase/supabase-js
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL) + MongoDB (funnel events + email queue)
- **Bestandsopslag:** Supabase Storage
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API (iDEAL, Creditcard, Apple Pay, Google Pay, PayPal, Bancontact, in3)
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
  - Mobiele sticky betaalbar buiten overflowX:hidden container
- [x] **P1 Feature: CSV Import & Email Verzending** (10 mrt 2026)
  - Backend: POST /api/email/csv/import (CSV upload, validatie, dedup, bron tracking)
  - Backend: GET /api/email/csv/queue, DELETE /api/email/csv/queue
  - Frontend: CSV Import knop op /admin/email-templates
- [x] **P1 Feature: Google Pay & PayPal Express Checkout** (10 mrt 2026)
  - 3 express knoppen: Apple Pay, Google Pay, PayPal
  - Alle met formRef.requestSubmit() en foutmelding bij leeg formulier
  - PayPal ook als radio optie bij betaalmethodes
- [x] **P2 Feature: Bulk Email Campagne Verzending** (10 mrt 2026)
  - Backend: POST /api/email/csv/send-campaign (achtergrond batch verzending)
  - Backend: GET /api/email/csv/campaign-progress/{id} (voortgang polling)
  - Backend: GET /api/email/csv/queue/stats (wachtrij statistieken)
  - Frontend: Campagne sectie na CSV import met template selectie
  - Voortgangsindicator met percentage balk
  - Resultaat rapportage (verzonden/mislukt)

## Key API Endpoints
- `GET /api/address/lookup?postcode=...&huisnummer=...` - NL+BE adres auto-fill
- `POST /api/funnel/event` - Track customer journey events
- `GET /api/admin/funnel-stats?days=30` - Funnel statistics
- `GET /api/admin/dashboard?days=30` - Dashboard stats
- `POST /api/email/csv/import` - CSV contacten importeren
- `GET /api/email/csv/queue` - Email wachtrij bekijken
- `POST /api/email/csv/send-campaign` - Bulk campagne starten
- `GET /api/email/csv/campaign-progress/{id}` - Campagne voortgang
- `GET /api/email/csv/queue/stats` - Wachtrij statistieken

## Openstaande Taken
### P2 - Toekomstig
- [ ] E-commerce flow verbeteringen (checkout, productpagina's, winkelwagen)
- [ ] Admin interface verfijning (styling, navigatie, performance)

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
