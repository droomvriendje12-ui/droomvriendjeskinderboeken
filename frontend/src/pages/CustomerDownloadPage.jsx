import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Download, Clock, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Heart } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const CustomerDownloadPage = () => {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/digital-products/info/${token}`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Download niet gevonden');
        setInfo(d);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/digital-products/download/${token}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Download faalde');
      // Trigger download in nieuwe tab
      const a = document.createElement('a');
      a.href = d.url;
      a.download = d.filename || 'droomvriendjes.pdf';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSuccess({ filename: d.filename, remaining: d.downloads_remaining });
      // Refresh info
      const r2 = await fetch(`${API}/api/digital-products/info/${token}`);
      if (r2.ok) setInfo(await r2.json());
    } catch (e) {
      setError(e.message);
    }
    setDownloading(false);
  };

  const expired = info?.expires_at && new Date(info.expires_at) < new Date();
  const used = info?.downloads_used || 0;
  const max = info?.max_downloads || 3;
  const remaining = Math.max(0, max - used);
  const exhausted = remaining === 0;

  return (
    <>
      <Helmet>
        <title>Jouw Download | Droomvriendjes</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-rose-50 py-12 px-4 flex items-center justify-center" data-testid="customer-download-page">
        <div className="max-w-xl w-full">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold text-stone-900 tracking-wide">
              <Heart size={26} className="text-amber-500 fill-amber-500" />
              <span>DROOMVRIENDJES</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">Jouw digitale download</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
            {/* Top stripe */}
            <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400" />

            <div className="p-8">
              {loading && (
                <div className="py-16 flex flex-col items-center text-stone-400">
                  <Loader2 className="animate-spin mb-3" size={32} />
                  <p>Een momentje, we zoeken je download...</p>
                </div>
              )}

              {error && !info && (
                <div className="py-16 flex flex-col items-center text-center">
                  <AlertCircle size={42} className="text-rose-400 mb-3" />
                  <h2 className="text-xl font-bold text-stone-900 mb-2">Oeps!</h2>
                  <p className="text-stone-600 mb-4">{error}</p>
                  <a href="mailto:info@droomvriendjes.com" className="text-amber-600 underline text-sm">
                    Neem contact op met onze klantenservice
                  </a>
                </div>
              )}

              {info && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <FileText className="text-amber-600" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-stone-900 truncate" data-testid="download-filename">
                        {info?.product?.name || info.filename}
                      </h2>
                      <p className="text-xs text-stone-500 truncate">{info.filename}</p>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        <ShieldCheck size={14} /> Downloads
                      </div>
                      <p className={`text-lg font-bold ${exhausted ? 'text-rose-500' : 'text-emerald-600'}`} data-testid="downloads-status">
                        {remaining} <span className="text-sm font-normal text-stone-400">/ {max} over</span>
                      </p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        <Clock size={14} /> Geldig tot
                      </div>
                      <p className={`text-sm font-bold ${expired ? 'text-rose-500' : 'text-stone-800'}`} data-testid="expires-status">
                        {expired ? 'Verlopen' : new Date(info.expires_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Success */}
                  {success && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 flex items-start gap-3" data-testid="success-message">
                      <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm">
                        <p className="font-medium text-emerald-800">Download gestart!</p>
                        <p className="text-emerald-700 text-xs mt-1">
                          Check je downloads map. Nog <strong>{success.remaining}</strong> downloads over.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error inline */}
                  {error && info && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5 text-sm text-rose-700 flex items-start gap-3">
                      <AlertCircle className="flex-shrink-0 mt-0.5" size={18} /> {error}
                    </div>
                  )}

                  {/* Download button */}
                  {expired ? (
                    <div className="text-center py-6 text-stone-500">
                      <p className="mb-3">Deze download-link is verlopen.</p>
                      <a
                        href="mailto:info@droomvriendjes.com"
                        className="inline-block text-amber-600 underline text-sm"
                      >
                        Mail ons voor een nieuwe link
                      </a>
                    </div>
                  ) : exhausted ? (
                    <div className="text-center py-6 text-stone-500">
                      <p className="mb-3">Je hebt het maximum aantal downloads bereikt ({max}x).</p>
                      <a
                        href="mailto:info@droomvriendjes.com"
                        className="inline-block text-amber-600 underline text-sm"
                      >
                        Vraag een nieuwe download aan
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      data-testid="download-button"
                    >
                      {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                      {downloading ? 'Bezig...' : 'Download PDF'}
                    </button>
                  )}

                  <p className="text-xs text-stone-400 text-center mt-5">
                    Tip: sla het bestand direct op je apparaat op. Bewaar deze link niet — hij is persoonlijk.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Cross-sell: 10% korting op eerste knuffel */}
          {info?.crosssell && (
            <CrossSellCard crosssell={info.crosssell} />
          )}

          <p className="text-center text-xs text-stone-400 mt-6">
            Vragen? <a href="mailto:info@droomvriendjes.com" className="underline">info@droomvriendjes.com</a>
          </p>
        </div>
      </div>
    </>
  );
};

const CrossSellCard = ({ crosssell }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(crosssell.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignored — clipboard might be restricted
    }
  };
  return (
    <div
      className="mt-8 rounded-2xl p-6 border-2 border-dashed border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 text-center"
      data-testid="crosssell-card"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700 font-bold mb-1">
        Cadeau van Droomvriendjes
      </p>
      <h3 className="text-2xl font-black text-amber-950 leading-tight mb-2">
        {crosssell.message}
      </h3>
      <p className="text-sm text-amber-900/80 leading-relaxed mb-5 max-w-md mx-auto">
        Een knuffel maakt het ritueel uit deze PDF nóg krachtiger. Gebruik onderstaande code bij je eerste knuffel-bestelling — eenmalig geldig.
      </p>
      <button
        onClick={copy}
        className="inline-flex items-center gap-3 bg-white border-2 border-amber-500 rounded-xl px-6 py-3 mb-4 hover:bg-amber-50 transition-colors group"
        data-testid="crosssell-copy-btn"
      >
        <span className="font-mono text-xl font-bold text-amber-900 tracking-[3px]">{crosssell.code}</span>
        <span className="text-xs text-amber-700 group-hover:underline">{copied ? '✓ Gekopieerd' : 'Klik om te kopiëren'}</span>
      </button>
      <div>
        <a
          href="/knuffels"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-xl shadow transition-colors"
          data-testid="crosssell-cta-btn"
        >
          Bekijk de knuffels →
        </a>
      </div>
    </div>
  );
};

export default CustomerDownloadPage;
