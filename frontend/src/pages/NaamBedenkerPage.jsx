import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Star, ChevronRight, Heart, Shield, Moon, Users, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { products as allProducts } from '../mockData';
import CartSidebar from '../components/CartSidebar';
import Footer from '../components/Footer';

const NaamBedenkerPage = () => {
  const { addToCart, setIsCartOpen } = useCart();

  // Select bestseller products - only show IN STOCK products
  // Product IDs: 7=Beer, 11=Panda, 12=Baby Slaapmaatje Schaap (all in stock)
  const selectedProductIds = [7, 11, 12];
  const landingProducts = allProducts
    .filter(p => selectedProductIds.includes(p.id) && p.inStock !== false)
    .map(p => ({
      ...p,
      landingBadge: p.id === 7 ? "BESTSELLER" : p.id === 11 ? "POPULAIR" : "FAVORIET",
    }));

  // Reviews from satisfied customers
  const reviews = [
    {
      name: "Lisa",
      context: "Moeder van Emma (8 maanden)",
      rating: 5,
      text: "Onze dochter sliep nooit langer dan 2 uur achter elkaar. Na een week met de Droomvriendjes slaapt ze nu 5-6 uur! Wij zijn zo dankbaar dat we dit hebben ontdekt.",
      product: "Beer Sterrenprojector"
    },
    {
      name: "Mark",
      context: "Vader van tweeling (6 maanden)",
      rating: 5,
      text: "Met een tweeling is slapen een uitdaging. De Droomvriendjes helpen enorm bij het creëren van een vast slaapritueel. De zachte geluiden kalmeren beiden kinderen.",
      product: "Slaapknuffel Duo"
    },
    {
      name: "Sandra",
      context: "Moeder van Lucas (3 jaar)",
      rating: 5,
      text: "Lucas was bang in het donker en wilde elke nacht bij ons slapen. Met zijn Droomvriendje voelt hij zich veilig en slaapt hij nu trots in zijn eigen bed!",
      product: "Panda Projector Knuffel"
    }
  ];

  // FAQ items about Droomvriendjes
  const faqs = [
    {
      question: "Hoe is Droomvriendjes ontstaan?",
      answer: "Droomvriendjes is ontstaan uit persoonlijke ervaring. Als ouders van kinderen die moeite hadden met slapen, gingen we op zoek naar een oplossing. We ontdekten dat de combinatie van zacht licht, kalmerende geluiden en een knuffelvriend wonderen kan verrichten. Omdat dit product niet bestond, maakten we het zelf."
    },
    {
      question: "Wat betekent de naam Droomvriendjes?",
      answer: "De naam Droomvriendjes combineert 'Ouji' (Japans voor prins) en 'Kidz' (kinderen). Want elk kind verdient koninklijke rust en de beste slaap. Onze knuffels zijn letterlijk vriendjes die helpen bij het dromen."
    },
    {
      question: "Zijn Droomvriendjes veilig voor baby's?",
      answer: "Ja, alle Droomvriendjes zijn CE-gecertificeerd en voldoen aan alle Europese veiligheidsnormen. De materialen zijn hypoallergeen en vrij van schadelijke stoffen. Geschikt vanaf 0 maanden."
    },
    {
      question: "Wat als het niet werkt voor mijn kind?",
      answer: "U heeft 14 dagen om het uit te proberen. Werkt het niet voor uw kind? Dan krijgt u uw geld volledig terug, zonder vragen. We willen dat u zeker bent van uw keuze."
    },
    {
      question: "Hoelang gaat de batterij mee?",
      answer: "De batterijen gaan gemiddeld 4-6 weken mee bij dagelijks gebruik. De knuffel schakelt automatisch uit na 15, 30 of 60 minuten - u kiest zelf."
    }
  ];

  const handleAddToCart = (product) => {
    addToCart({
      ...product,
      quantity: 1
    });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f5f9f5]">
      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_plush-revamp/artifacts/npuc23bl_lgoo%20ads%20%281%29.png" 
                alt="Droomvriendjes.nl" 
                className="h-16 w-auto"
              />
            </Link>
            <a href="#producten">
              <Button className="bg-white border-2 border-[#2d5a3d] text-[#2d5a3d] hover:bg-[#f5f9f5] rounded-full px-6">
                Bekijk knuffels <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-block bg-white border border-[#c5d9c8] rounded-full px-4 py-2 text-sm text-[#2d5a3d] mb-6">
                Het Verhaal Achter Droomvriendjes
              </span>
              
              <h1 className="text-4xl md:text-5xl font-bold text-[#2d5a3d] mb-6 leading-tight">
                Slaapknuffels voor<br />
                <span className="text-[#3d7a4d]">Rustiger Slapen</span>
              </h1>
              
              <p className="text-lg text-[#5a7a5a] mb-8 leading-relaxed">
                Herken je dit? Lange nachten, een huilend kindje dat maar niet tot rust komt, en het gevoel dat je alles al hebt geprobeerd. Wij snappen het, want wij hebben het zelf meegemaakt.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="text-[#2d5a3d] mt-1 w-5 h-5 flex-shrink-0" />
                  <span className="text-[#4a6a4a]"><strong>Wetenschappelijk onderbouwd</strong> — Ontwikkeld op basis van slaaponderzoek</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="text-[#2d5a3d] mt-1 w-5 h-5 flex-shrink-0" />
                  <span className="text-[#4a6a4a]"><strong>100% veilig</strong> — CE-gecertificeerd en voldoet aan alle Europese veiligheidsnormen</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="text-[#2d5a3d] mt-1 w-5 h-5 flex-shrink-0" />
                  <span className="text-[#4a6a4a]"><strong>Door ouders, voor ouders</strong> — Wij begrijpen de uitdagingen van slapeloze nachten</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="text-[#2d5a3d] mt-1 w-5 h-5 flex-shrink-0" />
                  <span className="text-[#4a6a4a]"><strong>Bewezen effectief</strong> — 86% van de kinderen slaapt rustiger met Droomvriendjes</span>
                </li>
              </ul>
              
              <div className="flex items-center space-x-6">
                <a href="#producten">
                  <Button className="bg-[#2d5a3d] hover:bg-[#234a31] text-white rounded-full px-8 py-6 text-lg">
                    Ontdek Onze Slaapknuffels
                  </Button>
                </a>
                <span className="text-sm text-[#5a7a5a]">14 dagen retourgarantie</span>
              </div>
            </div>
            
            {/* Right - Hero Product */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <img 
                  src={landingProducts[0]?.image || "/products/Lion/Lion_Front_product_01.png"}
                  alt="Droomvriendjes Slaapknuffel"
                  className="w-full h-auto max-h-96 object-contain mx-auto"
                />
                <div className="text-center mt-6">
                  <p className="text-[#2d5a3d] font-semibold text-lg">Onze bestseller</p>
                  <p className="text-[#5a7a5a]">Helpt duizenden kinderen beter slapen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2d5a3d] mb-4">
              Onze Missie: Betere Nachten voor het Hele Gezin
            </h2>
            <p className="text-lg text-[#5a7a5a] max-w-3xl mx-auto">
              Elk kind verdient een goede nachtrust. En elke ouder ook. Daarom hebben we Droomvriendjes ontwikkeld: kalmerende slaapknuffels die kinderen helpen ontspannen en beter slapen.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-8 h-8 text-[#2d5a3d]" />
              </div>
              <h3 className="text-xl font-bold text-[#2d5a3d] mb-2">Zacht Nachtlampje</h3>
              <p className="text-[#5a7a5a]">Geeft geborgenheid zonder te prikkelen. Perfecte verlichting voor een rustige nacht.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#e3f2fd] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-[#1976d2]" />
              </div>
              <h3 className="text-xl font-bold text-[#2d5a3d] mb-2">Rustgevende Geluiden</h3>
              <p className="text-[#5a7a5a]">White noise, hartslag en natuurgeluiden die bewezen helpen bij het inslapen.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#fce4ec] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-[#e91e63]" />
              </div>
              <h3 className="text-xl font-bold text-[#2d5a3d] mb-2">Knuffelbaar Object</h3>
              <p className="text-[#5a7a5a]">Veiligheid en comfort in één. Iets zachts om vast te houden geeft geborgenheid.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="producten" className="py-16 bg-[#f5f9f5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2d5a3d] mb-4">
              Onze Populairste Droomvriendjes
            </h2>
            <p className="text-lg text-[#5a7a5a]">
              Kies de perfecte slaapvriend voor jouw kind
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landingProducts.map((product) => (
              <Card key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative">
                  <span className="absolute top-4 left-4 bg-[#2d5a3d] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {product.landingBadge}
                  </span>
                  <div className="p-6 bg-gradient-to-b from-[#f5f9f5] to-white">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-contain mx-auto"
                    />
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#2d5a3d] mb-2">{product.name}</h3>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">({product.reviews} reviews)</span>
                  </div>
                  <p className="text-[#5a7a5a] text-sm mb-4">{product.description?.substring(0, 80)}...</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#2d5a3d]">€{product.price}</span>
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-[#2d5a3d] hover:bg-[#234a31] text-white rounded-full px-6"
                    >
                      Bestel nu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/knuffels">
              <Button variant="outline" className="border-2 border-[#2d5a3d] text-[#2d5a3d] hover:bg-[#f5f9f5] rounded-full px-8 py-6">
                Bekijk alle slaapknuffels <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2d5a3d] mb-4">
              Wat Ouders Zeggen
            </h2>
            <p className="text-lg text-[#5a7a5a]">
              Meer dan 1.000 tevreden Nederlandse gezinnen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <Card key={index} className="bg-[#f5f9f5] rounded-2xl p-6 border-0">
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[#4a6a4a] mb-4 italic">"{review.text}"</p>
                <div className="border-t border-[#c5d9c8] pt-4">
                  <p className="font-semibold text-[#2d5a3d]">{review.name}</p>
                  <p className="text-sm text-[#5a7a5a]">{review.context}</p>
                  <p className="text-xs text-[#7a9a7a] mt-1">Gebruikt: {review.product}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#2d5a3d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">86%</p>
              <p className="text-[#a5d6a7]">slaapt rustiger</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">1000+</p>
              <p className="text-[#a5d6a7]">tevreden gezinnen</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">4.8★</p>
              <p className="text-[#a5d6a7]">gemiddelde score</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">14</p>
              <p className="text-[#a5d6a7]">dagen retourgarantie</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-[#f5f9f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2d5a3d] mb-4">
              Veelgestelde Vragen
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl px-6 border-0 shadow-sm"
              >
                <AccordionTrigger className="text-left text-[#2d5a3d] font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#5a7a5a] pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] rounded-3xl p-8 md:p-12">
            <Users className="w-16 h-16 text-[#2d5a3d] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-[#2d5a3d] mb-4">
              Word Deel van Onze Familie
            </h2>
            <p className="text-lg text-[#5a7a5a] mb-8 max-w-2xl mx-auto">
              Sluit je aan bij meer dan 1.000 tevreden Nederlandse gezinnen die elke nacht beter slapen dankzij Droomvriendjes.
            </p>
            <Link to="/knuffels">
              <Button className="bg-[#2d5a3d] hover:bg-[#234a31] text-white rounded-full px-10 py-6 text-lg">
                Ontdek Onze Slaapknuffels
              </Button>
            </Link>
            <p className="text-sm text-[#5a7a5a] mt-6">
              Gratis verzending vanaf €35 | 14 dagen niet goed, geld terug
            </p>
          </div>
        </div>
      </section>

      <Footer variant="green" />
    </div>
  );
};

export default NaamBedenkerPage;
