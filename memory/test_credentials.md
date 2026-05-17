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

## Digital Products (NIEUW)
- 5 producten geseed met IDs: `digital-bedtime-chart`, `digital-sleep-tracker`, `digital-affirmation-cards`, `digital-coloring-pages`, `digital-visual-schedule`
- Customer download URL pattern: `/mijn-download/{token}`
- Entitlement: 24h geldig, max 3 downloads
- Test PDFs lokaal: `/tmp/digital_products/`
