/**
 * 20 Google Shopping Campagnes voor Droomvriendjes
 * SEO & SEA geoptimaliseerd
 * Laatst bijgewerkt: Januari 2026
 */

export const shoppingCampaigns = [
  // ========== PERFORMANCE MAX CAMPAGNES (5) ==========
  {
    id: 1,
    name: "PMAX - Slaapknuffels Algemeen",
    type: "Performance Max",
    status: "active",
    dailyBudget: 25.00,
    targetRoas: 400,
    products: "all",
    targeting: {
      audiences: ["ouders", "grootouders", "kraamcadeau"],
      locations: ["Nederland", "België"],
      languages: ["nl"]
    },
    seoKeywords: [
      "slaapknuffel", "knuffel nachtlampje", "baby nachtlamp",
      "sterrenprojectie knuffel", "white noise knuffel"
    ],
    description: "Brede campagne voor alle producten met AI-gestuurde optimalisatie"
  },
  {
    id: 2,
    name: "PMAX - Baby & Peuter",
    type: "Performance Max",
    status: "active",
    dailyBudget: 20.00,
    targetRoas: 350,
    products: ["leeuw", "schaap", "beer", "konijn"],
    targeting: {
      audiences: ["nieuwe ouders", "zwangere vrouwen", "babyshower"],
      locations: ["Nederland", "België"],
      ageGroups: ["25-34", "35-44"]
    },
    seoKeywords: [
      "baby slaapknuffel", "peuter nachtlampje", "baby in slaap",
      "peuter slaapt niet door", "baby rustgevend"
    ],
    description: "Focus op nieuwe ouders met baby's en peuters"
  },
  {
    id: 3,
    name: "PMAX - Cadeau & Seizoen",
    type: "Performance Max",
    status: "active",
    dailyBudget: 30.00,
    targetRoas: 300,
    products: "all",
    targeting: {
      audiences: ["gift-givers", "grootouders", "tantes/ooms"],
      occasions: ["kerst", "verjaardag", "geboorte", "babyshower"]
    },
    seoKeywords: [
      "kraamcadeau", "cadeau baby", "verjaardagscadeau peuter",
      "kerstcadeau kind", "babyshower cadeau"
    ],
    description: "Seizoensgebonden en cadeau-gerichte campagne"
  },
  {
    id: 4,
    name: "PMAX - Premium Producten",
    type: "Performance Max",
    status: "active",
    dailyBudget: 15.00,
    targetRoas: 500,
    products: ["projector-deluxe", "premium-set"],
    targeting: {
      audiences: ["high-income families", "quality-seekers"],
      demographics: {income: "top 30%"}
    },
    seoKeywords: [
      "premium slaapknuffel", "luxe baby knuffel", "beste nachtlamp kind",
      "kwaliteit babyproducten"
    ],
    description: "High-value klanten voor premium producten"
  },
  {
    id: 5,
    name: "PMAX - Retargeting Converters",
    type: "Performance Max",
    status: "active",
    dailyBudget: 15.00,
    targetRoas: 600,
    products: "all",
    targeting: {
      audiences: ["cart-abandoners", "product-viewers", "past-buyers"],
      retargetingWindow: "30 days"
    },
    seoKeywords: [
      "droomvriendjes knuffel", "slaapknuffel kopen",
      "knuffel met licht bestellen"
    ],
    description: "Heractiveer bezoekers die niet converteerden"
  },

  // ========== STANDARD SHOPPING CAMPAGNES (5) ==========
  {
    id: 6,
    name: "Shopping - Bestsellers",
    type: "Standard Shopping",
    status: "active",
    dailyBudget: 20.00,
    bidStrategy: "Target ROAS",
    targetRoas: 450,
    products: ["leeuw", "schaap", "beer"],
    priority: "high",
    seoKeywords: [
      "populaire slaapknuffel", "bestseller baby knuffel",
      "meest verkochte nachtlamp"
    ],
    description: "Focus op top 3 best verkopende producten"
  },
  {
    id: 7,
    name: "Shopping - Nieuwe Producten",
    type: "Standard Shopping",
    status: "active",
    dailyBudget: 10.00,
    bidStrategy: "Maximize Clicks",
    products: ["unicorn", "dino", "panda"],
    priority: "medium",
    seoKeywords: [
      "nieuwe slaapknuffel", "unicorn nachtlamp", "dinosaurus knuffel",
      "panda slaapknuffel"
    ],
    description: "Introduceer nieuwe producten aan de markt"
  },
  {
    id: 8,
    name: "Shopping - Budget Vriendelijk",
    type: "Standard Shopping",
    status: "active",
    dailyBudget: 12.00,
    bidStrategy: "Target ROAS",
    targetRoas: 350,
    products: ["mini-leeuw", "mini-schaap"],
    priceFilter: "< 40 EUR",
    seoKeywords: [
      "goedkope slaapknuffel", "budget nachtlamp baby",
      "betaalbare knuffel licht"
    ],
    description: "Prijs-gevoelige kopers targeten"
  },
  {
    id: 9,
    name: "Shopping - België Focus",
    type: "Standard Shopping",
    status: "active",
    dailyBudget: 15.00,
    bidStrategy: "Target ROAS",
    targetRoas: 380,
    products: "all",
    targeting: {
      locations: ["België"],
      languages: ["nl", "fr"]
    },
    seoKeywords: [
      "slaapknuffel belgie", "knuffel nachtlampje belgie",
      "baby nachtlamp levering belgie"
    ],
    description: "Specifieke campagne voor Belgische markt"
  },
  {
    id: 10,
    name: "Shopping - Bundels & Sets",
    type: "Standard Shopping",
    status: "active",
    dailyBudget: 18.00,
    bidStrategy: "Target ROAS",
    targetRoas: 420,
    products: ["tweeling-set", "familie-bundel", "2e-50-korting"],
    seoKeywords: [
      "slaapknuffel set", "knuffel bundel", "2 knuffels korting",
      "tweeling cadeau", "voordeelset baby"
    ],
    description: "Promote bundels en multi-buy aanbiedingen"
  },

  // ========== DEMAND GEN CAMPAGNES (5) ==========
  {
    id: 11,
    name: "Demand Gen - Slaapproblemen",
    type: "Demand Gen",
    status: "active",
    dailyBudget: 15.00,
    bidStrategy: "Target CPA",
    targetCpa: 12.00,
    targeting: {
      interests: ["parenting", "baby products", "sleep solutions"],
      inMarket: ["baby sleep aids", "children's room decor"]
    },
    seoKeywords: [
      "kind slaapt niet door", "baby huilt 's nachts",
      "slaapproblemen peuter", "kind bang in donker"
    ],
    creatives: {
      headlines: [
        "Eindelijk doorslapen?",
        "86% van de kinderen slaapt beter",
        "De oplossing voor slaapproblemen"
      ],
      images: ["lifestyle-sleeping-child", "happy-family-morning"]
    },
    description: "Target ouders met slaapproblemen"
  },
  {
    id: 12,
    name: "Demand Gen - Emotioneel Verhaal",
    type: "Demand Gen",
    status: "active",
    dailyBudget: 12.00,
    bidStrategy: "Target CPA",
    targetCpa: 15.00,
    targeting: {
      interests: ["mindful parenting", "child development"],
      customAudiences: ["engaged parents"]
    },
    seoKeywords: [
      "geborgenheid kind", "veilig gevoel baby",
      "troostknuffel", "knuffel tegen angst"
    ],
    creatives: {
      headlines: [
        "Meer dan een knuffel",
        "De beste vriend in het donker",
        "Geef je kind geborgenheid"
      ],
      videos: ["emotional-story-video"]
    },
    description: "Emotionele connectie met ouders maken"
  },
  {
    id: 13,
    name: "Demand Gen - YouTube Discovery",
    type: "Demand Gen",
    status: "active",
    dailyBudget: 20.00,
    bidStrategy: "Maximize Conversions",
    targeting: {
      placements: ["youtube-discovery", "youtube-in-feed"],
      channels: ["parenting-channels", "baby-reviews"]
    },
    seoKeywords: [
      "baby producten review", "slaapknuffel unboxing",
      "nachtlamp kind test"
    ],
    creatives: {
      videos: ["product-demo-60s", "customer-testimonials"]
    },
    description: "Video-first campagne op YouTube"
  },
  {
    id: 14,
    name: "Demand Gen - Gmail Ads",
    type: "Demand Gen",
    status: "active",
    dailyBudget: 8.00,
    bidStrategy: "Target CPA",
    targetCpa: 10.00,
    targeting: {
      placements: ["gmail"],
      audiences: ["new-parents", "expecting-parents"]
    },
    seoKeywords: [
      "baby must haves", "kraamlijst items",
      "babyuitzet compleet"
    ],
    creatives: {
      subject: "15% korting op je eerste Droomvriendje!",
      preheader: "Gratis verzending & 14 dagen retour"
    },
    description: "Gmail advertenties voor inbox bereik"
  },
  {
    id: 15,
    name: "Demand Gen - Discover Feed",
    type: "Demand Gen",
    status: "active",
    dailyBudget: 10.00,
    bidStrategy: "Maximize Clicks",
    targeting: {
      placements: ["google-discover"],
      interests: ["lifestyle", "parenting", "home-decor"]
    },
    seoKeywords: [
      "kinderkamer inrichten", "babykamer tips",
      "slaapkamer kind ideeën"
    ],
    creatives: {
      headlines: [
        "De #1 Tip voor Betere Nachten",
        "Zo Slaapt Je Kind Eindelijk Door"
      ],
      images: ["beautiful-nursery", "peaceful-sleeping-baby"]
    },
    description: "Native ads in Google Discover feed"
  },

  // ========== SEARCH CAMPAGNES (SEA) (5) ==========
  {
    id: 16,
    name: "Search - Brand Terms",
    type: "Search",
    status: "active",
    dailyBudget: 5.00,
    bidStrategy: "Target Impression Share",
    targetImpressionShare: 95,
    keywords: {
      exact: ["droomvriendjes", "droomvriendje", "droomvriendjes.com"],
      phrase: ["droomvriendjes knuffel", "droomvriendjes kopen"]
    },
    seoKeywords: [
      "droomvriendjes", "droomvriendjes.com", "droomvriendjes review"
    ],
    adCopy: {
      headlines: [
        "Droomvriendjes® Officiële Shop",
        "Gratis Verzending | 14 Dagen Retour",
        "4.9★ Trustpilot Rating"
      ],
      descriptions: [
        "Slaapknuffels met Nachtlampje & White Noise. Helpt 86% van de Kinderen Beter Slapen.",
        "Bestel Nu & Morgen in Huis. 10.000+ Tevreden Klanten. Lente Sale: 2e 50% Korting!"
      ]
    },
    description: "Bescherm merknaam en vang branded traffic"
  },
  {
    id: 17,
    name: "Search - High Intent Keywords",
    type: "Search",
    status: "active",
    dailyBudget: 25.00,
    bidStrategy: "Target ROAS",
    targetRoas: 400,
    keywords: {
      exact: [
        "slaapknuffel kopen",
        "knuffel met nachtlampje kopen",
        "baby nachtlamp bestellen"
      ],
      phrase: [
        "slaapknuffel online",
        "knuffel projector kopen"
      ]
    },
    seoKeywords: [
      "slaapknuffel kopen", "knuffel nachtlampje bestellen",
      "baby projector knuffel"
    ],
    adCopy: {
      headlines: [
        "Slaapknuffel Met Nachtlampje",
        "Nu €49,95 | Gratis Verzending",
        "Morgen in Huis ✓"
      ],
      descriptions: [
        "Slaapknuffels met Sterrenprojector & White Noise. 86% Slaapt Beter. Bestel Nu!",
        "Gratis Verzending. 14 Dagen Retour. Lente Sale: 2e Knuffel 50% Korting!"
      ]
    },
    description: "Target kopers met hoge koopintentie"
  },
  {
    id: 18,
    name: "Search - Problem-Aware Keywords",
    type: "Search",
    status: "active",
    dailyBudget: 20.00,
    bidStrategy: "Maximize Conversions",
    keywords: {
      broad: [
        "kind slaapt niet door",
        "baby huilt in slaap",
        "peuter bang voor donker"
      ],
      phrase: [
        "kind niet slapen oplossing",
        "baby hulp slapen"
      ]
    },
    seoKeywords: [
      "kind slaapt niet", "baby slaapt slecht",
      "peuter slaapproblemen", "kind nachtangst"
    ],
    adCopy: {
      headlines: [
        "Kind Slaapt Niet Door?",
        "De Oplossing: Droomvriendjes",
        "86% Ziet Verbetering"
      ],
      descriptions: [
        "Slaapknuffels met Rustgevend Licht & Geluid. Helpt Kinderen Sneller In Slaap Vallen.",
        "Wetenschappelijk Bewezen Effectief. 10.000+ Tevreden Ouders. Probeer Risico-Vrij!"
      ]
    },
    description: "Bereik ouders die een oplossing zoeken"
  },
  {
    id: 19,
    name: "Search - Competitor Keywords",
    type: "Search",
    status: "active",
    dailyBudget: 15.00,
    bidStrategy: "Target CPA",
    targetCpa: 15.00,
    keywords: {
      broad: [
        "cloud b knuffel",
        "skip hop nachtlamp",
        "vtech slaapknuffel"
      ]
    },
    seoKeywords: [
      "alternatief cloud b", "vergelijk slaapknuffels",
      "beste slaapknuffel test"
    ],
    adCopy: {
      headlines: [
        "Premium Alternatief | €49,95",
        "Vergelijk & Bespaar",
        "Nederlandse Klantenservice"
      ],
      descriptions: [
        "Zoek Je Een Slaapknuffel? Vergelijk Droomvriendjes. Betere Reviews, Betere Prijs.",
        "Gratis Verzending. 14 Dagen Retour. 4.9★ op Trustpilot. Bestel Nu!"
      ]
    },
    description: "Vang concurrentie-zoekend verkeer"
  },
  {
    id: 20,
    name: "Search - Gift Keywords",
    type: "Search",
    status: "active",
    dailyBudget: 18.00,
    bidStrategy: "Target ROAS",
    targetRoas: 350,
    keywords: {
      exact: [
        "kraamcadeau origineel",
        "cadeau babyshower",
        "geboorte cadeau"
      ],
      phrase: [
        "cadeau baby",
        "kraamcadeau kopen"
      ]
    },
    seoKeywords: [
      "kraamcadeau", "cadeau baby", "babyshower geschenk",
      "origineel geboorte cadeau"
    ],
    adCopy: {
      headlines: [
        "Het Perfecte Kraamcadeau",
        "Origineel & Praktisch",
        "Cadeauverpakking Gratis"
      ],
      descriptions: [
        "Geef Een Droomvriendje! Slaapknuffel Met Nachtlampje. Uniek Cadeau Dat Echt Helpt.",
        "Gratis Cadeauverpakking. Morgen Bezorgd. 10.000+ Tevreden Ouders. Bestel Nu!"
      ]
    },
    description: "Target cadeau-zoekers"
  }
];

// SEO Keywords Summary - Alle unieke keywords voor organische optimalisatie
export const allSeoKeywords = [
  // Primary Keywords (Hoge prioriteit)
  "slaapknuffel",
  "knuffel nachtlampje",
  "baby nachtlamp",
  "slaapknuffel kopen",
  "kraamcadeau",
  
  // Secondary Keywords
  "sterrenprojectie knuffel",
  "white noise knuffel",
  "baby slaapknuffel",
  "peuter nachtlampje",
  "kind slaapt niet door",
  "baby slaapt slecht",
  
  // Long-tail Keywords
  "knuffel met sterrenprojector",
  "slaapknuffel met licht en geluid",
  "baby knuffel nachtlamp kopen",
  "beste slaapknuffel voor baby",
  "origineel kraamcadeau",
  "cadeau babyshower origineel",
  
  // Location Keywords
  "slaapknuffel nederland",
  "knuffel nachtlampje belgie",
  "baby nachtlamp gratis verzending",
  
  // Problem Keywords
  "kind bang in donker oplossing",
  "peuter slaapproblemen",
  "baby huilt nachts",
  "kind slaapt niet door oplossing"
];

// Campaign Performance Metrics (Mock data voor dashboard)
export const campaignMetrics = {
  totalBudget: 323.00,
  totalSpend: 287.45,
  impressions: 156420,
  clicks: 4892,
  conversions: 127,
  revenue: 5842.35,
  roas: 2032,
  avgCpc: 0.059,
  ctr: 3.13,
  conversionRate: 2.60
};

// Helper functions
export const getActiveCampaigns = () => {
  return shoppingCampaigns.filter(c => c.status === 'active');
};

export const getTotalDailyBudget = () => {
  return shoppingCampaigns.reduce((sum, c) => sum + c.dailyBudget, 0);
};

export const exportCampaignsToCSV = () => {
  const headers = ['ID', 'Name', 'Type', 'Status', 'Daily Budget', 'Target ROAS', 'Description'];
  const rows = shoppingCampaigns.map(c => [
    c.id,
    c.name,
    c.type,
    c.status,
    c.dailyBudget,
    c.targetRoas || '',
    c.description
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  return csv;
};

export default shoppingCampaigns;
