# Cloudflare Email Routing → Inbox Setup

Deze gids zet de complete email-ontvangst pipeline op voor `info@droomvriendjes.com`.
Inkomende mails worden via Cloudflare Email Worker realtime naar het dashboard gepusht.

---

## ✅ Wat is al klaar (in code)

- **Backend webhook**: `POST /api/inbox/webhook` (auth: Bearer token)
- **Backend CRUD**: `GET /api/inbox`, `PATCH`, `DELETE`, `POST /reply`, `POST /compose`
- **Dashboard UI**: `/admin/inbox` (3-pane: folders + lijst + lezer)
- **Inbox features**: lezen, beantwoorden, labels, folders (Inbox/Verzonden/Concepten/Spam/Prullenbak), zoeken, ster
- **Outbound**: gaat via TransIP SMTP (`info@droomvriendjes.com`)

---

## 🔑 Webhook Bearer Token

De token staat in `/app/backend/.env`:
```
INBOX_WEBHOOK_TOKEN=hc361jl3yl7-eTlrscpQWjRak9HcYusEJ0srgNPztT4
```
Deze waarde heb je nodig in stap 3 (Cloudflare Worker secret).

---

## Stap 1: Cloudflare Email Routing inschakelen

1. Ga naar https://dash.cloudflare.com → selecteer `droomvriendjes.com`
2. Open **Email → Email Routing** in het linkermenu
3. Klik **Get Started** → Cloudflare voegt automatisch de juiste **MX** + **SPF** records toe (dit overschrijft je huidige TransIP MX!)
4. Maak een **Destination address** aan (een privé adres bv. je gmail) en verifieer het via de mail die Cloudflare stuurt
5. Onder **Routes** kun je nu een catch-all of specifieke routing maken — laat het voor nu leeg, we gaan een Worker maken.

⚠️ **Belangrijk:** als je TransIP momenteel inkomende mail afhandelt, neem dit eerst door — je MX wordt verplaatst naar Cloudflare. Outgoing SMTP (verzenden) blijft gewoon via TransIP werken.

---

## Stap 2: Worker aanmaken

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Create Worker**
2. Naam: `inbox-forwarder` → **Deploy** (standaard hello world)
3. Klik op de worker → **Edit code** en plak onderstaande code:

```javascript
// Cloudflare Email Worker - forwards parsed emails to Droomvriendjes backend
export default {
  async email(message, env, ctx) {
    try {
      // Read raw RFC822 email
      const reader = message.raw.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      // Concatenate chunks
      let totalLen = 0;
      for (const c of chunks) totalLen += c.length;
      const raw = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) { raw.set(c, offset); offset += c.length; }

      // Base64 encode
      const b64 = btoa(String.fromCharCode(...raw));

      // POST to backend webhook
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

      if (!res.ok) {
        console.error(`Backend webhook failed: ${res.status}`);
        // Don't reject — let the email be retried or silently dropped
      }
    } catch (err) {
      console.error("Worker error:", err);
    }
  },
};
```

4. **Save and deploy**

---

## Stap 3: Worker Secrets instellen

In je worker:
1. **Settings → Variables and Secrets**
2. Voeg toe als **Secret** (encrypted):
   - `INBOX_WEBHOOK_TOKEN` = `hc361jl3yl7-eTlrscpQWjRak9HcYusEJ0srgNPztT4`
   - `BACKEND_URL` = `https://droomvriendjes.com` (of `https://mollie-payments-test.preview.emergentagent.com` voor testen)

---

## Stap 4: Email Route koppelen aan Worker

1. Ga terug naar **Email → Email Routing → Routes**
2. **Create address** → voer in:
   - Custom address: `info` (= info@droomvriendjes.com)
   - Action: **Send to a Worker**
   - Worker: `inbox-forwarder`
3. **Save**
4. Optioneel: catch-all instellen om `*@droomvriendjes.com` ook door deze worker te laten gaan.

---

## Stap 5: Testen

1. Stuur een test e-mail vanaf een ander adres naar `info@droomvriendjes.com`
2. Binnen seconden zou hij in `/admin/inbox` moeten verschijnen
3. Check de Worker logs (Cloudflare dashboard → Worker → Logs) als hij niet binnenkomt

**Snelle backend test zonder Cloudflare:**
```bash
curl -X POST https://droomvriendjes.com/api/inbox/webhook \
  -H "Authorization: Bearer hc361jl3yl7-eTlrscpQWjRak9HcYusEJ0srgNPztT4" \
  -H "Content-Type: application/json" \
  -d '{"raw":"From: test@example.com\nTo: info@droomvriendjes.com\nSubject: Test\n\nHallo!"}'
```

---

## Uitleg: hoe werkt verzenden?

Mails verstuurd vanuit het dashboard (Antwoord/Nieuw bericht) gaan via:
- **SMTP host**: `smtp.transip.email:465`
- **From**: `info@droomvriendjes.com`
- **Auth**: SMTP_USER + SMTP_PASSWORD in `/app/backend/.env`

Cloudflare Email Routing ondersteunt **alleen inkomende** mail. Voor outbound blijft TransIP de bezorger.

---

## Troubleshooting

| Probleem | Oplossing |
|----------|-----------|
| Mails komen niet binnen in dashboard | Check Worker logs in Cloudflare, controleer `BACKEND_URL` en token in secrets |
| Worker krijgt 401 | Token komt niet overeen — vergelijk Worker secret met `INBOX_WEBHOOK_TOKEN` in backend `.env` |
| Verzenden vanuit dashboard faalt | TransIP SMTP credentials in `.env` controleren, port 465 SSL |
| Inkomende mail bouncet | Email Routing nog niet geactiveerd of MX records zijn niet correct |

