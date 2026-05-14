import React from 'react';
import { ShieldCheck, Truck, Mail, MapPin, Building2, CreditCard } from 'lucide-react';

const TrustSection = () => {
  return (
    <section className="bg-gradient-to-b from-[#faf6f1] to-[#f3ebe0] py-16" data-testid="trust-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full shadow-sm mb-4">
            <ShieldCheck className="w-5 h-5 text-[#8B7355]" />
            <span className="text-sm font-bold text-[#3d2b1f] uppercase tracking-wider">Vertrouwen & Zekerheid</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3d2b1f]">
            Veilig winkelen bij Droomvriendjes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Bedrijfsgegevens */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8ddd0]" data-testid="trust-company">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fdf5ec] rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#8B7355]" />
              </div>
              <h3 className="font-bold text-[#3d2b1f] text-lg">Bedrijfsgegevens</h3>
            </div>
            <div className="space-y-2.5 text-sm text-stone-600">
              <p className="font-semibold text-[#3d2b1f]">Droomvriendjes</p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#8B7355] mt-0.5 flex-shrink-0" />
                Schaesbergerweg 103, 6415 AD Heerlen, Nederland
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8B7355] flex-shrink-0" />
                <a href="mailto:info@droomvriendjes.com" className="hover:text-[#8B7355] transition">info@droomvriendjes.com</a>
              </p>
              <div className="pt-2 border-t border-stone-100 text-xs text-stone-400 space-y-1">
                <p>KVK: 99210835</p>
                <p>BTW: NL204392123B01</p>
              </div>
            </div>
          </div>

          {/* Betaalmethoden */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8ddd0]" data-testid="trust-payments">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fdf5ec] rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#8B7355]" />
              </div>
              <h3 className="font-bold text-[#3d2b1f] text-lg">Betaalmethoden</h3>
            </div>
            <p className="text-sm text-stone-500 mb-4">Veilig en vertrouwd betalen via:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'iDEAL', bg: 'bg-[#CC0066]/10', text: 'text-[#CC0066]' },
                { name: 'PayPal', bg: 'bg-[#003087]/10', text: 'text-[#003087]' },
                { name: 'Visa', bg: 'bg-[#1A1F71]/10', text: 'text-[#1A1F71]' },
                { name: 'Mastercard', bg: 'bg-[#EB001B]/10', text: 'text-[#EB001B]' },
                { name: 'Bancontact', bg: 'bg-[#005498]/10', text: 'text-[#005498]' },
              ].map(m => (
                <span key={m.name} className={`${m.bg} ${m.text} px-3 py-1.5 rounded-lg text-xs font-bold`}>
                  {m.name}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SSL beveiligde betaling via Mollie</span>
            </div>
          </div>

          {/* Verzending */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8ddd0]" data-testid="trust-shipping">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fdf5ec] rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#8B7355]" />
              </div>
              <h3 className="font-bold text-[#3d2b1f] text-lg">Verzending</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#fdf5ec] rounded-xl">
                <img src="https://www.postnl.nl/img/postnl-logo.svg" alt="PostNL" className="h-6" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                <span className="font-bold text-sm text-[#3d2b1f] hidden items-center">PostNL</span>
                <span className="text-xs text-stone-500 ml-auto">1-2 werkdagen</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#fdf5ec] rounded-xl">
                <img src="https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg" alt="DHL" className="h-5" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                <span className="font-bold text-sm text-[#3d2b1f] hidden items-center">DHL</span>
                <span className="text-xs text-stone-500 ml-auto">1-3 werkdagen</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-xl text-center">
              <p className="text-sm font-bold text-green-700">Gratis verzending in NL & BE</p>
              <p className="text-xs text-green-600 mt-0.5">Voor 23:00 besteld, morgen in huis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
