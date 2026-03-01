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
- [x] Cadeaubon pagina gemigreerd naar Supabase (28 feb 2026)
- [x] Review-verzoek email bij status "Geleverd" (28 feb 2026)
- [x] Supabase Realtime op Admin Dashboard (28 feb 2026)
- [x] **Review avatars met eerste letter voornaam** in merkkleur (1 mrt 2026)

## Openstaande Taken

### P2 - Toekomstig
- [ ] E-commerce flow verbeteringen (checkout, productpagina's)
- [ ] Admin interface verfijning (styling, navigatie, performance)

### P3 - Backlog
- [ ] Supabase Realtime publicatie inschakelen via Supabase Dashboard

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
- **Test cadeaubon:** DV-TEST0001 (active)
