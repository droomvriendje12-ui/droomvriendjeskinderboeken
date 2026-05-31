import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Footer from '../components/Footer';
import RelatedArticles from '../components/RelatedArticles';
import BlogDigitalProductCallout from '../components/BlogDigitalProductCallout';
import { useDigitalProduct } from '../hooks/useDigitalProduct';

const BlogSlaaptipsPage = () => {
  const bedtimeChart = useDigitalProduct('digital-bedtime-chart');
  const finnBook = useDigitalProduct('digital-finn-dream-island');
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/branding/droomvriendjes-logo.png" 
                alt="Droomvriendjes.nl" 
                className="h-16 w-auto"
              />
            </Link>
            <Link to="/blogs">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar blogs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <header className="mb-12">
          <Badge className="bg-purple-100 text-purple-800 border-0 mb-4">
            Slaaptips
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            5 Tips voor een Betere Nachtrust bij Kinderen
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Ontdek de beste tips om je kind te helpen beter te slapen. Van een vaste slaaproutine tot het creëren van een rustige slaapomgeving.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Team Droomvriendjes</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Leestijd: 7 minuten</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>10 januari 2025</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-12 rounded-2xl overflow-hidden">
          <img 
            src="https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/penguin-main.png" 
            alt="Kind slaapt rustig"
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          
          {/* Intro */}
          <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r-lg mb-8">
            <p className="text-gray-700 text-lg leading-relaxed m-0">
              Als ouder weet je hoe belangrijk een goede nachtrust is voor de ontwikkeling van je kind. Toch worstelen veel gezinnen met bedtijdstrijd, nachtelijk wakker worden of moeite met inslapen. Gelukkig zijn er effectieve strategieën die echt werken. In deze blog delen we vijf bewezen tips die je vandaag nog kunt toepassen voor een betere nachtrust.
            </p>
          </div>

          {/* Tip 1 */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg font-bold">1</span>
            Creëer een Consistente Slaaproutine
          </h2>

          <p className="text-gray-700 mb-4">
            Een vaste slaaproutine is misschien wel de belangrijkste factor voor goede slaap bij kinderen. Het lichaam van je kind heeft een interne klok die gedijt bij voorspelbaarheid. Door elke avond rond dezelfde tijd dezelfde rituelen te volgen, leert het brein van je kind dat het tijd is om tot rust te komen.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Zo bouw je een effectieve slaaproutine op:</h3>
            <p className="text-gray-700 mb-4">
              Begin ongeveer een uur voor bedtijd met rustgevende activiteiten. Dit kan bijvoorbeeld zijn: een warm bad, tanden poetsen, pyjama aantrekken, een verhaaltje lezen en een knuffelmoment. De volgorde moet elke avond hetzelfde zijn, zodat je kind weet wat er komt en zich mentaal kan voorbereiden op slapen.
            </p>
            <p className="text-gray-700 m-0">
              Let op dat je deze routine ook in het weekend aanhoudt. Grote verschillen tussen doordeweekse dagen en weekenden kunnen het slaapritme verstoren. Kleine variaties zijn geen probleem, maar probeer bedtijd binnen een half uur consistent te houden.
            </p>
          </div>

          <BlogDigitalProductCallout
            product={bedtimeChart}
            teaser='Wil je niet helemaal zelf je slaapritueel uitdenken? We hebben een kant-en-klaar 7-staps schema gemaakt — print het uit en hang het op de slaapkamerdeur, zodat je kind precies weet wat er komt.'
            benefits={[
              '7 visuele stappen die elke avond hetzelfde blijven',
              'Direct uitprintbaar in A4, geen account nodig',
              'Werkt vanaf peuter tot ongeveer 8 jaar',
            ]}
            ctaLabel="Bekijk het schema"
          />

          {/* Tip 2 */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg font-bold">2</span>
            Optimaliseer de Slaapomgeving
          </h2>

          <p className="text-gray-700 mb-4">
            De slaapkamer van je kind heeft grote invloed op de slaapkwaliteit. Een optimale slaapomgeving is donker, stil, koel en comfortabel.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 mb-2">🌙 Donkerte</h4>
              <p className="text-gray-700 text-sm m-0">
                Donkerte is essentieel omdat licht de productie van melatonine remt. Investeer in goede verduisterende gordijnen. Is je kind bang in het donker? Een klein, warm nachtlampje kan helpen.
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-5">
              <h4 className="font-bold text-green-900 mb-2">🌡️ Temperatuur</h4>
              <p className="text-gray-700 text-sm m-0">
                De ideale slaapkamertemperatuur ligt tussen de 16 en 19 graden Celsius. Een te warme kamer kan ervoor zorgen dat kinderen onrustig slapen.
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Minimaliseer prikkels in de slaapkamer. Speelgoed, schermen en andere afleidingen horen niet in bed of direct in het zicht. De slaapkamer moet een plek zijn die het brein associeert met rust en slaap, niet met spelen of activiteit.
          </p>

          {/* Tip 3 */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg font-bold">3</span>
            Beperk Schermtijd voor het Slapengaan
          </h2>

          <p className="text-gray-700 mb-4">
            Het blauwe licht van tablets, smartphones en tv's onderdrukt de aanmaak van melatonine. Dit maakt het moeilijker om in slaap te vallen en vermindert de slaapkwaliteit. Daarnaast kunnen spannende content, snelle beelden of interactieve games het brein juist activeren in plaats van kalmeren.
          </p>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg mb-6">
            <h4 className="font-bold text-orange-900 mb-2">De gouden regel</h4>
            <p className="text-gray-800 m-0">
              Stop minimaal één uur voor bedtijd met alle schermen. Voor jongere kinderen is twee uur nog beter. Gebruik deze tijd voor rustige activiteiten zoals lezen, kleuren, puzzelen of rustig spelen.
            </p>
          </div>

          <p className="text-gray-700 mb-6">
            Moet je kind 's avonds nog iets op een scherm doen voor school? Zet dan een blauwe licht filter aan en houd de tijd zo kort mogelijk. En vooral: geen schermen in de slaapkamer zelf. Dit geldt ook voor opladers met knipperende lichtjes.
          </p>

          <BlogDigitalProductCallout
            product={finnBook}
            teaser='In plaats van een scherm: voorlezen is de oudste en best onderzochte manier om kinderen tot rust te krijgen. Wij schreven een voorleesboek met 5 mindfulness-oefeningen ingebed in het verhaal — Finn en zijn knuffelbeer reizen naar het Droomeiland, leren ademen en zorgen loslaten.'
            benefits={[
              '14 pagina’s · voorleesduur ~10 minuten',
              '5 mindfulness-oefeningen (ademen, dankbaarheid, zorgen loslaten)',
              'Geschikt vanaf 2 jaar, hoogtepunt rond 4–6 jaar',
            ]}
            ctaLabel="Bekijk het verhaal"
          />

          {/* Tip 4 */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg font-bold">4</span>
            Let op Voeding en Beweging Overdag
          </h2>

          <p className="text-gray-700 mb-4">
            Wat je kind overdag eet en doet, beïnvloedt de nachtrust meer dan je misschien denkt.
          </p>

          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <h4 className="font-bold text-green-900 mb-3">🏃 Beweging</h4>
            <p className="text-gray-700 m-0">
              Beweging is cruciaal voor goede slaap. Kinderen die voldoende bewegen overdag, slapen sneller in en dieper door. Zorg dat je kind elke dag minstens een uur actief beweegt, bij voorkeur buiten in het daglicht. Let wel op: intensieve beweging vlak voor bedtijd kan juist te activerend werken. Plan sportieve activiteiten daarom liefst in de ochtend of middag.
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-6 mb-6">
            <h4 className="font-bold text-yellow-900 mb-3">🍎 Voeding</h4>
            <ul className="space-y-2 text-gray-700 m-0 list-none pl-0">
              <li>• <strong>Vermijd cafeïne</strong> - ook in verborgen vorm zoals cola, energiedrankjes of chocolade</li>
              <li>• <strong>Geen zware maaltijden</strong> vlak voor bedtijd</li>
              <li>• <strong>Niet met lege maag naar bed</strong> - een licht tussendoortje zoals een banaan of glas melk kan helpen</li>
              <li>• <strong>Beperk suiker</strong> in de avonduren - suiker geeft een energiepiek</li>
            </ul>
          </div>

          {/* Tip 5 */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg font-bold">5</span>
            Gebruik Rustgevende Hulpmiddelen
          </h2>

          <p className="text-gray-700 mb-4">
            Sommige kinderen hebben extra ondersteuning nodig om tot rust te komen. Gelukkig zijn er verschillende hulpmiddelen die bewezen effectief zijn.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 rounded-xl p-5">
              <h4 className="font-bold text-purple-900 mb-2">🧸 Kalmerende knuffels</h4>
              <p className="text-gray-700 text-sm m-0">
                Knuffels met zachte lichtjes en rustgevende muziek kunnen kinderen helpen om zich veilig en ontspannen te voelen. De combinatie creëert een geruststellende omgeving die het inslapen vergemakkelijkt.
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 mb-2">🎵 Witte ruis</h4>
              <p className="text-gray-700 text-sm m-0">
                Witte ruis of natuurgeluiden kunnen effectief zijn, vooral voor kinderen die moeite hebben met inslapen of wakker worden van kleine geluiden.
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-5">
              <h4 className="font-bold text-green-900 mb-2">🛏️ Gewogen dekens</h4>
              <p className="text-gray-700 text-sm m-0">
                Gewogen dekens of knuffels bieden diepe druk stimulatie, wat een kalmerend effect heeft op het zenuwstelsel. Vooral helpend voor angstige of hoogsensitieve kinderen.
              </p>
            </div>
            <div className="bg-pink-50 rounded-xl p-5">
              <h4 className="font-bold text-pink-900 mb-2">🌬️ Ademhalingsoefeningen</h4>
              <p className="text-gray-700 text-sm m-0">
                Leer je kind rustig in en uit te ademen: vier tellen inademen, vier tellen vasthouden, vier tellen uitademen. Dit activeert het parasympathische zenuwstelsel.
              </p>
            </div>
          </div>

          {/* Conclusion */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6">
            Tot Slot
          </h2>

          <p className="text-gray-700 mb-4">
            Betere slaap begint met kleine, consistente stappen. Je hoeft niet alle tips tegelijk te implementeren. Kies er één of twee uit om mee te beginnen en bouw langzaam verder. Verandering kost tijd, dus heb geduld. Binnen een paar weken zul je vaak al merkbare verbeteringen zien.
          </p>

          <p className="text-gray-700 mb-6">
            Elke kind is uniek, dus wat voor de één werkt, werkt misschien niet voor de ander. Experimenteer met wat het beste past bij jouw kind en jullie gezinssituatie. Het belangrijkste is dat je consequent bent en je kind de tijd geeft om te wennen aan nieuwe routines.
          </p>

          <p className="text-2xl text-purple-600 font-semibold mb-8">
            Slaap lekker! 😴
          </p>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 md:p-10 text-center mt-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Hulp nodig bij het creëren van een rustgevende slaapomgeving?
            </h3>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Ontdek onze collectie kalmerende knuffels met licht en muziek, speciaal ontworpen om kinderen te helpen beter te slapen.
            </p>
            <Link to="/knuffels">
              <Button className="bg-white text-purple-700 hover:bg-purple-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all px-8 py-3 text-lg">
                Bekijk Droomvriendjes
              </Button>
            </Link>
          </div>

        </div>
      </article>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <RelatedArticles currentSlug="5-tips-betere-nachtrust-kinderen" />
      </div>

      <Footer />
    </div>
  );
};

export default BlogSlaaptipsPage;
