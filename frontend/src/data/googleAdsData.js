/**
 * Google Ads Campagne Data - Droomvriendjes
 * Gestructureerde data voor Google Ads campagnes
 * 
 * Gebruik:
 * - Import voor Google Ads API integratie
 * - Export naar CSV/Excel voor handmatige upload
 * - Referentie voor campagne creatie
 */

// ===========================================
// CAMPAGNE STRUCTUUR
// ===========================================

export const campaignStructure = {
  account: {
    name: "Droomvriendjes",
    currency: "EUR",
    timezone: "Europe/Amsterdam",
    industry: "Retail - Baby & Kids Products"
  },
  
  campaigns: [
    {
      id: "search_brand",
      name: "Search - Brand",
      type: "SEARCH",
      budget_daily: 15,
      bidding_strategy: "TARGET_CPA",
      target_cpa: 8.00,
      priority: "HIGH"
    },
    {
      id: "search_generic",
      name: "Search - Generic Keywords",
      type: "SEARCH",
      budget_daily: 30,
      bidding_strategy: "MAXIMIZE_CONVERSIONS",
      priority: "HIGH"
    },
    {
      id: "search_product",
      name: "Search - Product Specifiek",
      type: "SEARCH",
      budget_daily: 25,
      bidding_strategy: "TARGET_ROAS",
      target_roas: 400,
      priority: "MEDIUM"
    },
    {
      id: "search_verzwaring",
      name: "Search - Verzwaringsknuffels",
      type: "SEARCH",
      budget_daily: 35,
      bidding_strategy: "MAXIMIZE_CONVERSIONS",
      priority: "HIGH"
    },
    {
      id: "search_lotgenootje",
      name: "Search - Lotgenootje Producten",
      type: "SEARCH",
      budget_daily: 30,
      bidding_strategy: "TARGET_CPA",
      target_cpa: 10.00,
      priority: "HIGH"
    },
    {
      id: "search_stress_angst",
      name: "Search - Stress & Angst",
      type: "SEARCH",
      budget_daily: 25,
      bidding_strategy: "MAXIMIZE_CONVERSIONS",
      priority: "HIGH"
    },
    {
      id: "search_cadeau",
      name: "Search - Cadeau Keywords",
      type: "SEARCH",
      budget_daily: 20,
      bidding_strategy: "TARGET_CPA",
      target_cpa: 12.00,
      priority: "MEDIUM"
    },
    {
      id: "shopping",
      name: "Shopping - Alle Producten",
      type: "SHOPPING",
      budget_daily: 40,
      bidding_strategy: "MAXIMIZE_CONVERSION_VALUE",
      priority: "HIGH"
    },
    {
      id: "shopping_verzwaring",
      name: "Shopping - Verzwaringsknuffels",
      type: "SHOPPING",
      budget_daily: 30,
      bidding_strategy: "TARGET_ROAS",
      target_roas: 400,
      priority: "HIGH"
    },
    {
      id: "pmax",
      name: "Performance Max - Droomvriendjes",
      type: "PERFORMANCE_MAX",
      budget_daily: 50,
      bidding_strategy: "MAXIMIZE_CONVERSIONS",
      priority: "HIGH"
    },
    {
      id: "display_remarketing",
      name: "Display - Remarketing",
      type: "DISPLAY",
      budget_daily: 15,
      bidding_strategy: "TARGET_CPA",
      target_cpa: 5.00,
      priority: "MEDIUM"
    }
  ]
};

// ===========================================
// KEYWORD LIJSTEN
// ===========================================

export const keywordLists = {
  // Brand Keywords
  brand: {
    campaign: "search_brand",
    match_types: ["EXACT", "PHRASE"],
    keywords: [
      { keyword: "droomvriendjes", bid: 1.50, priority: "HIGH" },
      { keyword: "droomvriendjes knuffel", bid: 1.20, priority: "HIGH" },
      { keyword: "droomvriendjes slaapknuffel", bid: 1.20, priority: "HIGH" },
      { keyword: "droomvriendjes nachtlampje", bid: 1.00, priority: "MEDIUM" },
      { keyword: "droomvriendjes.com", bid: 1.50, priority: "HIGH" },
      { keyword: "droom vriendjes", bid: 1.00, priority: "MEDIUM" },
      { keyword: "lotgenootje", bid: 1.50, priority: "HIGH" },
      { keyword: "lotgenootje knuffel", bid: 1.30, priority: "HIGH" },
      { keyword: "marien jansen knuffel", bid: 0.80, priority: "MEDIUM" }
    ]
  },

  // ============== VERZWARINGSKNUFFELS ==============
  verzwaringsknuffel_main: {
    campaign: "search_verzwaring",
    match_types: ["EXACT", "PHRASE"],
    keywords: [
      { keyword: "verzwaringsknuffel", bid: 1.50, priority: "HIGH" },
      { keyword: "verzwaarde knuffel", bid: 1.40, priority: "HIGH" },
      { keyword: "verzwaringsknuffel 2kg", bid: 1.60, priority: "HIGH" },
      { keyword: "2 kilo knuffel", bid: 1.30, priority: "HIGH" },
      { keyword: "zware knuffel", bid: 1.20, priority: "HIGH" },
      { keyword: "verzwaarde vulling", bid: 1.10, priority: "MEDIUM" },
      { keyword: "gelijkmatige verzwaring", bid: 1.00, priority: "MEDIUM" },
      { keyword: "overal verzwaard", bid: 0.90, priority: "MEDIUM" },
      { keyword: "diepe druk knuffel", bid: 1.40, priority: "HIGH" },
      { keyword: "druktherapie knuffel", bid: 1.30, priority: "HIGH" }
    ]
  },

  diepe_druk: {
    campaign: "search_verzwaring",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "diepe druk stimulatie", bid: 1.30, priority: "HIGH" },
      { keyword: "diepe druk", bid: 1.20, priority: "HIGH" },
      { keyword: "zachte druk", bid: 1.00, priority: "MEDIUM" },
      { keyword: "verzwaringsdeken alternatief", bid: 1.40, priority: "HIGH" },
      { keyword: "verzwaringsdeken", bid: 1.10, priority: "MEDIUM" },
      { keyword: "verzwaringsproducten", bid: 1.00, priority: "MEDIUM" },
      { keyword: "verzwaarde producten", bid: 0.90, priority: "MEDIUM" }
    ]
  },

  // ============== STRESS & ANGST ==============
  stress_keywords: {
    campaign: "search_stress_angst",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "stressvermindering", bid: 1.20, priority: "HIGH" },
      { keyword: "stress verminderen", bid: 1.15, priority: "HIGH" },
      { keyword: "minder spanning", bid: 1.00, priority: "MEDIUM" },
      { keyword: "ontspannen lichaam", bid: 0.90, priority: "MEDIUM" },
      { keyword: "ontspanning", bid: 0.85, priority: "MEDIUM" },
      { keyword: "cadeau voor stress", bid: 1.10, priority: "HIGH" }
    ]
  },

  angst_keywords: {
    campaign: "search_stress_angst",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "angstvermindering", bid: 1.25, priority: "HIGH" },
      { keyword: "angst verminderen", bid: 1.20, priority: "HIGH" },
      { keyword: "troost knuffel", bid: 1.15, priority: "HIGH" },
      { keyword: "geborgenheid", bid: 1.00, priority: "MEDIUM" },
      { keyword: "troost bij verdriet", bid: 1.05, priority: "HIGH" },
      { keyword: "comfort item", bid: 0.90, priority: "MEDIUM" }
    ]
  },

  // ============== PRIKKELVERWERKING ==============
  prikkelverwerking: {
    campaign: "search_stress_angst",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "prikkelverwerking", bid: 1.30, priority: "HIGH" },
      { keyword: "overprikkeling", bid: 1.25, priority: "HIGH" },
      { keyword: "ontprikkelen", bid: 1.20, priority: "HIGH" },
      { keyword: "rust bij prikkels", bid: 1.10, priority: "HIGH" },
      { keyword: "sensorische ondersteuning", bid: 1.15, priority: "HIGH" },
      { keyword: "hoogsensitiviteit", bid: 1.20, priority: "HIGH" }
    ]
  },

  // ============== SLAAP ==============
  slaap_keywords: {
    campaign: "search_generic",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "beter slapen", bid: 1.10, priority: "HIGH" },
      { keyword: "slaaphulp", bid: 1.15, priority: "HIGH" },
      { keyword: "inslapen", bid: 1.00, priority: "HIGH" },
      { keyword: "door slapen", bid: 1.05, priority: "HIGH" },
      { keyword: "slaapritueel", bid: 1.00, priority: "MEDIUM" },
      { keyword: "slaap en rust", bid: 0.95, priority: "MEDIUM" },
      { keyword: "cadeau voor beter slapen", bid: 1.20, priority: "HIGH" },
      { keyword: "slaapknuffel", bid: 1.30, priority: "HIGH" }
    ]
  },

  // ============== KNUFFEL TYPES ==============
  knuffel_types: {
    campaign: "search_generic",
    match_types: ["PHRASE", "EXACT"],
    keywords: [
      { keyword: "knuffel die terugknuffelt", bid: 1.40, priority: "HIGH" },
      { keyword: "rustgevende knuffel", bid: 1.20, priority: "HIGH" },
      { keyword: "kalmerende knuffel", bid: 1.25, priority: "HIGH" },
      { keyword: "knuffel voor volwassenen", bid: 1.30, priority: "HIGH" },
      { keyword: "knuffel voor kinderen", bid: 1.10, priority: "HIGH" },
      { keyword: "maatje knuffel", bid: 1.00, priority: "MEDIUM" },
      { keyword: "metgezel knuffel", bid: 0.95, priority: "MEDIUM" }
    ]
  },

  // ============== LOTGENOOTJE PRODUCTEN ==============
  lotgenootje_dieren: {
    campaign: "search_lotgenootje",
    match_types: ["PHRASE", "EXACT"],
    keywords: [
      { keyword: "lotgenootje konijn", bid: 1.20, priority: "HIGH" },
      { keyword: "lotgenootje koala", bid: 1.20, priority: "HIGH" },
      { keyword: "lotgenootje hond", bid: 1.20, priority: "HIGH" },
      { keyword: "lotgenootje beer", bid: 1.20, priority: "HIGH" },
      { keyword: "lotgenootje kat", bid: 1.20, priority: "HIGH" },
      { keyword: "lotgenootje schaap", bid: 1.20, priority: "HIGH" }
    ]
  },

  lotgenootje_accessoires: {
    campaign: "search_lotgenootje",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "mini knuffels", bid: 0.90, priority: "MEDIUM" },
      { keyword: "knuffel kleding", bid: 0.85, priority: "MEDIUM" },
      { keyword: "knuffel hoodie", bid: 0.80, priority: "MEDIUM" },
      { keyword: "knuffel trui", bid: 0.80, priority: "MEDIUM" }
    ]
  },

  // ============== KWALITEIT & VEILIGHEID ==============
  kwaliteit: {
    campaign: "search_product",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "super zacht", bid: 0.70, priority: "MEDIUM" },
      { keyword: "zachte pluche", bid: 0.75, priority: "MEDIUM" },
      { keyword: "hoogwaardige kwaliteit", bid: 0.80, priority: "MEDIUM" },
      { keyword: "CE-keurmerk", bid: 0.65, priority: "LOW" },
      { keyword: "veilig speelgoed", bid: 0.70, priority: "MEDIUM" },
      { keyword: "hand wasbaar", bid: 0.60, priority: "LOW" },
      { keyword: "duurzaam produceren", bid: 0.55, priority: "LOW" },
      { keyword: "vanaf 3 jaar", bid: 0.65, priority: "MEDIUM" }
    ]
  },

  // ============== CADEAU KEYWORDS ==============
  cadeau_algemeen: {
    campaign: "search_cadeau",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "origineel cadeau", bid: 1.00, priority: "MEDIUM" },
      { keyword: "cadeau voor haar", bid: 0.90, priority: "MEDIUM" },
      { keyword: "cadeau voor hem", bid: 0.85, priority: "MEDIUM" },
      { keyword: "cadeau voor kind", bid: 0.95, priority: "MEDIUM" }
    ]
  },

  cadeau_gelegenheden: {
    campaign: "search_cadeau",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "verjaardagscadeau", bid: 0.80, priority: "MEDIUM" },
      { keyword: "kerstcadeau", bid: 0.85, priority: "MEDIUM", season: "december" },
      { keyword: "moederdag cadeau", bid: 0.90, priority: "MEDIUM", season: "mei" },
      { keyword: "valentijn cadeau", bid: 0.85, priority: "MEDIUM", season: "februari" },
      { keyword: "cadeaubon", bid: 0.70, priority: "MEDIUM" }
    ]
  },

  // ============== AANBIEDINGEN ==============
  aanbiedingen: {
    campaign: "search_generic",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "voordeelbundels", bid: 0.75, priority: "MEDIUM" },
      { keyword: "bundel aanbieding", bid: 0.70, priority: "MEDIUM" },
      { keyword: "zomer sale", bid: 0.65, priority: "LOW", season: "zomer" },
      { keyword: "2e knuffel 50% korting", bid: 0.80, priority: "HIGH" }
    ]
  },

  // ============== VERZENDING & SERVICE ==============
  service: {
    campaign: "search_generic",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "snelle levering", bid: 0.60, priority: "LOW" },
      { keyword: "voor 23:59 besteld", bid: 0.55, priority: "LOW" },
      { keyword: "gratis verzending", bid: 0.65, priority: "MEDIUM" },
      { keyword: "gratis retourneren", bid: 0.60, priority: "LOW" },
      { keyword: "30 dagen retourneren", bid: 0.55, priority: "LOW" },
      { keyword: "30 dagen gratis uitproberen", bid: 0.70, priority: "MEDIUM" }
    ]
  },

  // ============== DOELGROEPEN ==============
  doelgroep_dementie: {
    campaign: "search_stress_angst",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "dementie", bid: 1.00, priority: "MEDIUM" },
      { keyword: "knuffel dementie", bid: 1.20, priority: "HIGH" },
      { keyword: "zorgsector ervaring", bid: 0.80, priority: "LOW" }
    ]
  },

  // ============== REVIEWS & VERTROUWEN ==============
  reviews: {
    campaign: "search_brand",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "trustpilot reviews", bid: 0.50, priority: "LOW" },
      { keyword: "klantbeoordelingen", bid: 0.55, priority: "LOW" }
    ]
  },

  // ============== FOUNDER & VERHAAL ==============
  verhaal: {
    campaign: "search_brand",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "waar liefde zwaar weegt", bid: 0.70, priority: "MEDIUM" },
      { keyword: "maatschappelijk werker", bid: 0.50, priority: "LOW" },
      { keyword: "uniek ontwerp", bid: 0.55, priority: "LOW" },
      { keyword: "feedback-gedreven", bid: 0.45, priority: "LOW" },
      { keyword: "niche verzwaringsproducten", bid: 0.80, priority: "MEDIUM" }
    ]
  },

  // Generic - Slaapproblemen (existing)
  slaapproblemen: {
    campaign: "search_generic",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "baby slaapt niet", bid: 0.80, priority: "HIGH" },
      { keyword: "kind slaapt slecht", bid: 0.75, priority: "HIGH" },
      { keyword: "peuter wil niet slapen", bid: 0.70, priority: "HIGH" },
      { keyword: "baby huilt bij slapen", bid: 0.65, priority: "MEDIUM" },
      { keyword: "kind bang in donker", bid: 0.60, priority: "MEDIUM" },
      { keyword: "slaapproblemen baby", bid: 0.85, priority: "HIGH" },
      { keyword: "slaapproblemen peuter", bid: 0.80, priority: "HIGH" },
      { keyword: "baby doorslaapproblemen", bid: 0.75, priority: "HIGH" },
      { keyword: "kind wakker worden nacht", bid: 0.65, priority: "MEDIUM" },
      { keyword: "baby onrustig slapen", bid: 0.70, priority: "MEDIUM" },
      { keyword: "hulp bij slaapproblemen kind", bid: 0.90, priority: "HIGH" },
      { keyword: "tips baby laten slapen", bid: 0.60, priority: "MEDIUM" }
    ]
  },

  // Generic - Nachtlampjes (existing)
  nachtlampjes: {
    campaign: "search_generic",
    match_types: ["PHRASE", "EXACT"],
    keywords: [
      { keyword: "nachtlampje baby", bid: 0.95, priority: "HIGH" },
      { keyword: "nachtlampje kinderkamer", bid: 0.85, priority: "HIGH" },
      { keyword: "nachtlampje kind", bid: 0.90, priority: "HIGH" },
      { keyword: "nachtlamp baby", bid: 0.85, priority: "HIGH" },
      { keyword: "kindernachtlampje", bid: 0.80, priority: "MEDIUM" },
      { keyword: "nachtlampje peuter", bid: 0.75, priority: "MEDIUM" },
      { keyword: "sterrenprojector baby", bid: 1.00, priority: "HIGH" },
      { keyword: "sterrenhemel projector kind", bid: 0.95, priority: "HIGH" },
      { keyword: "projector nachtlampje", bid: 0.90, priority: "HIGH" },
      { keyword: "nachtlampje met muziek", bid: 0.85, priority: "MEDIUM" },
      { keyword: "nachtlampje met geluid", bid: 0.80, priority: "MEDIUM" }
    ]
  },

  // Generic - Knuffels (existing)
  knuffels: {
    campaign: "search_generic",
    match_types: ["PHRASE", "BROAD_MATCH_MODIFIER"],
    keywords: [
      { keyword: "slaapknuffel baby", bid: 1.10, priority: "HIGH" },
      { keyword: "knuffel met nachtlampje", bid: 1.05, priority: "HIGH" },
      { keyword: "knuffel met muziek", bid: 0.95, priority: "HIGH" },
      { keyword: "knuffel met geluid", bid: 0.90, priority: "HIGH" },
      { keyword: "knuffel met sterrenprojector", bid: 1.00, priority: "HIGH" },
      { keyword: "slaapknuffel peuter", bid: 0.95, priority: "HIGH" },
      { keyword: "kalmerende knuffel baby", bid: 0.90, priority: "HIGH" },
      { keyword: "knuffel white noise", bid: 1.00, priority: "HIGH" },
      { keyword: "knuffel hartslag geluid", bid: 0.85, priority: "MEDIUM" },
      { keyword: "troostknuffel baby", bid: 0.80, priority: "MEDIUM" }
    ]
  },

  // Product Specifiek - Dieren (existing)
  product_dieren: {
    campaign: "search_product",
    match_types: ["PHRASE", "EXACT"],
    keywords: [
      { keyword: "teddy beer nachtlampje", bid: 0.75, priority: "MEDIUM" },
      { keyword: "schaap knuffel baby", bid: 0.70, priority: "MEDIUM" },
      { keyword: "panda knuffel nachtlampje", bid: 0.70, priority: "MEDIUM" },
      { keyword: "leeuw knuffel baby", bid: 0.65, priority: "MEDIUM" },
      { keyword: "pinguin nachtlampje kind", bid: 0.65, priority: "MEDIUM" },
      { keyword: "dinosaurus knuffel jongen", bid: 0.70, priority: "MEDIUM" },
      { keyword: "eenhoorn knuffel meisje", bid: 0.75, priority: "MEDIUM" },
      { keyword: "unicorn nachtlampje", bid: 0.80, priority: "MEDIUM" },
      { keyword: "beer sterrenprojector", bid: 0.70, priority: "MEDIUM" }
    ]
  },

  // Doelgroep - Ouders Baby (existing)
  doelgroep_baby: {
    campaign: "search_generic",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "cadeau baby shower", bid: 0.60, priority: "LOW" },
      { keyword: "kraamcadeau origineel", bid: 0.65, priority: "LOW" },
      { keyword: "cadeau pasgeboren baby", bid: 0.60, priority: "LOW" },
      { keyword: "babyuitzet nachtlampje", bid: 0.55, priority: "LOW" },
      { keyword: "newborn slaaptips", bid: 0.50, priority: "LOW" },
      { keyword: "baby 0-3 maanden slapen", bid: 0.70, priority: "MEDIUM" }
    ]
  },

  // Doelgroep - Ouders Peuters (existing)
  doelgroep_peuter: {
    campaign: "search_generic",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "peuter eigen bed", bid: 0.65, priority: "MEDIUM" },
      { keyword: "kind van ledikant naar bed", bid: 0.60, priority: "MEDIUM" },
      { keyword: "nachtmerries peuter", bid: 0.70, priority: "MEDIUM" },
      { keyword: "peuter bang voor donker", bid: 0.75, priority: "HIGH" },
      { keyword: "bedtijdritueel peuter", bid: 0.55, priority: "LOW" }
    ]
  },

  // Doelgroep - Speciale Behoeften (existing)
  doelgroep_special: {
    campaign: "search_generic",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "knuffel autisme kind", bid: 0.80, priority: "HIGH" },
      { keyword: "rustgevend speelgoed adhd", bid: 0.75, priority: "HIGH" },
      { keyword: "sensorisch speelgoed", bid: 0.70, priority: "MEDIUM" },
      { keyword: "kalmeren hoogsensitief kind", bid: 0.75, priority: "HIGH" },
      { keyword: "hsp kind slapen", bid: 0.70, priority: "MEDIUM" },
      { keyword: "prikkelarm speelgoed", bid: 0.65, priority: "MEDIUM" }
    ]
  },

  // Seizoensgebonden (existing)
  seizoen: {
    campaign: "search_generic",
    match_types: ["PHRASE"],
    keywords: [
      { keyword: "sinterklaas cadeau kind", bid: 0.50, priority: "LOW", season: "november" },
      { keyword: "kerst cadeau baby", bid: 0.55, priority: "LOW", season: "december" },
      { keyword: "verjaardag cadeau 1 jaar", bid: 0.45, priority: "LOW" },
      { keyword: "verjaardag cadeau 2 jaar", bid: 0.45, priority: "LOW" }
    ]
  },

  // Concurrentie Keywords (existing)
  concurrent: {
    campaign: "search_generic",
    match_types: ["EXACT"],
    keywords: [
      { keyword: "whisbear", bid: 0.60, priority: "LOW" },
      { keyword: "cloud b", bid: 0.55, priority: "LOW" },
      { keyword: "skip hop nachtlampje", bid: 0.50, priority: "LOW" },
      { keyword: "zazu nachtlampje", bid: 0.55, priority: "LOW" },
      { keyword: "myHummy", bid: 0.60, priority: "LOW" }
    ]
  }
};

// ===========================================
// NEGATIEVE KEYWORDS
// ===========================================

export const negativeKeywords = {
  account_level: [
    "gratis",
    "tweedehands", 
    "2e hands",
    "marktplaats",
    "diy",
    "zelf maken",
    "patroon",
    "haakpatroon",
    "breipatroon",
    "volwassenen",
    "erotisch",
    "kopen zonder",
    "goedkoop",
    "cheap",
    "free",
    "download",
    "pdf",
    "review",
    "ervaringen",
    "test",
    "vergelijken"
  ],
  
  campaign_specific: {
    search_brand: [],
    search_generic: [
      "zelf maken",
      "patroon",
      "handleiding"
    ],
    search_product: [
      "gebruikt",
      "kapot"
    ]
  }
};

// ===========================================
// ADVERTENTIETEKSTEN
// ===========================================

export const adCopy = {
  // Responsive Search Ads - Brand
  brand_rsa: {
    campaign: "search_brand",
    headlines: [
      { text: "Droomvriendjes® Slaapknuffels", pinned: 1 },
      { text: "Officiële Webshop", pinned: 2 },
      { text: "Gratis Verzending in NL" },
      { text: "14 Dagen Bedenktijd" },
      { text: "Voor een Betere Nachtrust" },
      { text: "Met Sterrenprojector" },
      { text: "Knuffels met Nachtlampje" },
      { text: "White Noise Functie" },
      { text: "Vanaf €49,95" },
      { text: "★★★★★ 4.7/5 Reviews" },
      { text: "10.000+ Tevreden Klanten" },
      { text: "Veilig Vanaf 0 Maanden" },
      { text: "Voor 23:00 = Morgen in Huis" },
      { text: "Ideaal Kraamcadeau" },
      { text: "2e Knuffel 50% Korting" }
    ],
    descriptions: [
      { text: "Ontdek onze slaapknuffels met sterrenprojector en rustgevende geluiden. Gratis verzending & 14 dagen retour.", pinned: 1 },
      { text: "Help je kind beter slapen met een Droomvriendje. Kalmerende lichtjes en white noise voor een rustige nacht." },
      { text: "Bestel vandaag en ontvang morgen. Veilige betaling met iDEAL. Meer dan 10.000 tevreden ouders gingen je voor!" },
      { text: "Slaapknuffels met projector en muziek. Perfect voor baby's en peuters. Nu 2e knuffel voor 50% korting!" }
    ]
  },

  // ============== VERZWARINGSKNUFFEL ADS ==============
  verzwaringsknuffel_rsa: {
    campaign: "search_verzwaring",
    ad_group: "verzwaringsknuffel",
    headlines: [
      { text: "Verzwaringsknuffel 2kg", pinned: 1 },
      { text: "Lotgenootje® Knuffels" },
      { text: "Diepe Druk Stimulatie" },
      { text: "Knuffel die Terugknuffelt" },
      { text: "Waar Liefde Zwaar Weegt" },
      { text: "Gelijkmatig Verzwaard" },
      { text: "Super Zacht Materiaal" },
      { text: "Bewezen Kalmerend Effect" },
      { text: "Gratis Verzending NL" },
      { text: "30 Dagen Uitproberen" },
      { text: "CE-Gecertificeerd Veilig" },
      { text: "Voor Kinderen & Volwassenen" },
      { text: "Stress & Angst Verminderen" },
      { text: "Handwasbaar" },
      { text: "★★★★★ Reviews" }
    ],
    descriptions: [
      { text: "Ontdek de Lotgenootje verzwaringsknuffel. 2kg gelijkmatig verdeeld gewicht voor diepe druk stimulatie en rust.", pinned: 1 },
      { text: "Verzwaringsknuffels die echt terugknuffelen. Vermindert stress, angst en overprikkeling. Gratis verzending!" },
      { text: "Alternatief voor verzwaringsdeken. Super zacht, CE-keurmerk, handwasbaar. 30 dagen gratis uitproberen." },
      { text: "Door zorgsector ontwikkeld. Perfect bij hoogsensitiviteit, ADHD, autisme of gewoon extra troost nodig." }
    ]
  },

  // Lotgenootje Product Ads
  lotgenootje_rsa: {
    campaign: "search_lotgenootje",
    ad_group: "lotgenootje_dieren",
    headlines: [
      { text: "Lotgenootje® Knuffels", pinned: 1 },
      { text: "Kies Jouw Maatje" },
      { text: "Konijn, Koala, Hond & Meer" },
      { text: "Verzwaarde Knuffels 2kg" },
      { text: "Uniek Ontwerp" },
      { text: "Super Zacht Pluche" },
      { text: "Rust en Geborgenheid" },
      { text: "Voor Alle Leeftijden" },
      { text: "Gratis Verzending" },
      { text: "30 Dagen Proberen" },
      { text: "★★★★★ Beoordeeld" },
      { text: "Inclusief Kleding" },
      { text: "Handwasbaar" },
      { text: "CE-Keurmerk" },
      { text: "Direct Leverbaar" }
    ],
    descriptions: [
      { text: "Ontmoet jouw Lotgenootje! Kies uit konijn, koala, hond, beer, kat of schaap. Elk 2kg verzwaard voor diepe rust.", pinned: 1 },
      { text: "Verzwaringsknuffels ontworpen met liefde. Perfect als maatje, trooster en slaaphulp. Gratis verzending!" },
      { text: "Super zachte knuffels met gelijkmatig verdeeld gewicht. Inclusief schattige outfits. 30 dagen uitproberen." },
      { text: "Door ervaringsdeskundigen ontwikkeld. Helpt bij stress, angst en prikkelverwerking. Bestel vandaag!" }
    ]
  },

  // Stress & Angst Ads
  stress_angst_rsa: {
    campaign: "search_stress_angst",
    ad_group: "stress_angst",
    headlines: [
      { text: "Stress Verminderen?", pinned: 1 },
      { text: "Angst Aanpakken" },
      { text: "Diepe Druk Therapie" },
      { text: "Verzwaringsknuffel Helpt" },
      { text: "Bewezen Kalmerend" },
      { text: "Troost & Geborgenheid" },
      { text: "Voor Kinderen & Volwassenen" },
      { text: "Lotgenootje® Knuffels" },
      { text: "Gratis Verzending" },
      { text: "30 Dagen Uitproberen" },
      { text: "★★★★★ Reviews" },
      { text: "Ontspan Je Lichaam" },
      { text: "Minder Spanning" },
      { text: "Super Zacht" },
      { text: "Direct Leverbaar" }
    ],
    descriptions: [
      { text: "Verzwaringsknuffels met diepe druk stimulatie helpen bij stress en angst. 2kg gewicht voor direct ontspanning.", pinned: 1 },
      { text: "Wetenschappelijk bewezen: diepe druk vermindert stress hormonen. Onze knuffels bieden troost wanneer je het nodig hebt." },
      { text: "Lotgenootje knuffels: je persoonlijke maatje in moeilijke momenten. Gratis verzending, 30 dagen proberen!" },
      { text: "Alternatief voor verzwaringsdeken maar dan knuffelbaar. Super zacht, veilig, en altijd bij de hand." }
    ]
  },

  // Prikkelverwerking Ads
  prikkelverwerking_rsa: {
    campaign: "search_stress_angst",
    ad_group: "prikkelverwerking",
    headlines: [
      { text: "Overprikkeld?", pinned: 1 },
      { text: "Prikkelverwerking Hulp" },
      { text: "Sensorische Ondersteuning" },
      { text: "Ontprikkelen met Knuffel" },
      { text: "HSP & Hoogsensitief" },
      { text: "Diepe Druk Werkt" },
      { text: "Verzwaringsknuffel 2kg" },
      { text: "Rust bij Prikkels" },
      { text: "Lotgenootje® Knuffels" },
      { text: "Gratis Verzending" },
      { text: "30 Dagen Uitproberen" },
      { text: "★★★★★ Reviews" },
      { text: "CE-Gecertificeerd" },
      { text: "Ontwikkeld met Experts" },
      { text: "Direct Leverbaar" }
    ],
    descriptions: [
      { text: "Overprikkeld? Onze verzwaringsknuffels bieden sensorische ondersteuning door diepe druk stimulatie. Direct rust.", pinned: 1 },
      { text: "Speciaal voor hoogsensitieve kinderen en volwassenen. 2kg gelijkmatig verdeeld gewicht kalmeert het zenuwstelsel." },
      { text: "Lotgenootje: je veilige haven bij teveel prikkels. Super zacht, altijd beschikbaar. 30 dagen gratis uitproberen!" },
      { text: "Door zorgprofessionals aanbevolen. Helpt bij autisme, ADHD, HSP. Gratis verzending & retourneren." }
    ]
  },

  // Cadeau Ads
  cadeau_rsa: {
    campaign: "search_cadeau",
    ad_group: "cadeau",
    headlines: [
      { text: "Origineel Cadeau Idee", pinned: 1 },
      { text: "Verzwaringsknuffel Cadeau" },
      { text: "Lotgenootje® Knuffels" },
      { text: "Cadeau voor Rust & Troost" },
      { text: "Uniek & Betekenisvol" },
      { text: "Verrassend Anders" },
      { text: "Gratis Inpakken" },
      { text: "Cadeaubon Beschikbaar" },
      { text: "Gratis Verzending" },
      { text: "★★★★★ Reviews" },
      { text: "Perfect Kerstcadeau" },
      { text: "Moederdag Cadeau Tip" },
      { text: "Verjaardag Verrassing" },
      { text: "Voor Alle Leeftijden" },
      { text: "Direct Leverbaar" }
    ],
    descriptions: [
      { text: "Op zoek naar een origineel cadeau? Geef een Lotgenootje verzwaringsknuffel. Troost die je kunt vastpakken!", pinned: 1 },
      { text: "Het perfecte cadeau voor iemand die rust en geborgenheid verdient. Gratis verzending, mooi verpakt." },
      { text: "Cadeaubon beschikbaar! Laat je dierbare zelf kiezen uit konijn, koala, hond, beer, kat of schaap." },
      { text: "Verrassend, betekenisvol, blijvend. Het cadeau dat echt iets doet. 30 dagen niet goed = geld terug." }
    ]
  },

  // RSA - Slaapproblemen (existing)
  slaapproblemen_rsa: {
    campaign: "search_generic",
    ad_group: "slaapproblemen",
    headlines: [
      { text: "Kind Slaapt Niet Door?" },
      { text: "Slaapproblemen Baby?" },
      { text: "Eindelijk Rust in Huis" },
      { text: "De Oplossing voor Slaapproblemen" },
      { text: "Bewezen Effectief" },
      { text: "86% Slaapt Beter" },
      { text: "Rustgevende Knuffels" },
      { text: "Met White Noise" },
      { text: "Sterrenprojector voor Rust" },
      { text: "Gratis Verzending" },
      { text: "14 Dagen Uitproberen" },
      { text: "Droomvriendjes® Knuffels" },
      { text: "★★★★★ Beoordeeld" },
      { text: "Direct Leverbaar" },
      { text: "Veilig Vanaf 0 Maanden" }
    ],
    descriptions: [
      { text: "Moeite met inslapen? Onze slaapknuffels met rustgevende lichtjes en geluiden helpen je kind sneller in slaap vallen." },
      { text: "Speciaal ontwikkeld voor kinderen met slaapproblemen. Kalmerende white noise en sterrenprojectie voor betere nachtrust." },
      { text: "Al meer dan 10.000 ouders gingen je voor. Bestel nu met gratis verzending en 14 dagen bedenktijd." },
      { text: "Wetenschappelijk onderbouwd: white noise en lichtprojectie verminderen onrust. Probeer 14 dagen gratis!" }
    ]
  },

  // RSA - Nachtlampjes (existing)
  nachtlampjes_rsa: {
    campaign: "search_generic",
    ad_group: "nachtlampjes",
    headlines: [
      { text: "Nachtlampje met Projector" },
      { text: "Sterrenprojector Baby" },
      { text: "Nachtlamp + Knuffel in 1" },
      { text: "Sterrenhemel op Plafond" },
      { text: "Magisch Nachtlampje" },
      { text: "Met Rustgevende Muziek" },
      { text: "Dimbaar LED Licht" },
      { text: "Timer Functie" },
      { text: "Gratis Verzending NL" },
      { text: "Droomvriendjes®" },
      { text: "Veilig voor Baby's" },
      { text: "Vanaf €49,95" },
      { text: "★★★★★ Reviews" },
      { text: "Direct Leverbaar" },
      { text: "Kindvriendelijke Designs" }
    ],
    descriptions: [
      { text: "Knuffel met ingebouwd nachtlampje en sterrenprojectie. Creëer een magische sfeer in de kinderkamer. Gratis verzending!" },
      { text: "Onze nachtlampjes projecteren een sterrenhemel op het plafond. Met timer en dimfunctie. Veilig vanaf 0 maanden." },
      { text: "Populairste nachtlampje van Nederland! Meer dan 10.000 verkocht. Bestel nu en ontvang morgen in huis." },
      { text: "Combineer knuffelen met rustgevend licht. Perfecte slaaphulp voor je kleintje. 14 dagen niet goed = geld terug." }
    ]
  },

  // RSA - Knuffels (existing)
  knuffels_rsa: {
    campaign: "search_generic",
    ad_group: "knuffels",
    headlines: [
      { text: "Slaapknuffel met Geluid" },
      { text: "Knuffel met Nachtlampje" },
      { text: "White Noise Knuffel" },
      { text: "Rustgevende Slaapknuffel" },
      { text: "Knuffel + Projector" },
      { text: "Voor Betere Slaap" },
      { text: "Kalmerende Knuffels" },
      { text: "Super Zacht Materiaal" },
      { text: "Gratis Verzending" },
      { text: "2e Knuffel 50% Korting" },
      { text: "Droomvriendjes®" },
      { text: "★★★★★ 4.7/5" },
      { text: "10.000+ Verkocht" },
      { text: "Veilig Vanaf 0 Maanden" },
      { text: "Schattige Dieren" }
    ],
    descriptions: [
      { text: "Slaapknuffels met ingebouwde nachtlamp en white noise. Kies uit teddy, schaap, panda en meer. Gratis verzending!" },
      { text: "Onze knuffels helpen je kind tot rust te komen. Met sterrenprojector, muziek en timer. Nu 2e knuffel halve prijs!" },
      { text: "Super zachte knuffels met kalmerende functies. Perfect als kraamcadeau. Meer dan 10.000 tevreden ouders!" },
      { text: "Van teddy tot eenhoorn - vind de perfecte slaapknuffel voor jouw kind. 14 dagen bedenktijd. Gratis retour." }
    ]
  },

  // RSA - Speciale Behoeften (existing)
  special_needs_rsa: {
    campaign: "search_generic",
    ad_group: "special_needs",
    headlines: [
      { text: "Rustgevend bij Autisme" },
      { text: "Kalmerende Knuffel ADHD" },
      { text: "HSP Kind Ontspannen" },
      { text: "Sensorisch Rustgevend" },
      { text: "Prikkelarm Speelgoed" },
      { text: "Bewezen Kalmerend Effect" },
      { text: "White Noise Functie" },
      { text: "Zacht & Troostend" },
      { text: "Droomvriendjes®" },
      { text: "Gratis Verzending" },
      { text: "14 Dagen Proberen" },
      { text: "★★★★★ Reviews" },
      { text: "Veilig & Gecertificeerd" },
      { text: "Door Ouders Aanbevolen" },
      { text: "Direct Leverbaar" }
    ],
    descriptions: [
      { text: "Speciaal voor kinderen die extra rust nodig hebben. Onze knuffels bieden kalmerende white noise en zacht licht." },
      { text: "Aanbevolen door ouders van kinderen met autisme, ADHD of HSP. Rustgevende functies voor betere ontspanning." },
      { text: "Prikkelarme knuffels met rustgevende lichtjes en geluiden. Helpt bij overprikkeling. 14 dagen proberen!" },
      { text: "Gecertificeerd veilig, extra zacht materiaal. Perfect voor gevoelige kinderen. Gratis verzending & retour." }
    ]
  }
};

// ===========================================
// SITELINKS
// ===========================================

export const sitelinks = [
  {
    text: "Alle Slaapknuffels",
    description: "Bekijk ons complete assortiment",
    url: "/knuffels"
  },
  {
    text: "Verzwaringsknuffels",
    description: "Lotgenootje® 2kg knuffels",
    url: "/knuffels"
  },
  {
    text: "Bestsellers",
    description: "Onze meest populaire knuffels",
    url: "/#producten"
  },
  {
    text: "Gratis Verzending",
    description: "Altijd gratis verzending in NL",
    url: "/verzending"
  },
  {
    text: "Reviews",
    description: "★★★★★ 4.7/5 - Lees ervaringen",
    url: "/reviews"
  },
  {
    text: "Cadeaubonnen",
    description: "Geef een Droomvriendje cadeau",
    url: "/cadeaubon"
  },
  {
    text: "Contact",
    description: "Vragen? Neem contact op",
    url: "/contact"
  },
  {
    text: "2e Knuffel 50% Korting",
    description: "Bestel 2 en bespaar!",
    url: "/#producten"
  },
  {
    text: "Over Ons",
    description: "Het verhaal achter Droomvriendjes",
    url: "/over-ons"
  },
  {
    text: "Voordeelbundels",
    description: "Bespaar met onze bundels",
    url: "/knuffels"
  }
];

// ===========================================
// CALLOUT EXTENSIONS
// ===========================================

export const callouts = [
  "Gratis Verzending",
  "30 Dagen Uitproberen",
  "Voor 23:00 Besteld = Morgen in Huis",
  "Veilig Vanaf 3 Jaar",
  "★★★★★ Reviews",
  "Veilig Betalen met iDEAL",
  "2e Knuffel 50% Korting",
  "CE Gecertificeerd",
  "Nederlandse Klantenservice",
  "Handwasbaar",
  "2kg Verzwaard",
  "Diepe Druk Stimulatie",
  "Super Zacht Pluche",
  "Gratis Retourneren",
  "Lotgenootje® Kwaliteit"
];

// ===========================================
// STRUCTURED SNIPPETS
// ===========================================

export const structuredSnippets = [
  {
    header: "Types",
    values: ["Konijn", "Koala", "Hond", "Beer", "Kat", "Schaap"]
  },
  {
    header: "Functies",
    values: ["Verzwaard 2kg", "Diepe Druk", "Super Zacht", "Handwasbaar", "CE-Keurmerk"]
  },
  {
    header: "Voordelen",
    values: ["Gratis Verzending", "30 Dagen Retour", "Veilig Betalen", "Snel Geleverd"]
  },
  {
    header: "Doelgroepen",
    values: ["Kinderen", "Volwassenen", "HSP", "Stress", "Slaapproblemen"]
  }
];

// ===========================================
// AUDIENCE TARGETING
// ===========================================

export const audiences = {
  in_market: [
    "Baby & Toddler Products",
    "Nursery Furniture & Decor",
    "Baby & Toddler Feeding Supplies",
    "Baby & Toddler Toys"
  ],
  
  affinity: [
    "Parenting",
    "Family-Focused",
    "Bargain Hunters",
    "Shutterbugs" // Often buying gifts
  ],
  
  demographics: {
    age: ["25-34", "35-44"],
    gender: ["Female", "Male"],
    parental_status: ["Parents"],
    household_income: ["Top 50%"]
  },
  
  remarketing: [
    {
      name: "All Visitors",
      duration: 30,
      description: "Alle websitebezoekers laatste 30 dagen"
    },
    {
      name: "Product Viewers",
      duration: 14,
      description: "Bezoekers die productpagina's hebben bekeken"
    },
    {
      name: "Cart Abandoners",
      duration: 7,
      description: "Bezoekers die iets in winkelwagen hadden maar niet kochten"
    },
    {
      name: "Converters",
      duration: 540,
      description: "Klanten die hebben gekocht (voor upsell)"
    }
  ]
};

// ===========================================
// CONVERSIE ACTIES
// ===========================================

export const conversionActions = [
  {
    name: "Purchase",
    category: "PURCHASE",
    value_type: "USE_DIFFERENT_VALUES_FOR_EACH_CONVERSION",
    default_value: 59.95,
    counting: "ONE_PER_CLICK",
    attribution: "DATA_DRIVEN",
    click_through_window: 30,
    view_through_window: 1,
    primary: true
  },
  {
    name: "Add to Cart",
    category: "ADD_TO_CART",
    value_type: "USE_DEFAULT_VALUE",
    default_value: 5.00,
    counting: "MANY_PER_CLICK",
    attribution: "DATA_DRIVEN",
    click_through_window: 30,
    view_through_window: 1,
    primary: false
  },
  {
    name: "Begin Checkout",
    category: "BEGIN_CHECKOUT",
    value_type: "USE_DEFAULT_VALUE",
    default_value: 10.00,
    counting: "ONE_PER_CLICK",
    attribution: "DATA_DRIVEN",
    click_through_window: 30,
    view_through_window: 1,
    primary: false
  },
  {
    name: "Contact Form Submit",
    category: "SUBMIT_LEAD_FORM",
    value_type: "USE_DEFAULT_VALUE",
    default_value: 15.00,
    counting: "ONE_PER_CLICK",
    attribution: "DATA_DRIVEN",
    click_through_window: 30,
    view_through_window: 1,
    primary: false
  }
];

// ===========================================
// EXPORT FUNCTIES - GOOGLE ADS EDITOR FORMAT
// ===========================================

/**
 * Exporteer keywords naar Google Ads Editor CSV formaat
 */
export const exportKeywordsToCSV = () => {
  const rows = [["Campaign", "Ad group", "Keyword", "Criterion Type", "Max CPC", "Status"]];
  
  Object.entries(keywordLists).forEach(([groupName, group]) => {
    // Get campaign name from campaign id
    const campaign = campaignStructure.campaigns.find(c => c.id === group.campaign);
    const campaignName = campaign ? campaign.name : group.campaign;
    const adGroupName = groupName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    group.keywords.forEach(kw => {
      group.match_types.forEach(matchType => {
        let formattedKeyword = kw.keyword;
        let criterionType = "Keyword";
        
        if (matchType === "EXACT") {
          formattedKeyword = `[${kw.keyword}]`;
        } else if (matchType === "PHRASE") {
          formattedKeyword = `"${kw.keyword}"`;
        } else if (matchType === "BROAD_MATCH_MODIFIER") {
          formattedKeyword = `+${kw.keyword.split(' ').join(' +')}`;
        }
        
        rows.push([
          campaignName,
          adGroupName,
          formattedKeyword,
          criterionType,
          kw.bid.toFixed(2),
          "Enabled"
        ]);
      });
    });
  });
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
};

/**
 * Exporteer advertenties naar Google Ads Editor CSV formaat (RSA)
 */
export const exportAdsToCSV = () => {
  const rows = [[
    "Campaign",
    "Ad group", 
    "Ad type",
    "Headline 1",
    "Headline 2",
    "Headline 3",
    "Headline 4",
    "Headline 5",
    "Headline 6",
    "Headline 7",
    "Headline 8",
    "Headline 9",
    "Headline 10",
    "Headline 11",
    "Headline 12",
    "Headline 13",
    "Headline 14",
    "Headline 15",
    "Description 1",
    "Description 2",
    "Description 3",
    "Description 4",
    "Final URL",
    "Status"
  ]];
  
  Object.entries(adCopy).forEach(([adName, ad]) => {
    const campaign = campaignStructure.campaigns.find(c => c.id === ad.campaign);
    const campaignName = campaign ? campaign.name : ad.campaign;
    const adGroupName = (ad.ad_group || adName).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Create row with all headlines and descriptions
    const row = [
      campaignName,
      adGroupName,
      "Responsive search ad"
    ];
    
    // Add headlines (15 slots)
    for (let i = 0; i < 15; i++) {
      row.push(ad.headlines[i] ? ad.headlines[i].text : "");
    }
    
    // Add descriptions (4 slots)
    for (let i = 0; i < 4; i++) {
      row.push(ad.descriptions[i] ? ad.descriptions[i].text : "");
    }
    
    // Final URL and Status
    row.push("https://droomvriendjes.com");
    row.push("Enabled");
    
    rows.push(row);
  });
  
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
};

/**
 * Exporteer campagnes naar Google Ads Editor CSV formaat
 */
export const exportCampaignsToCSV = () => {
  const rows = [[
    "Campaign",
    "Campaign type",
    "Campaign status",
    "Budget",
    "Budget type",
    "Bid strategy type"
  ]];
  
  campaignStructure.campaigns.forEach(campaign => {
    rows.push([
      campaign.name,
      campaign.type === "SEARCH" ? "Search" : 
        campaign.type === "SHOPPING" ? "Shopping" : 
        campaign.type === "DISPLAY" ? "Display" : 
        campaign.type === "PERFORMANCE_MAX" ? "Performance Max" : campaign.type,
      "Enabled",
      campaign.budget_daily.toFixed(2),
      "Daily",
      campaign.bidding_strategy.replace(/_/g, ' ').toLowerCase()
    ]);
  });
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
};

/**
 * Exporteer sitelinks naar Google Ads Editor CSV formaat
 */
export const exportSitelinksToCSV = () => {
  const rows = [[
    "Campaign",
    "Sitelink text",
    "Description line 1",
    "Final URL"
  ]];
  
  // Add sitelinks for each campaign
  campaignStructure.campaigns
    .filter(c => c.type === "SEARCH")
    .forEach(campaign => {
      sitelinks.forEach(link => {
        rows.push([
          campaign.name,
          link.text,
          link.description,
          `https://droomvriendjes.com${link.url}`
        ]);
      });
    });
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
};

/**
 * Exporteer callouts naar Google Ads Editor CSV formaat
 */
export const exportCalloutsToCSV = () => {
  const rows = [[
    "Campaign",
    "Callout text"
  ]];
  
  campaignStructure.campaigns
    .filter(c => c.type === "SEARCH")
    .forEach(campaign => {
      callouts.forEach(callout => {
        rows.push([
          campaign.name,
          callout
        ]);
      });
    });
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
};

/**
 * Exporteer negatieve keywords naar Google Ads Editor CSV formaat
 */
export const exportNegativeKeywordsToCSV = () => {
  const rows = [["Campaign", "Keyword", "Criterion Type"]];
  
  // Account level negatives - add to all campaigns
  campaignStructure.campaigns
    .filter(c => c.type === "SEARCH")
    .forEach(campaign => {
      negativeKeywords.account_level.forEach(kw => {
        rows.push([
          campaign.name,
          kw,
          "Negative keyword"
        ]);
      });
    });
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
};

/**
 * Get all keywords count
 */
export const getKeywordStats = () => {
  let total = 0;
  let byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  
  Object.values(keywordLists).forEach(group => {
    group.keywords.forEach(kw => {
      total += group.match_types.length;
      byPriority[kw.priority] += group.match_types.length;
    });
  });
  
  return { total, byPriority };
};

export default {
  campaignStructure,
  keywordLists,
  negativeKeywords,
  adCopy,
  sitelinks,
  callouts,
  structuredSnippets,
  audiences,
  conversionActions,
  exportKeywordsToCSV,
  exportAdsToCSV,
  exportCampaignsToCSV,
  exportSitelinksToCSV,
  exportCalloutsToCSV,
  exportNegativeKeywordsToCSV,
  getKeywordStats
};
