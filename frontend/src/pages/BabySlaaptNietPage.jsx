import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Star, Check, ArrowRight, Moon, Heart, Sparkles, Shield, Clock, Battery, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';

/**
 * SEO Landing Page: "Baby Slaapt Niet"
 * Optimized for AI Answer Engines (Gemini, Copilot, SGE)
 * Target keywords: baby slaapt niet, baby valt niet in slaap, slaapproblemen baby
 */
const BabySlaaptNietPage = () => {
  
  // Schema markup for this specific page
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Baby Slaapt Niet? 7 Bewezen Tips + De Ultieme Slaaphulp",
    "description": "Ontdek waarom je baby niet slaapt en wat je eraan kunt doen. Wetenschappelijk onderbouwde tips en de #1 slaapknuffel van Nederland.",
    "author": {
      "@type": "Organization",
      "name": "Droomvriendjes"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Droomvriendjes",
      "logo": {
        "@type": "ImageObject",
        "url": "https://droomvriendjes.nl/logo.svg"
      }
    },
    "datePublished": "2024-06-01",
    "dateModified": "2025-01-15",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://droomvriendjes.nl/baby-slaapt-niet"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Waarom slaapt mijn baby niet?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Baby's kunnen om verschillende redenen niet slapen: overprikkeling, honger, oncomfortabele temperatuur, angst voor het donker, of simpelweg het missen van de geborgen omgeving van de baarmoeder. White noise en zachte geluiden kunnen helpen omdat ze de geluiden nabootsen die baby's hoorden vóór de geboorte."
        }
      },
      {
        "@type": "Question",
        "name": "Helpt white noise echt bij baby slaapproblemen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja, wetenschappelijk onderzoek toont aan dat white noise baby's helpt sneller in slaap te vallen. Het maskeert omgevingsgeluiden en bootst de constante ruis na die baby's hoorden in de baarmoeder. 80% van de baby's valt sneller in slaap met white noise."
        }
      },
      {
        "@type": "Question",
        "name": "Vanaf welke leeftijd kan ik een slaapknuffel gebruiken?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Droomvriendjes slaapknuffels zijn CE-gecertificeerd en veilig voor baby's vanaf 0 maanden. De knuffel kan buiten het bedje worden geplaatst voor de jongste baby's, terwijl oudere baby's en peuters ermee kunnen knuffelen."
        }
      },
      {
        "@type": "Question",
        "name": "Wat is beter: white noise of slaapliedjes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Dit verschilt per baby. Sommige baby's reageren beter op constante white noise, anderen op melodieën. Droomvriendjes bieden beide opties (8 geluiden) zodat je kunt ontdekken wat het beste werkt voor jouw kind."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Baby Slaapt Niet? 7 Bewezen Tips + De Ultieme Slaaphulp | Droomvriendjes</title>
        <meta name="description" content="Baby slaapt niet door? Ontdek 7 wetenschappelijk bewezen tips en de #1 slaapknuffel met white noise en sterrenprojectie. Gratis verzending." />
        <meta name="keywords" content="baby slaapt niet, baby valt niet in slaap, slaapproblemen baby, baby doorslapen, white noise baby, slaapknuffel baby" />
        <link rel="canonical" href="https://droomvriendjes.nl/baby-slaapt-niet" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Baby Slaapt Niet? Dit is de Oplossing die 10.000+ Ouders Helpt" />
        <meta property="og:description" content="Ontdek de slaapknuffel met white noise en sterrenprojectie die baby's helpt om sneller en langer te slapen." />
        <meta property="og:image" content="https://droomvriendjes.nl/products/panda/Panda_Side_product_02.png" />
        <meta property="og:url" content="https://droomvriendjes.nl/baby-slaapt-niet" />
        
        {/* Schema */}
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-[#fdf8f3] to-white">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  Herkenbaar? Je bent niet alleen.
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-[#5a4a3a] mb-6 leading-tight">
                  Baby Slaapt Niet?
                  <span className="block text-[#8B7355]">Dit Werkt Écht.</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  80% van de ouders worstelt met babyslaap. De oplossing? Een combinatie van 
                  <strong> white noise</strong>, <strong>sterrenprojectie</strong> en een 
                  <strong> knuffelbare vriend</strong> die je baby geruststelt.
                </p>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex -space-x-2">
                    {[1, 5, 8, 12].map((i) => (
                      <img key={i} src={`https://i.pravatar.cc/40?img=${i}`} alt="" className="w-10 h-10 rounded-full border-2 border-white" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="font-bold ml-1">4.9/5</span>
                    </div>
                    <p className="text-sm text-gray-500">10.000+ tevreden ouders</p>
                  </div>
                </div>
                
                <Link to="/product/3">
                  <Button size="lg" className="bg-[#8B7355] hover:bg-[#6d5a45] text-lg px-8">
                    Bekijk de Oplossing <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-8 relative overflow-hidden">
                  {/* Stars animation */}
                  <div className="absolute inset-0 opacity-50">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                  <img 
                    src="/products/panda/Panda_Side_product_02.png" 
                    alt="Droomvriendjes Slaapknuffel Panda met sterrenprojectie" 
                    className="w-full max-w-sm mx-auto relative z-10"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                  Gratis Verzending!
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#5a4a3a] text-center mb-12">
              Waarom Slaapt Je Baby Niet?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: '😰', title: 'Overprikkeling', desc: 'Te veel indrukken overdag maken het moeilijk om tot rust te komen' },
                { icon: '🌑', title: 'Angst voor het Donker', desc: 'De duisternis voelt onveilig en eng voor kleine kinderen' },
                { icon: '🔊', title: 'Omgevingsgeluiden', desc: 'Plotselinge geluiden wekken je baby steeds weer' },
                { icon: '🤱', title: 'Mist de Baarmoeder', desc: 'De constante geluiden en geborgenheid zijn weg' },
              ].map((item, i) => (
                <div key={i} className="bg-red-50 rounded-xl p-6 border border-red-100">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-lg text-[#5a4a3a] mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-[#fdf8f3] to-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#5a4a3a] text-center mb-4">
              De Droomvriendjes Oplossing
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              3 bewezen technieken in 1 knuffelbare vriend
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Volume2 className="w-10 h-10 text-blue-500" />, 
                  title: 'White Noise & Melodieën',
                  desc: '8 rustgevende geluiden waaronder white noise, hartslag en slaapliedjes',
                  stat: '80% sneller in slaap'
                },
                { 
                  icon: <Sparkles className="w-10 h-10 text-purple-500" />, 
                  title: 'Sterrenprojectie',
                  desc: 'Magische sterrenhemel in 3 kleuren creëert een veilige sfeer',
                  stat: 'Vermindert nachtangst'
                },
                { 
                  icon: <Heart className="w-10 h-10 text-pink-500" />, 
                  title: 'Knuffelbare Vriend',
                  desc: 'Superzacht materiaal geeft troost en geborgenheid',
                  stat: 'CE-gecertificeerd veilig'
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg text-center">
                  <div className="w-20 h-20 bg-[#fdf8f3] rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg text-[#5a4a3a] mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.desc}</p>
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {item.stat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips Section - Great for AI snippets */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#5a4a3a] text-center mb-12">
              7 Bewezen Tips als je Baby Niet Slaapt
            </h2>
            
            <div className="space-y-4">
              {[
                { num: 1, title: 'Creëer een vast bedtijdritueel', desc: 'Herhaling geeft zekerheid. Bad, boekje, knuffel, slapen - elke avond hetzelfde.' },
                { num: 2, title: 'Gebruik white noise of rustgevende geluiden', desc: 'Bootst de geluiden van de baarmoeder na en maskeert omgevingsgeluiden.' },
                { num: 3, title: 'Zorg voor de juiste kamertemperatuur', desc: 'Ideaal tussen 16-20°C. Te warm is de meest voorkomende oorzaak van onrust.' },
                { num: 4, title: 'Dim het licht 30 minuten voor bedtijd', desc: 'Stimuleert de aanmaak van melatonine, het slaaphormoon.' },
                { num: 5, title: 'Vermijd overprikkeling voor het slapen', desc: 'Geen schermen, druk spel of nieuwe gezichten vlak voor bedtijd.' },
                { num: 6, title: 'Gebruik een nachtlampje met zachte kleuren', desc: 'Rood of oranje licht verstoort de slaap minder dan wit of blauw licht.' },
                { num: 7, title: 'Introduceer een slaapvriend', desc: 'Een vast knuffeltje of Droomvriendje geeft vertrouwen en routine.' },
              ].map((tip) => (
                <div key={tip.num} className="flex gap-4 bg-[#fdf8f3] rounded-xl p-4">
                  <div className="w-10 h-10 bg-[#8B7355] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {tip.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#5a4a3a]">{tip.title}</h3>
                    <p className="text-gray-600">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Features */}
        <section className="py-16 px-4 bg-gradient-to-b from-[#fdf8f3] to-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#5a4a3a] text-center mb-12">
              Waarom Ouders Kiezen voor Droomvriendjes
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <Clock className="w-6 h-6" />, text: '30 minuten timer - schakelt automatisch uit' },
                { icon: <Battery className="w-6 h-6" />, text: 'USB oplaadbaar - geen batterijen nodig' },
                { icon: <Shield className="w-6 h-6" />, text: 'CE gecertificeerd - veilig vanaf 0 maanden' },
                { icon: <Star className="w-6 h-6" />, text: '4.9/5 sterren - 500+ reviews' },
                { icon: <Check className="w-6 h-6" />, text: 'Gratis verzending Nederland & België' },
                { icon: <Check className="w-6 h-6" />, text: '14 dagen bedenktijd - niet goed, geld terug' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-[#8B7355]">{item.icon}</div>
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-[#8B7355]">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Klaar voor Betere Nachten?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              10.000+ ouders gingen je voor. Probeer het 14 dagen uit - niet tevreden? Geld terug.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/product/3">
                <Button size="lg" className="bg-white text-[#8B7355] hover:bg-gray-100 text-lg px-8">
                  Bekijk de Panda Slaapknuffel
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  Alle Droomvriendjes Bekijken
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default BabySlaaptNietPage;
