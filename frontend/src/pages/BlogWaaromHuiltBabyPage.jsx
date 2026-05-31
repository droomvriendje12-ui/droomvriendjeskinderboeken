import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostLayout from '../components/BlogPostLayout';
import BlogDigitalProductCallout from '../components/BlogDigitalProductCallout';
import { useDigitalProduct } from '../hooks/useDigitalProduct';

const BlogWaaromHuiltBabyPage = () => {
  const sleepTracker = useDigitalProduct('digital-sleep-tracker');
  return (
  <BlogPostLayout
    category="Babyslaap"
    categoryColor="bg-rose-100 text-rose-800"
    slug="waarom-huilt-baby-s-nachts"
    title="Waarom huilt mijn baby 's nachts? 10 oorzaken en wat je eraan kunt doen"
    excerpt="Je baby huilt elke nacht en je weet niet meer wat je moet doen? In deze gids leggen we de 10 meest voorkomende oorzaken uit én geven we praktische slaaptips waar je vanavond nog mee kunt beginnen."
    date="18 mei 2026"
    readMinutes={9}
    heroImage="https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/waarom-huilt-baby-s-nachts.jpg"
    toc={[
      { id: 'honger', label: 'Honger en dorst' },
      { id: 'luier', label: 'Volle luier of huidirritatie' },
      { id: 'temperatuur', label: 'Te warm of te koud' },
      { id: 'overprikkeling', label: 'Overprikkeling' },
      { id: 'doorslaap', label: 'Doorslaapproblemen na 6 maanden' },
      { id: 'tandjes', label: 'Tandjes krijgen' },
      { id: 'groeispurt', label: 'Groeispurt of regressie' },
      { id: 'reflux', label: 'Reflux of buikkrampjes' },
      { id: 'angst', label: 'Verlatingsangst' },
      { id: 'omgeving', label: 'Slaapomgeving niet rustgevend' },
      { id: 'tips', label: 'Direct toepasbare slaaptips' },
    ]}
    faqs={[
      {
        q: 'Tot welke leeftijd is nachtelijk huilen normaal?',
        a: 'Tot ongeveer 3 maanden is meerdere keren wakker worden en huilen volkomen normaal — je baby moet eten en heeft nog geen dag/nacht-ritme. Vanaf 6 maanden zouden de meeste baby\'s 6-8 uur achter elkaar kunnen slapen. Blijft je baby na 9 maanden meerdere keren per nacht huilen, dan is het verstandig met je consultatiebureau of een slaapcoach te overleggen.'
      },
      {
        q: 'Helpt een nachtlampje tegen huilen?',
        a: 'Ja, een zacht nachtlampje met sterrenprojectie of warm licht creëert een geborgen, herkenbare omgeving. Baby\'s en peuters die wakker worden, zien direct iets vertrouwds en kalmeren sneller. Combineer het met witte ruis (white noise) voor het beste effect.'
      },
      {
        q: 'Wat is het verschil tussen een huil-baby en een normaal huilende baby?',
        a: 'Een huil-baby (krijserbaby) huilt minimaal 3 uur per dag, minimaal 3 dagen per week, gedurende minimaal 3 weken (de "regel van drie"). Is dit het geval, overleg dan altijd met een arts om medische oorzaken uit te sluiten.'
      },
      {
        q: 'Hoe lang mag ik mijn baby \'s nachts laten huilen?',
        a: 'Bij baby\'s onder 6 maanden adviseren experts om altijd binnen 5 minuten te reageren. Tussen 6-12 maanden kun je voorzichtig "wachten en sussen" toepassen: 2-3 minuten wachten, dan even sussen zonder uit bed te halen. Volg altijd je gevoel — een baby die paniek heeft, kalmeert niet vanzelf.'
      },
      {
        q: 'Wat helpt direct als mijn baby \'s nachts huilt?',
        a: 'Doorloop deze checklist: 1) controleer luier, 2) bied borst of fles, 3) check temperatuur (handen/voeten en nek), 4) zet white noise aan, 5) wieg zacht of leg een hand op de buik, 6) zet nachtlampje aan met rustgevend licht. Reageer altijd rustig en zacht — je eigen kalmte is besmettelijk.'
      },
    ]}
    relatedProducts={[
      { id: 8, name: 'Liggend Schaapje - Nachtlampje met Sterrenprojectie', emoji: '🐑' },
      { id: 2, name: 'Slaperig Schaapje - Interactief Nachtlampje', emoji: '🐑' },
      { id: 7, name: 'Bruine Beertje - Nachtlampje met Witte Ruis', emoji: '🧸' },
    ]}
  >
    <p>
      Geen geluid op de wereld snijdt zo door je hart als je baby die om 03:17 weer huilt. Je staat op,
      voor de derde keer die nacht, en denkt: <em>"waarom?"</em>. Het frustrerende: er is bijna nooit
      één oorzaak. Maar door <strong>10 mogelijke verklaringen</strong> systematisch af te vinken,
      kom je vrijwel altijd uit op een patroon dat je kunt aanpakken.
    </p>

    <h2 id="honger">1. Honger en dorst — vooral in de eerste 6 maanden</h2>
    <p>
      Pasgeboren baby\'s hebben een maagje ter grootte van een walnoot. Ze moeten gemiddeld
      elke 2-3 uur drinken, ook \'s nachts. Vanaf ongeveer 6 maanden kunnen veel baby\'s 6-8 uur
      doorslapen zonder voeding. Vraag je consultatiebureau of jouw baby al klaar is om door te slapen.
    </p>

    <h2 id="luier">2. Een volle luier of huidirritatie</h2>
    <p>
      Sommige baby\'s zijn gevoeliger voor een natte of vieze luier dan andere. Vooral bij rode
      billetjes of luierdermatitis is de prikkeling \'s nachts ondraaglijk. Wissel de luier zonder
      fel licht aan te doen — gebruik een zacht, warm nachtlampje.
    </p>

    <h2 id="temperatuur">3. Te warm of te koud</h2>
    <p>
      De ideale kamertemperatuur voor een baby is <strong>16-18°C</strong>. Voel niet aan handjes
      en voetjes (die zijn altijd koeler) maar leg je hand in de nek of op de borst. Trillen of zweten
      zijn duidelijke signalen.
    </p>

    <h2 id="overprikkeling">4. Overprikkeling van de dag</h2>
    <p>
      Veel bezoek gehad? Druk geweest op het kinderdagverblijf? Een overprikkelde baby kan moeilijker
      tot rust komen, en dat uit zich juist 's nachts. Bouw 1-2 uur voor het slapen een rustig
      bedtijdritueel op: gedimd licht, zachte muziek of <Link to="/knuffels" className="underline">white noise via een nachtlampje-knuffel</Link>,
      en geen schermen meer.
    </p>

    <h2 id="doorslaap">5. Doorslaapproblemen na 6 maanden</h2>
    <p>
      Na 6 maanden is meerdere keren per nacht huilen vaak een aangeleerde gewoonte: je baby is
      gewend om in slaap te vallen mét jou erbij. Wakker worden = paniek. Een rustgevende{' '}
      <Link to="/knuffels" className="underline">slaapknuffel met sterrenprojectie</Link> kan helpen omdat je kind
      iets vertrouwds heeft om naar te kijken, ook als jij er niet bent.
    </p>

    <h2 id="tandjes">6. Tandjes krijgen</h2>
    <p>
      Vanaf 4 maanden kunnen de eerste tandjes komen. Symptomen: kwijlen, op alles bijten, rode
      wangen, lichte koorts. Een gekoelde bijtring overdag en zacht koel washandje aanbieden helpt.
      \'s Nachts kun je in overleg met je arts paracetamol-zetpil geven.
    </p>

    <h2 id="groeispurt">7. Groeispurt of slaapregressie</h2>
    <p>
      Op vaste momenten (rond 4, 8, 12 en 18 maanden) zijn er slaapregressies: je baby slaapt slecht
      gedurende 1-2 weken. Houd het ritme vast — het gaat vanzelf weer over.
    </p>

    <h2 id="reflux">8. Reflux of buikkrampjes</h2>
    <p>
      Krommen, optrekken van beentjes, doorschijnend braken kort na voeding? Praat met je
      consultatiebureau of huisarts. Soms helpt het hoofdje wat hoger leggen of voedingsadvies.
    </p>

    <h2 id="angst">9. Verlatingsangst (vanaf 8 maanden)</h2>
    <p>
      Tussen 8-18 maanden ontstaat bij veel kinderen verlatingsangst. Ze begrijpen dat je weg bent,
      maar nog niet dat je terugkomt. Een vaste knuffel als{' '}
      <Link to="/knuffels" className="underline">vertrouwd troostvriendje</Link> geeft een houvast.
    </p>

    <h2 id="omgeving">10. De slaapomgeving is niet rustgevend</h2>
    <p>
      Te licht, te donker, te stil, te druk — elk kind heeft een voorkeur. Test wat werkt:
    </p>
    <ul>
      <li><strong>Warm gedimd licht</strong> (geen blauw, geen wit) van een nachtlampje</li>
      <li><strong>White noise of natuurgeluiden</strong> rond 50-60 decibel</li>
      <li><strong>Vaste plek</strong> voor de favoriete knuffel</li>
      <li><strong>Geen stoeren of klokkengeluiden</strong> in de buurt</li>
    </ul>

    <h2 id="tips">Direct toepasbare slaaptips (deze week)</h2>
    <ol>
      <li><strong>Vast bedritueel</strong> — elke avond identiek, in dezelfde volgorde: bad → pyjama → boekje → knuffel → licht uit.</li>
      <li><strong>Zelfde wektijd, ook in het weekend.</strong> Dit zet de biologische klok.</li>
      <li><strong>Slaapcue introduceren</strong>: een specifiek liedje of zachte witte-ruis-geluid dat je baby leert associëren met slapen.</li>
      <li><strong>Eén keer per week iets veranderen</strong>, niet alles tegelijk. Geef het 5-7 dagen kans.</li>
      <li><strong>Houd een slaapdagboek</strong> bij gedurende 2 weken. Patronen zie je pas op papier.</li>
    </ol>

    <BlogDigitalProductCallout
      product={sleepTracker}
      teaser='Geen zin om elke ochtend een leeg notitieboekje te pakken? Wij maakten een kant-en-klare 30-dagen slaaplog waarin je in 10 seconden invult wanneer je baby is wakker geworden — perfect om aan je consultatiebureau te laten zien.'
      benefits={[
        '30 dagen op één pagina — patronen zichtbaar in een oogopslag',
        'Vakjes voor voeding, luier, huilen en slaaptijden',
        'Direct printen op A4, klaar bij het ochtendkoffie',
      ]}
      ctaLabel="Bekijk de slaaplog"
    />

    <p className="mt-8 italic text-stone-600">
      Bij twijfel: een huilende baby is <em>nooit</em> "gewoon vervelend". Het is communicatie.
      Geef het tijd, vraag hulp aan je consultatiebureau of een slaapcoach, en weet dat dit fase
      vrijwel altijd voorbijgaat. Je doet het goed.
    </p>
  </BlogPostLayout>
  );
};

export default BlogWaaromHuiltBabyPage;
