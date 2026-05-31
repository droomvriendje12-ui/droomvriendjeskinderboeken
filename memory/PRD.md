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
- [x] Express checkout (Apple Pay, Google Pay, PayPal)
- [x] Kortingscode invoerveld in checkout — stuurt nu cart_total mee
- [x] Mollie betalingen met retry-logica en NL foutmeldingen
- [x] Cadeaubonnen (/cadeaubon) via Supabase

### Discount Codes — Supabase + atomic (18 Feb 2026)
- [x] Single source of truth: Supabase `discount_codes` tabel
- [x] Admin CRUD `/api/discount-codes/*` met Bearer JWT auth (POST/PUT/DELETE)
- [x] **Atomic increment**: `/api/discount-codes/use` gebruikt Compare-And-Swap loop (5 retries) — 15 parallelle requests met max_uses=5 resulteert in **exact 5 successes, 10 MAX_USES errors**, geen overcount.
- [x] **Uniforme response shape** voor validate én use endpoints: `{ok, valid, message, code, discount, discount_amount, discount_type, discount_value, free_shipping, error_code}`. Machine-readable error_codes: `NOT_FOUND`, `INACTIVE`, `EXPIRED`, `MAX_USES`, `MIN_ORDER`, `CONTENTION`, `SERVER_ERROR`, `MISSING_CODE`.
- [x] Legacy `/api/discount/validate` (gift cards + codes) blijft backward-compatible

### Landingspage `/pro` — Digital Showcase (Feb 2026, deploy 30 mei)
- [x] Aparte sales-pagina voor de 5 digitale PDFs op route `/pro`
- [x] Donker-paars hero (sterrenhemel + gold italic accent), KPI-strip (5 PDFs / <1m levering / ∞ printen / 92 reviews)
- [x] Trust strip, "Waarom digitaal" sectie met 4 pillars, 5 product cards (live prijzen via /api/products), 3-staps hoe-werkt-het, 3 testimonials, bundle-block (40% korting computed), FAQ
- [x] Helmet meta SEO toegevoegd
- [x] Alle CTA's koppelen aan bestaande `/product/digital-*` routes
- [x] Component: `/app/frontend/src/pages/LandingProPage.jsx`, route in App.js

### Upload Deduplicatie (Feb 2026)
- [x] `/api/digital-products/admin/upload` controleert nu of een bestand met dezelfde safe filename + size al in de bucket folder zit
- [x] Bij hit: geen tweede upload, het bestaande pad wordt hergebruikt; response bevat `deduplicated: true`
- [x] Werkt zowel voor library uploads (`library/`) als product-specifieke uploads (`products/{product_id}/`)
- [x] Bewezen: 2x upload van zelfde file → 1 storage object, 2e response `deduplicated: true`


- [x] `/api/reviews?product_id=X` accepteert nu zowel int (`3`) als string ids (`digital-coloring-pages`)
- [x] 92 nieuwe digital-specifieke reviews geseed (18/23/20/16/15 per product) met realistische namen, varied ratings (3-5) en digital content (geen knuffel-terms)
- [x] Seed script: `/app/backend/scripts/seed_digital_reviews.py` (idempotent per customer_name)

### Cross-sell Digital → Physical (18 Feb 2026)
- [x] Na een **digital-only** paid order: auto-generated 10% kortingscode `BEDANKT<6hex>`
- [x] Code shape: percentage=10, max_uses=1, min_order_amount=0, 30 dagen geldig
- [x] **Idempotent**: dezelfde order_id+email → dezelfde code (hash-based deterministisch)
- [x] **Scope**: alleen voor digital-only orders, NIET voor mixed orders met fysieke knuffels
- [x] Code wordt getoond in de download-email (gold gradient block) én op `/mijn-download/{token}` (CrossSellCard met copy-button)
- [x] Backend helper: `_create_crosssell_discount_code()` in `orders_supabase.py`
- [x] Lookup endpoint `/api/digital-products/info/{token}` returnt `crosssell` object

### Digitale Producten / PDF Downloads (Feb 2026)
- [x] Supabase Storage private bucket `digital-products` (PDF only, max 25MB)
- [x] 5 placeholder PDFs (Slaapritueel, Slaaplog, Affirmatiekaartjes, Kleurplaten, Visueel Schema)
- [x] Backend `/api/digital-products/*` (6 endpoints, Bearer admin auth, atomic counters)
- [x] Mollie webhook → entitlement bij `paid`, 24u geldig, max 3 downloads
- [x] Admin UI `/admin/digital-products`, Customer UI `/mijn-download/{token}`
- [x] **ProductPage content sanitisation** — alle fysieke knuffel-content verwijderd van digital pages. Per PDF unieke teasers, specs (Bestandsformaat/Omvang/Leeftijd/Taal), 3 feature cards, trust badges, FAQ (6 vragen over PDF). Digital-only cart hide cross-sell knuffel-strip, "2e knuffel" promo en "Gratis verzending" tekst.

### Blog posts (18 Feb 2026)
- [x] 5 blog-posts met `<BlogDigitalProductCallout>` natuurlijk ingebed (1 PDF per blog)
- [x] Dode links gefixt, duplicate images/products gededupliceerd
- [x] 4 placeholder-blogs zonder detail page verwijderd uit /blogs lijst

### Admin Dashboard
- [x] Real-time statistieken uit Supabase (omzet, orders, klanten)
- [x] Live bestellingen feed, conversie funnel, dagelijkse omzet chart
- [x] Klanten beheer (/admin/customers)
- [x] Kortingscode beheer (/admin/discount-codes)

### Email Marketing + Inbox
- [x] CSV import, bulk verzending, AVG/GDPR afmeldlink, open/click tracking
- [x] Inbox 3-pane Gmail-style interface (/admin/inbox)
- [x] Cloudflare Email Worker webhook (handleiding in `/app/INBOX_SETUP.md` — bijgewerkt 18 Feb 2026 met TOC, architectuurdiagram en troubleshoot debug-script)
- [x] Resend SDK voor outbound + reply met In-Reply-To threading

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
- [x] **18 Feb 2026: ProductPage content sanitisation** — alle fysieke knuffel-content verwijderd van digital product pages. Per digital PDF unieke teasers, 3 feature cards, specs (Bestandsformaat / Omvang / Leeftijd / Taal), trust badges (Direct download / Onbeperkt printen / Veilige betaling / NL klantenservice), tip-tekst, Product Details box en quick-features. "Alleen de zachtste materialen" sectie verborgen voor digital. StickyAddToCart toont nu "Direct download" en "Direct beschikbaar na betaling / Onbeperkt printen" ipv "Bijna uitverkocht / Nog X op voorraad". Stock-urgency banner verborgen voor digital. Price badge "Direct in je inbox" ipv "2e knuffel 50% korting". Promises "Direct downloaden · Onbeperkt printen · Geen verzendkosten". Digital-specific FAQ (6 vragen over PDF, printen, refund, devices).
- [x] **18 Feb 2026: Cart drawer voor digital-only cart** — cross-sell knuffel-strip, "2e knuffel 50% korting" regel, "Voeg nog 1 knuffel toe" hint en "Gratis verzending" tekst worden verborgen wanneer cart alleen digital items bevat. "📥 Direct via e-mail (geen verzending)" wordt getoond. `getDiscount()` in CartContext excludeert nu digital items van de 2e-knuffel-promo.

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

### Printables-navigatie zichtbaarheid (30 mei 2026)
- [x] **Probleem:** `/pro` digitale producten-pagina bestond wel maar had geen enkele navigatielink → onvindbaar voor bezoekers
- [x] Naam gekozen: **"Printables"** (SEO-vriendelijk, onderscheidt van fysieke concurrentie)
- [x] Hoofdmenu (`Header.jsx`): nieuwe link "Printables" + "Nieuw"-badge (desktop + mobiel), tussen Knuffels en Cadeaubonnen
- [x] Footer (`Footer.jsx`): "Printables (PDF)" link met Nieuw-badge in Producten-kolom
- [x] Blogs: `BlogDigitalProductCallout.jsx` heeft nu een "Bekijk alle Printables →" link naar `/pro` (5 blogposts) + `BlogsPage.jsx` eigen nav-link "Printables" én een promo-banner "Droomvriendjes Printables · Direct Download"

### Virale Quiz-landingspagina `/quiz` (30 mei 2026)
- [x] **"Ontdek jouw Droomvriendje-type"** — persoonlijkheidsquiz als groei-hack (`QuizPage.jsx`, route `/quiz`)
- [x] Flow: intro → 4 vragen (progressbalk) → e-mail soft-gate → resultaat
- [x] **Scoring-engine**: elke antwoordoptie geeft punten aan kandidaat-knuffels; argmax → 1 van 7 archetypes (De Beschermer/Dromer/Avonturier/Knuffelaar/Rustzoeker/Kalmeerder/Trouwe Vriend), elk gekoppeld aan een fysiek product (ids 14/5/4/7/8/9/13). Variatie bevestigd door testing agent
- [x] **E-mail lead-capture** via bestaande `POST /api/email/csv/import-single` (source `quiz_droomvriendje`), non-blocking; skip-link beschikbaar
- [x] **Beloning**: vaste kortingscode **DROOMQUIZ10** (10% percentage, geen min. bedrag, ongelimiteerd) — aangemaakt in Supabase, gevalideerd (€5 op €49,95). Kopieer-knop op resultaat
- [x] Resultaat toont aanbevolen knuffel (live productdata: afbeelding/prijs/badge) + "In winkelwagen" (addToCart) + "Bekijk product" (`/product/{id}`)
- [x] **Deelbaar**: WhatsApp + Facebook share-links + kopieer-link (viral loop)
- [x] CTA-band op homepage (`home-quiz-cta`) + nav-link "Quiz" in header
- [x] Getest via testing agent: **24/24 frontend assertions, 100%**, geen bugs. E-mailvalidatie verbeterd naar regex; progressbalk toont meteen voortgang

### Admin CSV-export digitale producten (30 mei 2026)
- [x] Knop **"Exporteer CSV"** op `/admin/digital-products` (`AdminDigitalProductsPage.jsx`)
- [x] Backend: `GET /api/digital-products/admin/export` (admin-auth) → CSV (semicolon, UTF-8 BOM voor NL Excel)
- [x] Kolommen: Digitaal Product ID, Bestandsnaam, Gekoppelde Productnaam, Bestandsgrootte, Aantal Downloads (uit Supabase `products` + `digital_downloads`)
- [x] Getest via curl (HTTP 200, 8 producten) + UI-render bevestigd; zonder auth → 403

### Inbox e-mail koppeling — Cloudflare Worker fix (30 mei 2026)
- [x] **Inkomende mail werkt nu**: bestaande route `info@` wees naar Worker `bold-brook-c55c` met Cloudflare's standaard (weigerende) voorbeeldcode → overschreven met de juiste forwarder + secrets via Cloudflare API. Echte test-mails kwamen binnen in `/admin/inbox`.
- [x] **Uitgaande reply/compose WERKT NU** (30 mei 2026): gebruiker verifieerde `droomvriendjes.com` op Resend → `SENDER_EMAIL=info@droomvriendjes.com` in backend `.env`. Testmodus-blokkade vervalt; replies/compose gaan naar elke klant. Geverifieerd: `tests/test_resend_email.py` 15/15 pass + echte testverzending geslaagd. **Productie:** na deploy controleren dat `SENDER_EMAIL` ook daar op het geverifieerde adres staat.
- [x] **Live productie geverifieerd** (30 mei 2026): echte reply via productie `/api/inbox/{id}/reply` verstuurd vanaf `info@droomvriendjes.com` (geverifieerd domein), folder `sent`, geen fout. Productie heeft juiste `SENDER_EMAIL`.

### Gebrande inbox-handtekening (30 mei 2026)
- [x] **Automatische, gebrande e-mailvoettekst** onder elke inbox reply + compose (`services/email_signature.py`, centraal geïnjecteerd in `routes/inbox.py` `_send_smtp`). Transactionele order-mails hebben eigen templates en zijn NIET geraakt.
- [x] Bevat: Droomvriendjes-logo (PNG, gehost op publieke Supabase-bucket `product-images/branding/` — SVG wordt door Gmail geblokkeerd), tagline, en links naar Website / Instagram / TikTok / 14-dagen-retour + support-mail. E-mail-veilig (inline CSS, table-layout), idempotent (dubbele append voorkomen), met platte-tekst variant.
- [x] Getest: unit (idempotent + bevat alle elementen), lint schoon, echte verzending naar test-gmail (200), visuele preview bevestigd.

### Snelle antwoord-templates inbox (30 mei 2026)
- [x] **"Snelle antwoorden"-balk** boven de reply- én compose-tekstvelden in `pages/admin/InboxPage.jsx`
- [x] Templates laden nu uit de **database** (`/api/reply-templates`, MongoDB `reply_templates`, `routes/reply_templates.py`) i.p.v. hardcoded; 5 standaarden worden automatisch geseed
- [x] **Beheerscherm** ("Beheer"-knop → `TemplateManagerModal`): toevoegen / bewerken / verwijderen van templates, opgeslagen in DB (admin-auth CRUD: GET/POST/PUT/DELETE)
- [x] Voegt automatisch een gepersonaliseerde begroeting toe ("Hallo {voornaam}," bij reply, "Hallo," bij compose), niet-destructief. Handtekening server-side toegevoegd
- [x] Getest: backend curl CRUD (seed 5, create/update/delete, 401 zonder token) + e2e screenshot (5 knoppen uit API, manager opent met 5 rijen, nieuw-formulier werkt)

### Dashboard: Marketing & Sales Hub + Premium PDF + Status-monitoring (30 mei 2026)
- [x] **🤖 Robot-knop → "Marketing & Sales Hub"** (`components/admin/MarketingSalesHub.jsx`, geopend vanuit `AdminCommandCenterNew`):
  - Advertentie aanmaken: AI-tekst (GPT-5.2 via `POST /api/marketing-hub/ad-copy`) + 1-klik knoppen naar TikTok/Instagram/X/Meta Ads/Google Ads + kopieerbare product-link met UTM
  - Promotie aanmaken: snelle kortingscode (code/type/waarde → `POST /api/discount-codes`)
  - Conversie-snapshot: best verkochte producten van vandaag (`GET /api/marketing-hub/best-sellers-today` uit Supabase orders/order_items)
- [x] **Premium PDF (geen CSV)** via reportlab:
  - `/admin/digital-products`: knop "Download PDF-overzicht" → gebrand A4-overzicht (`GET /api/digital-products/admin/export-pdf`, opent inline)
  - Advanced editor: knop "Open PDF-bestand" → opent het bestaande PDF via signed URL (`GET /api/digital-products/admin/file-url/{id}`)
- [x] **Achtergrond status-monitoring** (`routes/system_alerts.py`, MongoDB `system_alerts`):
  - `log_alert()` helper aangeroepen bij gefaalde payment-webhook (orders_supabase) en inbox-webhook (corrupte/lege payload, parse-fout, missende tekst)
  - "Systeemmeldingen"-paneel in command center met rode badge + "Opgelost"-knop (`GET /api/admin/system-alerts`, `POST /api/admin/system-alerts/{id}/resolve`)
- [x] Getest via testing agent: **10/10 frontend scenario's, 100%**, geen bugs. Backend curl-geverifieerd (incl. GPT-5.2 NL ad-copy).

### Resend webhook receiver (30 mei 2026)
- [x] **`POST /api/webhook/resend`** (`routes/resend_webhook.py`) — ontvangt Resend email-events, Svix-ondertekend
- [x] Svix-signatuurverificatie (HMAC-SHA256 over `svix-id.svix-timestamp.body`, secret in `RESEND_WEBHOOK_SECRET`) — geldige sig → 200, ongeldig/geen headers → 401
- [x] Events opgeslagen in MongoDB `resend_events` (audit); bounce/complaint/delay/failed → leesbare melding in **Systeemmeldingen**-paneel
- [x] Getest via curl met echte handtekening (200/401 correct, alert aangemaakt)
- [ ] **Productie:** `RESEND_WEBHOOK_SECRET` moet ook in de productie-env staan + opnieuw deployen. Webhook-URL in Resend dashboard: `https://www.droomvriendjes.com/api/webhook/resend`

### PDF-upload in advanced editor (30 mei 2026)
- [x] Nieuw tabblad **"PDF-bestand"** in `AdminAdvancedProductEditor.jsx` (alleen voor digitale producten)
- [x] Toont huidig gekoppeld bestand (grootte + pagina's + "Bekijken"), drag-drop upload-zone (alleen PDF, max 25 MB) → `POST /api/digital-products/admin/upload` (product_id + file), ververst daarna productdata
- [x] Getest: backend-upload 200 (PDF → storage + `digital_file_path`/`digital_file_size`), 403 zonder auth; UI rendert correct

### Command Center: werkende knoppen + Campagne-planner (30 mei 2026)
- [x] Header-knop **"Nieuwe Campagne"** → opent `CampaignBuilder.jsx` modal: naam, doel (met strategie-hint), product, platforms (Instagram/TikTok/**X Premium**/Meta/Google), budget, datums, **AI-advertentietekst per platform (GPT-5.2)**, launch-links, opslaan
- [x] Header-knop **"Exporteer"** → premium analytics-PDF (`GET /api/marketing-hub/dashboard-pdf`, reportlab: omzet 30d/vandaag, AOV, top-producten)
- [x] Nieuwe **"Campagnes"** menu-sectie: lijst + activeren/pauzeren/verwijderen (`routes/campaigns.py`, MongoDB CRUD `POST/GET/PATCH/DELETE /api/campaigns`)
- [x] Getest: testing agent **9/9 frontend flows (100%)**; backend curl-geverifieerd
- [ ] **Toekomst:** volledige TikTok/X/Meta **API-automatisering** (campagnes echt aanmaken via ad-platform API) — vereist klant-credentials (TikTok Business token + advertiser_id, X API keys) + OAuth app-goedkeuring

### Marketing-mail versturen + HTML-upload met image-hosting (30 mei 2026)
- [x] **Nieuwe admin-pagina** `/admin/nieuwsbrief` (`pages/admin/MarketingMailPage.jsx`, nav-link "Nieuwsbrief versturen" in command center): template kiezen, HTML uploaden, doelgroep + ontvanger-aantal, testmail, bevestiging + verzenden met voortgangsbalk, live preview-iframe
- [x] **HTML-upload met auto image-hosting** (`services/email_html_processor.py` + `POST /api/email-templates/upload-html`): pakt alle `data:image`-base64 uit, host ze op publieke Supabase-bucket `product-images/email-assets/` (dedup op content-hash), **SVG → PNG** (Gmail rendert geen SVG). Bewezen op het aangeleverde bestand: **1199 KB → 23,8 KB, 9 afbeeldingen gehost**, geen data-URI's meer
- [x] Aangeleverde mail toegevoegd als klaarstaande template **"Slaapvriend Nieuwsbrief"** (in Supabase `email_templates`)
- [x] **Test-verzend** `POST /api/email/csv/send-test` (één gepersonaliseerde mail naar jezelf, `[TEST]`-prefix). Getest: mail afgeleverd
- [x] **Bulk-verzenden** via bestaande `POST /api/email/csv/send-campaign` (gebatcht, skip unsubscribed, `{{voornaam}}`/`{{firstname}}`-personalisatie, uitschrijflink + open/klik-tracking), doelgroep per bron kiesbaar, ontvanger-aantal uit `queue/stats` (32.586 contacten in wachtrij)
- [x] **Bevestigingsstap** vóór verzenden (toont template-naam + exact aantal ontvangers + bron, "heb je al getest?"). Voorkomt per ongeluk massaal verzenden
- [x] Getest: backend curl (upload-html, send-test, stats, preview) + e2e screenshots (pagina rendert, live preview, testmail-toast, bevestigingsmodal openen/annuleren). **Bulk-send bewust NIET getriggerd** (32.586 echte contacten)
- [ ] **Bekende beperking:** bestaande `POST/PUT /api/email-templates` (paste-editor) gebruikt verouderde kolomnamen (`active`/`variables`/`cart_link`) die niet in de Supabase-tabel bestaan → faalt. De nieuwe upload-html gebruikt de juiste kolommen (`is_active`/`category`). Editor-fix is backlog.

### Outreach v2 — per-CSV bron + meertalig (NL/DE/FR) (31 mei 2026)
- [x] **Per CSV-bestand**: import tagt leads met `source` (bestandsnaam), bron-filter "Alle bestanden" in UI, en "Verstuur alle nieuwe" respecteert de gekozen bron → per CSV verzenden. Stats `sources[]` (count + new per bron).
- [x] **Taal o.b.v. e-mail-TLD**: `.de`→Duits, `.fr`→Frans, anders Nederlands (`detect_language`). Taal-kolom + filter in UI. 82 bestaande leads gebackfilled (allen NL).
- [x] **Meertalige sjablonen**: 9 templates (3 types × NL/DE/FR), seeded met professionele DE/FR-vertalingen. Sjabloon-editor met type- én taal-tabs (`PUT /templates/{type}/{language}`). `_build_email` kiest template op (type, taal). AI-draft genereert in de taal van de lead.
- [x] Getest: import-taaldetectie (.de/.fr/.nl), 9 templates geseed, stats by_language/sources, e2e screenshots (bron-filter, Taal-kolom, DE-template in editor). Lint schoon.

### CSV-import knoppen op Contacten & Leads (31 mei 2026)
- [x] **Contacten** (`/admin/contacten`): "Importeer CSV"-knop → `/api/email/csv/import` (met bronnaam-prompt). Backend-fix: kolom **"E-mailadres"** (met koppelteken) wordt nu herkend.
- [x] **Leads Bestorming** (`/admin/leads-bestorming`): "Importeer CSV"-knop → bestaande `/api/outreach/import` (idempotent, dedupe op naam+email).
- [x] Getest: Contacten-import (2 toegevoegd, opgeruimd), Leads-import idempotent (re-upload → 0 toegevoegd), beide knoppen zichtbaar (screenshot).
- [!] **Observatie:** 63 outreach-leads kregen status Sent (15 Opened) om 14:19 — verstuurd vanuit PRODUCTIE (gedeelde DB; geen send/track-logs in preview). Bevestigt dat productie nu werkt. Statussen NIET gereset (echte data).

### Leads Bestorming — B2B outreach CRM (31 mei 2026)
- [x] **Nieuwe admin-pagina** `/admin/leads-bestorming` (`pages/admin/LeadsBestormingPage.jsx`, nav-link "Leads Bestorming") + backend `routes/outreach.py` (MongoDB `outreach_leads` + `outreach_templates`, admin-auth)
- [x] CSV-import (`POST /api/outreach/import`): kolommen Naam/Type/E-mailadres/Details → 82 unieke leads (124 rijen, 42 exacte duplicaten gededupliceerd op naam+email; 0 echte leads verloren). Elke lead uniek `id` + `seq` (data-isolatie). 19 zonder geldig e-mail gemarkeerd.
- [x] **Dashboard**: stats per type (slaapcoach 38 / influencer 33 / winkel 11) + status; tabel met #, Naam, Type, E-mail, Details, Status (dropdown, incl. handmatig Replied/Bounced), Datum, Notities (inline), Acties (AI ✨ + Verwijderen). Zoeken + filters + paginering + checkbox-selectie + bulk-verwijderen.
- [x] **Per-type sjablonen** (slaapcoach/influencer/winkel) bewerkbaar met `{{Naam}}`-personalisatie + auto handtekening. `GET/PUT /api/outreach/templates`.
- [x] **AI-personaliseer per lead** (`POST /api/outreach/leads/{id}/ai-draft`, GPT-5.2 via emergentintegrations): schrijft unieke mail o.b.v. type + details; bewerkbaar + opslaan als override. Getest (Daisy → persoonlijke mail).
- [x] **Bulk verzenden** (`POST /api/outreach/send`) via Resend (reply-to info@droomvriendjes.com): alleen leads met geldig e-mail, alleen New/Bounced bij "verstuur alle nieuwe", custom AI-mail wint van sjabloon. Zet status→Sent + timestamp. **Bevestigingsstap** vóór verzenden. Open-tracking pixel (`/api/outreach/track/open/{id}` → status Opened; vereist `SITE_URL`).
- [x] Backend `.env`: `SITE_URL` toegevoegd (preview-URL) voor tracking-pixel + open-tracking.
- [x] Getest: backend curl (import, stats, leads, AI-draft, veilige send naar testlead → Sent, delete) + e2e screenshots (dashboard, tabel, sjabloon-editor). **Echte bulk-send NIET getriggerd** (echte bedrijven — gebruiker verstuurt zelf via bevestiging).

### Bugmeldingen onderzoek (31 mei 2026) — 3 productie-issues
- **Issue 1 (template-upload JSON-fout "Unexpected non-whitespace character"):** code werkt correct in preview (UI-upload maakt template aan) én backend-route bestaat in productie. Oorzaak: browser kreeg niet-JSON antwoord (waarschijnlijk verouderde/gecachte productie-frontend of transient proxy bij grote upload). **Fix:** `safeJson()` in `MarketingMailPage.jsx` toont nu de échte foutmelding i.p.v. de cryptische JSON-parse error. → productie opnieuw deployen + hard refresh.
- **Issue 2 (inbox verzenden "Status 404"):** backend compose+reply werken **200 op productie** (echte mails verzonden vanaf info@droomvriendjes.com via curl). 404 komt dus van een **verouderde productie-frontend**. **Fix:** duidelijkere foutmelding in `InboxPage.jsx` (toont response-tekst + hint om te deployen). → productie opnieuw deployen + hard refresh.
- **Issue 3 (32.624 contacten niet zichtbaar) — OPGELOST:** contacten stonden correct in `email_queue` met geldige e-mails, maar er was geen admin-UI. **Nieuw:** `pages/admin/ContactsPage.jsx` (`/admin/contacten`, nav-link "Contacten") met zoeken, bron-filter, paginering, per-bron stats. Backend `/api/email/csv/queue` uitgebreid met `skip` + `search`.
  - ⚠️ **AVG/reputatie-waarschuwing ingebouwd:** 22.874 `zonnepanelen_leads` + 9.701 `Datafanatics_huiseigenaar` zijn **ingekochte/niet-opt-in lijsten** (geen Droomvriendjes-klanten). Pagina markeert deze als "niet opt-in" met verwijderknop. Marketing hiernaartoe sturen = AVG-overtreding + verwoest domeinreputatie.

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
