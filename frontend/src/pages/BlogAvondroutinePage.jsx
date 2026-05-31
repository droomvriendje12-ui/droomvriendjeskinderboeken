import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostLayout from '../components/BlogPostLayout';
import BlogDigitalProductCallout from '../components/BlogDigitalProductCallout';
import { useDigitalProduct } from '../hooks/useDigitalProduct';

const HERO = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/avondroutine-kind-7-stappen.jpg";

const BlogAvondroutinePage = () => {
  const bedtimeChart = useDigitalProduct('digital-bedtime-chart');
  return (
    <BlogPostLayout
      category="Slaaptips"
      categoryColor="bg-amber-100 text-amber-900"
      slug="avondroutine-kind-7-stappen"
      title="Een rustgevende avondroutine in 7 stappen (met gratis printbaar schema)"
      excerpt="Een vaste avondroutine is de snelste route naar beter slapen. Volg ons stappenplan van 7 stappen en download het printbare slaapschema om het meteen in huis toe te passen."
      date="25 mei 2026"
      readMinutes={7}
      heroImage={HERO}
      toc={[
        { id: 'waarom', label: 'Waarom een vaste routine werkt' },
        { id: 'stappen', label: 'De 7 stappen' },
        { id: 'timing', label: 'Hoe laat begin je?' },
        { id: 'volhouden', label: 'Tips om vol te houden' },
        { id: 'schema', label: 'Gratis printbaar schema' },
      ]}
      faqs={[
        { q: 'Hoe lang duurt een goede avondroutine?', a: 'Houd het op 30 tot 45 minuten. Lang genoeg om echt tot rust te komen, kort genoeg om vol te houden. Begin elke avond op ongeveer hetzelfde tijdstip.' },
        { q: 'Vanaf welke leeftijd kun je een avondroutine starten?', a: 'Eigenlijk vanaf de geboorte, in eenvoudige vorm. Een baby profiteert al van een vast volgordetje (voeden, verschonen, knuffelen, slapen). Vanaf de peuterleeftijd kun je het uitbreiden met een boekje en een rustig spel.' },
        { q: 'Wat doe je als de routine niet werkt?', a: 'Verander niet alles tegelijk. Pas één element aan en geef het 5-7 dagen. Vaak ligt het aan te late timing (overmoe), te veel prikkels (schermen) of een te onrustige slaapkamer.' },
        { q: 'Helpt een knuffel of nachtlampje in de routine?', a: 'Zeker. Een vast troostvriendje of een nachtlampje met zacht licht en witte ruis wordt een herkenbaar slaapsignaal. Maak het pakken van de knuffel een vast onderdeel van stap 6.' },
      ]}
      relatedProducts={[
        { id: 8, name: 'Liggend Schaapje - Nachtlampje met Sterrenprojectie', emoji: '🐑' },
        { id: 7, name: 'Bruine Beertje - Nachtlampje met Witte Ruis', emoji: '🧸' },
      ]}
    >
      <p>
        Kinderen gedijen bij voorspelbaarheid. Een <strong>vaste avondroutine</strong> vertelt het lichaam:
        "het is bijna slaaptijd". Het resultaat? Minder strijd, sneller inslapen en rustiger nachten. Hieronder
        ons beproefde stappenplan — plus een gratis printbaar schema om aan de koelkast te hangen.
      </p>

      <h2 id="waarom">Waarom een vaste routine werkt</h2>
      <p>
        Door elke avond dezelfde handelingen in dezelfde volgorde te doen, leert het brein van je kind de
        signalen herkennen. De aanmaak van het slaaphormoon melatonine komt op gang, de hartslag daalt en je
        kind komt vanzelf in de slaapstand. Consistentie is daarbij belangrijker dan perfectie.
      </p>

      <h2 id="stappen">De 7 stappen</h2>
      <ol>
        <li><strong>Afbouwen (T-45 min)</strong> — schermen uit, lichten dimmen, rustig spel.</li>
        <li><strong>Bad of wasbeurt</strong> — warm water verlaagt daarna de lichaamstemperatuur, wat slaap bevordert.</li>
        <li><strong>Pyjama & tanden</strong> — vaste, vlotte handelingen.</li>
        <li><strong>Even bijpraten</strong> — kort napraten over de dag haalt spanning weg.</li>
        <li><strong>Voorleesboekje</strong> — één of twee boekjes, met zachte stem.</li>
        <li><strong>Knuffel & nachtlampje aan</strong> — pak het vaste{' '}
          <Link to="/knuffels" className="underline">troostvriendje</Link> en zet een zacht nachtlampje aan.</li>
        <li><strong>Welterusten & weggaan</strong> — zelfde zin, zelfde kus, dan rustig de kamer uit.</li>
      </ol>

      <h2 id="timing">Hoe laat begin je?</h2>
      <p>
        Reken terug vanaf de gewenste slaaptijd. Wil je dat je kind om 19:30 slaapt, begin dan rond 18:45 met
        afbouwen. Let op het belangrijkste signaal: een kind dat geeuwt, in de ogen wrijft of stiller wordt is
        klaar om te slapen. Wacht je te lang, dan komt het in een "tweede adem" en wordt inslapen lastiger.
      </p>

      <h2 id="volhouden">Tips om het vol te houden</h2>
      <ul>
        <li><strong>Maak het visueel</strong> met een schema dat je kind kan "afvinken".</li>
        <li><strong>Houd dezelfde wektijd aan</strong>, ook in het weekend.</li>
        <li><strong>Verdeel de routine</strong> met je partner zodat het niet altijd op één persoon neerkomt.</li>
        <li><strong>Wees flexibel op uitzonderingen</strong> (verjaardag, vakantie) maar pak daarna direct het ritme weer op.</li>
      </ul>

      <BlogDigitalProductCallout
        product={bedtimeChart}
        teaser='Wil je de 7 stappen meteen visueel maken? Ons printbare bedtijdschema laat je kind elke stap zelf afvinken — kinderen vinden dat geweldig en werken zo veel makkelijker mee.'
        benefits={[
          'Kleurrijk stappenschema dat kinderen zelf bijhouden',
          'Direct printen op A4 — hang het aan de koelkast of slaapkamerdeur',
          'Maakt de avondroutine een spelletje in plaats van een strijd',
        ]}
        ctaLabel="Bekijk het bedtijdschema"
      />

      <h2 id="schema">Gratis printbaar schema</h2>
      <p>
        Een visueel schema is dé sleutel om de routine vol te houden. Bekijk ons{' '}
        <Link to="/pro" className="underline">printbare bedtijdschema en andere slaap-printables</Link> — direct als PDF in
        je inbox en onbeperkt te printen. Zo wordt slapengaan iets waar je kind naar uitkijkt.
      </p>

      <p className="mt-8 italic text-stone-600">
        Onthoud: de magie zit in de herhaling. Geef een nieuwe routine minstens een week, blijf rustig en
        consequent, en je zult merken dat de avonden steeds soepeler verlopen.
      </p>
    </BlogPostLayout>
  );
};

export default BlogAvondroutinePage;
