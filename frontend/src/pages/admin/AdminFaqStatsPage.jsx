import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, TrendingUp, Loader2, ExternalLink } from 'lucide-react';
import { TRENDING_QUESTIONS } from '../../data/trendingQuestions';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const AdminFaqStatsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/faq/admin/stats`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setItems(d.items || []);
        setTotalClicks(d.total_clicks || 0);
        setCurrentMonth(d.current_month || '');
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Merge stats with question metadata; show all known questions even with 0 clicks
  const merged = TRENDING_QUESTIONS.map((q) => {
    const stat = items.find((i) => i.id === q.id);
    return {
      ...q,
      total_clicks: stat?.total_clicks || 0,
      this_month: stat?.this_month || 0,
      last_click_at: stat?.last_click_at,
    };
  }).sort((a, b) => b.total_clicks - a.total_clicks);

  const maxClicks = Math.max(1, ...merged.map((m) => m.total_clicks));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100" data-testid="admin-faq-stats">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900" data-testid="back-btn">
            <ChevronLeft className="w-5 h-5" /> Terug
          </button>
          <div className="h-6 w-px bg-slate-300" />
          <TrendingUp className="w-7 h-7 text-amber-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FAQ Trending Statistieken</h1>
            <p className="text-sm text-slate-500">
              {totalClicks} totale clicks · Huidige maand: {currentMonth}
            </p>
          </div>
          <div className="ml-auto">
            <button onClick={load} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50" data-testid="refresh-btn">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Insights bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Totale clicks" value={totalClicks} />
          <Stat label="Unieke vragen" value={merged.filter((m) => m.total_clicks > 0).length} sub={`van ${merged.length} totaal`} />
          <Stat label="Top vraag" value={merged[0]?.total_clicks || 0} sub={merged[0]?.q?.slice(0, 30) + '…'} />
          <Stat label="Deze maand" value={merged.reduce((sum, m) => sum + (m.this_month || 0), 0)} />
        </div>

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm" data-testid="faq-stats-table">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 w-12">#</th>
                  <th className="text-left px-4 py-3">Vraag</th>
                  <th className="text-left px-4 py-3 w-24">Categorie</th>
                  <th className="text-right px-4 py-3 w-24">Deze maand</th>
                  <th className="text-right px-4 py-3 w-24">Totaal</th>
                  <th className="text-left px-4 py-3 w-48">Verhouding</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merged.map((m, i) => (
                  <tr key={m.id} className="hover:bg-amber-50/30 transition" data-testid={`faq-row-${m.id}`}>
                    <td className="px-4 py-3 text-slate-500 font-mono">#{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{m.q}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xl">{m.a}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">{m.tag}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {m.this_month > 0 ? (
                        <span className="font-semibold text-amber-700">{m.this_month}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{m.total_clicks}</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 transition-all"
                          style={{ width: `${(m.total_clicks / maxClicks) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={m.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-100 rounded inline-flex"
                        title="Open landing pagina"
                        data-testid={`open-link-${m.id}`}
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Tip: voeg nieuwe vragen toe in <code className="bg-slate-100 px-1.5 py-0.5 rounded">/app/frontend/src/data/trendingQuestions.js</code> — ze verschijnen automatisch in deze rapportage zodra ze geklikt worden.
        </p>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub }) => (
  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
    <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</div>
    {sub && <div className="text-xs text-slate-500 truncate mt-0.5">{sub}</div>}
  </div>
);

export default AdminFaqStatsPage;
