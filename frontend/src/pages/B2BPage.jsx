import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Sparkles, BatteryCharging, Bluetooth, Sun, Volume2, ShieldCheck, Leaf,
  Clock, Baby, Mail, Lock, CheckCircle2, ArrowRight, Loader2, Package,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL;
const PIMG = 'https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/';

const PRODUCTS = [
  { name: 'Slimme Leeuw', price: '€ 49,95', desc: 'AI-huilsensor & projector', img: 'lion-main.png' },
  { name: 'Slaperig Schaapje', price: '€ 54,95', desc: 'Projector & 60 melodieën', img: 'sheeptwo-main.png' },
  { name: 'Slaperige Panda', price: '€ 54,95', desc: 'Projector & 60 melodieën', img: 'panda-main.png' },
  { name: 'Stoere Dinosaurus', price: '€ 54,95', desc: 'Projector & 60 melodieën', img: 'dino-main.png' },
  { name: 'Magische Eenhoorn', price: '€ 54,95', desc: 'Projector & 60 melodieën', img: 'unicorn-main.png' },
  { name: 'Bruine Beertje', price: '€ 49,95', desc: 'Sterrenprojector & slaapgeluiden', img: 'bearbrown-main.png' },
  { name: 'Liggend Schaapje', price: '€ 49,95', desc: 'Sterrenprojectie & slaapmelodieën', img: 'sheep-main.png' },
  { name: 'Pinguïn Droomvriendje', price: '€ 49,95', desc: 'Sterrenprojector & witte ruis', img: 'penguin-main.png' },
  { name: 'Grijze Teddybeer', price: '€ 49,95', desc: 'Premium nachtlampje, projector & melodieën', img: 'beartwo-main.png' },
  { name: 'Duo Set: Schaapje & Witte Beer', price: '€ 89,95', desc: 'Voordeelset met projector', img: 'duo-main.png' },
];

const SPECS = [
  { icon: BatteryCharging, label: 'Accu', value: 'Li-ion 2200 mAh · 8–12 uur per lading' },
  { icon: Clock, label: 'Opladen', value: 'Ca. 2 uur via USB-C' },
  { icon: Sun, label: 'Lichtopbrengst', value: '5 – 120 lux, traploos dimbaar (2700K–6500K)' },
  { icon: Volume2, label: 'Geluid', value: '30 – 65 dB · witte/roze ruis, oceaan, hartslag, melodie' },
  { icon: Bluetooth, label: 'Connectiviteit', value: 'Bluetooth 5.0 · app iOS 14+ / Android 10+' },
  { icon: Leaf, label: 'Materiaal', value: '100% biologisch katoen, wasbaar op 30 °C · BPA-vrij' },
  { icon: Clock, label: 'Timers', value: '15 min / 30 min / 1 uur / nachtlamp-modus' },
  { icon: ShieldCheck, label: 'Certificering', value: 'CE · EN 71 · RoHS · REACH · 2 jaar garantie' },
  { icon: Baby, label: 'Leeftijd', value: 'Geschikt van de geboorte t/m 6 jaar' },
  { icon: Package, label: 'Afmetingen', value: '22 × 18 × 14 cm · 340 gram' },
];

const STAFFEL = [
  { qty: '1 – 9 stuks', buy: '€ 34,95', rrp: '€ 59,95' },
  { qty: '10 – 49 stuks', buy: '€ 28,50', rrp: '€ 59,95' },
  { qty: '50 – 99 stuks', buy: '€ 24,00', rrp: '€ 59,95' },
  { qty: '100+ stuks', buy: 'Op aanvraag', rrp: '€ 59,95' },
];

const PARTNER_CODE = 'ZOETESLAPERS';

const Section = ({ id, eyebrow, title, subtitle, children, className = '' }) => (
  <section id={id} className={`py-16 sm:py-20 px-5 sm:px-8 ${className}`}>
    <div className="max-w-6xl mx-auto">
      {eyebrow && <div className="text-amber-700 font-semibold tracking-wide uppercase text-sm mb-2">{eyebrow}</div>}
      {title && <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">{title}</h2>}
      {subtitle && <p className="text-stone-600 text-base md:text-lg max-w-2xl mb-10">{subtitle}</p>}
      {children}
    </div>
  </section>
);

const PartnerPricing = () => {
  const [code, setCode] = useState('');
  const unlocked = code.trim().toUpperCase() === PARTNER_CODE;
  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden" data-testid="staffel-block">
      <div className="p-6 sm:p-8 border-b border-amber-100 bg-amber-50/60">
        <div className="flex items-center gap-2 text-stone-900 font-semibold mb-2">
          <Lock className="w-5 h-5 text-amber-600" /> Inkooptarieven voor partners
        </div>
        <p className="text-sm text-stone-600 mb-4">Voer je partnercode in om de staffelprijzen te bekijken. Geen code? Vraag deze aan via partners@droomvriendjes.com.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Partnercode"
            className="flex-1 rounded-xl border border-amber-200 px-4 py-3 text-stone-900 focus:outline-none focus:border-amber-500"
            data-testid="partner-code-input"
          />
          {unlocked && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-sm px-2" data-testid="partner-code-ok">
              <CheckCircle2 className="w-5 h-5" /> Ontgrendeld
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left" data-testid="staffel-table">
          <thead>
            <tr className="text-stone-500 text-sm border-b border-amber-100">
              <th className="px-6 py-4 font-medium">Aantal</th>
              <th className="px-6 py-4 font-medium">Inkoopprijs (excl. BTW)</th>
              <th className="px-6 py-4 font-medium">Adviesverkoopprijs</th>
            </tr>
          </thead>
          <tbody>
            {STAFFEL.map((row) => (
              <tr key={row.qty} className="border-b border-amber-50 last:border-0">
                <td className="px-6 py-4 font-semibold text-stone-900">{row.qty}</td>
                <td className="px-6 py-4">
                  {unlocked ? (
                    <span className="text-amber-700 font-bold text-lg">{row.buy}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-stone-400"><Lock className="w-4 h-4" /> Vergrendeld</span>
                  )}
                </td>
                <td className="px-6 py-4 text-stone-700">{row.rrp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 text-xs text-stone-500 bg-amber-50/40">
        Alle prijzen excl. BTW en excl. verzendkosten. Levering binnen NL gratis vanaf 10 stuks · 3–5 werkdagen (BE/DE 5–7).
      </div>
    </div>
  );
};

const ResearchForm = () => {
  const [form, setForm] = useState({
    naam: '', email: '', organisatie: '', rol: '', telefoon: '',
    kinderen_per_maand: '', licht_belang: '', geluid_belang: '',
    huidige_aanpak: '', deelnemen: 'ja', bericht: '',
  });
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending'); setErr('');
    try {
      const r = await fetch(`${API}/api/b2b/research-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Aanmelden mislukt');
      setStatus('done');
    } catch (e2) {
      setErr(e2.message || 'Aanmelden mislukt'); setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-8 text-center" data-testid="research-success">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-stone-900 mb-2">Bedankt voor je aanmelding!</h3>
        <p className="text-stone-600 max-w-md mx-auto">We nemen je op in het testpanel en houden je op de hoogte van de eerste onderzoeksresultaten. Je hoort binnenkort van ons via {form.email}.</p>
      </div>
    );
  }

  const inputCls = 'w-full rounded-xl border border-amber-200 px-4 py-3 text-stone-900 bg-white focus:outline-none focus:border-amber-500';
  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="research-form">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Naam *</label>
        <input required value={form.naam} onChange={set('naam')} className={inputCls} data-testid="research-naam" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">E-mailadres *</label>
        <input required type="email" value={form.email} onChange={set('email')} className={inputCls} data-testid="research-email" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Organisatie / praktijk</label>
        <input value={form.organisatie} onChange={set('organisatie')} className={inputCls} data-testid="research-org" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Jouw rol</label>
        <select value={form.rol} onChange={set('rol')} className={inputCls} data-testid="research-rol">
          <option value="">Kies...</option>
          <option value="slaapcoach">Slaapcoach</option>
          <option value="verloskundige">Verloskundige</option>
          <option value="kraamzorg">Kraamzorg</option>
          <option value="babyboetiek">Babyboetiek / winkel</option>
          <option value="anders">Anders</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Kinderen 0–6 jr die je per maand begeleidt</label>
        <input value={form.kinderen_per_maand} onChange={set('kinderen_per_maand')} placeholder="bijv. 20" className={inputCls} data-testid="research-kinderen" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Telefoon (optioneel)</label>
        <input value={form.telefoon} onChange={set('telefoon')} className={inputCls} data-testid="research-tel" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Hoe belangrijk is <strong>lichtkleur</strong> voor de slaapkwaliteit? (1–5)</label>
        <select value={form.licht_belang} onChange={set('licht_belang')} className={inputCls} data-testid="research-licht">
          <option value="">Kies...</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Hoe belangrijk is <strong>geluid</strong> voor de slaapkwaliteit? (1–5)</label>
        <select value={form.geluid_belang} onChange={set('geluid_belang')} className={inputCls} data-testid="research-geluid">
          <option value="">Kies...</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Wat adviseer je nu het vaakst voor beter slapen?</label>
        <input value={form.huidige_aanpak} onChange={set('huidige_aanpak')} className={inputCls} data-testid="research-aanpak" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Wil je deelnemen aan het testpanel?</label>
        <div className="flex gap-4">
          {['ja', 'nee'].map((v) => (
            <label key={v} className="inline-flex items-center gap-2 text-stone-700">
              <input type="radio" name="deelnemen" value={v} checked={form.deelnemen === v} onChange={set('deelnemen')} data-testid={`research-deelnemen-${v}`} />
              {v === 'ja' ? 'Ja, graag' : 'Nee, alleen resultaten ontvangen'}
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Bericht (optioneel)</label>
        <textarea value={form.bericht} onChange={set('bericht')} rows={3} className={inputCls} data-testid="research-bericht" />
      </div>
      {err && <div className="sm:col-span-2 text-red-600 text-sm" data-testid="research-error">{err}</div>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={status === 'sending'} className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-7 py-3.5 rounded-full transition disabled:opacity-60 w-full sm:w-auto" data-testid="research-submit">
          {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Meld me aan voor het onderzoekspanel
        </button>
      </div>
    </form>
  );
};

const B2BPage = () => {
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Helmet>
        <title>Zakelijke partners & inkoop | Droomvriendjes B2B</title>
        <meta name="description" content="Word zakelijke partner van Droomvriendjes. Bekijk de modellen, technische specificaties, staffelkortingen vanaf €24,00 en meld je aan voor ons grootschalig praktijkonderzoek naar licht & geluid op kinderslaap." />
        <link rel="canonical" href="https://www.droomvriendjes.com/b2b" />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16 bg-gradient-to-b from-amber-50 to-[#FBF7F2]">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
            <Sparkles className="w-4 h-4" /> Voor slaapcoaches, kraamzorg & retailers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight max-w-3xl">
            Word partner van Droomvriendjes
          </h1>
          <p className="text-stone-600 text-lg md:text-xl mt-5 max-w-2xl">
            Slimme slaaphulpen met wetenschappelijk onderbouwde licht- en geluidstechnologie voor kinderen van 0 tot 6 jaar. Aantrekkelijke staffeltarieven, regionale exclusiviteit en toegang tot ons praktijkonderzoek.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#aanmelden" className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-7 py-3.5 rounded-full transition" data-testid="hero-cta-research">
              Meld je aan voor het testpanel <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#tarieven" className="inline-flex items-center gap-2 bg-white border border-amber-200 hover:border-amber-400 text-stone-800 font-semibold px-7 py-3.5 rounded-full transition" data-testid="hero-cta-pricing">
              Bekijk inkooptarieven
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <Section id="modellen" eyebrow="Assortiment" title="Onze modellen" subtitle="Tien Droomvriendjes met nachtlampje, projector en rustgevend geluid. Adviesverkoopprijs vanaf € 49,95.">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5" data-testid="b2b-products">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:shadow-md transition group" data-testid={`b2b-product-${p.img}`}>
              <div className="aspect-square bg-amber-50/50 overflow-hidden">
                <img src={PIMG + p.img} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-stone-900 leading-snug">{p.name}</h3>
                <p className="text-sm text-stone-500 mt-1 mb-2">{p.desc}</p>
                <span className="text-amber-700 font-bold text-lg">{p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Specs */}
      <Section id="specificaties" eyebrow="Technische specificaties" title="Eén krachtige basis, tien karakters" subtitle="Alle Droomvriendjes delen dezelfde betrouwbare, gecertificeerde techniek." className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="b2b-specs">
          {SPECS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-start gap-4 bg-[#FBF7F2] rounded-xl p-5 border border-amber-50">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="font-semibold text-stone-900">{s.label}</div>
                  <div className="text-sm text-stone-600 mt-0.5">{s.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Pricing / staffel */}
      <Section id="tarieven" eyebrow="Partnertarieven" title="Staffelkortingen" subtitle="Hoe meer je afneemt, hoe scherper je inkoopt. Marges tot ruim 50%.">
        <PartnerPricing />
      </Section>

      {/* Partner benefits */}
      <Section id="voordelen" eyebrow="Waarom partner worden" title="Meer dan alleen inkoop" className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="b2b-benefits">
          {[
            ['Regionale exclusiviteit', 'Exclusiviteitscontracten voor slaapcoaches, kraamzorgbureaus en babyboetieks.'],
            ['Gratis promotiemateriaal', 'Beelden, teksten en social-media templates — klaar voor gebruik.'],
            ['Expertpartner-vermelding', 'Vermelding als expertpartner op droomvriendjes.com.'],
            ['Persoonlijke accountmanager', 'Vanaf orders van 25 stuks een vast aanspreekpunt.'],
            ['Dropshipping op aanvraag', 'Lever zonder voorraad rechtstreeks aan jouw klanten.'],
            ['Onderzoeksupdates', 'Kwartaalnieuwsbrief met onderzoeksresultaten en productnieuws.'],
          ].map(([t, d]) => (
            <div key={t} className="bg-[#FBF7F2] rounded-2xl p-6 border border-amber-50">
              <CheckCircle2 className="w-6 h-6 text-amber-600 mb-3" />
              <h3 className="font-bold text-stone-900 mb-1.5">{t}</h3>
              <p className="text-sm text-stone-600">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Research signup */}
      <Section id="aanmelden" eyebrow="Grootschalig praktijkonderzoek" title="Doe mee aan ons onderzoekspanel" subtitle="Samen met gecertificeerde slaapcoaches, verloskundigen en meer dan 10.000 ouders onderzoeken we de invloed van lichtkleur en geluid op de slaapkwaliteit van kinderen van 0 tot 6 jaar. Partners krijgen toegang tot tussentijdse resultaten en een directe lijn met ons R&D-team.">
        <ResearchForm />
      </Section>

      {/* CTA */}
      <section className="px-5 sm:px-8 pb-20">
        <div className="max-w-6xl mx-auto bg-stone-900 rounded-3xl p-10 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Klaar om samen te werken?</h2>
          <p className="text-stone-300 max-w-xl mx-auto mb-7">Vraag je partnercode aan of bespreek een exclusiviteitscontract. We denken graag met je mee.</p>
          <a href="mailto:partners@droomvriendjes.com" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-8 py-4 rounded-full transition" data-testid="cta-partner-email">
            <Mail className="w-5 h-5" /> partners@droomvriendjes.com
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default B2BPage;
