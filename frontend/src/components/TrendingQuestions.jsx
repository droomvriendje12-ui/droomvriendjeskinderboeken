import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { TRENDING_QUESTIONS } from '../data/trendingQuestions';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Reusable trending FAQ widget.
 * Props:
 *  - window: 'all' | 'month'                  default 'all'
 *  - limit: number of cards                   default 3
 *  - excludeIds: array of ids to skip         default []
 *  - title: heading                            default 'Wat ouders ons nu vragen'
 *  - subtitle: subheading
 *  - eyebrow: small uppercase line
 *  - variant: 'hero' | 'compact'              default 'hero'
 */
const TrendingQuestions = ({
  window = 'all',
  limit = 3,
  excludeIds = [],
  title = 'Wat ouders ons nu vragen',
  subtitle = 'De top 3 vragen die andere ouders deze week aan ons stelden — inclusief het volledige antwoord.',
  eyebrow,
  variant = 'hero',
}) => {
  const defaultEyebrow = window === 'month' ? 'Meest gestelde vragen deze maand' : 'Veelgestelde vragen deze week';
  const eyebrowText = eyebrow || defaultEyebrow;

  // Filter out excluded ids and pick initial fallback
  const pool = useMemo(
    () => TRENDING_QUESTIONS.filter((q) => !excludeIds.includes(q.id)),
    [excludeIds]
  );
  const [trending, setTrending] = useState(pool.slice(0, limit));
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${API}/api/faq/trending?limit=${limit + excludeIds.length}&window=${window}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data?.trending) return;
        const ordered = data.trending
          .map((row) => pool.find((q) => q.id === row.id))
          .filter(Boolean);
        const ids = new Set(ordered.map((o) => o.id));
        const fallback = pool.filter((q) => !ids.has(q.id));
        setTrending([...ordered, ...fallback].slice(0, limit));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [window, limit, pool, excludeIds]);

  const recordClick = (id) => {
    try {
      fetch(`${API}/api/faq/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) { /* ignore */ }
  };

  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": trending.map((t) => ({
      "@type": "Question",
      "name": t.q,
      "acceptedAnswer": { "@type": "Answer", "text": t.a },
    })),
  }), [trending]);

  if (trending.length === 0) return null;

  const isCompact = variant === 'compact';
  const containerClass = isCompact
    ? 'py-8'
    : 'py-16 sm:py-20 bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50';

  return (
    <section
      className={containerClass}
      data-testid={`trending-questions-${variant}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className={isCompact ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="flex items-center justify-center gap-2 text-amber-700 text-sm font-medium mb-3">
          <TrendingUp className="w-4 h-4" />
          <span className="uppercase tracking-wider">{eyebrowText}</span>
        </div>
        <h2 className={`${isCompact ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-bold text-stone-900 text-center mb-3`}>
          {title}
        </h2>
        {!isCompact && (
          <p className="text-base sm:text-lg text-stone-600 text-center max-w-2xl mx-auto mb-12">
            {subtitle}
          </p>
        )}

        <div className={`grid md:grid-cols-${limit >= 3 ? 3 : limit} gap-5 ${isCompact ? 'mt-6' : ''}`}>
          {trending.map((t, i) => {
            const isOpen = expanded === t.id;
            return (
              <article
                key={t.id}
                className="bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-lg transition overflow-hidden flex flex-col"
                data-testid={`trending-question-${t.id}`}
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-amber-700 font-semibold">
                      #{i + 1} · {t.tag}
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 leading-snug mb-3">
                    {t.q}
                  </h3>
                  <p className={`text-sm text-stone-600 leading-relaxed mb-4 ${isOpen ? '' : 'line-clamp-3'}`}>
                    {t.a}
                  </p>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                    className="text-xs text-stone-500 hover:text-amber-700 self-start mb-4"
                    data-testid={`trending-expand-${t.id}`}
                  >
                    {isOpen ? 'Toon minder' : 'Toon hele antwoord'}
                  </button>
                  <Link
                    to={t.href}
                    onClick={() => recordClick(t.id)}
                    className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:gap-2 transition-all"
                    data-testid={`trending-link-${t.id}`}
                  >
                    Lees verder <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {!isCompact && (
          <div className="text-center mt-10">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium border-b-2 border-amber-700/30 hover:border-amber-700 pb-0.5"
              data-testid="trending-see-all"
            >
              Bekijk alle blogartikelen en gidsen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingQuestions;
