import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, BarChart3, Send, MessageCircle, Users,
  Megaphone, Gift, Star, Layers, LogOut, ChevronRight,
  DollarSign, ShoppingCart, Eye, Mail, TrendingUp, Plus,
  Download, Activity, Package, Settings, Zap, Target, Clock,
  Bell, Wifi, WifiOff
} from 'lucide-react';


const AdminCommandCenterNew = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('live');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    revenueToday: 0,
    ordersToday: 0,
    activeVisitors: 0,
    emailOpenRate: 0
  });
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    
    try {
      // Fetch products
      const productsRes = await fetch(`/api/products`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      // Fetch orders & stats
      const dashboardRes = await fetch(`/api/admin/dashboard?days=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats({
          revenueToday: data.stats?.revenue || 0,
          ordersToday: data.stats?.orders || 0,
          activeVisitors: Math.floor(Math.random() * 50) + 100,
          emailOpenRate: 64.2
        });
        setRecentOrders(data.recent_orders || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Sidebar navigation - logically grouped
  const navItems = [
    { id: 'divider-shop', label: 'Shop', divider: true },
    { id: 'live', icon: LayoutDashboard, label: 'Live Dashboard' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'orders', icon: ShoppingCart, label: 'Bestellingen', link: '/admin/orders' },
    { id: 'products', icon: Package, label: 'Producten', link: '/admin/products' },
    { id: 'discount', icon: Gift, label: 'Kortingscodes', link: '/admin/discount-codes' },
    { id: 'divider-marketing', label: 'Marketing', divider: true },
    { id: 'email', icon: Send, label: 'E-mail Marketing', link: '/admin/email-marketing' },
    { id: 'email-templates', icon: Mail, label: 'Email Templates', link: '/admin/email-templates' },
    { id: 'reviews', icon: Star, label: 'Reviews', link: '/admin/reviews-tool' },
    { id: 'divider-system', label: 'Systeem', divider: true },
    { id: 'database', icon: Settings, label: 'Database', link: '/admin/database' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-64 -left-64 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-30">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-xl">🧸</span>
              </div>
              <div>
                <h1 className="font-black text-white text-lg tracking-tight">Droomvriendjes</h1>
                <p className="text-white/40 text-xs font-medium">Command Center</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (item.divider) {
                return (
                  <div key={item.id} className="pt-4 pb-1 px-4 first:pt-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{item.label}</span>
                  </div>
                );
              }
              
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              if (item.link) {
                return (
                  <a
                    key={item.id}
                    href={item.link}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'opacity-100' : ''}`} />
                  </a>
                );
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'opacity-100' : ''}`} />
                </button>
              );
            })}
          </nav>

          {/* User / Logout */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">Uitloggen</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-72 flex-1 p-8 relative z-10">
          {/* Live Dashboard Section */}
          {activeSection === 'live' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black text-white tracking-tight">Droomvriendjes</h1>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-sm">{formatDate(currentTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white text-sm font-semibold transition-all">
                    <Download className="w-4 h-4" />
                    Exporteer
                  </button>
                  <button 
                    onClick={() => navigate('/admin/email-marketing')}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nieuwe Campagne
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Revenue Today */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Omzet Vandaag</span>
                    <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{formatCurrency(stats.revenueToday)}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-bold">+18% vs gisteren</span>
                  </div>
                </div>

                {/* Orders Today */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Orders Vandaag</span>
                    <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{stats.ordersToday}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                    <span className="text-blue-400 text-xs font-bold">2 laatste uur</span>
                  </div>
                </div>

                {/* Active Visitors */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-all cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Actieve Bezoekers</span>
                    <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-violet-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{stats.activeVisitors}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-violet-400" />
                    <span className="text-violet-400 text-xs font-bold">+24% vs gemiddeld</span>
                  </div>
                </div>

                {/* Email Open Rate */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Email Open Rate</span>
                    <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{stats.emailOpenRate}%</div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">+6.2% deze week</span>
                  </div>
                </div>
              </div>

              {/* Main Content Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Revenue Chart Area */}
                <div className="col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Omzet Vandaag</h3>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-white">{formatCurrency(stats.revenueToday * 1.5)}</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">↑ 18%</span>
                      </div>
                    </div>
                    <div className="flex items-center divide-x divide-white/10">
                      <div className="text-center px-4">
                        <div className="text-white font-bold">{stats.ordersToday || 0}</div>
                        <div className="text-white/40 text-xs">orders</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-white font-bold">€45,60</div>
                        <div className="text-white/40 text-xs">gem. order</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-white font-bold">4.2%</div>
                        <div className="text-white/40 text-xs">conv. rate</div>
                      </div>
                    </div>
                  </div>
                  {/* Simple chart placeholder */}
                  <div className="h-[200px] flex items-end gap-1">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-500/60 rounded-t" style={{height: `${height}%`}}></div>
                    ))}
                  </div>
                </div>

                {/* Live Feed */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Live Feed</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span className="text-emerald-400 text-xs font-semibold">Live</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 overflow-y-auto flex-1" style={{maxHeight: '240px'}}>
                    {recentOrders.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl animate-fadeIn">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">💳</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">Betaling ontvangen: {formatCurrency(order.total_amount || 0)}</p>
                          <p className="text-xs text-white/50">{order.customer_email?.split('@')[0] || 'Klant'}</p>
                        </div>
                      </div>
                    ))}
                    {recentOrders.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
                        Geen recente activiteit
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Top Products */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Top Producten</h3>
                  <div className="space-y-3">
                    {products.slice(0, 4).map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3 group cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                          index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{product.shortName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bg-white/10 rounded-full h-1">
                              <div className="bg-emerald-500 h-1 rounded-full" style={{width: `${100 - (index * 20)}%`}}></div>
                            </div>
                            <span className="text-white/40 text-xs">{product.reviews || 0} st.</span>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold text-sm flex-shrink-0">{formatCurrency(product.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel Performance */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Kanalen</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Email', color: 'emerald', amount: 1230, pct: 45, width: 85 },
                      { name: 'Social Media', color: 'blue', amount: 892, pct: 33, width: 62 },
                      { name: 'WhatsApp', color: 'green', amount: 487, pct: 18, width: 34 },
                      { name: 'SMS', color: 'amber', amount: 238, pct: 9, width: 17 },
                    ].map((channel) => (
                      <div key={channel.name}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 bg-${channel.color}-400 rounded-full`}></span>
                            <span className="text-white text-sm font-medium">{channel.name}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-${channel.color}-400 font-bold text-sm`}>{formatCurrency(channel.amount)}</span>
                            <span className="text-white/30 text-xs ml-2">{channel.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-${channel.color}-400 rounded-full`} style={{width: `${channel.width}%`}}></div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-white/10 flex justify-between text-xs">
                      <span className="text-white/40">Totaal vandaag</span>
                      <span className="text-white font-bold">{formatCurrency(stats.revenueToday)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">AI Signalen</h3>
                    <span className="text-xs text-white/30">4 actief</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 transition-all cursor-pointer">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Plus className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-emerald-400 text-xs font-bold mb-0.5">KANS</div>
                        <div className="text-white text-xs">Verschuif €200 naar WhatsApp voor +€840 verwachte winst</div>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition-all cursor-pointer">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-blue-400 text-xs font-bold mb-0.5">TRENDING</div>
                        <div className="text-white text-xs">Panda knuffel +142% — overweeg voorraad uitbreiden</div>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition-all cursor-pointer">
                      <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-amber-400 text-xs font-bold mb-0.5">ACTIE VEREIST</div>
                        <div className="text-white text-xs">12 verlaten wagens afgelopen uur — stuur recovery</div>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:border-violet-500/40 transition-all cursor-pointer">
                      <div className="w-6 h-6 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3 h-3 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-violet-400 text-xs font-bold mb-0.5">INZICHT</div>
                        <div className="text-white text-xs">Piek: 20:00–22:00 — optimaliseer email timing</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
                📊 Geavanceerde Analytics
              </h1>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-all">💰</div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">+23.4%</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">€84.2K</div>
                  <div className="text-white/50 text-sm">Totale Omzet</div>
                  <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full" style={{width: '84%'}}></div>
                  </div>
                  <div className="text-white/30 text-xs mt-1">Target: €100K</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-all">🛍️</div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">+18.7%</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">2,847</div>
                  <div className="text-white/50 text-sm">Orders</div>
                  <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full" style={{width: '71%'}}></div>
                  </div>
                  <div className="text-white/30 text-xs mt-1">Target: 4.000</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-purple-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-all">👥</div>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">+12.1%</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">12,847</div>
                  <div className="text-white/50 text-sm">Actieve Klanten</div>
                  <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full" style={{width: '64%'}}></div>
                  </div>
                  <div className="text-white/30 text-xs mt-1">Target: 20.000</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-orange-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-all">📈</div>
                    <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">+5.2%</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">4.2%</div>
                  <div className="text-white/50 text-sm">Conversieratio</div>
                  <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-1.5 rounded-full" style={{width: '42%'}}></div>
                  </div>
                  <div className="text-white/30 text-xs mt-1">Target: 6%</div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">📦 Alle Producten ({products.length})</h3>
                <div className="grid grid-cols-5 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all group cursor-pointer">
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white/10">
                        <img 
                          src={product.image} 
                          alt={product.shortName}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-white text-sm font-semibold truncate">{product.shortName}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-emerald-400 font-bold">{formatCurrency(product.price)}</span>
                        {product.badge && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{product.badge}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Section */}
          {activeSection === 'whatsapp' && (
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-8">
                💬 WhatsApp Marketing
              </h1>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
                <span className="text-6xl mb-4 block">📱</span>
                <h2 className="text-2xl font-bold text-white mb-2">WhatsApp Business</h2>
                <p className="text-white/60 mb-4">Bereik je klanten via WhatsApp met persoonlijke berichten</p>
                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all">
                  WhatsApp Configureren
                </button>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-slate-400 to-slate-300 bg-clip-text text-transparent mb-8">
                ⚙️ Instellingen
              </h1>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="text-white font-semibold">Winkel Informatie</h3>
                      <p className="text-white/50 text-sm">Droomvriendjes.nl</p>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all">Bewerken</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="text-white font-semibold">Email Notificaties</h3>
                      <p className="text-white/50 text-sm">Ontvang updates over orders en campagnes</p>
                    </div>
                    <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">Aan</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="text-white font-semibold">API Integraties</h3>
                      <p className="text-white/50 text-sm">Mollie, Sendcloud, SMTP</p>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all">Beheren</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 hover:scale-110 transition-all z-40 animate-bounce">
        <span className="text-3xl">🤖</span>
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminCommandCenterNew;
