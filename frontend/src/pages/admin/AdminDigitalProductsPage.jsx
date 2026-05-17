import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, ChevronLeft, Loader2, RefreshCw, Trash2, Download,
  Package, ShieldCheck, Clock, CheckCircle2, AlertCircle, Copy
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const fmtBytes = (b) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
};

const AdminDigitalProductsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({});
  const [entitlements, setEntitlements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/digital-products/admin/list`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setFiles(d.files || []);
        setStats(d.stats || {});
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const fetchEntitlements = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/digital-products/admin/entitlements`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setEntitlements(d.entitlements || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/products`);
      if (r.ok) {
        const d = await r.json();
        setProducts(d || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchEntitlements();
    fetchProducts();
  }, [fetchFiles, fetchEntitlements, fetchProducts]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      notify('Selecteer eerst een PDF bestand', 'error');
      return;
    }
    if (file.type !== 'application/pdf') {
      notify('Alleen PDF bestanden zijn toegestaan', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (productId) fd.append('product_id', productId);
      const r = await fetch(`${API}/api/digital-products/admin/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Upload faalde');
      notify(`Upload geslaagd: ${d.filename}`);
      fileInputRef.current.value = '';
      setProductId('');
      fetchFiles();
    } catch (e) {
      notify(e.message, 'error');
    }
    setUploading(false);
  };

  const handleDelete = async (path) => {
    if (!confirm(`Weet je zeker dat je dit bestand wilt verwijderen?\n${path}`)) return;
    try {
      const r = await fetch(`${API}/api/digital-products/admin/file?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error('Verwijderen faalde');
      notify('Bestand verwijderd');
      fetchFiles();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/mijn-download/${token}`);
    notify('Download link gekopieerd');
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4" data-testid="admin-digital-products-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/command-center')}
              className="p-2 hover:bg-stone-200 rounded-lg transition"
              data-testid="back-button"
            >
              <ChevronLeft size={20} className="text-stone-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                <FileText className="text-amber-500" /> Digitale Producten
              </h1>
              <p className="text-sm text-stone-500">Upload en beheer PDF downloads voor je shop.</p>
            </div>
          </div>
          <button
            onClick={() => { fetchFiles(); fetchEntitlements(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
            data-testid="refresh-button"
          >
            <RefreshCw size={16} /> Verversen
          </button>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-amber-500" /> Nieuwe PDF uploaden
          </h2>
          <form onSubmit={handleUpload} className="grid md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-stone-600 mb-1">Koppel aan product (optioneel)</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white"
                data-testid="product-select"
              >
                <option value="">— Geen koppeling (library) —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-stone-600 mb-1">PDF bestand (max 25 MB)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-amber-50 file:text-amber-700"
                data-testid="pdf-input"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              data-testid="upload-button"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>
          <p className="text-xs text-stone-400 mt-3">
            Tip: koppel het bestand aan een bestaand product om het automatisch als digitaal product te markeren. Klanten ontvangen na betaling
            een download-link (24u geldig, max 3 downloads).
          </p>
        </div>

        {/* Files grid */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <Package size={18} className="text-stone-500" /> Bestanden in storage ({files.length})
            </h2>
          </div>
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-stone-400" /></div>
          ) : files.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <FileText size={42} className="mx-auto mb-3 opacity-40" />
              <p>Nog geen PDFs geüpload.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Bestand</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Pad</th>
                    <th className="text-right px-6 py-3 font-medium text-stone-600">Grootte</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Bijgewerkt</th>
                    <th className="text-right px-6 py-3 font-medium text-stone-600">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.path} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-rose-400" />
                          <span className="font-medium text-stone-800">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-stone-500 font-mono text-xs">{f.path}</td>
                      <td className="px-6 py-3 text-right text-stone-600">{fmtBytes(f.size)}</td>
                      <td className="px-6 py-3 text-stone-500">{fmtDate(f.updated_at)}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDelete(f.path)}
                          className="p-2 hover:bg-rose-50 rounded text-rose-500"
                          title="Verwijderen"
                          data-testid={`delete-${f.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Entitlements (download tokens) */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> Download Tokens ({entitlements.length})
            </h2>
            <p className="text-xs text-stone-500 mt-1">Actieve download-rechten per bestelling. Tokens verlopen 24 uur na aanmaak.</p>
          </div>
          {entitlements.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">
              Nog geen download tokens. Worden automatisch aangemaakt bij een succesvolle betaling van een digitaal product.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Klant</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Bestand</th>
                    <th className="text-center px-6 py-3 font-medium text-stone-600">Downloads</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Verloopt</th>
                    <th className="text-right px-6 py-3 font-medium text-stone-600">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {entitlements.map((e) => {
                    const expired = new Date(e.expires_at) < new Date();
                    const used = e.downloads_used || 0;
                    const max = e.max_downloads || 3;
                    const exhausted = used >= max;
                    return (
                      <tr key={e.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-6 py-3 text-stone-700">{e.customer_email}</td>
                        <td className="px-6 py-3 text-stone-600 font-mono text-xs">{(e.file_path || '').split('/').pop()}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${exhausted ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {used}/{max}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-stone-500">
                          {expired ? (
                            <span className="text-rose-500 inline-flex items-center gap-1"><AlertCircle size={13} /> Verlopen</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Clock size={13} /> {fmtDate(e.expires_at)}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => copyToken(e.download_token)}
                            className="p-2 hover:bg-amber-50 rounded text-amber-600"
                            title="Kopieer download link"
                          >
                            <Copy size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AdminDigitalProductsPage;
