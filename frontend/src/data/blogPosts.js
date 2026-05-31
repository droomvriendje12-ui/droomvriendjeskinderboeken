/**
 * Central blog index for cross-linking & related articles.
 * Add new blog entries here so they automatically appear in related sections.
 */

const BIMG = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/";

export const BLOG_POSTS = [
  {
    slug: "waarom-huilt-baby-s-nachts",
    title: "Waarom huilt mijn baby 's nachts? 10 oorzaken en wat je eraan kunt doen",
    excerpt: "Je baby huilt elke nacht en je weet niet meer wat je moet doen? 10 oorzaken én praktische slaaptips.",
    category: "Babyslaap",
    categoryColor: "bg-rose-100 text-rose-800",
    date: "18 mei 2026",
    readMinutes: 9,
    image: BIMG + "waarom-huilt-baby-s-nachts.jpg",
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
    image: BIMG + "verschil-verzwaringsknuffel-nachtlampje.jpg",
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
    image: BIMG + "beste-slaapknuffel-2026.jpg",
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
    image: BIMG + "5-tips-betere-nachtrust-kinderen.jpg",
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
    image: BIMG + "hoe-helpen-kalmerende-knuffels-bij-stress.jpg",
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
    image: BIMG + "droomvriendjes-mondriaan-samenwerking.jpg",
    tags: ["rust", "gezin", "mentale gezondheid", "slaap"],
  },
  {
    slug: "baby-knuffel-veilig-slapen-leeftijd",
    title: "Vanaf welke leeftijd mag een baby veilig met een knuffel slapen?",
    excerpt: "De officiële richtlijnen, de risico's vóór 12 maanden en hoe je een knuffel veilig introduceert in bed.",
    category: "Veilig slapen",
    categoryColor: "bg-teal-100 text-teal-800",
    date: "28 mei 2026",
    readMinutes: 7,
    image: BIMG + "baby-knuffel-veilig-slapen-leeftijd.jpg",
    tags: ["baby", "knuffel", "veiligheid", "leeftijd"],
  },
  {
    slug: "slaapregressie-bij-kinderen",
    title: "Slaapregressie bij baby's en peuters: herkennen en oplossen",
    excerpt: "De leeftijden waarop slaapregressie toeslaat, waarom het gebeurt en wat écht helpt om er doorheen te komen.",
    category: "Babyslaap",
    categoryColor: "bg-rose-100 text-rose-800",
    date: "27 mei 2026",
    readMinutes: 8,
    image: BIMG + "slaapregressie-bij-kinderen.jpg",
    tags: ["slaap", "baby", "peuter", "regressie", "routine"],
  },
  {
    slug: "witte-ruis-white-noise-baby",
    title: "Witte ruis voor baby's: helpt white noise écht bij slapen?",
    excerpt: "Wat witte ruis met de babyslaap doet, hoe je het veilig gebruikt en welk volume verantwoord is.",
    category: "Wetenschap",
    categoryColor: "bg-violet-100 text-violet-800",
    date: "26 mei 2026",
    readMinutes: 6,
    image: BIMG + "witte-ruis-white-noise-baby.jpg",
    tags: ["baby", "slaap", "wetenschap", "white noise"],
  },
  {
    slug: "avondroutine-kind-7-stappen",
    title: "Een rustgevende avondroutine in 7 stappen (met gratis printbaar schema)",
    excerpt: "Een vaste avondroutine is de snelste route naar beter slapen. Volg ons stappenplan en download het gratis slaapschema.",
    category: "Slaaptips",
    categoryColor: "bg-amber-100 text-amber-900",
    date: "25 mei 2026",
    readMinutes: 7,
    image: BIMG + "avondroutine-kind-7-stappen.jpg",
    tags: ["slaap", "tips", "routine", "kinderen", "printable"],
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
