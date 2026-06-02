/**
 * Lichtgewicht SEO-helper die meta-tags, canonical, hreflang en JSON-LD direct in
 * <head> zet. In deze codebase wordt react-helmet-async niet betrouwbaar toegepast;
 * directe DOM-manipulatie (zoals in ProductPage/BlogPostLayout) werkt wél.
 *
 * Gebruik in een useEffect: applySeo({ ... }).
 */
export function applySeo({
  title,
  description,
  canonical,
  og = {},
  twitter = {},
  alternates = [],
  jsonLd,
  jsonLdId = 'page-jsonld',
}) {
  if (title) document.title = title;

  const setMeta = (selector, attr, key, value) => {
    if (value == null) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };

  if (description) setMeta('meta[name="description"]', 'name', 'description', description);
  Object.entries(og).forEach(([k, v]) => setMeta(`meta[property="og:${k}"]`, 'property', `og:${k}`, v));
  Object.entries(twitter).forEach(([k, v]) => setMeta(`meta[name="twitter:${k}"]`, 'name', `twitter:${k}`, v));

  if (canonical) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
  }

  // hreflang alternates — vervang de eerder door ons beheerde links
  document.head.querySelectorAll('link[data-managed-hreflang]').forEach((e) => e.remove());
  alternates.forEach(({ hreflang, href }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.setAttribute('hreflang', hreflang);
    link.href = href;
    link.setAttribute('data-managed-hreflang', '');
    document.head.appendChild(link);
  });

  if (jsonLd) {
    let script = document.getElementById(jsonLdId);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = jsonLdId;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }
}
