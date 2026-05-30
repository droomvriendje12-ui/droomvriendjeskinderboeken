import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, BarChart3, Send, MessageCircle, Users,
  Megaphone, Gift, Star, Layers, LogOut, ChevronRight,
  DollarSign, ShoppingCart, Eye, Mail, TrendingUp, Plus,
  Download, Activity, Package, Settings, Zap, Target, Clock,
  Bell, Wifi, WifiOff, Inbox, FileText, AlertTriangle, CheckCircle, Rocket, Trash2, Play, Pause
} from 'lucide-react';
import MarketingSalesHub from '../components/admin/MarketingSalesHub';
import CampaignBuilder from '../components/admin/CampaignBuilder';


const AdminCommandCenterNew = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('live');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    revenueToday: 0,
    ordersToday: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    paidOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    toShip: 0,
    revenueGrowth: 0,
    conversionRate: 0,
  });
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [funnelData, setFunnelData] = useState([]);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [hubOpen, setHubOpen] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [alertsUnresolved, setAlertsUnresolved] = useState(0);

  // Background system alerts (failed webhooks/orders)
  const fetchAlerts = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const r = await fetch(`/api/admin/system-alerts?resolved=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        setSystemAlerts(d.items || []);
        setAlertsUnresolved(d.unresolved || 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 60000);
    return () => clearInterval(t);
  }, [fetchAlerts]);

  const resolveAlert = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/admin/system-alerts/${id}/resolve`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
    } catch { /* ignore */ }
  };

  // Campaigns (campaign planner)
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const fetchCampaigns = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const r = await fetch(`/api/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setCampaigns(d.items || []); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const setCampaignStatus = async (id, status) => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      fetchCampaigns();
    } catch { /* ignore */ }
  };

  const deleteCampaign = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchCampaigns();
    } catch { /* ignore */ }
  };

  const exportDashboardPdf = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const r = await fetch(`/api/marketing-hub/dashboard-pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Export mislukt');
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (e) {
      window.alert('Kon analytics-PDF niet genereren');
    }
  };

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Realtime subscription for orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT') {
            const event = {
              id: Date.now(),
              type: 'new_order',
              icon: '💳',
              color: 'emerald',
              text: `Nieuwe bestelling: EUR ${(newRow.total_amount || 0).toFixed(2)}`,
              detail: newRow.customer_name || newRow.customer_email?.split('@')[0] || 'Klant',
              time: new Date()
            };
            setLiveEvents(prev => [event, ...prev].slice(0, 20));
            setNewOrderFlash(true);
            setTimeout(() => setNewOrderFlash(false), 3000);
            // Refresh dashboard data
            fetchDashboardData();
          } else if (eventType === 'UPDATE' && newRow.status !== oldRow?.status) {
            const statusLabels = {
              paid: 'Betaald', shipped: 'Verzonden', delivered: 'Afgeleverd', cancelled: 'Geannuleerd'
            };
            const statusIcons = {
              paid: '💰', shipped: '🚚', delivered: '✅', cancelled: '❌'
            };
            const statusColors = {
              paid: 'emerald', shipped: 'blue', delivered: 'violet', cancelled: 'red'
            };
            const event = {
              id: Date.now(),
              type: 'status_change',
              icon: statusIcons[newRow.status] || '📦',
              color: statusColors[newRow.status] || 'blue',
              text: `Status: ${statusLabels[newRow.status] || newRow.status}`,
              detail: `#${(newRow.order_number || newRow.id || '').slice(-8).toUpperCase()}`,
              time: new Date()
            };
            setLiveEvents(prev => [event, ...prev].slice(0, 20));
            fetchDashboardData();
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch data
  useEffect(() => {
    fetchDashboardData();
    // Poll every 10 seconds as fallback for when realtime isn't enabled
    const interval = setInterval(fetchDashboardData, 10000);
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

      // Fetch full dashboard stats (last 30 days for analytics)
      const dashboardRes = await fetch(`/api/admin/dashboard?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats({
          totalRevenue: data.stats?.total_revenue || 0,
          totalOrders: data.stats?.total_orders || 0,
          revenueToday: data.stats?.revenue_today || 0,
          ordersToday: data.stats?.orders_today || 0,
          avgOrderValue: data.stats?.avg_order_value || 0,
          totalCustomers: data.stats?.total_customers || 0,
          pendingOrders: data.stats?.pending_orders || 0,
          paidOrders: data.stats?.paid_orders || 0,
          shippedOrders: data.stats?.shipped_orders || 0,
          deliveredOrders: data.stats?.delivered_orders || 0,
          cancelledOrders: data.stats?.cancelled_orders || 0,
          toShip: data.stats?.to_ship || 0,
          revenueGrowth: data.stats?.revenue_growth || 0,
          conversionRate: data.stats?.conversion_rate || 0,
        });
        setRecentOrders(data.recent_orders || []);
        setDailyBreakdown(data.daily_breakdown || []);
      }

      // Fetch funnel stats
      const funnelRes = await fetch(`/api/admin/funnel-stats?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (funnelRes.ok) {
        const fData = await funnelRes.json();
        setFunnelData(fData.funnel || []);
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
    { id: 'digital-products', icon: FileText, label: 'Digitale Producten', link: '/admin/digital-products' },
    { id: 'customers-link', icon: Users, label: 'Klanten', link: '/admin/customers' },
    { id: 'faq-stats', icon: TrendingUp, label: 'FAQ Stats', link: '/admin/faq-stats' },
    { id: 'discount', icon: Gift, label: 'Kortingscodes', link: '/admin/discount-codes' },
    { id: 'divider-marketing', label: 'Marketing', divider: true },
    { id: 'campaigns', icon: Rocket, label: 'Campagnes' },
    { id: 'inbox-link', icon: Inbox, label: 'Inbox', link: '/admin/inbox' },
    { id: 'email', icon: Send, label: 'E-mail Marketing', link: '/admin/email-marketing' },
    { id: 'email-templates', icon: Mail, label: 'Email Templates', link: '/admin/email-templates' },
    { id: 'reviews', icon: Star, label: 'Reviews', link: '/admin/reviews-tool' },
    { id: 'divider-system', label: 'Systeem', divider: true },
    { id: 'system-alerts', icon: AlertTriangle, label: 'Systeemmeldingen', badge: alertsUnresolved },
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
                  {item.badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center" data-testid="nav-alerts-badge">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 ${item.badge > 0 ? '' : 'ml-auto'} opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'opacity-100' : ''}`} />
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
                    <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full transition-all ${
                      realtimeConnected 
                        ? 'bg-emerald-500/15 border-emerald-500/30' 
                        : 'bg-amber-500/15 border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        realtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}></span>
                      {realtimeConnected ? (
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <WifiOff className="w-3 h-3" /> Verbinden...
                        </span>
                      )}
                    </div>
                    {newOrderFlash && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full animate-pulse">
                        <Bell className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold">Nieuwe bestelling!</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/40 text-sm">{formatDate(currentTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportDashboardPdf} data-testid="dashboard-export-btn" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white text-sm font-semibold transition-all">
                    <Download className="w-4 h-4" />
                    Exporteer
                  </button>
                  <button 
                    onClick={() => setCampaignOpen(true)}
                    data-testid="new-campaign-btn"
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nieuwe Campagne
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Total Revenue (30 days) */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer" data-testid="kpi-revenue">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Omzet (30d)</span>
                    <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="flex items-center gap-1.5">
                    {stats.revenueGrowth >= 0 ? (
                      <><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 text-xs font-bold">+{stats.revenueGrowth}% groei</span></>
                    ) : (
                      <span className="text-red-400 text-xs font-bold">{stats.revenueGrowth}% daling</span>
                    )}
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer" data-testid="kpi-orders">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Bestellingen (30d)</span>
                    <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{stats.totalOrders}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                    <span className="text-blue-400 text-xs font-bold">{stats.ordersToday} vandaag</span>
                  </div>
                </div>

                {/* Customers */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-all cursor-pointer" data-testid="kpi-customers">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Klanten</span>
                    <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-violet-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{stats.totalCustomers}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-violet-400 text-xs font-bold">{stats.toShip} te verzenden</span>
                  </div>
                </div>

                {/* Avg Order Value */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer" data-testid="kpi-aov">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Gem. Orderwaarde</span>
                    <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{formatCurrency(stats.avgOrderValue)}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs font-bold">Conversie: {stats.conversionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Main Content Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Revenue Chart Area */}
                <div className="col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Omzet Overzicht</h3>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-white">{formatCurrency(stats.totalRevenue)}</span>
                        {stats.revenueGrowth >= 0 ? (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">+{stats.revenueGrowth}%</span>
                        ) : (
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">{stats.revenueGrowth}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center divide-x divide-white/10">
                      <div className="text-center px-4">
                        <div className="text-white font-bold">{stats.ordersToday || 0}</div>
                        <div className="text-white/40 text-xs">orders</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-white font-bold">{formatCurrency(stats.avgOrderValue)}</div>
                        <div className="text-white/40 text-xs">gem. order</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-white font-bold">{stats.conversionRate}%</div>
                        <div className="text-white/40 text-xs">conv. rate</div>
                      </div>
                    </div>
                  </div>
                  {/* Daily revenue chart from real data */}
                  <div className="h-[200px] flex items-end gap-1">
                    {(dailyBreakdown.length > 0 ? dailyBreakdown.slice(-12) : []).map((day, i) => {
                      const maxRev = Math.max(...dailyBreakdown.slice(-12).map(d => d.revenue || 0), 1);
                      const height = Math.max(2, ((day.revenue || 0) / maxRev) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative">
                          <div className="absolute -top-8 bg-white/10 rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {formatCurrency(day.revenue || 0)} &bull; {day.orders} orders
                          </div>
                          <div className="w-full bg-gradient-to-t from-emerald-500/20 to-emerald-500/60 rounded-t transition-all group-hover:from-emerald-500/40 group-hover:to-emerald-500/80" style={{height: `${height}%`}}></div>
                        </div>
                      );
                    })}
                    {dailyBreakdown.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                        Nog geen omzetdata beschikbaar
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Feed */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Live Feed</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${realtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      <span className={`text-xs font-semibold ${realtimeConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {realtimeConnected ? 'Live' : 'Verbinden...'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5 overflow-y-auto flex-1" style={{maxHeight: '240px'}} data-testid="live-feed">
                    {liveEvents.length > 0 ? (
                      liveEvents.map((event) => (
                        <div key={event.id} className={`flex items-start gap-3 p-3 bg-white/[0.02] border border-${event.color}-500/20 rounded-xl animate-fadeIn`}>
                          <div className={`w-10 h-10 bg-gradient-to-br from-${event.color}-500 to-${event.color}-600 rounded-lg flex items-center justify-center text-lg`}>
                            {event.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{event.text}</p>
                            <p className="text-xs text-white/50">{event.detail}</p>
                          </div>
                          <span className="text-xs text-white/30 whitespace-nowrap">
                            {event.time.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : recentOrders.length > 0 ? (
                      recentOrders.slice(0, 5).map((order, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl animate-fadeIn">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">💳</div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Betaling ontvangen: {formatCurrency(order.total_amount || 0)}</p>
                            <p className="text-xs text-white/50">{order.customer_email?.split('@')[0] || 'Klant'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
                        Wachten op live activiteit...
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

                {/* Customer Funnel Tracking */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10" data-testid="funnel-tracking">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Conversie Funnel (30d)</h3>
                  {funnelData.length > 0 ? (
                    <div className="space-y-3">
                      {funnelData.map((step, i) => {
                        const maxCount = Math.max(...funnelData.map(s => s.count), 1);
                        const barWidth = (step.count / maxCount) * 100;
                        const colors = ['emerald', 'blue', 'violet', 'amber', 'orange', 'rose'];
                        const color = colors[i % colors.length];
                        return (
                          <div key={step.key} data-testid={`funnel-step-${step.key}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white text-xs font-medium">{step.step}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{step.count}</span>
                                {step.dropoff > 0 && (
                                  <span className="text-red-400 text-[10px] font-bold">-{step.dropoff}%</span>
                                )}
                              </div>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-${color}-400 rounded-full transition-all duration-700`}
                                style={{width: `${barWidth}%`}}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      {funnelData.length >= 2 && (
                        <div className="pt-3 border-t border-white/10 flex justify-between text-xs">
                          <span className="text-white/40">Totale conversie</span>
                          <span className="text-emerald-400 font-bold">
                            {funnelData[0].count > 0 
                              ? `${((funnelData[funnelData.length-1].count / funnelData[0].count) * 100).toFixed(1)}%`
                              : '0%'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-white/40 text-sm">Nog geen funnel data</p>
                      <p className="text-white/25 text-xs mt-1">Events worden bijgehouden vanaf nu</p>
                    </div>
                  )}
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
                Geavanceerde Analytics
              </h1>
              
              {/* KPI Cards - REAL DATA */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    {stats.revenueGrowth >= 0 ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">+{stats.revenueGrowth}%</span>
                    ) : (
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">{stats.revenueGrowth}%</span>
                    )}
                  </div>
                  <div className="text-3xl font-black text-white mb-1" data-testid="analytics-revenue">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-white/50 text-sm">Totale Omzet (30d)</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                      <ShoppingCart className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1" data-testid="analytics-orders">{stats.totalOrders}</div>
                  <div className="text-white/50 text-sm">Bestellingen (30d)</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-purple-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1" data-testid="analytics-customers">{stats.totalCustomers}</div>
                  <div className="text-white/50 text-sm">Unieke Klanten (30d)</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-orange-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                      <Target className="w-5 h-5 text-orange-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1" data-testid="analytics-conversion">{stats.conversionRate > 0 ? `${stats.conversionRate}%` : '-'}</div>
                  <div className="text-white/50 text-sm">Conversieratio</div>
                  {stats.conversionRate === 0 && (
                    <div className="text-white/30 text-xs mt-1">Onvoldoende data</div>
                  )}
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

          {/* Campaigns Section */}
          {activeSection === 'campaigns' && (
            <div data-testid="campaigns-section">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2">Campagnes</h1>
                  <p className="text-white/50">Plan, genereer AI-tekst en beheer je marketingcampagnes.</p>
                </div>
                <button onClick={() => setCampaignOpen(true)} data-testid="campaigns-new-btn"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
                  <Plus className="w-4 h-4" /> Nieuwe Campagne
                </button>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                {campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="campaigns-empty">
                    <Rocket className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-white font-semibold">Nog geen campagnes</p>
                    <p className="text-white/40 text-sm">Klik op "Nieuwe Campagne" om je eerste campagne te plannen.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((c) => {
                      const statusStyle = c.status === 'actief' ? 'bg-emerald-500/20 text-emerald-300'
                        : c.status === 'gepauzeerd' ? 'bg-amber-500/20 text-amber-300'
                        : c.status === 'afgerond' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/60';
                      return (
                        <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/40 border border-white/5" data-testid="campaign-row">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white truncate">{c.name}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusStyle}`}>{c.status}</span>
                            </div>
                            <p className="text-white/40 text-xs truncate">
                              {c.product_name || '—'} · €{Number(c.budget || 0).toFixed(0)} · {(c.platforms || []).join(', ') || 'geen platforms'}
                            </p>
                          </div>
                          {c.status !== 'actief' ? (
                            <button onClick={() => setCampaignStatus(c.id, 'actief')} data-testid="campaign-activate"
                              className="flex items-center gap-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-lg transition">
                              <Play className="w-3.5 h-3.5" /> Activeren
                            </button>
                          ) : (
                            <button onClick={() => setCampaignStatus(c.id, 'gepauzeerd')} data-testid="campaign-pause"
                              className="flex items-center gap-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-3 py-1.5 rounded-lg transition">
                              <Pause className="w-3.5 h-3.5" /> Pauzeren
                            </button>
                          )}
                          <button onClick={() => deleteCampaign(c.id)} data-testid="campaign-delete"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Alerts Section */}
          {activeSection === 'system-alerts' && (
            <div data-testid="system-alerts-section">
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent mb-2">
                Systeemmeldingen
              </h1>
              <p className="text-white/50 mb-8">Automatische meldingen wanneer een bestelling, betaling of e-mail niet goed binnenkwam.</p>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                {systemAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="alerts-empty">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                    <p className="text-white font-semibold">Alles werkt naar behoren</p>
                    <p className="text-white/40 text-sm">Er zijn geen openstaande systeemmeldingen.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemAlerts.map((a) => {
                      const tones = {
                        error: { box: 'bg-red-500/10 border-red-500/30', icon: 'text-red-400', tag: 'bg-red-500/20 text-red-300' },
                        warning: { box: 'bg-amber-500/10 border-amber-500/30', icon: 'text-amber-400', tag: 'bg-amber-500/20 text-amber-300' },
                        info: { box: 'bg-blue-500/10 border-blue-500/30', icon: 'text-blue-400', tag: 'bg-blue-500/20 text-blue-300' },
                      };
                      const t = tones[a.level] || tones.info;
                      return (
                        <div key={a.id} className={`flex items-start gap-3 p-4 rounded-xl border ${t.box}`} data-testid="alert-item">
                          <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${t.icon}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${t.tag}`}>{a.source}</span>
                              <span className="text-white/30 text-xs">{a.created_at ? new Date(a.created_at).toLocaleString('nl-NL') : ''}</span>
                            </div>
                            <p className="text-white text-sm font-medium">{a.message}</p>
                            {a.detail && <p className="text-white/40 text-xs mt-1 font-mono break-all">{a.detail}</p>}
                          </div>
                          <button onClick={() => resolveAlert(a.id)} data-testid="alert-resolve"
                            className="flex-shrink-0 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition">
                            <CheckCircle className="w-3.5 h-3.5" /> Opgelost
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button — Marketing & Sales Hub */}
      <button
        onClick={() => setHubOpen(true)}
        data-testid="marketing-hub-button"
        title="Marketing & Sales Hub"
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 hover:scale-110 transition-all z-40"
      >
        <Megaphone className="w-7 h-7 text-white" />
      </button>

      <MarketingSalesHub isOpen={hubOpen} onClose={() => setHubOpen(false)} products={products} />
      <CampaignBuilder isOpen={campaignOpen} onClose={() => setCampaignOpen(false)} products={products} onSaved={fetchCampaigns} />

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
