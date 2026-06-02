import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Printer, Shield, Heart, Sparkles, Moon, Star,
  ArrowRight, FileText, CheckCircle2, Plus, Check, ShoppingCart,
} from 'lucide-react';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { trackViewItemList, trackViewPromotion, trackSelectPromotion } from '../utils/analytics';
import { bundlePct, bundleLabel, bundleDiscount } from '../lib/printablesBundle';
import { applySeo } from '../lib/seo';

const PRO_PROMO = { promotion_id: 'printables_pro', promotion_name: 'Droomvriendjes Printables', creative_name: 'pro_landing', creative_slot: 'pro_hero' };

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
  {
    id: 'digital-sleep-regression-cards',
    name: 'Slaapregressie Survival Cards',
    blurb: '7 regressies herkennen — signalen, oorzaak en praktische tips per fase. Inclusief tracker.',
    category: 'Survival',
    price: 3.95,
    benefit: 'Voorbereid op de zware nachten',
  },
  {
    id: 'digital-feeding-nap-planner',
    name: 'Dutjes & Voedingen Weekplanner',
    blurb: '4 leeftijdsplanners (0-18m). Voorbeeldtijden voor dutjes én voedingen — geen rigide schema.',
    category: 'Planner',
    price: 2.95,
    benefit: 'Houvast zonder dwang',
  },
  {
    id: 'digital-finn-dream-island',
    name: 'Finn en het Droomeiland',
    blurb: '14-pagina voorleesboek met 5 mindfulness-oefeningen. Finn en Beer reizen naar het Droomeiland.',
    category: 'Verhaal',
    price: 4.95,
    benefit: 'Verhaal + mindfulness in één',
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
  const promoFired = useRef(false);

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

  // ── "Stel je eigen pakket samen"-calculator ───────────────────────────
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(() => new Set(PRODUCT_FALLBACK.map((p) => p.id)));
  const [added, setAdded] = useState(false);
  // Keep selection valid when live products load
  useEffect(() => {
    setSelected((prev) => new Set(products.filter((p) => prev.has(p.id)).map((p) => p.id)));
  }, [products]);

  const toggle = (id) => { setAdded(false); setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }); };
  const selectAll = () => { setAdded(false); setSelected(new Set(products.map((p) => p.id))); };
  const clearAll = () => { setAdded(false); setSelected(new Set()); };

  const calc = useMemo(() => {
    const chosen = products.filter((p) => selected.has(p.id));
    const subtotal = +chosen.reduce((s, p) => s + (p.price || 0), 0).toFixed(2);
    const count = chosen.length;
    const discount = bundleDiscount(subtotal, count);
    const total = +(subtotal - discount).toFixed(2);
    return { chosen, subtotal, count, discount, total, pct: bundlePct(count), label: bundleLabel(count) };
  }, [products, selected]);

  const addBundleToCart = () => {
    if (calc.count === 0) return;
    trackSelectPromotion({ ...PRO_PROMO, creative_slot: 'pro_calculator' });
    calc.chosen.forEach((p) => addToCart({ id: p.id, name: p.name, price: p.price, productType: 'digital', image: p.image }));
    setAdded(true);
  };

  const eur = (n) => `€${n.toFixed(2).replace('.', ',')}`;

  // GA4: fire view_item_list + view_promotion once when the printables are shown
  useEffect(() => {
    if (promoFired.current || !products.length) return;
    promoFired.current = true;
    const items = products.map((p, i) => ({ id: p.id, name: p.name, price: p.price, item_category: p.category || 'Printables & Downloads', _index: i }));
    trackViewItemList(items, 'printables', 'Droomvriendjes Printables');
    trackViewPromotion(PRO_PROMO, items);
  }, [products]);

  // SEO/GEO structured data (NL + BE markt)
  const SITE = 'https://droomvriendjes.com';
  const PRO_FAQS = [
    { q: 'Hoe werkt de Printables-bundel?', a: 'Kies in de calculator welke PDF’s je wilt. Hoe meer je toevoegt, hoe hoger je korting — oplopend tot 50% voor het complete pakket. Na betaling download je de bestanden direct.' },
    { q: 'Kan ik de PDF’s onbeperkt printen?', a: 'Ja. Elke aankoop geeft je onbeperkt printrecht voor persoonlijk gebruik, zodat je het hele gezin kunt voorzien.' },
    { q: 'Worden de printables in België ook geleverd?', a: 'Ja. Het zijn digitale downloads, dus je ontvangt ze direct — zowel in Nederland als in België, zonder verzendkosten.' },
    { q: 'In welke taal zijn de printables?', a: 'Alle printables zijn in het Nederlands, geschikt voor de Nederlandse en Belgische markt.' },
  ];
  const proJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Printables', item: `${SITE}/pro` },
      ] },
      { '@type': 'ItemList', name: 'Droomvriendjes Printables', itemListElement: products.map((p, i) => ({
        '@type': 'ListItem', position: i + 1, item: {
          '@type': 'Product', name: p.name, category: p.category, url: `${SITE}/product/${p.id}`, brand: { '@type': 'Brand', name: 'Droomvriendjes' },
          offers: { '@type': 'Offer', price: (p.price || 0).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: `${SITE}/product/${p.id}` },
        },
      })) },
      { '@type': 'FAQPage', mainEntity: PRO_FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      { '@type': 'HowTo', name: 'Zo stel je je eigen Printables-pakket samen', step: [
        { '@type': 'HowToStep', position: 1, name: 'Kies je PDF’s', text: 'Selecteer in de calculator welke printables je wilt.' },
        { '@type': 'HowToStep', position: 2, name: 'Zie je prijs direct', text: 'De bundelkorting wordt automatisch berekend, tot 50% voor het complete pakket.' },
        { '@type': 'HowToStep', position: 3, name: 'Download & print', text: 'Reken veilig af en download je bestanden direct om onbeperkt te printen.' },
      ] },
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [products]);

  useEffect(() => {
    applySeo({
      title: 'Droomvriendjes Printables · Digitale slaaphulp (NL & BE)',
      description: 'Stel je eigen pakket digitale slaaphulp samen: slaapritueel, slaaplog, affirmatiekaartjes en meer. Direct downloaden, onbeperkt printen, tot 50% bundelkorting. Voor Nederland & België.',
      canonical: `${SITE}/pro`,
      og: {
        type: 'website',
        title: 'Droomvriendjes Printables — stel je eigen slaaphulp-pakket samen',
        description: 'Kies je PDF’s en zie direct je prijs. Tot 50% bundelkorting. Direct downloaden in NL & België.',
        url: `${SITE}/pro`,
        image: `${SITE}/og-printables.jpg`,
        site_name: 'Droomvriendjes',
        locale: 'nl_NL',
        'locale:alternate': 'nl_BE',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Droomvriendjes Printables — slaaphulp om zelf te printen',
        description: 'Kies je PDF’s, zie direct je prijs, tot 50% bundelkorting.',
      },
      alternates: [
        { hreflang: 'nl-NL', href: `${SITE}/pro` },
        { hreflang: 'nl-BE', href: `${SITE}/pro` },
        { hreflang: 'x-default', href: `${SITE}/pro` },
      ],
      jsonLd: proJsonLd,
      jsonLdId: 'pro-jsonld',
    });
  }, [proJsonLd]);

  return (
    <>
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
            Doordachte digitale slaaphulp — direct downloadbaar, oneindig printbaar.
            Geen verzending, geen wachten. Door pedagogen getoetst, door duizenden ouders bewezen.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <a
              href="#producten"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all hover:translate-y-[-2px]"
              data-testid="pro-cta-products"
              onClick={() => trackSelectPromotion(PRO_PROMO)}
            >
              Bekijk alle producten <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#bundle"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl transition-all"
              data-testid="pro-cta-bundle"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Bundel — 50% korting
            </a>
          </div>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              { n: '8', l: 'PDF producten' },
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
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900">Acht PDF's, één missie.</h2>
            <p className="text-stone-600 mt-3 max-w-xl mx-auto">
              Elk product staat op zichzelf — combineer ze voor een compleet bedtijd-pakket of kies wat past bij jullie fase.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, idx) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group bg-white rounded-3xl p-6 border border-amber-100/80 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col"
                data-testid={`pro-product-${p.id}`}
                onClick={() => trackSelectPromotion({ ...PRO_PROMO, creative_slot: 'pro_product_grid' }, { id: p.id, name: p.name, price: p.price, item_category: p.category, _index: idx })}
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

      {/* BUNDLE CALCULATOR */}
      <section id="bundle" className="bg-gradient-to-br from-[#1a1430] via-[#2a1f44] to-[#3a2a4f] py-24 text-white relative overflow-hidden" data-testid="pro-bundle">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300 mb-3">
              Stel je eigen pakket samen
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Kies je PDF's, <span className="italic text-amber-300">zie direct je prijs</span>.
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Hoe meer je toevoegt, hoe hoger je bundelkorting — oplopend tot <strong className="text-amber-300">50%</strong> voor het complete pakket.
              De korting wordt automatisch toegepast in je winkelwagen.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* Selectable printables */}
            <div className="grid sm:grid-cols-2 gap-3" data-testid="calc-products">
              {products.map((p) => {
                const isOn = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={isOn}
                    data-testid={`calc-item-${p.id}`}
                    className={`text-left rounded-2xl p-4 border transition-all flex items-start gap-3 ${
                      isOn
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/5'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isOn ? 'bg-amber-400 text-stone-900' : 'border border-white/30'}`}>
                      {isOn && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm leading-snug">{p.name}</span>
                        <span className="text-amber-200 font-bold text-sm whitespace-nowrap">{eur(p.price)}</span>
                      </span>
                      <span className="block text-[11px] text-white/50 mt-0.5">{p.category}</span>
                    </span>
                  </button>
                );
              })}
              <div className="sm:col-span-2 flex gap-2 text-xs">
                <button type="button" onClick={selectAll} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" data-testid="calc-select-all">Alles selecteren</button>
                <button type="button" onClick={clearAll} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" data-testid="calc-clear-all">Wis selectie</button>
              </div>
            </div>

            {/* Live price summary */}
            <div className="relative bg-white/[0.05] backdrop-blur border border-white/10 rounded-3xl p-6 lg:sticky lg:top-6" data-testid="calc-summary">
              <div className="flex items-center justify-between text-sm text-white/70 mb-3">
                <span>Geselecteerd</span>
                <span className="font-semibold text-white" data-testid="calc-count">{calc.count} PDF{calc.count === 1 ? '' : "'s"}</span>
              </div>
              {/* progress bar to next tier */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-300" style={{ width: `${(calc.pct / 0.5) * 100}%` }} />
              </div>
              {calc.label && <p className="text-[11px] text-amber-300 font-semibold mb-3" data-testid="calc-tier">{calc.label}</p>}
              {!calc.label && calc.count > 0 && <p className="text-[11px] text-white/50 mb-3">Voeg er nog één toe voor 20% bundelkorting</p>}

              <div className="space-y-1.5 text-sm border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between text-white/70">
                  <span>Subtotaal</span>
                  <span data-testid="calc-subtotal">{eur(calc.subtotal)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Bundelkorting{calc.pct > 0 ? ` (${Math.round(calc.pct * 100)}%)` : ''}</span>
                  <span data-testid="calc-discount">−{eur(calc.discount)}</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-white/10 pt-3 mt-3 mb-5">
                <span className="text-white/70 text-sm">Totaal</span>
                <span className="text-amber-300 font-bold text-4xl" data-testid="calc-total">{eur(calc.total)}</span>
              </div>

              {added ? (
                <div data-testid="calc-added">
                  <div className="flex items-center justify-center gap-2 text-emerald-300 font-semibold mb-3">
                    <Check className="w-5 h-5" strokeWidth={3} /> Toegevoegd aan winkelwagen
                  </div>
                  <Link
                    to="/checkout"
                    data-testid="calc-checkout"
                    className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold px-6 py-4 rounded-xl shadow-xl transition-all hover:translate-y-[-2px]"
                  >
                    Afrekenen — {eur(calc.total)} <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button type="button" onClick={() => setAdded(false)} className="w-full text-center text-white/50 hover:text-white/80 text-xs mt-3 transition-colors" data-testid="calc-continue">
                    Verder samenstellen
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={addBundleToCart}
                  disabled={calc.count === 0}
                  data-testid="calc-add-to-cart"
                  className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 font-bold px-6 py-4 rounded-xl shadow-xl transition-all hover:translate-y-[-2px]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {calc.count === 0 ? 'Kies eerst een PDF' : `Voeg ${calc.count} PDF${calc.count === 1 ? '' : "'s"} toe`}
                </button>
              )}
              {!added && calc.discount > 0 && (
                <p className="text-center text-amber-200/80 text-xs mt-3" data-testid="calc-save">Je bespaart {eur(calc.discount)} 🎉</p>
              )}
              <p className="text-center text-[11px] text-white/40 mt-3">Direct downloaden · onbeperkt printen · NL &amp; België</p>
            </div>
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
