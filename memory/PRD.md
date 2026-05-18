# Droomvriendjes - Product Requirements Document

## Originele Probleemstelling
Nederlandse e-commerce website (droomvriendjes.com) voor innovatieve slaapknuffels voor kinderen. Full-stack platform met React frontend, FastAPI backend, Supabase (primary DB) en MongoDB (analytics).

## Architectuur
- **Frontend:** React + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Databases:** Supabase (PostgreSQL - core data + discount codes), MongoDB (analytics/email queue)
- **Betalingen:** Mollie (iDEAL, creditcard, PayPal, Apple Pay, Google Pay, Bancontact)
- **Email:** Resend
- **Adres lookup:** PDOK (NL), Be-API (BE)

## Wat is geïmplementeerd

### Core E-commerce
- [x] Productpagina's met gallerij, reviews, share buttons
- [x] Winkelwagen met cross-sell
- [x] Checkout met mobiel-first design, floating labels
- [x] Adres auto-fill (NL via PDOK, BE via publieke API)
- [x] Express checkout (Apple Pay, Google Pay, PayPal) - direct naar betaaldienst
- [x] Kortingscode invoerveld in checkout — **stuurt nu cart_total mee** (was bug)
- [x] Mollie betalingen met retry-logica (3 pogingen) en nette Nederlandse foutmeldingen
- [x] Cadeaubonnen (/cadeaubon) via Supabase

### Admin Dashboard
- [x] Real-time statistieken uit Supabase (omzet, orders, klanten)
- [x] Live bestellingen feed, conversie funnel, dagelijkse omzet chart
- [x] Klanten beheer (/admin/customers)
- [x] Kortingscode beheer (/admin/discount-codes) — **nu Supabase, gesynced met website** (Feb 2026)

### Email Marketing + Inbox
- [x] CSV import, bulk verzending, AVG/GDPR afmeldlink, open/click tracking
- [x] Inbox 3-pane Gmail-style interface (/admin/inbox)
- [x] Cloudflare Email Worker webhook: POST /api/inbox/webhook (Bearer auth)
- [x] Resend SDK voor outbound + reply met In-Reply-To threading

### Digitale Producten / PDF Downloads (Feb 2026)
- [x] Supabase Storage private bucket `digital-products` (PDF only, max 25MB)
- [x] 5 placeholder PDFs (Slaapritueel, Slaaplog, Affirmatiekaartjes, Kleurplaten, Visueel Schema)
- [x] Backend `/api/digital-products/*` (6 endpoints, Bearer admin auth, atomic counters)
- [x] Mollie webhook → entitlement bij `paid`, 24u geldig, max 3 downloads
- [x] Admin UI `/admin/digital-products`, Customer UI `/mijn-download/{token}`

### Kortingscodes — Supabase consolidatie (18 Feb 2026)
**Probleem (opgelost):** Admin schreef naar MongoDB, CartSidebar valideerde tegen Supabase → codes aangemaakt in admin verschenen niet op de website.
- [x] `discount_codes.py` herschreven om Supabase te gebruiken (single source of truth)
- [x] 10 codes gemigreerd van MongoDB naar Supabase (one-time script)
- [x] Beide validate endpoints (`/api/discount/validate` voor CartSidebar én `/api/discount-codes/validate` voor CheckoutPage) lezen nu uit dezelfde Supabase tabel
- [x] **CheckoutPage bug fix:** stuurde geen `cart_total` mee → kreeg altijd "Minimaal bestelbedrag is €30" zelfs met €54,95 cart
- [x] **Security:** POST/PUT/DELETE op `/api/discount-codes/*` vereisen nu Bearer admin JWT (was open)
- [x] AdminDiscountCodesPage stuurt `Authorization: Bearer <token>` mee voor mutations
- [x] 10/10 backend pytest pass + E2E getest via UI (create + delete via /admin/discount-codes)

### Blogs — natuurlijke digital product integratie (18 Feb 2026)
- [x] Digital producten **verwijderd van /knuffels en homepage** (filter op productType==='digital' of id starts with `digital-`)
- [x] Herbruikbare `<BlogDigitalProductCallout>` component — editorial style, geen catalog tile
- [x] Elke digital PDF wordt **precies één keer** strategisch genoemd in een relevante blog:
  - `digital-bedtime-chart` → `/blog/5-tips-betere-nachtrust-kinderen` (na Tip 1 - slaaproutine)
  - `digital-sleep-tracker` → `/blog/waarom-huilt-baby-s-nachts` (na "slaapdagboek" tip)
  - `digital-affirmation-cards` → `/blog/hoe-helpen-kalmerende-knuffels-bij-stress` (na Pavlov sectie)
  - `digital-visual-schedule` → `/blog/verschil-verzwaringsknuffel-nachtlampje` (na product-tabel)
  - `digital-coloring-pages` → `/blog/beste-slaapknuffel-2026` (na kraamcadeau sectie)
- [x] **Geen duplicaten meer** per blog post (image dedup + product link dedup)
- [x] Dode blog routes verwijderd uit /blogs lijst (hoogsensitiviteit, diepe-druk-stimulatie, slaaprituals, adhd — geen detail pages)
- [x] Mondriaan blog krijgt eigen unieke afbeelding (was duplicaat bearbrown-main.png)

## Bekende Issues
- Supabase URL onstabiel in DNS (frontend valt terug op mockData)
- Mollie live key werkt alleen in productie, niet in preview
- (P2) `/api/discount-codes/use` increment is read-then-write, niet atomic — bij hoge concurrent checkouts kan een code een keer te vaak gebruikt worden. Aanbevolen: Supabase RPC met `UPDATE … SET current_uses = current_uses + 1 WHERE current_uses < max_uses`
- (P2) Response shapes van `/api/discount/validate` (legacy: `discount_amount`, `type`) en `/api/discount-codes/validate` (nieuw: `discount`, `discount_type`) zijn nog niet uniform — werkt wel maar consumers moeten beide kennen

## Backlog (P2)
- Cloudflare Email Worker — gebruiker moet nog Cloudflare UI configureren (5-stappen handleiding in INBOX_SETUP.md)
- Mollie live test van €0,01 op productie (handmatige verificatie)
- Atomic increment voor discount code `/use` endpoint
- Response shape uniformeren tussen beide validate endpoints
- Refactoring: server.py opsplitsen (>4000 regels), MarketingCommandCenter.jsx, CheckoutPage.jsx
- Audio digital producten (ON HOLD totdat professionele audio beschikbaar)

## Credentials
Zie `/app/memory/test_credentials.md`
