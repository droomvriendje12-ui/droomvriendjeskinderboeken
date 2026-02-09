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
