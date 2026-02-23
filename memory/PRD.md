# Droomvriendjes - Product Requirements Document

## Latest Update: 1 February 2026

### Completed This Session (1 Feb):
- ✅ **REVIEWS CSV IMPORTER TOOL** - Admin functie om reviews te importeren
  - Nieuwe admin pagina: `/admin/product-reviews-importer`
  - Backend API: `POST /api/reviews/import-csv`
  - Productselectie dropdown voor import
  - CSV template download functie
  - Reviews overzicht met zoek en filter
  - Verwijder functie per review
  - Statistieken dashboard (totaal reviews, per product)
  - Password protected via admin auth
- ✅ **Dashboard link** - Review importer toegevoegd aan admin Quick Actions

### Previously Completed (30 Jan):
- ✅ **5 NIEUWE PRODUCTEN TOEGEVOEGD** met professionele afbeeldingen
  - Duo Set (ID 6) - Leeuw & Schaapje combinatie
  - Bruine Beer (ID 7) - Met sterrenprojector
  - Liggend Schaapje (ID 8) - Knuffelbaar in bed
  - Pinguïn (ID 9) - Poolnacht thema
  - Grijze Teddy (ID 13) - Premium uitvoering
- ✅ **mockData.js SYNTAX ERROR GEFIXED** - Frontend compileert weer
- ✅ **SEO LANDING PAGES BUG GEFIXED** - Dynamische content werkt nu

### Previously Completed (29 Jan):
- ✅ **GOOGLE ADS API KOPPELING** - Automatisch campagnes aanmaken
  - `POST /api/google-ads/campaigns/create-predefined` endpoint
  - `POST /api/google-ads/campaigns/bulk-create` endpoint
  - Support voor Performance Max, Standard Shopping, Demand Gen, Search
- ✅ **CAMPAIGN MANAGEMENT DASHBOARD** - `/admin/campaigns`
  - Visueel overzicht van 20 campagnes
  - One-click import naar Google Ads
  - Selectie per campagne of allemaal
- ✅ **20 SHOPPING CAMPAGNES** - SEO & SEA geoptimaliseerd
  - 5x Performance Max (€105/dag)
  - 5x Standard Shopping (€75/dag)
  - 5x Demand Gen (€65/dag)
  - 5x Search/SEA (€83/dag)
  - Totaal: €328/dag
- ✅ **VERZENDING PAGINA** - `/verzending` voor Google Merchant compliance
- ✅ **PRODUCT SCHEMA.ORG** - Structured data op ProductPage

### Previous Sessions Completed:
- ✅ **WARM BROWN THEME** - Volledige website redesign
- ✅ **NIEUW LOGO** - Geïmplementeerd
- ✅ **BEDRIJFSGEGEVENS** - KVK: 99210835, BTW: NL204392123B01
- ✅ **EMAIL CAMPAGNE BACKEND** - 43.629 contacten geïmporteerd
- ✅ **KORTINGSCODE WELKOM15** - 15% korting actief
- ✅ **GOOGLE MERCHANT COMPLIANCE** - Schema.org, Trustpilot widget

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI (modulaire structuur), Motor (Async MongoDB), Pydantic
- **Database:** MongoDB Atlas
- **Integrations:** Mollie (Payments), Sendcloud (Shipping), SMTP (Email), Google Ads API

---

## Current Blockers

### 🟠 P1 - Google Ads OAuth Configuratie
- **Status:** BLOCKED (user action required)
- **Issue:** User moet redirect URIs toevoegen in Google Cloud Console
- **Benodigde URIs:**
  - `https://droomvriendjes.nl/admin/google-ads/callback`
  - `https://remove-old-products.preview.emergentagent.com/admin/google-ads/callback`
- **Actie:** User moet dit configureren in Google Cloud Console

### 🔴 P0 - Email Campagne SMTP Limiet
- **Status:** BLOCKED
- **Issue:** TransIP SMTP dagelijkse verzendlimiet bereikt
- **Oplossing:** 24 uur wachten of Brevo/SendGrid integreren
- **Nog te versturen:** ~42.000 emails

### 🔴 P0 - Deployment Vereist
- **Status:** PENDING USER ACTION
- **Issue:** Alle wijzigingen zijn in preview, niet op productie
- **Actie:** Gebruiker moet op "Deploy" klikken

---

## Shopping Campaigns Overview

### Performance Max (5 campagnes)
1. PMAX - Slaapknuffels Algemeen (€25/dag, ROAS 400%)
2. PMAX - Baby & Peuter (€20/dag, ROAS 350%)
3. PMAX - Cadeau & Seizoen (€30/dag, ROAS 300%)
4. PMAX - Premium Producten (€15/dag, ROAS 500%)
5. PMAX - Retargeting Converters (€15/dag, ROAS 600%)

### Standard Shopping (5 campagnes)
6. Shopping - Bestsellers (€20/dag, ROAS 450%)
7. Shopping - Nieuwe Producten (€10/dag, Max Clicks)
8. Shopping - Budget Vriendelijk (€12/dag, ROAS 350%)
9. Shopping - België Focus (€15/dag, ROAS 380%)
10. Shopping - Bundels & Sets (€18/dag, ROAS 420%)

### Demand Gen (5 campagnes)
11. Demand Gen - Slaapproblemen (€15/dag, CPA €12)
12. Demand Gen - Emotioneel Verhaal (€12/dag, CPA €15)
13. Demand Gen - YouTube Discovery (€20/dag, Max Conv)
14. Demand Gen - Gmail Ads (€8/dag, CPA €10)
15. Demand Gen - Discover Feed (€10/dag, Max Clicks)

### Search/SEA (5 campagnes)
16. Search - Brand Terms (€5/dag, 95% Imp Share)
17. Search - High Intent Keywords (€25/dag, ROAS 400%)
18. Search - Problem-Aware Keywords (€20/dag, Max Conv)
19. Search - Competitor Keywords (€15/dag, CPA €15)
20. Search - Gift Keywords (€18/dag, ROAS 350%)

---

## Key SEO Keywords

### Primary (Hoge prioriteit)
- slaapknuffel
- knuffel nachtlampje
- baby nachtlamp
- slaapknuffel kopen
- kraamcadeau

### Secondary
- sterrenprojectie knuffel
- white noise knuffel
- baby slaapknuffel
- peuter nachtlampje
- kind slaapt niet door

### Long-tail
- knuffel met sterrenprojector
- slaapknuffel met licht en geluid
- beste slaapknuffel voor baby
- origineel kraamcadeau

---

## Upcoming Tasks (P1)

1. **Product Data Migratie** - mockData.js naar MongoDB (KRITIEK)
2. **Google Ads OAuth** - User moet redirect URIs configureren
3. **Email Campagne Hervatten** - Na 24 uur wachten
4. **Google Merchant Review** - Na deployment aanvragen

## Future Tasks (P2+)

- Admin panel thema bijwerken naar warm-brown
- Google Wallet Loyalty Program
- Cadeaubon flow testen
- Sendcloud verzendlabels testen
- server.py refactoring

---

## Key API Endpoints

### Shopping Campaigns
- `GET /api/feed/google-shopping.xml` - Google Shopping feed
- `GET /api/google-ads/campaigns` - Huidige campagnes
- `POST /api/google-ads/campaigns/create` - Nieuwe campagne

### Email Marketing
- `GET /api/admin/email-campaign/stats` - Statistieken
- `POST /api/admin/email-campaign/send-batch` - Batch verzenden
- `GET /api/admin/email-campaign/monitor` - Monitoring

---

## Credentials (Test)
- **Admin:** admin / Droomvriendjes2024!
- **Mollie:** Keys in /app/backend/.env
- **SMTP:** info@droomvriendjes.nl

---

## Notes
- Productie URL: www.droomvriendjes.nl (vereist deployment)
- Preview URL: droomvriendjes.preview.emergentagent.com
- Alle wijzigingen vereisen deployment om live te gaan
