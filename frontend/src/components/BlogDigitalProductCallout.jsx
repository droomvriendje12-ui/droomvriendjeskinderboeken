import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowRight, FileText } from 'lucide-react';

/**
 * BlogDigitalProductCallout
 * 
 * Inline editorial recommendation card for a digital product (PDF).
 * Designed to *feel* like the writer recommends a helpful resource —
 * not like a product tile dropped in the middle of the article.
 *
 * Used inside a single blog post (max one occurrence). Keep the
 * surrounding paragraph context so the reader naturally arrives
 * at it.
 *
 * Props:
 *   product   – { id, name, price, image, description } from /api/products
 *   teaser    – Short editorial sentence the writer "says" before the box
 *   benefits  – 2-3 bullet outcomes (string[])
 *   ctaLabel  – Optional button label (defaults to "Direct downloaden")
 */
const BlogDigitalProductCallout = ({ product, teaser, benefits = [], ctaLabel = 'Direct downloaden' }) => {
  if (!product) return null;

  const cleanName = (product.name || '').replace(/\s*\(PDF\)\s*$/i, '');
  const priceLabel = typeof product.price === 'number' ? `€${product.price.toFixed(2).replace('.', ',')}` : null;

  return (
    <aside
      className="not-prose my-10 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 sm:p-7 shadow-sm"
      data-testid={`blog-digital-callout-${product.id}`}
    >
      {teaser && (
        <p className="text-[15px] sm:text-base italic text-amber-900/80 leading-relaxed mb-4 sm:mb-5">
          {teaser}
        </p>
      )}

      <Link
        to={`/product/${product.id}`}
        className="group flex flex-col sm:flex-row gap-4 sm:gap-5 items-start hover:bg-white/60 rounded-xl p-3 sm:p-4 -mx-2 sm:-mx-3 transition-colors"
        data-testid={`blog-digital-callout-link-${product.id}`}
      >
        {/* Visual */}
        <div className="w-full sm:w-32 md:w-40 flex-shrink-0 aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden bg-white border border-amber-100 flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={cleanName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <FileText className="w-12 h-12 text-amber-400" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold uppercase tracking-wider mb-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Direct downloadbare PDF</span>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-amber-950 leading-snug mb-2 group-hover:text-amber-700 transition-colors">
            {cleanName}
          </h4>
          {benefits.length > 0 && (
            <ul className="space-y-1 mb-3">
              {benefits.slice(0, 3).map((b, i) => (
                <li key={i} className="text-sm text-stone-700 leading-relaxed flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              {priceLabel && <>Vanaf <span className="text-base">{priceLabel}</span></>}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 group-hover:gap-2.5 transition-all">
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </aside>
  );
};

export default BlogDigitalProductCallout;
