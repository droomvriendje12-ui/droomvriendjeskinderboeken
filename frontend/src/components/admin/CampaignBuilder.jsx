import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Rocket, Sparkles, Copy, Check, Loader2, ExternalLink, Save, Calendar, Euro, Target,
} from 'lucide-react';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);

const OBJECTIVES = [
  { key: 'awareness', label: 'Merkbekendheid', hint: 'Brede targeting · TikTok & Instagram Reels werken het best' },
  { key: 'traffic', label: 'Websiteverkeer', hint: 'Stuur bezoekers naar product/landingspagina · Instagram & Google' },
  { key: 'conversions', label: 'Verkopen / Conversies', hint: 'Retargeting + kortingscode · Meta & Google leveren de meeste sales' },
  { key: 'leads', label: 'Leadgeneratie', hint: 'Verzamel e-mails (bv. via de Quiz) · Meta-formulieren & Instagram' },
];

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', launch: 'https://www.instagram.com/droom_vriendjes/', ads: 'https://www.facebook.com/adsmanager/', color: 'from-pink-500 to-purple-600' },
  { key: 'tiktok', label: 'TikTok', launch: 'https://www.tiktok.com/@droomvriendjes.com', ads: 'https://ads.tiktok.com/', color: 'from-slate-700 to-black' },
  { key: 'x', label: 'X (Premium)', launch: 'https://x.com/compose/post', ads: 'https://x.com/i/premium', color: 'from-slate-600 to-black' },
  { key: 'facebook', label: 'Meta Ads', launch: 'https://www.facebook.com/adsmanager/', ads: 'https://www.facebook.com/adsmanager/', color: 'from-blue-500 to-blue-700' },
  { key: 'google', label: 'Google Ads', launch: 'https://ads.google.com/', ads: 'https://ads.google.com/', color: 'from-amber-500 to-red-500' },
];

const CampaignBuilder = ({ isOpen, onClose, products = [], onSaved }) => {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('conversions');
  const [productId, setProductId] = useState('');
  const [platforms, setPlatforms] = useState(['instagram', 'tiktok']);
  const [budget, setBudget] = useState('150');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adCopy, setAdCopy] = useState({});
  const [copyPlatform, setCopyPlatform] = useState('instagram');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const selectedProduct = products.find((p) => String(p.id) === String(productId));
  const objMeta = OBJECTIVES.find((o) => o.key === objective);

  const reset = useCallback(() => {
    setName(''); setObjective('conversions'); setPlatforms(['instagram', 'tiktok']);
    setBudget('150'); setStartDate(''); setEndDate(''); setAdCopy({}); setGenError(''); setSaveMsg('');
  }, []);

  useEffect(() => {
    if (isOpen && !productId && products.length) setProductId(String(products[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlatform = (k) => {
    setPlatforms((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
  };

  const generateCopy = async () => {
    if (!selectedProduct) { setGenError('Kies eerst een product'); return; }
    setGenLoading(true); setGenError('');
    try {
      const r = await fetch(`/api/marketing-hub/ad-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ product_name: selectedProduct.name, platform: copyPlatform }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'AI-generatie mislukt');
      setAdCopy((prev) => ({ ...prev, [copyPlatform]: d.copy || '' }));
    } catch (e) {
      setGenError(e.message || 'AI-generatie mislukt');
    }
    setGenLoading(false);
  };

  const copyTxt = (t, k) => { navigator.clipboard?.writeText(t); setCopied(k); setTimeout(() => setCopied(''), 1600); };

  const save = async () => {
    if (!name.trim()) { setSaveMsg('Geef de campagne een naam'); return; }
    setSaving(true); setSaveMsg('');
    try {
      const r = await fetch(`/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          name: name.trim(), objective, product_id: productId,
          product_name: selectedProduct?.name || '', platforms, budget: parseFloat(budget) || 0,
          start_date: startDate, end_date: endDate, ad_copy: adCopy, status: 'concept',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Opslaan mislukt');
      setSaveMsg('✓ Campagne opgeslagen!');
      onSaved && onSaved();
      setTimeout(() => { reset(); onClose(); }, 900);
    } catch (e) {
      setSaveMsg(e.message || 'Opslaan mislukt');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-slate-950/80 backdrop-blur-sm" data-testid="campaign-builder-modal">
      <div className="relative w-full max-w-3xl my-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Nieuwe Campagne</h2>
              <p className="text-white/40 text-xs font-medium">Plan, genereer AI-tekst &amp; lanceer</p>
            </div>
          </div>
          <button onClick={onClose} data-testid="campaign-close" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Basis */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Campagnenaam</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="bijv. Zomer Slaapactie 2026" data-testid="campaign-name"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Doel</label>
              <select value={objective} onChange={(e) => setObjective(e.target.value)} data-testid="campaign-objective"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none">
                {OBJECTIVES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block">Product</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} data-testid="campaign-product"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {objMeta && (
            <p className="text-xs text-emerald-400/80 flex items-center gap-1.5 -mt-2"><Sparkles className="w-3.5 h-3.5" /> {objMeta.hint}</p>
          )}

          {/* Platforms */}
          <div>
            <label className="text-xs font-semibold text-white/50 mb-2 block">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = platforms.includes(p.key);
                return (
                  <button key={p.key} onClick={() => togglePlatform(p.key)} data-testid={`campaign-platform-${p.key}`}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${on ? `text-white bg-gradient-to-r ${p.color} border-transparent` : 'text-white/50 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    {on && <Check className="w-3.5 h-3.5" />} {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget + dates */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block flex items-center gap-1"><Euro className="w-3.5 h-3.5" /> Budget (€)</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} data-testid="campaign-budget"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="campaign-start"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1.5 block flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Eind</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="campaign-end"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
          </div>

          {/* AI copy */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white text-sm">AI-advertentietekst (GPT-5.2)</span>
              <select value={copyPlatform} onChange={(e) => setCopyPlatform(e.target.value)} data-testid="campaign-copy-platform"
                className="ml-auto bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
                {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <button onClick={generateCopy} disabled={genLoading} data-testid="campaign-generate-copy"
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                {genLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Genereer
              </button>
            </div>
            {genError && <p className="text-red-400 text-xs mb-2">{genError}</p>}
            {adCopy[copyPlatform] ? (
              <div className="relative">
                <textarea readOnly value={adCopy[copyPlatform]} rows={7}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-sm text-white/90 leading-relaxed resize-none" data-testid="campaign-copy-result" />
                <button onClick={() => copyTxt(adCopy[copyPlatform], 'c')} className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-lg">
                  {copied === 'c' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <p className="text-white/30 text-xs">Kies een platform en klik "Genereer" voor een kant-en-klare advertentietekst.</p>
            )}
          </div>

          {/* Launch links */}
          <div>
            <label className="text-xs font-semibold text-white/50 mb-2 block">Lanceer op je kanalen</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.filter((p) => platforms.includes(p.key)).map((p) => (
                <a key={p.key} href={p.launch} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl bg-gradient-to-r ${p.color} hover:opacity-90 transition`}>
                  <ExternalLink className="w-3.5 h-3.5" /> {p.label}
                </a>
              ))}
              {platforms.length === 0 && <span className="text-white/30 text-xs">Selecteer eerst platforms.</span>}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={save} disabled={saving} data-testid="campaign-save"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/25">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Campagne opslaan
            </button>
            {saveMsg && <span className={`text-sm ${saveMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`} data-testid="campaign-save-msg">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;
