# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI, @supabase/supabase-js
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL) + MongoDB (funnel events)
- **Bestandsopslag:** Supabase Storage
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API
- **Adres Lookup:** PDOK (NL) + Nominatim/OpenStreetMap (BE) - gratis
- **Realtime:** Supabase Realtime
- **Analytics:** Custom Funnel Tracking (MongoDB)

## Wat is Geïmplementeerd

### Voltooide Features
- [x] MongoDB → Supabase volledige migratie
- [x] Productbeheer + Supabase Storage
- [x] Bestelflow met Mollie
- [x] Admin dashboard met echte Supabase stats
- [x] Review systeem + avatars met eerste letter
- [x] TransIP SMTP emails (bestelling, tracking, review-verzoek)
- [x] Cadeaubon systeem (Supabase)
- [x] Supabase Realtime op Admin Dashboard
- [x] Checkout Mobile-First Reconstructie
- [x] **Apple Pay knop responsive** (10 mrt 2026) - SVG logo, max-width 350px, gecentreerd
- [x] **Adres lookup NL + België** (10 mrt 2026) - PDOK (NL) + Nominatim (BE)
- [x] **Dashboard data integrity** (10 mrt 2026) - Verwijderd: random bezoekers, fake percentages
- [x] **Funnel Tracking** (10 mrt 2026) - 6-staps conversie funnel met drop-off percentages
  - Product bekeken → In winkelwagen → Checkout gestart → Adres ingevuld → Betaalmethode gekozen → Aankoop voltooid

## Key API Endpoints
- `GET /api/address/lookup?postcode=...&huisnummer=...` - NL+BE adres auto-fill
- `POST /api/funnel/event` - Track customer journey events
- `GET /api/admin/funnel-stats?days=30` - Funnel statistics met drop-off
- `GET /api/admin/dashboard?days=30` - Dashboard stats (echte Supabase data)

## Openstaande Taken
### P2 - Toekomstig
- [ ] Admin interface verfijning

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
