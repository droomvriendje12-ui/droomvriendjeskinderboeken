# Test Credentials - Droomvriendjes

## Admin Dashboard
- **Login URL:** `/admin/login`
- **Username:** `admin`
- **Email (alt):** `admin@droomvriendjes.com`
- **Password (PREVIEW):** `Droomvriendjes2024!`
- **Token endpoint:** `POST /api/admin/login` returns Bearer JWT
- ⚠️ **PRODUCTIE admin-wachtwoord WIJKT AF** van preview (eigen `ADMIN_PASSWORD_HASH` env in productie; onbekend hier). Preview-creds werken NIET op droomvriendjes.com.
- ℹ️ **Preview en productie delen dezelfde MongoDB** (zelfde MONGO_URL/DB_NAME) — inbox-berichten zijn in beide omgevingen zichtbaar.

## Inbox / E-mail (Cloudflare + Resend) — status 30 mei 2026
- **Inkomende mail WERKT**: Cloudflare Email Routing → Worker `bold-brook-c55c` (account `3e8af75...`, zone `c14c0c33...`) → `POST /api/inbox/webhook` (Bearer `INBOX_WEBHOOK_TOKEN`) → MongoDB `inbox_messages`. Echte test-mails van yonascheh2030@gmail.com kwamen binnen.
- Worker secrets: `BACKEND_URL=https://droomvriendjes.com`, `INBOX_WEBHOOK_TOKEN`.
- **Uitgaande mail (reply/compose) BEPERKT**: Resend staat in TESTMODUS (`SENDER_EMAIL=onboarding@resend.dev`, `TEST_RECIPIENT=droomvriendje12@gmail.com`). Versturen lukt alleen naar dat test-adres tot `droomvriendjes.com` is geverifieerd op resend.com/domains. Daarna `SENDER_EMAIL` → `info@droomvriendjes.com` zetten in backend .env.
- Resend API-key is "restricted to send only" → domeinbeheer kan NIET via API, alleen via Resend dashboard.

## Test Customer (voor download flow)
- **Email:** `droomvriendje12@gmail.com` (Resend test mode default recipient)
- Geen account-systeem voor klanten; orders via gast checkout

## Mollie Payments
- **Live key:** `live_5PsHDHysF7vDTk7Apj6V74KnFSfyuB` (alleen in productie)
- **Test key:** `test_fgRGsCnf5C9hsCcRDdvRdGkypPCAS4`
- **Profile ID:** `pfl_eh9DPmmymw`

## URLs
- **Productie:** https://droomvriendjes.com
- **Preview:** https://ecommerce-digits.preview.emergentagent.com (REACT_APP_BACKEND_URL)

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
