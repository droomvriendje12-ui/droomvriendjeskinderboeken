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

## CHANGELOG — 2 juni 2026: Blog CMS volledig overzicht (Optie 1) + GA4 promotie-events (getest 100%, iter 34)
**Blog CMS afgerond (Optie 1 — veilig):**
- Probleem: DB-collectie `cms_blogs` was leeg; alle 10 live blogs waren hardcoded in code. Admin toonde niets.
- **3 pure-tekst premium-blogs gemigreerd naar de database** (idempotent seed `backend/scripts/seed_premium_blogs.py` + HTML in `backend/scripts/premium_blogs/`): `witte-ruis-white-noise-baby`, `baby-knuffel-veilig-slapen-leeftijd`, `droomvriendjes-mondriaan-samenwerking`. Renderen nu via `CmsBlogPostPage` vanuit DB (auto-TOC uit h2-ids, FAQ, gerelateerde producten, hero) en zijn **volledig bewerkbaar/verwijderbaar**. Hun 3 dedicated routes zijn verwijderd uit `App.js`.
- **7 blogs met interactieve Printables-upsell** (live prijzen) behouden hun code-layout + dedicated routes (geen omzetrisico); in admin zichtbaar als read-only "Premium"-rij met werkende "Live".
- **AdminBlogCmsPage herbouwd** als één beheeroverzicht: tabel met Titel/Status/Datum/Auteur/Slug/Bewerken/Verwijderen/Bekijk Live, **zoeken** (titel/slug), **statusfilter** (alle/gepubliceerd/concept/premium), **sorteren op datum** (nieuwste/oudste), en stat-chips met **totaal-teller** (Totaal 10, Gepubliceerd 10, Premium 7). `BlogsPage` ontdubbelt via slug-set zodat gemigreerde blogs niet dubbel verschijnen.

**GA4 ecommerce promotie-events (GTM-N7SVX5T4):**
- Nieuw in `utils/analytics.js`: `trackViewPromotion` + `trackSelectPromotion` (GA4-compatibel: promotion_id/promotion_name/creative_name/creative_slot + items).
- **/pro (Printables)**: `view_item_list` ('Droomvriendjes Printables', 8 items) + `view_promotion` (promotion_id `printables_pro`) bij laden; `select_promotion` op hero-CTA (`pro_hero`) en op productkaart-klik (`pro_product_grid`).
- **/quiz**: `view_promotion` (promotion_id `droomvriendje_quiz`, slot `quiz_intro`) bij intro; `select_promotion` op "Start de test"; `view_item_list` ('Quiz Aanbeveling') bij resultaat.
- Geverifieerd in `window.dataLayer` + testing agent (iter 34, 100%).

**Tech debt / content:** 3 verweesde page-componenten (BlogMondriaanPage/BlogBabyKnuffelVeiligPage/BlogWitteRuisPage) niet meer geroute (dead code, onschadelijk). Slug `droomvriendjes-mondriaan-samenwerking` bevat content over 'mentale rust' (trouw aan oude live-pagina) — eventueel titel/slug door eigenaar bij te werken via CMS. **Deploy vereist.**


## CHANGELOG — 1 juni 2026 (nacht, vervolg): Bulk feed-optimalisatie + GTM-container
- **"AI-optimaliseer alle"-knop** in de Shopping Feed Builder (`ShoppingFeedBuilderPage.jsx`): optimaliseert in 1 klik alle producten met Shopping SEO < 85% via client-side sequentiële loop op `POST /api/shopping-feed/optimize`, met **live voortgangsmodal** (done/total, huidig product, voortgangsbalk, gelukt/mislukt) — zelfde patroon als bulk-personalisatie in Leads Bestorming. Knop toont live de teller van te-optimaliseren producten. Daarna auto-refresh van de audit-scores.
- **Google Tag Manager vervangen**: oude container `GTM-W9PZRP4B` volledig vervangen door **`GTM-N7SVX5T4`** in `public/index.html` (head-script + noscript-fallback). Eén actieve container → geen dubbel afvuren van tags/conversies. Geverifieerd in geserveerde HTML na frontend-restart.


## CHANGELOG — 1 juni 2026 (nacht): SEO/GEO afronding + AI Search Ads + AI Shopping Feed Builder (getest 100%)
**Fase 1 — SEO/GEO/AI Search productie-klaar:**
- `ProductPage.jsx`: nieuwe useEffect zet `document.title`, meta-description, **canonical**, **Open Graph** (og:type=product, title, description, url, image, product:price), **Twitter/X** (summary_large_image). JSON-LD bevat al Product + FAQPage + BreadcrumbList + Review.
- **Dubbele FAQPage opgelost**: `TrendingQuestions.jsx` kreeg prop `emitSchema` (default true). ProductPage, BlogPostLayout én HomePage geven `emitSchema={false}` → exact 1 FAQPage per pagina (Google-conform). Bevestigd via testing agent.
- `BlogPostLayout.jsx` had al BlogPosting + FAQ + Breadcrumb JSON-LD + OG + Twitter + canonical (CMS-blogs via `CmsBlogPostPage` erven dit).
- **Sitemap** (`blog-cms/sitemap.xml`) uitgebreid met **alle productpagina's** (Supabase, fysiek + digital, prio 0.9) naast 7 statische pagina's en 10 blogs → 35 URLs. Submit op `{domain}/api/blog-cms/sitemap.xml`.

**Fase 2 — Leads Bestorming trefwoord-outreach + Instagram/TikTok-fix:**
- Geverifieerd: AI-draft (`/api/outreach/leads/{id}/ai-draft`) wordt gestuurd door **trefwoorden (3-5)** + **campagne/doel** (UI-velden `ai-keywords-input`/`ai-campaign-input`), verplicht verwerkt in de mail; werkt ook in bulk-personalisatie. Spam-guardrails intact (50/req, 150/dag, 0,5s throttle).
- **Root cause Instagram/TikTok "niet verzonden"**: 19/33 influencers hebben **geen e-mailadres** (alleen contactform-URL zoals `via kimvanoncen.be`) → silently overgeslagen door `email_valid`-filter (geen DM-API). Fix: contact-hint wordt nu een **klikbare "Benader via website ↗"-link** in de tabel + waarschuwing in de verzend-bevestiging dat deze leads handmatig benaderd moeten worden (met AI-personaliseer om de tekst klaar te zetten).

**Fase 3 — AI Search Campagne Builder (`/admin/ads-builder`, `routes/ads_builder.py`):**
- GPT-5.2 genereert complete Google Search-campagne: zoekwoorden (exact/phrase), 3-4 advertentiegroepen, RSA headlines (≤30t) + descriptions (≤90t, lengte-validatie in UI), sitelinks, callouts, structured snippets, negatieve zoekwoorden. **CSV-export** Google Ads Editor-compatibel (`/api/ads-builder/export-csv`). Route was aanwezig maar niet aangesloten → nu gewired in `server.py`.

**Fase 4 — AI Shopping Feed Builder (`/admin/shopping-feed-builder`, `routes/feed_builder.py`):**
- **Optimalisatielaag bovenop** bestaande `/api/feed/google-shopping.xml` (blijft ongewijzigd/bron). `GET /audit`: per product **Merchant Center readiness-score** + **Shopping SEO-score**, ontbrekende attributen, **GTIN/EAN-validatie (check-digit)**, categorie- + product_type-suggestie. `POST /optimize`: GPT-5.2 optimaliseert titel + beschrijving + product_type + Google-categorie, opgeslagen als override in MongoDB `feed_overrides`. **CSV + XML export** (`/export.csv`, `/export.xml`) passen overrides toe. Modulair opgezet voor latere Google Merchant API-koppeling.
- Getest: 18 producten, gem. MC-readiness 100%, gem. Shopping SEO 69% (na 1 optimalisatie 70%), 18× GTIN ontbreekt (eigen merk → identifier_exists=no, geen blocker).

**Testing:** iteration_33 → backend **13/13 pytest (100%)**, frontend **4/4 e2e (100%)**. Geen kritieke issues. Regressie-test: `/app/backend/tests/test_iteration33_seo_ads_feed.py`. **Vereist deploy naar productie.**


## CHANGELOG — 1 juni 2026 (laat): Blog CMS (fase 1 van SEO/GEO-dominantie)
Volwaardig blog-CMS in het admin-dashboard (`/admin/blog-cms`):
- **Backend** `routes/blog_cms.py` + MongoDB `cms_blogs`: CRUD, foto-upload → Supabase (`product-images/blog/cms`, PIL-geoptimaliseerd), AI-schrijfknop (GPT-5.2 → SEO/GEO-JSON: title, seo_title, meta, H2-structuur, FAQ's, interne links, related products), publieke endpoints (`/public/posts`, `/public/posts/{slug}`). Draft/published status.
- **Frontend admin** `AdminBlogCmsPage.jsx`: lijst + editor (titel, slug auto, categorie, tags, SEO-titel, meta, excerpt, HTML-content, FAQ's, foto-upload, AI-modal, Concept/Publiceren/Verwijderen). Nav-tegel toegevoegd in dashboard.
- **Frontend publiek** `CmsBlogPostPage.jsx` op `/blog/:slug` (hergebruikt BlogPostLayout met Article/FAQ/Breadcrumb JSON-LD). `BlogsPage` merge't gepubliceerde CMS-posts automatisch in de lijst. Bestaande 10 premium-blogs blijven behouden.
- Getest: CRUD (curl) + AI-generate (7300-tekens SEO-blog met H2/links/FAQ) + e2e (CMS-post rendert op eigen pagina + /blogs; admin-editor toont alle velden).

**Nog te bouwen (SEO/GEO-dominantie, gefaseerd):** product-schema's (Product/FAQ/Breadcrumb/Review + trust/voordelen/use-cases/interne links), AI Search Ads Builder (CSV/Editor-export), AI Shopping Feed Builder (XML/CSV + scores), trefwoord-gestuurde AI-outreach.


## CHANGELOG — 1 juni 2026 (avond): 14-dagen retour + conversie-tracking
- **Retour gecorrigeerd 30 → 14 dagen** (klant had 14, niet 30): `VrouwenLandingPage.jsx` (trial/geld-terug teksten), `AdminCommandCenter.jsx` (warranty-default → "14 dagen retourrecht"), `routes/inbox.py` AI-kennisbank ("Retourneren binnen 14 dagen"). De checkout had al correct een "14 Dagen Retour"-kaart.
- **GA4-funnel gecompleteerd**: `CheckoutPage.jsx` vuurt nu `begin_checkout` (bij laden) en `add_payment_info` (vóór Mollie-redirect) — voorheen geïmporteerd maar niet aangeroepen. `purchase` werd al afgevuurd in `PaymentResultPage`. Dit verbetert conversie-tracking in GA4 + Ads-optimalisatie.
- **Google Ads-conversie env-gestuurd**: kapotte placeholder `AW-XXXXX/XXXXX` vervangen door `REACT_APP_GOOGLE_ADS_PURCHASE_CONVERSION` (vuurt alleen als geconfigureerd).
- **Dashboard**: admin toont al orders + omzet via `/api/admin/dashboard`.
- **Analyse**: "0 conversies" in GA4 komt vooral door weinig gekwalificeerd verkeer (grootste deel = eigen dev-verkeer via app.emergent.sh + bot-steden Council Bluffs/Warsaw/Casablanca), niet door kapotte tracking.


## CHANGELOG — 1 juni 2026 (later): Robuuste lead-import + anti-spam guardrail
**Import "0 toegevoegd" opgelost** (`routes/outreach.py` `/import`):
- Auto-detectie scheidingsteken (`,` / `;` / tab) → loste NL-bestand met `;` op.
- Meertalige kolomnamen: Naam/Name/Nom, Email/E-mail/E-Mail/Mail, Type/Typ, etc.
- `details` opgebouwd uit overige kolommen (Plaats/Provincie/Ville/Stadt).
- Type-mapping via keywords → slaapcoach/influencer/winkel (default winkel).
- Taal o.b.v. e-mail-TLD (.de/.fr/.nl) met fallback op bestandsnaam (wallonie→fr, germany→de).
- `insert_many` + dedupe; retourneert `added` + `skipped_duplicates`.
- Getest: 3 CSV's geparseerd (NL 1250 / BE-Wallonië 1000 fr / DE 1500 de = 3750 leads, alle geldig) + end-to-end endpoint (added/dedup werkt).

**Anti-spam guardrail** (`/send`): per-request limiet **50**, dag-limiet **150** (telt vandaag verzonden), throttle **0,5s** tussen mails. Frontend toont limiet-melding. Beschermt domeinreputatie + blijft onder Resend-limieten.


## CHANGELOG — 1 juni 2026: E-mail UX + AI Smart Assist + B2B-pagina (getest 100%)
**Fase 1 — E-mail interface (Inbox):**
- 📎 Drag & drop + bestand-upload bijlagen in Inbox reply + compose (`AttachmentPicker` in InboxPage.jsx). Verzonden via Resend (`attachments` param in `email_sender.py`), metadata opgeslagen ZONDER base64 (privacy/size). Limiet 15 MB front / 25 MB back → 413.
- 🎨📱 WCAG-contrast + mobile-first: nieuwe `services/email_wrapper.py` wrapt elke reply/compose in een licht kaart-template (#FFFFFF, donkere tekst #2A2A2A) met responsive media-query (grotere fonts + full-width knoppen op mobiel). Toegepast in `inbox.py` `_send_smtp`.

**Fase 2 — OpenAI Smart Assist (human-in-the-loop):**
- 🤖 `POST /api/inbox/{id}/ai-draft` (admin) genereert een concept-antwoord via GPT-5.2 (Emergent LLM Key) op basis van de brochure-kennisbank (`INBOX_AI_KB` in inbox.py: prijzen, 2200 mAh, BT 5.0, 5-120 lux, bio-katoen, CE/EN71/RoHS/REACH, 2u USB-C, 0-6 jr, levertijden, retour). Knop "AI-concept antwoord" (`ai-draft-btn`) vult de reply-editor — wordt NOOIT automatisch verzonden.

**Fase 3 — B2B-pagina `/b2b`:**
- Professionele landingspagina in warme huisstijl (`B2BPage.jsx`): 10 modellen + prijzen (€49,95–€89,95), technische specs-tabel, partnervoordelen, CTA naar partners@droomvriendjes.com.
- 🔒 Staffelkortingen-tabel ontgrendeld via partnercode **ZOETESLAPERS** (hoofdletterongevoelig): €34,95 / €28,50 / €24,00 / op aanvraag. Alleen tonen op B2B-pagina (geen checkout-integratie — bewuste keuze).
- 📋 Onderzoek-aanmeldformulier (`POST /api/b2b/research-signup`, publiek) → slaat op in **Leads Bestorming** (`outreach_leads`, source "B2B Onderzoek"). Vragen over belang licht & geluid voor kinderslaap 0-6 jr.

**Testing:** iteration_32 → backend 8/8 (100%), frontend 100%. Regressie-pytest: `/app/backend/tests/test_iteration32_new_features.py`. Niet-blokkerend/pre-existing: inbox-zoekfilter reduceert rijen pas na submit.
**Vereist deploy naar productie.**


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

### Blog SEO-uitbreiding: officieel logo + lifestyle-foto's + 4 nieuwe blogs (31 mei 2026)
- [x] **Officieel logo** (`/logo.svg`) overal op de blogs i.p.v. losse imgur/Supabase-PNG (BlogsPage, BlogPostLayout, BlogSlaaptips, BlogStress).
- [x] **Geen productfoto's meer**: alle 10 blog-afbeeldingen vervangen door vrij te gebruiken Pexels-lifestyle-foto's (slapend kind, knuffel+nachtlampje, avondroutine), geoptimaliseerd (1200px, ~80KB JPEG) en gehost op Supabase `product-images/blog/`. Vervangen in BlogsPage, blogPosts.js én de 6 detailpagina-hero's.
- [x] **4 nieuwe SEO-blogs** met volledige detailpagina (BlogPostLayout + Article/FAQ/Breadcrumb JSON-LD), route + blogPosts.js-entry + card:
  - `/blog/baby-knuffel-veilig-slapen-leeftijd` (Veilig slapen)
  - `/blog/slaapregressie-bij-kinderen` (Babyslaap, met slaaplog-CTA)
  - `/blog/witte-ruis-white-noise-baby` (Wetenschap)
  - `/blog/avondroutine-kind-7-stappen` (Slaaptips, met bedtijdschema-CTA → Printables)
- [x] **/blogs toont 9 blogs** (1 uitgelicht + 8 grid via `.slice(0,8)`); totaal 10 blogs hebben een detailpagina.
- [x] Getest: e2e screenshots (/blogs: 10 afbeeldingen 0 kapot, 9 cards; nieuwe detailpagina rendert met TOC+FAQ+logo, 0 kapotte beelden). Lint schoon. **Vereist deploy naar productie.**


### Blogs-pagina afbeeldingen + logo fix (31 mei 2026)
- [x] **Probleem:** logo (imgur `IESI44c.png`) en blog-afbeeldingen waren kapot op `/blogs`. Oorzaak: imgur blokkeert hotlinking in de browser; Unsplash-afbeelding `photo-1564429097439` gaf **404**.
- [x] **Echte logo** (beertje-op-maan + "droomvriendjes.nl") geoptimaliseerd (400×400, 115KB) geüpload naar Supabase: `product-images/branding/droomvriendjes-logo.png`. Alle imgur-logo-refs vervangen in `BlogsPage.jsx`, `BlogPostLayout.jsx`, `BlogSlaaptipsPage.jsx`, `BlogStressKnuffelsPage.jsx`.
- [x] Alle Unsplash-blog-afbeeldingen vervangen door betrouwbare Supabase-knuffels (unicorn/penguin/lion) in `BlogsPage.jsx`, `BlogSlaaptipsPage.jsx`, `data/blogPosts.js`.
- [x] Getest: e2e screenshot + `naturalWidth>0` op alle 7 afbeeldingen (logo + sheep/bear/panda/unicorn/penguin/lion) → allemaal OK. Lint schoon. **Vereist deploy naar productie.**


### Bulk AI-personalisatie Leads Bestorming + live voortgangsbalk (31 mei 2026)
- [x] **Knop "AI-personaliseer (N)"** in toolbar van `/admin/leads-bestorming` (fuchsia, tussen Verwijder en Verstuur selectie) → genereert in één klik GPT-5.2 persoonlijke mails voor alle geselecteerde leads, elk in juiste taal (NL/DE/FR o.b.v. TLD).
- [x] **Live voortgangsmodal**: client-side sequentiële iteratie roept per lead `POST /api/outreach/leads/{id}/ai-draft` aan en toont real-time "X / Y mails geschreven", "Nu bezig: <naam>", een voortgangsbalk + teller gelukt/mislukt. Leads die al een `custom_email` hebben worden overgeslagen. Bevestigingsprompt vooraf + resultaat-toast.
- [x] Backend: gerefactorde herbruikbare helper `_generate_ai_for_lead()` (gebruikt door de single-draft route). (Eerder bulk-endpoint vervangen door client-side iteratie voor echte per-lead voortgang.)
- [x] Getest via curl (NL+DE → correcte talen) + e2e screenshot (voortgangsmodal toont "0/2 mails · Nu bezig: ProgressTest Eva" met balk; Eva NL-mail gegenereerd). Lint schoon.

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
- [x] **P0 geverifieerd (31 mei 2026):** Leads-import in preview gaat correct naar `outreach_leads` (NIET naar Contacten/`email_queue`). Curl-test: CSV-upload → lead in Leads-dashboard met juiste taal (.de→Duits) + source. Eerdere klacht was oude **productie**-code → her-deployen lost op.

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
