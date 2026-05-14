import React from 'react';
import Layout from '../components/Layout';

const PrivacyPage = () => {
  return (
    <Layout backButtonText="Terug naar Home">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Privacy Beleid</h1>
        
        <div className="space-y-8 text-slate-700">
          <section>
            <p className="mb-4">
              Droomvriendjes, gevestigd aan Schaesbergerweg 103, 6415 AD Heerlen, is verantwoordelijk voor de verwerking 
              van persoonsgegevens zoals weergegeven in deze privacyverklaring.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contactgegevens</h2>
            <div className="bg-warm-brown-50 rounded-xl p-6 border border-warm-brown-100">
              <p className="font-bold">Droomvriendjes</p>
              <p>Schaesbergerweg 103</p>
              <p>6415 AD Heerlen</p>
              <p>KVK: 99210835</p>
              <p>BTW: NL204392123B01</p>
              <p>Email: info@droomvriendjes.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Persoonsgegevens die wij verwerken</h2>
            <p className="mb-4">Droomvriendjes verwerkt je persoonsgegevens doordat je gebruik maakt van onze diensten en/of omdat je deze gegevens zelf aan ons verstrekt.</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Voor- en achternaam</li>
              <li>Adresgegevens</li>
              <li>Telefoonnummer</li>
              <li>E-mailadres</li>
              <li>IP-adres</li>
              <li>Gegevens over jouw activiteiten op onze website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Waarom we gegevens nodig hebben</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Het afhandelen van jouw bestelling</li>
              <li>Verzenden van onze producten</li>
              <li>Je te kunnen bellen of e-mailen indien nodig</li>
              <li>Je te informeren over wijzigingen van onze diensten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Hoe lang we gegevens bewaren</h2>
            <p>Droomvriendjes bewaart je persoonsgegevens niet langer dan strikt nodig is om de doelen te realiseren waarvoor je gegevens worden verzameld.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Delen van persoonsgegevens</h2>
            <p>Droomvriendjes verstrekt uitsluitend aan derden en alleen als dit nodig is voor de uitvoering van onze overeenkomst met jou of om te voldoen aan een wettelijke verplichting.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies</h2>
            <p className="mb-4">Droomvriendjes gebruikt functionele, analytische en tracking cookies. Een cookie is een klein tekstbestand dat bij het eerste bezoek aan deze website wordt opgeslagen in de browser van je computer, tablet of smartphone.</p>
            <p>Je kunt je afmelden voor cookies door je internetbrowser zo in te stellen dat deze geen cookies meer opslaat.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Gegevens inzien, aanpassen of verwijderen</h2>
            <p className="mb-4">Je hebt het recht om je persoonsgegevens in te zien, te corrigeren of te verwijderen. Daarnaast heb je het recht om je eventuele toestemming voor de gegevensverwerking in te trekken of bezwaar te maken tegen de verwerking van jouw persoonsgegevens.</p>
            <p>Je kunt een verzoek tot inzage, correctie, verwijdering sturen naar info@droomvriendjes.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Beveiliging</h2>
            <p>Droomvriendjes neemt de bescherming van jouw gegevens serieus en neemt passende maatregelen om misbruik, verlies, onbevoegde toegang, ongewenste openbaarmaking en ongeoorloofde wijziging tegen te gaan.</p>
          </section>

          <section className="bg-warm-brown-50 rounded-xl p-6 border border-warm-brown-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Contact</h2>
            <p>Als je vragen hebt over deze privacyverklaring, neem dan contact met ons op:</p>
            <p className="mt-2">Email: info@droomvriendjes.com</p>
            <p>KVK: 99210835</p>
            <p>BTW: NL204392123B01</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
