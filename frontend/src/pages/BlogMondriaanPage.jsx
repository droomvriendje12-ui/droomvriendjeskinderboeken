import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostLayout from '../components/BlogPostLayout';

const BlogMondriaanPage = () => (
  <BlogPostLayout
    category="Mentale rust"
    categoryColor="bg-amber-100 text-amber-900"
    slug="droomvriendjes-mondriaan-samenwerking"
    title="Rust in de avond: hoe slaap bijdraagt aan mentale veerkracht bij kinderen"
    excerpt="In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Praktische rustmomenten en een slaapritueel dat haalbaar blijft maken een groot verschil voor kinderen én ouders."
    date="19 januari 2025"
    readMinutes={8}
    heroImage="https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/bearbrown-main.png"
    toc={[
      { id: 'slaap-mentaal', label: 'Waarom slaap en mentale rust bij elkaar horen' },
      { id: 'slaapritueel', label: 'Een slaapritueel dat vol te houden is' },
      { id: 'preventie', label: 'Vroegsignalering en mentale veerkracht' },
      { id: 'praktisch', label: 'Praktische tips voor ouders' },
      { id: 'veerkracht', label: 'Samen bouwen aan veerkracht' },
    ]}
    faqs={[
      {
        q: 'Hoeveel slaap heeft een kind écht nodig?',
        a: 'Globale richtlijnen: peuters (1-3 jaar) 11-14 uur per dag, kleuters (3-5 jaar) 10-13 uur, schoolkinderen (6-12 jaar) 9-12 uur, tieners (13-18 jaar) 8-10 uur. Inclusief eventueel middagdutje.'
      },
      {
        q: 'Hoe weet ik of mijn kind genoeg slaapt?',
        a: 'Drie signalen: \'s ochtends moeilijk wakker worden, prikkelbaar of huilerig overdag, en grote energiedips na schooltijd. Houd 2 weken een slaapdagboek bij — patronen worden dan zichtbaar.'
      },
      {
        q: 'Wat als mijn kind blijft piekeren in bed?',
        a: 'Maak een vast "afkoel-moment" 30 min voor het slapen: gedimd licht, geen schermen, korte ademhalingsoefening of een rustig boekje. Een vaste troostknuffel of zacht nachtlampje helpt om vertrouwen op te bouwen in de avond.'
      },
      {
        q: 'Wanneer is het verstandig om hulp te zoeken?',
        a: 'Bij aanhoudende slaapproblemen langer dan 4 weken, heftige angst die het dagelijks functioneren belemmert, of zorgen over mentale gezondheid van je kind: neem contact op met je huisarts of consultatiebureau. Zij kunnen doorverwijzen naar gespecialiseerde zorg.'
      },
      {
        q: 'Vervangt een knuffel professionele hulp?',
        a: 'Nee — een Droomvriendje ondersteunt het slaapritueel en geeft geborgenheid, maar vervangt geen zorg. Bij heftige of langdurige problemen is professionele hulp altijd de juiste eerste stap.'
      },
    ]}
    relatedProducts={[
      { id: 3, name: 'Slaperige Panda - Voor rustige avonden', emoji: '🐼' },
      { id: 7, name: 'Bruine Beertje - Met witte ruis', emoji: '🧸' },
      { id: 8, name: 'Liggend Schaapje - Sterrenprojectie', emoji: '🐑' },
    ]}
  >
    <p>
      In een druk gezinsleven – met prikkels, schermen, volle agenda\'s en soms ook zorgen – is
      "even tot rust komen" niet altijd vanzelfsprekend. Toch is dat moment van rust, juist in de
      avond, ontzettend belangrijk voor de mentale balans van een kind. Een goede nacht begint
      vaak ver vóór bedtijd, en kleine rustmomenten in het gezin kunnen een groot verschil maken.
    </p>

    <h2 id="slaap-mentaal">Waarom slaap en mentale rust bij elkaar horen</h2>
    <p>
      Slaap en mentale gezondheid versterken elkaar. Als een kind beter tot rust komt, heeft dat
      vaak impact op het hele gezin. En andersom: wanneer er stress of onrust is, is slapen vaak
      één van de eerste dingen die onder druk komt te staan.
    </p>
    <p>
      Droomvriendjes ontwikkelt producten die rust en geborgenheid ondersteunen — denk aan zacht
      licht, sterrenprojectie en rustgevende geluiden. Doel: het bedtijdmoment voorspelbaar en
      veilig laten voelen.
    </p>

    <h2 id="slaapritueel">Een slaapritueel dat wél vol te houden is</h2>
    <p>
      Een goed slaapritueel hoeft niet perfect te zijn. Juist <strong>herhaling en eenvoud</strong>{' '}
      werken. Onze adviezen:
    </p>
    <ul>
      <li><strong>Vaste volgorde:</strong> badje → pyjama → boekje → knuffel → licht uit</li>
      <li><strong>Eén rustig moment van verbinding:</strong> 2 minuten praten of knuffelen</li>
      <li><strong>Prikkelarm afsluiten:</strong> zacht licht, geen druk spel of schermen</li>
    </ul>
    <p>
      Onze <Link to="/slaapknuffel">slaapknuffels</Link> sluiten daarop aan en helpen kinderen
      bij de overgang van "aan" naar "uit". Een nachtlampje met sterrenprojectie geeft net genoeg
      visuele rust om de kamer "vriendelijk" te maken, zonder de slaap te verstoren.
    </p>

    <h2 id="preventie">Vroegsignalering en mentale veerkracht</h2>
    <p>
      Slaap is een waardevolle, tastbare ingang voor preventie. Het is meetbaar (hoe laat naar
      bed, hoe vaak wakker), bespreekbaar in het gezin, en vaak een eerste stap richting meer
      balans als er onrust speelt.
    </p>
    <p>
      Geestelijke gezondheid bij kinderen begint vaak met kleine signalen. Door consequent te
      kijken naar het slaappatroon kun je vroeg opmerken wanneer iets niet helemaal goed gaat:
    </p>
    <ul>
      <li>Plots veel moeite met inslapen of doorslapen</li>
      <li>Toename van angsten in de avond</li>
      <li>Veranderingen in stemming overdag</li>
      <li>Klachten over hoofdpijn of buikpijn rond bedtijd</li>
    </ul>
    <p>
      Bij aanhoudende klachten is het verstandig om professionele hulp te zoeken — bv. via je
      huisarts, consultatiebureau of gespecialiseerde instanties voor jeugd-GGZ. Zij kunnen
      passende ondersteuning en behandeling bieden.
    </p>

    <h2 id="praktisch">Praktische tips voor ouders en opvoeders</h2>
    <p>
      Een paar kleine dingen die je vanavond nog kunt toepassen:
    </p>
    <ol>
      <li><strong>Rust in 20 minuten</strong> — bouw een korte avondroutine met vaste stappen die je 5-7 dagen volhoudt voordat je iets verandert.</li>
      <li><strong>Een aftelkaart</strong> voor jonge kinderen: visueel zien "we zijn bijna in bed" werkt geruststellend.</li>
      <li><strong>Welterusten-zinnen</strong> die je elke avond herhaalt — voorspelbaarheid geeft veiligheid.</li>
      <li><strong>Een mini-checklist</strong> op de kamerdeur: tandenpoetsen, plassen, knuffel, lichtje aan, kus. Kinderen krijgen autonomie.</li>
      <li><strong>Geen schermen 1 uur voor bed</strong> — het blauwe licht verstoort de melatonine-aanmaak.</li>
    </ol>
    <p>
      Lees ook onze blog <Link to="/blog/5-tips-betere-nachtrust-kinderen">5 tips voor een betere nachtrust bij kinderen</Link>{' '}
      voor extra concrete suggesties.
    </p>

    <h2 id="veerkracht">Samen bouwen aan veerkracht in gezinnen</h2>
    <p>
      Rust komt niet "ineens" — het is iets wat je opbouwt: met herhaling, veiligheid,
      voorspelbaarheid en af en toe wat extra steun. Met de juiste tools en een werkbaar
      avondritueel kunnen gezinnen:
    </p>
    <ul>
      <li>De avond zachter af te ronden</li>
      <li>Het slapen minder strijd en meer ritueel te maken</li>
      <li>Ruimte te geven aan wat er écht speelt</li>
    </ul>

    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-5 my-6">
      <h3 className="font-bold text-amber-900 mb-2">Belangrijke noot</h3>
      <p className="text-stone-800 m-0">
        Droomvriendjes is er als <strong>ondersteuning</strong> voor ontspanning en slaapritueel,
        maar vervangt geen zorg. Bij aanhoudende slaapproblemen, heftige angst of zorgen over
        mentale gezondheid is het altijd verstandig om professionele hulp te zoeken bij je
        huisarts, consultatiebureau of een GGZ-instelling.
      </p>
    </div>

    <p>
      Een warmere avond geeft een betere start van morgen. Veel succes — en mocht je een vraag
      hebben over welk Droomvriendje past bij jouw situatie, mail gerust naar{' '}
      <a href="mailto:info@droomvriendjes.com">info@droomvriendjes.com</a>.
    </p>
  </BlogPostLayout>
);

export default BlogMondriaanPage;
