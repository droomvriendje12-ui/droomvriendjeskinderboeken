import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Sparkles, Loader2, Download, ShoppingBag, RefreshCw,
  AlertTriangle, CheckCircle2, FileCode, FileSpreadsheet, Barcode, X, Check,
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const scoreColor = (s) => (s >= 80 ? 'text-emerald-300' : s >= 60 ? 'text-amber-300' : 'text-red-300');
const barColor = (s) => (s >= 80 ? 'bg-emerald-400' : s >= 60 ? 'bg-amber-400' : 'bg-red-400');
const GTIN_LABEL = {
  valid: { t: 'Geldig', c: 'text-emerald-300' },
  missing: { t: 'Ontbreekt', c: 'text-amber-300' },
  invalid_length: { t: 'Ongeldige lengte', c: 'text-red-300' },
  invalid_checksum: { t: 'Ongeldig controlecijfer', c: 'text-red-300' },
};

const ShoppingFeedBuilderPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(null); // product id
  const [preview, setPreview] = useState(null); // override result
  const [toast, setToast] = useState(null);

  const notify = (t, m) => { setToast({ t, m }); setTimeout(() => setToast(null), 6000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/shopping-feed/audit`, { headers: authHeaders() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Laden mislukt');
      setData(d);
    } catch (e) { notify('error', e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const optimize = async (pid) => {
    setOptimizing(pid);
    try {
      const r = await fetch(`${API}/api/shopping-feed/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ product_id: pid, save: true }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Optimalisatie mislukt');
      setPreview(d);
      notify('success', 'AI-optimalisatie opgeslagen. Wordt toegepast in de export.');
      load();
    } catch (e) { notify('error', e.message); }
    setOptimizing(null);
  };

  const download = async (fmt) => {
    try {
      const r = await fetch(`${API}/api/shopping-feed/export.${fmt}`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Export mislukt');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `droomvriendjes-merchant-feed.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { notify('error', e.message); }
  };

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="shopping-feed-page">
      <div className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-300 hover:text-white" data-testid="back-to-dashboard">
            <ChevronLeft className="w-5 h-5" /><span className="text-sm">Terug</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <ShoppingBag className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold">AI Shopping Feed Builder</h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => download('csv')} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm inline-flex items-center gap-2" data-testid="export-csv-btn"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
            <button onClick={() => download('xml')} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm inline-flex items-center gap-2" data-testid="export-xml-btn"><FileCode className="w-4 h-4" /> XML</button>
            <button onClick={load} className="p-2 rounded-lg hover:bg-white/10" data-testid="refresh-btn"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        <p className="text-sm text-slate-400">
          Optimalisatielaag bovenop je bestaande feed <a href={data?.feed_url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">google-shopping.xml</a>.
          AI-optimalisaties worden als overrides opgeslagen en toegepast in onderstaande CSV/XML-export — de bronfeed blijft intact.
        </p>

        {/* Summary */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="feed-summary">
            <Stat label="Producten" value={s.total_products} />
            <Stat label="MC-readiness (gem.)" value={`${s.avg_merchant_readiness}%`} accent={s.avg_merchant_readiness >= 80 ? 'green' : 'amber'} />
            <Stat label="Shopping SEO (gem.)" value={`${s.avg_shopping_seo}%`} accent={s.avg_shopping_seo >= 80 ? 'green' : 'amber'} />
            <Stat label="Met issues" value={s.products_with_issues} accent={s.products_with_issues ? 'amber' : 'green'} />
            <Stat label="GTIN ontbreekt" value={s.gtin_missing} accent="amber" />
            <Stat label="GTIN ongeldig" value={s.gtin_invalid} accent={s.gtin_invalid ? 'red' : 'green'} />
            <Stat label="AI-geoptimaliseerd" value={s.optimised} accent="green" />
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]" data-testid="feed-table">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-3">Product</th>
                <th className="text-left px-3 py-3">MC-readiness</th>
                <th className="text-left px-3 py-3">Shopping SEO</th>
                <th className="text-left px-3 py-3">GTIN/EAN</th>
                <th className="text-left px-3 py-3">Ontbrekend</th>
                <th className="text-left px-3 py-3">Product type</th>
                <th className="text-left px-3 py-3">Actie</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-10 text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>}
              {!loading && data?.products?.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 align-top" data-testid={`feed-row-${p.id}`}>
                  <td className="px-3 py-3 max-w-[260px]">
                    <p className="font-medium text-white truncate" title={p.name}>{p.name}</p>
                    <p className="text-xs text-slate-500">#{p.id} · titel {p.title_length}t · {p.image_count} afb. · {p.description_length}t omschr.{p.has_override && <span className="ml-1 text-fuchsia-300">· AI ✨</span>}</p>
                  </td>
                  <td className="px-3 py-3 w-[150px]"><ScoreBar score={p.merchant_readiness_score} /></td>
                  <td className="px-3 py-3 w-[150px]"><ScoreBar score={p.shopping_seo_score} /></td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${GTIN_LABEL[p.gtin_status]?.c || 'text-slate-300'}`}>
                      <Barcode className="w-3.5 h-3.5" /> {GTIN_LABEL[p.gtin_status]?.t || p.gtin_status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {p.missing_attributes.length === 0
                      ? <span className="inline-flex items-center gap-1 text-emerald-300 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Compleet</span>
                      : <span className="inline-flex items-center gap-1 text-amber-300 text-xs" title={p.missing_attributes.join(', ')}><AlertTriangle className="w-3.5 h-3.5" /> {p.missing_attributes.join(', ')}</span>}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 max-w-[180px]"><span className="line-clamp-2">{p.product_type}</span></td>
                  <td className="px-3 py-3">
                    <button onClick={() => optimize(p.id)} disabled={optimizing === p.id} className="px-2.5 py-1.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 text-xs inline-flex items-center gap-1.5 disabled:opacity-50" data-testid={`optimize-${p.id}`}>
                      {optimizing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI optimaliseer
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && (!data?.products || data.products.length === 0) && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Geen producten gevonden.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="optimize-preview">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-fuchsia-300" /><h3 className="font-semibold text-lg">AI-geoptimaliseerd product</h3></div>
            <p className="text-xs text-slate-400 mb-1">Titel</p>
            <p className="text-sm bg-slate-800 rounded-lg p-3 mb-3">{preview.title}</p>
            <p className="text-xs text-slate-400 mb-1">Beschrijving</p>
            <p className="text-sm bg-slate-800 rounded-lg p-3 mb-3 whitespace-pre-wrap">{preview.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><p className="text-xs text-slate-400 mb-1">Product type</p><p className="text-sm bg-slate-800 rounded-lg p-2">{preview.product_type}</p></div>
              <div><p className="text-xs text-slate-400 mb-1">Google categorie</p><p className="text-sm bg-slate-800 rounded-lg p-2">{preview.google_product_category}</p></div>
            </div>
            {preview.suggested_keywords?.length > 0 && (
              <>
                <p className="text-xs text-slate-400 mb-1">Voorgestelde zoekwoorden</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {preview.suggested_keywords.map((k, i) => <span key={i} className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-200 text-xs">{k}</span>)}
                </div>
              </>
            )}
            <div className="flex justify-end">
              <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-semibold text-sm inline-flex items-center gap-2" data-testid="preview-close"><Check className="w-4 h-4" /> Klaar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.t === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">{toast.m}</div>}
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div className={`rounded-xl p-3 border ${accent === 'green' ? 'bg-emerald-500/5 border-emerald-400/30' : accent === 'amber' ? 'bg-amber-500/5 border-amber-400/30' : accent === 'red' ? 'bg-red-500/5 border-red-400/30' : 'bg-white/5 border-white/10'}`}>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const ScoreBar = ({ score }) => (
  <div>
    <div className="flex justify-between text-xs mb-1"><span className={scoreColor(score)}>{score}%</span></div>
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full ${barColor(score)} transition-all`} style={{ width: `${score}%` }} />
    </div>
  </div>
);

export default ShoppingFeedBuilderPage;
