# Droomvriendjes - Product Requirements Document

## Latest Update: 27 February 2026

### Completed This Session (27 Feb):

- **Taak 1: Email input verwijderd uit winkelwagen**
  - `checkout-email-input` volledig verwijderd uit CartSidebar.jsx
  - `handleCheckout` vereenvoudigd - navigeert direct naar /checkout
  - `CheckoutStartedCreate.customer_email` nu optioneel (bug fix door testing agent)

- **Taak 2: Bevestigingsmails via TransIP SMTP**
  - Email functies toegevoegd aan `orders_supabase.py` (_send_email, _send_order_confirmation, _send_order_notification)
  - Na order creatie: notificatie email naar eigenaar (info@droomvriendjes.nl)
  - Na succesvolle betaling (Mollie webhook 'paid'): bevestigingsmail naar klant + notificatie naar eigenaar
  - Na mislukte betaling: notificatie naar eigenaar
  - SMTP: smtp.transip.email:465 (SSL) - getest en werkend

- **Taak 3: Dashboard geoptimaliseerd (MongoDB → Supabase)**
  - Admin dashboard endpoint herschreven met Supabase queries
  - Server-side filtering met .gte() en .lte() voor datums
  - Alleen benodigde kolommen ophalen met .select()
  - Aparte geoptimaliseerde queries voor vandaag, periode, recent orders
  - Batch queries voor order items (populaire producten)

### Completed Previously (25 Feb):
- P0 Fix: Euro icon import + missing endpoints
- Drag-and-drop foto upload (Supabase Storage)
- Email Templates CRUD + ZIP upload + preview
- Reviews import gemigreerd naar Supabase
- 122/122 productfoto's gemigreerd naar Supabase Storage

### Database Configuratie
- **Primary:** Supabase PostgreSQL (USE_SUPABASE=true)
- **Storage:** Supabase Storage bucket `product-images` (122 afbeeldingen)
- **SMTP:** TransIP smtp.transip.email:465 (info@droomvriendjes.nl)

### Remaining Tasks:
- **P2: Admin interface verfijning** (gebruiker komt hierop terug)
- **P2: E-commerce flow verbeteringen** (gebruiker komt hierop terug)

### Code Architecture
```
backend/
  routes/
    orders_supabase.py    - Orders + Mollie + Email (TransIP SMTP)
    products_supabase.py  - Products + Photo upload/migration
    reviews_supabase.py   - Reviews CRUD + CSV import
    email_templates.py    - Email templates CRUD
  server.py               - Dashboard (Supabase), Auth, Config
frontend/
  src/
    components/CartSidebar.jsx    - Winkelwagen (email verwijderd)
    pages/CheckoutPage.jsx        - Checkout met adresformulier
    pages/AdminCommandCenterNew.jsx - Dashboard
```

### Testing Status
- Iteration 7: Product editor + photo upload (100%)
- Iteration 8: Email templates + Reviews + Photo migration (100%)
- Iteration 9: Cart email removal + SMTP emails + Dashboard Supabase (100%)

### Credentials
- Admin: username=admin, password=Droomvriendjes2024!
- SMTP: smtp.transip.email:465, info@droomvriendjes.nl
