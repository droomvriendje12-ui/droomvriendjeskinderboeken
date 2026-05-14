import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ShieldCheck, Truck, CreditCard } from 'lucide-react';

/**
 * Footer Component - Consistent Warm Brown Theme
 * Uitgebreid met alle verplichte bedrijfsinformatie voor Google Merchant compliance
 */
const Footer = () => {
  return (
    <footer className="bg-warm-brown-900 text-warm-brown-100">
      {/* Trust Badges Section */}
      <div className="border-b border-warm-brown-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-8 h-8 text-warm-brown-400 mb-2" />
              <p className="font-semibold text-white text-sm">14 Dagen Retour</p>
              <p className="text-xs opacity-70">Niet tevreden? Geld terug!</p>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-8 h-8 text-warm-brown-400 mb-2" />
              <p className="font-semibold text-white text-sm">Gratis Verzending</p>
              <p className="text-xs opacity-70">In heel Nederland & België</p>
            </div>
            <div className="flex flex-col items-center">
              <CreditCard className="w-8 h-8 text-warm-brown-400 mb-2" />
              <p className="font-semibold text-white text-sm">Veilig Betalen</p>
              <p className="text-xs opacity-70">iDEAL, PayPal, Creditcard</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 flex items-center justify-center mb-2">
                <span className="text-2xl">⭐</span>
              </div>
              <p className="font-semibold text-white text-sm">4.9/5 Trustpilot</p>
              <p className="text-xs opacity-70">500+ Tevreden klanten</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-warm-brown-800">
          
          {/* Column 1: Bedrijfsgegevens */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Droomvriendjes</h3>
            <p className="text-sm leading-relaxed opacity-80">
              Wij helpen kinderen en ouders aan een betere nachtrust met onze innovatieve slaapknuffels met rustgevend licht en geluid.
            </p>
            
            <div className="pt-4 space-y-2 text-sm">
              <p className="font-semibold text-white">Bedrijfsgegevens:</p>
              <p className="opacity-80">Droomvriendjes</p>
              <p className="opacity-80 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Schaesbergerweg 103<br />6415 AD Heerlen<br />Nederland</span>
              </p>
              <p className="text-xs italic opacity-60">(Dit is geen bezoekadres)</p>
              <p className="opacity-80 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@droomvriendjes.com" className="hover:text-warm-brown-300 transition">
                  info@droomvriendjes.com
                </a>
              </p>
            </div>
            
            <div className="pt-2 space-y-1 text-sm opacity-80">
              <p><strong>KVK:</strong> 99210835</p>
              <p><strong>BTW:</strong> NL204392123B01</p>
            </div>
          </div>

          {/* Column 2: Klantenservice */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Klantenservice</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/contact" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Contact Opnemen</Link></li>
              <li><Link to="/verzending" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Verzending & Levering</Link></li>
              <li><Link to="/retourneren" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Retourneren & Ruilen</Link></li>
              <li><Link to="/#faq" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Veelgestelde Vragen (FAQ)</Link></li>
              <li><Link to="/reviews" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Klantbeoordelingen</Link></li>
            </ul>
            
            <div className="mt-6 p-4 bg-warm-brown-800/50 rounded-lg">
              <p className="font-semibold text-white text-sm mb-2">Retouradres:</p>
              <p className="text-sm opacity-80">Centerpoort-Nieuwgraaf</p>
              <p className="text-sm opacity-80">Geograaf 16</p>
              <p className="text-sm opacity-80">6921 EW Duiven</p>
            </div>
          </div>

          {/* Column 3: Juridisch / Beleid */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Juridisch</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/voorwaarden" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Algemene Voorwaarden</Link></li>
              <li><Link to="/privacy" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Privacybeleid</Link></li>
              <li><Link to="/retourneren" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Retourbeleid</Link></li>
              <li><Link to="/voorwaarden#betaling" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Betalingsvoorwaarden</Link></li>
              <li><Link to="/voorwaarden#levering" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Leveringsvoorwaarden</Link></li>
            </ul>
            
            <div className="mt-6">
              <p className="text-xs opacity-60 leading-relaxed">
                Droomvriendjes is ingeschreven bij de Kamer van Koophandel onder nummer 99210835 en voldoet aan alle Nederlandse consumentenwetgeving.
              </p>
            </div>
          </div>

          {/* Column 4: Producten & Betaling */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Producten</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/knuffels" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Alle Knuffels</Link></li>
              <li><Link to="/cadeaubon" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Cadeaubonnen</Link></li>
              <li><Link to="/over-ons" className="opacity-80 hover:opacity-100 hover:text-warm-brown-300 transition">Over Droomvriendjes</Link></li>
            </ul>
            
            <div className="mt-6">
              <p className="font-semibold text-white text-sm mb-3">Betaalmethoden:</p>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">iDEAL</div>
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">PayPal</div>
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">Visa</div>
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">Mastercard</div>
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">Bancontact</div>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="font-semibold text-white text-sm mb-3">Verzending door:</p>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">PostNL</div>
                <div className="bg-white/10 px-3 py-1.5 rounded text-xs font-medium">DHL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs opacity-60">
              © {new Date().getFullYear()} Droomvriendjes. Alle rechten voorbehouden.
            </p>
            <p className="text-xs opacity-40 mt-1">
              KVK: 99210835 | BTW: NL204392123B01
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-xs opacity-60">
            <Link to="/voorwaarden" className="hover:opacity-100 hover:text-warm-brown-300 transition">Voorwaarden</Link>
            <span>|</span>
            <Link to="/privacy" className="hover:opacity-100 hover:text-warm-brown-300 transition">Privacy</Link>
            <span>|</span>
            <Link to="/contact" className="hover:opacity-100 hover:text-warm-brown-300 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
