# Droomvriendjes - Product Requirements Document

## Latest Update: 25 February 2026

### Completed This Session (25 Feb) - Batch 2:

- **Email Marketing & Template Management (AFGEROND)**
  - Backend: CRUD endpoints, ZIP upload, preview, duplicate, variables, assets
  - Frontend: Template editor met variabelen paneel, preview modal, assets beheer
  - Route-ordering bug gefixed (assets endpoint vóór template_id)
  - Tabel: `email_templates` in Supabase

- **Reviews Import Gemigreerd naar Supabase (AFGEROND)**
  - Backend: `/api/reviews/admin` alias, `PUT /reviews/{id}/visibility`, `POST /reviews/bulk-delete`
  - Frontend: `AdminReviewsImporterPage.jsx` en `AdminReviewsToolAdvanced.jsx` omgezet
  - Products worden nu uit Supabase API geladen (niet meer uit mockData)
  - PATCH methodes omgezet naar PUT voor Supabase compatibiliteit
  - UUID-gebaseerde product selectie (niet meer parseInt)
  - 46 reviews in Supabase

- **Product Foto's Gemigreerd naar Supabase Storage (AFGEROND)**
  - Supabase Storage bucket `product-images` aangemaakt (public)
  - Migratie endpoint: `POST /api/products/migrate-photos/start`
  - Status endpoint: `GET /api/products/migrate-photos/status`
  - **122/122 afbeeldingen gemigreerd** (10 producten, 0 lokaal)
  - ASCII-safe folder namen (ï-fix voor Pinguïn)

### Completed This Session (25 Feb) - Batch 1:
- P0 Fix: `Euro` icon import in AdminAdvancedProductEditor.jsx
- P0 Fix: Missing endpoints (`image-info`, `set-image-override`)
- Feature: Drag-and-drop foto upload (Supabase Storage, max 10/product)

### Database Configuratie
- **Primary:** Supabase PostgreSQL (`USE_SUPABASE=true`)
- **Supabase URL:** https://qoykbhocordugtbvpvsl.supabase.co
- **Storage Bucket:** `product-images` (public, 122 afbeeldingen)
- **Fallback:** MongoDB Atlas (nog beschikbaar, niet actief)

### Completed Previous Sessions:
- Database migratie MongoDB -> Supabase (208 records, 27 tabellen)
- Bewerkbare productspecificaties (specs, quickFeatures JSONB)
- Bestelling/betaling flow met Supabase + Mollie
- Admin product editor met tabs
- Reviews CSV importer
- SEO landing pages, Blog pages, Google Shopping Feed
- Mollie payment integration
- Admin dashboard met command center

### Remaining Tasks:
- **P2: Admin interface verfijning** (later - gebruiker komt hierop terug)
- **P2: E-commerce flow verbeteringen** (later - gebruiker komt hierop terug)

### Code Architecture
```
/app/
  backend/
    server.py
    routes/
      products_supabase.py  - Product CRUD + photo upload/migration (Supabase Storage)
      orders_supabase.py    - Orders + Mollie payments
      reviews_supabase.py   - Reviews CRUD + CSV import + bulk-delete + visibility
      email_templates.py    - Email templates CRUD + ZIP upload + preview + assets
    utils/
      supabase.py
  frontend/
    src/
      App.js
      pages/
        AdminAdvancedProductEditor.jsx  - Product editor + drag-drop photos
        AdminReviewsImporterPage.jsx    - Reviews import (Supabase)
        AdminReviewsToolAdvanced.jsx    - Reviews management (Supabase)
        admin/EmailTemplates.jsx        - Email template editor
```

### Key DB Schema
- **products:** `{ id: UUID, specs: JSONB, quick_features: JSONB, custom_sections: JSONB, gallery: JSONB }`
- **email_templates:** `{ id: UUID, name, subject, content, variables: JSON, cart_link, category, active }`
- **reviews:** `{ id: UUID, product_id, product_name, customer_name, rating, content, verified, visible }`
- **Supabase Storage:** `product-images` bucket (122 afbeeldingen)

### Testing Status
- Iteration 7: Product editor + photo upload (100% pass)
- Iteration 8: Email templates + Reviews + Photo migration (19/19 backend, all frontend pass)

### Credentials
- **Admin:** username=admin, password=Droomvriendjes2024!
- **Mollie:** Live key in .env
- **Supabase:** Service key in .env
