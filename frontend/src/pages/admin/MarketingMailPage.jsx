import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Mail, Upload, Send, Loader2, Users, Eye, CheckCircle2,
  AlertTriangle, TestTube2, RefreshCw
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MarketingMailPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [sources, setSources] = useState({});
  const [selectedSource, setSelectedSource] = useState('all');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);
  const [toast, setToast] = useState(null);

  // Upload form
  const [uploadName, setUploadName] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 5000); };

  // Robust response parser: never throws on non-JSON (e.g. proxy/HTML error pages)
  const safeJson = async (r) => {
    const text = await r.text();
    try { return JSON.parse(text); }
    catch {
      const snippet = (text || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 140);
      return { __nonjson: true, detail: snippet || `Onverwacht antwoord (status ${r.status})` };
    }
  };

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/email-templates`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setTemplates(Array.isArray(d) ? d : []);
        if (!selectedId && Array.isArray(d) && d.length) setSelectedId(d[0].id);
      }
    } catch (e) { console.error(e); }
  }, [selectedId]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/email/csv/queue/stats`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setSources(d.sources || {}); }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchTemplates(); fetchStats(); }, [fetchTemplates, fetchStats]);

  // Load preview when selection changes
  useEffect(() => {
    if (!selectedId) { setPreviewHtml(''); return; }
    (async () => {
      try {
        const r = await fetch(`${API}/api/email-templates/${selectedId}`, { headers: authHeaders() });
        if (r.ok) { const d = await r.json(); setPreviewHtml(d.content || ''); }
      } catch (e) { console.error(e); }
    })();
  }, [selectedId]);

  const recipientCount = () => {
    if (selectedSource === 'all') {
      return Object.values(sources).reduce((sum, s) => sum + (s.pending || 0), 0);
    }
    return (sources[selectedSource]?.pending) || 0;
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim() || !uploadSubject.trim()) {
      notify('error', 'Vul naam, onderwerp en een HTML-bestand in.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('name', uploadName.trim());
      fd.append('subject', uploadSubject.trim());
      const r = await fetch(`${API}/api/email-templates/upload-html`, {
        method: 'POST', headers: { ...authHeaders() }, body: fd,
      });
      const d = await safeJson(r);
      if (!r.ok || d.__nonjson) throw new Error(d.detail || 'Upload mislukt');
      notify('success', `Template opgeslagen — ${d.images_hosted} afbeeldingen gehost (${d.original_size_kb}KB → ${d.processed_size_kb}KB).`);
      setUploadName(''); setUploadSubject(''); setUploadFile(null);
      await fetchTemplates();
      setSelectedId(d.template.id);
    } catch (e) {
      notify('error', e.message || 'Upload mislukt');
    }
    setUploading(false);
  };

  const handleTest = async () => {
    if (!selectedId) { notify('error', 'Kies eerst een template.'); return; }
    if (!testEmail.includes('@')) { notify('error', 'Vul een geldig e-mailadres in.'); return; }
    setTesting(true);
    try {
      const r = await fetch(`${API}/api/email/csv/send-test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ template_id: selectedId, to_email: testEmail, naam: 'Sanne' }),
      });
      const d = await safeJson(r);
      if (!r.ok || d.__nonjson) throw new Error(d.detail || 'Testmail mislukt');
      notify('success', `Testmail verstuurd naar ${testEmail}.`);
    } catch (e) {
      notify('error', e.message || 'Testmail mislukt');
    }
    setTesting(false);
  };

  const pollProgress = (campaignId) => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/email/csv/campaign-progress/${campaignId}`, { headers: authHeaders() });
        if (r.ok) {
          const d = await r.json();
          setProgress(d);
          if (d.status === 'completed') { clearInterval(iv); setSending(false); fetchStats(); }
        }
      } catch (e) { console.error(e); }
    }, 1500);
  };

  const handleSendAll = async () => {
    setConfirmOpen(false);
    setSending(true);
    setProgress({ status: 'running', percent: 0, sent: 0, failed: 0, total: recipientCount() });
    try {
      const body = { template_id: selectedId };
      if (selectedSource !== 'all') body.source = selectedSource;
      const r = await fetch(`${API}/api/email/csv/send-campaign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      const d = await safeJson(r);
      if (!r.ok || d.__nonjson) throw new Error(d.detail || 'Verzenden mislukt');
      if (d.total === 0) { notify('error', 'Geen ontvangers in de wachtrij voor deze doelgroep.'); setSending(false); return; }
      notify('success', `Campagne gestart voor ${d.total} ontvangers.`);
      pollProgress(d.campaign_id);
    } catch (e) {
      notify('error', e.message || 'Verzenden mislukt');
      setSending(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedId);
  const count = recipientCount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="marketing-mail-page">
      <div className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-300 hover:text-white transition" data-testid="back-to-dashboard">
            <ChevronLeft className="w-5 h-5" /><span className="text-sm">Terug</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <Mail className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold">Marketing-mail versturen</h1>
          <button onClick={() => { fetchTemplates(); fetchStats(); }} className="ml-auto p-2 rounded-lg hover:bg-white/10" title="Vernieuwen" data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: configuration */}
        <div className="space-y-6">
          {/* Template selectie */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">1</span> Kies je e-mailtemplate</h2>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-400"
              data-testid="template-select"
            >
              <option value="">Selecteer een template...</option>
              {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            {selectedTemplate && (
              <p className="text-xs text-slate-400 mt-2">Onderwerp: <span className="text-slate-200">{selectedTemplate.subject}</span></p>
            )}
          </div>

          {/* Upload HTML */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-emerald-300" /> Nieuw HTML-bestand uploaden</h2>
            <p className="text-xs text-slate-400 mb-3">Afbeeldingen in het bestand worden automatisch gehost zodat de mail klein en e-mail-veilig blijft.</p>
            <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Naam (bijv. Lente-actie 2026)" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm mb-2 focus:outline-none focus:border-emerald-400" data-testid="upload-name" />
            <input value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} placeholder="Onderwerp van de e-mail" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm mb-2 focus:outline-none focus:border-emerald-400" data-testid="upload-subject" />
            <input type="file" accept=".html,text/html" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="w-full text-sm mb-3 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-emerald-200 text-slate-400" data-testid="upload-file" />
            <button onClick={handleUpload} disabled={uploading} className="w-full px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/25 disabled:opacity-50 inline-flex items-center justify-center gap-2" data-testid="upload-submit">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Uploaden als template
            </button>
          </div>

          {/* Doelgroep */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">2</span> Kies je doelgroep</h2>
            <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-400" data-testid="source-select">
              <option value="all">Alle contacten (alle bronnen)</option>
              {Object.entries(sources).map(([src, s]) => (
                <option key={src} value={src}>{src} — {s.pending || 0} nog niet gemaild</option>
              ))}
            </select>
            <div className="mt-3 flex items-center gap-2 text-sm bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2" data-testid="recipient-count">
              <Users className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-200 font-semibold">{count}</span>
              <span className="text-slate-300">ontvanger{count === 1 ? '' : 's'} ontvangen deze mail</span>
            </div>
          </div>

          {/* Testmail */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">3</span> Stuur eerst een testmail</h2>
            <div className="flex gap-2">
              <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="jouw@email.nl" className="flex-1 bg-slate-800 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-400" data-testid="test-email" />
              <button onClick={handleTest} disabled={testing} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap" data-testid="send-test-btn">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />} Testmail
              </button>
            </div>
          </div>

          {/* Verstuur */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">4</span> Verstuur naar alle ontvangers</h2>
            {sending && progress ? (
              <div data-testid="send-progress">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{progress.status === 'completed' ? 'Klaar' : 'Bezig met verzenden...'}</span>
                  <span>{progress.sent || 0} verzonden · {progress.failed || 0} mislukt / {progress.total || 0}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress.percent || 0}%` }} />
                </div>
                {progress.status === 'completed' && (
                  <p className="text-emerald-300 text-sm mt-2 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Campagne voltooid</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!selectedId || count === 0}
                className="w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm disabled:opacity-40 inline-flex items-center justify-center gap-2"
                data-testid="send-all-btn"
              >
                <Send className="w-4 h-4" /> Verstuur naar {count} ontvanger{count === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: preview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-300" /> Voorbeeld</h2>
          {previewHtml ? (
            <iframe
              title="email-preview"
              srcDoc={previewHtml}
              className="w-full h-[700px] bg-white rounded-lg border border-white/10"
              data-testid="email-preview-iframe"
            />
          ) : (
            <div className="h-[700px] flex items-center justify-center text-slate-500 text-sm">Kies een template om het voorbeeld te zien</div>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="confirm-modal">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h3 className="font-semibold text-lg">Weet je het zeker?</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Je staat op het punt om <span className="font-bold text-white">"{selectedTemplate?.name}"</span> te versturen naar
              <span className="font-bold text-emerald-300"> {count} ontvanger{count === 1 ? '' : 's'}</span>
              {selectedSource === 'all' ? ' (alle bronnen)' : ` (bron: ${selectedSource})`}.
            </p>
            <p className="text-xs text-slate-400 mb-5">Dit kan niet ongedaan worden gemaakt. Heb je al een testmail naar jezelf gestuurd?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm" data-testid="confirm-cancel">Annuleer</button>
              <button onClick={handleSendAll} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm inline-flex items-center gap-2" data-testid="confirm-send">
                <Send className="w-4 h-4" /> Ja, verstuur nu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.type === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`} data-testid="toast">
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default MarketingMailPage;
