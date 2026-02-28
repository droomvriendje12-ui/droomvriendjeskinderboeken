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

## Code Structuur
```
/app/backend/
├── server.py
├── routes/
│   ├── email_templates.py
│   ├── gift_cards_supabase.py
│   ├── orders_supabase.py
│   ├── products_supabase.py
│   └── reviews_supabase.py
├── utils/
│   └── supabase_db.py
└── tests/
    ├── test_gift_cards_supabase.py
    └── test_review_email_realtime.py

/app/frontend/src/
├── App.js
├── lib/
│   └── supabase.js                ← Supabase Realtime client
├── pages/
│   ├── CadeaubonPage.jsx
│   ├── ProductPage.jsx
│   ├── AdminCommandCenterNew.jsx  ← Met Realtime Live Feed
│   ├── AdminOrdersPage.jsx
│   └── admin/
│       └── EmailTemplates.jsx
└── components/
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
- [x] Cadeaubon pagina gemigreerd naar Supabase (28 feb 2026)
- [x] **Review-verzoek email bij "Afgeleverd" status** (28 feb 2026)
  - Automatische email naar klant met review verzoek
  - Bevat productlijst en link naar review pagina
  - Vermeldt 10% korting als beloning
- [x] **Supabase Realtime op Admin Dashboard** (28 feb 2026)
  - Live Feed toont nieuwe bestellingen en status wijzigingen instant
  - Live/Verbinden indicator met Wifi icoon
  - Flash notificatie bij nieuwe bestellingen
  - 10-seconden polling fallback als Realtime niet ingeschakeld

### Afgeronde Bugfixes
- [x] Admin product editor blank page fix
- [x] Reviews foreign key constraint
- [x] 175 orphan reviews opgeruimd
- [x] Email Templates link in admin sidebar
- [x] Cadeaubon pagina MongoDB → Supabase migratie

## Openstaande Taken

### P2 - Toekomstig
- [ ] E-commerce flow verbeteringen (checkout, productpagina's)
- [ ] Admin interface verfijning (styling, navigatie, performance)

### P3 - Backlog
- [ ] Supabase Realtime publicatie inschakelen via Supabase Dashboard
  (orders tabel toevoegen aan supabase_realtime publicatie voor instant updates)

## Key API Endpoints
- `PUT /api/admin/orders/{order_id}/status` - Status wijzigen + review email bij "delivered"
- `POST /api/gift-card/purchase` - Cadeaubon aankoop + Mollie betaling
- `POST /api/gift-card/validate` - Cadeaubon validatie
- `POST /api/discount/validate` - Kortingscode + cadeaubon validatie
- `GET /api/admin/dashboard` - Dashboard statistieken + recente orders

## Database Schema (Supabase)
- **gift_cards:** id, code, amount, remaining_amount, sender/recipient info, status, mollie_payment_id
- **products:** id, name, specs (JSONB), images, price
- **orders:** id, status, tracking_number, delivered_at, customer details
- **reviews:** id, product_id (FK→products), rating, text, author
- **order_items:** id, order_id, product_name, quantity, unit_price

## Credentials
- **Admin:** username=admin / password=Droomvriendjes2024!
- **Test cadeaubon:** DV-TEST0001 (active)

## Supabase Realtime Setup (voor eigenaar)
Om instant live updates te krijgen in plaats van polling:
1. Ga naar Supabase Dashboard → Database → Replication
2. Schakel de `orders` tabel in bij de `supabase_realtime` publicatie
3. Het dashboard toont dan direct "Live" in plaats van "Verbinden..."
