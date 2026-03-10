# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI, @supabase/supabase-js (Realtime)
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL), JSONB columns
- **Bestandsopslag:** Supabase Storage (productafbeeldingen)
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API
- **Realtime:** Supabase Realtime (orders tabel)

## Wat is Geïmplementeerd

### Voltooide Features
- [x] MongoDB naar Supabase volledige migratie
- [x] Productbeheer (CRUD, specs, afbeeldingen)
- [x] Bestelflow met Mollie betalingen
- [x] Admin dashboard met statistieken
- [x] Admin bestellingenbeheer (status, tracking)
- [x] Review systeem (CRUD, toewijzing aan producten)
- [x] Email templates beheer
- [x] Drag-and-drop foto upload (Supabase Storage)
- [x] TransIP SMTP orderbevestigingsemails
- [x] Cadeaubon pagina gemigreerd naar Supabase
- [x] Review-verzoek email bij status "Geleverd"
- [x] Supabase Realtime op Admin Dashboard
- [x] Review avatars met eerste letter voornaam in merkkleur
- [x] **Checkout flow verbeteringen** (10 mrt 2026)
  - Express Checkout (Apple Pay) bovenaan
  - Compacte radio-lijst betaalmethoden (ipv tegels)
  - Opmerkingenveld verwijderd, cadeauverpakking checkbox (+EUR 3)
  - Sticky betaalbalk op mobiel

## Openstaande Taken

### P2 - Toekomstig
- [ ] Admin interface verfijning (styling, navigatie, performance)

### P3 - Backlog
- [ ] Supabase Realtime publicatie inschakelen via Supabase Dashboard

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
- **Test cadeaubon:** DV-TEST0001 (active)
