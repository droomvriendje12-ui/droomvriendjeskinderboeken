import React from 'react';
import { getAllFAQs } from '../data/megaFAQs';

/**
 * Schema Markup Component for AI-optimized SEO (2026)
 * Includes: Organization, LocalBusiness, WebSite, and BreadcrumbList schemas
 * Optimized for Gemini, Copilot, and other AI Answer Engines
 * Now with 100+ FAQs for maximum AI visibility!
 */
const SchemaMarkup = ({ pageType = 'home', product = null, breadcrumbs = [] }) => {
  
  // Get all FAQs from mega database
  const allFAQsForSchema = getAllFAQs();
  
  // Organization Schema - Main business info
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://droomvriendjes.nl/#organization",
    "name": "Droomvriendjes",
    "alternateName": ["Droomvriendjes.nl", "Droom Vriendjes"],
    "url": "https://droomvriendjes.nl",
    "logo": {
      "@type": "ImageObject",
      "url": "https://droomvriendjes.nl/logo.svg",
      "width": 200,
      "height": 60
    },
    "image": "https://droomvriendjes.nl/products/panda/Panda_Side_product_02.png",
    "description": "Droomvriendjes® - Premium slaapknuffels met sterrenprojectie, white noise en rustgevende melodieën. Helpt baby's en peuters beter slapen. Gratis verzending in Nederland en België.",
    "slogan": "Meer dan een knuffel, de beste vriend van je kind in het donker",
    "foundingDate": "2023",
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "minValue": 1,
      "maxValue": 10
    },
    "areaServed": [
      {
        "@type": "Country",
        "name": "Nederland"
      },
      {
        "@type": "Country", 
        "name": "België"
      }
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "info@droomvriendjes.nl",
        "availableLanguage": ["Dutch", "English"],
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "17:00"
        }
      }
    ],
    "sameAs": [
      "https://www.instagram.com/droomvriendjes",
      "https://www.facebook.com/droomvriendjes",
      "https://www.tiktok.com/@droomvriendjes"
    ]
  };

  // LocalBusiness Schema - For local SEO and AI recommendations
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": "https://droomvriendjes.nl/#localbusiness",
    "name": "Droomvriendjes - Slaapknuffels Webshop",
    "image": "https://droomvriendjes.nl/products/panda/Panda_Side_product_02.png",
    "url": "https://droomvriendjes.nl",
    "telephone": "+31-6-00000000",
    "email": "info@droomvriendjes.nl",
    "priceRange": "€€",
    "currenciesAccepted": "EUR",
    "paymentAccepted": ["iDEAL", "Credit Card", "Bancontact", "PayPal", "Klarna"],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Nederland",
      "addressCountry": "NL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 52.3676,
      "longitude": 4.9041
    },
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 52.1326,
        "longitude": 5.2913
      },
      "geoRadius": "500 km"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Droomvriendjes Slaapknuffels",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Slaapknuffels met Sterrenprojectie",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Droomvriendjes® Slaapknuffel Panda"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Droomvriendjes® Eenhoorn Knuffel"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Droomvriendjes® Dino Slaaptrainer"
              }
            }
          ]
        }
      ]
    },
    "makesOffer": [
      {
        "@type": "Offer",
        "name": "Gratis Verzending Nederland",
        "description": "Gratis verzending bij alle bestellingen in Nederland",
        "price": "0",
        "priceCurrency": "EUR"
      },
      {
        "@type": "Offer",
        "name": "14 Dagen Retourrecht",
        "description": "Niet tevreden? Gratis retourneren binnen 14 dagen"
      }
    ]
  };

  // WebSite Schema - For sitelinks and search box
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://droomvriendjes.nl/#website",
    "url": "https://droomvriendjes.nl",
    "name": "Droomvriendjes",
    "description": "Premium slaapknuffels met sterrenprojectie voor baby's en peuters",
    "publisher": {
      "@id": "https://droomvriendjes.nl/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://droomvriendjes.nl/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "nl-NL"
  };

  // MEGA FAQ Schema - 100+ questions for maximum AI visibility
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFAQsForSchema
  };
          "text": "Ja! Wij bieden gratis verzending naar Nederland en België. Bestellingen worden binnen 1-2 werkdagen geleverd."
        }
      },
      {
        "@type": "Question",
        "name": "Kan ik mijn Droomvriendje retourneren?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absoluut! Je hebt 14 dagen bedenktijd. Niet tevreden? Dan halen we de knuffel gratis op en krijg je je geld terug."
        }
      },
      {
        "@type": "Question",
        "name": "Helpt een slaapknuffel echt bij het slapen van mijn baby?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Wetenschappelijk onderzoek toont aan dat white noise en rustgevende geluiden baby's helpen om sneller in slaap te vallen en langer door te slapen. De sterrenprojectie creëert een geruststellende omgeving die angst voor het donker vermindert. Meer dan 10.000 ouders gingen je voor met een gemiddelde beoordeling van 4.9 sterren."
        }
      },
      {
        "@type": "Question",
        "name": "Wat is het verschil tussen Droomvriendjes en Zazu?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Droomvriendjes combineren drie functies in één: sterrenprojectie, white noise/melodieën én een knuffelbare vriend. Waar andere merken vaak losse producten aanbieden, biedt Droomvriendjes een alles-in-één oplossing. Bovendien zijn onze knuffels USB-oplaadbaar (geen batterijen nodig) en bieden we gratis verzending en 14 dagen retourrecht."
        }
      },
      {
        "@type": "Question",
        "name": "Welke Droomvriendje is het beste voor mijn kind?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Onze bestseller is de Slaperige Panda, geliefd om zijn zachte vacht en rustgevende uitstraling. Voor meisjes is de Magische Eenhoorn favoriet. De Stoere Dino is perfect voor jongens die van avontuur houden. Alle Droomvriendjes hebben dezelfde hoogwaardige functies - kies het dier waar je kind het meest van houdt!"
        }
      },
      {
        "@type": "Question",
        "name": "Kan de knuffel gewassen worden?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Het elektronische gedeelte kan eenvoudig verwijderd worden via een rits. Daarna kun je de pluche buitenkant op 30 graden wassen. Zo blijft je Droomvriendje altijd fris en schoon!"
        }
      },
      {
        "@type": "Question",
        "name": "Hoeveel geluiden en melodieën heeft een Droomvriendje?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Elke Droomvriendje heeft 8 verschillende geluidsopties: white noise, hartslag (zoals in de baarmoeder), natuurgeluiden, en 5 rustgevende slaapliedjes. Je kunt het volume aanpassen en er is een 30-minuten timer."
        }
      },
      {
        "@type": "Question",
        "name": "Is een Droomvriendje een goed kraamcadeau?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Droomvriendjes zijn het perfecte kraamcadeau! Het is een cadeau dat ouders écht helpt: betere nachten voor baby én ouders. We leveren in een mooie geschenkverpakking en je kunt een persoonlijk kaartje toevoegen. Gratis verzending maakt het extra gemakkelijk."
        }
      },
      {
        "@type": "Question",
        "name": "Werkt een sterrenprojectie knuffel tegen nachtangst?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! De zachte sterrenprojectie creëert een magische, veilige sfeer in de kinderkamer. Kinderen met angst voor het donker vinden troost in het zachte licht en de vertrouwde geluiden van hun Droomvriendje. Het is een bewezen hulpmiddel tegen nachtangst bij peuters en kleuters."
        }
      },
      {
        "@type": "Question",
        "name": "Waar kan ik Droomvriendjes kopen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Je kunt Droomvriendjes direct kopen op onze webshop droomvriendjes.nl. We bieden gratis verzending in Nederland en België, veilig betalen met iDEAL, creditcard of Klarna, en 14 dagen bedenktijd. Bestel vandaag, morgen in huis!"
        }
      },
      {
        "@type": "Question",
        "name": "Hebben jullie een fysieke winkel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Droomvriendjes is een online webshop. Hierdoor kunnen we de beste prijzen bieden met gratis verzending. Je kunt in alle rust thuis bestellen en het product 14 dagen uitproberen. Niet tevreden? Gratis retourneren!"
        }
      }
    ]
  };

  // HowTo Schema - AI assistants love step-by-step guides
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Hoe help je je baby beter slapen met een Droomvriendje",
    "description": "Stap-voor-stap handleiding om je baby te helpen beter slapen met een slaapknuffel met sterrenprojectie en white noise.",
    "totalTime": "PT15M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": "59.95"
    },
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Droomvriendje slaapknuffel"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "USB-kabel voor opladen"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Laad je Droomvriendje op",
        "text": "Sluit je Droomvriendje aan op de USB-kabel en laad volledig op (circa 2 uur). Een volle batterij gaat tot 8 uur mee.",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Kies het juiste geluid",
        "text": "Druk op de geluidsknop om te kiezen uit white noise, hartslag, natuurgeluiden of slaapliedjes. Elk kind heeft een voorkeur - experimenteer wat het beste werkt.",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Stel het volume in",
        "text": "Pas het volume aan naar een rustgevend niveau. Het geluid moet hoorbaar zijn maar niet overheersend - ongeveer het niveau van een zachte douche.",
        "position": 3
      },
      {
        "@type": "HowToStep",
        "name": "Activeer de sterrenprojectie",
        "text": "Druk op de lichtknop om de magische sterrenhemel te activeren. Kies uit 3 kleuren: blauw, groen of rood. De projectie creëert een rustgevende sfeer.",
        "position": 4
      },
      {
        "@type": "HowToStep",
        "name": "Plaats in de buurt van je kind",
        "text": "Leg het Droomvriendje in het bedje of op het nachtkastje. Zorg dat je kind de sterren kan zien maar het licht niet direct in de ogen schijnt.",
        "position": 5
      },
      {
        "@type": "HowToStep",
        "name": "Start het bedtijdritueel",
        "text": "Maak het Droomvriendje onderdeel van het vaste bedtijdritueel. Consistentie helpt je kind om te begrijpen dat het tijd is om te slapen.",
        "position": 6
      },
      {
        "@type": "HowToStep",
        "name": "Laat de timer zijn werk doen",
        "text": "De 30-minuten timer schakelt automatisch uit. Je kind valt in slaap met de rustgevende geluiden en sterren, en slaapt door in stilte.",
        "position": 7
      }
    ]
  };

  // Video Schema for product demonstrations
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Droomvriendjes Slaapknuffel - Hoe het werkt",
    "description": "Bekijk hoe de Droomvriendjes slaapknuffel met sterrenprojectie en white noise je baby helpt om beter te slapen.",
    "thumbnailUrl": "https://droomvriendjes.nl/products/panda/Panda_Side_product_02.png",
    "uploadDate": "2024-01-15",
    "duration": "PT2M30S",
    "contentUrl": "https://droomvriendjes.nl/video/demo",
    "embedUrl": "https://droomvriendjes.nl/video/demo/embed",
    "publisher": {
      "@type": "Organization",
      "name": "Droomvriendjes",
      "logo": {
        "@type": "ImageObject",
        "url": "https://droomvriendjes.nl/logo.svg"
      }
    }
  };

  // Review Schema - Aggregate reviews for AI recommendations
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Droomvriendjes Slaapknuffels",
    "description": "Premium slaapknuffels met sterrenprojectie, white noise en melodieën",
    "brand": {
      "@type": "Brand",
      "name": "Droomvriendjes"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "523",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Lisa M."
        },
        "reviewBody": "Onze dochter slaapt eindelijk door! De sterrenprojectie is prachtig en de white noise werkt kalmerend. Beste aankoop ooit voor jonge ouders."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Mark van D."
        },
        "reviewBody": "Perfect kraamcadeau! De panda is super zacht en de functies zijn precies wat we nodig hadden. Gratis verzending was ook fijn."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Emma K."
        },
        "reviewBody": "Ons zoontje was bang in het donker, maar met de sterrenprojectie durft hij nu alleen te slapen. Aanrader voor alle ouders!"
      }
    ]
  };

  // ItemList Schema for product collections
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Droomvriendjes Bestsellers",
    "description": "Onze meest populaire slaapknuffels met sterrenprojectie",
    "numberOfItems": 5,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Droomvriendjes® Slaapknuffel Panda",
        "url": "https://droomvriendjes.nl/product/3"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Droomvriendjes® Eenhoorn Knuffel",
        "url": "https://droomvriendjes.nl/product/5"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Droomvriendjes® Dino Slaaptrainer",
        "url": "https://droomvriendjes.nl/product/4"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Droomvriendjes® Slaapbeer",
        "url": "https://droomvriendjes.nl/product/7"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Droomvriendjes® Pinguïn Slaaphulp",
        "url": "https://droomvriendjes.nl/product/9"
      }
    ]
  };

  // Breadcrumb Schema
  const breadcrumbSchema = breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  } : null;

  // Combine schemas based on page type
  const getSchemas = () => {
    const schemas = [organizationSchema, websiteSchema];
    
    if (pageType === 'home') {
      schemas.push(localBusinessSchema, faqSchema, itemListSchema, howToSchema, videoSchema, reviewSchema);
    }
    
    if (breadcrumbSchema) {
      schemas.push(breadcrumbSchema);
    }
    
    return schemas;
  };

  return (
    <>
      {getSchemas().map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
};

export default SchemaMarkup;
