import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Megaphone, Tag, TrendingUp, Sparkles, Copy, Check, Loader2,
  ExternalLink, ShoppingBag, Euro, Plus, BarChart3,
} from 'lucide-react';

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/droom_vriendjes/', color: 'from-pink-500 to-purple-600' },
  { key: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@droomvriendjes.com', color: 'from-slate-700 to-slate-900' },
  { key: 'x', label: 'X', url: 'https://x.com/DVriendje', color: 'from-slate-600 to-black' },
  { key: 'facebook', label: 'Meta Ads', url: 'https://www.facebook.com/adsmanager/', color: 'from-blue-500 to-blue-700' },
  { key: 'google', label: 'Google Ads', url: 'https://ads.google.com/', color: 'from-amber-500 to-red-500' },
];

const euro = (n) => `€${Number(n || 0).toFixed(2).replace('.', ',')}`;

/**
 * Marketing & Sales Hub — premium overlay launched from the floating 🤖 button.
 * Three commercial quick-actions: ad creation (AI), promotions, conversion snapshot.
 */
const MarketingSalesHub = ({ isOpen, onClose, products = [] }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  // --- Ad creation state ---
  const [adProductId, setAdProductId] = useState('');
  const [adPlatform, setAdPlatform] = useState('instagram');
  const [adCopy, setAdCopy] = useState('');
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState('');
  const [copied, setCopied] = useState('');

  // --- Promo state ---
  const [promoCode, setPromoCode] = useState('');
  const [promoType, setPromoType] = useState('percentage');
  const [promoValue, setPromoValue] = useState('10');
  const [promoMsg, setPromoMsg] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // --- Snapshot state ---
  const [snapshot, setSnapshot] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);

  const selectedProduct = products.find((p) => String(p.id) === String(adProductId));

  const loadSnapshot = useCallback(async () => {
    setSnapLoading(true);
    try {
      const r = await fetch(`/api/marketing-hub/best-sellers-today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setSnapshot(await r.json());
    } catch { /* ignore */ }
    setSnapLoading(false);
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      loadSnapshot();
      if (!adProductId && products.length) setAdProductId(String(products[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const productLink = selectedProduct
    ? `https://droomvriendjes.com/product/${selectedProduct.slug || selectedProduct.id}?utm_source=${adPlatform}&utm_medium=social&utm_campaign=hub`
    : 'https://droomvriendjes.com';

  const copyText = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1800);
  };

  const generateAd = async () => {
    if (!selectedProduct) return;
    setAdLoading(true); setAdError(''); setAdCopy('');
    try {
      const r = await fetch(`/api/marketing-hub/ad-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_name: selectedProduct.name, platform: adPlatform }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'AI-generatie mislukt');
      setAdCopy(d.copy || '');
    } catch (e) {
      setAdError(e.message || 'AI-generatie mislukt');
    }
    setAdLoading(false);
  };

  const createPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code || !promoValue) { setPromoMsg('Vul een code en waarde in'); return; }
    setPromoLoading(true); setPromoMsg('');
    try {
      const r = await fetch(`/api/discount-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code,
          discount_type: promoType,
          discount_value: promoType === 'free_shipping' ? 0 : parseFloat(promoValue),
          min_order_amount: 0,
          active: true,
          description: 'Aangemaakt via Marketing & Sales Hub',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Kon code niet aanmaken');
      setPromoMsg(`✓ Code "${code}" aangemaakt!`);
      setPromoCode('');
    } catch (e) {
      setPromoMsg(e.message || 'Kon code niet aanmaken');
    }
    setPromoLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-slate-950/80 backdrop-blur-sm" data-testid="marketing-hub-modal">
      <div className="relative w-full max-w-3xl my-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Marketing &amp; Sales Hub</h2>
              <p className="text-white/40 text-xs font-medium">Snelle commerciële acties</p>
            </div>
          </div>
          <button onClick={onClose} data-testid="hub-close" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ===== 1. Advertentie aanmaken ===== */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5" data-testid="hub-ad-section">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white">Advertentie aanmaken</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <select value={adProductId} onChange={(e) => setAdProductId(e.target.value)} data-testid="hub-ad-product"
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={adPlatform} onChange={(e) => setAdPlatform(e.target.value)} data-testid="hub-ad-platform"
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none">
                {SOCIALS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <button onClick={generateAd} disabled={adLoading || !selectedProduct} data-testid="hub-generate-ad"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition mb-3">
              {adLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {adLoading ? 'Tekst genereren met AI…' : 'Genereer advertentietekst (AI)'}
            </button>
            {adError && <p className="text-red-400 text-sm mb-3" data-testid="hub-ad-error">{adError}</p>}
            {adCopy && (
              <div className="relative mb-3" data-testid="hub-ad-result">
                <textarea readOnly value={adCopy} rows={9}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-sm text-white/90 leading-relaxed resize-none" />
                <button onClick={() => copyText(adCopy, 'ad')} className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition">
                  {copied === 'ad' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'ad' ? 'Gekopieerd' : 'Kopieer'}
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <input readOnly value={productLink}
                className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 truncate" />
              <button onClick={() => copyText(productLink, 'link')} className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition whitespace-nowrap" data-testid="hub-copy-link">
                {copied === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Productlink
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl bg-gradient-to-r ${s.color} hover:opacity-90 transition`}>
                  <ExternalLink className="w-3.5 h-3.5" /> {s.label}
                </a>
              ))}
            </div>
          </section>

          {/* ===== 2. Promoties ===== */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5" data-testid="hub-promo-section">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Promotie aanmaken</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="CODE bijv. ZOMER10" data-testid="hub-promo-code"
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-500 outline-none uppercase" />
              <select value={promoType} onChange={(e) => setPromoType(e.target.value)} data-testid="hub-promo-type"
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 outline-none">
                <option value="percentage">% korting</option>
                <option value="fixed">€ korting</option>
                <option value="free_shipping">Gratis verzending</option>
              </select>
              <input type="number" value={promoValue} onChange={(e) => setPromoValue(e.target.value)} disabled={promoType === 'free_shipping'} placeholder="Waarde" data-testid="hub-promo-value"
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-500 outline-none disabled:opacity-40" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={createPromo} disabled={promoLoading} data-testid="hub-create-promo"
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition">
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Code aanmaken
              </button>
              <a href="/admin/discount-codes" className="text-sm text-white/50 hover:text-white transition">Beheer alle codes →</a>
            </div>
            {promoMsg && <p className={`text-sm mt-3 ${promoMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`} data-testid="hub-promo-msg">{promoMsg}</p>}
          </section>

          {/* ===== 3. Conversie-snapshot ===== */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5" data-testid="hub-snapshot-section">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white">Conversie-snapshot — vandaag</h3>
            </div>
            {snapLoading ? (
              <div className="flex items-center gap-2 text-white/50 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Laden…</div>
            ) : snapshot ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1"><Euro className="w-3.5 h-3.5" /> Omzet vandaag</div>
                    <div className="text-2xl font-black text-emerald-400">{euro(snapshot.revenue_today)}</div>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1"><ShoppingBag className="w-3.5 h-3.5" /> Bestellingen</div>
                    <div className="text-2xl font-black text-white">{snapshot.orders_today}</div>
                  </div>
                </div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Best verkocht vandaag</p>
                {snapshot.top_products?.length ? (
                  <div className="space-y-2">
                    {snapshot.top_products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-950/40 rounded-xl px-3 py-2">
                        <span className="flex items-center gap-2 text-sm text-white/90 truncate">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="text-sm text-white/60 whitespace-nowrap">{p.units}× · {euro(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Nog geen verkopen vandaag.</p>
                )}
              </>
            ) : (
              <p className="text-white/40 text-sm">Geen data beschikbaar.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MarketingSalesHub;
