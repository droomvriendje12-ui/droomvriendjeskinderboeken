import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Truck, Clock, MapPin, Package, ShieldCheck, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';

const VerzendingPage = () => {
  return (
    <Layout backButtonText="Terug naar Home">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Verzending & Levering</h1>
        
        <div className="bg-green-50 rounded-2xl p-6 mb-8 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-green-800">Gratis Verzending!</h2>
          </div>
          <p className="text-green-700">
            Alle bestellingen worden gratis verzonden naar Nederland en België. 
            Besteld voor 23:00 uur = morgen in huis!
          </p>
        </div>

        <div className="space-y-8">
          {/* Verzendtijden */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Levertijden</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-warm-brown-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Nederland</h3>
                      <p className="text-sm text-slate-600">Bezorging door PostNL</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span><strong>Voor 23:00 besteld:</strong> Volgende werkdag geleverd</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-warm-brown-500" />
                      <span><strong>Verzendkosten:</strong> Gratis</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-warm-brown-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-warm-brown-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">België</h3>
                      <p className="text-sm text-slate-600">Bezorging door DHL of PostNL</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span><strong>Levertijd:</strong> 2-3 werkdagen</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-warm-brown-500" />
                      <span><strong>Verzendkosten:</strong> Gratis</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Bestelproces */}
          <section className="bg-white rounded-2xl p-8 border-2 border-warm-brown-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Hoe werkt het bestelproces?</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-warm-brown-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">1</div>
                <h3 className="font-bold text-slate-900 mb-2">Bestel</h3>
                <p className="text-sm text-slate-600">Kies je favoriete knuffel en plaats hem in je winkelwagen</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-warm-brown-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">2</div>
                <h3 className="font-bold text-slate-900 mb-2">Betaal</h3>
                <p className="text-sm text-slate-600">Betaal veilig met iDEAL, PayPal of creditcard</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-warm-brown-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">3</div>
                <h3 className="font-bold text-slate-900 mb-2">Verzending</h3>
                <p className="text-sm text-slate-600">Wij versturen je bestelling dezelfde dag (voor 23:00)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">4</div>
                <h3 className="font-bold text-slate-900 mb-2">Ontvangst</h3>
                <p className="text-sm text-slate-600">Volgende dag kun je genieten van je Droomvriendje!</p>
              </div>
            </div>
          </section>

          {/* Track & Trace */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Track & Trace</h2>
            <Card className="border-2 border-warm-brown-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Package className="w-8 h-8 text-warm-brown-500 mt-1" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Volg je pakket</h3>
                    <p className="text-slate-600 mb-2">
                      Na verzending ontvang je automatisch een e-mail met een Track & Trace code. 
                      Hiermee kun je je pakket volgen via de website van PostNL of DHL.
                    </p>
                    <p className="text-sm text-slate-500">
                      Je ontvangt deze e-mail zodra je pakket door ons is verzonden, meestal binnen enkele uren na je bestelling.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Veilig Betalen */}
          <section className="bg-warm-brown-50 rounded-2xl p-8 border border-warm-brown-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-green-600" />
              100% Veilig Betalen
            </h2>
            <p className="text-slate-700 mb-6">
              Bij Droomvriendjes betaal je altijd veilig. Wij werken met Mollie, een gecertificeerde 
              betaalprovider die voldoet aan de hoogste beveiligingsstandaarden (PCI-DSS).
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center border border-warm-brown-200">
                <CreditCard className="w-8 h-8 text-warm-brown-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">iDEAL</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-warm-brown-200">
                <CreditCard className="w-8 h-8 text-warm-brown-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">PayPal</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-warm-brown-200">
                <CreditCard className="w-8 h-8 text-warm-brown-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">Creditcard</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-green-800 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span><strong>SSL Beveiligd:</strong> Al je gegevens worden versleuteld verzonden via een beveiligde HTTPS-verbinding.</span>
              </p>
            </div>
          </section>

          {/* Veelgestelde Vragen */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Veelgestelde Vragen over Verzending</h2>
            <div className="space-y-4">
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Wat zijn de verzendkosten?</h3>
                  <p className="text-slate-600">De verzending is volledig gratis, zowel naar Nederland als België!</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Wanneer wordt mijn bestelling verzonden?</h3>
                  <p className="text-slate-600">Bestellingen die voor 23:00 uur zijn geplaatst, worden dezelfde werkdag nog verzonden.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Kan ik mijn bestelling volgen?</h3>
                  <p className="text-slate-600">Ja, je ontvangt automatisch een e-mail met een Track & Trace code zodra je pakket is verzonden.</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-slate-900 mb-2">Wat als ik niet thuis ben?</h3>
                  <p className="text-slate-600">PostNL en DHL leveren bij de buren af of je kunt het pakket ophalen bij een servicepunt. Je ontvangt hierover een bericht.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="bg-warm-brown-500 text-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Vragen over je bestelling?</h2>
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

export default VerzendingPage;
