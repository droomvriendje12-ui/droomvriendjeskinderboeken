# Droomvriendjes - Product Requirements Document

## Latest Update: 27 February 2026

### Completed This Session (27 Feb) - Admin Interface Verfijning:

- **Orders Management Page (VOLTOOID)**
  - Status filter tabs (Alles, In afwachting, Betaald, Verzonden, Afgeleverd, Geannuleerd) met aantallen
  - Zoeken op naam, email, bestelnummer
  - Status dropdown per order (direct wijzigbaar: pending → paid → shipped → delivered)
  - Uitklapbaar order detail panel (klantgegevens, producten, betaling & verzending)
  - Tracking code toevoegen met verzendservice keuze (PostNL, DHL, DPD, GLS, bpost)
  - Automatische tracking email naar klant
  - Paginering (25 per pagina)
  - Backend: Alle admin orders endpoints gemigreerd van MongoDB naar Supabase

- **Sidebar Navigatie Herindeling (VOLTOOID)**
  - SHOP: Live Dashboard, Analytics, Bestellingen, Producten, Kortingscodes
  - MARKETING: E-mail Marketing, Email Templates, Reviews
  - SYSTEEM: Database

- **Eerder voltooid deze sessie:**
  - Email input verwijderd uit cart sidebar
  - Bevestigingsmails via TransIP SMTP na betaling
  - Dashboard geoptimaliseerd (MongoDB → Supabase)

### Database Configuratie
- **Primary:** Supabase PostgreSQL (USE_SUPABASE=true)
- **Storage:** Supabase Storage bucket `product-images` (122 afbeeldingen)
- **SMTP:** TransIP smtp.transip.email:465 (info@droomvriendjes.nl)

### Completed Previous Sessions (25 Feb):
- Database migratie MongoDB → Supabase (208 records, 27 tabellen)
- Bewerkbare productspecificaties
- Bestelling/betaling flow met Supabase + Mollie
- Drag-and-drop foto upload (Supabase Storage)
- Email Templates + Reviews Import (Supabase)
- 122 productfoto's gemigreerd naar Supabase Storage

### Remaining Tasks:
- **P2: E-commerce flow verbeteringen** (gebruiker komt hierop terug)
- **P3: Eventueel Supabase Realtime voor live order updates**

### Key DB Column Mappings (orders tabel):
- tracking_number (niet tracking_code)
- tracking_url (niet label_url)
- mollie_payment_id (niet payment_id)
- customer_notes / admin_notes (niet notes)
- discount_code (niet coupon_code)

### Testing Status
- Iteration 7: Product editor + photo upload (100%)
- Iteration 8: Email templates + Reviews + Photo migration (100%)
- Iteration 9: Cart email removal + SMTP emails + Dashboard Supabase (100%)
- Iteration 10: Admin orders management + Sidebar navigation (100% - 17/17 backend, all frontend)

### Credentials
- Admin: username=admin, password=Droomvriendjes2024!
- SMTP: smtp.transip.email:465, info@droomvriendjes.nl
