import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Download, BookOpen, Check, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Clock, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL;

const MijnBoekPage = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [spread, setSpread] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const startedRef = useRef(false);
  const pollRef = useRef(null);

  const startGeneration = useCallback(async () => {
    try {
      await fetch(`${API}/api/kids-book/${bookId}/start-generation`, { method: 'POST' });
    } catch { /* polling continues */ }
  }, [bookId]);

  const fetchBook = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/kids-book/${bookId}`);
      if (!res.ok) { setError('Boek niet gevonden'); return; }
      const data = await res.json();
      setBook(data);
      // If paid but not yet generating/ready, kick off generation once
      if (data.paid && data.status !== 'ready' && data.status !== 'generating' && !startedRef.current) {
        startedRef.current = true;
        startGeneration();
      }
      // If status is still draft (payment just completed, webhook pending), try to start
      if (!data.paid && data.status === 'draft' && !startedRef.current) {
        startedRef.current = true;
        startGeneration();
      }
    } catch {
      setError('Kon de status niet ophalen');
    }
  }, [bookId, startGeneration]);

  useEffect(() => {
    fetchBook();
    pollRef.current = setInterval(fetchBook, 4000);
    return () => clearInterval(pollRef.current);
  }, [fetchBook]);

  useEffect(() => {
    if (book && book.status === 'ready' && pollRef.current) clearInterval(pollRef.current);
  }, [book]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/api/kids-book/${bookId}/download`);
      const data = await res.json();
      if (res.ok && data.url) window.open(data.url, '_blank');
      else setError(data.detail || 'Download nog niet beschikbaar');
    } catch {
      setError('Download mislukt');
    }
    setDownloading(false);
  };

  const retry = () => { startedRef.current = false; startGeneration(); fetchBook(); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a1a3e] via-[#3a2456] to-[#1a1030] text-white" data-testid="mijn-boek-page">
      <Header />
      <header className="max-w-5xl mx-auto px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Terug naar Droomvriendjes
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-200 mb-3">
            <BookOpen className="w-4 h-4" /> Mijn Boek
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{book?.title || 'Jouw boek'}</h1>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-xl mb-5 text-sm text-center" data-testid="mb-error">{error}</div>
        )}

        {!book ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-300" /></div>
        ) : (book.status === 'draft' && !book.paid) ? (
          <div className="bg-white/5 rounded-3xl p-10 text-center" data-testid="mb-pending">
            <Clock className="w-12 h-12 mx-auto text-amber-300 mb-4 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">Betaling wordt bevestigd...</h2>
            <p className="text-white/60">Zodra je betaling binnen is, beginnen we automatisch met het maken van je boek.</p>
          </div>
        ) : (book.status === 'error') ? (
          <div className="bg-white/5 rounded-3xl p-10 text-center" data-testid="mb-error-state">
            <AlertCircle className="w-12 h-12 mx-auto text-red-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Er ging iets mis tijdens het maken</h2>
            <p className="text-white/60 mb-5">Geen zorgen, je betaling is veilig. Probeer het opnieuw.</p>
            <button onClick={retry} className="bg-amber-400 text-[#2a1a3e] px-6 py-3 rounded-xl font-bold" data-testid="mb-retry-btn">Opnieuw proberen</button>
          </div>
        ) : (book.status !== 'ready') ? (
          <div className="bg-white/5 rounded-3xl p-10 text-center" data-testid="mb-generating">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-[#2a1a3e] animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">We maken je boek pagina voor pagina...</h2>
            <p className="text-white/60 mb-5">Dit duurt enkele minuten. Je kunt deze pagina open laten staan.</p>
            <div className="max-w-sm mx-auto">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
                  style={{ width: `${book.total_pages ? Math.round((book.pages_done / book.total_pages) * 100) : 0}%` }} data-testid="mb-progress-bar" />
              </div>
              <p className="text-sm text-white/50 mt-2" data-testid="mb-progress-text">{book.pages_done} / {book.total_pages} pagina's klaar</p>
            </div>
          </div>
        ) : (
          // READY — flipbook + download
          <div data-testid="mb-ready">
            <div className="bg-white/5 rounded-3xl p-4 sm:p-8">
              <div className="relative bg-white rounded-2xl overflow-hidden text-slate-800 shadow-2xl">
                {book.pages[spread]?.image
                  ? <img src={book.pages[spread].image} alt={`Pagina ${spread + 1}`} className="w-full h-72 sm:h-96 object-cover" data-testid="mb-page-image" />
                  : <div className="w-full h-72 sm:h-96 flex items-center justify-center bg-slate-100 text-slate-300"><BookOpen className="w-12 h-12" /></div>}
                <p className="p-5 text-center text-base leading-relaxed min-h-[80px]">{book.pages[spread]?.text}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => setSpread(s => Math.max(0, s - 1))} disabled={spread === 0}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30" data-testid="mb-prev-page"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-sm text-white/70">Pagina {spread + 1} van {book.pages.length}</span>
                <button onClick={() => setSpread(s => Math.min(book.pages.length - 1, s + 1))} disabled={spread >= book.pages.length - 1}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30" data-testid="mb-next-page"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-6 mt-5 text-center">
              <div className="inline-flex items-center gap-2 text-green-300 font-semibold mb-3"><Check className="w-5 h-5" /> Je boek is klaar!</div>
              <p className="text-white/60 mb-5 text-sm">Download de volledige PDF en print 'm zo vaak je wilt.{book.physical ? ' Je gedrukte exemplaar wordt verzonden.' : ''}</p>
              <button onClick={handleDownload} disabled={downloading}
                className="inline-flex items-center gap-2 bg-amber-400 text-[#2a1a3e] px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition-all disabled:opacity-50" data-testid="mb-download-btn">
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MijnBoekPage;
