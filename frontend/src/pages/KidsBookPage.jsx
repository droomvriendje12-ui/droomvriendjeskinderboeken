import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, BookOpen, Check, ArrowLeft, ArrowRight, Loader2, Upload, X,
  Star, Truck, Lock, Heart, Wand2
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL;

// Resize an image file client-side to keep the upload small
const fileToResizedDataUrl = (file, maxPx = 1024) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (Math.max(w, h) > maxPx) {
          if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const STEPS = ['Pakket', 'Formaat', 'Je kind', 'Thema', 'Magie', 'Preview', 'Bestellen'];

const KidsBookPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [step, setStep] = useState(1);
  const [pkg, setPkg] = useState('solo');
  const [format, setFormat] = useState('standaard');
  const [physical, setPhysical] = useState(false);
  const [theme, setTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [children, setChildren] = useState([{ name: '', age: '', gender: '', photo: '' }]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [delivery, setDelivery] = useState({ email: '', name: '', phone: '', address: '', zipcode: '', city: '', country: 'NL' });
  const topRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/kids-book/config`).then(r => r.json()).then(setConfig).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  // Keep children array length in sync with chosen package
  useEffect(() => {
    if (!config) return;
    const n = config.packages[pkg].children;
    setChildren(prev => {
      const next = [...prev];
      while (next.length < n) next.push({ name: '', age: '', gender: '', photo: '' });
      return next.slice(0, n);
    });
  }, [pkg, config]);

  const price = config
    ? (config.packages[pkg].price + config.formats[format].extra + (physical ? config.physical_price : 0))
    : 0;
  const fmtEur = (n) => `€${Number(n).toFixed(2).replace('.', ',')}`;

  const goTo = (s) => { setError(''); setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const updateChild = (i, field, value) =>
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const handlePhoto = async (i, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1024);
      updateChild(i, 'photo', dataUrl);
    } catch {
      setError('Kon de foto niet verwerken. Probeer een andere foto.');
    }
  };

  const childrenValid = () => children.every(c => (c.name || '').trim().length > 0);

  const handleGenerate = async () => {
    setError('');
    if (!childrenValid()) { setError('Vul minstens de naam van elk kind in.'); goTo(3); return; }
    if (!theme) { setError('Kies een thema.'); goTo(4); return; }
    if (theme === 'eigen' && !customTheme.trim()) { setError('Beschrijf je eigen thema.'); goTo(4); return; }
    setStep(5);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/kids-book/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: pkg, format, theme, custom_theme: customTheme, physical,
          children: children.map(c => ({
            name: c.name.trim(), age: c.age, gender: c.gender,
            photo_base64: c.photo || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Preview kon niet worden gegenereerd');
      setPreview(data);
      setStep(6);
    } catch (e) {
      setError(e.message);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    setError('');
    if (!delivery.email.trim() || !delivery.email.includes('@')) { setError('Vul een geldig e-mailadres in.'); return; }
    if (physical && (!delivery.address.trim() || !delivery.zipcode.trim() || !delivery.city.trim())) {
      setError('Vul een volledig verzendadres in voor het gedrukte exemplaar.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/kids-book/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: preview.book_id, physical,
          customer_email: delivery.email.trim(), customer_name: delivery.name.trim(),
          customer_phone: delivery.phone.trim(), address: delivery.address.trim(),
          zipcode: delivery.zipcode.trim(), city: delivery.city.trim(), country: delivery.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Bestelling kon niet worden gestart');
      if (data.checkout_url) { window.location.href = data.checkout_url; }
      else throw new Error('Geen betaal-URL ontvangen');
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-warm-brown-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a1a3e] via-[#3a2456] to-[#1a1030] text-white" data-testid="kids-book-page" ref={topRef}>
      <Header />
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold text-amber-200 mb-4">
          <Sparkles className="w-4 h-4" /> Nieuw · Gepersonaliseerd kinderboek
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight">
          Maak je kind de <span className="text-amber-300 italic">held</span> van zijn eigen verhaal
        </h1>
        <p className="text-white/70 text-base max-w-2xl mx-auto">
          Kies een thema, vul de naam in en upload een foto. Onze AI tovert binnen een minuut een
          uniek, prachtig geïllustreerd boek — bekijk <strong className="text-white">2 pagina's gratis</strong> voordat je bestelt.
        </p>
      </div>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between" data-testid="kb-steps">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n, done = step > n;
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'bg-amber-400 text-[#2a1a3e]' : active ? 'bg-white text-[#2a1a3e] scale-110 shadow-lg' : 'bg-white/15 text-white/60'
                }`}>
                  {done ? <Check className="w-4 h-4" /> : n}
                </div>
                <span className={`text-[10px] mt-1 hidden sm:block ${active ? 'text-white' : 'text-white/50'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {error && (
          <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-5 text-sm" data-testid="kb-error">
            {error}
          </div>
        )}

        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
          {/* STEP 1 — Pakket */}
          {step === 1 && (
            <div data-testid="kb-step-package">
              <h2 className="text-2xl font-bold mb-1">Voor wie maken we het boek?</h2>
              <p className="text-slate-500 mb-6 text-sm">Kies hoeveel kinderen de helden van het verhaal worden.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {Object.entries(config.packages).map(([key, p]) => (
                  <button key={key} type="button" onClick={() => setPkg(key)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${pkg === key ? 'border-warm-brown-500 bg-warm-brown-50 ring-2 ring-warm-brown-200' : 'border-slate-200 hover:border-warm-brown-300'}`}
                    data-testid={`kb-package-${key}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{p.label}</span>
                      {pkg === key && <Check className="w-5 h-5 text-warm-brown-500" />}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{p.desc}</p>
                    <p className="text-warm-brown-600 font-bold text-xl">{fmtEur(p.price)}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-8">
                <NextBtn onClick={() => goTo(2)} />
              </div>
            </div>
          )}

          {/* STEP 2 — Formaat */}
          {step === 2 && (
            <div data-testid="kb-step-format">
              <h2 className="text-2xl font-bold mb-1">Kies je formaat</h2>
              <p className="text-slate-500 mb-6 text-sm">Standaard of een luxe Premium-editie?</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(config.formats).map(([key, f]) => (
                  <button key={key} type="button" onClick={() => setFormat(key)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${format === key ? 'border-warm-brown-500 bg-warm-brown-50 ring-2 ring-warm-brown-200' : 'border-slate-200 hover:border-warm-brown-300'}`}
                    data-testid={`kb-format-${key}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{f.label}</span>
                      {format === key && <Check className="w-5 h-5 text-warm-brown-500" />}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{f.desc}</p>
                    <p className="text-warm-brown-600 font-bold">{f.extra > 0 ? `+ ${fmtEur(f.extra)}` : 'Inbegrepen'}</p>
                  </button>
                ))}
              </div>

              <label className="flex items-start gap-3 mt-5 p-4 rounded-2xl border-2 border-slate-200 cursor-pointer hover:border-warm-brown-300" data-testid="kb-physical-toggle">
                <input type="checkbox" checked={physical} onChange={e => setPhysical(e.target.checked)} className="mt-1 w-5 h-5 accent-warm-brown-500" />
                <div>
                  <div className="font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-warm-brown-500" /> Ook een gedrukt exemplaar? <span className="text-warm-brown-600">+ {fmtEur(config.physical_price)}</span></div>
                  <p className="text-sm text-slate-500">Hardcover, incl. verzending in NL & BE. Je krijgt sowieso direct de digitale PDF.</p>
                </div>
              </label>

              <div className="flex justify-between mt-8">
                <BackBtn onClick={() => goTo(1)} />
                <NextBtn onClick={() => goTo(3)} />
              </div>
            </div>
          )}

          {/* STEP 3 — Kind personaliseren */}
          {step === 3 && (
            <div data-testid="kb-step-children">
              <h2 className="text-2xl font-bold mb-1">Personaliseer je {children.length > 1 ? 'kinderen' : 'kind'}</h2>
              <p className="text-slate-500 mb-6 text-sm">Een foto is optioneel — het personage lijkt dan op je kind. We bewaren de foto niet.</p>
              <div className="space-y-5">
                {children.map((c, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50" data-testid={`kb-child-${i}`}>
                    <div className="grid sm:grid-cols-[auto,1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center relative">
                          {c.photo ? (
                            <>
                              <img src={c.photo} alt="" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => updateChild(i, 'photo', '')} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow"><X className="w-3 h-3" /></button>
                            </>
                          ) : (
                            <Upload className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <label className="mt-2 text-xs font-semibold text-warm-brown-600 cursor-pointer hover:underline" data-testid={`kb-child-photo-${i}`}>
                          Foto kiezen
                          <input type="file" accept="image/*" className="hidden" onChange={e => handlePhoto(i, e.target.files[0])} />
                        </label>
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder="Naam *" value={c.name} onChange={e => updateChild(i, 'name', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid={`kb-child-name-${i}`} />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" min="0" max="12" placeholder="Leeftijd" value={c.age} onChange={e => updateChild(i, 'age', e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid={`kb-child-age-${i}`} />
                          <select value={c.gender} onChange={e => updateChild(i, 'gender', e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none bg-white" data-testid={`kb-child-gender-${i}`}>
                            <option value="">Geslacht</option>
                            <option value="jongen">Jongen</option>
                            <option value="meisje">Meisje</option>
                            <option value="anders">Anders</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <BackBtn onClick={() => goTo(2)} />
                <NextBtn onClick={() => { if (!childrenValid()) { setError('Vul minstens de naam van elk kind in.'); return; } goTo(4); }} />
              </div>
            </div>
          )}

          {/* STEP 4 — Thema */}
          {step === 4 && (
            <div data-testid="kb-step-theme">
              <h2 className="text-2xl font-bold mb-1">Kies een thema voor het avontuur</h2>
              <p className="text-slate-500 mb-6 text-sm">Waar droomt je kind over?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {config.themes.map(t => (
                  <button key={t.key} type="button" onClick={() => setTheme(t.key)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${theme === t.key ? 'border-warm-brown-500 bg-warm-brown-50 ring-2 ring-warm-brown-200' : 'border-slate-200 hover:border-warm-brown-300'}`}
                    data-testid={`kb-theme-${t.key}`}>
                    <div className="text-3xl mb-1">{t.emoji}</div>
                    <div className="text-sm font-semibold">{t.label}</div>
                  </button>
                ))}
              </div>
              {theme === 'eigen' && (
                <input type="text" placeholder="Vertel ons jouw thema (bijv. dino's, voetbal, eenhoorns...)" value={customTheme} onChange={e => setCustomTheme(e.target.value)}
                  className="w-full mt-4 px-4 py-3 border-2 border-warm-brown-300 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid="kb-custom-theme" />
              )}
              <div className="flex justify-between mt-8">
                <BackBtn onClick={() => goTo(3)} />
                <button type="button" onClick={handleGenerate}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-warm-brown-500 to-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all" data-testid="kb-generate-btn">
                  <Wand2 className="w-5 h-5" /> Maak mijn preview
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Generating */}
          {step === 5 && (
            <div className="text-center py-12" data-testid="kb-step-generating">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-warm-brown-100 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-warm-brown-500 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">We toveren je boek tot leven...</h2>
              <p className="text-slate-500">Onze AI schrijft het verhaal en tekent de eerste pagina's. Dit duurt ongeveer een minuut. ✨</p>
            </div>
          )}

          {/* STEP 6 — Preview */}
          {step === 6 && preview && (
            <div data-testid="kb-step-preview">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1">{preview.title}</h2>
                <p className="text-slate-500 text-sm">Een voorproefje — {preview.total_pages} pagina's in het volledige boek</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {preview.preview_pages.map((p, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50" data-testid={`kb-preview-page-${i}`}>
                    {p.image
                      ? <img src={p.image} alt={`Pagina ${i + 1}`} className="w-full h-56 object-cover" />
                      : <div className="w-full h-56 flex items-center justify-center text-slate-300"><BookOpen className="w-10 h-10" /></div>}
                    <p className="p-4 text-sm text-slate-700 leading-relaxed">{p.text}</p>
                  </div>
                ))}
              </div>
              <div className="bg-warm-brown-50 rounded-2xl p-5 flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-slate-500">{config.packages[pkg].label} · {config.formats[format].label}{physical ? ' · + gedrukt' : ' · digitaal'}</p>
                  <p className="text-2xl font-bold text-warm-brown-600">{fmtEur(price)}</p>
                </div>
                <Lock className="w-6 h-6 text-warm-brown-400" />
              </div>
              <p className="text-xs text-slate-400 text-center mb-6">Het volledige boek wordt na betaling automatisch gegenereerd in "Mijn Boek".</p>
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <BackBtn onClick={() => goTo(4)} label="Pas aan" />
                <button type="button" onClick={() => goTo(7)}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-warm-brown-500 to-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex-1 sm:flex-none" data-testid="kb-to-order-btn">
                  Bestel mijn boek <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7 — Levergegevens + Betaling */}
          {step === 7 && preview && (
            <div data-testid="kb-step-order">
              <h2 className="text-2xl font-bold mb-1">Bijna klaar!</h2>
              <p className="text-slate-500 mb-6 text-sm">Vul je gegevens in en reken veilig af via Mollie.</p>
              <div className="space-y-3">
                <input type="email" placeholder="E-mailadres *" value={delivery.email} onChange={e => setDelivery({ ...delivery, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid="kb-email" />
                <input type="text" placeholder="Naam" value={delivery.name} onChange={e => setDelivery({ ...delivery, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid="kb-name" />
                {physical && (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200" data-testid="kb-address-fields">
                    <p className="text-sm font-semibold text-slate-600 flex items-center gap-2"><Truck className="w-4 h-4" /> Verzendadres (gedrukt exemplaar)</p>
                    <input type="text" placeholder="Straat + huisnummer *" value={delivery.address} onChange={e => setDelivery({ ...delivery, address: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid="kb-address" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Postcode *" value={delivery.zipcode} onChange={e => setDelivery({ ...delivery, zipcode: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid="kb-zipcode" />
                      <input type="text" placeholder="Plaats *" value={delivery.city} onChange={e => setDelivery({ ...delivery, city: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none" data-testid="kb-city" />
                    </div>
                    <select value={delivery.country} onChange={e => setDelivery({ ...delivery, country: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none bg-white" data-testid="kb-country">
                      <option value="NL">Nederland</option>
                      <option value="BE">België</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="bg-warm-brown-50 rounded-2xl p-4 flex items-center justify-between my-5">
                <span className="font-semibold">Totaal</span>
                <span className="text-2xl font-bold text-warm-brown-600">{fmtEur(price)}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <BackBtn onClick={() => goTo(6)} />
                <button type="button" onClick={handleOrder} disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-warm-brown-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-warm-brown-600 transition-all disabled:opacity-50 flex-1 sm:flex-none" data-testid="kb-pay-btn">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verwerken...</> : <><Lock className="w-5 h-5" /> Veilig betalen {fmtEur(price)}</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-white/60 text-sm">
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-300" /> Uniek voor jouw kind</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-300" /> Gratis preview</span>
          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-amber-300" /> Met liefde gemaakt in NL</span>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const NextBtn = ({ onClick, label = 'Volgende' }) => (
  <button type="button" onClick={onClick}
    className="inline-flex items-center gap-2 bg-warm-brown-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-warm-brown-600 transition-all" data-testid="kb-next-btn">
    {label} <ArrowRight className="w-5 h-5" />
  </button>
);

const BackBtn = ({ onClick, label = 'Terug' }) => (
  <button type="button" onClick={onClick}
    className="inline-flex items-center gap-2 text-slate-500 px-4 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-all" data-testid="kb-back-btn">
    <ArrowLeft className="w-5 h-5" /> {label}
  </button>
);

export default KidsBookPage;
