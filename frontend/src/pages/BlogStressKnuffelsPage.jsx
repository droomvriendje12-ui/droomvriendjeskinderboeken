import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, Heart, Brain, Moon, Sparkles, Baby, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Footer from '../components/Footer';
import RelatedArticles from '../components/RelatedArticles';
import BlogDigitalProductCallout from '../components/BlogDigitalProductCallout';
import { useDigitalProduct } from '../hooks/useDigitalProduct';

const BlogStressKnuffelsPage = () => {
  const affirmationCards = useDigitalProduct('digital-affirmation-cards');
  const finnBook = useDigitalProduct('digital-finn-dream-island');
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="https://i.imgur.com/IESI44c.png" 
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <Badge className="bg-white/20 text-white border-0 mb-4">
              Wetenschap
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Hoe Helpen Kalmerende Knuffels bij Stress?
            </h1>
            <p className="text-lg md:text-xl text-teal-100 max-w-3xl">
              Leer hoe onze kalmerende knuffels met licht en muziek wetenschappelijk bewezen helpen bij het verminderen van stress en angst bij kinderen.
            </p>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center space-x-6 mb-12 p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="w-5 h-5" />
            <span className="font-medium">Dr. Sarah de Vries</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>5 januari 2025</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>7 minuten</span>
          </div>
        </div>

        {/* Intro */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-teal-600 p-6 rounded-r-lg mb-8">
            <p className="text-gray-700 text-lg leading-relaxed m-0">
              In een wereld vol prikkels en drukke agenda's ervaren steeds meer kinderen stress en angst. Als ouder wil je je kind graag helpen om zich veilig en ontspannen te voelen. Kalmerende knuffels met licht en muziek blijken hierbij een effectief hulpmiddel te zijn. Maar hoe werken ze eigenlijk? En waarom zijn ze zo effectief? In deze blog duiken we in de wetenschap achter kalmerende knuffels.
            </p>
          </div>

          {/* Section 1: Zenuwstelsel */}
          <div className="flex items-center space-x-3 mb-6 mt-12">
            <div className="p-3 bg-teal-100 rounded-full">
              <Brain className="w-6 h-6 text-teal-700" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-teal-900 m-0">
              De Wetenschappelijke Basis: Het Zenuwstelsel Begrijpen
            </h2>
          </div>

          <p className="text-gray-700 mb-4">
            Om te begrijpen waarom kalmerende knuffels zo goed werken, moeten we eerst kijken naar hoe ons zenuwstelsel functioneert. Het autonome zenuwstelsel bestaat uit twee belangrijke onderdelen: het <strong>sympathische zenuwstelsel</strong> (onze vecht-of-vlucht reactie) en het <strong>parasympathische zenuwstelsel</strong> (onze rust-en-herstel modus).
          </p>

          <p className="text-gray-700 mb-4">
            Bij stress wordt het sympathische zenuwstelsel geactiveerd. Het hartritme versnelt, de ademhaling wordt oppervlakkiger en het lichaam maakt stresshormonen aan zoals cortisol en adrenaline. Voor kinderen kan deze stress veroorzaakt worden door schooldruk, sociale situaties, veranderingen in hun omgeving, of gewoon de overweldigende hoeveelheid prikkels in het dagelijks leven.
          </p>

          <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl p-8 mb-8 shadow-md">
            <h3 className="text-xl font-bold text-teal-900 mb-4">Hoe werkt het?</h3>
            <p className="text-gray-800 m-0">
              Kalmerende knuffels werken door het parasympathische zenuwstelsel te activeren. Dit zorgt ervoor dat het lichaam weer in een ruststand komt: het hartritme daalt, de ademhaling wordt dieper en rustiger, en de productie van stresshormonen neemt af.
            </p>
          </div>

          {/* Section 2: Multisensorische Stimulatie */}
          <div className="flex items-center space-x-3 mb-6 mt-12">
            <div className="p-3 bg-purple-100 rounded-full">
              <Sparkles className="w-6 h-6 text-purple-700" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-purple-900 m-0">
              De Kracht van Multisensorische Stimulatie
            </h2>
          </div>

          <p className="text-gray-700 mb-6">
            Kalmerende knuffels combineren verschillende zintuiglijke elementen die samen een krachtig kalmerend effect hebben. Laten we elk element afzonderlijk bekijken.
          </p>

          {/* Subsection: Verlichting */}
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-amber-900 mb-4">
              Zachte Verlichting: Meer dan Alleen een Nachtlampje
            </h3>
            <p className="text-gray-700 mb-4">
              Het zachte, warme licht van kalmerende knuffels heeft een directe invloed op onze hersenen. In tegenstelling tot fel blauw licht van schermen, dat ons juist alert houdt, bevordert warm, gedimd licht de aanmaak van <strong>melatonine</strong>. Dit is het hormoon dat ons lichaam vertelt dat het tijd is om tot rust te komen.
            </p>
            <p className="text-gray-700 mb-4">
              Onderzoek toont aan dat zachte verlichting ook een psychologisch effect heeft. Licht wordt geassocieerd met veiligheid en bescherming. Voor jonge kinderen die bang zijn in het donker, biedt het zachte schijnsel van een kalmerende knuffel geruststelling zonder de slaap te verstoren.
            </p>
            <p className="text-gray-700 m-0">
              Het kleurtype is ook belangrijk. <strong>Warmwit of zacht oranje licht</strong> heeft een rustgevender effect dan koel wit of blauw licht. Veel kalmerende knuffels gebruiken daarom bewust warme kleurtinten of zelfs subtiele kleurwisselingen die hypnotiserend en kalmerend werken.
            </p>
          </div>

          {/* Subsection: Muziek */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">
              Rustgevende Muziek en Geluiden: De Auditieve Omhelzing
            </h3>
            <p className="text-gray-700 mb-4">
              Geluid heeft een enorme impact op onze gemoedstoestand. Rustgevende muziek of natuurgeluiden kunnen stress significant verminderen door verschillende mechanismen.
            </p>
            <ul className="space-y-3 mb-0 list-none">
              <li className="text-gray-700">
                <strong className="text-blue-700">Langzame, ritmische geluiden</strong> zoals hartslag-imiterende beats, zachte golven of wiegeliedjes synchroniseren met de ademhaling en het hartritme van het kind. Dit fenomeen heet 'entrainment' en zorgt ervoor dat het lichaam vanzelf rustiger wordt.
              </li>
              <li className="text-gray-700">
                <strong className="text-blue-700">Witte ruis of natuurgeluiden</strong> maskeren storende omgevingsgeluiden en creëren een consistente, voorspelbare geluidsomgeving. Voor baby's herinnert witte ruis aan de geluiden in de baarmoeder.
              </li>
              <li className="text-gray-700">
                <strong className="text-blue-700">Klassieke wiegeliedjes en zachte melodieën</strong> activeren het beloningssysteem in de hersenen en kunnen positieve emoties oproepen.
              </li>
            </ul>
          </div>

          {/* Subsection: Tactiele Troost */}
          <div className="bg-pink-50 border-l-4 border-pink-500 rounded-r-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-pink-900 mb-4">
              Tactiele Troost: De Kracht van Aanraking
            </h3>
            <p className="text-gray-700 mb-4">
              Het fysieke aspect van een knuffel is misschien wel het meest onderschatte element. Zachte, pluche materialen en de mogelijkheid om de knuffel vast te houden bieden tactiele stimulatie die direct kalmerend werkt.
            </p>
            <p className="text-gray-700 mb-4">
              Aanraking activeert drukgevoelige receptoren in de huid die signalen sturen naar de hersenen om <strong>oxytocine</strong> vrij te geven. Oxytocine wordt ook wel het 'knuffelhormoon' genoemd en bevordert gevoelens van verbondenheid, veiligheid en kalmte. Het verlaagt tegelijkertijd de cortisolniveaus, waardoor stress afneemt.
            </p>
            <p className="text-gray-700 m-0">
              Een knuffel vasthouden geeft kinderen iets om zich aan vast te klampen, zowel letterlijk als figuurlijk. Het biedt een gevoel van controle en troost in momenten van onzekerheid of angst.
            </p>
          </div>

          {/* Section 3: Transitional Objects */}
          <div className="flex items-center space-x-3 mb-6 mt-12">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Heart className="w-6 h-6 text-indigo-700" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-indigo-900 m-0">
              Transitional Objects: De Psychologische Rol
            </h2>
          </div>

          <p className="text-gray-700 mb-4">
            In de ontwikkelingspsychologie worden knuffels en andere troostobjecten 'transitional objects' genoemd. Dit concept werd geïntroduceerd door kinderpsychoanalyticus <strong>Donald Winnicott</strong> en beschrijft objecten die kinderen helpen om de overgang te maken van afhankelijkheid naar onafhankelijkheid.
          </p>

          <p className="text-gray-700 mb-4">
            Een kalmerende knuffel fungeert als een veilige brug tussen de aanwezigheid van ouders en het alleen zijn. Wanneer een kind zich angstig voelt maar de ouder niet direct beschikbaar is, kan de knuffel een deel van die geruststellende aanwezigheid overnemen.
          </p>

          <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-8 mb-8 shadow-md">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">Waarom consistentie belangrijk is</h3>
            <p className="text-gray-800 m-0">
              De voorspelbaarheid van de knuffel is cruciaal. In tegenstelling tot mensen, die niet altijd beschikbaar zijn of soms onvoorspelbaar reageren, is de knuffel er altijd. Hij reageert altijd hetzelfde: met zacht licht, rustgevende muziek en een zachte aanraking. Deze consistentie geeft kinderen een gevoel van controle en veiligheid.
            </p>
          </div>

          {/* Section 4: Rituelen */}
          <div className="flex items-center space-x-3 mb-6 mt-12">
            <div className="p-3 bg-orange-100 rounded-full">
              <Moon className="w-6 h-6 text-orange-700" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-orange-900 m-0">
              Rituelen en Routines: Het Pavlov Effect
            </h2>
          </div>

          <p className="text-gray-700 mb-4">
            Wanneer een kalmerende knuffel onderdeel wordt van een vast slaapritueel of kalmeringsroutine, ontstaat er een krachtige associatie in de hersenen van het kind. Dit werkt volgens het principe van <strong>klassieke conditionering</strong>, ook wel bekend als het Pavlov-effect.
          </p>

          <p className="text-gray-700 mb-4">
            Na herhaaldelijk gebruik leert het brein van het kind dat de knuffel en de bijbehorende licht- en geluidsstimuli voorafgaan aan slaap en ontspanning. Alleen al het zien of aanraken van de knuffel kan dan een kalmerend effect hebben, omdat de hersenen anticiperen op de rustgevende ervaring die volgt.
          </p>

          <p className="text-gray-700 mb-6">
            Deze voorspelbaarheid is enorm waardevol voor kinderen, vooral voor diegenen met angst, hoogsensitiviteit of een behoefte aan structuur. Het creëert een veilige routine waarop ze kunnen vertrouwen, zelfs in onbekende of stressvolle situaties zoals een vakantie, ziekenhuisbezoek of verhuizing.
          </p>

          <BlogDigitalProductCallout
            product={affirmationCards}
            teaser='Wil je dit ritueel nog verder versterken? Voeg een vaste, kort uitgesproken zin toe — een “affirmatie”. Wij maakten 12 liefdevolle bedtijd-kaartjes die je samen met je kind kunt voorlezen. Bewezen kalmerend volgens kinderpsychologen.'
            benefits={[
              '12 zinnen zoals “Ik voel mij veilig en geborgen” — direct uitknipbaar',
              'Speciaal getoetst op woordkeuze voor 3–9 jarigen',
              'Verstevigt het Pavlov-effect dat je hierboven leest',
            ]}
            ctaLabel="Bekijk de kaartjes"
          />

          {/* Section 5: Doelgroepen */}
          <div className="flex items-center space-x-3 mb-6 mt-12">
            <div className="p-3 bg-green-100 rounded-full">
              <Baby className="w-6 h-6 text-green-700" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-green-900 m-0">
              Voor Wie Zijn Kalmerende Knuffels Vooral Effectief?
            </h2>
          </div>

          <p className="text-gray-700 mb-6">
            Hoewel veel kinderen baat kunnen hebben bij kalmerende knuffels, zijn er bepaalde groepen waarbij ze bijzonder effectief zijn:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white border-2 border-green-200 rounded-xl p-6">
              <h4 className="font-bold text-green-800 mb-2">Kinderen met angst of faalangst</h4>
              <p className="text-gray-600 text-sm m-0">Vinden troost in de constante, voorspelbare aanwezigheid van de knuffel.</p>
            </div>
            <div className="bg-white border-2 border-green-200 rounded-xl p-6">
              <h4 className="font-bold text-green-800 mb-2">Hoogsensitieve kinderen</h4>
              <p className="text-gray-600 text-sm m-0">Kunnen de gerichte, zachte stimulatie gebruiken om tot rust te komen.</p>
            </div>
            <div className="bg-white border-2 border-green-200 rounded-xl p-6">
              <h4 className="font-bold text-green-800 mb-2">Kinderen met ADHD</h4>
              <p className="text-gray-600 text-sm m-0">Kunnen de knuffel gebruiken als focuspunt om tot rust te komen.</p>
            </div>
            <div className="bg-white border-2 border-green-200 rounded-xl p-6">
              <h4 className="font-bold text-green-800 mb-2">Kinderen met slaapstoornissen</h4>
              <p className="text-gray-600 text-sm m-0">Profiteren van de rituelen en sensorische signalen die het brein voorbereiden op slaap.</p>
            </div>
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 md:col-span-2">
              <h4 className="font-bold text-green-800 mb-2">Baby's en peuters</h4>
              <p className="text-gray-600 text-sm m-0">Vinden in de knuffel een geruststellend object dat hen helpt met de overgang van dag naar nacht.</p>
            </div>
          </div>

          {/* Section 6: Wetenschappelijk Bewijs */}
          <div className="flex items-center space-x-3 mb-6 mt-12">
            <div className="p-3 bg-cyan-100 rounded-full">
              <Shield className="w-6 h-6 text-cyan-700" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-cyan-900 m-0">
              Wetenschappelijk Bewijs: Wat Zegt het Onderzoek?
            </h2>
          </div>

          <p className="text-gray-700 mb-6">
            Meerdere wetenschappelijke studies ondersteunen de effectiviteit van multisensorische kalmerende hulpmiddelen bij kinderen.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg p-6">
              <h4 className="font-bold text-cyan-900 mb-2">Muziektherapie</h4>
              <p className="text-gray-700 m-0">Een studie gepubliceerd in het Journal of Music Therapy vond dat zachte muziek bij kinderen leidde tot lagere cortisolniveaus en een verbeterde emotionele regulatie.</p>
            </div>
            <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg p-6">
              <h4 className="font-bold text-cyan-900 mb-2">Lichttherapie</h4>
              <p className="text-gray-700 m-0">Studies tonen aan dat de juiste soorten licht op het juiste moment de productie van melatonine kunnen beïnvloeden en het circadiaanse ritme kunnen ondersteunen.</p>
            </div>
            <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg p-6">
              <h4 className="font-bold text-cyan-900 mb-2">Tactiele stimulatie</h4>
              <p className="text-gray-700 m-0">Onderzoek bevestigt dat zachte, troostende aanraking de productie van oxytocine stimuleert en stresshormonen verlaagt.</p>
            </div>
          </div>

          {/* Section 7: Praktische Tips */}
          <h2 className="text-2xl md:text-3xl font-bold text-teal-900 mt-12 mb-6 pb-3 border-b-2 border-teal-600">
            Praktische Tips voor Optimaal Gebruik
          </h2>

          <p className="text-gray-700 mb-6">
            Om het maximale effect uit een kalmerende knuffel te halen, zijn hier enkele praktische tips:
          </p>

          <ul className="space-y-4 mb-8 list-none">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <div>
                <strong className="text-teal-800">Maak het onderdeel van een vaste routine.</strong>
                <p className="text-gray-600 mt-1 m-0">Gebruik de knuffel elke avond op hetzelfde moment, als onderdeel van het slaapritueel.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <strong className="text-teal-800">Laat je kind de controle hebben.</strong>
                <p className="text-gray-600 mt-1 m-0">Geef je kind de mogelijkheid om zelf de knuffel aan te zetten wanneer het zich angstig of gestrest voelt.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
              <div>
                <strong className="text-teal-800">Gebruik het ook overdag.</strong>
                <p className="text-gray-600 mt-1 m-0">Bij momenten van stress, verdriet of angst overdag kan de knuffel ook helpen om tot rust te komen.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
              <div>
                <strong className="text-teal-800">Neem het mee op reis.</strong>
                <p className="text-gray-600 mt-1 m-0">De vertrouwdheid van de knuffel kan enorm helpen bij slapen in een onbekende omgeving.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</span>
              <div>
                <strong className="text-teal-800">Combineer met andere kalmerende technieken.</strong>
                <p className="text-gray-600 mt-1 m-0">Gebruik de knuffel in combinatie met ademhalingsoefeningen, zachte massage of mindfulness voor een nog sterker effect.</p>
              </div>
            </li>
          </ul>

          <BlogDigitalProductCallout
            product={finnBook}
            teaser='De krachtigste vorm van mindfulness voor kinderen is: een verhaal waarin ze het zelf doen, zonder dat het zo aanvoelt. Ons voorleesboek “Finn en het Droomeiland” weeft 5 mindfulness-oefeningen door een avontuur — ademen wordt de wind in Finns zeilen, dankbaarheid een schat op het strand. Geen oefening, gewoon meeleven.'
            benefits={[
              '5 mindfulness-oefeningen verweven in het verhaal',
              '14 pagina’s · voorleesduur ~10 minuten',
              'Combineer met je kalmerende knuffel voor maximaal effect',
            ]}
            ctaLabel="Lees het verhaal"
          />

          {/* Conclusie */}
          <h2 className="text-2xl md:text-3xl font-bold text-teal-900 mt-12 mb-6 pb-3 border-b-2 border-teal-600">
            Conclusie
          </h2>

          <p className="text-gray-700 mb-4">
            Kalmerende knuffels zijn veel meer dan speelgoed. Ze zijn <strong>wetenschappelijk onderbouwde hulpmiddelen</strong> die op meerdere niveaus werken om stress en angst bij kinderen te verminderen. Door het combineren van zachte verlichting, rustgevende muziek en tactiele troost, activeren ze het parasympathische zenuwstelsel en helpen ze kinderen om zich veilig, ontspannen en geborgen te voelen.
          </p>

          <p className="text-gray-700 mb-8">
            Of je kind nu moeite heeft met inslapen, kampt met angst, hoogsensitief is, of gewoon behoefte heeft aan extra troost, een kalmerende knuffel kan een waardevol hulpmiddel zijn in jullie ouderlijke gereedschapskist. Het mooie is dat je niet alleen je kind helpt om zich beter te voelen, maar ook vaardigheden voor emotionele zelfredzaamheid ontwikkelt die een leven lang meegaan.
          </p>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-teal-600 to-blue-700 rounded-2xl p-8 md:p-10 text-center mt-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Klaar om je kind te helpen met stress en angst?
            </h3>
            <p className="text-teal-100 text-lg mb-8 max-w-2xl mx-auto">
              Ontdek onze wetenschappelijk onderbouwde collectie kalmerende knuffels, speciaal ontwikkeld om kinderen te helpen ontspannen en beter te slapen.
            </p>
            <Link to="/knuffels">
              <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all px-8 py-3 text-lg">
                Bekijk Onze Collectie
              </Button>
            </Link>
          </div>

          {/* Author & Date Info */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>Dr. Sarah de Vries</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>5 januari 2025</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>7 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <RelatedArticles currentSlug="hoe-helpen-kalmerende-knuffels-bij-stress" />
      </div>

      <Footer />
    </div>
  );
};

export default BlogStressKnuffelsPage;
