import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Footer from '../components/Footer';
import RelatedArticles from './RelatedArticles';
import TrendingQuestions from './TrendingQuestions';

/**
 * Reusable blog post layout for SEO-optimised posts.
 * Renders Article + FAQ + Breadcrumb JSON-LD inline for rich snippets.
 */
const BlogPostLayout = ({
  category,
  categoryColor = 'bg-amber-100 text-amber-900',
  title,
  excerpt,
  date,
  readMinutes,
  slug,
  heroImage,
  toc = [],
  children,
  faqs = [],
  relatedProducts = [],
}) => {
  const url = `https://droomvriendjes.com/blog/${slug}`;

  useEffect(() => {
    document.title = `${title} | Droomvriendjes Blog`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = excerpt;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, excerpt, url]);

  // Article + FAQ + Breadcrumb schemas
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": excerpt,
    "image": heroImage || "https://droomvriendjes.com/og-image.jpg",
    "datePublished": date,
    "dateModified": date,
    "author": { "@type": "Organization", "name": "Droomvriendjes" },
    "publisher": {
      "@type": "Organization",
      "name": "Droomvriendjes",
      "logo": { "@type": "ImageObject", "url": "https://droomvriendjes.com/logo.svg" }
    },
    "mainEntityOfPage": url
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://droomvriendjes.com/" },
      { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://droomvriendjes.com/blogs" },
      { "@type": "ListItem", "position": 3, "name": title, "item": url }
    ]
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="blog-post-page">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-3" data-testid="blog-logo">
            <img src="https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/branding/droomvriendjes-logo.png" alt="Droomvriendjes" className="h-14 w-auto" />
          </Link>
          <Link to="/blogs">
            <Button variant="outline" className="rounded-full" data-testid="back-to-blogs">
              <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar blogs
            </Button>
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <header className="mb-10">
          <nav className="text-xs text-stone-500 mb-4 flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-amber-700">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/blogs" className="hover:text-amber-700">Blogs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-700">{category}</span>
          </nav>
          <Badge className={`${categoryColor} border-0 mb-4`}>{category}</Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight" data-testid="blog-title">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-stone-600 mb-6 leading-relaxed">{excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-2"><User className="w-4 h-4" /> Team Droomvriendjes</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {readMinutes} min lezen</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {date}</div>
          </div>
        </header>

        {/* Table of contents */}
        {toc.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mb-10" data-testid="blog-toc">
            <p className="text-sm font-semibold text-stone-900 mb-3">In dit artikel</p>
            <ol className="space-y-1.5 text-sm">
              {toc.map((item, i) => (
                <li key={i}>
                  <a href={`#${item.id}`} className="text-amber-800 hover:text-amber-900 hover:underline">
                    {i + 1}. {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Main content */}
        <div className="prose prose-stone prose-lg max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-stone-900" data-testid="blog-content">
          {children}
        </div>

        {/* FAQ section */}
        {faqs.length > 0 && (
          <section className="mt-12 pt-8 border-t border-stone-200" data-testid="blog-faq">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Veelgestelde vragen</h2>
            <div className="space-y-5">
              {faqs.map((f, i) => (
                <details key={i} className="group rounded-xl border border-stone-200 bg-white p-5 open:bg-amber-50/40">
                  <summary className="font-semibold text-stone-900 cursor-pointer list-none flex justify-between items-center">
                    <span>{f.q}</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition" />
                  </summary>
                  <p className="mt-3 text-stone-700 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related products CTA */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-stone-200" data-testid="blog-related-products">
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Aanrader uit onze collectie</h2>
            <p className="text-stone-600 mb-6">Deze Droomvriendjes helpen bij wat je net hebt gelezen.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group rounded-xl border border-stone-200 bg-white p-5 hover:border-amber-400 hover:shadow-md transition flex items-center gap-4"
                  data-testid={`related-product-${p.id}`}
                >
                  <div className="w-16 h-16 rounded-lg bg-stone-100 flex-shrink-0 flex items-center justify-center text-2xl">
                    {p.emoji || '🧸'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900 group-hover:text-amber-700">{p.name}</h3>
                    <p className="text-sm text-stone-500">Bekijk dit Droomvriendje →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related articles (auto from blogPosts data) */}
        <RelatedArticles currentSlug={slug} />

        {/* Trending FAQs - monthly window */}
        <TrendingQuestions
          variant="compact"
          window="month"
          limit={3}
          title="Meest gestelde vragen deze maand"
        />

        {/* Newsletter / Conversion CTA */}
        <section className="mt-12 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Hulp nodig met kiezen?</h2>
          <p className="text-stone-700 mb-5">Onze Droomvriendjes-experts helpen je graag het juiste knuffeltje te vinden voor jouw kind.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/knuffels">
              <Button className="bg-amber-700 hover:bg-amber-800 text-white rounded-full px-6">Bekijk alle knuffels</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="rounded-full px-6">Stel een vraag</Button>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPostLayout;
