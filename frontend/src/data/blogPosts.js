/**
 * Central blog index for cross-linking & related articles.
 * Add new blog entries here so they automatically appear in related sections.
 */

export const BLOG_POSTS = [
  {
    slug: "waarom-huilt-baby-s-nachts",
    title: "Waarom huilt mijn baby 's nachts? 10 oorzaken en wat je eraan kunt doen",
    excerpt: "Je baby huilt elke nacht en je weet niet meer wat je moet doen? 10 oorzaken én praktische slaaptips.",
    category: "Babyslaap",
    categoryColor: "bg-rose-100 text-rose-800",
    date: "18 mei 2026",
    readMinutes: 9,
    image: "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/sheep-main.png",
    tags: ["slaap", "baby", "huilen", "tips"],
  },
  {
    slug: "verschil-verzwaringsknuffel-nachtlampje",
    title: "Verzwaringsknuffel vs nachtlampje-knuffel: welke past bij jouw kind?",
    excerpt: "Beide knuffels helpen bij beter slapen, maar werken totaal anders. We leggen het verschil uit.",
    category: "Productgids",
    categoryColor: "bg-sky-100 text-sky-800",
    date: "18 mei 2026",
    readMinutes: 6,
    image: "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/bearbrown-main.png",
    tags: ["knuffel", "vergelijking", "kopen", "angst"],
  },
  {
    slug: "beste-slaapknuffel-2026",
    title: "Wat is de beste slaapknuffel voor je kind in 2026? Complete koopgids",
    excerpt: "Ouders kiezen tussen tientallen slaapknuffels. Maar welke is écht de beste? Onze eerlijke top 5.",
    category: "Productgids",
    categoryColor: "bg-emerald-100 text-emerald-800",
    date: "18 mei 2026",
    readMinutes: 8,
    image: "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/panda-main.png",
    tags: ["knuffel", "kopen", "review", "kraamcadeau"],
  },
  {
    slug: "5-tips-betere-nachtrust-kinderen",
    title: "5 Tips voor een Betere Nachtrust bij Kinderen",
    excerpt: "Ontdek de beste tips om je kind te helpen beter te slapen. Van een vaste slaaproutine tot een rustige slaapomgeving.",
    category: "Slaaptips",
    categoryColor: "bg-amber-100 text-amber-900",
    date: "10 januari 2025",
    readMinutes: 7,
    image: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=800",
    tags: ["slaap", "tips", "kinderen", "routine"],
  },
  {
    slug: "hoe-helpen-kalmerende-knuffels-bij-stress",
    title: "Hoe Helpen Kalmerende Knuffels bij Stress?",
    excerpt: "Hoe onze kalmerende knuffels met licht en muziek wetenschappelijk bewezen helpen bij stress en angst bij kinderen.",
    category: "Wetenschap",
    categoryColor: "bg-violet-100 text-violet-800",
    date: "5 januari 2025",
    readMinutes: 7,
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    tags: ["knuffel", "stress", "angst", "wetenschap"],
  },
  {
    slug: "droomvriendjes-mondriaan-samenwerking",
    title: "Rust in de avond: hoe slaap bijdraagt aan mentale veerkracht bij kinderen",
    excerpt: "In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Praktische rustmomenten en een slaapritueel dat haalbaar blijft maken een groot verschil.",
    category: "Mentale rust",
    categoryColor: "bg-amber-100 text-amber-900",
    date: "19 januari 2025",
    readMinutes: 8,
    image: "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/bearbrown-main.png",
    tags: ["rust", "gezin", "mentale gezondheid", "slaap"],
  },
];

/**
 * Pick up to N related posts for a given slug.
 * Ranking:
 * 1. Same category
 * 2. Highest overlap of tags
 * 3. Most recent
 */
export function getRelatedPosts(currentSlug, limit = 3) {
  const current = BLOG_POSTS.find((p) => p.slug === currentSlug);
  if (!current) return BLOG_POSTS.filter((p) => p.slug !== currentSlug).slice(0, limit);

  const others = BLOG_POSTS.filter((p) => p.slug !== currentSlug);
  const scored = others.map((p) => {
    let score = 0;
    if (p.category === current.category) score += 10;
    const sharedTags = (p.tags || []).filter((t) => (current.tags || []).includes(t));
    score += sharedTags.length * 3;
    return { post: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.post);
}
