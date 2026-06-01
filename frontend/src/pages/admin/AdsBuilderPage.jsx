import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Sparkles, Loader2, Download, Search, Megaphone,
  Tag, Link2, ListChecks, Ban, Target,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const LANG = [
  { v: 'nl', l: 'Nederlands' },
  { v: 'de', l: 'Duits' },
  { v: 'fr', l: 'Frans' },
];

const AdsBuilderPage = () => {
  const navigate = useNavigate();
  const [productFocus, setProductFocus] = useState('Slaapknuffel met nachtlampje en white noise');
  const [seeds, setSeeds] = useState('slaapknuffel, knuffel met nachtlampje, white noise knuffel, kraamcadeau');
  const [budget, setBudget] = useState(15);
  const [language, setLanguage] = useState('nl');
  const [finalUrl, setFinalUrl] = useState('https://droomvriendjes.com/knuffels');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);

  const notify = (t, m) => { setToast({ t, m }); setTimeout(() => setToast(null), 6000); };

  const generate = async () => {
    if (!productFocus.trim()) return notify('error', 'Vul een productfocus in.');
    setLoading(true); setCampaign(null);
    try {
      const r = await fetch(`${API}/api/ads-builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          product_focus: productFocus,
          seed_keywords: seeds.split(',').map((s) => s.trim()).filter(Boolean),
          daily_budget: Number(budget) || 15,
          language,
          final_url: finalUrl,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Genereren mislukt');
      setCampaign(d);
      notify('success', 'Campagne gegenereerd. Controleer en exporteer naar Google Ads Editor.');
    } catch (e) { notify('error', e.message); }
    setLoading(false);
  };

  const exportCsv = async () => {
    if (!campaign) return;
    setExporting(true);
    try {
      const r = await fetch(`${API}/api/ads-builder/export-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ campaign }),
      });
      if (!r.ok) throw new Error('Export mislukt');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'google-ads-search-campaign.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { notify('error', e.message); }
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="ads-builder-page">
      <div className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[1300px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-300 hover:text-white" data-testid="back-to-dashboard">
            <ChevronLeft className="w-5 h-5" /><span className="text-sm">Terug</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <Megaphone className="w-6 h-6 text-sky-400" />
          <h1 className="text-xl font-semibold">AI Search Campagne Builder</h1>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">Google Ads · SEA</span>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-6 py-6 grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Input panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 h-fit lg:sticky lg:top-6" data-testid="ads-input-panel">
          <h2 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-sky-300" /> Campagne-input</h2>
          <Field label="Productfocus">
            <input value={productFocus} onChange={(e) => setProductFocus(e.target.value)} className="inp" data-testid="ads-product-focus" />
          </Field>
          <Field label="Startzoekwoorden (komma-gescheiden)">
            <textarea value={seeds} onChange={(e) => setSeeds(e.target.value)} rows={3} className="inp resize-none" data-testid="ads-seeds" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dagbudget (€)">
              <input type="number" min="1" value={budget} onChange={(e) => setBudget(e.target.value)} className="inp" data-testid="ads-budget" />
            </Field>
            <Field label="Taal">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="inp" data-testid="ads-language">
                {LANG.map((l) => <option key={l.v} value={l.v} className="bg-slate-800">{l.l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Final URL">
            <input value={finalUrl} onChange={(e) => setFinalUrl(e.target.value)} className="inp" data-testid="ads-final-url" />
          </Field>
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60" data-testid="ads-generate-btn">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'AI bouwt campagne…' : 'Genereer campagne'}
          </button>
          {campaign && (
            <button onClick={exportCsv} disabled={exporting} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold inline-flex items-center justify-center gap-2" data-testid="ads-export-btn">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Exporteer (Google Ads Editor CSV)
            </button>
          )}
        </div>

        {/* Result panel */}
        <div className="space-y-5" data-testid="ads-result-panel">
          {!campaign && !loading && (
            <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center text-slate-400">
              <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-500" />
              <p>Vul de input in en klik op <b className="text-sky-300">Genereer campagne</b>.<br />GPT-5.2 bouwt zoekwoorden, advertentiegroepen, RSA-advertenties, sitelinks, callouts en uitsluitingen.</p>
            </div>
          )}
          {loading && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-300" />
              AI stelt een conversiegerichte zoekcampagne samen…
            </div>
          )}
          {campaign && (
            <>
              <div className="bg-gradient-to-r from-sky-500/15 to-transparent border border-sky-400/20 rounded-2xl p-5 flex flex-wrap items-center gap-4" data-testid="ads-campaign-header">
                <div>
                  <p className="text-xs text-slate-400">Campagnenaam</p>
                  <p className="text-lg font-bold">{campaign.campaign_name}</p>
                </div>
                <div className="ml-auto flex gap-5 text-sm">
                  <div><p className="text-xs text-slate-400">Dagbudget</p><p className="font-semibold">€ {campaign.daily_budget}</p></div>
                  <div><p className="text-xs text-slate-400">Advertentiegroepen</p><p className="font-semibold">{(campaign.ad_groups || []).length}</p></div>
                  <div><p className="text-xs text-slate-400">Taal</p><p className="font-semibold uppercase">{campaign.language}</p></div>
                </div>
              </div>

              {(campaign.ad_groups || []).map((ag, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5" data-testid={`ads-group-${i}`}>
                  <h3 className="font-semibold text-sky-200 mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4" /> {ag.name}</h3>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs uppercase text-slate-400 mb-2 flex items-center gap-1"><Search className="w-3.5 h-3.5" /> Zoekwoorden</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(ag.keywords || []).map((k, j) => (
                          <span key={j} className="px-2 py-1 rounded-lg bg-slate-800 text-xs border border-white/5">
                            {k.text} <span className="text-slate-500">· {k.match}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400 mb-2">Headlines ({(ag.headlines || []).length})</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(ag.headlines || []).map((h, j) => (
                          <span key={j} className={`px-2 py-1 rounded-lg text-xs ${h.length > 30 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/15 text-emerald-200'}`} title={`${h.length} tekens`}>{h}</span>
                        ))}
                      </div>
                      <p className="text-xs uppercase text-slate-400 mb-2">Descriptions</p>
                      <ul className="space-y-1">
                        {(ag.descriptions || []).map((d, j) => (
                          <li key={j} className={`text-xs ${d.length > 90 ? 'text-red-300' : 'text-slate-300'}`} title={`${d.length} tekens`}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid md:grid-cols-2 gap-5">
                <Card title="Sitelinks" icon={<Link2 className="w-4 h-4" />}>
                  <ul className="space-y-1.5 text-sm">
                    {(campaign.sitelinks || []).map((s, i) => (
                      <li key={i} className="flex justify-between gap-2"><span className="text-slate-200">{s.text}</span><span className="text-slate-500 text-xs truncate max-w-[160px]">{s.url}</span></li>
                    ))}
                  </ul>
                </Card>
                <Card title="Callouts" icon={<Tag className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {(campaign.callouts || []).map((c, i) => <span key={i} className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-200 text-xs">{c}</span>)}
                  </div>
                </Card>
                {campaign.structured_snippets && (
                  <Card title={`Snippets: ${campaign.structured_snippets.header || ''}`} icon={<ListChecks className="w-4 h-4" />}>
                    <div className="flex flex-wrap gap-1.5">
                      {(campaign.structured_snippets.values || []).map((v, i) => <span key={i} className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-200 text-xs">{v}</span>)}
                    </div>
                  </Card>
                )}
                <Card title="Negatieve zoekwoorden" icon={<Ban className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {(campaign.negative_keywords || []).map((n, i) => <span key={i} className="px-2 py-1 rounded-lg bg-red-500/15 text-red-200 text-xs">{n}</span>)}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.t === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">{toast.m}</div>}

      <style>{`.inp{width:100%;background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:.6rem;padding:.55rem .7rem;font-size:.85rem;color:#fff}.inp:focus{outline:none;border-color:#38bdf8}`}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div><label className="text-xs text-slate-400 block mb-1">{label}</label>{children}</div>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
    <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-200">{icon} {title}</h3>
    {children}
  </div>
);

export default AdsBuilderPage;
