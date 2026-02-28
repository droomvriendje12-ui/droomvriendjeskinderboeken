# Droomvriendjes E-commerce Platform - PRD

## Originele Probleemstelling
E-commerce platform voor Droomvriendjes (slaapknuffels). Volledig gemigreerd van MongoDB naar Supabase (PostgreSQL).

## Architectuur
- **Frontend:** React, React Router, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, Pydantic
- **Database:** Supabase (PostgreSQL), JSONB columns
- **Bestandsopslag:** Supabase Storage (productafbeeldingen)
- **Email:** TransIP SMTP
- **Betalingen:** Mollie API

## Code Structuur
```
/app/backend/
├── server.py
├── routes/
│   ├── admin_supabase.py
│   ├── email_templates.py
│   ├── gift_cards_supabase.py     ← NIEUW (28 feb 2026)
│   ├── orders_supabase.py
│   ├── products_supabase.py
│   └── reviews_supabase.py
├── utils/
│   └── supabase_db.py
└── tests/
    └── test_gift_cards_supabase.py

/app/frontend/src/
├── App.js
├── pages/
│   ├── CadeaubonPage.jsx
│   ├── ProductPage.jsx
│   └── admin/
│       ├── AdminDashboardSupabase.jsx
│       ├── AdminOrdersPage.jsx
│       ├── AdminReviewsPage.jsx
│       ├── ProductEditor.jsx
│       └── EmailTemplates.jsx
└── components/
    ├── admin/AdminSidebar.jsx
    └── CartSidebar.jsx
```

## Wat is Geïmplementeerd

### Voltooide Features
- [x] MongoDB → Supabase volledige migratie
- [x] Productbeheer (CRUD, specs, afbeeldingen)
- [x] Bestelflow met Mollie betalingen
- [x] Admin dashboard met statistieken
- [x] Admin bestellingenbeheer (status, tracking)
- [x] Review systeem (CRUD, toewijzing aan producten)
- [x] Email templates beheer
- [x] Drag-and-drop foto upload (Supabase Storage)
- [x] TransIP SMTP orderbevestigingsemails
- [x] **Cadeaubon pagina gemigreerd naar Supabase** (28 feb 2026)
  - Gift card aankoop via Mollie
  - Gift card validatie
  - Kortingscode integratie met cadeaubonnen
  - Email notificaties (ontvanger + verzender)

### Afgeronde Bugfixes
- [x] Admin product editor blank page fix
- [x] Reviews foreign key constraint
- [x] 175 orphan reviews opgeruimd
- [x] Email Templates link in admin sidebar
- [x] Cadeaubon pagina MongoDB → Supabase migratie (28 feb 2026)

## Openstaande Taken

### P1 - Aankomend
- [ ] Automatische review-verzoek email bij status "geleverd"

### P2 - Toekomstig
- [ ] E-commerce flow verbeteringen (checkout, productpagina's)
- [ ] Admin interface verfijning (styling, navigatie, performance)

### P3 - Backlog
- [ ] Supabase Realtime voor live order updates

## Key API Endpoints
- `POST /api/gift-card/purchase` - Cadeaubon aankoop + Mollie betaling
- `POST /api/gift-card/validate` - Cadeaubon validatie
- `POST /api/webhook/gift-card` - Mollie webhook
- `POST /api/discount/validate` - Kortingscode + cadeaubon validatie
- `GET /api/admin/dashboard-stats` - Admin dashboard statistieken
- `GET/PUT /api/admin/orders` - Bestellingen beheer

## Database Schema (Supabase)
- **gift_cards:** id, code, amount, remaining_amount, sender_name/email, recipient_name/email, message, status, mollie_payment_id, expires_at, used_at, created_at
- **products:** id, name, specs (JSONB), images, price, etc.
- **orders:** id, status, tracking_number, tracking_url, customer details, items
- **reviews:** id, product_id (FK→products), rating, text, author, etc.

## Credentials
- **Admin:** admin@droomvriendjes.nl / Droomvriendjes!2024
- **Test cadeaubon:** DV-TEST0001 (active, amount: €0.01)
