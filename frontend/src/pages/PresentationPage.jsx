import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Home, Star, Users, Target, ShoppingBag, TrendingUp, MessageSquare, CheckCircle } from 'lucide-react';

const PresentationPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const slides = [
    // SLIDE 0: Title
    {
      id: 'title',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="mb-8">
            <img src="/logo.svg" alt="Droomvriendjes" className="h-24 mx-auto mb-6" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#5a4a3a] mb-6">
            Performance Max Briefing
          </h1>
          <p className="text-2xl text-[#8B7355] mb-8">
            Droomvriendjes.nl - Marketing Briefing
          </p>
          <div className="flex gap-6 mt-8">
            <img src="/products/sheep/Sheep_front_prodcut_01.png" alt="Schaapje" className="h-32 object-contain" />
            <img src="/products/lion/Lion_Front_product_01.png" alt="Leeuw" className="h-32 object-contain" />
            <img src="/products/panda/Panda_Side_product_02.png" alt="Panda" className="h-32 object-contain" />
          </div>
        </div>
      )
    },
    // SLIDE 1: Context & Ambitie
    {
      id: 'context',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Home className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Context & Ambitie</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-100px)]">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-[#8B7355]">
                <h3 className="text-xl font-semibold text-[#5a4a3a] mb-3">Wie zijn wij?</h3>
                <p className="text-lg text-gray-700">
                  "We zijn een <strong>Nederlandse webshop</strong> voor premium slaapknuffels met sterrenprojectie"
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-400">
                <h3 className="text-xl font-semibold text-[#5a4a3a] mb-3">Ons Probleem</h3>
                <p className="text-lg text-gray-700">
                  "Ouders zoeken <strong>actief naar oplossingen</strong>, maar kennen ons merk nog niet"
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-[#5a4a3a] mb-3">Onze Kans</h3>
                <p className="text-lg text-gray-700">
                  "<strong>Performance Max</strong> om op het juiste moment zichtbaar te zijn"
                </p>
              </div>
            </div>
            
            <div className="bg-[#fdf8f3] rounded-2xl p-6 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4">
                <img src="/products/unicorn/Unicorn_Front_product_01.png" alt="Eenhoorn" className="h-40 object-contain" />
                <img src="/products/dino/Dinno_Front_product_01.png" alt="Dino" className="h-40 object-contain" />
                <img src="/products/penguin/Penguin_Front_product_01.png" alt="Pinguïn" className="h-40 object-contain" />
                <img src="/products/bearbrown/BearBrown_Front_product_01.png" alt="Beer" className="h-40 object-contain" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 2: De Klant (Empathy Map)
    {
      id: 'empathy',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">De Klant - Empathy Map</h2>
          </div>
          
          <p className="text-xl text-[#8B7355] mb-6">Wie zijn we aan het helpen?</p>
          
          <div className="grid grid-cols-2 gap-6 h-[calc(100%-150px)]">
            {/* Denkt */}
            <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                💭 Denkt
              </h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li>"Waarom slaapt mijn kind zo slecht?"</li>
                <li>"Wat hebben andere ouders geprobeerd?"</li>
                <li>"Is dit product veilig voor mijn baby?"</li>
                <li>"Hoelang gaat dit nog duren?"</li>
              </ul>
            </div>
            
            {/* Voelt */}
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
                ❤️ Voelt
              </h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li>Gefrustreerd & uitgeput</li>
                <li>Bezorgd om ontwikkeling kind</li>
                <li>Hopeloos na vele pogingen</li>
                <li>Schuldgevoel ("doe ik iets fout?")</li>
              </ul>
            </div>
            
            {/* Zegt */}
            <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
              <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                💬 Zegt
              </h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li>"Ik heb alles al geprobeerd"</li>
                <li>"Mijn partner en ik zijn op"</li>
                <li>"Heeft iemand tips?"</li>
                <li>"Die Zazu knuffel werkte niet"</li>
              </ul>
            </div>
            
            {/* Doet */}
            <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                🔍 Doet
              </h3>
              <ul className="space-y-3 text-lg text-gray-700">
                <li>Googelt "baby valt niet in slaap"</li>
                <li>Leest reviews op Bol.com</li>
                <li>Vraagt advies in Facebook groepen</li>
                <li>Vergelijkt producten online</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 3: Doelgroep
    {
      id: 'doelgroep',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Doelgroep Definitie</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-6xl mb-4">👩‍👧</div>
              <h3 className="text-2xl font-bold text-[#5a4a3a] mb-4">Primair</h3>
              <ul className="space-y-2 text-lg text-gray-700">
                <li>• Moeders, 25-40 jaar</li>
                <li>• Kinderen 0-5 jaar</li>
                <li>• Modaal+ inkomen</li>
                <li>• Online kopers</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-[#5a4a3a] mb-4">Secundair</h3>
              <ul className="space-y-2 text-lg text-gray-700">
                <li>• Grootouders (cadeau)</li>
                <li>• Kraambezoek</li>
                <li>• Babyshower gasten</li>
                <li>• Sinterklaas/Kerst</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-2xl font-bold text-[#5a4a3a] mb-4">Geografisch</h3>
              <ul className="space-y-2 text-lg text-gray-700">
                <li>• Nederland (primair)</li>
                <li>• België (Vlaanderen)</li>
                <li>• Gratis verzending NL</li>
                <li>• Focus: Randstad</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 4: Product Highlights
    {
      id: 'products',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Onze Bestsellers</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100%-100px)]">
            {[
              { name: 'Magische Eenhoorn', price: '€59.95', img: '/products/unicorn/Unicorn_Front_product_01.png', reviews: '203', badge: 'BESTSELLER' },
              { name: 'Slaperige Panda', price: '€59.95', img: '/products/panda/Panda_Side_product_02.png', reviews: '142', badge: 'NIEUW' },
              { name: 'Slimme Leeuw', price: '€49.95', img: '/products/lion/Lion_Front_product_01.png', reviews: '127', badge: 'POPULAIR' },
              { name: 'DUO Set', price: '€89.95', img: '/products/duo/Duo_Front_product_01.png', reviews: '89', badge: 'VOORDEEL' },
            ].map((product, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-lg flex flex-col">
                <div className="relative">
                  <span className="absolute top-2 left-2 bg-[#8B7355] text-white text-xs px-2 py-1 rounded-full">
                    {product.badge}
                  </span>
                  <img src={product.img} alt={product.name} className="h-36 object-contain mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-[#5a4a3a] mt-4">{product.name}</h3>
                <p className="text-2xl font-bold text-[#8B7355]">{product.price}</p>
                <div className="flex items-center gap-1 mt-2 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-gray-500 text-sm ml-1">({product.reviews})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // SLIDE 5: USPs
    {
      id: 'usps',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Waarom Droomvriendjes?</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6 h-[calc(100%-100px)]">
            {[
              { icon: '🌟', title: 'Sterrenprojectie', desc: '3 kleuren, magische sterrenhemel op het plafond' },
              { icon: '🎵', title: '8 Slaapliedjes', desc: 'Rustgevende melodieën + white noise + natuurgeluiden' },
              { icon: '⏰', title: '30 Min Timer', desc: 'Automatische uitschakeling, geen batterijverspilling' },
              { icon: '🔋', title: 'USB Oplaadbaar', desc: 'Geen batterijen nodig, milieuvriendelijk' },
              { icon: '🧸', title: 'CE Gecertificeerd', desc: 'Veilig voor baby\'s vanaf 0 maanden' },
              { icon: '📦', title: 'Gratis Verzending', desc: 'Binnen 1-2 dagen in huis + 14 dagen retour' },
            ].map((usp, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-4">
                <div className="text-5xl">{usp.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-[#5a4a3a]">{usp.title}</h3>
                  <p className="text-lg text-gray-600 mt-1">{usp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // SLIDE 6: See, Think, Do, Care Framework
    {
      id: 'stdc',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">See, Think, Do, Care</h2>
          </div>
          <p className="text-xl text-[#8B7355] mb-6">Budget verdelen op basis van de klantreis</p>
          
          <div className="grid grid-cols-2 gap-4 h-[calc(100%-140px)]">
            {/* SEE */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-700">SEE</h3>
                  <span className="text-sm text-purple-600">Awareness fase</span>
                </div>
              </div>
              <p className="text-gray-700 mb-3">Mensen weten nog niet dat ze het nodig hebben, tot ze het zien.</p>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-semibold text-purple-800">📺 Demand Gen Campagnes</p>
                <p className="text-sm text-gray-600">YouTube & Gmail - Focus op de magie van de knuffels</p>
              </div>
            </div>
            
            {/* THINK */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤔</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-700">THINK</h3>
                  <span className="text-sm text-blue-600">Consideration fase</span>
                </div>
              </div>
              <p className="text-gray-700 mb-3">Mensen zoeken actief naar oplossingen voor hun probleem.</p>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-semibold text-blue-800">🔍 Search Ads</p>
                <p className="text-sm text-gray-600">"hulp bij slapen baby" / "nachtlampje kind" - Pijn + Oplossing</p>
              </div>
            </div>
            
            {/* DO */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-700">DO</h3>
                  <span className="text-sm text-green-600">Conversion fase</span>
                </div>
              </div>
              <p className="text-gray-700 mb-3">Klaar om te kopen - prijs en titel moeten perfect zijn.</p>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-semibold text-green-800">🛍️ Google Shopping</p>
                <p className="text-sm text-gray-600">"Droomvriendjes® Slaaphulp - Rustgevende Knuffel met Sterrenhemel"</p>
              </div>
            </div>
            
            {/* CARE */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border-2 border-orange-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❤️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-orange-700">CARE</h3>
                  <span className="text-sm text-orange-600">Loyalty fase</span>
                </div>
              </div>
              <p className="text-gray-700 mb-3">Mandje verlaters & bestaande klanten terugwinnen.</p>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-semibold text-orange-800">🔄 Remarketing</p>
                <p className="text-sm text-gray-600">"Beste aankoop van het jaar!" - Reviews van andere ouders</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 7: Performance Max Strategie
    {
      id: 'strategy',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Performance Max Strategie</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-100px)]">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#8B7355]">Asset Groups</h3>
              
              <div className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500">
                <h4 className="font-bold text-lg">1. Algemeen - Slaapproblemen</h4>
                <p className="text-gray-600">"Baby slaapt niet" / "Kind bang in donker"</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow border-l-4 border-green-500">
                <h4 className="font-bold text-lg">2. Product Specifiek</h4>
                <p className="text-gray-600">Eenhoorn, Panda, Leeuw - aparte targeting</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow border-l-4 border-purple-500">
                <h4 className="font-bold text-lg">3. Cadeau / Seizoen</h4>
                <p className="text-gray-600">Kraamcadeau, Sinterklaas, Kerst</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow border-l-4 border-orange-500">
                <h4 className="font-bold text-lg">4. Competitor</h4>
                <p className="text-gray-600">"Zazu alternatief" / Merkloze zoektermen</p>
              </div>
            </div>
            
            <div className="bg-[#fdf8f3] rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-[#8B7355] mb-4">KPI Targets</h3>
              
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">ROAS Target</span>
                    <span className="text-2xl font-bold text-green-600">4:1</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">CPA Target</span>
                    <span className="text-2xl font-bold text-blue-600">€15</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Maandbudget</span>
                    <span className="text-2xl font-bold text-[#8B7355]">€2.500</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Learning Phase</span>
                    <span className="text-2xl font-bold text-purple-600">2-4 weken</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 7: Koppen & Copy
    {
      id: 'copy',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-10 h-10 text-[#8B7355]" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Headlines & Copy</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-100px)]">
            <div>
              <h3 className="text-2xl font-bold text-[#8B7355] mb-4">Korte Koppen (30 tekens)</h3>
              <div className="space-y-3">
                {[
                  'De liefste slaapknuffels',
                  'Sneller in slaap vallen',
                  'Magische sterrenhemel',
                  'Geen slapeloze nachten',
                  'Veilig & CE gecertificeerd',
                ].map((h, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow flex items-center gap-3">
                    <span className="bg-[#8B7355] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">{i+1}</span>
                    <span className="text-lg">{h}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-[#8B7355] mb-4">Lange Koppen (90 tekens)</h3>
              <div className="space-y-3">
                {[
                  'Help je kindje rustig in slaap vallen met de Magische Eenhoorn',
                  'Creëer een veilige slaapkamer met onze sterrenprojector knuffels',
                  'Al 5000+ ouders geholpen: Droomvriendjes voor betere nachten',
                ].map((h, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow">
                    <div className="flex items-start gap-3">
                      <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">{i+1}</span>
                      <span className="text-lg">{h}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 8: Volgende Stappen
    {
      id: 'next-steps',
      content: (
        <div className="h-full px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <h2 className="text-4xl font-bold text-[#5a4a3a]">Volgende Stappen</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-100px)]">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-[#8B7355] mb-4">Wat we nodig hebben</h3>
              
              {[
                { num: 1, title: 'Merchant Center Review', desc: 'Feed optimalisatie & goedkeuring' },
                { num: 2, title: 'Asset Creatie', desc: 'Video briefing + lifestyle foto\'s' },
                { num: 3, title: 'Tracking Setup', desc: 'Conversie tracking verificatie' },
                { num: 4, title: 'Campagne Launch', desc: 'Start met €50/dag testbudget' },
              ].map((step) => (
                <div key={step.num} className="bg-white rounded-xl p-4 shadow flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#8B7355] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#5a4a3a]">{step.title}</h4>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-[#8B7355] to-[#6d5a45] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Vragen voor Emergent.sg</h3>
              
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">❓</span>
                  <span>Realistische launch datum?</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">❓</span>
                  <span>Video essentieel of later toevoegen?</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">❓</span>
                  <span>Budget voldoende voor learning phase?</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">❓</span>
                  <span>Seasonal strategie Q4?</span>
                </li>
              </ul>
              
              <div className="mt-8 pt-6 border-t border-white/30">
                <p className="text-xl font-semibold">Doel: Launch binnen 2 weken</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // SLIDE 9: Contact
    {
      id: 'contact',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <img src="/logo.svg" alt="Droomvriendjes" className="h-20 mb-8" />
          
          <h2 className="text-5xl font-bold text-[#5a4a3a] mb-8">
            Bedankt voor uw tijd!
          </h2>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-xl">
            <h3 className="text-2xl font-bold text-[#8B7355] mb-6">Contact</h3>
            
            <div className="space-y-4 text-left text-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🌐</span>
                <span>www.droomvriendjes.nl</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">📧</span>
                <span>info@droomvriendjes.nl</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">📍</span>
                <span>Nederland</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-6 mt-8">
            <img src="/products/sheep/Sheep_front_prodcut_01.png" alt="Product" className="h-24 object-contain opacity-50" />
            <img src="/products/lion/Lion_Front_product_01.png" alt="Product" className="h-24 object-contain opacity-50" />
            <img src="/products/panda/Panda_Side_product_02.png" alt="Product" className="h-24 object-contain opacity-50" />
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f3] to-[#f5ebe0] flex flex-col">
      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
          {slides[currentSlide].content}
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="bg-white border-t shadow-lg py-4 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Progress */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-gray-600">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8B7355] transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Slide Dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentSlide ? 'bg-[#8B7355] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="p-3 rounded-xl bg-[#8B7355] text-white hover:bg-[#6d5a45] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors ml-2"
              title="Fullscreen (F)"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Keyboard hints */}
        <div className="max-w-6xl mx-auto mt-2 text-center text-sm text-gray-400">
          Gebruik ← → pijltjestoetsen of spatiebalk om te navigeren • F voor fullscreen
        </div>
      </div>
    </div>
  );
};

export default PresentationPage;
