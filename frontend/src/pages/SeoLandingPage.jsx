import React, { useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Star, Truck, RotateCcw, ShieldCheck, Check, Sparkles, Moon, Volume2 } from 'lucide-react';
import { products } from '../mockData';


// SEO Keyword Landing Page Configurations
const seoPages = {
  'slaapknuffel': {
    title: 'Slaapknuffel Kopen | Droomvriendjes® Officiële Shop',
    h1: 'De Beste Slaapknuffels van Nederland',
    description: 'Ontdek onze slaapknuffels met nachtlampje en white noise. 86% van de kinderen slaapt beter. Gratis verzending, 14 dagen retour.',
    keywords: 'slaapknuffel, slaapknuffel kopen, slaapknuffel baby, slaapknuffel peuter',
    intro: 'Een slaapknuffel is meer dan een knuffel - het is de beste vriend van je kind in de nacht. Onze Droomvriendjes combineren een zachte knuffel met rustgevend licht en geluid.',
    benefits: ['Helpt kinderen sneller in slaap vallen', 'Sterrenprojector voor magische sfeer', 'Rustgevende white noise geluiden', '30 minuten auto-uit timer'],
    cta: 'Bekijk Slaapknuffels'
  },
  'knuffel-nachtlampje': {
    title: 'Knuffel met Nachtlampje | Droomvriendjes® | Gratis Verzending',
    h1: 'Knuffel met Nachtlampje - 2-in-1 Slaaphulp',
    description: 'Knuffel met ingebouwd nachtlampje en sterrenprojector. Perfect voor kinderen die bang zijn in het donker. Bestel nu met gratis verzending!',
    keywords: 'knuffel nachtlampje, knuffel met licht, nachtlampje knuffel, knuffel lamp',
    intro: 'Onze knuffels met nachtlampje combineren troost en licht in één. De zachte sterrenprojector creëert een magische sfeer die angst voor het donker wegneemt.',
    benefits: ['Zacht sterrenlicht projectie', 'Verschillende kleuren beschikbaar', 'Oplaadbaar via USB', 'CE-gecertificeerd en veilig'],
    cta: 'Ontdek Knuffels met Licht'
  },
  'baby-nachtlamp': {
    title: 'Baby Nachtlamp | Veilig & Rustgevend | Droomvriendjes®',
    h1: 'Baby Nachtlamp - Veilig en Rustgevend',
    description: 'Zoek je een veilige baby nachtlamp? Onze Droomvriendjes zijn perfect: zacht licht, geen hitte, CE-gecertificeerd. Gratis verzending!',
    keywords: 'baby nachtlamp, nachtlampje baby, babylamp, baby nachtlicht',
    intro: "Een goede baby nachtlamp is essentieel voor rustgevende nachten. Onze Droomvriendjes bieden zacht, warm licht dat niet te fel is voor gevoelige babyoogjes.",
    benefits: ['LED licht - geen warmte', '100% veilig voor baby\'s', 'Zacht diffuus licht', 'Timer functie'],
    cta: 'Bekijk Baby Nachtlampen'
  },
  'kraamcadeau': {
    title: 'Origineel Kraamcadeau | Droomvriendjes® | Gratis Inpakken',
    h1: 'Het Perfecte Kraamcadeau',
    description: 'Op zoek naar een origineel kraamcadeau? Droomvriendjes zijn het perfecte cadeau: praktisch én schattig. Gratis cadeauverpakking!',
    keywords: 'kraamcadeau, kraamcadeau origineel, cadeau baby, babyshower cadeau',
    intro: 'Een Droomvriendje is het ideale kraamcadeau: het is schattig, praktisch én helpt ouders met betere nachten. Inclusief gratis cadeauverpakking!',
    benefits: ['Gratis cadeauverpakking', 'Persoonlijke boodschap mogelijk', 'Praktisch én schattig', 'Ouders zijn er dol op'],
    cta: 'Bestel als Kraamcadeau'
  },
  'kind-slaapt-niet-door': {
    title: 'Kind Slaapt Niet Door? | Oplossing | Droomvriendjes®',
    h1: 'Kind Slaapt Niet Door? Dit is de Oplossing',
    description: 'Slaapt je kind niet door? 86% van de ouders ziet verbetering met een Droomvriendje. Ontdek hoe onze slaapknuffels helpen.',
    keywords: 'kind slaapt niet door, kind slaapt slecht, doorslapen kind, slaapproblemen kind',
    intro: 'Als je kind niet doorslaapt, ben je niet alleen. Veel ouders worstelen hiermee. Onze Droomvriendjes zijn speciaal ontwikkeld om kinderen te helpen beter te slapen.',
    benefits: ['86% ziet verbetering binnen 2 weken', 'Rustgevend sterrenlicht', 'White noise maskeert geluiden', 'Veilig voor alle leeftijden'],
    cta: 'Ontdek de Oplossing'
  },
  'sterrenprojector-knuffel': {
    title: 'Sterrenprojector Knuffel | Magische Nachten | Droomvriendjes®',
    h1: 'Sterrenprojector Knuffel - Magische Sterrenhemel',
    description: 'Knuffel met sterrenprojector voor magische nachten. Projecteert een prachtige sterrenhemel op het plafond. Bestel nu!',
    keywords: 'sterrenprojector knuffel, knuffel sterrenhemel, sterren knuffel, projector knuffel',
    intro: 'Onze sterrenprojector knuffels toveren elke slaapkamer om in een magische sterrenhemel. Kinderen vallen rustig in slaap terwijl ze naar de sterren kijken.',
    benefits: ['Projecteert sterren op plafond', 'Meerdere kleuren beschikbaar', 'Roterende projectie', 'Combineert met white noise'],
    cta: 'Bekijk Sterrenprojectors'
  },
  'white-noise-knuffel': {
    title: 'White Noise Knuffel | Rustgevende Geluiden | Droomvriendjes®',
    h1: 'White Noise Knuffel - Rustgevende Slaapgeluiden',
    description: 'Knuffel met white noise en rustgevende geluiden. Helpt baby\'s en kinderen sneller in slaap vallen. Gratis verzending!',
    keywords: 'white noise knuffel, knuffel geluid, slaapgeluid knuffel, ruis knuffel',
    intro: 'White noise helpt bewezen bij het in slaap vallen. Onze knuffels hebben ingebouwde rustgevende geluiden die omgevingsgeluiden maskeren.',
    benefits: ['Meerdere white noise opties', 'Hartslag geluid beschikbaar', 'Volume aanpasbaar', 'Timer 15/30/60 minuten'],
    cta: 'Ontdek White Noise Knuffels'
  },
  'peuter-nachtlampje': {
    title: 'Peuter Nachtlampje | Niet Meer Bang | Droomvriendjes®',
    h1: 'Peuter Nachtlampje - Nooit Meer Bang in het Donker',
    description: 'Perfect nachtlampje voor peuters die bang zijn in het donker. Zacht licht, leuke knuffel. Bestel nu met gratis verzending!',
    keywords: 'peuter nachtlampje, nachtlamp peuter, peuter bang donker, kindernachtlamp',
    intro: 'Veel peuters zijn bang in het donker. Een Droomvriendje biedt troost én licht - de perfecte combinatie om angst te overwinnen.',
    benefits: ['Speciaal voor peuters', 'Niet te fel licht', 'Knuffelbaar en troostend', 'Helpt bij zelfstandig slapen'],
    cta: 'Bekijk Peuter Nachtlampjes'
  },
  'baby-slaapt-slecht': {
    title: 'Baby Slaapt Slecht? | Tips & Oplossing | Droomvriendjes®',
    h1: 'Baby Slaapt Slecht? Wij Helpen!',
    description: 'Slaapt je baby slecht? Ontdek hoe onze slaapknuffels helpen. Rustgevend licht en geluid voor betere nachten.',
    keywords: 'baby slaapt slecht, baby slaapt niet, baby huilt nachts, baby slaapproblemen',
    intro: 'Als je baby slecht slaapt, is dat zwaar voor het hele gezin. Onze Droomvriendjes zijn ontwikkeld om baby\'s te helpen rustiger te slapen.',
    benefits: ['Geschikt vanaf geboorte', 'Rustgevende hartslag geluid', 'Zacht diffuus licht', 'CE-gecertificeerd veilig'],
    cta: 'Ontdek de Oplossing'
  },
  'beste-slaapknuffel': {
    title: 'Beste Slaapknuffel 2026 | Test & Review | Droomvriendjes®',
    h1: 'De Beste Slaapknuffel van 2026',
    description: 'Op zoek naar de beste slaapknuffel? Droomvriendjes scoren 4.9/5 sterren. Ontdek waarom 10.000+ ouders ons kiezen.',
    keywords: 'beste slaapknuffel, slaapknuffel test, slaapknuffel review, top slaapknuffel',
    intro: 'Met een 4.9/5 beoordeling en 10.000+ tevreden klanten zijn Droomvriendjes de best beoordeelde slaapknuffels van Nederland.',
    benefits: ['4.9/5 sterren op Trustpilot', '10.000+ tevreden ouders', 'Beste prijs-kwaliteit', '14 dagen niet goed, geld terug'],
    cta: 'Bekijk Onze Bestseller'
  }
};

const SeoLandingPage = () => {
  const { keyword: paramKeyword } = useParams();
  const location = useLocation();
  
  // Get keyword from URL param OR from pathname (for direct routes like /slaapknuffel)
  const keyword = paramKeyword || location.pathname.replace('/', '').replace('/seo/', '');
  const page = seoPages[keyword] || seoPages['slaapknuffel'];
  const featuredProducts = products.slice(0, 3);

  // Track page visit for SEO analytics
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch(`/api/tracking/seo-visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: keyword,
            page_title: page.title,
            timestamp: new Date().toISOString()
          })
        });
      } catch (e) {
        // Silent fail
      }
    };
    trackVisit();
  }, [keyword, page.title]);

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <meta name="keywords" content={page.keywords} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://droomvriendjes.nl/${keyword}`} />
      </Helmet>
      
      <Layout showPromoBanner={true}>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-warm-brown-50 to-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                {page.h1}
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                {page.intro}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-medium">4.9/5 (2.847 reviews)</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Gratis Verzending</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">14 Dagen Retour</span>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              {page.benefits.map((benefit, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-warm-brown-100">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{benefit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
              Onze Bestsellers
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {featuredProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow border-2 border-warm-brown-100 overflow-hidden">
                    <div className="aspect-square bg-warm-brown-50 relative">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain p-4"
                      />
                      {product.isNew && (
                        <span className="absolute top-3 left-3 bg-warm-brown-500 text-white text-xs px-2 py-1 rounded-full">
                          Nieuw
                        </span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{product.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                        <span className="text-sm text-slate-500 ml-1">({product.reviews})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-warm-brown-600">€{product.price}</span>
                        <span className="text-sm text-green-600 font-medium">Op voorraad</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link to="/producten">
                <Button size="lg" className="bg-warm-brown-500 hover:bg-warm-brown-600 text-lg px-8">
                  {page.cta}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-warm-brown-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Waarom Droomvriendjes?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sterrenprojector</h3>
                <p className="text-slate-600">
                  Magische sterrenhemel op het plafond. Kalmerende sfeer die kinderen helpt ontspannen.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">White Noise</h3>
                <p className="text-slate-600">
                  Rustgevende geluiden die omgevingsgeluiden maskeren en helpen bij het in slaap vallen.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Moon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">30 Min Timer</h3>
                <p className="text-slate-600">
                  Automatische uitschakeling wanneer je kind slaapt. Veilig en energiezuinig.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
              Wat Ouders Zeggen
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">
                    "Na maanden van slaapgebrek slaapt onze Emma nu elke nacht door. De sterrenprojector is magisch!"
                  </p>
                  <p className="font-semibold text-slate-900">— Lisa, moeder van Emma (3)</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">
                    "Beste aankoop ooit! Mijn zoon is niet meer bang in het donker en valt veel sneller in slaap."
                  </p>
                  <p className="font-semibold text-slate-900">— Mark, vader van Daan (5)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-warm-brown-500 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Klaar voor Betere Nachten?</h2>
            <p className="text-xl text-warm-brown-100 mb-8">
              Gebruik code <strong>WELKOM15</strong> voor 15% korting op je eerste bestelling
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/producten">
                <Button size="lg" className="bg-white text-warm-brown-600 hover:bg-warm-brown-50 text-lg px-8">
                  Bekijk Collectie
                </Button>
              </Link>
              <Link to="/product/1">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  Bestseller: Leeuw Leo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Schema */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
              Veelgestelde Vragen
            </h2>
            
            <div className="space-y-4">
              <Card className="border-warm-brown-100">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Vanaf welke leeftijd is een slaapknuffel geschikt?
                  </h3>
                  <p className="text-slate-600">
                    Onze Droomvriendjes zijn geschikt vanaf 0 maanden. Ze zijn CE-gecertificeerd en voldoen aan alle veiligheidsnormen voor baby's.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-warm-brown-100">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Hoe lang gaat de batterij mee?
                  </h3>
                  <p className="text-slate-600">
                    De oplaadbare batterij gaat tot 8 uur mee op één lading. Opladen via USB duurt ongeveer 2 uur.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-warm-brown-100">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    Is de knuffel wasbaar?
                  </h3>
                  <p className="text-slate-600">
                    Ja! De buitenkant is afneembaar en wasbaar op 30°C. Het elektronische gedeelte is spatwaterdicht.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default SeoLandingPage;
