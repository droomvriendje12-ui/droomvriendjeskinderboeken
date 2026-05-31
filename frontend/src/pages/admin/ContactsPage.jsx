import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Search, RefreshCw, Trash2, AlertTriangle,
  ChevronRight, Loader2, ShieldAlert
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const PAGE_SIZE = 50;

// Sources that are NOT opt-in Droomvriendjes audiences (purchased / unrelated lists)
const RISKY_HINTS = ['zonnepanelen', 'datafanatics', 'huiseigenaar', 'lead'];
const isRisky = (src) => !!src && RISKY_HINTS.some((h) => src.toLowerCase().includes(h));

const ContactsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState([]);
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 5000); };

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(page * PAGE_SIZE) });
      if (source) params.append('source', source);
      if (search.trim()) params.append('search', search.trim());
      const r = await fetch(`${API}/api/email/csv/queue?${params.toString()}`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setItems(d.items || []);
        setTotal(d.total || 0);
        if (d.sources) setSources(d.sources);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, source, search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const totalAll = sources.reduce((s, x) => s + (x.count || 0), 0);

  const handleDeleteSource = async (src) => {
    if (!src) return;
    if (!window.confirm(`Weet je zeker dat je ALLE ${src ? `"${src}"` : ''}-contacten wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    try {
      const r = await fetch(`${API}/api/email/csv/queue?source=${encodeURIComponent(src)}`, { method: 'DELETE', headers: authHeaders() });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.detail || `Status ${r.status}`);
      notify('success', `Bron "${src}" verwijderd.`);
      setSource(''); setPage(0); fetchContacts();
    } catch (e) { notify('error', e.message || 'Verwijderen mislukt'); }
  };

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="contacts-page">
      <div className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-300 hover:text-white transition" data-testid="back-to-dashboard">
            <ChevronLeft className="w-5 h-5" /><span className="text-sm">Terug</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <Users className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold">Contacten ({totalAll.toLocaleString('nl-NL')})</h1>
          <button onClick={fetchContacts} className="ml-auto p-2 rounded-lg hover:bg-white/10" title="Vernieuwen" data-testid="refresh-btn">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
        {/* GDPR warning */}
        <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-5 flex gap-4" data-testid="gdpr-warning">
          <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-100/90">
            <p className="font-semibold text-amber-200 mb-1">Belangrijk over AVG &amp; je domeinreputatie</p>
            <p>Stuur marketing alléén naar mensen die zich hebben aangemeld (quiz, pop-up, klanten). Ingekochte of niet-opt-in lijsten
            (bijv. <span className="font-mono">zonnepanelen_leads</span>, <span className="font-mono">huiseigenaar</span>) leiden tot spamklachten en bounces die je net-geverifieerde
            domein <span className="font-semibold">droomvriendjes.com</span> beschadigen — daarna belanden óók je bestelmails in spam. Overweeg deze bronnen te verwijderen.</p>
          </div>
        </div>

        {/* Source stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="source-stats">
          {sources.map((s) => (
            <div key={s.source || 'onbekend'} className={`rounded-xl p-3 border ${isRisky(s.source) ? 'bg-amber-500/5 border-amber-400/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 truncate" title={s.source || 'onbekend'}>{s.source || 'onbekend'}</p>
                  <p className="text-lg font-bold">{(s.count || 0).toLocaleString('nl-NL')}</p>
                </div>
                {isRisky(s.source) && (
                  <button onClick={() => handleDeleteSource(s.source)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400" title="Verwijder deze bron" data-testid={`delete-source-${s.source}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isRisky(s.source) && <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 mt-1"><AlertTriangle className="w-3 h-3" /> niet opt-in</span>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(0); }} className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-400" data-testid="source-filter">
            <option value="">Alle bronnen</option>
            {sources.map((s) => (<option key={s.source || 'onbekend'} value={s.source || ''}>{s.source || 'onbekend'} ({s.count})</option>))}
          </select>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); fetchContacts(); } }}
              placeholder="Zoek op e-mail of naam... (Enter)"
              className="w-full bg-slate-800 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm" data-testid="contacts-table">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-left px-4 py-3">Naam</th>
                <th className="text-left px-4 py-3">Bron</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Geen contacten gevonden.</td></tr>
              )}
              {!loading && items.map((it, i) => (
                <tr key={(it.email || 'x') + i} className="border-t border-white/5 hover:bg-white/5" data-testid="contact-row">
                  <td className="px-4 py-2.5 text-slate-200">{it.email || <span className="text-red-400/70 italic">leeg</span>}</td>
                  <td className="px-4 py-2.5 text-slate-300">{it.naam || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400 max-w-[260px] truncate" title={it.source || ''}>{it.source || 'onbekend'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${it.status === 'sent' ? 'bg-emerald-500/20 text-emerald-300' : it.status === 'unsubscribed' ? 'bg-red-500/20 text-red-300' : 'bg-slate-500/20 text-slate-300'}`}>{it.status || 'queued'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span data-testid="pagination-info">{total.toLocaleString('nl-NL')} contacten · pagina {page + 1} / {maxPage + 1}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 inline-flex items-center gap-1" data-testid="prev-page"><ChevronLeft className="w-4 h-4" /> Vorige</button>
            <button disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 inline-flex items-center gap-1" data-testid="next-page">Volgende <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.type === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
