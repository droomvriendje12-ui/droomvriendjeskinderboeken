import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Upload, X, Plus, BookOpen, Wand2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

const THEME_SUGGESTIONS = [
  'Een reis naar de maan',
  'Onderwater-avontuur',
  'De dappere kleine ridder',
  'Een nacht in het sprookjesbos',
  'Op de rug van een draak',
];

// Downscale een foto client-side -> kleine JPEG data-URL (snelle upload, privacy-vriendelijk)
const fileToDownscaledDataUrl = (file, maxDim = 800, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const StoryGenerator = () => {
  const [characters, setCharacters] = useState([{ name: '', photo: null }]);
  const [theme, setTheme] = useState('');
  const [title, setTitle] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(null);
  const fileRefs = useRef([]);

  useEffect(() => {
    fetch(`${API}/api/story/quota`).then((r) => r.json()).then((d) => setRemaining(d.remaining)).catch(() => {});
  }, []);

  const setCharField = (i, field, value) => setCharacters((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const handlePhoto = async (i, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setCharField(i, 'photo', dataUrl);
    } catch { setError('Kon de foto niet verwerken. Probeer een andere foto.'); }
  };

  const addCharacter = () => { if (characters.length < 2) setCharacters((p) => [...p, { name: '', photo: null }]); };
  const removeCharacter = (i) => setCharacters((p) => p.filter((_, idx) => idx !== i));

  const generate = async () => {
    setError('');
    if (!characters[0].name.trim()) { setError('Vul de naam van de hoofdpersoon in.'); return; }
    if (!theme.trim()) { setError('Kies of beschrijf een thema.'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API}/api/story/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          theme: theme.trim(),
          age: age.trim(),
          characters: characters.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), photo_base64: c.photo })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Er ging iets mis bij het genereren.');
      setResult(d);
      if (typeof d.remaining === 'number') setRemaining(d.remaining);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <section id="verhaal" className="bg-gradient-to-b from-white via-amber-50/40 to-white py-20 sm:py-24" data-testid="story-generator">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-600 mb-3">
            <Wand2 className="w-4 h-4" /> Nieuw · AI Droomverhaal
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 leading-tight mb-4">
            Maak jouw eigen <span className="italic text-amber-600">gepersonaliseerde bedtijdverhaal</span>
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Vul de naam van je kindje in, kies een thema en upload (optioneel) een foto. Onze AI schrijft direct een
            uniek bedtijdverhaal mét illustratie — met jouw kind als held van het verhaal. Gratis preview.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start">
          {/* FORM */}
          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 sm:p-8" data-testid="story-form">
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Verhaaltitel <span className="text-stone-400 font-normal">(optioneel)</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="bijv. Sofie's ruimte-avontuur" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 mb-4" data-testid="story-title-input" />

            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Thema <span className="text-amber-600">*</span></label>
            <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="bijv. een reis naar de maan" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 mb-2" data-testid="story-theme-input" />
            <div className="flex flex-wrap gap-1.5 mb-5">
              {THEME_SUGGESTIONS.map((t) => (
                <button key={t} type="button" onClick={() => setTheme(t)} className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors" data-testid={`story-theme-chip`}>{t}</button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-stone-700 mb-2">Personages</label>
            <div className="space-y-3 mb-3">
              {characters.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3 border border-stone-100" data-testid={`story-character-${i}`}>
                  <label className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer bg-white hover:border-amber-400 transition-colors" title="Upload foto (optioneel)">
                    {c.photo ? (
                      <img src={c.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-stone-400" />
                    )}
                    <input ref={(el) => (fileRefs.current[i] = el)} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(i, e.target.files[0])} data-testid={`story-char-photo-${i}`} />
                  </label>
                  <input value={c.name} onChange={(e) => setCharField(i, 'name', e.target.value)} placeholder={i === 0 ? 'Naam hoofdpersoon *' : 'Naam personage'} className="flex-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" data-testid={`story-char-name-${i}`} />
                  {i > 0 && (
                    <button type="button" onClick={() => removeCharacter(i)} className="p-1.5 text-stone-400 hover:text-red-500" data-testid={`story-remove-char-${i}`}><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            {characters.length < 2 && (
              <button type="button" onClick={addCharacter} className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium mb-5" data-testid="story-add-character">
                <Plus className="w-4 h-4" /> Nog een personage toevoegen
              </button>
            )}

            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Leeftijd <span className="text-stone-400 font-normal">(optioneel)</span></label>
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="bijv. 4" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 mb-5" data-testid="story-age-input" />

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mb-4" data-testid="story-error">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <button type="button" onClick={generate} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl shadow-lg transition-all hover:translate-y-[-2px]" data-testid="story-generate-btn">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Verhaal wordt geschreven…' : 'Genereer gratis preview'}
            </button>
            <p className="text-center text-xs text-stone-400 mt-3" data-testid="story-remaining">
              {remaining === null ? 'Maximaal 2 gratis previews per dag' : `Nog ${remaining} gratis preview${remaining === 1 ? '' : 's'} vandaag`}
            </p>
          </div>

          {/* RESULT / PREVIEW */}
          <div className="bg-gradient-to-br from-[#2a1f44] to-[#3a2a4f] rounded-3xl p-6 sm:p-8 text-white min-h-[400px] flex flex-col" data-testid="story-result-panel">
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-white/70">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-300" />
                <p className="font-medium">Onze AI verzint jouw verhaal en illustratie…</p>
                <p className="text-xs mt-1">Dit duurt ongeveer 15-25 seconden.</p>
              </div>
            )}
            {!loading && !result && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-white/60">
                <BookOpen className="w-12 h-12 mb-3 text-white/30" />
                <p>Je gepersonaliseerde verhaal verschijnt hier.<br />Vul het formulier in en klik op <span className="text-amber-300 font-semibold">Genereer gratis preview</span>.</p>
              </div>
            )}
            {!loading && result && (
              <div data-testid="story-result">
                {result.image && (
                  <img src={result.image} alt={result.title} className="w-full rounded-2xl mb-5 shadow-lg" data-testid="story-result-image" />
                )}
                <h3 className="text-2xl font-bold text-amber-300 mb-3" data-testid="story-result-title">{result.title}</h3>
                <div className="text-white/85 text-sm leading-relaxed whitespace-pre-line mb-6" data-testid="story-result-text">{result.story}</div>
                <div className="border-t border-white/10 pt-5">
                  <p className="text-amber-200/90 text-sm mb-3">Wil je het volledige, geïllustreerde verhaal?</p>
                  <Link to="/knuffels" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold px-5 py-3 rounded-xl transition-all" data-testid="story-cta">
                    Ontdek de Droomvriendjes <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoryGenerator;
