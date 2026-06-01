import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Pencil, Trash2, Sparkles, UploadCloud, Loader2, X,
  Eye, FileText, Save, ExternalLink, Wand2, Search, ArrowUpDown, Lock,
} from 'lucide-react';
import { BLOG_POSTS } from '../../data/blogPosts';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const NL_MONTHS = {
  januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5,
  juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11,
};
const parseNlDate = (s) => {
  if (!s) return 0;
  const parts = String(s).trim().split(/\s+/);
  if (parts.length === 3 && NL_MONTHS[parts[1].toLowerCase()] !== undefined) {
    return new Date(+parts[2], NL_MONTHS[parts[1].toLowerCase()], +parts[0]).getTime();
  }
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
};
const fmtDate = (ts) => {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
};

const EMPTY = {
  title: '', slug: '', seo_title: '', meta_description: '', excerpt: '',
  category: 'Slaaptips', category_color: 'bg-amber-100 text-amber-900',
  tags: [], hero_image: '', content: '', faqs: [], related_products: [],
  status: 'draft', author: 'Team Droomvriendjes', read_minutes: 6,
};

const CATEGORIES = ['Slaaptips', 'Productgids', 'Babyslaap', 'Wetenschap', 'Veilig slapen', 'Mentale rust', 'Kraamcadeau'];

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

const inputCls = 'w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-fuchsia-400/50';

const AdminBlogCmsPage = () => {
  const [dbPosts, setDbPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // post object or null
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | published | draft | premium
  const [sortDir, setSortDir] = useState('desc'); // desc (newest) | asc

  const notify = (t, m) => { setToast({ t, m }); setTimeout(() => setToast(null), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/blog-cms/posts`, { headers: authHeaders() });
      const d = await r.json();
      setDbPosts(d.posts || []);
    } catch { notify('error', 'Laden mislukt'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!window.confirm('Deze blog definitief verwijderen?')) return;
    await fetch(`${API}/api/blog-cms/posts/${id}`, { method: 'DELETE', headers: authHeaders() });
    notify('success', 'Blog verwijderd');
    load();
  };

  // Unified list: DB-managed posts + premium (code-rendered) blogs not yet in the DB
  const rows = useMemo(() => {
    const dbSlugs = new Set(dbPosts.map((p) => p.slug));
    const dbRows = dbPosts.map((p) => ({
      key: `db-${p.id}`,
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      author: p.author || 'Team Droomvriendjes',
      category: p.category,
      dateTs: new Date(p.created_at).getTime() || 0,
      source: 'db',
      raw: p,
    }));
    const premiumRows = BLOG_POSTS.filter((b) => !dbSlugs.has(b.slug)).map((b) => ({
      key: `prem-${b.slug}`,
      id: b.slug,
      slug: b.slug,
      title: b.title,
      status: 'published',
      author: 'Team Droomvriendjes',
      category: b.category,
      dateTs: parseNlDate(b.date),
      source: 'premium',
    }));
    return [...dbRows, ...premiumRows];
  }, [dbPosts]);

  const filtered = useMemo(() => {
    let list = rows;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
    if (statusFilter === 'premium') list = list.filter((r) => r.source === 'premium');
    else if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    return [...list].sort((a, b) => (sortDir === 'desc' ? b.dateTs - a.dateTs : a.dateTs - b.dateTs));
  }, [rows, query, statusFilter, sortDir]);

  const counts = useMemo(() => ({
    total: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    draft: rows.filter((r) => r.status === 'draft').length,
    premium: rows.filter((r) => r.source === 'premium').length,
  }), [rows]);

  if (editing !== null) {
    return <BlogEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} notify={notify} toast={toast} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-2"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
            <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="w-7 h-7 text-fuchsia-400" /> Blog CMS</h1>
            <p className="text-slate-400 text-sm mt-1">Beheer alle blogs vanuit één overzicht. Gepubliceerde blogs verschijnen automatisch op /blogs.</p>
          </div>
          <button onClick={() => setEditing(EMPTY)} className="inline-flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold px-5 py-2.5 rounded-lg transition" data-testid="new-blog-btn">
            <Plus className="w-5 h-5" /> Nieuwe blog
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5" data-testid="cms-stats">
          <StatChip label="Totaal blogs" value={counts.total} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} testid="stat-total" />
          <StatChip label="Gepubliceerd" value={counts.published} active={statusFilter === 'published'} onClick={() => setStatusFilter('published')} testid="stat-published" />
          <StatChip label="Concept" value={counts.draft} active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')} testid="stat-draft" />
          <StatChip label="Premium (code)" value={counts.premium} active={statusFilter === 'premium'} onClick={() => setStatusFilter('premium')} testid="stat-premium" />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Zoek op titel of slug…" className={`${inputCls} pl-9`} data-testid="cms-search" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} w-auto`} data-testid="cms-status-filter">
            <option value="all">Alle statussen</option>
            <option value="published">Gepubliceerd</option>
            <option value="draft">Concept</option>
            <option value="premium">Premium (code)</option>
          </select>
          <button onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm" data-testid="cms-sort-date">
            <ArrowUpDown className="w-4 h-4" /> Datum {sortDir === 'desc' ? '(nieuwste)' : '(oudste)'}
          </button>
        </div>

        {loading ? (
          <div className="text-slate-400 flex items-center gap-2 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Laden...</div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto" data-testid="cms-table-wrap">
            <table className="w-full text-sm min-w-[860px]" data-testid="cms-table">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Titel</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Datum</th>
                  <th className="text-left px-4 py-3">Auteur</th>
                  <th className="text-left px-4 py-3">Slug</th>
                  <th className="text-right px-4 py-3">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.key} className="border-t border-white/5 hover:bg-white/5" data-testid={`cms-row-${r.slug}`}>
                    <td className="px-4 py-3 max-w-[320px]">
                      <p className="font-medium text-white line-clamp-1" title={r.title}>{r.title}</p>
                      <span className="text-[11px] text-slate-500">{r.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.source === 'premium' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300" title="Speciale code-layout met interactieve elementen"><Lock className="w-3 h-3" /> Premium</span>
                      ) : (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${r.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {r.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(r.dateTs)}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.author}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">/{r.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.source === 'db' ? (
                          <button onClick={() => setEditing(r.raw)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs" data-testid={`edit-${r.slug}`}><Pencil className="w-3.5 h-3.5" /> Bewerken</button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 border border-white/5 rounded-lg px-3 py-1.5 text-xs cursor-not-allowed" title="Premium-blog met code-layout (interactieve upsell). Niet bewerkbaar via CMS."><Lock className="w-3.5 h-3.5" /> Code</span>
                        )}
                        <a href={`/blog/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs" title="Bekijk live" data-testid={`view-${r.slug}`}><Eye className="w-3.5 h-3.5" /> Live</a>
                        {r.source === 'db' && (
                          <button onClick={() => del(r.id)} className="inline-flex items-center bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg px-2.5 py-1.5" title="Verwijderen" data-testid={`delete-${r.slug}`}><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500" data-testid="cms-empty">Geen blogs gevonden voor deze filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.t === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">{toast.m}</div>}
    </div>
  );
};

const StatChip = ({ label, value, active, onClick, testid }) => (
  <button onClick={onClick} className={`text-left rounded-xl p-3 border transition ${active ? 'bg-fuchsia-500/15 border-fuchsia-400/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`} data-testid={testid}>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </button>
);

const BlogEditor = ({ initial, onClose, onSaved, notify, toast }) => {
  const [f, setF] = useState({ ...EMPTY, ...initial, tags: initial.tags || [] });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/api/blog-cms/upload-image`, { method: 'POST', headers: authHeaders(), body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Upload mislukt');
      set('hero_image', d.url);
      notify('success', 'Afbeelding geüpload');
    } catch (e) { notify('error', e.message); }
    setUploading(false);
  };

  const runAi = async () => {
    if (!aiTopic.trim()) { notify('error', 'Vul een onderwerp in'); return; }
    setAiLoading(true);
    try {
      const r = await fetch(`${API}/api/blog-cms/ai-generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ topic: aiTopic, keywords: aiKeywords.split(',').map((s) => s.trim()).filter(Boolean), category: f.category }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'AI mislukt');
      setF((p) => ({
        ...p,
        title: d.title || p.title,
        seo_title: d.seo_title || p.seo_title,
        meta_description: d.meta_description || p.meta_description,
        excerpt: d.excerpt || p.excerpt,
        content: d.content || p.content,
        tags: d.tags || p.tags,
        faqs: d.faqs || p.faqs,
        related_products: d.related_products || p.related_products,
        read_minutes: d.read_minutes || p.read_minutes,
      }));
      setAiOpen(false);
      notify('success', 'AI-concept gegenereerd — controleer en pas aan');
    } catch (e) { notify('error', e.message); }
    setAiLoading(false);
  };

  const save = async (statusOverride) => {
    if (!f.title.trim()) { notify('error', 'Titel is verplicht'); return; }
    setSaving(true);
    const payload = { ...f, status: statusOverride || f.status };
    try {
      const isNew = !initial.id;
      const url = isNew ? `${API}/api/blog-cms/posts` : `${API}/api/blog-cms/posts/${initial.id}`;
      const r = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Opslaan mislukt');
      notify('success', `Blog opgeslagen (${payload.status === 'published' ? 'gepubliceerd' : 'concept'})`);
      onSaved();
    } catch (e) { notify('error', e.message); setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm"><ArrowLeft className="w-4 h-4" /> Terug naar overzicht</button>
          <div className="flex items-center gap-2">
            <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-2 bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-fuchsia-500/25" data-testid="ai-write-btn"><Wand2 className="w-4 h-4" /> AI-schrijfknop</button>
            <button onClick={() => save('draft')} disabled={saving} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 disabled:opacity-50" data-testid="save-draft-btn"><Save className="w-4 h-4" /> Concept</button>
            <button onClick={() => save('published')} disabled={saving} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" data-testid="publish-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} Publiceren
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">{initial.id ? 'Blog bewerken' : 'Nieuwe blog'}</h1>

        <div className="space-y-5">
          {/* Hero image */}
          <Field label="Uitgelichte afbeelding" hint="Wordt geoptimaliseerd en op Supabase gehost.">
            <div className="flex items-center gap-4">
              <div className="w-40 h-24 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                {f.hero_image ? <img src={f.hero_image} alt="" className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-slate-600" />}
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-sm" data-testid="upload-image-btn">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Afbeelding uploaden
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImage(e.target.files?.[0]); e.target.value = ''; }} data-testid="image-input" />
              </label>
              {f.hero_image && <button onClick={() => set('hero_image', '')} className="text-slate-400 hover:text-red-300"><X className="w-4 h-4" /></button>}
            </div>
          </Field>

          <Field label="Titel (H1) *"><input value={f.title} onChange={(e) => set('title', e.target.value)} className={inputCls} data-testid="title-input" /></Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Categorie">
              <select value={f.category} onChange={(e) => set('category', e.target.value)} className={inputCls} data-testid="category-select">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Leestijd (min)"><input type="number" value={f.read_minutes} onChange={(e) => set('read_minutes', parseInt(e.target.value) || 6)} className={inputCls} /></Field>
          </div>

          <Field label="SEO titel" hint="Title tag (max ~60 tekens)."><input value={f.seo_title} onChange={(e) => set('seo_title', e.target.value)} className={inputCls} data-testid="seo-title-input" /></Field>
          <Field label="Meta description" hint="Max ~155 tekens, met CTA."><textarea value={f.meta_description} onChange={(e) => set('meta_description', e.target.value)} rows={2} className={inputCls} data-testid="meta-input" /></Field>
          <Field label="Samenvatting / excerpt"><textarea value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} className={inputCls} /></Field>
          <Field label="Tags" hint="Gescheiden door komma's.">
            <input value={(f.tags || []).join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className={inputCls} data-testid="tags-input" />
          </Field>

          <Field label="Inhoud (HTML)" hint="Gebruik <h2>, <p>, <ul><li>, <strong>. De AI-knop vult dit automatisch.">
            <textarea value={f.content} onChange={(e) => set('content', e.target.value)} rows={16} className={`${inputCls} font-mono text-xs leading-relaxed`} data-testid="content-input" />
          </Field>

          {/* FAQs */}
          <Field label="FAQ's (voor rich results / AI-overviews)">
            <div className="space-y-3">
              {(f.faqs || []).map((fq, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2" data-testid={`faq-${i}`}>
                  <div className="flex items-center gap-2">
                    <input value={fq.q} onChange={(e) => { const n = [...f.faqs]; n[i] = { ...n[i], q: e.target.value }; set('faqs', n); }} placeholder="Vraag" className={inputCls} />
                    <button onClick={() => set('faqs', f.faqs.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                  </div>
                  <textarea value={fq.a} onChange={(e) => { const n = [...f.faqs]; n[i] = { ...n[i], a: e.target.value }; set('faqs', n); }} placeholder="Antwoord" rows={2} className={inputCls} />
                </div>
              ))}
              <button onClick={() => set('faqs', [...(f.faqs || []), { q: '', a: '' }])} className="inline-flex items-center gap-1.5 text-sm text-fuchsia-300 hover:text-fuchsia-200"><Plus className="w-4 h-4" /> FAQ toevoegen</button>
            </div>
          </Field>
        </div>
      </div>

      {/* AI modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6" data-testid="ai-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-fuchsia-300" /> AI-schrijfknop</h3>
              <button onClick={() => setAiOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4">GPT-5.2 schrijft een SEO/GEO-geoptimaliseerd artikel (titel, meta, H2-structuur, FAQ, interne links). Je controleert en past aan voor publicatie.</p>
            <div className="space-y-3">
              <Field label="Onderwerp *"><input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="bijv. Beste slaapknuffel voor een baby" className={inputCls} data-testid="ai-topic-input" /></Field>
              <Field label="Zoekwoorden (3-5, komma-gescheiden)"><input value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} placeholder="slaapknuffel, knuffelbeer, nachtlampje, kraamcadeau" className={inputCls} data-testid="ai-keywords-input" /></Field>
            </div>
            <button onClick={runAi} disabled={aiLoading} className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 py-3 rounded-lg font-semibold disabled:opacity-50" data-testid="ai-generate-btn">
              {aiLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> AI schrijft...</> : <><Wand2 className="w-5 h-5" /> Genereer artikel</>}
            </button>
          </div>
        </div>
      )}
      {toast && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.t === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">{toast.m}</div>}
    </div>
  );
};

export default AdminBlogCmsPage;
