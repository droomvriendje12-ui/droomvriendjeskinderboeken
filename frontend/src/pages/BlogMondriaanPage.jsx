import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Footer from '../components/Footer';
import RelatedArticles from '../components/RelatedArticles';

const BlogMondriaanPage = () => {
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
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 md:p-12 text-white">
            <Badge className="bg-white/20 text-white border-0 mb-4">
              Samenwerking
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Droomvriendjes.nl x Mondriaan: samen werken aan rust in de avond (en in het hoofd)
            </h1>
            <p className="text-lg md:text-xl text-purple-100 max-w-3xl">
              Een goede nacht begint vaak al ver vóór bedtijd
            </p>
          </div>
        </div>

        {/* Intro Section */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-600 p-6 rounded-r-lg mb-8">
            <p className="text-gray-700 text-lg leading-relaxed m-0">
              In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Daarom werken Droomvriendjes.nl en Mondriaan samen: om gezinnen te ondersteunen met praktische rustmomenten en een slaapritueel dat haalbaar blijft. Kleine stappen in de avond kunnen een groot verschil maken voor kinderen én ouders.
            </p>
          </div>

          <p className="text-gray-700 mb-6">
            In een druk gezinsleven – met prikkels, schermen, volle agenda's en soms ook zorgen – is "even tot rust komen" niet altijd vanzelfsprekend. Daarom zijn we blij met een samenwerking tussen Droomvriendjes.nl en Mondriaan: twee organisaties die ieder op hun eigen manier bijdragen aan meer rust, veiligheid en veerkracht bij kinderen, jongeren én ouders.
          </p>

          {/* Section 1 */}
          <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mt-12 mb-6 pb-3 border-b-2 border-purple-600">
            Waarom slaap en mentale rust bij elkaar horen
          </h2>

          <p className="text-gray-700 mb-4">
            Droomvriendjes helpt kinderen (en volwassenen) met het creëren van een fijn slaapritueel, met producten die rust en geborgenheid ondersteunen – denk aan zacht licht, sterrenprojectie en rustgevende geluiden.
          </p>

          <p className="text-gray-700 mb-6">
            Mondriaan is er voor geestelijke gezondheid in Zuid-Limburg, met een breed aanbod van preventie, ondersteuning en behandeling, en een sterke focus op herstel en veerkracht.
          </p>

          <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-8 mb-8 shadow-md">
            <h3 className="text-xl font-bold text-orange-900 mb-4">De link is simpel</h3>
            <p className="text-gray-800 m-0">
              Slaap en mentale gezondheid versterken elkaar. Als een kind beter tot rust komt, heeft dat vaak impact op het hele gezin. En andersom: wanneer er stress of onrust is, is slapen vaak één van de eerste dingen die onder druk komt te staan.
            </p>
          </div>

          {/* Section 2 */}
          <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mt-12 mb-6 pb-3 border-b-2 border-purple-600">
            Wat we samen willen bereiken
          </h2>

          <p className="text-gray-700 mb-6">
            Deze samenwerking draait niet om "snelle trucjes", maar om structurele rustmomenten – klein, haalbaar en gezinsvriendelijk.
          </p>

          <h3 className="text-xl md:text-2xl font-bold text-purple-800 mt-8 mb-4">
            1) Een slaapritueel dat wél vol te houden is
          </h3>

          <p className="text-gray-700 mb-4">
            Een goed slaapritueel hoeft niet perfect te zijn. Juist herhaling en eenvoud werken. Denk aan:
          </p>

          <ul className="space-y-3 mb-6 ml-6 list-none">
            <li className="text-gray-700">
              <strong className="text-purple-700">Vaste volgorde:</strong> badje → pyjama → boekje → knuffel → licht uit
            </li>
            <li className="text-gray-700">
              <strong className="text-purple-700">Één rustig moment van verbinding:</strong> 2 minuten praten/knuffelen
            </li>
            <li className="text-gray-700">
              <strong className="text-purple-700">Prikkelarm afsluiten:</strong> zacht licht, geen druk spel
            </li>
          </ul>

          <p className="text-gray-700 mb-6">
            Droomvriendjes sluit daarop aan met producten die kinderen helpen ontspannen in de overgang van "aan" naar "uit".
          </p>

          <h3 className="text-xl md:text-2xl font-bold text-purple-800 mt-8 mb-4">
            2) Meer aandacht voor preventie en mentale veerkracht
          </h3>

          <p className="text-gray-700 mb-4">
            Mondriaan zet nadrukkelijk in op preventie en vroegsignalering: het herkennen van signalen en het tijdig versterken van weerbaarheid.
          </p>

          <p className="text-gray-700 mb-6">
            Slaap is daarbij een waardevolle, tastbare ingang: het is meetbaar (hoe laat naar bed, hoe vaak wakker), bespreekbaar en vaak een eerste stap richting meer balans.
          </p>

          <h3 className="text-xl md:text-2xl font-bold text-purple-800 mt-8 mb-4">
            3) Praktische content voor ouders en opvoeders
          </h3>

          <p className="text-gray-700 mb-4">
            Samen willen we ouders en verzorgers ondersteunen met laagdrempelige informatie, zoals:
          </p>

          <ul className="space-y-2 mb-6 ml-6 list-disc">
            <li className="text-gray-700">Tips voor een rustiger bedtijdmoment</li>
            <li className="text-gray-700">Omgaan met nachtelijke onrust of angsten</li>
            <li className="text-gray-700">Het verschil tussen "niet willen" en "niet kunnen" slapen</li>
            <li className="text-gray-700">Routines bij overprikkeling of spanning</li>
          </ul>

          {/* Section 3 */}
          <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mt-12 mb-6 pb-3 border-b-2 border-purple-600">
            Kleine prikkels, groot effect: rust in 20 minuten
          </h2>

          <p className="text-gray-700 mb-6">
            Omdat elke organisatie en doelgroep anders is, kun je deze samenwerking ook als basis gebruiken voor je eigen invulling. Denk bijvoorbeeld aan:
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Concrete initiatieven</h3>
            <ul className="space-y-3 list-none">
              <li className="text-gray-700">
                <strong className="text-blue-700">Slaapritueel-toolkit:</strong> een download met stappenplan, aftelkaartjes, "welterusten-zinnen" en een mini-checklist
              </li>
              <li className="text-gray-700">
                <strong className="text-blue-700">Workshops / webinars:</strong> korte sessies voor ouders (bijv. "Rust in de avond in 20 minuten")
              </li>
              <li className="text-gray-700">
                <strong className="text-blue-700">Voorlichtingsmomenten:</strong> bij preventie-activiteiten of gezinsgerichte initiatieven
              </li>
              <li className="text-gray-700">
                <strong className="text-blue-700">Actie met maatschappelijke impact:</strong> bijvoorbeeld een donatie- of kortingsactie voor gezinnen die extra ondersteuning kunnen gebruiken
              </li>
            </ul>
          </div>

          <p className="text-gray-700 mb-6">
            Mondriaan werkt veel samen met een breed netwerk en zet in op ondersteuning in de eigen omgeving – daar sluiten dit soort praktische initiatieven mooi op aan.
          </p>

          {/* Section 4 */}
          <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mt-12 mb-6 pb-3 border-b-2 border-purple-600">
            Samen bouwen aan veerkracht in gezinnen
          </h2>

          <p className="text-gray-700 mb-6">
            We geloven dat rust niet "ineens" komt. Het is iets wat je opbouwt: met herhaling, veiligheid, voorspelbaarheid en af en toe wat extra steun.
          </p>

          <p className="text-gray-700 mb-4">
            Met deze samenwerking willen Droomvriendjes.nl en Mondriaan gezinnen helpen om:
          </p>

          <ul className="space-y-2 mb-8 ml-6 list-disc">
            <li className="text-gray-700">De avond zachter af te ronden</li>
            <li className="text-gray-700">Het slapen minder strijd en meer ritueel te maken</li>
            <li className="text-gray-700">Ruimte te geven aan wat er écht speelt</li>
          </ul>

          {/* Important Note */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">Belangrijke noot</h3>
            <p className="text-gray-800 m-0">
              Droomvriendjes is er als ondersteuning voor ontspanning en slaapritueel, maar vervangt geen zorg. Bij aanhoudende slaapproblemen, heftige angst of zorgen over mentale gezondheid is het verstandig om professionele hulp te zoeken. Mondriaan biedt daarin passende geestelijke gezondheidszorg en preventie.
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 md:p-10 text-center mt-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Een warmere avond = een betere start van morgen
            </h3>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Wil je meer leren over rustgevende slaaprituelen of ontdekken welke Droomvriendjes passen bij jullie avondroutine?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/knuffels">
                <Button className="bg-white text-purple-700 hover:bg-purple-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all w-full sm:w-auto px-8">
                  Bezoek Droomvriendjes.nl
                </Button>
              </Link>
              <a href="https://www.mondriaan.eu" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-purple-700 shadow-lg w-full sm:w-auto px-8">
                  Meer over Mondriaan
                </Button>
              </a>
            </div>
          </div>

          {/* Author & Date Info */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>Team Droomvriendjes</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>19 januari 2025</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>8 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <RelatedArticles currentSlug="droomvriendjes-mondriaan-samenwerking" />
      </div>

      <Footer />
    </div>
  );
};

export default BlogMondriaanPage;
