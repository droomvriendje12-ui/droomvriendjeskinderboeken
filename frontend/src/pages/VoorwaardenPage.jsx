import React from 'react';
import Layout from '../components/Layout';

const VoorwaardenPage = () => {
  return (
    <Layout backButtonText="Terug naar Home">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Algemene Voorwaarden</h1>
        
        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 1 - Definities</h2>
            <p className="mb-2">In deze voorwaarden wordt verstaan onder:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Ondernemer:</strong> Droomvriendjes, gevestigd aan Schaesbergerweg 103, 6415 AD Heerlen, KVK: 99210835, BTW: NL204392123B01</li>
              <li><strong>Consument:</strong> de natuurlijke persoon die niet handelt in de uitoefening van beroep of bedrijf</li>
              <li><strong>Overeenkomst:</strong> de overeenkomst tussen de ondernemer en de consument</li>
            </ul>
          </section>

          <section id="identiteit">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 2 - Identiteit van de ondernemer</h2>
            <div className="bg-warm-brown-50 rounded-xl p-6 border border-warm-brown-100">
              <p className="font-bold text-lg text-slate-900 mb-2">Droomvriendjes</p>
              <div className="space-y-1 text-slate-700">
                <p>Schaesbergerweg 103</p>
                <p>6415 AD Heerlen</p>
                <p>Nederland</p>
                <p className="text-sm italic text-slate-500">(Dit is geen bezoekadres)</p>
              </div>
              <div className="mt-4 pt-4 border-t border-warm-brown-200 space-y-1">
                <p><strong>E-mailadres:</strong> info@droomvriendjes.nl</p>
                <p><strong>KVK-nummer:</strong> 99210835</p>
                <p><strong>BTW-nummer:</strong> NL204392123B01</p>
              </div>
              <div className="mt-4 pt-4 border-t border-warm-brown-200">
                <p className="font-semibold text-slate-900 mb-2">Retouradres:</p>
                <p>Centerpoort-Nieuwgraaf</p>
                <p>Geograaf 16</p>
                <p>6921 EW Duiven</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 3 - Toepasselijkheid</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Deze algemene voorwaarden zijn van toepassing op elk aanbod van de ondernemer en op elke tot stand gekomen overeenkomst tussen ondernemer en consument.</li>
              <li>Voordat de overeenkomst wordt gesloten, wordt de tekst van deze algemene voorwaarden aan de consument beschikbaar gesteld.</li>
              <li>Indien dit redelijkerwijs niet mogelijk is, zal de ondernemer aangeven op welke wijze de algemene voorwaarden zijn in te zien en dat zij op verzoek van de consument zo spoedig mogelijk kosteloos worden toegezonden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 4 - Het aanbod</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Het aanbod bevat een volledige en nauwkeurige omschrijving van de aangeboden producten en/of diensten.</li>
              <li>De beschrijving is voldoende gedetailleerd om een goede beoordeling van het aanbod door de consument mogelijk te maken.</li>
              <li>De door de ondernemer gebruikte afbeeldingen zijn een waarheidsgetrouwe weergave van de aangeboden producten.</li>
              <li>Kennelijke vergissingen of kennelijke fouten in het aanbod binden de ondernemer niet.</li>
              <li>Elk aanbod bevat zodanige informatie, dat voor de consument duidelijk is wat de rechten en verplichtingen zijn, die aan de aanvaarding van het aanbod zijn verbonden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 5 - De overeenkomst</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>De overeenkomst komt, onder voorbehoud van het bepaalde in lid 4, tot stand op het moment van aanvaarding door de consument van het aanbod en het voldoen aan de daarbij gestelde voorwaarden.</li>
              <li>Indien de consument het aanbod langs elektronische weg heeft aanvaard, bevestigt de ondernemer onverwijld langs elektronische weg de ontvangst van de aanvaarding van het aanbod.</li>
              <li>Indien de overeenkomst elektronisch tot stand komt, treft de ondernemer passende technische en organisatorische maatregelen ter beveiliging van de elektronische overdracht van data en zorgt hij voor een veilige webomgeving.</li>
              <li>De ondernemer kan zich - binnen wettelijke kaders - op de hoogte stellen of de consument aan zijn betalingsverplichtingen kan voldoen, alsmede van al die feiten en factoren die van belang zijn voor een verantwoord aangaan van de overeenkomst op afstand.</li>
            </ul>
          </section>

          <section id="herroeping">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 6 - Herroepingsrecht</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
              <p className="font-bold text-green-800 mb-2">14 dagen bedenktijd</p>
              <p className="text-green-700">U heeft het recht om binnen een termijn van 14 dagen zonder opgave van redenen de overeenkomst te herroepen.</p>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>De herroepingstermijn verstrijkt 14 dagen na de dag waarop u of een door u aangewezen derde, die niet de vervoerder is, het goed fysiek in bezit krijgt.</li>
              <li>Om het herroepingsrecht uit te oefenen, moet u ons (Droomvriendjes, Schaesbergerweg 103, 6415 AD Heerlen, info@droomvriendjes.nl) via een ondubbelzinnige verklaring op de hoogte stellen van uw beslissing de overeenkomst te herroepen.</li>
              <li>Om de herroepingstermijn na te leven volstaat het om uw mededeling betreffende uw uitoefening van het herroepingsrecht te verzenden voordat de herroepingstermijn is verstreken.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 7 - Gevolgen van herroeping</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Als u de overeenkomst herroept, ontvangt u alle betalingen die u tot op dat moment heeft gedaan, inclusief leveringskosten, onverwijld en in ieder geval niet later dan 14 dagen nadat wij op de hoogte zijn gesteld van uw beslissing de overeenkomst te herroepen, van ons terug.</li>
              <li>Wij betalen u terug met hetzelfde betaalmiddel als waarmee u de oorspronkelijke transactie heeft verricht, tenzij u uitdrukkelijk anderszins heeft ingestemd.</li>
              <li>U dient de goederen onverwijld, doch in ieder geval niet later dan 14 dagen na de dag waarop u het besluit de overeenkomst te herroepen aan ons heeft medegedeeld, aan ons terug te zenden.</li>
            </ul>
          </section>

          <section id="betaling">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 8 - Betaling</h2>
            <div className="bg-warm-brown-50 rounded-xl p-6 mb-4 border border-warm-brown-100">
              <p className="font-bold text-slate-900 mb-3">Geaccepteerde betaalmethoden:</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded border border-warm-brown-200 text-sm">iDEAL</span>
                <span className="bg-white px-3 py-1 rounded border border-warm-brown-200 text-sm">iDEAL</span>
                <span className="bg-white px-3 py-1 rounded border border-warm-brown-200 text-sm">PayPal</span>
                <span className="bg-white px-3 py-1 rounded border border-warm-brown-200 text-sm">Creditcard</span>
                <span className="bg-white px-3 py-1 rounded border border-warm-brown-200 text-sm">Bancontact</span>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Voor zover niet later is overeengekomen dienen de door de consument verschuldigde bedragen te worden voldaan binnen 14 dagen na het ingaan van de bedenktermijn.</li>
              <li>Bij de verkoop van producten aan consumenten mag in algemene voorwaarden nimmer een vooruitbetaling van meer dan 50% worden bedongen.</li>
              <li>De consument heeft de plicht om onjuistheden in verstrekte of vermelde betaalgegevens onverwijld aan de ondernemer te melden.</li>
            </ul>
          </section>

          <section id="levering">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 9 - Levering en uitvoering</h2>
            <div className="bg-warm-brown-50 rounded-xl p-6 mb-4 border border-warm-brown-100">
              <p className="font-bold text-slate-900 mb-2">Leveringsgebied:</p>
              <p className="text-slate-700 mb-4">Wij leveren in heel Nederland en België.</p>
              <p className="font-bold text-slate-900 mb-2">Levertijd:</p>
              <p className="text-slate-700">Bestellingen die voor 23:00 worden geplaatst worden de volgende werkdag verzonden. Gemiddelde levertijd is 1-3 werkdagen.</p>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>De ondernemer zal de grootst mogelijke zorgvuldigheid in acht nemen bij het in ontvangst nemen en bij de uitvoering van bestellingen van producten.</li>
              <li>Als plaats van levering geldt het adres dat de consument aan het bedrijf kenbaar heeft gemaakt.</li>
              <li>De ondernemer zal geaccepteerde bestellingen met bekwame spoed doch uiterlijk binnen 30 dagen uitvoeren, tenzij een langere leveringstermijn is afgesproken.</li>
              <li>Het risico van beschadiging en/of vermissing van producten berust bij de ondernemer tot het moment van bezorging aan de consument.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 10 - Klachtenregeling</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Klachten over de uitvoering van de overeenkomst moeten binnen bekwame tijd, volledig en duidelijk omschreven worden ingediend bij de ondernemer, nadat de consument de gebreken heeft geconstateerd.</li>
              <li>Bij de ondernemer ingediende klachten worden binnen een termijn van 14 dagen gerekend vanaf de datum van ontvangst beantwoord.</li>
              <li>Als een klacht een voorzienbaar langere verwerkingstijd vraagt, wordt door de ondernemer binnen de termijn van 14 dagen geantwoord met een bericht van ontvangst en een indicatie wanneer de consument een meer uitvoerig antwoord kan verwachten.</li>
            </ul>
            <div className="mt-4 bg-warm-brown-50 rounded-xl p-6 border border-warm-brown-100">
              <p className="font-bold text-slate-900 mb-2">Contact voor klachten:</p>
              <p className="text-slate-700">E-mail: info@droomvriendjes.nl</p>
              <p className="text-slate-700">Wij reageren binnen 24-48 uur op werkdagen.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Artikel 11 - Geschillen</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Op overeenkomsten tussen de ondernemer en de consument waarop deze algemene voorwaarden betrekking hebben, is uitsluitend Nederlands recht van toepassing.</li>
              <li>Geschillen kunnen tevens worden voorgelegd aan de Geschillencommissie via het ODR-platform van de Europese Commissie: <a href="https://ec.europa.eu/consumers/odr" className="text-warm-brown-600 hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></li>
            </ul>
          </section>

          <section className="bg-slate-100 rounded-xl p-6">
            <p className="text-sm text-slate-600">
              <strong>Laatst bijgewerkt:</strong> Januari 2026
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Deze algemene voorwaarden zijn opgesteld in overeenstemming met de Wet Koop op Afstand en de Europese richtlijn consumentenrechten.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default VoorwaardenPage;
