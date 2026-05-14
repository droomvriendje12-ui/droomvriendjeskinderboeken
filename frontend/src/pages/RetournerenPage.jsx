import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { PackageCheck, Clock, RefreshCw, Mail } from 'lucide-react';
import Layout from '../components/Layout';

const RetournerenPage = () => {
  return (
    <Layout backButtonText="Terug naar Home">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Retourneren & Ruilen</h1>
        
        <div className="bg-warm-brown-50 rounded-2xl p-6 mb-8 border border-warm-brown-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">14 Dagen Niet Goed = Geld Terug!</h2>
          <p className="text-slate-700">
            Bij Droomvriendjes mag je je bestelling binnen 14 dagen retourneren. Zonder gedoe, gratis retour!
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Hoe werkt retourneren?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-warm-brown-600">1</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Meld je retour</h3>
                  <p className="text-sm text-slate-600">Stuur een email naar info@droomvriendjes.com</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-warm-brown-600">2</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Ontvang retourlabel</h3>
                  <p className="text-sm text-slate-600">Wij sturen je een gratis retourlabel</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-warm-brown-600">3</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Verstuur pakket</h3>
                  <p className="text-sm text-slate-600">Doe het product in de doos en verstuur</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">4</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Geld terug</h3>
                  <p className="text-sm text-slate-600">Binnen 5 werkdagen krijg je je geld terug</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-warm-brown-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Belangrijke Informatie</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-6 h-6 text-warm-brown-500 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900">Retourperiode</h3>
                  <p className="text-slate-600">Je hebt 14 dagen na ontvangst om je product te retourneren.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <PackageCheck className="w-6 h-6 text-warm-brown-500 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900">Staat van het product</h3>
                  <p className="text-slate-600">Het product moet in originele staat zijn, ongebruikt en in de originele verpakking.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RefreshCw className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900">Terugbetaling</h3>
                  <p className="text-slate-600">Na ontvangst en controle krijg je binnen 5 werkdagen je geld terug op dezelfde manier als je hebt betaald.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-6 h-6 text-warm-brown-500 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900">Contact opnemen</h3>
                  <p className="text-slate-600">Stuur een email naar <a href="mailto:info@droomvriendjes.com" className="text-warm-brown-600 hover:underline">info@droomvriendjes.com</a> met je bestelnummer en de reden van retour.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Veelgestelde Vragen over Retourneren</h2>
            <div className="space-y-4">
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Zijn retourkosten gratis?</h3>
                  <p className="text-slate-600">Ja! Bij Droomvriendjes is retourneren altijd gratis. We sturen je een gratis retourlabel.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Kan ik ruilen voor een ander product?</h3>
                  <p className="text-slate-600">Ja, dat kan! Stuur een email naar info@droomvriendjes.com en geef aan welk product je wilt ruilen.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Wat als het product beschadigd is?</h3>
                  <p className="text-slate-600">Neem direct contact met ons op via info@droomvriendjes.com. We lossen dit zo snel mogelijk voor je op!</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Retouradres</h3>
                  <p className="text-slate-600 mb-2">Het retouradres:</p>
                  <p className="text-slate-700 font-medium">Centerpoort-Nieuwgraaf<br />Geograaf 16<br />6921 EW Duiven</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="bg-warm-brown-500 text-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Hulp Nodig?</h2>
            <p className="text-lg mb-6 text-warm-brown-100">Ons klantenservice team staat voor je klaar!</p>
            <Link to="/contact">
              <Button size="lg" className="bg-white text-warm-brown-600 hover:bg-warm-brown-50">
                Neem Contact Op
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RetournerenPage;
