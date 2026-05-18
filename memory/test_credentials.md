# Test Credentials - Droomvriendjes

## Admin Dashboard
- **Login URL:** `/admin/login`
- **Username:** `admin`
- **Email (alt):** `admin@droomvriendjes.com`
- **Password:** `Droomvriendjes2024!`
- **Token endpoint:** `POST /api/admin/login` returns Bearer JWT

## Test Customer (voor download flow)
- **Email:** `droomvriendje12@gmail.com` (Resend test mode default recipient)
- Geen account-systeem voor klanten; orders via gast checkout

## Mollie Payments
- **Live key:** `live_5PsHDHysF7vDTk7Apj6V74KnFSfyuB` (alleen in productie)
- **Test key:** `test_fgRGsCnf5C9hsCcRDdvRdGkypPCAS4`
- **Profile ID:** `pfl_eh9DPmmymw`

## URLs
- **Productie:** https://droomvriendjes.com
- **Preview:** https://mollie-payments-test.preview.emergentagent.com (REACT_APP_BACKEND_URL)

## Supabase (Storage + DB)
- **URL:** `https://plxbmkwuacbdzookygtg.supabase.co`
- Service + Anon keys in `/app/backend/.env`
- Buckets: `product-images` (public), `digital-products` (private, 25MB PDF only)

## Discount Codes (Feb 2026 update - now Supabase single source of truth)
- All discount code CRUD via `/api/discount-codes/*` reads/writes Supabase `discount_codes` table
- Both `/api/discount/validate` (CartSidebar) and `/api/discount-codes/validate` (CheckoutPage) read from the same Supabase source
- Active codes on Supabase: WELKOM10 (10% off), LENTE25 (25% min €75), EENMALIG2026 (€5 off), and the codes migrated from MongoDB

## Digital Products
- 5 producten geseed met IDs: `digital-bedtime-chart`, `digital-sleep-tracker`, `digital-affirmation-cards`, `digital-coloring-pages`, `digital-visual-schedule`
- Digital products are NOT shown on `/knuffels` or homepage anymore (filtered out by `productType === 'digital'` or id starts with `digital-`)
- Each digital product is surfaced exactly once inside a relevant blog post via `<BlogDigitalProductCallout>`:
  - `digital-bedtime-chart` → /blog/5-tips-betere-nachtrust-kinderen
  - `digital-sleep-tracker` → /blog/waarom-huilt-baby-s-nachts
  - `digital-affirmation-cards` → /blog/hoe-helpen-kalmerende-knuffels-bij-stress
  - `digital-visual-schedule` → /blog/verschil-verzwaringsknuffel-nachtlampje
  - `digital-coloring-pages` → /blog/beste-slaapknuffel-2026
- Customer download URL pattern: `/mijn-download/{token}`
- Entitlement: 24h geldig, max 3 downloads
- Test PDFs lokaal: `/tmp/digital_products/`
