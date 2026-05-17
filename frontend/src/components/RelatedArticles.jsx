import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { getRelatedPosts } from '../data/blogPosts';

/**
 * Related articles grid - call with the slug of the current blog post.
 * Renders up to 3 cards ordered by category + tag overlap.
 */
const RelatedArticles = ({ currentSlug, limit = 3, title = 'Lees ook' }) => {
  const posts = getRelatedPosts(currentSlug, limit);
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-stone-200" data-testid="related-articles">
      <h2 className="text-2xl font-bold text-stone-900 mb-2">{title}</h2>
      <p className="text-stone-600 mb-6">Misschien vind je deze artikelen ook interessant.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="group rounded-xl border border-stone-200 bg-white overflow-hidden hover:border-amber-400 hover:shadow-md transition flex flex-col"
            data-testid={`related-article-${p.slug}`}
          >
            <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <Badge className={`absolute top-3 left-3 border-0 ${p.categoryColor || 'bg-amber-100 text-amber-900'}`}>
                {p.category}
              </Badge>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-semibold text-stone-900 leading-snug mb-2 group-hover:text-amber-700 line-clamp-2">
                {p.title}
              </h3>
              <p className="text-sm text-stone-600 line-clamp-2 mb-4">{p.excerpt}</p>
              <div className="mt-auto flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {p.readMinutes} min</span>
                <span className="flex items-center gap-1 text-amber-700 group-hover:gap-2 transition-all font-medium">
                  Lees verder <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
