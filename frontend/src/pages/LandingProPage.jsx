import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Download, Printer, Shield, Heart, Sparkles, Moon, Star,
  ArrowRight, FileText, CheckCircle2,
} from 'lucide-react';
import Footer from '../components/Footer';

/**
 * /pro — Aparte showcase landingspage voor de 5 digitale PDFs + bundel.
 *
 * Bouwt op het user-gedeelde HTML mockup (`droomvriendjes_pro.html`) maar
 * houdt de warm-brown Droomvriendjes huisstijl. Geen aparte font/cursor —
 * we hergebruiken Tailwind tokens en de eigen design tokens.
 *
 * Alle CTA's gaan naar bestaande /product/digital-* routes.
 */

const PRODUCT_FALLBACK = [
  {
    id: 'digital-bedtime-chart',
    name: 'Slaapritueel Schema',
    blurb: '7 visuele stappen voor een rustig avondritueel — direct uitprintbaar in A4.',
    category: 'Routine',
    price: 2.95,
    benefit: 'Voorspelbaarheid = sneller inslapen',
  },
  {
    id: 'digital-sleep-tracker',
    name: 'Slaaplog 30 Dagen',
    blurb: '30 dagen patroon op één pagina. Vakjes voor voeding, luier, huilen en slaap.',
    category: 'Tracker',
    price: 2.95,
    benefit: 'Patronen ineens zichtbaar',
  },
  {
    id: 'digital-affirmation-cards',
    name: '12 Affirmatiekaartjes',
    blurb: 'Liefdevolle bedtijd-zinnen om uit te knippen, lamineren en samen voor te lezen.',
    category: 'Mindset',
    price: 1.95,
    benefit: 'Versterkt het Pavlov-effect',
  },
  {
    id: 'digital-coloring-pages',
    name: 'Slaap Kleurplaten Pakket',
    blurb: '4 bedtijd-thema kleurplaten — maan, knuffel, slapend dier en droomwolken.',
    category: 'Creatief',
    price: 2.95,
    benefit: 'Schermvrije laatste 30 minuten',
  },
  {
    id: 'digital-visual-schedule',
    name: 'Visueel Slaapschema Peuters',
    blurb: '8 plaatjes-stappen voor peuters die nog niet kunnen lezen. Vanaf 2 jaar.',
    category: 'Peuters',
    price: 2.95,
    benefit: 'Geen woorden nodig',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Mijn zoontje (4) vraagt nu zelf om de "knuffel-stap" aan te wijzen. Geen geruzie meer.',
    name: 'Sanne D.',
    role: 'Mama van Lars',
    initial: 'S',
  },
  {
    quote: 'Na 2 weken zag ik dat mijn baby ALTIJD om 3:15 wakker werd. Voeding aangepast, probleem opgelost. Goud waard.',
    name: 'Marieke V.',
    role: 'Mama van Tess',
    initial: 'M',
  },
  {
    quote: 'Wij combineren het schema met de affirmatiekaartjes — samen vormt het een compleet bedtijd-pakket. Echt rust in huis.',
    name: 'Anouk B.',
    role: 'Mama van Mees & Ivy',
    initial: 'A',
  },
];

const FAQS = [
  { q: 'Hoe krijg ik mijn PDF na betaling?', a: 'Direct na succesvolle betaling sturen we een download-link naar het e-mailadres dat je bij de bestelling hebt opgegeven. De link blijft 24 uur geldig en je kunt het bestand maximaal 3 keer downloaden.' },
  { q: 'Kan ik onbeperkt printen?', a: 'Ja. Eén aankoop = onbeperkt thuis printen voor eigen gebruik. Print zo vaak als je wilt, in welke kleur of formaat ook. Doorverkopen of commercieel gebruik is niet toegestaan.' },
  { q: 'Op welk papier formaat printen?', a: 'Alle bestanden zijn A4 op 300 dpi — geschikt voor elke standaard thuisprinter. Kies in je print-dialoog "Werkelijke grootte" voor het beste resultaat.' },
  { q: 'Krijg ik mijn geld terug als het niet bevalt?', a: 'Omdat het digitaal is geldt geen wettelijke bedenktermijn. Maar: als je niet tevreden bent, stuur ons een mail. We sturen je geld terug of een vervangend bestand.' },
];

const SectionLabel = ({ children }) => (
  <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700 mb-3">
    {children}
  </span>
);

const LandingProPage = () => {
  const [products, setProducts] = useState(PRODUCT_FALLBACK);

  useEffect(() => {
    // Fetch live digital products so prijzen up-to-date zijn
    fetch('/api/products')
      .then((r) => r.json())
      .then((all) => {
        if (!Array.isArray(all)) return;
        const digital = all.filter(
          (p) =>
            p.productType === 'digital' ||
            (typeof p.id === 'string' && p.id.startsWith('digital-')),
        );
        if (digital.length >= 3) {
          // merge live prices into fallback structure
          setProducts(
            PRODUCT_FALLBACK.map((fb) => {
              const live = digital.find((d) => d.id === fb.id);
              return live
                ? { ...fb, name: live.name?.replace(/\s*\(PDF\)\s*$/i, '') || fb.name, price: live.price ?? fb.price }
                : fb;
            }),
          );
        }
      })
      .catch(() => {});
  }, []);

  const totalLoose = useMemo(
    () => products.reduce((s, p) => s + (p.price || 0), 0),
    [products],
  );
  const bundlePrice = +(totalLoose * 0.6).toFixed(2); // 40% off
  const bundleSave = +(totalLoose - bundlePrice).toFixed(2);

  return (
    <>
      <Helmet>
        <title>Droomvriendjes PRO · Digitale slaaphulp voor het hele gezin</title>
        <meta name="description" content="5 wetenschappelijk-onderbouwde digitale slaapproducten voor baby's en kinderen: direct downloadbaar, oneindig printbaar, samen voor 40% korting." />
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1430] via-[#251a3e] to-[#3a2a4f] text-white" data-testid="pro-hero">
        {/* Decorative stars */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 2 + Math.random() * 2 + 'px',
                height: 2 + Math.random() * 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
        <div className="absolute top-12 right-8 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-12 left-8 w-40 h-40 bg-purple-300/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs uppercase tracking-[0.2em] mb-8">
            <Moon className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-amber-100/90">Digitale slaaphulp · 0-8 jaar</span>
          </span>
          <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-6 max-w-4xl">
            Zoete dromen <span className="italic text-amber-300">beginnen vanavond</span>.
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed mb-10">
            Vijf doordachte digitale slaapproducten — direct downloadbaar, oneindig printbaar.
            Geen verzending, geen wachten. Door pedagogen getoetst, door duizenden ouders bewezen.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <a
              href="#producten"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all hover:translate-y-[-2px]"
              data-testid="pro-cta-products"
            >
              Bekijk alle producten <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#bundle"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl transition-all"
              data-testid="pro-cta-bundle"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Bundel — 40% korting
            </a>
          </div>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              { n: '5', l: 'PDF producten' },
              { n: '<1m', l: 'Tot in je inbox' },
              { n: '∞', l: 'Onbeperkt printen' },
              { n: '92', l: '★★★★ reviews' },
            ].map((k) => (
              <div key={k.l}>
                <div className="text-3xl md:text-4xl font-bold text-amber-300">{k.n}</div>
                <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-[#fdf8f3] border-y border-amber-100 py-8" data-testid="pro-trust">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, t: 'Veilig betalen', s: 'Mollie · iDEAL · Stripe' },
            { icon: Download, t: 'Direct download', s: 'Tot in je inbox <1 min' },
            { icon: Printer, t: 'Onbeperkt printen', s: 'Eenmalig kopen, oneindig' },
            { icon: Heart, t: 'Met liefde gemaakt', s: 'Door ouders & pedagogen' },
          ].map((it) => (
            <div key={it.t} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <it.icon className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="font-bold text-stone-800 text-sm">{it.t}</div>
                <div className="text-xs text-stone-500">{it.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT — Why digital */}
      <section className="bg-white py-20" data-testid="pro-about">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <SectionLabel>Waarom digitaal</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-5">
              Het is 21:00. Je kind ligt nog wakker.<br />
              <span className="italic text-amber-700">Dit had je een uur geleden al kunnen printen.</span>
            </h2>
            <p className="text-stone-600 leading-relaxed text-lg">
              Geen pakketje dat over 3 dagen aankomt. Geen account, geen app, geen scherm.
              Gewoon: bestelling plaatsen, kopje thee zetten, en met een uitprintbaar plan
              de slaapkamer in.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { ic: '⚡', t: 'Direct na betaling', d: 'Download-link binnen 1 minuut in je inbox. Geldig 24 uur, max 3 keer downloaden.' },
              { ic: '🖨️', t: 'Oneindig herbruikbaar', d: 'Print zoveel als je wilt voor je eigen gezin. Eén bij papa & mama, eentje bij oma.' },
              { ic: '🇳🇱', t: 'Nederlandstalig getoetst', d: 'Elk woord doorgenomen met pedagogen — geen Engelse import-tools.' },
              { ic: '💛', t: 'Geld terug bij ontevredenheid', d: 'Mail ons als het niet werkt zoals beloofd — geen vragen, gewoon refund.' },
            ].map((p) => (
              <div key={p.t} className="flex gap-4 p-5 bg-[#fdf8f3] rounded-2xl border border-amber-100">
                <div className="text-2xl flex-shrink-0">{p.ic}</div>
                <div>
                  <strong className="text-stone-900">{p.t}</strong>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="producten" className="bg-[#fdf8f3] py-24" data-testid="pro-products">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>De collectie</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900">Vijf PDF's, één missie.</h2>
            <p className="text-stone-600 mt-3 max-w-xl mx-auto">
              Elk product staat op zichzelf — combineer ze voor een compleet bedtijd-pakket of kies wat past bij jullie fase.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group bg-white rounded-3xl p-6 border border-amber-100/80 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col"
                data-testid={`pro-product-${p.id}`}
              >
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-5 border border-amber-100 group-hover:scale-[1.02] transition-transform">
                  <FileText className="w-14 h-14 text-amber-400" strokeWidth={1.4} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-amber-700 font-bold mb-1.5">
                  {p.category}
                </span>
                <h3 className="text-xl font-bold text-stone-900 leading-tight mb-2">{p.name}</h3>
                <p className="text-sm text-stone-600 leading-relaxed mb-4 flex-1">{p.blurb}</p>
                <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{p.benefit}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                  <span className="text-2xl font-bold text-stone-900">
                    €{p.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 group-hover:gap-2.5 transition-all">
                    Bekijk PDF <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-24" data-testid="pro-how">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Zo werkt het</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900">Van bestelling tot ritueel in 3 minuten.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-amber-100 rounded-3xl overflow-hidden border border-amber-100">
            {[
              { n: '01', t: 'Bestel & betaal', d: 'Kies je product(en) of de bundel, vul je e-mail in. Mollie verwerkt de betaling veilig.' },
              { n: '02', t: 'Download direct', d: 'Binnen 1 minuut krijg je een persoonlijke download-link in je inbox. Geldig 24 uur.' },
              { n: '03', t: 'Print & gebruik', d: 'Open de PDF, print op A4, hang op de slaapkamerdeur. Klaar voor het ritueel van vanavond.' },
            ].map((s) => (
              <div key={s.n} className="bg-white p-8 lg:p-10 hover:bg-[#fdf8f3] transition-colors">
                <div className="text-amber-300 font-bold text-5xl mb-4">{s.n}</div>
                <h4 className="text-xl font-bold text-stone-900 mb-2">{s.t}</h4>
                <p className="text-stone-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="bg-[#fdf8f3] py-24" data-testid="pro-testimonials">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Wat ouders zeggen</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900">92 verifiable reviews. ★ 4.8 gemiddeld.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="relative bg-white rounded-3xl p-7 border border-amber-100 hover:shadow-xl transition-shadow">
                <div className="absolute top-3 right-5 text-7xl font-serif text-amber-200 leading-none select-none">"</div>
                <div className="flex gap-0.5 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-stone-800 leading-relaxed mb-6 relative z-10">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-amber-100">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center">{t.initial}</div>
                  <div>
                    <div className="font-semibold text-stone-900 text-sm">{t.name}</div>
                    <div className="text-xs text-stone-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUNDLE */}
      <section id="bundle" className="bg-gradient-to-br from-[#1a1430] via-[#2a1f44] to-[#3a2a4f] py-24 text-white relative overflow-hidden" data-testid="pro-bundle">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 mb-3">
            De voordeelpakketten
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Alles in één, voor <span className="italic text-amber-300">40% korting</span>.
          </h2>
          <p className="text-white/70 mb-10 max-w-2xl mx-auto">
            Alle 5 PDF's samen — slaapritueel, slaaplog, affirmatiekaartjes, kleurplaten én visueel schema.
            Voor één compleet bedtijd-pakket.
          </p>
          <div className="relative bg-white/[0.04] backdrop-blur border border-white/10 rounded-3xl p-8 lg:p-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              ⭐ Meest gekozen
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {products.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                  {p.name}
                </span>
              ))}
            </div>
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-white/40 line-through text-2xl">
                €{totalLoose.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-amber-300 font-bold text-5xl md:text-6xl">
                €{bundlePrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-amber-200/80 text-sm mb-8">
              Je bespaart €{bundleSave.toFixed(2).replace('.', ',')} t.o.v. losse aanschaf
            </p>
            <Link
              to="/product/digital-bedtime-chart"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold px-8 py-4 rounded-xl shadow-xl transition-all hover:translate-y-[-2px]"
              data-testid="pro-bundle-cta"
            >
              <Sparkles className="w-5 h-5" /> Bekijk de PDFs en kies
            </Link>
            <p className="text-xs text-white/40 mt-5">
              Tip: voeg meerdere PDFs samen toe aan je winkelwagen en de 40%-korting wordt automatisch berekend.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24" data-testid="pro-faq">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>Veelgestelde vragen</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900">Wat je waarschijnlijk vraagt.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group bg-[#fdf8f3] rounded-2xl border border-amber-100 px-6 py-5 hover:border-amber-300 transition-colors"
              >
                <summary className="font-semibold text-stone-900 cursor-pointer flex items-center justify-between gap-4 list-none">
                  <span>{f.q}</span>
                  <span className="text-amber-600 text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-stone-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default LandingProPage;
