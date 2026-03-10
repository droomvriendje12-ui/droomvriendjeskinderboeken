# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI, @supabase/supabase-js
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL)
- **Bestandsopslag:** Supabase Storage
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API
- **Adres Lookup:** PDOK API (gratis, Nederlands overheid)
- **Realtime:** Supabase Realtime

## Wat is Geïmplementeerd

### Voltooide Features
- [x] MongoDB → Supabase volledige migratie
- [x] Productbeheer (CRUD, specs, afbeeldingen via Supabase Storage)
- [x] Bestelflow met Mollie betalingen
- [x] Admin dashboard met statistieken + Supabase Realtime
- [x] Admin bestellingenbeheer (status, tracking)
- [x] Review systeem (CRUD, toewijzing, avatars met eerste letter)
- [x] Email templates beheer
- [x] TransIP SMTP emails (bestelling, tracking, review-verzoek)
- [x] Cadeaubon systeem (Supabase)
- [x] Review-verzoek email bij status "Geleverd"
- [x] **Checkout Mobile-First Reconstructie** (10 mrt 2026)
  - Express Checkout (Apple Pay) bovenaan
  - Adres auto-fill via PDOK API (postcode + huisnr → straat + stad)
  - Floating labels op alle invoervelden
  - Numeriek toetsenbord voor postcode/telefoon
  - 48px minimum touch targets
  - Cadeauverpakking checkbox (+€3) ipv opmerkingenveld
  - Compacte radio-lijst betaalmethoden
  - Sticky "Veilig betalen" balk op mobiel
  - Cross-sell carousel in besteloverzicht

## Openstaande Taken

### P2 - Toekomstig
- [ ] Admin interface verfijning (styling, navigatie, performance)

### P3 - Backlog
- [ ] Supabase Realtime publicatie inschakelen via Supabase Dashboard

## Key API Endpoints
- `GET /api/address/lookup?postcode=...&huisnummer=...` - PDOK adres auto-fill
- `PUT /api/admin/orders/{id}/status` - Status update + review email bij "delivered"
- `POST /api/gift-card/purchase` - Cadeaubon + Mollie betaling
- `POST /api/gift-card/validate` - Cadeaubon validatie

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
