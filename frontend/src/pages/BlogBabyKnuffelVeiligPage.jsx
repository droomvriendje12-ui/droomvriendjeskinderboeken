import React from 'react';
import { Link } from 'react-router-dom';
import BlogPostLayout from '../components/BlogPostLayout';

const HERO = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/baby-knuffel-veilig-slapen-leeftijd.jpg";

const BlogBabyKnuffelVeiligPage = () => (
  <BlogPostLayout
    category="Veilig slapen"
    categoryColor="bg-teal-100 text-teal-800"
    slug="baby-knuffel-veilig-slapen-leeftijd"
    title="Vanaf welke leeftijd mag een baby veilig met een knuffel slapen?"
    excerpt="Een knuffel in bed voelt vertrouwd, maar wanneer is het écht veilig? Lees de officiële richtlijnen, de risico's vóór 12 maanden en hoe je een knuffel stap voor stap veilig introduceert."
    date="28 mei 2026"
    readMinutes={7}
    heroImage={HERO}
    toc={[
      { id: 'kort-antwoord', label: 'Het korte antwoord' },
      { id: 'waarom', label: 'Waarom pas vanaf 12 maanden?' },
      { id: 'risico', label: 'De risico\'s vóór 1 jaar' },
      { id: 'introduceren', label: 'Een knuffel veilig introduceren' },
      { id: 'kiezen', label: 'Welke knuffel is veilig?' },
      { id: 'nachtlampje', label: 'En een nachtlampje-knuffel?' },
    ]}
    faqs={[
      { q: 'Mag een baby van 6 maanden met een knuffel slapen?', a: 'Nee. Tot 12 maanden adviseren kinderartsen en veilig-slapen-organisaties een leeg bedje: geen knuffels, kussens, dekbedden of hoofdbeschermers. Dit verlaagt het risico op wiegendood (SIDS) en verstikking. Een knuffel als troostobject mag wél overdag onder toezicht.' },
      { q: 'Vanaf welke leeftijd is een knuffel in bed wél veilig?', a: 'Vanaf ongeveer 12 maanden kan een kleine, lichte knuffel veilig mee het bedje in. Vanaf dat moment kan je kind zelfstandig het hoofd wegdraaien en de knuffel wegduwen. Begin altijd met één kleine knuffel zonder losse onderdelen.' },
      { q: 'Hoe groot mag de eerste slaapknuffel zijn?', a: 'Klein en licht. Een knuffel die kleiner is dan het hoofd van je kind en geen harde, afneembare delen heeft (kraaloogjes, knopen, lange linten) is het veiligst. Was hem regelmatig en controleer naden op slijtage.' },
      { q: 'Mag een nachtlampje-knuffel wel in de buurt van een baby onder 1 jaar?', a: 'Ja, mits hij buiten het bedje staat. Plaats een nachtlampje- of white-noise-knuffel op het nachtkastje of de commode, niet in bed. Zo profiteert je baby van het rustgevende licht en geluid zonder verstikkingsrisico.' },
    ]}
    relatedProducts={[
      { id: 8, name: 'Liggend Schaapje - Nachtlampje met Sterrenprojectie', emoji: '🐑' },
      { id: 7, name: 'Bruine Beertje - Nachtlampje met Witte Ruis', emoji: '🧸' },
    ]}
  >
    <p>
      Bijna elke ouder voelt de neiging om een zacht knuffeltje bij de baby in bed te leggen — het oogt
      schattig en geruststellend. Toch is timing hier letterlijk van levensbelang. In dit artikel lees je
      precies <strong>vanaf welke leeftijd een knuffel veilig mee mag het bedje in</strong> en hoe je dat
      verantwoord doet.
    </p>

    <h2 id="kort-antwoord">Het korte antwoord: vanaf 12 maanden</h2>
    <p>
      De meeste kinderartsen en veilig-slapen-organisaties (zoals het Nederlandse consultatiebureau en
      internationale SIDS-richtlijnen) adviseren: <strong>geen losse voorwerpen in bed tot de eerste
      verjaardag</strong>. Vanaf ongeveer 12 maanden mag een kleine, lichte knuffel mee.
    </p>

    <h2 id="waarom">Waarom pas vanaf 12 maanden?</h2>
    <p>
      Een baby onder het jaar heeft nog onvoldoende kracht en motoriek om zich te bevrijden als een knuffel
      tegen de neus of mond komt. Pas rond 12 maanden kan je kind betrouwbaar het hoofd wegdraaien, zich
      omrollen en een voorwerp actief wegduwen. Daarmee daalt het verstikkingsrisico sterk.
    </p>

    <h2 id="risico">De risico's vóór 1 jaar</h2>
    <ul>
      <li><strong>Verstikking</strong> — een knuffel kan voor neus en mond schuiven.</li>
      <li><strong>Oververhitting</strong> — extra textiel houdt te veel warmte vast.</li>
      <li><strong>Verhoogd SIDS-risico</strong> — een leeg bedje is bewezen het veiligst.</li>
    </ul>
    <p>
      Houd het bedje daarom leeg: geen knuffels, kussens, dekbedden, hoofdbeschermers of losse dekentjes.
      Gebruik in plaats daarvan een goed passende <strong>slaapzak</strong>.
    </p>

    <h2 id="introduceren">Een knuffel veilig introduceren (stappenplan)</h2>
    <ol>
      <li><strong>Wacht tot minimaal 12 maanden</strong> en je kind zich zelfstandig omrolt.</li>
      <li><strong>Kies één kleine, lichte knuffel</strong> zonder losse onderdelen.</li>
      <li><strong>Introduceer hem overdag</strong> tijdens dutjes onder toezicht, zodat je kind eraan went.</li>
      <li><strong>Maak hem onderdeel van het bedritueel</strong>: knuffel pakken hoort bij "nu gaan we slapen".</li>
      <li><strong>Controleer wekelijks</strong> de naden, oogjes en het vulsel op slijtage.</li>
    </ol>

    <h2 id="kiezen">Welke knuffel is veilig?</h2>
    <p>
      Let bij de keuze op: kleiner dan het hoofd van je kind, machinewasbaar, stevig vastgenaaide
      oogjes (geen kraaltjes of knopen) en geen lange linten of koordjes. Een{' '}
      <Link to="/knuffels" className="underline">eenvoudige, zachte slaapknuffel</Link> is ideaal als eerste vriendje.
    </p>

    <h2 id="nachtlampje">En een nachtlampje-knuffel?</h2>
    <p>
      Wil je je baby onder het jaar tóch helpen met rustig slapen, kies dan voor een{' '}
      <Link to="/knuffels" className="underline">nachtlampje-knuffel met witte ruis</Link> die je naast het bedje plaatst —
      niet erin. Zo krijgt je kind een vertrouwd, zacht lichtpunt en kalmerend geluid, terwijl het bedje
      veilig leeg blijft. Vanaf 12 maanden mag de knuffel dan geleidelijk mee onder de wol.
    </p>

    <p className="mt-8 italic text-stone-600">
      Bij twijfel geldt altijd: overleg met je consultatiebureau of kinderarts. Veilig slapen gaat boven
      alles — en gelukkig is een knuffel mét geduld straks gewoon een vertrouwd onderdeel van het slaapritueel.
    </p>
  </BlogPostLayout>
);

export default BlogBabyKnuffelVeiligPage;
