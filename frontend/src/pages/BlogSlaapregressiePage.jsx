import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostLayout from '../components/BlogPostLayout';
import BlogDigitalProductCallout from '../components/BlogDigitalProductCallout';
import { useDigitalProduct } from '../hooks/useDigitalProduct';

const HERO = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/slaapregressie-bij-kinderen.jpg";

const BlogSlaapregressiePage = () => {
  const sleepTracker = useDigitalProduct('digital-sleep-tracker');
  return (
    <BlogPostLayout
      category="Babyslaap"
      categoryColor="bg-rose-100 text-rose-800"
      slug="slaapregressie-bij-kinderen"
      title="Slaapregressie bij baby's en peuters: herkennen en oplossen"
      excerpt="Sliep je kind eindelijk goed en is het ineens weer wekenlang onrustig? Ontdek op welke leeftijden slaapregressie toeslaat, waarom het gebeurt en welke aanpak écht helpt om er doorheen te komen."
      date="27 mei 2026"
      readMinutes={8}
      heroImage={HERO}
      toc={[
        { id: 'wat', label: 'Wat is slaapregressie?' },
        { id: 'leeftijden', label: 'De typische leeftijden' },
        { id: 'herkennen', label: 'Hoe herken je het?' },
        { id: 'oorzaak', label: 'Waarom gebeurt het?' },
        { id: 'oplossen', label: '7 dingen die écht helpen' },
        { id: 'wanneer-arts', label: 'Wanneer naar de arts?' },
      ]}
      faqs={[
        { q: 'Hoe lang duurt een slaapregressie?', a: 'Meestal 2 tot 6 weken. Houd je ritme en bedritueel consequent vast; in de meeste gevallen herstelt de slaap daarna vanzelf. Duurt het langer dan 6 weken, overleg dan met je consultatiebureau.' },
        { q: 'Op welke leeftijd komt slaapregressie het vaakst voor?', a: 'De bekendste pieken zijn rond 4 maanden, 8-10 maanden, 12 maanden, 18 maanden en 2 jaar. De 4-maanden-regressie is permanent (het slaappatroon verandert blijvend), de andere zijn tijdelijk en hangen samen met ontwikkelingssprongen.' },
        { q: 'Moet ik mijn slaaproutine veranderen tijdens een regressie?', a: 'Nee, juist niet. Vasthouden aan een herkenbaar bedritueel geeft je kind houvast. Verander niet alles tegelijk; pas hooguit één element aan en geef het 5-7 dagen de tijd.' },
        { q: 'Helpt een knuffel of nachtlampje bij slaapregressie?', a: 'Ja. Een vertrouwde slaapknuffel of een nachtlampje met zacht licht en witte ruis geeft je kind een constante, herkenbare cue. Vooral bij regressies die samenhangen met verlatingsangst (8-18 maanden) werkt een vast troostvriendje goed.' },
      ]}
      relatedProducts={[
        { id: 8, name: 'Liggend Schaapje - Nachtlampje met Sterrenprojectie', emoji: '🐑' },
        { id: 2, name: 'Slaperig Schaapje - Interactief Nachtlampje', emoji: '🐑' },
      ]}
    >
      <p>
        Je kind sliep weken achter elkaar prima door — en plotseling is het elke nacht weer raak. Welkom
        bij de <strong>slaapregressie</strong>: een frustrerende, maar volkomen normale fase. Het goede
        nieuws? Het gaat vrijwel altijd vanzelf voorbij, zeker als je weet wat er speelt.
      </p>

      <h2 id="wat">Wat is slaapregressie precies?</h2>
      <p>
        Slaapregressie is een periode waarin een kind dat goed sliep ineens slechter slaapt: vaker wakker
        worden, moeilijk in slaap vallen of vroeg ontwaken. Het valt bijna altijd samen met een sprong in
        de ontwikkeling — motorisch, cognitief of emotioneel.
      </p>

      <h2 id="leeftijden">De typische leeftijden</h2>
      <ul>
        <li><strong>4 maanden</strong> — het slaappatroon rijpt en wordt blijvend "volwassener".</li>
        <li><strong>8-10 maanden</strong> — kruipen, opstaan én beginnende verlatingsangst.</li>
        <li><strong>12 maanden</strong> — eerste stapjes en overgang naar één dutje.</li>
        <li><strong>18 maanden</strong> — peuterpubertijd, taalontwikkeling, "nee" zeggen.</li>
        <li><strong>2 jaar</strong> — nachtmerries, zindelijkheid en grote broer/zus-veranderingen.</li>
      </ul>

      <h2 id="herkennen">Hoe herken je het?</h2>
      <p>
        Typische signalen: vaker en eerder wakker worden, langer wakker blijven 's nachts, verzet bij het
        slapengaan, kortere dutjes en meer behoefte aan nabijheid. Belangrijk: je kind is verder gezond,
        eet normaal en heeft geen koorts.
      </p>

      <h2 id="oorzaak">Waarom gebeurt het?</h2>
      <p>
        Het brein van je kind maakt een enorme ontwikkeling door. Nieuwe vaardigheden (omrollen, kruipen,
        praten) worden 's nachts "geoefend". Daarnaast spelen tandjes, een veranderde slaapbehoefte en
        verlatingsangst mee. Het is dus geen stap terug, maar een teken van groei.
      </p>

      <h2 id="oplossen">7 dingen die écht helpen</h2>
      <ol>
        <li><strong>Houd het bedritueel identiek</strong> — voorspelbaarheid is rust.</li>
        <li><strong>Bewaak de wakkertijden</strong> — een overmoe kind slaapt slechter, niet beter.</li>
        <li><strong>Bied een vast troostvriendje</strong> aan, zoals een{' '}
          <Link to="/knuffels" className="underline">slaapknuffel met sterrenprojectie</Link>.</li>
        <li><strong>Reageer rustig en kort</strong> 's nachts; te veel prikkels houden het wakker zijn in stand.</li>
        <li><strong>Zorg voor een donkere, koele kamer</strong> (16-18°C) met eventueel witte ruis.</li>
        <li><strong>Verander niet alles tegelijk</strong> — één aanpassing per week, 5-7 dagen volhouden.</li>
        <li><strong>Houd een slaapdagboek bij</strong> — patronen zie je pas zwart op wit.</li>
      </ol>

      <BlogDigitalProductCallout
        product={sleepTracker}
        teaser='Tijdens een regressie raak je het overzicht snel kwijt. Met een kant-en-klare 30-dagen slaaplog vul je in 10 seconden in wanneer je kind wakker werd — zo zie je het patroon én het herstel.'
        benefits={[
          '30 dagen op één pagina — zie direct of het beter gaat',
          'Vakjes voor voeding, dutjes, wakker worden en stemming',
          'Direct printen op A4, klaar voor je consultatiebureau',
        ]}
        ctaLabel="Bekijk de slaaplog"
      />

      <h2 id="wanneer-arts">Wanneer naar de arts?</h2>
      <p>
        Duurt de onrust langer dan 6 weken, is er koorts, gewichtsverlies of maakt je kind een zieke
        indruk? Neem dan contact op met je consultatiebureau of huisarts. Een "gewone" slaapregressie is
        vervelend, maar tijdelijk — en jij komt er samen doorheen.
      </p>
    </BlogPostLayout>
  );
};

export default BlogSlaapregressiePage;
