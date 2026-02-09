import React from 'react';

/**
 * Schema Markup Component for AI-optimized SEO (2026)
 * Includes: Organization, LocalBusiness, WebSite, and BreadcrumbList schemas
 * Optimized for Gemini, Copilot, and other AI Answer Engines
 */
const SchemaMarkup = ({ pageType = 'home', product = null, breadcrumbs = [] }) => {
  
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

  // FAQ Schema for common questions (AI loves this)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Wat is een Droomvriendje slaapknuffel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Een Droomvriendje is een premium slaapknuffel met ingebouwde sterrenprojectie, white noise en rustgevende melodieën. Het helpt baby's en peuters om sneller en beter te slapen door een veilige en magische sfeer te creëren."
        }
      },
      {
        "@type": "Question",
        "name": "Vanaf welke leeftijd is een Droomvriendje geschikt?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Droomvriendjes zijn CE-gecertificeerd en veilig voor baby's vanaf 0 maanden. De zachte knuffel en rustgevende geluiden zijn speciaal ontworpen voor de allerkleinsten."
        }
      },
      {
        "@type": "Question",
        "name": "Hoe lang gaat de batterij mee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Droomvriendjes zijn USB-oplaadbaar en gaan tot 8 uur mee op één lading. De 30-minuten timer zorgt ervoor dat de knuffel automatisch uitschakelt."
        }
      },
      {
        "@type": "Question",
        "name": "Is er gratis verzending?",
        "acceptedAnswer": {
          "@type": "Answer",
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
      schemas.push(localBusinessSchema, faqSchema, itemListSchema);
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
