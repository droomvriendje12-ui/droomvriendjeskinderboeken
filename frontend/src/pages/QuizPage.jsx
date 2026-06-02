import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { trackViewPromotion, trackSelectPromotion, trackViewItemList } from '../utils/analytics';
import { applySeo } from '../lib/seo';

const QUIZ_PROMO = { promotion_id: 'droomvriendje_quiz', promotion_name: 'Droomvriendje Quiz', creative_name: 'quiz_landing', creative_slot: 'quiz_intro' };
import {
  Sparkles, Moon, Star, Heart, Baby, Shield, Cloud, Zap, Volume2, Sun,
  ArrowRight, ArrowLeft, Check, Copy, Gift, RefreshCw, ShoppingCart, Smile, Cpu,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartSidebar from '../components/CartSidebar';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const QUIZ_CODE = 'DROOMQUIZ10';

/**
 * /quiz — "Ontdek jouw Droomvriendje-type"
 *
 * Virale persoonlijkheidsquiz: 4 vragen → score per knuffel → matched
 * archetype + product. E-mail capture (soft gate) voor de nieuwsbrief en
 * een 10% kortingscode (DROOMQUIZ10) als beloning. Deelbaar op social.
 */

// Result archetypes keyed by physical product id
const ARCHETYPES = {
  '14': {
    type: 'De Beschermer',
    icon: Shield,
    tagline: 'Een waakzame vriend die over de nacht waakt',
    description:
      'Jouw kindje verdient een droomvriendje dat meeluistert. De Slimme Leeuw met AI-huilsensor en projector reageert op onrust en geeft jullie allebei rust — jij slaapt door, je kindje voelt zich nooit alleen.',
  },
  '5': {
    type: 'De Dromer',
    icon: Sparkles,
    tagline: 'Voor kleine fantasten die wegzweven naar dromenland',
    description:
      'Een wereld vol sterren en zachte melodieën. De Magische Eenhoorn tovert het plafond om tot een sprookjeshemel — perfect voor dromers met een grote fantasie.',
  },
  '4': {
    type: 'De Avonturier',
    icon: Zap,
    tagline: 'Vol energie overdag, heerlijk rustig in de nacht',
    description:
      'De drukste avonturier komt eindelijk tot rust met de Stoere Dinosaurus. Sterrenprojectie en rustgevende melodieën zetten een streep onder een dag vol avontuur.',
  },
  '7': {
    type: 'De Knuffelaar',
    icon: Heart,
    tagline: 'Geborgenheid in pluche, warmte bij het inslapen',
    description:
      'Niets zo fijn als een zachte beer om vast te houden. Het Bruine Beertje combineert knuffelzachte geborgenheid met een rustgevende sterrenprojector en slaapliedjes.',
  },
  '8': {
    type: 'De Rustzoeker',
    icon: Cloud,
    tagline: 'Kalmte boven alles, diepe rust in de kamer',
    description:
      'Voor wie houdt van zacht en sereen. Het Liggend Schaapje brengt met sterrenprojectie en kalmerende melodieën een diepe, vredige rust in de slaapkamer.',
  },
  '9': {
    type: 'De Kalmeerder',
    icon: Volume2,
    tagline: 'Witte ruis die onrust zacht wegneemt',
    description:
      'Gevoelige slapers vallen het zachtst in slaap met vertrouwde geluiden. De Pinguïn Droomvriendje gebruikt rustgevende witte ruis om onrust weg te nemen — net als in de buik.',
  },
  '13': {
    type: 'De Trouwe Vriend',
    icon: Smile,
    tagline: 'Een premium maatje voor het leven',
    description:
      'Luxe zachtheid die jaren meegaat. De Grijze Teddybeer is een trouwe metgezel met premium materialen, rustgevend licht en zachte melodieën.',
  },
};

const ARCHETYPE_ORDER = ['14', '5', '4', '7', '8', '9', '13'];

const QUESTIONS = [
  {
    id: 'leeftijd',
    question: 'Voor wie zoek je een droomvriendje?',
    options: [
      { label: 'Een baby (0–1 jaar)', icon: Baby, scores: { '9': 3, '14': 2, '8': 1 } },
      { label: 'Een peuter of kleuter (1–4 jaar)', icon: Star, scores: { '5': 3, '7': 2, '8': 1 } },
      { label: 'Een kind (4–8 jaar)', icon: Zap, scores: { '4': 3, '5': 2, '13': 1 } },
      { label: 'Voor mezelf of een volwassene', icon: Moon, scores: { '8': 3, '13': 2, '7': 1 } },
    ],
  },
  {
    id: 'uitdaging',
    question: 'Wat is de grootste slaapuitdaging?',
    options: [
      { label: 'Moeite met inslapen / onrustig', icon: Cloud, scores: { '9': 3, '8': 2, '5': 1 } },
      { label: "Wordt 's nachts vaak wakker of huilt", icon: Volume2, scores: { '14': 3, '9': 2, '8': 1 } },
      { label: 'Bang in het donker', icon: Sparkles, scores: { '5': 3, '7': 2, '4': 1 } },
      { label: 'Te veel energie, komt niet tot rust', icon: Zap, scores: { '4': 3, '13': 2, '5': 1 } },
    ],
  },
  {
    id: 'sfeer',
    question: 'Welke sfeer past het best bij jullie?',
    options: [
      { label: 'Zacht & rustgevend (witte ruis)', icon: Volume2, scores: { '9': 3, '8': 2, '7': 1 } },
      { label: 'Magisch & dromerig (sterrenhemel)', icon: Sparkles, scores: { '5': 3, '7': 2, '4': 1 } },
      { label: 'Speels & stoer', icon: Zap, scores: { '4': 3, '14': 2, '5': 1 } },
      { label: 'Knuffelen & geborgenheid', icon: Heart, scores: { '13': 3, '7': 2, '8': 1 } },
    ],
  },
  {
    id: 'belangrijk',
    question: 'Wat vind je het allerbelangrijkst?',
    options: [
      { label: 'Een echte knuffel om vast te houden', icon: Heart, scores: { '13': 3, '7': 2, '8': 1 } },
      { label: 'Een mooie projectie op het plafond', icon: Sparkles, scores: { '5': 3, '4': 2, '7': 1 } },
      { label: 'Rustgevende geluiden & melodieën', icon: Volume2, scores: { '8': 3, '5': 2, '9': 1 } },
      { label: 'Slimme technologie (sensor)', icon: Cpu, scores: { '14': 3, '9': 2, '4': 1 } },
    ],
  },
  {
    id: 'licht',
    question: 'Hoe valt je kindje het liefst in slaap qua licht?',
    options: [
      { label: 'Met een zacht, warm nachtlampje', icon: Moon, scores: { '7': 3, '8': 2, '13': 1 } },
      { label: 'Met een sterren- of maanprojectie op het plafond', icon: Sparkles, scores: { '5': 3, '4': 2, '7': 1 } },
      { label: 'In het volledige donker, maar wel veilig', icon: Heart, scores: { '13': 3, '9': 1, '8': 1 } },
      { label: 'Maakt niet uit, zolang het maar rustig is', icon: Cloud, scores: { '8': 2, '7': 2, '5': 1 } },
    ],
  },
  {
    id: 'geluid',
    question: 'Welk geluid helpt je kindje het best in slaap te vallen of rustig wakker te worden?',
    options: [
      { label: 'Zachte witte ruis / geruis', icon: Volume2, scores: { '9': 3, '8': 2, '7': 1 } },
      { label: 'Rustige slaapliedjes & melodieën', icon: Star, scores: { '8': 3, '5': 2, '9': 1 } },
      { label: 'Natuurgeluiden (regen, zee, hartslag)', icon: Cloud, scores: { '9': 3, '7': 2, '14': 1 } },
      { label: 'Het liefst helemaal stil', icon: Heart, scores: { '13': 3, '4': 2, '5': 1 } },
    ],
  },
];

const euro = (n) => (typeof n === 'number' ? `€${n.toFixed(2).replace('.', ',')}` : null);

const QuizPage = () => {
  const { products, getProductById, fetchProductById } = useProducts();
  const { addToCart, setIsCartOpen } = useCart();

  const [phase, setPhase] = useState('intro'); // intro | quiz | email | result
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionIndex
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const quizViewFired = useRef(false);
  const resultListFired = useRef(false);

  // GA4: view_promotion when the quiz intro is shown
  useEffect(() => {
    if (quizViewFired.current) return;
    quizViewFired.current = true;
    trackViewPromotion(QUIZ_PROMO);
  }, []);

  // Compute the winning product id from the answers
  const resultId = useMemo(() => {
    const totals = {};
    ARCHETYPE_ORDER.forEach((id) => { totals[id] = 0; });
    QUESTIONS.forEach((q) => {
      const optIdx = answers[q.id];
      if (optIdx === undefined) return;
      const sc = q.options[optIdx].scores;
      Object.entries(sc).forEach(([id, pts]) => { totals[id] = (totals[id] || 0) + pts; });
    });
    // argmax with deterministic tie-break via ARCHETYPE_ORDER
    let best = ARCHETYPE_ORDER[0];
    let bestVal = -1;
    ARCHETYPE_ORDER.forEach((id) => {
      if (totals[id] > bestVal) { bestVal = totals[id]; best = id; }
    });
    return best;
  }, [answers]);

  const archetype = ARCHETYPES[resultId];
  const product = getProductById(resultId) || fetchedProduct;

  // Fallback fetch if the products context hasn't loaded the matched product
  useEffect(() => {
    if (phase === 'result' && !getProductById(resultId)) {
      fetchProductById(resultId).then((p) => p && setFetchedProduct(p));
    }
  }, [phase, resultId, getProductById, fetchProductById]);

  // GA4: view_item_list with the recommended product when the result is shown
  useEffect(() => {
    if (phase === 'result' && product && !resultListFired.current) {
      resultListFired.current = true;
      trackViewItemList(
        [{ id: product.id, name: product.name, price: product.price, item_category: product.category }],
        'quiz_result',
        'Quiz Aanbeveling',
      );
    }
  }, [phase, product]);

  const shareUrl = useMemo(
    () => (typeof window !== 'undefined' ? `${window.location.origin}/quiz` : 'https://droomvriendjes.com/quiz'),
    []
  );

  const handleSelect = (optIdx) => {
    const q = QUESTIONS[qIndex];
    const next = { ...answers, [q.id]: optIdx };
    setAnswers(next);
    setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex((i) => i + 1);
      } else {
        setPhase('email');
      }
    }, 220);
  };

  const handleBack = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setPhase('intro');
  };

  const captureLead = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/email/csv/import-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'quiz_droomvriendje', naam: '' }),
      }).catch(() => {});
    } catch { /* non-blocking */ }
  }, [email]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    if (!emailOk) {
      setEmailErr('Vul een geldig e-mailadres in');
      return;
    }
    setEmailErr('');
    setLeadCaptured(true);
    captureLead();
    setPhase('result');
  };

  const skipEmail = () => {
    setPhase('result');
  };

  const restart = () => {
    setAnswers({});
    setQIndex(0);
    setEmail('');
    setEmailErr('');
    setLeadCaptured(false);
    setFetchedProduct(null);
    setPhase('intro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copy = (text, which) => {
    navigator.clipboard?.writeText(text);
    if (which === 'code') { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
    else { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setIsCartOpen(true);
    }
  };

  const progress = phase === 'quiz' ? ((qIndex + 1) / (QUESTIONS.length + 1)) * 100 : phase === 'email' ? 90 : 0;

  // SEO/GEO structured data (NL + BE markt)
  const SITE = 'https://droomvriendjes.com';
  const QUIZ_FAQS = [
    { q: 'Hoe werkt de Droomvriendje-quiz?', a: 'Beantwoord een paar korte vragen over je kindje. Op basis daarvan bevelen we de best passende slaapknuffel met nachtlampje aan — en je ontvangt 10% korting.' },
    { q: 'Is de quiz gratis?', a: 'Ja, de quiz is volledig gratis en duurt minder dan een minuut.' },
    { q: 'Voor welke leeftijd zijn de knuffels?', a: 'Onze slaapknuffels zijn geschikt voor baby’s en kinderen van 0 tot 6 jaar.' },
    { q: 'Leveren jullie ook in België?', a: 'Ja, we leveren gratis in zowel Nederland als België.' },
  ];
  const quizJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Knuffel-quiz', item: `${SITE}/quiz` },
      ] },
      { '@type': 'FAQPage', mainEntity: QUIZ_FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useEffect(() => {
    applySeo({
      title: 'Droomvriendje Quiz | Ontdek welke slaapknuffel bij jouw kindje past',
      description: 'Doe de gratis Droomvriendje-quiz: een paar vragen en je ontdekt welke slaapknuffel met nachtlampje het beste bij jouw kindje past. Inclusief 10% korting. Voor Nederland & België.',
      canonical: `${SITE}/quiz`,
      og: {
        type: 'website',
        title: 'Ontdek jouw Droomvriendje-type 🧸',
        description: 'Welke slaapknuffel past bij jouw kindje? Doe de gratis test en ontvang 10% korting!',
        url: `${SITE}/quiz`,
        image: `${SITE}/og-quiz.jpg`,
        site_name: 'Droomvriendjes',
        locale: 'nl_NL',
        'locale:alternate': 'nl_BE',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Ontdek jouw Droomvriendje-type',
        description: 'Doe de gratis knuffel-quiz en krijg 10% korting.',
      },
      alternates: [
        { hreflang: 'nl-NL', href: `${SITE}/quiz` },
        { hreflang: 'nl-BE', href: `${SITE}/quiz` },
        { hreflang: 'x-default', href: `${SITE}/quiz` },
      ],
      jsonLd: quizJsonLd,
      jsonLdId: 'quiz-jsonld',
    });
  }, [quizJsonLd]);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <CartSidebar />

      <main className="flex-1">
        {/* Progress bar */}
        {(phase === 'quiz' || phase === 'email') && (
          <div className="sticky top-20 sm:top-28 z-30 bg-cream/80 backdrop-blur">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between text-xs font-semibold text-warm-brown-600 mb-2">
                <span>Vraag {Math.min(qIndex + 1, QUESTIONS.length)} van {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-warm-brown-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-warm-brown-400 to-warm-brown-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                  data-testid="quiz-progress-bar"
                />
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">

          {/* ───────── INTRO ───────── */}
          {phase === 'intro' && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="quiz-intro">
              <div className="inline-flex items-center gap-2 bg-warm-brown-100 text-warm-brown-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Gratis · 30 seconden
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-warm-brown-900 leading-tight mb-5">
                Ontdek jouw <span className="text-warm-brown-500 italic">Droomvriendje</span>-type
              </h1>
              <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto mb-8">
                Beantwoord {QUESTIONS.length} korte vragen en wij vertellen je precies welke slaapknuffel het beste past bij jouw kindje. Inclusief <span className="font-semibold text-warm-brown-700">10% korting</span> als verrassing.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm text-stone-500">
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-warm-brown-500" /> Persoonlijk advies</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-warm-brown-500" /> Geen account nodig</span>
                <span className="inline-flex items-center gap-1.5"><Gift className="w-4 h-4 text-warm-brown-500" /> 10% korting</span>
              </div>

              <button
                onClick={() => { trackSelectPromotion(QUIZ_PROMO); setPhase('quiz'); }}
                data-testid="quiz-start-button"
                className="group inline-flex items-center gap-2.5 bg-warm-brown-500 hover:bg-warm-brown-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Start de test
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* ───────── QUESTIONS ───────── */}
          {phase === 'quiz' && (
            <div key={qIndex} className="animate-in fade-in slide-in-from-right-6 duration-300" data-testid={`quiz-question-${qIndex}`}>
              <h2 className="text-2xl sm:text-3xl font-bold text-warm-brown-900 text-center mb-8 leading-snug">
                {QUESTIONS[qIndex].question}
              </h2>
              <div className="space-y-3">
                {QUESTIONS[qIndex].options.map((opt, i) => {
                  const Icon = opt.icon;
                  const selected = answers[QUESTIONS[qIndex].id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      data-testid={`quiz-option-${qIndex}-${i}`}
                      className={`w-full flex items-center gap-4 text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99] ${
                        selected
                          ? 'border-warm-brown-500 bg-warm-brown-50 shadow-md'
                          : 'border-stone-200 bg-white hover:border-warm-brown-300 hover:shadow-sm'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-warm-brown-500 text-white' : 'bg-warm-brown-100 text-warm-brown-600 group-hover:bg-warm-brown-200'}`}>
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className="flex-1 font-semibold text-stone-800 text-base sm:text-lg">{opt.label}</span>
                      <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-all ${selected ? 'text-warm-brown-500 translate-x-0' : 'text-stone-300 group-hover:text-warm-brown-400 group-hover:translate-x-1'}`} />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleBack}
                data-testid="quiz-back-button"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-warm-brown-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug
              </button>
            </div>
          )}

          {/* ───────── EMAIL CAPTURE ───────── */}
          {phase === 'email' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-400" data-testid="quiz-email-gate">
              <div className="w-20 h-20 mx-auto mb-5 bg-warm-brown-100 rounded-full flex items-center justify-center">
                <Gift className="w-10 h-10 text-warm-brown-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-warm-brown-900 mb-3">
                Je resultaat is klaar! 🎉
              </h2>
              <p className="text-stone-600 max-w-md mx-auto mb-7">
                Laat je e-mailadres achter en we sturen je jouw persoonlijke advies én een <span className="font-semibold text-warm-brown-700">10% kortingscode</span>.
              </p>

              <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Jouw e-mailadres"
                  data-testid="quiz-email-input"
                  className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-200 focus:border-warm-brown-500 focus:ring-2 focus:ring-warm-brown-500/20 outline-none text-center text-base transition"
                />
                {emailErr && <p className="text-red-500 text-sm" data-testid="quiz-email-error">{emailErr}</p>}
                <button
                  type="submit"
                  data-testid="quiz-email-submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-warm-brown-500 hover:bg-warm-brown-600 text-white font-bold text-lg px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Toon mijn resultaat
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
              <button onClick={skipEmail} data-testid="quiz-email-skip" className="mt-4 text-sm text-stone-400 hover:text-stone-600 transition">
                Liever zonder e-mail? Toon resultaat
              </button>
              <p className="mt-5 text-xs text-stone-400 max-w-xs mx-auto">
                We sturen je af en toe slaaptips & aanbiedingen. Uitschrijven kan altijd met één klik.
              </p>
            </div>
          )}

          {/* ───────── RESULT ───────── */}
          {phase === 'result' && archetype && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-600" data-testid="quiz-result">
              <div className="text-center mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-warm-brown-500 mb-3">Jouw Droomvriendje-type</p>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-warm-brown-500 text-white mb-4 shadow-lg">
                  {React.createElement(archetype.icon, { className: 'w-10 h-10' })}
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-warm-brown-900 mb-2">{archetype.type}</h1>
                <p className="text-lg text-warm-brown-600 italic">{archetype.tagline}</p>
              </div>

              {/* Matched product card */}
              {product && (
                <div className="bg-white rounded-3xl border-2 border-warm-brown-100 shadow-sm overflow-hidden mb-8" data-testid="quiz-result-product">
                  <div className="grid sm:grid-cols-2">
                    <div className="relative bg-cream aspect-square sm:aspect-auto">
                      {product.image && (
                        <img src={product.image} alt={product.shortName || product.name} className="w-full h-full object-cover" />
                      )}
                      {product.badge && (
                        <span className="absolute top-4 left-4 bg-warm-brown-500 text-white text-xs font-bold px-3 py-1 rounded-full">{product.badge}</span>
                      )}
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                      <p className="text-stone-600 text-sm leading-relaxed mb-4">{archetype.description}</p>
                      <h3 className="text-xl font-bold text-warm-brown-900 mb-2">{product.shortName || product.name}</h3>
                      <div className="flex items-baseline gap-2 mb-5">
                        <span className="text-2xl font-extrabold text-warm-brown-700">{euro(product.price)}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-base text-stone-400 line-through">{euro(product.originalPrice)}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <button
                          onClick={handleAddToCart}
                          data-testid="quiz-result-add-to-cart"
                          className="inline-flex items-center justify-center gap-2 bg-warm-brown-500 hover:bg-warm-brown-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow hover:shadow-lg"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          In winkelwagen
                        </button>
                        <Link
                          to={`/product/${product.id}`}
                          data-testid="quiz-result-view-product"
                          className="inline-flex items-center justify-center gap-2 border-2 border-warm-brown-200 text-warm-brown-700 hover:bg-warm-brown-50 font-semibold px-6 py-2.5 rounded-xl transition-all"
                        >
                          Bekijk dit droomvriendje
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Discount reward */}
              <div className="bg-gradient-to-br from-warm-brown-900 via-warm-brown-800 to-amber-900 text-white rounded-3xl p-6 sm:p-8 text-center mb-8 shadow-lg" data-testid="quiz-result-discount">
                <Gift className="w-9 h-9 mx-auto mb-3 opacity-90" />
                <p className="text-sm uppercase tracking-wider font-semibold opacity-80 mb-1">Jouw beloning</p>
                <h3 className="text-2xl font-bold mb-4">10% korting op je droomvriendje</h3>
                <button
                  onClick={() => copy(QUIZ_CODE, 'code')}
                  data-testid="quiz-copy-code"
                  className="inline-flex items-center gap-3 bg-white text-warm-brown-900 font-extrabold text-xl tracking-wider px-6 py-3 rounded-xl hover:scale-[1.02] transition-transform"
                >
                  {QUIZ_CODE}
                  {copiedCode ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-warm-brown-400" />}
                </button>
                <p className="text-xs opacity-70 mt-3">Gebruik deze code bij het afrekenen. {copiedCode && '✓ Gekopieerd!'}</p>
              </div>

              {/* Share */}
              <div className="text-center mb-8" data-testid="quiz-share">
                <p className="font-semibold text-warm-brown-900 mb-4">Deel jouw type met andere ouders 💛</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Ik ben ${archetype.type}! 🧸 Ontdek welke slaapknuffel bij jouw kindje past: ${shareUrl}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="quiz-share-whatsapp"
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="quiz-share-facebook"
                    className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1466d8] text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                  <button
                    onClick={() => copy(shareUrl, 'link')}
                    data-testid="quiz-share-copy"
                    className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-5 py-2.5 rounded-full transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Gekopieerd!' : 'Kopieer link'}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={restart}
                  data-testid="quiz-restart"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-warm-brown-600 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Opnieuw doen
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuizPage;
