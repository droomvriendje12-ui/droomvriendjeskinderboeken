import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Gift, Heart, Star, Loader2, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';


const CadeaubonPage = () => {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    ontvanger: '',
    email: '',
    boodschap: '',
    verzender: '',
    verzenderEmail: ''
  });

  const amounts = [25, 50, 75, 100];

  const getFinalAmount = () => {
    return customAmount ? parseFloat(customAmount) : selectedAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const amount = getFinalAmount();
    if (amount < 10) {
      setError('Minimaal bedrag is €10');
      setIsLoading(false);
      return;
    }

    try {
      // Use the dedicated gift card purchase endpoint
      const response = await fetch(`/api/gift-card/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          sender_name: formData.verzender,
          sender_email: formData.verzenderEmail,
          recipient_name: formData.ontvanger,
          recipient_email: formData.email,
          message: formData.boodschap
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Betaling aanmaken mislukt');
      }

      if (data.checkout_url) {
        // Redirect to Mollie checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Geen checkout URL ontvangen');
      }

    } catch (err) {
      console.error('Gift card purchase error:', err);
      setError(err.message || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout backButtonText="Terug naar Home">
      {/* Hero */}
      <div className="bg-warm-brown-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Gift className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Droomvriendjes Cadeaubon</h1>
          <p className="text-xl text-warm-brown-100 max-w-3xl mx-auto">
            Het perfecte cadeau voor betere nachten en meer rust
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Benefits */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Waarom een Droomvriendjes Cadeaubon?</h2>
            <div className="space-y-6">
              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-warm-brown-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-warm-brown-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Betekenisvol Cadeau</h3>
                      <p className="text-slate-600">Geef het cadeau van rust en betere nachtrust. Perfect voor nieuwe ouders, verjaardagen of gewoon omdat het kan!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-warm-brown-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-warm-brown-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Vrije Keuze</h3>
                      <p className="text-slate-600">De ontvanger kan zelf kiezen uit al onze kalmerende knuffels en producten. Iedereen krijgt wat gewenst wordt!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-warm-brown-100">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-warm-brown-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-warm-brown-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Direct Verzonden</h3>
                      <p className="text-slate-600">Na betaling wordt de cadeaubon direct per email verstuurd naar de ontvanger. Geen wachttijd!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 bg-warm-brown-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-3">Hoe werkt het?</h3>
              <ol className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-warm-brown-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">1</span>
                  <span>Kies het bedrag en vul de gegevens in</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-warm-brown-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">2</span>
                  <span>Betaal veilig via iDEAL of creditcard</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-warm-brown-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">3</span>
                  <span>De ontvanger krijgt direct de cadeaubon per email</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-warm-brown-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">4</span>
                  <span>De ontvanger kan direct shoppen!</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Right: Order Form */}
          <div>
            <Card className="border-2 border-warm-brown-100 sticky top-24">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Bestel Je Cadeaubon</h2>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Kies een bedrag</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {amounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount('');
                          }}
                          className={`p-4 rounded-lg border-2 font-bold text-lg transition-all ${
                            selectedAmount === amount && !customAmount
                              ? 'border-warm-brown-500 bg-warm-brown-50 text-slate-900'
                              : 'border-slate-200 hover:border-warm-brown-300'
                          }`}
                        >
                          €{amount}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      placeholder="Of voer een eigen bedrag in (min. €10)"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(0);
                      }}
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>

                  {/* Recipient Info */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Naam ontvanger *</label>
                    <Input
                      required
                      value={formData.ontvanger}
                      onChange={(e) => setFormData({...formData, ontvanger: e.target.value})}
                      placeholder="Voor wie is de cadeaubon?"
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email ontvanger *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@voorbeeld.nl"
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Hier wordt de cadeaubon naartoe gestuurd</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Persoonlijke boodschap</label>
                    <Textarea
                      value={formData.boodschap}
                      onChange={(e) => setFormData({...formData, boodschap: e.target.value})}
                      placeholder="Schrijf een persoonlijke boodschap..."
                      rows={4}
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Jouw naam *</label>
                    <Input
                      required
                      value={formData.verzender}
                      onChange={(e) => setFormData({...formData, verzender: e.target.value})}
                      placeholder="Van wie is de cadeaubon?"
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Jouw email *</label>
                    <Input
                      type="email"
                      required
                      value={formData.verzenderEmail}
                      onChange={(e) => setFormData({...formData, verzenderEmail: e.target.value})}
                      placeholder="jouw@email.nl"
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Voor de bevestiging van je betaling</p>
                  </div>

                  {/* Total */}
                  <div className="bg-warm-brown-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-900">Totaal:</span>
                      <span className="text-3xl font-bold text-warm-brown-600">
                        €{getFinalAmount().toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="w-full bg-warm-brown-500 hover:bg-warm-brown-600 text-white py-6"
                    data-testid="cadeaubon-betalen-button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Bezig met verwerken...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Betalen €{getFinalAmount().toFixed(2).replace('.', ',')}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                    <span>✓ Veilig betalen</span>
                    <span>✓ Direct verzonden</span>
                    <span>✓ 2 jaar geldig</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CadeaubonPage;
