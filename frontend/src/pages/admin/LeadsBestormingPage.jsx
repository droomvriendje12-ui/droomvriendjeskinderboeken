import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, RefreshCw, Search, Trash2, Sparkles, Send, Loader2,
  AlertTriangle, FileText, X, Check, MailX, Upload
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const PAGE = 50;

const TYPE_LABEL = { slaapcoach: 'Slaapcoach', influencer: 'Influencer', winkel: 'Winkel' };
const LANG_LABEL = { nl: 'Nederlands', de: 'Duits', fr: 'Frans' };
const STATUS_STYLE = {
  New: 'bg-slate-500/20 text-slate-300',
  Sent: 'bg-blue-500/20 text-blue-300',
  Opened: 'bg-amber-500/20 text-amber-300',
  Replied: 'bg-emerald-500/20 text-emerald-300',
  Bounced: 'bg-red-500/20 text-red-300',
};
const STATUS_OPTS = ['New', 'Sent', 'Opened', 'Replied', 'Bounced'];

const LeadsBestormingPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [sources, setSources] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null); // {count, action}
  const [sending, setSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // {total, done, generated, failed, currentName}
  const [aiLead, setAiLead] = useState(null); // lead being personalized
  const [aiDraft, setAiDraft] = useState(null); // {subject, body}
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const notify = (t, m) => { setToast({ t, m }); setTimeout(() => setToast(null), 6000); };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/api/outreach/import`, { method: 'POST', headers: authHeaders(), body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Import mislukt');
      notify('success', `${d.added} nieuwe leads geïmporteerd${d.skipped_duplicates ? `, ${d.skipped_duplicates} duplicaten overgeslagen` : ''} (totaal ${d.total}).`);
      refresh();
    } catch (err) { notify('error', err.message || 'Import mislukt'); }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: String(PAGE), skip: String(page * PAGE) });
      if (type) p.append('type', type);
      if (status) p.append('status', status);
      if (source) p.append('source', source);
      if (search.trim()) p.append('search', search.trim());
      const r = await fetch(`${API}/api/outreach/leads?${p}`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setLeads(d.items || []); setTotal(d.total || 0); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, type, status, source, search]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/outreach/stats`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setStats(d); setSources(d.sources || []); }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const refresh = () => { fetchLeads(); fetchStats(); setSelected(new Set()); };

  const toggle = (id) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleAll = () => {
    if (leads.every((l) => selected.has(l.id))) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.id)));
  };

  const delLead = async (id) => {
    if (!window.confirm('Deze lead verwijderen?')) return;
    await fetch(`${API}/api/outreach/leads/${id}`, { method: 'DELETE', headers: authHeaders() });
    refresh();
  };
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`${selected.size} geselecteerde leads verwijderen?`)) return;
    await fetch(`${API}/api/outreach/leads/bulk-delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ids: [...selected] }),
    });
    notify('success', `${selected.size} leads verwijderd.`); refresh();
  };

  const updateLead = async (id, patch) => {
    const r = await fetch(`${API}/api/outreach/leads/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (r.ok) { const d = await r.json(); setLeads((ls) => ls.map((l) => (l.id === id ? d : l))); fetchStats(); }
  };

  const openAi = async (lead) => {
    setAiLead(lead); setAiDraft(lead.custom_email || null); setAiLoading(!lead.custom_email);
    if (!lead.custom_email) {
      try {
        const r = await fetch(`${API}/api/outreach/leads/${lead.id}/ai-draft`, { method: 'POST', headers: authHeaders() });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'AI mislukt');
        setAiDraft({ subject: d.subject, body: d.body });
      } catch (e) { notify('error', e.message); setAiLead(null); }
    }
    setAiLoading(false);
  };
  const saveAi = async () => {
    if (!aiLead || !aiDraft) return;
    await updateLead(aiLead.id, { custom_subject: aiDraft.subject, custom_body: aiDraft.body });
    notify('success', 'Persoonlijke mail opgeslagen.'); setAiLead(null); setAiDraft(null);
  };
  const regenAi = async () => {
    if (!aiLead) return;
    setAiLoading(true);
    try {
      const r = await fetch(`${API}/api/outreach/leads/${aiLead.id}/ai-draft`, { method: 'POST', headers: authHeaders() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'AI mislukt');
      setAiDraft({ subject: d.subject, body: d.body });
    } catch (e) { notify('error', e.message); }
    setAiLoading(false);
  };

  const bulkPersonalize = async () => {
    const ids = [...selected];
    if (ids.length === 0 || bulkProgress) return;
    const leadMap = new Map(leads.map((l) => [l.id, l]));
    // sla leads over die al een AI-mail hebben (alleen voor leads die we kennen op deze pagina)
    const todo = ids.filter((id) => {
      const l = leadMap.get(id);
      return !(l && l.custom_email && l.custom_email.body);
    });
    const skippedExisting = ids.length - todo.length;
    if (todo.length === 0) {
      notify('success', `Alle ${ids.length} geselecteerde leads hebben al een AI-mail.`);
      return;
    }
    if (!window.confirm(`AI-mails genereren voor ${todo.length} lead(s)${skippedExisting ? ` (${skippedExisting} hebben al een mail en worden overgeslagen)` : ''}? Dit kan even duren — laat dit venster open.`)) return;

    let generated = 0, failed = 0;
    setBulkProgress({ total: todo.length, done: 0, generated: 0, failed: 0, currentName: leadMap.get(todo[0])?.naam || '' });
    for (let i = 0; i < todo.length; i++) {
      const id = todo[i];
      const l = leadMap.get(id);
      setBulkProgress({ total: todo.length, done: i, generated, failed, currentName: l?.naam || '…' });
      try {
        const r = await fetch(`${API}/api/outreach/leads/${id}/ai-draft`, { method: 'POST', headers: authHeaders() });
        if (!r.ok) throw new Error();
        generated += 1;
      } catch { failed += 1; }
      setBulkProgress({ total: todo.length, done: i + 1, generated, failed, currentName: l?.naam || '…' });
    }
    setBulkProgress(null);
    notify(failed ? 'error' : 'success', `${generated} AI-mail(s) geschreven${skippedExisting ? `, ${skippedExisting} overgeslagen` : ''}${failed ? `, ${failed} mislukt` : ''}.`);
    refresh();
  };

  const doSend = async (body, label) => {
    setSending(true); setConfirm(null);
    try {
      const r = await fetch(`${API}/api/outreach/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Verzenden mislukt');
      notify('success', `${d.sent} verzonden, ${d.failed} mislukt. ${d.message || ''}`);
      refresh();
    } catch (e) { notify('error', e.message); }
    setSending(false);
  };

  const maxPage = Math.max(0, Math.ceil(total / PAGE) - 1);
  const allSel = leads.length > 0 && leads.every((l) => selected.has(l.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="leads-bestorming-page">
      <div className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-300 hover:text-white" data-testid="back-to-dashboard">
            <ChevronLeft className="w-5 h-5" /><span className="text-sm">Terug</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <Users className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold">Leads Bestorming</h1>
          <div className="ml-auto flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleImport} className="hidden" data-testid="import-file-input" />
            <button onClick={() => fileRef.current?.click()} disabled={importing} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-sm inline-flex items-center gap-2 disabled:opacity-50" data-testid="import-csv-btn">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Importeer CSV
            </button>
            <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm inline-flex items-center gap-2" data-testid="edit-templates-btn"><FileText className="w-4 h-4" /> Sjablonen</button>
            <button onClick={refresh} className="p-2 rounded-lg hover:bg-white/10" data-testid="refresh-btn"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="stats-cards">
            <StatCard label="Totaal leads" value={stats.total} />
            <StatCard label="Slaapcoach" value={stats.by_type?.slaapcoach || 0} />
            <StatCard label="Influencer" value={stats.by_type?.influencer || 0} />
            <StatCard label="Winkel" value={stats.by_type?.winkel || 0} />
            <StatCard label="Verzonden" value={(stats.by_status?.Sent || 0) + (stats.by_status?.Opened || 0) + (stats.by_status?.Replied || 0)} accent="blue" />
            <StatCard label="Zonder e-mail" value={stats.no_email || 0} accent="amber" />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm" data-testid="type-filter">
            <option value="">Alle types</option>
            <option value="slaapcoach">Slaapcoach</option>
            <option value="influencer">Influencer</option>
            <option value="winkel">Winkel</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm" data-testid="status-filter">
            <option value="">Alle statussen</option>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(0); }} className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm max-w-[220px]" data-testid="source-filter">
            <option value="">Alle bestanden</option>
            {sources.map((s) => <option key={s.source} value={s.source}>{s.source} ({s.count})</option>)}
          </select>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(0), fetchLeads())} placeholder="Zoek naam / e-mail / details... (Enter)" className="w-full bg-slate-800 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm" data-testid="search-input" />
          </div>
          <div className="flex gap-2">
            <button disabled={selected.size === 0} onClick={bulkDelete} className="px-3 py-2.5 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 text-sm disabled:opacity-40 inline-flex items-center gap-2" data-testid="bulk-delete-btn"><Trash2 className="w-4 h-4" /> Verwijder ({selected.size})</button>
            <button disabled={selected.size === 0 || !!bulkProgress} onClick={bulkPersonalize} className="px-3 py-2.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 text-sm disabled:opacity-40 inline-flex items-center gap-2" data-testid="bulk-ai-btn">
              {bulkProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI-personaliseer ({selected.size})
            </button>
            <button disabled={selected.size === 0} onClick={() => setConfirm({ count: selected.size, body: { ids: [...selected], only_new: false }, label: `${selected.size} geselecteerde` })} className="px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm disabled:opacity-40 inline-flex items-center gap-2" data-testid="send-selected-btn"><Send className="w-4 h-4" /> Verstuur selectie</button>
            <button onClick={() => setConfirm({ count: (source ? (sources.find((s) => s.source === source)?.new || 0) : (stats?.by_status?.New || 0)), body: { only_new: true, ...(type ? { type } : {}), ...(source ? { source } : {}) }, label: source ? `alle nieuwe in "${source}"` : 'alle nieuwe leads' })} disabled={sending} className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm disabled:opacity-50 inline-flex items-center gap-2" data-testid="send-all-new-btn">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Verstuur alle nieuwe
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]" data-testid="leads-table">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-3 py-3"><input type="checkbox" checked={allSel} onChange={toggleAll} data-testid="select-all" /></th>
                <th className="text-left px-2 py-3">#</th>
                <th className="text-left px-3 py-3">Naam</th>
                <th className="text-left px-3 py-3">Type</th>
                <th className="text-left px-3 py-3">Taal</th>
                <th className="text-left px-3 py-3">E-mail</th>
                <th className="text-left px-3 py-3 max-w-[260px]">Details</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Datum</th>
                <th className="text-left px-3 py-3">Notities</th>
                <th className="text-left px-3 py-3">Acties</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center py-10 text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>}
              {!loading && leads.length === 0 && <tr><td colSpan={11} className="text-center py-10 text-slate-500">Geen leads gevonden.</td></tr>}
              {!loading && leads.map((l) => (
                <tr key={l.id} className="border-t border-white/5 hover:bg-white/5 align-top" data-testid="lead-row">
                  <td className="px-3 py-2.5"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} data-testid={`select-${l.id}`} /></td>
                  <td className="px-2 py-2.5 text-slate-500">{l.seq}</td>
                  <td className="px-3 py-2.5 font-medium text-white max-w-[160px] truncate" title={l.naam}>{l.naam}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-200">{TYPE_LABEL[l.type] || l.type}</span></td>
                  <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-white/10 text-slate-200 uppercase" title={LANG_LABEL[l.language] || 'Nederlands'}>{l.language || 'nl'}</span></td>
                  <td className="px-3 py-2.5">{l.email_valid ? <span className="text-slate-300">{l.email}</span> : <span className="inline-flex items-center gap-1 text-amber-400/80 text-xs"><MailX className="w-3.5 h-3.5" /> geen e-mail</span>}</td>
                  <td className="px-3 py-2.5 text-slate-400 max-w-[260px]"><span className="line-clamp-2" title={l.details}>{l.details}</span></td>
                  <td className="px-3 py-2.5">
                    <select value={l.status} onChange={(e) => updateLead(l.id, { status: e.target.value })} className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_STYLE[l.status] || ''}`} data-testid={`status-${l.id}`}>
                      {STATUS_OPTS.map((s) => <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">{l.date_contacted ? new Date(l.date_contacted).toLocaleDateString('nl-NL') : '—'}</td>
                  <td className="px-3 py-2.5">
                    <input defaultValue={l.notes} onBlur={(e) => e.target.value !== l.notes && updateLead(l.id, { notes: e.target.value })} placeholder="..." className="w-28 bg-transparent border-b border-white/10 focus:border-emerald-400 text-xs py-1 focus:outline-none" data-testid={`notes-${l.id}`} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openAi(l)} className={`p-1.5 rounded-lg hover:bg-white/10 ${l.custom_email ? 'text-fuchsia-300' : 'text-slate-300'}`} title={l.custom_email ? 'AI-mail bewerken' : 'AI-personaliseer'} data-testid={`ai-${l.id}`}><Sparkles className="w-4 h-4" /></button>
                      <button onClick={() => delLead(l.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400" title="Verwijder" data-testid={`delete-${l.id}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span data-testid="pagination-info">{total} leads · pagina {page + 1}/{maxPage + 1}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40">Vorige</button>
            <button disabled={page >= maxPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40">Volgende</button>
          </div>
        </div>
      </div>

      {/* Send confirmation */}
      {confirm && (
        <Overlay onClose={() => setConfirm(null)} testid="send-confirm">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-400" /></div><h3 className="font-semibold text-lg">Versturen bevestigen</h3></div>
          <p className="text-sm text-slate-300 mb-2">Je staat op het punt outreach-mails te versturen naar <span className="font-bold text-emerald-300">{confirm.label}</span> (alleen leads mét geldig e-mailadres).</p>
          <p className="text-xs text-slate-400 mb-5">Per lead wordt automatisch het juiste sjabloon gekozen op basis van type én taal (.de=Duits, .fr=Frans, anders NL); leads met een AI-mail krijgen hun persoonlijke versie. Reacties komen binnen op info@droomvriendjes.com.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm" data-testid="confirm-cancel">Annuleer</button>
            <button onClick={() => doSend(confirm.body, confirm.label)} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm inline-flex items-center gap-2" data-testid="confirm-send"><Send className="w-4 h-4" /> Ja, verstuur</button>
          </div>
        </Overlay>
      )}

      {/* AI draft modal */}
      {aiLead && (
        <Overlay onClose={() => setAiLead(null)} wide testid="ai-modal">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-fuchsia-300" /><h3 className="font-semibold text-lg">Persoonlijke mail — {aiLead.naam}</h3></div>
          {aiLoading ? (
            <div className="py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin inline mb-2" /><p className="text-sm">AI schrijft een persoonlijke mail...</p></div>
          ) : aiDraft ? (
            <>
              <label className="text-xs text-slate-400 block mb-1">Onderwerp</label>
              <input value={aiDraft.subject} onChange={(e) => setAiDraft({ ...aiDraft, subject: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm mb-3" data-testid="ai-subject" />
              <label className="text-xs text-slate-400 block mb-1">Bericht</label>
              <textarea value={aiDraft.body} onChange={(e) => setAiDraft({ ...aiDraft, body: e.target.value })} className="w-full h-56 bg-slate-800 border border-white/10 rounded-lg p-3 text-sm" data-testid="ai-body" />
              <div className="flex justify-between mt-3">
                <button onClick={regenAi} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Opnieuw</button>
                <div className="flex gap-2">
                  <button onClick={() => setAiLead(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">Sluiten</button>
                  <button onClick={saveAi} className="px-4 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-semibold text-sm inline-flex items-center gap-2" data-testid="ai-save"><Check className="w-4 h-4" /> Opslaan</button>
                </div>
              </div>
            </>
          ) : null}
        </Overlay>
      )}

      {showTemplates && <TemplateEditor onClose={() => setShowTemplates(false)} notify={notify} />}

      {/* Bulk AI progress */}
      {bulkProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="bulk-ai-progress">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-fuchsia-300 animate-pulse" />
              <h3 className="font-semibold text-lg">AI schrijft persoonlijke mails…</h3>
            </div>
            <p className="text-sm text-slate-300 mb-1" data-testid="bulk-ai-progress-count">
              <span className="font-bold text-fuchsia-300">{bulkProgress.done}</span> / {bulkProgress.total} mails geschreven
            </p>
            <p className="text-xs text-slate-400 mb-3 truncate">Nu bezig: <span className="text-slate-200">{bulkProgress.currentName || '…'}</span></p>
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-400 transition-all duration-300" style={{ width: `${bulkProgress.total ? Math.round((bulkProgress.done / bulkProgress.total) * 100) : 0}%` }} data-testid="bulk-ai-progress-bar" />
            </div>
            <div className="flex justify-between mt-3 text-xs text-slate-400">
              <span className="text-emerald-300">{bulkProgress.generated} gelukt</span>
              {bulkProgress.failed > 0 && <span className="text-red-300">{bulkProgress.failed} mislukt</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-4">Laat dit venster open tot alle mails klaar zijn.</p>
          </div>
        </div>
      )}

      {toast && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.t === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">{toast.m}</div>}
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className={`rounded-xl p-3 border ${accent === 'amber' ? 'bg-amber-500/5 border-amber-400/30' : accent === 'blue' ? 'bg-blue-500/5 border-blue-400/30' : 'bg-white/5 border-white/10'}`}>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const Overlay = ({ children, onClose, wide, testid }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid={testid}>
    <div className={`bg-slate-900 border border-white/10 rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 relative max-h-[90vh] overflow-y-auto`}>
      <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
      {children}
    </div>
  </div>
);

const TemplateEditor = ({ onClose, notify }) => {
  const [tpls, setTpls] = useState([]);
  const [active, setActive] = useState('slaapcoach');
  const [lang, setLang] = useState('nl');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/api/outreach/templates`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setTpls(d.templates || []); }
    })();
  }, []);

  const cur = tpls.find((t) => t.type === active && (t.language || 'nl') === lang);
  const setField = (k, v) => setTpls((ts) => ts.map((t) => (t.type === active && (t.language || 'nl') === lang ? { ...t, [k]: v } : t)));
  const save = async () => {
    if (!cur) return;
    setSaving(true);
    await fetch(`${API}/api/outreach/templates/${active}/${lang}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ subject: cur.subject, body: cur.body }),
    });
    setSaving(false); notify('success', `Sjabloon "${TYPE_LABEL[active]} (${LANG_LABEL[lang]})" opgeslagen.`);
  };

  return (
    <Overlay onClose={onClose} wide testid="template-editor">
      <h3 className="font-semibold text-lg mb-1">E-mailsjablonen per type & taal</h3>
      <p className="text-xs text-slate-400 mb-3">De taal wordt automatisch gekozen op basis van de e-mail (.de = Duits, .fr = Frans, anders Nederlands).</p>
      <div className="flex gap-2 mb-3">
        {['slaapcoach', 'influencer', 'winkel'].map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`px-3 py-1.5 rounded-full text-sm ${active === t ? 'bg-emerald-500 text-slate-900 font-semibold' : 'bg-white/10 text-slate-300'}`} data-testid={`tpl-tab-${t}`}>{TYPE_LABEL[t]}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {['nl', 'de', 'fr'].map((l) => (
          <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded-lg text-xs uppercase font-semibold ${lang === l ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300'}`} data-testid={`tpl-lang-${l}`}>{l}</button>
        ))}
      </div>
      {cur ? (
        <>
          <label className="text-xs text-slate-400 block mb-1">Onderwerp</label>
          <input value={cur.subject} onChange={(e) => setField('subject', e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm mb-3" data-testid="tpl-subject" />
          <label className="text-xs text-slate-400 block mb-1">Bericht (gebruik {'{{Naam}}'} voor de voornaam — handtekening wordt automatisch toegevoegd)</label>
          <textarea value={cur.body} onChange={(e) => setField('body', e.target.value)} className="w-full h-64 bg-slate-800 border border-white/10 rounded-lg p-3 text-sm" data-testid="tpl-body" />
          <div className="flex justify-end mt-3">
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm inline-flex items-center gap-2" data-testid="tpl-save"><Check className="w-4 h-4" /> Opslaan</button>
          </div>
        </>
      ) : <div className="py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>}
    </Overlay>
  );
};

export default LeadsBestormingPage;
