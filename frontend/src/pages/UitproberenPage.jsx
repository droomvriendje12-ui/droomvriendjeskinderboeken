import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Gift, CheckCircle, Clock } from 'lucide-react';
import Layout from '../components/Layout';

const UitproberenPage = () => {
  return (
    <Layout backButtonText="Terug naar Home">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Gift className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">14 Dagen Gratis Uitproberen</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Niet tevreden? Geld terug. Zo simpel is het.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          <section className="text-center mb-12">
            <h2 className="text-3xl font-bold text-purple-900 mb-4">Probeer Droomvriendjes 14 Dagen Risicovrij</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              We zijn er zo van overtuigd dat jouw kind beter zal slapen met Droomvriendjes, dat we je 
              14 dagen de tijd geven om het zelf te ervaren. Werkt het niet? Dan krijg je je geld terug.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-purple-100">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-purple-600">1</span>
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Bestel</h3>
                <p className="text-gray-600 text-sm">Kies je Droomvriendjes knuffel en ontvang deze binnen 1-2 werkdagen</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Probeer</h3>
                <p className="text-gray-600 text-sm">Test de knuffel 14 dagen lang thuis bij jouw kind</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-green-600">3</span>
                </div>
                <h3 className="font-bold text-purple-900 mb-2">Besluit</h3>
                <p className="text-gray-600 text-sm">Tevreden? Mooi! Niet tevreden? Gratis retour en geld terug</p>
              </CardContent>
            </Card>
          </div>

          <section className="bg-purple-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Wat houdt 14 dagen uitproberen in?</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">Volledige 14 dagen bedenktijd</h3>
                  <p className="text-gray-600">Je hebt vanaf de ontvangstdatum 14 dagen de tijd om de knuffel uit te proberen</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">Gratis retourneren</h3>
                  <p className="text-gray-600">Stuur een email en ontvang een gratis retourlabel. Geen extra kosten!</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">Volledige terugbetaling</h3>
                  <p className="text-gray-600">Na ontvangst van je retour krijg je binnen 5 werkdagen je geld terug</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">Geen vragen, geen gedoe</h3>
                  <p className="text-gray-600">We vragen niet naar uitgebreide redenen. Niet tevreden = geld terug</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Veelgestelde Vragen</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Wanneer begint de 14 dagen periode?</h3>
                <p className="text-gray-600">De periode start op de dag dat je het product ontvangt.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Moet het product ongebruikt zijn?</h3>
                <p className="text-gray-600">Nee! Je mag de knuffel normaal gebruiken. We vragen alleen dat het product in redelijke staat is en de verpakking bewaard blijft.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Hoe meld ik een retour aan?</h3>
                <p className="text-gray-600">Stuur een email naar info@droomvriendjes.com met je bestelnummer. Je ontvangt dan direct een gratis retourlabel.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Hoelang duurt de terugbetaling?</h3>
                <p className="text-gray-600">Binnen 5 werkdagen na ontvangst van je retour wordt het bedrag teruggestort op dezelfde rekening als waarmee je hebt betaald.</p>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Klaar om het te Proberen?</h2>
            <p className="text-xl mb-6">14 dagen risicovrij uitproberen. Wat heb je te verliezen?</p>
            <Link to="/">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Bekijk Onze Knuffels
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UitproberenPage;
