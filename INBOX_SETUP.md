# 📬 Cloudflare Email Worker → Droomvriendjes Inbox

Volledige setup-handleiding voor het ontvangen van mail op `info@droomvriendjes.com` via Cloudflare Email Routing, met realtime push naar het admin dashboard (`/admin/inbox`).

> ⏱️ **Setup tijd:** ~10 minuten · **Vereist:** Cloudflare account met droomvriendjes.com gekoppeld

---

## 📑 Inhoudsopgave

1. [Hoe werkt het?](#hoe-werkt-het)
2. [Wat is al klaar?](#wat-is-al-klaar)
3. [Environment variables](#environment-variables)
4. [Stappenplan (5 stappen)](#stappenplan)
   - [Stap 1: Email Routing inschakelen](#stap-1-email-routing-inschakelen)
   - [Stap 2: Worker aanmaken](#stap-2-worker-aanmaken)
   - [Stap 3: Worker secrets instellen](#stap-3-worker-secrets-instellen)
   - [Stap 4: Email koppelen aan Worker](#stap-4-email-koppelen-aan-worker)
   - [Stap 5: Testen](#stap-5-testen)
5. [Verzenden & replies](#verzenden--replies)
6. [Troubleshooting](#troubleshooting)

---

## Hoe werkt het?

```
       ┌──────────────────┐    1. Iemand mailt info@droomvriendjes.com
       │  External sender │
       └────────┬─────────┘
                ▼
       ┌──────────────────┐    2. Cloudflare ontvangt via MX records
       │ Cloudflare Email │
       │      Routing     │
       └────────┬─────────┘
                ▼
       ┌──────────────────┐    3. Worker pakt mail op, encodet base64
       │ inbox-forwarder  │
       │      Worker      │
       └────────┬─────────┘
                ▼ POST /api/inbox/webhook
       ┌──────────────────┐    4. FastAPI parsed RFC822, slaat op in DB
       │  Droomvriendjes  │
       │     Backend      │
       └────────┬─────────┘
                ▼ realtime
       ┌──────────────────┐    5. Verschijnt direct in dashboard
       │  /admin/inbox    │
       │   (admin user)   │
       └──────────────────┘
```

**Verzending** (replies + new) gaat **niet** via Cloudflare — die kan alleen ontvangen. We gebruiken TransIP SMTP voor outbound.

---

## Wat is al klaar?

Alle backend en frontend code is af. Je hoeft alleen de Cloudflare-kant in te stellen.

- ✅ Webhook ontvangst: `POST /api/inbox/webhook` (auth: Bearer)
- ✅ Backend parser: MIME → plaintext + HTML + attachments
- ✅ Dashboard UI: `/admin/inbox` (3-pane Gmail-style)
- ✅ Folders: Inbox, Verzonden, Concepten, Spam, Prullenbak
- ✅ Acties: lezen, beantwoorden, ster, label, zoeken
- ✅ Outbound SMTP (TransIP) voor replies en nieuwe mails
- ✅ Threading via `In-Reply-To` header

---

## Environment variables

Alle benodigde keys staan al in `/app/backend/.env`:

| Variable | Where it lives | Purpose |
|----------|---------------|---------|
| `INBOX_WEBHOOK_TOKEN` | Backend `.env` **+** Worker secret | Bearer-auth tussen Worker en webhook |
| `SMTP_HOST=smtp.transip.email` | Backend `.env` | Outbound SMTP server |
| `SMTP_PORT=465` | Backend `.env` | SSL poort voor TransIP |
| `SMTP_USER=info@droomvriendjes.com` | Backend `.env` | TransIP login |
| `SMTP_PASSWORD=•••` | Backend `.env` | TransIP password |
| `BACKEND_URL` | Worker secret | Waar de Worker naar POST't (productie of preview URL) |

> 🔐 Het token kun je vinden in `/app/backend/.env` of vragen aan een teamlid. Bij twijfel: rotate `INBOX_WEBHOOK_TOKEN` (zet een nieuwe waarde in zowel `.env` als Worker secret).

---

## Stappenplan

### Stap 1: Email Routing inschakelen

1. Ga naar **https://dash.cloudflare.com** → selecteer **droomvriendjes.com**
2. Open **Email → Email Routing** in het linkermenu
3. Klik **Get Started**
   - ⚠️ Cloudflare voegt automatisch **MX-records + SPF** toe — dit overschrijft eventuele bestaande MX-records bij TransIP
   - Outbound SMTP (verzenden) blijft via TransIP werken
4. **Destination address** instellen (je privé Gmail bv.) en de verificatiemail bevestigen
5. Laat **Routes** voor nu nog leeg

✅ **Klaar wanneer:** Email Routing dashboard toont "Configured" status bovenaan.

---

### Stap 2: Worker aanmaken

1. **Workers & Pages → Create application → Create Worker**
2. Naam: `inbox-forwarder` → **Deploy** (laat de hello-world template staan)
3. Open de Worker → **Edit code** → vervang de hele inhoud met:

```javascript
// Cloudflare Email Worker — forwards inbound mail to Droomvriendjes backend
export default {
  async email(message, env, ctx) {
    try {
      // 1) Lees de raw RFC822 message
      const reader = message.raw.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // 2) Concatenate en base64-encodeer
      let totalLen = 0;
      for (const c of chunks) totalLen += c.length;
      const raw = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) { raw.set(c, offset); offset += c.length; }
      const b64 = btoa(String.fromCharCode(...raw));

      // 3) POST naar de backend webhook
      const res = await fetch(`${env.BACKEND_URL}/api/inbox/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.INBOX_WEBHOOK_TOKEN}`,
        },
        body: JSON.stringify({
          raw_b64: b64,
          from: message.from,
          to: message.to,
        }),
      });

      // 4) Log fouten — geen reject, zodat een tijdelijke backend-storing
      //    geen bounces naar de afzender produceert
      if (!res.ok) {
        console.error(`Backend webhook failed: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.error("Worker error:", err);
    }
  },
};
```

4. Klik **Save and deploy**

---

### Stap 3: Worker secrets instellen

1. In je Worker → **Settings → Variables and Secrets**
2. Voeg toe als **Secret** (encrypted, klik op "Add" → kies "Secret"):

| Naam | Waarde |
|------|--------|
| `INBOX_WEBHOOK_TOKEN` | Zelfde waarde als in `/app/backend/.env` (zie boven) |
| `BACKEND_URL` | `https://droomvriendjes.com` voor productie<br>`https://ecommerce-digits.preview.emergentagent.com` voor preview testing |

> 💡 Tip: maak je een test-Worker (`inbox-forwarder-preview`) met de preview URL, dan kun je naast productie testen.

---

### Stap 4: Email koppelen aan Worker

1. Ga naar **Email → Email Routing → Routes**
2. Klik **Create address**:
   - **Type**: Custom address
   - **Address**: `info` (resulteert in `info@droomvriendjes.com`)
   - **Action**: **Send to a Worker**
   - **Worker**: `inbox-forwarder`
3. **Save**

**Optioneel:** Catch-all aanzetten zodat `*@droomvriendjes.com` ook via deze Worker gaat:

1. Bij **Catch-all address** → **Edit**
2. **Action**: Send to a Worker → `inbox-forwarder` → **Save**

---

### Stap 5: Testen

#### A. Backend-only test (zonder Cloudflare)

```bash
TOKEN=$(grep INBOX_WEBHOOK_TOKEN /app/backend/.env | cut -d= -f2)
curl -X POST https://droomvriendjes.com/api/inbox/webhook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"raw":"From: test@example.com\nTo: info@droomvriendjes.com\nSubject: Test\n\nHallo!"}'
```

Verwacht antwoord:
```json
{"ok": true, "message_id": "..."}
```

Check `/admin/inbox` — de test mail moet binnen 1 seconde verschijnen.

#### B. End-to-end test (echte mail)

1. Stuur vanaf een **extern adres** (Gmail, Outlook) een mail naar `info@droomvriendjes.com`
2. Open Cloudflare → Worker → **Logs** (live tail)
   - Je moet `Backend webhook ok` zien (geen "failed")
3. Open `/admin/inbox` → de mail staat in de Inbox-folder
4. Klik op de mail → tekst + eventuele bijlagen zichtbaar
5. Klik **Beantwoorden** → typ tekst → **Verzenden** → afzender krijgt antwoord vanaf `info@droomvriendjes.com`

---

## Verzenden & replies

Outbound mails (replies + nieuwe berichten vanuit het dashboard) gaan **niet via Cloudflare** maar via TransIP SMTP:

- **Host**: `smtp.transip.email`
- **Port**: `465` (SSL)
- **From**: `info@droomvriendjes.com`
- **Auth**: `SMTP_USER` + `SMTP_PASSWORD` uit `/app/backend/.env`

**Reply-threading:** Bij beantwoorden zet de backend automatisch de `In-Reply-To` en `References` headers, zodat Gmail/Outlook de conversatie blijft groeperen.

---

## Troubleshooting

| Probleem | Oplossing |
|----------|-----------|
| Mail komt niet binnen in dashboard | 1. Cloudflare Worker → Logs checken<br>2. `BACKEND_URL` secret juist? Test met `curl $BACKEND_URL/api/inbox/webhook -X POST` (verwacht 401)<br>3. Backend log: `tail -f /var/log/supervisor/backend.err.log` |
| Worker krijgt **401 Unauthorized** | Token mismatch. Vergelijk `INBOX_WEBHOOK_TOKEN` in Worker secret met `/app/backend/.env`. Spaces / quotes / trailing newlines? |
| Worker krijgt **500** | Backend is offline of de webhook parse faalde. Check backend logs voor stack trace. |
| Mail bounced terug naar afzender | Email Routing nog niet geactiveerd of MX records nog niet gepropageerd. Wacht 15 min, controleer **Email → Overview** dat status "Active" is. |
| Verzenden vanuit dashboard faalt | TransIP credentials in `.env`. Test met:<br>`python3 -c "import smtplib; s=smtplib.SMTP_SSL('smtp.transip.email', 465); s.login(USER, PWD); print('OK')"` |
| Bijlagen ontbreken | Cloudflare Email Worker heeft een **24MB limiet** op message size. Grote bijlagen worden geweigerd. |
| Catch-all werkt niet | Cloudflare's catch-all kan alleen ingeschakeld worden als **alle** specifieke routes ook actief zijn. Check `/admin/inbox` filters. |

### Debug script

```bash
# Verifieer dat alle env vars aanwezig zijn:
cd /app/backend && python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
for k in ('INBOX_WEBHOOK_TOKEN', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'):
    v = os.environ.get(k, '<MISSING>')
    print(f'{k}: {\"*\" * len(v) if v != \"<MISSING>\" else v}')
"
```

---

## Architectuur referenties

| Bestand | Functie |
|---------|---------|
| `/app/backend/routes/inbox.py` | Webhook endpoint + parsing + CRUD |
| `/app/frontend/src/pages/admin/AdminInboxPage.jsx` | Dashboard UI |
| `/app/backend/services/email_sender.py` | TransIP SMTP outbound |

