import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Mail, MapPin, Clock, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { trackContactFormSubmit } from '../utils/analytics';
import Layout from '../components/Layout';


const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    onderwerp: '',
    bericht: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          page_url: window.location.href
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        trackContactFormSubmit({
          ...formData,
          page_url: window.location.href
        });
        
        toast({
          title: "✅ Bericht verzonden!",
          description: "We nemen zo snel mogelijk contact met je op.",
        });
        setFormData({
          naam: '',
          email: '',
          telefoon: '',
          onderwerp: '',
          bericht: ''
        });
      } else {
        throw new Error(data.detail || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "❌ Fout",
        description: "Er ging iets mis bij het verzenden. Probeer het opnieuw of mail naar info@droomvriendjes.nl",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout backButtonText="Terug naar Home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 text-center">Contact</h1>
        <p className="text-xl text-slate-600 text-center mb-12 max-w-3xl mx-auto">
          Heb je een vraag of wil je meer informatie? Neem gerust contact met ons op. 
          We helpen je graag!
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6 text-center">
              <Mail className="w-12 h-12 text-warm-brown-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600">info@droomvriendjes.nl</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6 text-center">
              <MapPin className="w-12 h-12 text-warm-brown-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Adres</h3>
              <p className="text-slate-600">Schaesbergerweg 103</p>
              <p className="text-slate-600">6415 AD Heerlen</p>
              <p className="text-sm text-slate-500 italic mt-2">(Dit is geen bezoekadres)</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-warm-brown-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Openingstijden</h3>
              <p className="text-slate-600">Ma - Vr: 9:00 - 17:00</p>
              <p className="text-slate-600">Za - Zo: Gesloten</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Stuur ons een bericht</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Naam *</label>
                    <Input 
                      name="naam"
                      value={formData.naam}
                      onChange={handleChange}
                      placeholder="Je volledige naam"
                      required
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="je@email.nl"
                      required
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefoon</label>
                  <Input 
                    name="telefoon"
                    type="tel"
                    value={formData.telefoon}
                    onChange={handleChange}
                    placeholder="06-12345678"
                    className="border-warm-brown-200 focus:border-warm-brown-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Onderwerp *</label>
                  <Input 
                    name="onderwerp"
                    value={formData.onderwerp}
                    onChange={handleChange}
                    placeholder="Waar gaat je vraag over?"
                    required
                    className="border-warm-brown-200 focus:border-warm-brown-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Bericht *</label>
                  <Textarea 
                    name="bericht"
                    value={formData.bericht}
                    onChange={handleChange}
                    placeholder="Je bericht..."
                    required
                    rows={6}
                    className="border-warm-brown-200 focus:border-warm-brown-500"
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-warm-brown-500 hover:bg-warm-brown-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    'Verstuur Bericht'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 bg-warm-brown-50 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">Bedrijfsgegevens</h3>
            <div className="text-slate-700 space-y-1">
              <p><strong>Bedrijfsnaam:</strong> Droomvriendjes</p>
              <p><strong>KVK-nummer:</strong> 99210835</p>
              <p><strong>E-mailadres:</strong> info@droomvriendjes.nl</p>
              <p><strong>Adres:</strong> Schaesbergerweg 103, 6415 AD Heerlen</p>
              <p className="text-sm italic">(Dit is geen bezoekadres)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-warm-brown-100">
              <h4 className="font-bold text-slate-900 mb-2">Retouradres:</h4>
              <p className="text-slate-700">Centerpoort-Nieuwgraaf</p>
              <p className="text-slate-700">Geograaf 16</p>
              <p className="text-slate-700">6921 EW Duiven</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
