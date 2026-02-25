# Droomvriendjes - Product Requirements Document

## Latest Update: 25 February 2026

### Completed This Session (25 Feb):
- **P0 FIX: Admin Product Editor Euro Icon** 
  - Toegevoegd ontbrekende `Euro` import in `AdminAdvancedProductEditor.jsx`
  - Product Details tab werkt nu correct met prijzen sectie
  
- **P0 FIX: Missing Backend Endpoints**
  - Toegevoegd `GET /api/products/{id}/image-info` endpoint
  - Toegevoegd `GET /api/products/{id}/set-image-override` endpoint
  - Toegevoegd `DELETE /api/products/{id}/image-override` endpoint
  - Media Beheer tab laadt nu zonder 404 fouten

- **FEATURE: Product Foto Upload System (Supabase Storage)**
  - Nieuw "Foto's Uploaden" tab in admin product editor
  - Drag-and-drop upload zone met visuele feedback
  - Multi-file upload naar Supabase Storage bucket `product-images`
  - Foto's grid met nummering, verplaatsen en verwijderen
  - Max 10 foto's per product limiet
  - Backend endpoints: `POST /photos`, `DELETE /photos/{index}`, `PUT /photos/reorder`
  - Testing: 100% backend (13/13) + 100% frontend tests geslaagd

### Database Configuratie
- **Primary:** Supabase PostgreSQL (`USE_SUPABASE=true`)
- **Supabase URL:** https://qoykbhocordugtbvpvsl.supabase.co
- **Storage Bucket:** `product-images` (public)
- **Fallback:** MongoDB Atlas (nog beschikbaar)

### Completed Previous Sessions:
- Database migratie MongoDB -> Supabase (208 records, 27 tabellen)
- Bewerkbare productspecificaties (specs, quickFeatures JSONB)
- Bestelling/betaling flow met Supabase + Mollie
- Admin product editor met tabs (Details, Media, Afbeeldingen, Secties, etc.)
- Email template editor (basis)
- Reviews CSV importer
- 5 nieuwe producten
- SEO landing pages, Blog pages, Google Shopping Feed
- Mollie payment integration (iDEAL, Klarna, etc.)
- Admin dashboard met command center

### In Progress / Upcoming Tasks:
- **P1: Email Marketing & Template Management** - ZIP upload afmaken, frontend koppeling
- **P1: Reviews Import** - Migreren naar Supabase
- **P2: Admin interface verfijning**
- **P2: E-commerce flow verbeteringen**

### Code Architecture
```
/app/
  backend/
    server.py             - FastAPI main app
    routes/
      products_supabase.py  - Product CRUD + photo upload (Supabase Storage)
      orders_supabase.py    - Orders + Mollie payments
      reviews_supabase.py   - Reviews management
      email_templates.py    - Email templates
    utils/
      supabase.py           - Supabase client init
  frontend/
    src/
      App.js                - Routes (admin at /admin/products/:productId/advanced-editor)
      pages/
        AdminAdvancedProductEditor.jsx - Product editor with tabs
        admin/EmailTemplates.jsx       - Email template editor
```

### Key DB Schema
- **products:** `{ id: UUID, specs: JSONB, quick_features: JSONB, custom_sections: JSONB, gallery: JSONB }`
- **Supabase Storage:** `product-images` bucket for uploaded photos

### Credentials
- **Admin:** username=admin, password=Droomvriendjes2024!
- **Mollie:** Live key in .env
- **Supabase:** Service key in .env
