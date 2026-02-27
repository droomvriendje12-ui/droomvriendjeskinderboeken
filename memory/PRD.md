# Droomvriendjes - Product Requirements Document

## Latest Update: 27 February 2026

### Completed This Session (27 Feb) - Reviews Systeem:

- **50 Product-Specifieke Reviews Gegenereerd**
  - 5 reviews per product x 10 producten met realistische Nederlandse namen/teksten
  - 172 oude ontkoppelde reviews verwijderd
  - Totaal: 53 reviews (50 nieuw + 3 eerder gekoppeld aan Schaapje)

- **Product Pagina Reviews Filter**
  - ProductPage.jsx gebruikt nu `/api/reviews/product/{product_id}` 
  - Elke productpagina toont alleen eigen reviews
  - Getest: Schaapje 8 reviews, Eenhoorn 5 reviews (geen overlap)

- **Admin Reviews Dashboard**
  - Zoekfunctie (naam, tekst, product)
  - Product filter dropdown
  - Rating filter (1-5 sterren)
  - Stats kaarten met rating distributie
  - "Review Toevoegen" formulier (product, naam, rating sterren, tekst, geverifieerd)
  - Verwijderen en zichtbaarheid togglen per review

### Eerder Voltooid (27 Feb):
- Orders Management Page (status filters, zoeken, detail panel, tracking, paginering)
- Sidebar navigatie herindeling (SHOP, MARKETING, SYSTEEM)
- Email input verwijderd uit cart, SMTP bevestigingsmails, Dashboard → Supabase

### Eerder Voltooid (25 Feb):
- Database migratie MongoDB → Supabase
- Drag-and-drop foto upload (Supabase Storage)
- Email Templates + 122 foto's gemigreerd

### Remaining Tasks:
- **P2: E-commerce flow verbeteringen** (later)
- **P3: Supabase Realtime voor live updates** (later)
- **FK Constraint:** `/app/reviews_fk_constraint.sql` uitvoeren in Supabase SQL Editor

### Testing Status (alle 100%):
- Iteration 7-8: Product editor, photo upload, email templates, reviews migration
- Iteration 9: Cart email, SMTP, Dashboard Supabase
- Iteration 10: Admin orders management, sidebar navigation
- Iteration 11: Reviews system overhaul (17/17 backend, all frontend)

### Credentials
- Admin: username=admin, password=Droomvriendjes2024!
- SMTP: smtp.transip.email:465, info@droomvriendjes.nl
