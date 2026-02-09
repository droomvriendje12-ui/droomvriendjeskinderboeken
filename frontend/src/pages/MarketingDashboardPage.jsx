import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Users, Mail, Target, 
  BarChart3, ArrowUpRight, ArrowDownRight, Download,
  Plus, ChevronRight, Star, Zap, RefreshCw, AlertTriangle,
  CheckCircle, PieChart, LineChart
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MarketingDashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('roi');

  // Mock data for the dashboard
  const profitData = {
    nettoWinst: 18742,
    nettoWinstChange: 42.8,
    roas: 6.2,
    roasChange: 18.3,
    ltv: 284,
    ltvChange: 12.1,
    cac: 12.50,
    cacChange: -22.7,
    ltvCacRatio: 22.7
  };

  const eGenticData = {
    openRate: 58.3,
    clickRate: 18.7,
    conversie: 12.4,
    leadsThisMonth: 4847
  };

  const roiData = {
    marketingSpend: 9870,
    cogs: 18770,
    omzet: 47382,
    winstMarge: 39.5
  };

  const funnelData = [
    { name: 'eGENTIC Leads (Triple Opt-In)', value: 4847, rate: 100, color: '#1e40af', cost: 3200 },
    { name: 'Email Geopend', value: 2826, rate: 58.3, color: '#10b981' },
    { name: 'Link Geklikt', value: 907, rate: 18.7, color: '#3b82f6' },
    { name: 'Winkelwagen', value: 724, rate: 79.8, color: '#f59e0b' },
    { name: 'Aankoop (Betaald)', value: 601, rate: 12.4, color: '#059669' }
  ];

  const campaigns = [
    { 
      name: 'Voorjaar Sale 2026', 
      type: 'Email + Retargeting',
      source: 'eGENTIC Premium',
      sourceColor: '#dbeafe',
      sourceTextColor: '#1e40af',
      leads: 2847, 
      conversies: 387, 
      omzet: 30521, 
      kosten: 14230, 
      winst: 16291,
      profitLevel: 'high'
    },
    { 
      name: 'Retargeting Q1', 
      type: 'Social Media Ads',
      source: 'eGENTIC Qualified',
      sourceColor: '#d1fae5',
      sourceTextColor: '#065f46',
      leads: 1234, 
      conversies: 143, 
      omzet: 11287, 
      kosten: 6140, 
      winst: 5147,
      profitLevel: 'high'
    },
    { 
      name: 'Google Search', 
      type: 'Paid Search',
      source: 'Generic Leads',
      sourceColor: '#fee2e2',
      sourceTextColor: '#991b1b',
      leads: 892, 
      conversies: 71, 
      omzet: 5574, 
      kosten: 4270, 
      winst: 1304,
      profitLevel: 'medium'
    }
  ];

  const ltvSegments = [
    { 
      name: 'PREMIUM SEGMENT', 
      type: 'eGENTIC Premium Leads',
      ltv: 387, 
      repeatRate: 62, 
      avgOrders: 4.1,
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      badgeGradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
    },
    { 
      name: 'QUALIFIED SEGMENT', 
      type: 'eGENTIC Qualified Leads',
      ltv: 241, 
      repeatRate: 47, 
      avgOrders: 2.8,
      gradient: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      badgeGradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    { 
      name: 'STANDAARD', 
      type: 'Generic Leads',
      ltv: 142, 
      repeatRate: 28, 
      avgOrders: 1.6,
      gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
      badgeGradient: 'linear-gradient(135deg, #94a3b8, #64748b)'
    }
  ];

  const navItems = [
    { id: 'roi', label: 'ROI Dashboard', icon: DollarSign },
    { id: 'conversie', label: 'Conversie Tracking', icon: BarChart3 },
    { id: 'leads', label: 'Lead Kwaliteit', icon: Users },
    { id: 'egentic', label: 'eGENTIC Leads', icon: Mail },
    { id: 'optin', label: 'Triple Opt-In Tracking', icon: CheckCircle },
    { id: 'campagnes', label: 'Campagnes', icon: Target },
    { id: 'ltv', label: 'Customer LTV', icon: Star },
    { id: 'trends', label: 'Performance Trends', icon: TrendingUp }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white fixed h-screen overflow-y-auto border-r border-white/10">
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
              🌙
            </div>
            <div>
              <h2 className="text-lg font-bold">Droomvriendjes</h2>
              <p className="text-xs text-white/60">Winstgevendheid Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="mb-6">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 px-3">Winstgevendheid</p>
            {navItems.slice(0, 3).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all mb-1 ${
                  activeNav === item.id 
                    ? 'bg-emerald-600 text-white font-semibold' 
                    : 'text-white/70 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 px-3">Email Marketing</p>
            {navItems.slice(3, 6).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all mb-1 ${
                  activeNav === item.id 
                    ? 'bg-emerald-600 text-white font-semibold' 
                    : 'text-white/70 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 px-3">Analytics</p>
            {navItems.slice(6).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all mb-1 ${
                  activeNav === item.id 
                    ? 'bg-emerald-600 text-white font-semibold' 
                    : 'text-white/70 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1">
        {/* Header */}
        <header className="bg-white border-b-2 border-gray-200 px-10 py-6 sticky top-0 z-50">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                💰 Winstgevendheid Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Focus op ROI, conversie en customer lifetime value</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export ROI Rapport
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nieuwe Campagne
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-10 max-w-[1800px]">
          {/* Alert Banner */}
          <div className="bg-gradient-to-r from-amber-100 to-yellow-200 border-2 border-amber-400 border-l-6 rounded-xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-extrabold text-amber-900 mb-1">Winst Optimalisatie Kans</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  <strong>eGENTIC Triple Opt-In leads converteren 34% beter</strong> dan standaard leads. 
                  Door je budget met €800 te verhogen naar premium leads, kun je een extra <strong>€4,850 netto winst</strong> genereren deze maand. 
                  Voorspelde ROAS: <strong>6.2x</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Netto Winst */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-500 rounded-2xl p-7 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
              <span className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-full">⭐ KERNMETRIC</span>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Netto Winst (Deze Maand)</p>
              <p className="text-5xl font-black text-emerald-700">{formatCurrency(profitData.nettoWinst)}</p>
              <div className="inline-flex items-center gap-1 bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
                <ArrowUpRight className="w-4 h-4" />
                +{profitData.nettoWinstChange}% vs vorige maand
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-4">
                💡 Omzet €47,382 - Kosten €28,640 = €18,742 winst
              </p>
            </div>

            {/* ROAS */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Return on Ad Spend (ROAS)</p>
              <p className="text-5xl font-black text-blue-700">{profitData.roas}x</p>
              <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
                <ArrowUpRight className="w-4 h-4" />
                +{profitData.roasChange}% verbetering
              </div>
              <p className="text-xs text-gray-600 font-semibold mt-4">
                Voor elke €1 uitgegeven → €6.20 omzet
              </p>
            </div>

            {/* Customer LTV */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Gemiddelde Customer LTV</p>
              <p className="text-5xl font-black text-orange-600">{formatCurrency(profitData.ltv)}</p>
              <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
                <ArrowUpRight className="w-4 h-4" />
                +{profitData.ltvChange}% groei
              </div>
              <p className="text-xs text-gray-600 font-semibold mt-4">
                📊 3.2 herhaalaankopen gemiddeld
              </p>
            </div>

            {/* CAC */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Customer Acquisition Cost</p>
              <p className="text-5xl font-black text-emerald-600">{formatCurrency(profitData.cac)}</p>
              <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
                <ArrowDownRight className="w-4 h-4" />
                {profitData.cacChange}% daling (goed!)
              </div>
              <p className="text-xs text-gray-600 font-semibold mt-4">
                💚 LTV/CAC Ratio: {profitData.ltvCacRatio}x (uitstekend!)
              </p>
            </div>
          </div>

          {/* eGENTIC & ROI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* eGENTIC Lead Quality */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-2xl p-8 border-3 border-blue-500">
              <div className="bg-white text-blue-800 font-black text-xl px-5 py-3 rounded-lg inline-block mb-5">
                eGENTIC
              </div>
              <h2 className="text-2xl font-extrabold mb-2">Premium Lead Performance</h2>
              <p className="text-sm opacity-90 mb-6">Triple Opt-In DSGVO-conforme leads met verified data</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 text-center">
                  <p className="text-xs opacity-90 uppercase tracking-wide">Open Rate</p>
                  <p className="text-3xl font-black my-2">{eGenticData.openRate}%</p>
                  <p className="text-xs opacity-80">+23% vs standaard</p>
                </div>
                <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 text-center">
                  <p className="text-xs opacity-90 uppercase tracking-wide">Click Rate</p>
                  <p className="text-3xl font-black my-2">{eGenticData.clickRate}%</p>
                  <p className="text-xs opacity-80">+31% vs standaard</p>
                </div>
                <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 text-center">
                  <p className="text-xs opacity-90 uppercase tracking-wide">Conversie</p>
                  <p className="text-3xl font-black my-2">{eGenticData.conversie}%</p>
                  <p className="text-xs opacity-80">+34% vs standaard</p>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Leads deze maand</p>
                    <p className="text-4xl font-black">{eGenticData.leadsThisMonth.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-sm font-bold">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400"></span>
                    GDPR Verified
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Calculator */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white rounded-2xl p-8 border-3 border-emerald-500">
              <h2 className="text-2xl font-extrabold mb-2">💰 ROI Breakdown</h2>
              <p className="text-sm opacity-90 mb-6">Complete winstgevendheidsanalyse</p>
              
              <div className="bg-white/15 rounded-xl p-5 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">Totale Marketing Spend</span>
                  <span className="text-2xl font-black">{formatCurrency(roiData.marketingSpend)}</span>
                </div>
                <p className="text-xs opacity-80">Email (€3,200) • Social (€3,850) • Google (€2,820)</p>
              </div>

              <div className="bg-white/15 rounded-xl p-5 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">Product Kosten (COGS)</span>
                  <span className="text-2xl font-black">{formatCurrency(roiData.cogs)}</span>
                </div>
                <p className="text-xs opacity-80">Gemiddeld 39.6% van omzet</p>
              </div>

              <div className="bg-emerald-500/30 border-3 border-white/50 rounded-xl p-6 mb-5">
                <p className="text-sm font-bold uppercase tracking-wider mb-2">Netto Winst Marge</p>
                <p className="text-6xl font-black">{roiData.winstMarge}%</p>
                <p className="text-sm mt-2 opacity-95">
                  €47,382 omzet - €28,640 kosten = <strong>€18,742 winst</strong>
                </p>
              </div>

              <div className="text-sm font-semibold text-center bg-white/10 rounded-lg py-3">
                🎯 Target: 35% winst marge → <span className="text-emerald-300">Doel bereikt!</span>
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">💸 Winstgevende Conversie Funnel</h2>
            <p className="text-sm text-gray-600 mb-6">Van lead naar klant - met focus op winstgevendheid per fase</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {funnelData.map((stage, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:translate-x-1.5 transition-all"
                    style={{ borderLeftWidth: '6px', borderLeftColor: stage.color }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-900">
                        {idx === 0 ? '🎯' : idx === 1 ? '📧' : idx === 2 ? '🔗' : idx === 3 ? '🛒' : '✅'} {stage.name}
                      </span>
                      <span className="text-3xl font-black" style={{ color: stage.color }}>
                        {stage.value.toLocaleString()}
                      </span>
                    </div>
                    {idx === 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Lead kwaliteit score: 94/100</p>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                    )}
                    <span className="inline-block bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg font-extrabold text-sm">
                      {stage.rate}% {idx === 0 ? 'Baseline • Kosten: €3,200' : 'conversie'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-3 border-emerald-500 rounded-xl p-6">
                  <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-2">Conversie Rate</p>
                  <p className="text-5xl font-black text-emerald-700 mb-3">12.4%</p>
                  <p className="text-sm text-emerald-700 font-semibold">601 conversies van 4,847 leads</p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-600 uppercase mb-4">WINSTGEVENDHEID</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Omzet</span>
                      <span className="font-bold text-emerald-600">€47,382</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marketing</span>
                      <span className="font-bold text-red-600">-€3,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">COGS</span>
                      <span className="font-bold text-red-600">-€18,770</span>
                    </div>
                    <div className="border-t-2 border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Netto Winst</span>
                        <span className="font-black text-emerald-700 text-lg">€25,412</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-100 to-yellow-200 border-2 border-amber-400 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-900 mb-2">🎯 OPTIMALISATIE</p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Cart abandon rate: <strong>16.9%</strong><br/>
                    Implementeer email recovery voor +€1,580 extra winst
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Campagne Winstgevendheid</h2>
            <p className="text-sm text-gray-600 mb-6">Focus op netto winst per campagne - niet alleen op omzet</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Campagne</th>
                    <th className="text-left px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Lead Bron</th>
                    <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Leads</th>
                    <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Conversies</th>
                    <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Omzet</th>
                    <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Kosten</th>
                    <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Netto Winst</th>
                    <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Winstgevendheid</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-5 border-b border-gray-200">
                        <p className="font-bold text-gray-900 mb-1">{campaign.name}</p>
                        <p className="text-xs text-gray-600">{campaign.type}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200">
                        <span 
                          className="px-3 py-1 rounded-md text-xs font-bold"
                          style={{ backgroundColor: campaign.sourceColor, color: campaign.sourceTextColor }}
                        >
                          {campaign.source}
                        </span>
                      </td>
                      <td className="text-center px-5 py-5 border-b border-gray-200 font-bold">{campaign.leads.toLocaleString()}</td>
                      <td className="text-center px-5 py-5 border-b border-gray-200 font-bold text-emerald-600">{campaign.conversies}</td>
                      <td className="text-center px-5 py-5 border-b border-gray-200 font-bold">{formatCurrency(campaign.omzet)}</td>
                      <td className="text-center px-5 py-5 border-b border-gray-200 font-bold text-red-600">{formatCurrency(campaign.kosten)}</td>
                      <td className="text-center px-5 py-5 border-b border-gray-200 font-black text-emerald-700 text-lg">{formatCurrency(campaign.winst)}</td>
                      <td className="text-center px-5 py-5 border-b border-gray-200">
                        <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-extrabold text-sm ${
                          campaign.profitLevel === 'high' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {campaign.profitLevel === 'high' ? '⭐ Zeer Hoog' : 'Gemiddeld'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border-l-4 border-emerald-500">
              <p className="font-extrabold text-emerald-800 mb-2">💡 Data-Driven Aanbeveling</p>
              <p className="text-emerald-700 text-sm leading-relaxed">
                <strong>eGENTIC Premium leads genereren 3.2x meer netto winst</strong> dan generic leads bij gelijke kosten. 
                Verhoog budget voor Voorjaar Sale met €500 voor geschatte <strong>+€2,870 extra winst</strong> deze maand.
              </p>
            </div>
          </div>

          {/* Customer LTV Analysis */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">💎 Customer Lifetime Value Analyse</h2>
            <p className="text-sm text-gray-600 mb-6">Langetermijn winstgevendheid per klant segment</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {ltvSegments.map((segment, idx) => (
                <div 
                  key={idx}
                  className="text-white rounded-xl p-6"
                  style={{ background: segment.gradient }}
                >
                  <span 
                    className="inline-block text-white text-xs font-extrabold px-4 py-1.5 rounded-md mb-4"
                    style={{ background: segment.badgeGradient }}
                  >
                    {segment.name}
                  </span>
                  <p className="text-sm opacity-90 mb-2">{segment.type}</p>
                  <p className="text-5xl font-black mb-3">{formatCurrency(segment.ltv)}</p>
                  <p className="text-xs opacity-85 mb-4">Gemiddelde LTV per klant</p>
                  <div className="bg-white/15 rounded-lg p-3">
                    <p className="text-xs mb-1">Repeat purchase rate: <strong>{segment.repeatRate}%</strong></p>
                    <p className="text-xs">Gemiddeld {segment.avgOrders} orders per klant</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-amber-100 to-yellow-200 rounded-xl p-6 border-l-6 border-amber-500">
              <div className="flex items-start gap-4">
                <span className="text-4xl">📊</span>
                <div>
                  <p className="font-extrabold text-amber-900 text-lg mb-2">Strategische Inzicht: Focus op Premium Leads</p>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    eGENTIC Premium leads hebben een <strong>2.7x hogere lifetime value</strong> dan generic leads. 
                    Hoewel de initiële CAC €3.80 hoger is, genereren ze over tijd <strong>€245 meer winst per klant</strong>. 
                    ROI break-even na eerste herhaalaankoop (gem. 23 dagen).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketingDashboardPage;
