import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostLayout from '../components/BlogPostLayout';

const HERO = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/witte-ruis-white-noise-baby.jpg";

const BlogWitteRuisPage = () => (
  <BlogPostLayout
    category="Wetenschap"
    categoryColor="bg-violet-100 text-violet-800"
    slug="witte-ruis-white-noise-baby"
    title="Witte ruis voor baby's: helpt white noise écht bij slapen?"
    excerpt="White noise is overal, maar werkt het ook? We leggen uit wat witte ruis met de babyslaap doet, hoe je het veilig gebruikt en welk volume nog verantwoord is."
    date="26 mei 2026"
    readMinutes={6}
    heroImage={HERO}
    toc={[
      { id: 'wat', label: 'Wat is witte ruis?' },
      { id: 'werkt', label: 'Werkt het echt?' },
      { id: 'waarom', label: 'Waarom het kalmeert' },
      { id: 'veilig', label: 'Veilig gebruik & volume' },
      { id: 'afbouwen', label: 'Hoe bouw je het af?' },
    ]}
    faqs={[
      { q: 'Is witte ruis veilig voor baby\'s?', a: 'Ja, mits verantwoord gebruikt. Houd het volume onder ongeveer 50 decibel (zacht, vergelijkbaar met een douche op afstand) en plaats het apparaat minimaal 1,5 tot 2 meter van het bedje. Gebruik het niet de hele nacht op vol volume.' },
      { q: 'Welk volume witte ruis is verantwoord?', a: 'Experts adviseren maximaal rond de 50 dB ter hoogte van het kind. Een handige vuistregel: kun je er een normaal gesprek bovenuit voeren, dan staat het goed. Te hard en te dichtbij kan op termijn het gehoor belasten.' },
      { q: 'Mag white noise de hele nacht aanblijven?', a: 'Het mag, maar veel ouders kiezen voor een timer of een toestel dat na het inslapen zachter wordt. Zo voorkom je gewenning aan een constant geluid en geef je het gehoor rust.' },
      { q: 'Wat is het verschil tussen witte ruis en natuurgeluiden?', a: 'Witte ruis is een gelijkmatig "shhh"-geluid dat storende geluiden maskeert. Natuurgeluiden (regen, zee) werken vergelijkbaar maar zijn variabeler. Veel nachtlampje-knuffels bieden beide, zodat je kunt kiezen wat jouw kind het prettigst vindt.' },
    ]}
    relatedProducts={[
      { id: 7, name: 'Bruine Beertje - Nachtlampje met Witte Ruis', emoji: '🧸' },
      { id: 8, name: 'Liggend Schaapje - Nachtlampje met Sterrenprojectie', emoji: '🐑' },
    ]}
  >
    <p>
      Van een ingebouwd geluidje in de knuffel tot een aparte white-noise-machine: <strong>witte ruis</strong>{' '}
      is niet meer weg te denken uit de babykamer. Maar werkt het echt, of is het vooral een hype? Tijd voor
      een nuchtere, wetenschappelijk onderbouwde blik.
    </p>

    <h2 id="wat">Wat is witte ruis precies?</h2>
    <p>
      Witte ruis is een gelijkmatig geluid waarin alle hoorbare frequenties even sterk aanwezig zijn — het
      bekende zachte "shhh". Het lijkt op het geluid dat een baby negen maanden lang in de baarmoeder hoorde:
      een constante, ruisende achtergrond.
    </p>

    <h2 id="werkt">Werkt het echt?</h2>
    <p>
      Meerdere studies wijzen erop dat veel baby's met witte ruis sneller in slaap vallen en minder snel
      wakker schrikken van plotselinge geluiden. Het is geen wondermiddel — niet elk kind reageert er
      hetzelfde op — maar voor een groot deel van de baby's is het een effectief, drempelloos hulpmiddel.
    </p>

    <h2 id="waarom">Waarom het kalmeert</h2>
    <ul>
      <li><strong>Herkenning</strong> — het lijkt op de vertrouwde baarmoedergeluiden.</li>
      <li><strong>Maskering</strong> — het dempt plotselinge geluiden (deur, hond, broertje) die je kind anders wakker maken.</li>
      <li><strong>Cue</strong> — het geluid wordt een vast signaal: "nu is het slaaptijd".</li>
    </ul>

    <h2 id="veilig">Veilig gebruik & volume</h2>
    <p>
      Het belangrijkste aandachtspunt is <strong>volume en afstand</strong>. Houd het geluid onder ongeveer
      50 decibel en plaats de bron minimaal 1,5 tot 2 meter van het hoofdje. Een{' '}
      <Link to="/knuffels" className="underline">nachtlampje-knuffel met witte ruis</Link> die je naast (niet ín) het bedje
      zet, is hiervoor ideaal: zacht geluid, een rustgevend lichtpunt en op veilige afstand.
    </p>

    <h2 id="afbouwen">Hoe bouw je het af?</h2>
    <p>
      Maak je je zorgen over gewenning? Dat hoeft meestal niet, maar je kunt het rustig afbouwen: verlaag
      geleidelijk het volume over een aantal weken, of gebruik een timer die het geluid na het inslapen
      uitzet. De meeste kinderen hebben white noise vanzelf niet meer nodig zodra hun slaap stabiel is.
    </p>

    <p className="mt-8 italic text-stone-600">
      Kortom: witte ruis is een veilig en vaak effectief hulpmiddel — als je let op volume en afstand. Combineer
      het met een vast bedritueel en een zacht nachtlampje voor het beste resultaat.
    </p>
  </BlogPostLayout>
);

export default BlogWitteRuisPage;
