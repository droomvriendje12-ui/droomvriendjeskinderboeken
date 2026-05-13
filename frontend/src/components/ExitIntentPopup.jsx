import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const STORAGE_KEY = 'droomvriendjes_popup_shown';

const ExitIntentPopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Show after 5 seconds
    timerRef.current = setTimeout(() => {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        sessionStorage.setItem(STORAGE_KEY, '1');
      }
    }, 5000);

    // Exit intent: mouse leaves viewport (desktop only)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        sessionStorage.setItem(STORAGE_KEY, '1');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const close = () => setVisible(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Vul een geldig e-mailadres in');
      return;
    }
    setError('');
    try {
      // Store email for newsletter / discount
      await fetch(`${API_URL}/api/email/csv/import-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup_korting', naam: '' })
      }).catch(() => {});
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Show success anyway, don't block UX
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={close} data-testid="exit-popup-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Popup */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
        data-testid="exit-popup"
      >
        {/* Close button */}
        <button onClick={close} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition z-10" data-testid="exit-popup-close">
          <X className="w-4 h-4 text-stone-500" />
        </button>

        {/* Top accent */}
        <div className="h-2 bg-gradient-to-r from-[#8B7355] via-[#C4A882] to-[#8B7355]" />

        <div className="p-6 sm:p-8 text-center">
          {/* Bear icon */}
          <div className="w-20 h-20 mx-auto mb-4 bg-[#fdf5ec] rounded-full flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="Droomvriendjes" className="w-14 h-14 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:2.5rem">&#x1F9F8;</span>'; }} />
          </div>

          {!submitted ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3d2b1f] mb-2 leading-tight">
                Slaap jij al als een droomvriend?
              </h2>
              <p className="text-stone-600 mb-6 text-base">
                Ontvang <span className="font-bold text-[#8B7355]">10% korting</span> op je eerste bestelling!
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Jouw e-mailadres"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-200 focus:border-[#8B7355] focus:ring-2 focus:ring-[#8B7355]/20 outline-none text-center text-base transition"
                  data-testid="popup-email-input"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#8B7355] hover:bg-[#7a6349] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-base"
                  data-testid="popup-submit-btn"
                >
                  Ja, ik wil mijn korting!
                </button>
              </form>

              <button onClick={close} className="mt-4 text-sm text-stone-400 hover:text-stone-600 transition" data-testid="popup-dismiss">
                Nee bedankt
              </button>
            </>
          ) : (
            <div className="py-4" data-testid="popup-success">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#3d2b1f] mb-2">Gelukt!</h3>
              <p className="text-stone-600 mb-2">
                Gebruik code <span className="font-bold text-[#8B7355] bg-[#fdf5ec] px-2 py-1 rounded">WELKOM10</span> bij het afrekenen.
              </p>
              <p className="text-sm text-stone-400">10% korting op je eerste bestelling</p>
            </div>
          )}
        </div>

        {/* Bottom accent */}
        <div className="px-6 sm:px-8 pb-5 flex items-center justify-center gap-4 text-xs text-stone-400">
          <span>Veilig betalen</span>
          <span>&#8226;</span>
          <span>Gratis verzending</span>
          <span>&#8226;</span>
          <span>14 dagen retour</span>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
