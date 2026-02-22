import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Users, Mail, Target, 
  BarChart3, ArrowUpRight, ArrowDownRight, Download,
  Plus, ChevronRight, Star, Zap, RefreshCw, AlertTriangle,
  CheckCircle, PieChart, LineChart, X, Calendar, Filter,
  Search, Eye, Edit, Trash2, Play, Pause, Copy, ExternalLink,
  Clock, Send, MousePointer, ShoppingCart, Heart, Award,
  Sparkles, FileText, Settings, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../components/ui/button';


const MarketingDashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('roi');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: 'premium'
  });

  // Simulate data refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

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
    { name: 'Premium Leads (Triple Opt-In)', value: 4847, rate: 100, color: '#1e40af', cost: 3200, icon: '🎯' },
    { name: 'Email Geopend', value: 2826, rate: 58.3, color: '#10b981', icon: '📧' },
    { name: 'Link Geklikt', value: 907, rate: 18.7, color: '#3b82f6', icon: '🔗' },
    { name: 'Winkelwagen', value: 724, rate: 79.8, color: '#f59e0b', icon: '🛒' },
    { name: 'Aankoop (Betaald)', value: 601, rate: 12.4, color: '#059669', icon: '✅' }
  ];

  const campaigns = [
    { 
      id: 1,
      name: 'Voorjaar Sale 2026', 
      type: 'Email + Retargeting',
      source: 'Premium Premium',
      sourceColor: '#dbeafe',
      sourceTextColor: '#1e40af',
      leads: 2847, 
      conversies: 387, 
      omzet: 30521, 
      kosten: 14230, 
      winst: 16291,
      profitLevel: 'high',
      status: 'active',
      startDate: '2026-01-15',
      endDate: '2026-03-31'
    },
    { 
      id: 2,
      name: 'Retargeting Q1', 
      type: 'Social Media Ads',
      source: 'Premium Qualified',
      sourceColor: '#d1fae5',
      sourceTextColor: '#065f46',
      leads: 1234, 
      conversies: 143, 
      omzet: 11287, 
      kosten: 6140, 
      winst: 5147,
      profitLevel: 'high',
      status: 'active',
      startDate: '2026-01-01',
      endDate: '2026-03-31'
    },
    { 
      id: 3,
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
      profitLevel: 'medium',
      status: 'paused',
      startDate: '2026-01-01',
      endDate: '2026-02-28'
    }
  ];

  const ltvSegments = [
    { 
      name: 'PREMIUM SEGMENT', 
      type: 'Premium Premium Leads',
      ltv: 387, 
      repeatRate: 62, 
      avgOrders: 4.1,
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      badgeGradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
    },
    { 
      name: 'QUALIFIED SEGMENT', 
      type: 'Premium Qualified Leads',
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

  const leadsList = [
    { id: 1, email: 'jan.devries@email.nl', name: 'Jan de Vries', source: 'Premium Premium', status: 'converted', date: '2026-02-08', value: '€89.95' },
    { id: 2, email: 'maria.jansen@gmail.com', name: 'Maria Jansen', source: 'Premium Premium', status: 'qualified', date: '2026-02-08', value: '-' },
    { id: 3, email: 'peter.bakker@outlook.nl', name: 'Peter Bakker', source: 'Premium Qualified', status: 'converted', date: '2026-02-07', value: '€149.90' },
    { id: 4, email: 'anna.smit@email.nl', name: 'Anna Smit', source: 'Premium Premium', status: 'pending', date: '2026-02-07', value: '-' },
    { id: 5, email: 'kees.devos@gmail.com', name: 'Kees de Vos', source: 'Generic', status: 'converted', date: '2026-02-06', value: '€49.95' },
  ];

  const optInTracking = [
    { step: 'Single Opt-In', count: 4847, rate: 100, description: 'Eerste aanmelding via landingspagina' },
    { step: 'Double Opt-In', count: 4123, rate: 85.1, description: 'Email bevestiging geklikt' },
    { step: 'Triple Opt-In', count: 3847, rate: 79.4, description: 'Profiel compleet ingevuld' },
  ];

  const navItems = [
    { id: 'roi', label: 'ROI Dashboard', icon: DollarSign },
    { id: 'conversie', label: 'Conversie Tracking', icon: BarChart3 },
    { id: 'leads', label: 'Lead Kwaliteit', icon: Users },
    { id: 'egentic', label: 'Premium Leads', icon: Mail },
    { id: 'optin', label: 'Triple Opt-In Tracking', icon: CheckCircle },
    { id: 'campagnes', label: 'Campagnes', icon: Target },
    { id: 'ltv', label: 'Customer LTV', icon: Star },
    { id: 'trends', label: 'Performance Trends', icon: TrendingUp }
  ];

  const periods = [
    { id: '7d', label: '7 dagen' },
    { id: '30d', label: '30 dagen' },
    { id: '90d', label: '90 dagen' },
    { id: 'ytd', label: 'Dit jaar' },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleExport = (format) => {
    alert(`Rapport wordt geëxporteerd als ${format.toUpperCase()}...`);
    setShowExportModal(false);
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      alert('Vul alle verplichte velden in');
      return;
    }
    alert(`Campagne "${newCampaign.name}" is aangemaakt!`);
    setShowNewCampaignModal(false);
    setNewCampaign({ name: '', type: 'email', budget: '', startDate: '', endDate: '', targetAudience: 'premium' });
  };

  const toggleCampaignStatus = (campaignId) => {
    alert(`Campagne status gewijzigd voor ID: ${campaignId}`);
  };

  // Render different sections based on active nav
  const renderContent = () => {
    switch (activeNav) {
      case 'roi':
        return renderROIDashboard();
      case 'conversie':
        return renderConversieTracking();
      case 'leads':
        return renderLeadKwaliteit();
      case 'egentic':
        return renderEGENTICLeads();
      case 'optin':
        return renderOptInTracking();
      case 'campagnes':
        return renderCampagnes();
      case 'ltv':
        return renderLTV();
      case 'trends':
        return renderTrends();
      default:
        return renderROIDashboard();
    }
  };

  // ROI Dashboard Section
  const renderROIDashboard = () => (
    <>
      {/* Alert Banner */}
      <div className="bg-gradient-to-r from-amber-100 to-yellow-200 border-2 border-amber-400 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <h3 className="font-extrabold text-amber-900 mb-1">Winst Optimalisatie Kans</h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              <strong>Premium Triple Opt-In leads converteren 34% beter</strong> dan standaard leads. 
              Door je budget met €800 te verhogen naar premium leads, kun je een extra <strong>€4,850 netto winst</strong> genereren deze maand.
            </p>
          </div>
          <Button 
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setActiveNav('campagnes')}
          >
            Bekijk campagnes
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Netto Winst */}
        <div 
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-500 rounded-2xl p-7 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          onClick={() => setActiveNav('trends')}
        >
          <span className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-full">⭐ KERNMETRIC</span>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Netto Winst (Deze Maand)</p>
          <p className="text-5xl font-black text-emerald-700">{formatCurrency(profitData.nettoWinst)}</p>
          <div className="inline-flex items-center gap-1 bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
            <ArrowUpRight className="w-4 h-4" />
            +{profitData.nettoWinstChange}% vs vorige maand
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-4">
            💡 Klik voor trend analyse
          </p>
        </div>

        {/* ROAS */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer hover:border-blue-300"
          onClick={() => setActiveNav('campagnes')}
        >
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Return on Ad Spend (ROAS)</p>
          <p className="text-5xl font-black text-blue-700">{profitData.roas}x</p>
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
            <ArrowUpRight className="w-4 h-4" />
            +{profitData.roasChange}% verbetering
          </div>
          <p className="text-xs text-gray-600 font-semibold mt-4">
            📊 Klik voor campagne details
          </p>
        </div>

        {/* Customer LTV */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer hover:border-orange-300"
          onClick={() => setActiveNav('ltv')}
        >
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Gemiddelde Customer LTV</p>
          <p className="text-5xl font-black text-orange-600">{formatCurrency(profitData.ltv)}</p>
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
            <ArrowUpRight className="w-4 h-4" />
            +{profitData.ltvChange}% groei
          </div>
          <p className="text-xs text-gray-600 font-semibold mt-4">
            💎 Klik voor LTV analyse
          </p>
        </div>

        {/* CAC */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer hover:border-emerald-300"
          onClick={() => setActiveNav('leads')}
        >
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Customer Acquisition Cost</p>
          <p className="text-5xl font-black text-emerald-600">{formatCurrency(profitData.cac)}</p>
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-extrabold mt-4">
            <ArrowDownRight className="w-4 h-4" />
            {profitData.cacChange}% daling (goed!)
          </div>
          <p className="text-xs text-gray-600 font-semibold mt-4">
            👥 Klik voor lead kwaliteit
          </p>
        </div>
      </div>

      {/* Premium & ROI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Premium Lead Quality */}
        <div 
          className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-2xl p-8 border-3 border-blue-500 cursor-pointer hover:shadow-2xl transition-all"
          onClick={() => setActiveNav('egentic')}
        >
          <div className="flex justify-between items-start mb-5">
            <div className="bg-white text-blue-800 font-black text-xl px-5 py-3 rounded-lg">
              Premium
            </div>
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/20">
              <ExternalLink className="w-4 h-4 mr-1" /> Details
            </Button>
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Premium Lead Performance</h2>
          <p className="text-sm opacity-90 mb-6">Triple Opt-In DSGVO-conforme leads met verified data</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 text-center hover:bg-white/20 transition-all cursor-pointer">
              <p className="text-xs opacity-90 uppercase tracking-wide">Open Rate</p>
              <p className="text-3xl font-black my-2">{eGenticData.openRate}%</p>
              <p className="text-xs opacity-80">+23% vs standaard</p>
            </div>
            <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 text-center hover:bg-white/20 transition-all cursor-pointer">
              <p className="text-xs opacity-90 uppercase tracking-wide">Click Rate</p>
              <p className="text-3xl font-black my-2">{eGenticData.clickRate}%</p>
              <p className="text-xs opacity-80">+31% vs standaard</p>
            </div>
            <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 text-center hover:bg-white/20 transition-all cursor-pointer">
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
          
          <div className="bg-white/15 rounded-xl p-5 mb-4 hover:bg-white/25 transition-all cursor-pointer">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Totale Marketing Spend</span>
              <span className="text-2xl font-black">{formatCurrency(roiData.marketingSpend)}</span>
            </div>
            <p className="text-xs opacity-80">Email (€3,200) • Social (€3,850) • Google (€2,820)</p>
          </div>

          <div className="bg-white/15 rounded-xl p-5 mb-4 hover:bg-white/25 transition-all cursor-pointer">
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
              {formatCurrency(roiData.omzet)} omzet - {formatCurrency(roiData.marketingSpend + roiData.cogs)} kosten = <strong>{formatCurrency(profitData.nettoWinst)} winst</strong>
            </p>
          </div>

          <div className="text-sm font-semibold text-center bg-white/10 rounded-lg py-3">
            🎯 Target: 35% winst marge → <span className="text-emerald-300">Doel bereikt!</span>
          </div>
        </div>
      </div>
    </>
  );

  // Conversie Tracking Section
  const renderConversieTracking = () => (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">💸 Winstgevende Conversie Funnel</h2>
        <p className="text-sm text-gray-600 mb-6">Van lead naar klant - met focus op winstgevendheid per fase</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {funnelData.map((stage, idx) => (
              <div 
                key={idx}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:translate-x-1.5 transition-all cursor-pointer"
                style={{ borderLeftWidth: '6px', borderLeftColor: stage.color }}
                onClick={() => setActiveNav(idx === 0 ? 'egentic' : idx < 3 ? 'leads' : 'campagnes')}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-900">
                    {stage.icon} {stage.name}
                  </span>
                  <span className="text-3xl font-black" style={{ color: stage.color }}>
                    {stage.value.toLocaleString()}
                  </span>
                </div>
                {idx === 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Lead kwaliteit score: 94/100</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full transition-all duration-1000" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                )}
                <span className="inline-block bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg font-extrabold text-sm">
                  {stage.rate}% {idx === 0 ? `Baseline • Kosten: ${formatCurrency(stage.cost)}` : 'conversie'}
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
                  <span className="font-bold text-emerald-600">{formatCurrency(roiData.omzet)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marketing</span>
                  <span className="font-bold text-red-600">-{formatCurrency(3200)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">COGS</span>
                  <span className="font-bold text-red-600">-{formatCurrency(roiData.cogs)}</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Netto Winst</span>
                    <span className="font-black text-emerald-700 text-lg">{formatCurrency(25412)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="bg-gradient-to-r from-amber-100 to-yellow-200 border-2 border-amber-400 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setShowNewCampaignModal(true)}
            >
              <p className="text-xs font-bold text-amber-900 mb-2">🎯 OPTIMALISATIE</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Cart abandon rate: <strong>16.9%</strong><br/>
                <span className="underline">Klik om recovery campagne te starten</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Lead Kwaliteit Section
  const renderLeadKwaliteit = () => (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">👥 Lead Kwaliteit Overzicht</h2>
            <p className="text-sm text-gray-600">Analyseer en beheer je leads</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-blue-700">2,847</p>
            <p className="text-sm text-blue-600 font-semibold">Premium Leads</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-700">1,234</p>
            <p className="text-sm text-emerald-600 font-semibold">Qualified Leads</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-gray-700">766</p>
            <p className="text-sm text-gray-600 font-semibold">Generic Leads</p>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Lead</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Bron</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase">Status</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase">Datum</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase">Waarde</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody>
            {leadsList.filter(l => 
              l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              l.email.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(lead => (
              <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.email}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    lead.source.includes('Premium') ? 'bg-blue-100 text-blue-700' :
                    lead.source.includes('Qualified') ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.source}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    lead.status === 'converted' ? 'bg-emerald-100 text-emerald-700' :
                    lead.status === 'qualified' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {lead.status === 'converted' ? 'Geconverteerd' : 
                     lead.status === 'qualified' ? 'Gekwalificeerd' : 'In behandeling'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-600">{lead.date}</td>
                <td className="px-4 py-4 text-center font-bold text-emerald-600">{lead.value}</td>
                <td className="px-4 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded" title="Bekijken">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Email sturen">
                      <Mail className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Premium Leads Section
  const renderEGENTICLeads = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-2xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="bg-white text-blue-800 font-black text-xl px-5 py-3 rounded-lg inline-block mb-4">
              Premium
            </div>
            <h2 className="text-3xl font-extrabold">Premium Lead Management</h2>
            <p className="text-blue-200 mt-2">Triple Opt-In DSGVO-conforme leads met verified data</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-sm font-bold">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
            Live Sync Actief
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center">
            <p className="text-4xl font-black">{eGenticData.leadsThisMonth.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-2">Totaal Leads</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center">
            <p className="text-4xl font-black">{eGenticData.openRate}%</p>
            <p className="text-sm opacity-80 mt-2">Open Rate</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center">
            <p className="text-4xl font-black">{eGenticData.clickRate}%</p>
            <p className="text-sm opacity-80 mt-2">Click Rate</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center">
            <p className="text-4xl font-black">{eGenticData.conversie}%</p>
            <p className="text-sm opacity-80 mt-2">Conversie Rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Lead Kwaliteit Verdeling</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-blue-700">Premium (58.7%)</span>
                <span className="text-sm font-bold">2,847</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '58.7%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-emerald-700">Qualified (25.5%)</span>
                <span className="text-sm font-bold">1,234</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '25.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-gray-600">Standard (15.8%)</span>
                <span className="text-sm font-bold">766</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-500 rounded-full" style={{ width: '15.8%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Snelle Acties</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewCampaignModal(true)}>
              <Send className="w-4 h-4 mr-2" /> Nieuwe Email Campagne
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveNav('optin')}>
              <CheckCircle className="w-4 h-4 mr-2" /> Opt-In Status Bekijken
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" /> Export Lead Lijst
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="w-4 h-4 mr-2" /> Sync met Premium
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Triple Opt-In Tracking Section
  const renderOptInTracking = () => (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Triple Opt-In Tracking</h2>
        <p className="text-sm text-gray-600 mb-6">GDPR-compliant lead verificatie proces</p>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {optInTracking.map((step, idx) => (
            <div 
              key={idx}
              className={`border-2 rounded-2xl p-6 ${
                idx === 0 ? 'border-blue-500 bg-blue-50' :
                idx === 1 ? 'border-emerald-500 bg-emerald-50' :
                'border-purple-500 bg-purple-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-emerald-600' : 'bg-purple-600'
                }`}>
                  {idx + 1}
                </div>
                <h3 className="font-bold text-gray-900">{step.step}</h3>
              </div>
              <p className="text-4xl font-black text-gray-900 mb-2">{step.count.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mb-3">{step.rate}% van totaal</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-400 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-800 mb-2">Uitstekende Opt-In Ratio!</h3>
              <p className="text-emerald-700 text-sm">
                79.4% van je leads doorloopt het volledige Triple Opt-In proces. Dit is <strong>23% hoger</strong> dan het industrie gemiddelde.
                Premium Premium leads hebben een 92% Triple Opt-In rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Campagnes Section
  const renderCampagnes = () => (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📊 Campagne Winstgevendheid</h2>
            <p className="text-sm text-gray-600">Focus op netto winst per campagne</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowNewCampaignModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nieuwe Campagne
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Campagne</th>
                <th className="text-left px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Lead Bron</th>
                <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Status</th>
                <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Leads</th>
                <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Conversies</th>
                <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Omzet</th>
                <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Netto Winst</th>
                <th className="text-center px-5 py-4 text-xs font-extrabold text-gray-700 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <td className="px-5 py-5">
                    <p className="font-bold text-gray-900 mb-1">{campaign.name}</p>
                    <p className="text-xs text-gray-600">{campaign.type}</p>
                  </td>
                  <td className="px-5 py-5">
                    <span 
                      className="px-3 py-1 rounded-md text-xs font-bold"
                      style={{ backgroundColor: campaign.sourceColor, color: campaign.sourceTextColor }}
                    >
                      {campaign.source}
                    </span>
                  </td>
                  <td className="text-center px-5 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {campaign.status === 'active' ? '● Actief' : '○ Gepauzeerd'}
                    </span>
                  </td>
                  <td className="text-center px-5 py-5 font-bold">{campaign.leads.toLocaleString()}</td>
                  <td className="text-center px-5 py-5 font-bold text-emerald-600">{campaign.conversies}</td>
                  <td className="text-center px-5 py-5 font-bold">{formatCurrency(campaign.omzet)}</td>
                  <td className="text-center px-5 py-5 font-black text-emerald-700 text-lg">{formatCurrency(campaign.winst)}</td>
                  <td className="text-center px-5 py-5">
                    <div className="flex justify-center gap-2">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setSelectedCampaign(campaign)}
                        title="Bekijken"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => toggleCampaignStatus(campaign.id)}
                        title={campaign.status === 'active' ? 'Pauzeren' : 'Activeren'}
                      >
                        {campaign.status === 'active' ? 
                          <Pause className="w-4 h-4 text-amber-600" /> : 
                          <Play className="w-4 h-4 text-emerald-600" />
                        }
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Bewerken"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border-l-4 border-emerald-500">
          <p className="font-extrabold text-emerald-800 mb-2">💡 Data-Driven Aanbeveling</p>
          <p className="text-emerald-700 text-sm">
            <strong>Premium Premium leads genereren 3.2x meer netto winst</strong> dan generic leads. 
            <button 
              className="underline ml-1 font-bold"
              onClick={() => setShowNewCampaignModal(true)}
            >
              Start nu een nieuwe premium campagne →
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  // Customer LTV Section
  const renderLTV = () => (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">💎 Customer Lifetime Value Analyse</h2>
        <p className="text-sm text-gray-600 mb-6">Langetermijn winstgevendheid per klant segment</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {ltvSegments.map((segment, idx) => (
            <div 
              key={idx}
              className="text-white rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all hover:scale-105"
              style={{ background: segment.gradient }}
              onClick={() => setActiveNav('leads')}
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
                Premium Premium leads hebben een <strong>2.7x hogere lifetime value</strong> dan generic leads. 
                ROI break-even na eerste herhaalaankoop (gem. 23 dagen).
              </p>
              <Button 
                className="mt-4 bg-amber-600 hover:bg-amber-700"
                onClick={() => setActiveNav('egentic')}
              >
                Bekijk Premium Dashboard →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Performance Trends Section
  const renderTrends = () => (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📈 Performance Trends</h2>
            <p className="text-sm text-gray-600">Historische data en voorspellingen</p>
          </div>
          <div className="flex gap-2">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedPeriod === period.id 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-600 font-semibold mb-1">Totale Omzet</p>
            <p className="text-2xl font-black text-emerald-700">{formatCurrency(47382)}</p>
            <p className="text-xs text-emerald-600 mt-1">+42.8% vs vorige periode</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-semibold mb-1">Nieuwe Klanten</p>
            <p className="text-2xl font-black text-blue-700">601</p>
            <p className="text-xs text-blue-600 mt-1">+28.3% vs vorige periode</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-purple-600 font-semibold mb-1">Email Verzonden</p>
            <p className="text-2xl font-black text-purple-700">12,847</p>
            <p className="text-xs text-purple-600 mt-1">+15.2% vs vorige periode</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-600 font-semibold mb-1">Gem. Order Waarde</p>
            <p className="text-2xl font-black text-amber-700">{formatCurrency(78.84)}</p>
            <p className="text-xs text-amber-600 mt-1">+8.1% vs vorige periode</p>
          </div>
        </div>

        {/* Simple Chart Visualization */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Winst Trend (Laatste 4 weken)</h3>
          <div className="flex items-end gap-4 h-48">
            {[
              { week: 'Week 1', value: 3200, height: '40%' },
              { week: 'Week 2', value: 4100, height: '52%' },
              { week: 'Week 3', value: 4850, height: '61%' },
              { week: 'Week 4', value: 6592, height: '83%' },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-700 hover:to-emerald-500 cursor-pointer"
                  style={{ height: item.height }}
                  title={formatCurrency(item.value)}
                ></div>
                <p className="text-xs text-gray-600 mt-2 font-semibold">{item.week}</p>
                <p className="text-sm font-bold text-emerald-700">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white fixed h-screen overflow-y-auto border-r border-white/10">
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
              🌙
            </div>
            <div>
              <h2 className="text-lg font-bold">Droomvriendjes</h2>
              <p className="text-xs text-white/60">Winstgevendheid Dashboard</p>
            </div>
          </Link>
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
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30' 
                    : 'text-white/70 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {activeNav === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
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
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30' 
                    : 'text-white/70 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {activeNav === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
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
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30' 
                    : 'text-white/70 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {activeNav === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Back to Admin */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <Link 
              to="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-slate-700/50 hover:text-white transition-all"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
              <span className="text-sm">Terug naar Admin</span>
            </Link>
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
                💰 {navItems.find(n => n.id === activeNav)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Focus op ROI, conversie en customer lifetime value</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Laden...' : 'Vernieuwen'}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowExportModal(true)}
              >
                <Download className="w-4 h-4" />
                Export Rapport
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                onClick={() => setShowNewCampaignModal(true)}
              >
                <Plus className="w-4 h-4" />
                Nieuwe Campagne
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-10 max-w-[1800px]">
          {renderContent()}
        </div>
      </main>

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowNewCampaignModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🚀 Nieuwe Campagne</h2>
              <button onClick={() => setShowNewCampaignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Campagne Naam *</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Bijv. Zomer Sale 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="email">Email Marketing</option>
                  <option value="social">Social Media Ads</option>
                  <option value="retargeting">Retargeting</option>
                  <option value="search">Paid Search</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Budget *</label>
                <input
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="€"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Doelgroep</label>
                <select
                  value={newCampaign.targetAudience}
                  onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="premium">Premium Premium Leads</option>
                  <option value="qualified">Premium Qualified Leads</option>
                  <option value="all">Alle Leads</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Startdatum</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Einddatum</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewCampaignModal(false)}>
                Annuleren
              </Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateCampaign}>
                <Plus className="w-4 h-4 mr-2" /> Campagne Aanmaken
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📊 Export Rapport</h2>
              <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Kies het formaat voor je ROI rapport export:</p>

            <div className="space-y-3">
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                <FileText className="w-8 h-8 text-red-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-900">PDF Rapport</p>
                  <p className="text-sm text-gray-600">Visueel rapport met grafieken</p>
                </div>
              </button>

              <button 
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                <BarChart3 className="w-8 h-8 text-emerald-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-900">Excel Spreadsheet</p>
                  <p className="text-sm text-gray-600">Gedetailleerde data voor analyse</p>
                </div>
              </button>

              <button 
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                <Download className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-900">CSV Export</p>
                  <p className="text-sm text-gray-600">Raw data voor integraties</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setSelectedCampaign(null)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📊 {selectedCampaign.name}</h2>
              <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Lead Bron</p>
                <p className="font-bold text-gray-900">{selectedCampaign.source}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className={`font-bold ${selectedCampaign.status === 'active' ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {selectedCampaign.status === 'active' ? '● Actief' : '○ Gepauzeerd'}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-sm text-emerald-600 mb-1">Omzet</p>
                <p className="font-black text-emerald-700 text-2xl">{formatCurrency(selectedCampaign.omzet)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-sm text-emerald-600 mb-1">Netto Winst</p>
                <p className="font-black text-emerald-700 text-2xl">{formatCurrency(selectedCampaign.winst)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <p className="text-3xl font-black text-blue-700">{selectedCampaign.leads.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Leads</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <p className="text-3xl font-black text-emerald-700">{selectedCampaign.conversies}</p>
                <p className="text-sm text-gray-600">Conversies</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-xl">
                <p className="text-3xl font-black text-purple-700">{((selectedCampaign.conversies / selectedCampaign.leads) * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Conversie Rate</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedCampaign(null)}>
                Sluiten
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Edit className="w-4 h-4 mr-2" /> Bewerken
              </Button>
              <Button 
                className={`flex-1 ${selectedCampaign.status === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={() => {
                  toggleCampaignStatus(selectedCampaign.id);
                  setSelectedCampaign(null);
                }}
              >
                {selectedCampaign.status === 'active' ? (
                  <><Pause className="w-4 h-4 mr-2" /> Pauzeren</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Activeren</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDashboardPage;
