import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Inbox, Send, FileText, Trash2, AlertOctagon, Tag, Search, RefreshCw,
  Star, StarOff, Reply, X, Plus, ArrowLeft, Mail, MailOpen, Loader2, ChevronLeft
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const FOLDER_DEFS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Verzonden', icon: Send },
  { id: 'drafts', label: 'Concepten', icon: FileText },
  { id: 'spam', label: 'Spam', icon: AlertOctagon },
  { id: 'trash', label: 'Prullenbak', icon: Trash2 },
];

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

  const fetchFolders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/inbox/folders`);
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
      const r = await fetch(`${API}/api/inbox?${params}`);
      const d = await r.json();
      setMessages(d.items || []);
      setTotal(d.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [folder, activeLabel, search]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);
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
      const r = await fetch(`${API}/api/inbox/${msg.id}`);
      const full = await r.json();
      setSelected(full);
      if (!msg.read) {
        await fetch(`${API}/api/inbox/${msg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...d } : m)));
    if (selected?.id === id) setSelected(d);
    fetchFolders();
  };

  const deleteMessage = async (id) => {
    const hard = folder === 'trash';
    await fetch(`${API}/api/inbox/${id}?hard=${hard}`, { method: 'DELETE' });
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
          onClose={() => setReplyData(null)}
          onSent={() => { setReplyData(null); fetchFolders(); }}
        />
      )}

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); fetchFolders(); }}
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

const ReplyModal = ({ original, onClose, onSent }) => {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setSending(true);
    setErr('');
    try {
      const r = await fetch(`${API}/api/inbox/${original.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_html: body.replace(/\n/g, '<br/>') }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || `Status ${r.status}`);
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
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Typ je antwoord..."
        className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-400 text-white"
        data-testid="reply-textarea"
      />
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

const ComposeModal = ({ onClose, onSent }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setSending(true);
    setErr('');
    try {
      const recipients = to.split(',').map((s) => s.trim()).filter(Boolean);
      const r = await fetch(`${API}/api/inbox/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          body_html: body.replace(/\n/g, '<br/>'),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || `Status ${r.status}`);
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
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Bericht..."
        className="w-full h-56 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-400 text-white"
        data-testid="compose-body"
      />
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
