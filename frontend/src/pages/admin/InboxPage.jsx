import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Inbox, Send, FileText, Trash2, AlertOctagon, Tag, Search, RefreshCw,
  Star, StarOff, Reply, X, Plus, ArrowLeft, Mail, MailOpen, Loader2, ChevronLeft,
  Settings, Pencil, Check, Paperclip, UploadCloud, Sparkles
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const authHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const FOLDER_DEFS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Verzonden', icon: Send },
  { id: 'drafts', label: 'Concepten', icon: FileText },
  { id: 'spam', label: 'Spam', icon: AlertOctagon },
  { id: 'trash', label: 'Prullenbak', icon: Trash2 },
];

// Snelle antwoord-templates worden uit de database geladen (/api/reply-templates).
// De gebrande handtekening wordt server-side toegevoegd bij verzenden.
const QuickTemplates = ({ firstName, templates, onPick, onManage }) => {
  const greeting = `Hallo${firstName ? ' ' + firstName : ''},\n\n`;
  return (
    <div className="mb-2" data-testid="quick-templates">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">Snelle antwoorden</span>
        {onManage && (
          <button
            type="button"
            onClick={onManage}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
            data-testid="manage-templates-btn"
          >
            <Settings className="w-3 h-3" /> Beheer
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(templates || []).length === 0 && (
          <span className="text-xs text-slate-500">Nog geen templates. Klik op "Beheer" om er een toe te voegen.</span>
        )}
        {(templates || []).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(greeting + t.text)}
            className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            data-testid={`template-${t.id}`}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};


const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15 MB total

// Reads a File to pure base64 (strips the data: prefix)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AttachmentPicker = ({ attachments, setAttachments, onError }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = React.useRef(null);

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    let total = attachments.reduce((s, a) => s + (a.size || 0), 0);
    const next = [];
    for (const f of files) {
      total += f.size;
      if (total > MAX_TOTAL_BYTES) {
        onError?.('Bijlagen samen te groot (max 15 MB).');
        break;
      }
      try {
        const content = await fileToBase64(f);
        next.push({ filename: f.name, content, content_type: f.type || 'application/octet-stream', size: f.size });
      } catch {
        onError?.(`Kon "${f.name}" niet lezen.`);
      }
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  }, [attachments, setAttachments, onError]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="mt-3" data-testid="attachment-picker">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs cursor-pointer transition ${
          dragOver ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-300'
        }`}
        data-testid="attachment-dropzone"
      >
        <UploadCloud className="w-4 h-4" />
        Sleep bestanden hierheen of <span className="text-emerald-300 underline">klik om te uploaden</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        data-testid="attachment-input"
      />
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200" data-testid={`attachment-chip-${i}`}>
              <Paperclip className="w-3 h-3 text-emerald-300" />
              <span className="max-w-[160px] truncate">{a.filename}</span>
              <span className="text-slate-500">{fmtSize(a.size)}</span>
              <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-300" data-testid={`attachment-remove-${i}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('nl-NL', sameYear ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', year: 'numeric' });
};

const InboxPage = () => {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [folder, setFolder] = useState('inbox');
  const [activeLabel, setActiveLabel] = useState(null);
  const [folders, setFolders] = useState({});
  const [labels, setLabels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyData, setReplyData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/reply-templates`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setTemplates(d.templates || []);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/inbox/folders`, { headers: authHeaders() });
      const d = await r.json();
      setFolders(d.folders || {});
      setLabels(d.labels || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folder });
      if (activeLabel) params.append('label', activeLabel);
      if (search) params.append('q', search);
      const r = await fetch(`${API}/api/inbox?${params}`, { headers: authHeaders() });
      const d = await r.json();
      setMessages(d.items || []);
      setTotal(d.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [folder, activeLabel, search]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => { fetchMessages(); setSelected(null); }, [fetchMessages]);

  // Poll for new mail every 30s on inbox
  useEffect(() => {
    if (folder !== 'inbox') return;
    const id = setInterval(() => { fetchFolders(); fetchMessages(); }, 30000);
    return () => clearInterval(id);
  }, [folder, fetchFolders, fetchMessages]);

  const openMessage = async (msg) => {
    setSelected({ ...msg, _loading: true });
    try {
      const r = await fetch(`${API}/api/inbox/${msg.id}`, { headers: authHeaders() });
      const full = await r.json();
      setSelected(full);
      if (!msg.read) {
        await fetch(`${API}/api/inbox/${msg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ read: true }),
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)));
        fetchFolders();
      }
    } catch (e) { console.error(e); }
  };

  const patchMessage = async (id, patch) => {
    const r = await fetch(`${API}/api/inbox/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...d } : m)));
    if (selected?.id === id) setSelected(d);
    fetchFolders();
  };

  const deleteMessage = async (id) => {
    const hard = folder === 'trash';
    await fetch(`${API}/api/inbox/${id}?hard=${hard}`, { method: 'DELETE', headers: authHeaders() });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
    fetchFolders();
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setSearch(searchInput);
  };

  const counts = folders;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="admin-inbox-page">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition"
            data-testid="back-to-dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Terug</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <Mail className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold">Inbox</h1>
          <span className="text-xs text-slate-400 ml-2">info@droomvriendjes.com</span>
          <div className="ml-auto flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Zoeken..."
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-400 w-64"
                data-testid="inbox-search-input"
              />
            </form>
            <button
              onClick={() => { fetchFolders(); fetchMessages(); }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              data-testid="inbox-refresh"
              title="Vernieuwen"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm transition"
              data-testid="inbox-compose-btn"
            >
              <Plus className="w-4 h-4" /> Nieuw bericht
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-0 h-[calc(100vh-72px)]">
        {/* Sidebar: folders + labels */}
        <aside className="col-span-2 border-r border-white/10 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {FOLDER_DEFS.map((f) => {
              const Icon = f.icon;
              const cnt = counts[f.id] || { total: 0, unread: 0 };
              const isActive = folder === f.id && !activeLabel;
              return (
                <button
                  key={f.id}
                  onClick={() => { setFolder(f.id); setActiveLabel(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-white/5'
                  }`}
                  data-testid={`folder-${f.id}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {f.label}
                  </span>
                  {f.id === 'inbox' && cnt.unread > 0 ? (
                    <span className="text-xs bg-emerald-500 text-slate-900 rounded-full px-2 py-0.5 font-semibold">
                      {cnt.unread}
                    </span>
                  ) : cnt.total > 0 ? (
                    <span className="text-xs text-slate-500">{cnt.total}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {labels.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-slate-500 px-3 mb-2">Labels</div>
              <div className="space-y-1">
                {labels.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setActiveLabel(l); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                      activeLabel === l ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-white/5'
                    }`}
                    data-testid={`label-${l}`}
                  >
                    <Tag className="w-3 h-3" /> {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Message list */}
        <section className="col-span-4 border-r border-white/10 overflow-y-auto">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
              <Inbox className="w-10 h-10 mb-2 opacity-50" />
              Geen berichten
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {messages.map((m) => (
                <li
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition ${
                    selected?.id === m.id ? 'bg-white/10' : ''
                  } ${!m.read ? 'border-l-2 border-emerald-400' : 'border-l-2 border-transparent'}`}
                  data-testid={`message-row-${m.id}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm truncate ${!m.read ? 'font-semibold text-white' : 'text-slate-300'}`}>
                      {folder === 'sent' ? `Aan: ${m.to?.[0]?.email || ''}` : (m.from_name || m.from_email)}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">{fmtDate(m.received_at)}</span>
                  </div>
                  <div className={`text-sm truncate mt-0.5 ${!m.read ? 'text-white' : 'text-slate-400'}`}>
                    {m.subject || '(geen onderwerp)'}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{m.snippet}</div>
                  {(m.labels || []).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {m.labels.map((l) => (
                        <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{l}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Message detail */}
        <section className="col-span-6 overflow-y-auto p-6">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Selecteer een bericht om te lezen
            </div>
          ) : selected._loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          ) : (
            <MessageDetail
              message={selected}
              onClose={() => setSelected(null)}
              onPatch={(patch) => patchMessage(selected.id, patch)}
              onDelete={() => deleteMessage(selected.id)}
              onReply={() => setReplyData(selected)}
              folder={folder}
            />
          )}
        </section>
      </div>

      {replyData && (
        <ReplyModal
          original={replyData}
          templates={templates}
          onManage={() => setShowTemplateManager(true)}
          onClose={() => setReplyData(null)}
          onSent={() => { setReplyData(null); fetchFolders(); }}
        />
      )}

      {showCompose && (
        <ComposeModal
          templates={templates}
          onManage={() => setShowTemplateManager(true)}
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); fetchFolders(); }}
        />
      )}

      {showTemplateManager && (
        <TemplateManagerModal
          templates={templates}
          onClose={() => setShowTemplateManager(false)}
          onChanged={fetchTemplates}
        />
      )}
    </div>
  );
};

const MessageDetail = ({ message, onPatch, onDelete, onReply, folder }) => {
  const [labelInput, setLabelInput] = useState('');
  const addLabel = async () => {
    if (!labelInput.trim()) return;
    await onPatch({ add_label: labelInput.trim() });
    setLabelInput('');
  };

  return (
    <div data-testid="message-detail">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold mb-2 break-words" data-testid="message-subject">
            {message.subject || '(geen onderwerp)'}
          </h2>
          <div className="text-sm text-slate-300">
            <span className="font-medium">{message.from_name || message.from_email}</span>
            <span className="text-slate-500"> &lt;{message.from_email}&gt;</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Aan: {(message.to || []).map((t) => t.email).join(', ')}
            {message.cc && message.cc.length > 0 && <> · Cc: {message.cc.map((c) => c.email).join(', ')}</>}
          </div>
          <div className="text-xs text-slate-500 mt-1">{new Date(message.received_at).toLocaleString('nl-NL')}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onPatch({ starred: !message.starred })} className="p-2 rounded-lg hover:bg-white/10" title="Ster">
            {message.starred ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <StarOff className="w-4 h-4" />}
          </button>
          <button onClick={() => onPatch({ read: !message.read })} className="p-2 rounded-lg hover:bg-white/10" title={message.read ? 'Markeer als ongelezen' : 'Markeer als gelezen'}>
            {message.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          </button>
          {folder !== 'trash' && (
            <button onClick={onReply} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400" data-testid="reply-btn">
              <Reply className="w-4 h-4" /> Antwoord
            </button>
          )}
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-red-300" title="Verwijderen" data-testid="delete-btn">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Labels & folder controls */}
      <div className="py-3 flex items-center gap-2 flex-wrap text-xs border-b border-white/10">
        <span className="text-slate-500">Labels:</span>
        {(message.labels || []).map((l) => (
          <span key={l} className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            {l}
            <button onClick={() => onPatch({ remove_label: l })} className="hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
          placeholder="+ label"
          className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-emerald-400 w-32"
          data-testid="add-label-input"
        />
        <span className="ml-auto text-slate-500">Map:</span>
        <select
          value={message.folder}
          onChange={(e) => onPatch({ folder: e.target.value })}
          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
          data-testid="folder-select"
        >
          {FOLDER_DEFS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      {/* Body */}
      <div className="pt-4">
        {message.body_html ? (
          <iframe
            title="email-body"
            srcDoc={`<style>body{font-family:system-ui,sans-serif;color:#e2e8f0;background:transparent;margin:0;padding:8px 0;line-height:1.6;}a{color:#34d399;}img{max-width:100%;height:auto;}</style>${message.body_html}`}
            sandbox=""
            className="w-full min-h-[400px] bg-transparent"
            style={{ border: 'none' }}
            data-testid="message-body-html"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans" data-testid="message-body-text">
            {message.body_text}
          </pre>
        )}
        {(message.attachments || []).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-slate-500 mb-2">Bijlagen ({message.attachments.length})</div>
            <div className="flex gap-2 flex-wrap">
              {message.attachments.map((a, i) => (
                <span key={i} className="px-3 py-2 rounded-lg bg-white/5 text-xs">
                  {a.filename} <span className="text-slate-500">({Math.round(a.size / 1024)} KB)</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReplyModal = ({ original, templates, onManage, onClose, onSent }) => {
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [err, setErr] = useState('');

  const aiDraft = async () => {
    setAiLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API}/api/inbox/${original.id}/ai-draft`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'AI-concept mislukt');
      setBody(d.draft); // human-in-the-loop: vul de editor, nooit automatisch verzenden
    } catch (e) {
      setErr(e.message || 'AI-concept mislukt');
    }
    setAiLoading(false);
  };

  const send = async () => {
    setSending(true);
    setErr('');
    try {
      const r = await fetch(`${API}/api/inbox/${original.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ body_html: body.replace(/\n/g, '<br/>'), attachments }),
      });
      if (!r.ok) {
        const raw = await r.text();
        let detail = '';
        try { detail = JSON.parse(raw).detail; } catch { detail = raw.replace(/<[^>]+>/g, ' ').trim().slice(0, 120); }
        if (r.status === 404 && !detail) detail = 'Endpoint niet gevonden (404). Probeer de pagina te verversen; werk je op productie, deploy dan opnieuw.';
        throw new Error(detail || `Verzenden mislukt (status ${r.status})`);
      }
      onSent();
    } catch (e) {
      setErr(e.message || 'Verzenden mislukt');
    }
    setSending(false);
  };

  return (
    <Modal title={`Antwoord aan ${original.from_name || original.from_email}`} onClose={onClose}>
      <div className="text-xs text-slate-400 mb-2">
        Onderwerp: <span className="text-slate-200">Re: {original.subject}</span>
      </div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">Smart Assist</span>
        <button
          type="button"
          onClick={aiDraft}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 text-xs font-medium hover:bg-fuchsia-500/25 disabled:opacity-50 transition-colors"
          data-testid="ai-draft-btn"
          title="Laat AI een concept-antwoord schrijven (je controleert het zelf voor verzenden)"
        >
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {aiLoading ? 'AI schrijft…' : 'AI-concept antwoord'}
        </button>
      </div>
      <QuickTemplates
        firstName={(original.from_name || '').trim().split(' ')[0]}
        templates={templates}
        onManage={onManage}
        onPick={(tpl) => setBody((prev) => (prev.trim() ? `${prev}\n\n${tpl}` : tpl))}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Typ je antwoord..."
        className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-400 text-white"
        data-testid="reply-textarea"
      />
      <AttachmentPicker attachments={attachments} setAttachments={setAttachments} onError={setErr} />
      {err && <div className="text-red-400 text-xs mt-2">{err}</div>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">Annuleer</button>
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm disabled:opacity-50"
          data-testid="send-reply-btn"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verstuur'}
        </button>
      </div>
    </Modal>
  );
};

const ComposeModal = ({ templates, onManage, onClose, onSent }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setSending(true);
    setErr('');
    try {
      const recipients = to.split(',').map((s) => s.trim()).filter(Boolean);
      const r = await fetch(`${API}/api/inbox/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          to: recipients,
          subject,
          body_html: body.replace(/\n/g, '<br/>'),
          attachments,
        }),
      });
      if (!r.ok) {
        const raw = await r.text();
        let detail = '';
        try { detail = JSON.parse(raw).detail; } catch { detail = raw.replace(/<[^>]+>/g, ' ').trim().slice(0, 120); }
        if (r.status === 404 && !detail) detail = 'Endpoint niet gevonden (404). Probeer de pagina te verversen; werk je op productie, deploy dan opnieuw.';
        throw new Error(detail || `Verzenden mislukt (status ${r.status})`);
      }
      onSent();
    } catch (e) {
      setErr(e.message || 'Verzenden mislukt');
    }
    setSending(false);
  };

  return (
    <Modal title="Nieuw bericht" onClose={onClose}>
      <input
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="Aan (komma-gescheiden)"
        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-400 mb-2 text-white"
        data-testid="compose-to"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Onderwerp"
        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-400 mb-2 text-white"
        data-testid="compose-subject"
      />
      <QuickTemplates
        firstName=""
        templates={templates}
        onManage={onManage}
        onPick={(tpl) => setBody((prev) => (prev.trim() ? `${prev}\n\n${tpl}` : tpl))}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Bericht..."
        className="w-full h-56 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-400 text-white"
        data-testid="compose-body"
      />
      <AttachmentPicker attachments={attachments} setAttachments={setAttachments} onError={setErr} />
      {err && <div className="text-red-400 text-xs mt-2">{err}</div>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">Annuleer</button>
        <button
          onClick={send}
          disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm disabled:opacity-50"
          data-testid="send-compose-btn"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verstuur'}
        </button>
      </div>
    </Modal>
  );
};

const TemplateManagerModal = ({ templates, onClose, onChanged }) => {
  const [editing, setEditing] = useState(null); // null | 'new' | template object
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const startNew = () => { setEditing('new'); setLabel(''); setText(''); setErr(''); };
  const startEdit = (t) => { setEditing(t); setLabel(t.label); setText(t.text); setErr(''); };
  const cancelEdit = () => { setEditing(null); setErr(''); };

  const save = async () => {
    if (!label.trim() || !text.trim()) { setErr('Vul een titel en tekst in.'); return; }
    setSaving(true); setErr('');
    try {
      const isNew = editing === 'new';
      const url = isNew ? `${API}/api/reply-templates` : `${API}/api/reply-templates/${editing.id}`;
      const r = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ label: label.trim(), text }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || `Status ${r.status}`);
      }
      setEditing(null);
      await onChanged();
    } catch (e) {
      setErr(e.message || 'Opslaan mislukt');
    }
    setSaving(false);
  };

  const remove = async (t) => {
    if (!window.confirm(`Template "${t.label}" verwijderen?`)) return;
    try {
      await fetch(`${API}/api/reply-templates/${t.id}`, { method: 'DELETE', headers: authHeaders() });
      await onChanged();
    } catch (e) { console.error(e); }
  };

  return (
    <Modal title="Antwoord-templates beheren" onClose={onClose}>
      <div data-testid="template-manager">
        {!editing && (
          <>
            <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
              {(templates || []).length === 0 && (
                <p className="text-sm text-slate-400">Nog geen templates.</p>
              )}
              {(templates || []).map((t) => (
                <div key={t.id} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-3" data-testid={`tpl-row-${t.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 whitespace-pre-wrap">{t.text}</p>
                  </div>
                  <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-300" title="Bewerken" data-testid={`tpl-edit-${t.id}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(t)} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400" title="Verwijderen" data-testid={`tpl-delete-${t.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={startNew} className="w-full px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/25 inline-flex items-center justify-center gap-2" data-testid="tpl-new-btn">
              <Plus className="w-4 h-4" /> Nieuwe template
            </button>
          </>
        )}

        {editing && (
          <div className="space-y-3" data-testid="tpl-form">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Titel (knoptekst)</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Bijv. Bestelling onderweg"
                maxLength={80}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-400 text-white"
                data-testid="tpl-label-input"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tekst (zonder begroeting en handtekening — die worden automatisch toegevoegd)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Typ de standaardtekst..."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-400 text-white"
                data-testid="tpl-text-input"
              />
            </div>
            {err && <div className="text-red-400 text-xs">{err}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">Annuleer</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-2" data-testid="tpl-save-btn">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Opslaan
              </button>
            </div>
          </div>
        )}

        {err && !editing && <div className="text-red-400 text-xs mt-2">{err}</div>}
      </div>
    </Modal>
  );
};


const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default InboxPage;
