import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Star, Truck, RotateCcw, ShieldCheck, Gift, Sparkles } from 'lucide-react';


// Channel specific configurations
const channelConfig = {
  winkel: {
    code: 'WINKEL20',
    discount: '20%',
    title: 'Babywinkel Actie',
    subtitle: 'Exclusief voor bezoekers van onze partnerwinkel',
    color: 'bg-blue-500',
    emoji: '🏪'
  },
  kraam: {
    code: 'KRAAM10',
    discount: '€10',
    title: 'Kraamcadeau Korting',
    subtitle: 'Gefeliciteerd met de kleine! Dit is ons cadeau.',
    color: 'bg-pink-500',
    emoji: '👶'
  },
  beurs: {
    code: 'BEURS25',
    discount: '25%',
    title: 'Beurs Actie',
    subtitle: 'Speciale korting voor beursbezoeken',
    color: 'bg-purple-500',
    emoji: '🎪'
  },
  straat: {
    code: 'STRAAT15',
    discount: '15%',
    title: 'Welkom!',
    subtitle: 'Bedankt voor je interesse in Droomvriendjes',
    color: 'bg-green-500',
    emoji: '🚶'
  },
  flyer: {
    code: 'FLYER15',
    discount: '15%',
    title: 'Flyer Korting',
    subtitle: 'Speciaal voor jou!',
    color: 'bg-orange-500',
    emoji: '📄'
  },
  welkom: {
    code: 'WELKOM15',
    discount: '15%',
    title: 'Welkom bij Droomvriendjes',
    subtitle: 'Ontdek waarom 10.000+ ouders ons vertrouwen',
    color: 'bg-warm-brown-500',
    emoji: '🧸'
  }
};

const OfflineLandingPage = () => {
  const { channel } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const config = channelConfig[channel] || channelConfig.welkom;
  
  // Track visit
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch(`/api/tracking/qr-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: channel || 'direct',
            code: config.code,
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            utm_source: searchParams.get('utm_source'),
            utm_medium: searchParams.get('utm_medium'),
            utm_campaign: searchParams.get('utm_campaign')
          })
        });
      } catch (e) {
        console.log('Tracking failed silently');
      }
    };
    trackVisit();
  }, [channel, config.code, searchParams]);

  // Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(config.code);
  };

  return (
    <Layout showPromoBanner={false}>
      {/* Hero Section */}
      <div className={`${config.color} text-white py-12`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">{config.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{config.title}</h1>
          <p className="text-lg opacity-90 mb-6">{config.subtitle}</p>
          
          {/* Discount Badge */}
          <div className="inline-block bg-white text-slate-900 rounded-2xl px-8 py-4 shadow-xl">
            <p className="text-sm text-slate-500 mb-1">Jouw exclusieve korting</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-bold text-warm-brown-600">{config.discount}</span>
              <span className="text-xl">KORTING</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <code className="bg-slate-100 px-4 py-2 rounded-lg font-mono text-lg font-bold">
                {config.code}
              </code>
              <Button size="sm" variant="outline" onClick={copyCode}>
                Kopieer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="text-center p-4">
            <Truck className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="font-semibold text-sm">Gratis Verzending</p>
          </div>
          <div className="text-center p-4">
            <RotateCcw className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold text-sm">14 Dagen Retour</p>
          </div>
          <div className="text-center p-4">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="font-semibold text-sm">Veilig Betalen</p>
          </div>
          <div className="text-center p-4">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="font-semibold text-sm">4.9★ Reviews</p>
          </div>
        </div>

        {/* Problem - Solution */}
        <Card className="mb-8 border-2 border-warm-brown-200 overflow-hidden">
          <div className="bg-warm-brown-50 p-6 border-b border-warm-brown-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              😴 Slaapt jouw kind niet door?
            </h2>
            <p className="text-slate-600">
              86% van de ouders ziet verbetering binnen 2 weken met een Droomvriendje
            </p>
          </div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                <h3 className="font-bold mb-1">Sterrenprojector</h3>
                <p className="text-sm text-slate-600">Magisch sterrenplafond voor rustgevende sfeer</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <span className="text-4xl">🔊</span>
                <h3 className="font-bold mb-1 mt-2">White Noise</h3>
                <p className="text-sm text-slate-600">Rustgevende geluiden die in slaap wiegen</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <span className="text-4xl">⏱️</span>
                <h3 className="font-bold mb-1 mt-2">30 Min Timer</h3>
                <p className="text-sm text-slate-600">Automatisch uit wanneer je kind slaapt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="bg-green-50 rounded-2xl p-6 mb-8 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💬</div>
            <div>
              <p className="text-lg italic text-slate-700 mb-2">
                "Na maanden van slaapgebrek slaapt onze Emma nu elke nacht door. 
                De sterrenprojector is magisch!"
              </p>
              <p className="font-semibold text-slate-900">— Lisa, moeder van Emma (3)</p>
              <div className="flex mt-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-warm-brown-500 text-white rounded-2xl p-8">
          <Gift className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Klaar om beter te slapen?</h2>
          <p className="mb-6 opacity-90">
            Gebruik code <strong>{config.code}</strong> voor {config.discount} korting
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-warm-brown-600 hover:bg-warm-brown-50 text-lg px-8"
              onClick={() => navigate('/producten')}
            >
              Bekijk Collectie
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8"
              onClick={() => navigate('/product/1')}
            >
              Bestseller: Leeuw Leo
            </Button>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-8 text-center p-6 border-2 border-dashed border-warm-brown-300 rounded-2xl">
          <h3 className="text-xl font-bold mb-2">🛡️ 30 Nachten Slaapgarantie</h3>
          <p className="text-slate-600">
            Niet tevreden? Geld terug, geen vragen gesteld.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default OfflineLandingPage;
