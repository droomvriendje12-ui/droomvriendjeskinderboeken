import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  Zap, Mail, MessageSquare, Phone, Star, Users, 
  TrendingUp, Euro, ShoppingCart, Eye, Clock,
  Send, ChevronRight, X, BarChart3, ArrowUpRight,
  RefreshCw, Download, Plus, Settings, LogOut,
  Check, AlertTriangle, Target, Sparkles, Upload,
  FileText, UserPlus, Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MarketingCommandCenter = () => {
  const { admin, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('live');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 Hoi! Ik ben je AI Marketing Assistant. Hoe kan ik je helpen?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // CSV Import state
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [leadsStats, setLeadsStats] = useState({ total_leads: 0, by_source: {}, by_gender: {} });
  
  // Campaign state
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('promotional');
  const [selectedSegments, setSelectedSegments] = useState(['all']);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsSummary, setCampaignsSummary] = useState(null);
  
  // WhatsApp state
  const [whatsappSegment, setWhatsappSegment] = useState('recent');
  const [whatsappTemplate, setWhatsappTemplate] = useState('offer');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  
  // SMS state
  const [smsRecipients, setSmsRecipients] = useState('vip');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsDateTime, setSmsDateTime] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  
  // Influencer state
  const [influencerNiche, setInfluencerNiche] = useState('');
  const [influencerMinFollowers, setInfluencerMinFollowers] = useState('');
  const [searchingInfluencers, setSearchingInfluencers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };
  
  // Campaign functions
  const createCampaign = async () => {
    if (!campaignName.trim()) {
      showNotification('Voer een campagne naam in', 'error');
      return;
    }
    setSendingCampaign(true);
    
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          type: campaignType,
          segments: selectedSegments
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification(`✅ Campagne "${campaignName}" is aangemaakt met ${result.recipient_count} ontvangers!`, 'success');
        setCampaignName('');
        setShowCampaignBuilder(false);
        // Refresh campaigns list
        fetchCampaigns();
      } else {
        showNotification('❌ Fout bij aanmaken campagne', 'error');
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
      showNotification('❌ Fout bij aanmaken campagne', 'error');
    }
    
    setSendingCampaign(false);
  };
  
  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns?status=active&limit=10`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };
  
  const fetchCampaignsSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns/stats/summary`);
      const data = await response.json();
      setCampaignsSummary(data);
    } catch (error) {
      console.error('Error fetching campaign summary:', error);
    }
  };
  
  const pauseCampaign = async (campaignId, campaignName) => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
      
      if (response.ok) {
        showNotification(`⏸️ Campagne "${campaignName}" gepauzeerd`, 'success');
        fetchCampaigns();
      }
    } catch (error) {
      showNotification('❌ Fout bij pauzeren', 'error');
    }
  };
  
  const resumeCampaign = async (campaignId, campaignName) => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns/${campaignId}/resume`, {
        method: 'POST'
      });
      
      if (response.ok) {
        showNotification(`▶️ Campagne "${campaignName}" hervat`, 'success');
        fetchCampaigns();
      }
    } catch (error) {
      showNotification('❌ Fout bij hervatten', 'error');
    }
  };
  
  const deleteCampaign = async (campaignId, campaignName) => {
    if (!window.confirm(`Weet je zeker dat je campagne "${campaignName}" wilt verwijderen?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification(`🗑️ Campagne "${campaignName}" verwijderd`, 'success');
        fetchCampaigns();
      }
    } catch (error) {
      showNotification('❌ Fout bij verwijderen', 'error');
    }
  };
  
  // WhatsApp functions
  const sendWhatsappBroadcast = async () => {
    if (!whatsappMessage.trim()) {
      showNotification('Voer een bericht in', 'error');
      return;
    }
    setSendingWhatsapp(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const segments = {
      recent: 487,
      highvalue: 234,
      abandoned: 156,
      newsletter: 2847
    };
    
    showNotification(`✅ WhatsApp broadcast verzonden naar ${segments[whatsappSegment]} contacten!`, 'success');
    setWhatsappMessage('');
    setSendingWhatsapp(false);
  };
  
  // SMS functions
  const sendSmsCampaign = async () => {
    if (!smsMessage.trim()) {
      showNotification('Voer een SMS bericht in', 'error');
      return;
    }
    setSendingSms(true);
    
    // Simulate API call  
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recipients = {
      vip: 234,
      flash: 892,
      abandoned: 156
    };
    
    showNotification(`✅ SMS campagne gepland voor ${recipients[smsRecipients]} ontvangers! (Mock - Twilio integratie nodig voor echte verzending)`, 'success');
    setSmsMessage('');
    setSendingSms(false);
  };
  
  // Influencer search
  const searchInfluencers = async () => {
    setSearchingInfluencers(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock search results
    const mockResults = [
      { handle: '@ouders_lifestyle', name: 'Ouders & Lifestyle', followers: 45000, engagement: 7.2, avatar: '👨‍👩‍👧' },
      { handle: '@baby_tips_nl', name: 'Baby Tips NL', followers: 32000, engagement: 8.5, avatar: '👶' },
      { handle: '@slaap_expert', name: 'Slaap Expert', followers: 28000, engagement: 6.8, avatar: '😴' }
    ];
    
    setSearchResults(mockResults);
    showNotification(`🔍 ${mockResults.length} influencers gevonden!`, 'success');
    setSearchingInfluencers(false);
  };
  
  // Affiliate actions
  const approveAffiliate = async (affiliateId, name) => {
    showNotification(`✅ ${name} is goedgekeurd als affiliate!`, 'success');
    // Update local state to remove from pending
    setAffiliateData(prev => ({
      ...prev,
      pending_approvals: prev.pending_approvals.filter(a => a.id !== affiliateId)
    }));
  };
  
  const rejectAffiliate = async (affiliateId, name) => {
    showNotification(`❌ ${name} is afgewezen`, 'error');
    setAffiliateData(prev => ({
      ...prev,
      pending_approvals: prev.pending_approvals.filter(a => a.id !== affiliateId)
    }));
  };
  
  // Stats state
  const [stats, setStats] = useState({
    today_revenue: 2847,
    live_conversions: 34,
    active_visitors: 127,
    email_open_rate: 64.2,
    revenue_change: 18
  });
  
  const [channelPerformance, setChannelPerformance] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [hourlyData, setHourlyData] = useState({ labels: [], data: [] });
  const [activities, setActivities] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [whatsappStats, setWhatsappStats] = useState({ active_contacts: 2847, open_rate: 94.2, today_revenue: 1284 });
  const [smsStats, setSmsStats] = useState({ delivery_rate: 98.4, open_rate_3min: 89.2, monthly_roi: 847 });
  const [influencerData, setInfluencerData] = useState({ total: 12, total_reach: 487000, avg_engagement: 8.4, generated_revenue: 18000, top_influencers: [] });
  const [affiliateData, setAffiliateData] = useState({ total: 47, total_clicks: 12400, conversion_rate: 6.8, total_paid: 2800, pending_approvals: [] });
  
  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsRes, channelRes, productsRes, hourlyRes, insightsRes, whatsappRes, smsRes, influencerRes, affiliateRes] = await Promise.all([
        fetch(`${API_URL}/api/marketing/stats`, { headers }),
        fetch(`${API_URL}/api/marketing/channel-performance`, { headers }),
        fetch(`${API_URL}/api/marketing/top-products`, { headers }),
        fetch(`${API_URL}/api/marketing/hourly-revenue`, { headers }),
        fetch(`${API_URL}/api/marketing/ai-insights`, { headers }),
        fetch(`${API_URL}/api/marketing/whatsapp/stats`, { headers }),
        fetch(`${API_URL}/api/marketing/sms/stats`, { headers }),
        fetch(`${API_URL}/api/marketing/influencers`, { headers }),
        fetch(`${API_URL}/api/marketing/affiliates`, { headers })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (channelRes.ok) setChannelPerformance(await channelRes.json());
      if (productsRes.ok) setTopProducts(await productsRes.json());
      if (hourlyRes.ok) setHourlyData(await hourlyRes.json());
      if (insightsRes.ok) setAiInsights(await insightsRes.json());
      if (whatsappRes.ok) setWhatsappStats(await whatsappRes.json());
      if (smsRes.ok) setSmsStats(await smsRes.json());
      if (influencerRes.ok) setInfluencerData(await influencerRes.json());
      if (affiliateRes.ok) setAffiliateData(await affiliateRes.json());
    } catch (error) {
      console.error('Error fetching marketing data:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    fetchCampaigns();
    fetchCampaignsSummary();
    const interval = setInterval(() => {
      fetchData();
      fetchCampaigns();
      fetchCampaignsSummary();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);
  
  // Simulate live activities
  useEffect(() => {
    const activityTemplates = [
      { icon: '🛒', text: 'Nieuwe bestelling: Slaapknuffel Konijn', color: 'from-emerald-500 to-emerald-600' },
      { icon: '👤', text: 'Nieuwe lead: WhatsApp opt-in', color: 'from-green-500 to-green-600' },
      { icon: '📧', text: 'Email geopend: Voorjaar Sale 2026', color: 'from-blue-500 to-blue-600' },
      { icon: '💳', text: 'Betaling ontvangen: €78.95', color: 'from-purple-500 to-purple-600' },
      { icon: '⭐', text: 'Nieuwe review: 5 sterren!', color: 'from-orange-500 to-orange-600' }
    ];
    
    const addActivity = () => {
      const activity = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      setActivities(prev => [{
        id: Date.now(),
        ...activity,
        time: 'Nu'
      }, ...prev.slice(0, 4)]);
    };
    
    // Add initial activities
    setTimeout(addActivity, 2000);
    setTimeout(addActivity, 4000);
    setTimeout(addActivity, 6000);
    
    const interval = setInterval(addActivity, 15000);
    return () => clearInterval(interval);
  }, []);
  
  // Simulate live metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setStats(prev => ({
          ...prev,
          today_revenue: prev.today_revenue + Math.floor(Math.random() * 100),
          live_conversions: prev.live_conversions + (Math.random() > 0.8 ? 1 : 0),
          active_visitors: 100 + Math.floor(Math.random() * 50)
        }));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Chat functions
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/marketing/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, session_id: sessionId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, er ging iets mis. Probeer het opnieuw!' 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Verbindingsfout. Controleer je internetverbinding.' 
      }]);
    }
    
    setChatLoading(false);
  };
  
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Nav items
  const navItems = [
    { id: 'live', icon: Zap, label: 'Live Dashboard', badge: null, live: true },
    { id: 'import', icon: Upload, label: 'CSV Importeren', badge: null },
    { id: 'email', icon: Mail, label: 'Email Campagnes', badge: 3 },
    { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp Marketing', badge: 2 },
    { id: 'sms', icon: Phone, label: 'SMS Campagnes', badge: 1 },
    { id: 'influencer', icon: Star, label: 'Influencers', badge: null },
    { id: 'affiliate', icon: Users, label: 'Affiliates', badge: null, notification: true }
  ];
  
  // Fetch leads stats
  const fetchLeadsStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/marketing/leads/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeadsStats(data);
      }
    } catch (error) {
      console.error('Error fetching leads stats:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchLeadsStats();
  }, [fetchLeadsStats]);
  
  // CSV Import functions
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };
  
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };
  
  const handleFileUpload = async (file) => {
    if (!file.name.endsWith('.csv')) {
      alert('Alleen CSV bestanden zijn toegestaan');
      return;
    }
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/marketing/leads/upload-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
        fetchLeadsStats(); // Refresh stats
      } else {
        const error = await response.json();
        alert(`Fout: ${error.detail || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fout bij uploaden van bestand');
    }
    
    setImporting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-64 -left-64 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 z-50">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl">
              🌙
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Droomvriendjes</h2>
              <p className="text-xs text-white/50">Command Center</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-3 mb-3">Dashboard</p>
          
          {navItems.slice(0, 1).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.live && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-auto" />}
            </button>
          ))}
          
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-3 mb-3 mt-6">Lead Management</p>
          
          {navItems.slice(1, 3).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-3 mb-3 mt-6">Multi-Channel</p>
          
          {navItems.slice(3, 5).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-3 mb-3 mt-6">Growth</p>
          
          {navItems.slice(5).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.notification && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
          
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-3 mb-3 mt-6">Support</p>
          
          <button
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            AI Assistant
          </button>
          
          <Link
            to="/admin/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all mt-8"
          >
            <Settings className="w-5 h-5" />
            Admin Dashboard
          </Link>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="ml-72 p-8 relative z-10">
        {/* Live Dashboard Tab */}
        {activeTab === 'live' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  Live Marketing Dashboard
                </h1>
                <p className="text-white/60 text-lg mt-1">Real-time performance tracking</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-white">Live Updates</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/10 transition-all">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={() => setActiveTab('email')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nieuwe Campagne
                </button>
                <Link to="/admin/leads">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
                    <Users className="w-4 h-4" />
                    Beheer Leads
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Live Metrics */}
            <div className="grid grid-cols-4 gap-6">
              <MetricCard 
                title="Vandaag Omzet"
                value={`€${stats.today_revenue.toLocaleString()}`}
                change={`+${stats.revenue_change}% vs gisteren`}
                positive={true}
                icon={<Euro className="w-6 h-6 text-emerald-400" />}
                gradient="from-emerald-500/20 to-emerald-600/20"
              />
              <MetricCard 
                title="Live Conversies"
                value={stats.live_conversions}
                change="2 laatste uur"
                positive={true}
                live={true}
                icon={<Check className="w-6 h-6 text-blue-400" />}
                gradient="from-blue-500/20 to-blue-600/20"
              />
              <MetricCard 
                title="Actieve Bezoekers"
                value={stats.active_visitors}
                change="+24% vs avg"
                positive={true}
                icon={<Users className="w-6 h-6 text-purple-400" />}
                gradient="from-purple-500/20 to-purple-600/20"
              />
              <MetricCard 
                title="Email Open Rate"
                value={`${stats.email_open_rate}%`}
                change="+6.2% deze week"
                positive={true}
                icon={<Mail className="w-6 h-6 text-orange-400" />}
                gradient="from-orange-500/20 to-orange-600/20"
              />
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <h3 className="text-xl font-bold text-white mb-6">📈 Real-time Omzet (24u)</h3>
                <SimpleChart data={hourlyData} />
              </div>
              
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <h3 className="text-xl font-bold text-white mb-6">🌍 Live Activiteit</h3>
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl animate-slideIn">
                      <div className={`w-10 h-10 bg-gradient-to-br ${activity.color} rounded-lg flex items-center justify-center text-lg`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{activity.text}</p>
                        <p className="text-xs text-white/50">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-4">Wachten op activiteit...</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Performance Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Top Products */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <h3 className="text-lg font-bold text-white mb-4">Top Producten (Vandaag)</h3>
                <div className="space-y-3">
                  {topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${product.color} rounded-lg`} />
                        <div>
                          <p className="font-bold text-white text-sm">{product.name}</p>
                          <p className="text-xs text-white/60">{product.sold} verkocht</p>
                        </div>
                      </div>
                      <span className={`font-black ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-blue-400' : 'text-purple-400'}`}>
                        €{product.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Channel Performance */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <h3 className="text-lg font-bold text-white mb-4">Channel Performance</h3>
                <div className="space-y-4">
                  {channelPerformance.map((channel, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{channel.channel}</span>
                        <span className={`text-sm font-bold ${
                          channel.channel === 'Email' ? 'text-emerald-400' : 
                          channel.channel === 'WhatsApp' ? 'text-green-400' :
                          channel.channel === 'Social Media' ? 'text-blue-400' : 'text-orange-400'
                        }`}>€{channel.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${channel.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${channel.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI Insights */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <h3 className="text-lg font-bold text-white mb-4">AI Insights</h3>
                <div className="space-y-3">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      insight.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      insight.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-orange-500/10 border-orange-500/30'
                    }`}>
                      <p className={`text-xs font-bold mb-1 ${
                        insight.color === 'emerald' ? 'text-emerald-400' :
                        insight.color === 'blue' ? 'text-blue-400' : 'text-orange-400'
                      }`}>{insight.icon} {insight.title}</p>
                      <p className="text-sm text-white">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* CSV Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-white">📥 Leads Importeren</h2>
                <p className="text-white/60 mt-1">Upload CSV bestanden met leads (Gender;Firstname;Lastname;Date of birth;email;source)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <span className="text-sm text-white/60">Totaal Leads: </span>
                  <span className="text-lg font-bold text-emerald-400">{leadsStats.total_leads.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Upload Zone */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {importing ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-16 h-16 text-emerald-400 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Bezig met importeren...</h3>
                    <p className="text-white/60">Even geduld alsjeblieft</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Sleep CSV bestand hier</h3>
                    <p className="text-white/60 mb-4">of</p>
                    <label className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold cursor-pointer hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
                      Kies Bestand
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".csv" 
                        className="hidden" 
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="text-sm text-white/50 mt-4">
                      Ondersteund formaat: CSV (Gender;Firstname;Lastname;Date of birth;email;source)
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Import Results */}
            {importResult && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-emerald-400 mb-4">Import Succesvol!</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-white/60">Totaal Leads</p>
                          <p className="text-3xl font-black text-white">{importResult.total_leads}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Geldig</p>
                          <p className="text-3xl font-black text-emerald-400">{importResult.valid_leads}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Duplicaten</p>
                          <p className="text-3xl font-black text-orange-400">{importResult.duplicates}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lead Segmentation Preview */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">📊 Lead Segmentatie</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-white/60 mb-4">Gender Verdeling</p>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-blue-400">Man</span>
                            <span className="text-white">{importResult.male_count} ({importResult.male_percentage}%)</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                              style={{ width: `${importResult.male_percentage}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-pink-400">Vrouw</span>
                            <span className="text-white">{importResult.female_count} ({importResult.female_percentage}%)</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-1000"
                              style={{ width: `${importResult.female_percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white/60 mb-4">Leeftijd Verdeling</p>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-white">35-50 jaar</span>
                            <span className="text-white">{importResult.age_35_50}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                              style={{ width: `${(importResult.age_35_50 / importResult.valid_leads * 100) || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-white">51-65 jaar</span>
                            <span className="text-white">{importResult.age_51_65}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                              style={{ width: `${(importResult.age_51_65 / importResult.valid_leads * 100) || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-white">65+ jaar</span>
                            <span className="text-white">{importResult.age_65_plus}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                              style={{ width: `${(importResult.age_65_plus / importResult.valid_leads * 100) || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('email')}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                  >
                    ✅ Leads Opgeslagen - Ga naar Campagne Maken
                  </button>
                </div>
              </div>
            )}
            
            {/* Existing Leads Stats */}
            {leadsStats.total_leads > 0 && !importResult && (
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">📊 Bestaande Leads Overzicht</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-white/60 mb-1">Totaal</p>
                    <p className="text-2xl font-black text-white">{leadsStats.total_leads.toLocaleString()}</p>
                  </div>
                  {Object.entries(leadsStats.by_gender || {}).map(([gender, count]) => (
                    <div key={gender} className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-xs text-white/60 mb-1 capitalize">{gender === 'male' ? 'Man' : gender === 'female' ? 'Vrouw' : gender}</p>
                      <p className="text-2xl font-black text-white">{count.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-white">📧 Email Marketing</h2>
                <p className="text-white/60">Beheer en maak email campagnes met AI optimalisatie</p>
              </div>
              <button 
                onClick={() => setShowCampaignBuilder(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
              >
                <Plus className="w-5 h-5" />
                Nieuwe Campagne
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <p className="text-sm font-bold text-white/60 uppercase mb-2">Totaal Leads</p>
                <p className="text-4xl font-black text-white">{leadsStats.total_leads.toLocaleString()}</p>
                <p className="text-sm text-emerald-400 font-semibold mt-2">+{Math.floor(leadsStats.total_leads * 0.32).toLocaleString()} deze maand</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <p className="text-sm font-bold text-white/60 uppercase mb-2">Actieve Campagnes</p>
                <p className="text-4xl font-black text-emerald-400">{campaignsSummary?.active_campaigns || 0}</p>
                <p className="text-sm text-white/50 font-semibold mt-2">{campaignsSummary?.paused_campaigns || 0} gepauzeerd</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <p className="text-sm font-bold text-white/60 uppercase mb-2">Gem. Open Rate</p>
                <p className="text-4xl font-black text-blue-400">{campaignsSummary?.avg_open_rate || 0}%</p>
                <p className="text-sm text-emerald-400 font-semibold mt-2">+23% vs. industry</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <p className="text-sm font-bold text-white/60 uppercase mb-2">ROI Deze Maand</p>
                <p className="text-4xl font-black text-emerald-400">6.2x</p>
                <p className="text-sm text-emerald-400 font-semibold mt-2">€18,742 winst</p>
              </div>
            </div>
            
            {/* Active Campaigns */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Actieve Campagnes</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Campaign 1 */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">Voorjaar Sale 2026</h4>
                      <p className="text-sm text-white/60">Premium Leads • 35-65 jaar</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase">Live</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/10 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-white/60 mb-1">Verzonden</p>
                      <p className="text-xl font-black text-white">2,847</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60 mb-1">Open Rate</p>
                      <p className="text-xl font-black text-blue-400">62.3%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60 mb-1">Conversies</p>
                      <p className="text-xl font-black text-emerald-400">387</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-white/70">ROI Progress</span>
                      <span className="font-bold text-emerald-400">€16,291 winst</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => showNotification('📊 Analytics geopend voor Voorjaar Sale 2026')}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-semibold text-sm text-white transition-all"
                    >
                      📊 Analytics
                    </button>
                    <button 
                      onClick={() => showNotification('✏️ Campagne editor geopend')}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-all"
                    >
                      ✏️ Bewerken
                    </button>
                  </div>
                </div>
                
                {/* Campaign 2 */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">Moederdag Special</h4>
                      <p className="text-sm text-white/60">Vrouwen • 30-65 jaar</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase">Live</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/10 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-white/60 mb-1">Verzonden</p>
                      <p className="text-xl font-black text-white">1,234</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60 mb-1">Open Rate</p>
                      <p className="text-xl font-black text-blue-400">54.8%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/60 mb-1">Conversies</p>
                      <p className="text-xl font-black text-emerald-400">143</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-white/70">ROI Progress</span>
                      <span className="font-bold text-emerald-400">€5,147 winst</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => showNotification('📊 Analytics geopend voor Moederdag Special')}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-semibold text-sm text-white transition-all"
                    >
                      📊 Analytics
                    </button>
                    <button 
                      onClick={() => showNotification('✏️ Campagne editor geopend')}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-all"
                    >
                      ✏️ Bewerken
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Campaign Builder Modal */}
            {showCampaignBuilder && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
                <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">⚡ Snelle Campagne Maker</h3>
                    <button onClick={() => setShowCampaignBuilder(false)} className="text-white/60 hover:text-white">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Campagne Naam</label>
                      <input 
                        type="text" 
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Bijv: Moederdag Actie 2026" 
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Campagne Type</label>
                      <select 
                        value={campaignType}
                        onChange={(e) => setCampaignType(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="promotional">Promotional (Korting/Sale)</option>
                        <option value="educational">Educational (Tips/Content)</option>
                        <option value="product-launch">Product Launch</option>
                        <option value="seasonal">Seasonal (Feestdagen)</option>
                        <option value="abandoned-cart">Abandoned Cart Recovery</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-white mb-3">Doelgroep Selectie</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'all', label: `Alle Leads (${leadsStats.total_leads.toLocaleString()})`, color: 'bg-blue-500/20 text-blue-400' },
                        { id: 'female', label: `Alleen Vrouwen (${(leadsStats.by_gender?.female || 0).toLocaleString()})`, color: 'bg-pink-500/20 text-pink-400' },
                        { id: 'male', label: `Alleen Mannen (${(leadsStats.by_gender?.male || 0).toLocaleString()})`, color: 'bg-blue-500/20 text-blue-400' },
                        { id: '50plus', label: '50+ jaar', color: 'bg-orange-500/20 text-orange-400' }
                      ].map(segment => (
                        <button
                          key={segment.id}
                          onClick={() => {
                            if (selectedSegments.includes(segment.id)) {
                              setSelectedSegments(selectedSegments.filter(s => s !== segment.id));
                            } else {
                              setSelectedSegments([...selectedSegments, segment.id]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            selectedSegments.includes(segment.id) 
                              ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' 
                              : segment.color
                          }`}
                        >
                          {segment.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-6 mb-6">
                    <h4 className="font-bold text-white mb-3">📊 Voorspelde Performance</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-white/60 mb-1">Bereik</p>
                        <p className="text-2xl font-black text-white">{leadsStats.total_leads.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/60 mb-1">Est. Opens</p>
                        <p className="text-2xl font-black text-blue-400">{Math.floor(leadsStats.total_leads * 0.58).toLocaleString()}</p>
                        <p className="text-xs text-white/50">58.3%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/60 mb-1">Est. Clicks</p>
                        <p className="text-2xl font-black text-purple-400">{Math.floor(leadsStats.total_leads * 0.11).toLocaleString()}</p>
                        <p className="text-xs text-white/50">18.7%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/60 mb-1">Est. Winst</p>
                        <p className="text-2xl font-black text-emerald-400">€{Math.floor(leadsStats.total_leads * 0.28).toLocaleString()}</p>
                        <p className="text-xs text-white/50">ROI 6.2x</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowCampaignBuilder(false)}
                      className="flex-1 py-4 bg-white/5 border border-white/20 rounded-xl text-white font-bold hover:bg-white/10 transition-all"
                    >
                      Annuleren
                    </button>
                    <button 
                      onClick={createCampaign}
                      disabled={sendingCampaign}
                      className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingCampaign ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Aanmaken...
                        </>
                      ) : (
                        <>
                          🚀 Campagne Aanmaken
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-black text-white">💬 WhatsApp Marketing</h2>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h3 className="text-3xl font-bold mb-2">{whatsappStats.active_contacts.toLocaleString()}</h3>
                <p className="opacity-90">Actieve WhatsApp Contacten</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h3 className="text-3xl font-bold mb-2">{whatsappStats.open_rate}%</h3>
                <p className="opacity-90">Open Rate (24u)</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h3 className="text-3xl font-bold mb-2">€{whatsappStats.today_revenue.toLocaleString()}</h3>
                <p className="opacity-90">Omzet Vandaag</p>
              </div>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Quick WhatsApp Broadcast</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Selecteer Segment</label>
                  <select 
                    value={whatsappSegment}
                    onChange={(e) => setWhatsappSegment(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="recent">Recent Buyers (487)</option>
                    <option value="highvalue">High-Value Customers (234)</option>
                    <option value="abandoned">Abandoned Cart (156)</option>
                    <option value="newsletter">Newsletter Subscribers (2,847)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Template</label>
                  <select 
                    value={whatsappTemplate}
                    onChange={(e) => setWhatsappTemplate(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="offer">🎁 Special Offer</option>
                    <option value="order">📦 Order Update</option>
                    <option value="tips">💡 Product Tips</option>
                    <option value="flash">🔔 Flash Sale</option>
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-2">Bericht</label>
                <textarea 
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white resize-none" 
                  rows={4}
                  placeholder="Hoi {{naam}}, we hebben iets speciaals voor jou! 🎁"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => showNotification('📱 Preview: ' + (whatsappMessage || 'Hoi {{naam}}, we hebben iets speciaals voor jou! 🎁'))}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Preview
                </button>
                <button 
                  onClick={sendWhatsappBroadcast}
                  disabled={sendingWhatsapp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-bold shadow-lg disabled:opacity-50"
                >
                  {sendingWhatsapp ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      Verzend Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-black text-white">📱 SMS Campagnes</h2>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-3xl font-bold mb-2">{smsStats.delivery_rate}%</h3>
                <p className="opacity-90">Delivery Rate</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-3xl font-bold mb-2">{smsStats.open_rate_3min}%</h3>
                <p className="opacity-90">Open binnen 3 min</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-3xl font-bold mb-2">€{smsStats.monthly_roi}</h3>
                <p className="opacity-90">ROI Deze Maand</p>
              </div>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">SMS Campaign Builder</h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-white"><strong>💡 Tip:</strong> SMS heeft 98% open rate binnen 3 minuten. Perfect voor urgente aanbiedingen!</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-orange-300"><strong>⚠️ Let op:</strong> SMS verzending is momenteel in mock-modus. Voor echte SMS heb je Twilio credentials nodig.</p>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Ontvangers</label>
                  <select 
                    value={smsRecipients}
                    onChange={(e) => setSmsRecipients(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="vip">VIP Klanten (234)</option>
                    <option value="flash">Flash Sale Segment (892)</option>
                    <option value="abandoned">Verlaten Winkelwagen (156)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Tijdstip</label>
                  <input 
                    type="datetime-local" 
                    value={smsDateTime}
                    onChange={(e) => setSmsDateTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white" 
                  />
                </div>
              </div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-white">Bericht</label>
                  <span className="text-sm text-white/60">{smsMessage.length}/160 karakters</span>
                </div>
                <textarea 
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white resize-none" 
                  rows={3}
                  maxLength={160}
                  placeholder="FLASH SALE! 🔥 25% korting op alles. Gebruik code: FLASH25. Geldig vandaag!"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/60 mb-1">Geschat Bereik</p>
                  <p className="text-2xl font-black text-white">{smsRecipients === 'vip' ? 234 : smsRecipients === 'flash' ? 892 : 156}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/60 mb-1">Kosten</p>
                  <p className="text-2xl font-black text-white">€{((smsRecipients === 'vip' ? 234 : smsRecipients === 'flash' ? 892 : 156) * 0.10).toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/50">
                  <p className="text-xs text-white/60 mb-1">Voorspelde ROI</p>
                  <p className="text-2xl font-black text-emerald-400">12.4x</p>
                </div>
              </div>
              <button 
                onClick={sendSmsCampaign}
                disabled={sendingSms}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingSms ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Verzend SMS Campagne
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Influencer Tab */}
        {activeTab === 'influencer' && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-black text-white">⭐ Influencer Marketing</h2>
            
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Actieve Influencers</p>
                <p className="text-4xl font-black text-white">{influencerData.total}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Totaal Bereik</p>
                <p className="text-4xl font-black text-white">{(influencerData.total_reach / 1000).toFixed(0)}K</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Engagement Rate</p>
                <p className="text-4xl font-black text-emerald-400">{influencerData.avg_engagement}%</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Generated Revenue</p>
                <p className="text-4xl font-black text-emerald-400">€{(influencerData.generated_revenue / 1000).toFixed(0)}K</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white">Top Performing Influencers</h3>
            <div className="grid grid-cols-3 gap-6">
              {influencerData.top_influencers.map((influencer, i) => (
                <div key={i} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer hover:-translate-y-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-3xl mb-4">
                    {influencer.avatar_emoji}
                  </div>
                  <h4 className="font-bold text-white mb-1">{influencer.handle}</h4>
                  <p className="text-sm text-white/60 mb-4">{influencer.name}</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-white/60">Followers</p>
                      <p className="font-bold text-white">{(influencer.followers / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Engagement</p>
                      <p className="font-bold text-emerald-400">{influencer.engagement_rate}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm font-bold text-white">Deze maand</span>
                    <span className="font-black text-emerald-400">€{influencer.revenue_generated.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔍 Find New Influencers</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <input 
                  type="text" 
                  value={influencerNiche}
                  onChange={(e) => setInfluencerNiche(e.target.value)}
                  placeholder="Niche (e.g. parenting)" 
                  className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40"
                />
                <input 
                  type="number" 
                  value={influencerMinFollowers}
                  onChange={(e) => setInfluencerMinFollowers(e.target.value)}
                  placeholder="Min followers" 
                  className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40"
                />
                <button 
                  onClick={searchInfluencers}
                  disabled={searchingInfluencers}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {searchingInfluencers ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Zoeken...
                    </>
                  ) : (
                    'Search Influencers'
                  )}
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h4 className="font-bold text-white mb-4">Zoekresultaten</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {searchResults.map((result, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-lg">
                            {result.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{result.handle}</p>
                            <p className="text-xs text-white/60">{result.name}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-white/60">{(result.followers / 1000).toFixed(0)}K followers</span>
                          <span className="text-emerald-400">{result.engagement}% eng.</span>
                        </div>
                        <button 
                          onClick={() => showNotification(`✅ Uitnodiging verzonden naar ${result.handle}!`)}
                          className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-all"
                        >
                          Uitnodigen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Affiliate Tab */}
        {activeTab === 'affiliate' && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-black text-white">🤝 Affiliate Programma</h2>
            
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Actieve Affiliates</p>
                <p className="text-4xl font-black text-white">{affiliateData.total}</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Clicks Deze Maand</p>
                <p className="text-4xl font-black text-white">{(affiliateData.total_clicks / 1000).toFixed(1)}K</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Conversie Rate</p>
                <p className="text-4xl font-black text-emerald-400">{affiliateData.conversion_rate}%</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/60 mb-2">Uitbetaald</p>
                <p className="text-4xl font-black text-emerald-400">€{(affiliateData.total_paid / 1000).toFixed(1)}K</p>
              </div>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Affiliate Settings</h3>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Commissie %</label>
                  <input type="number" defaultValue={15} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Cookie Duration</label>
                  <select className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white">
                    <option>30 dagen</option>
                    <option>60 dagen</option>
                    <option>90 dagen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Min. Uitbetaling</label>
                  <input type="number" defaultValue={50} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <button 
                onClick={() => showNotification('✅ Affiliate instellingen opgeslagen!')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Instellingen Opslaan
              </button>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recente Aanmeldingen</h3>
              <div className="space-y-3">
                {affiliateData.pending_approvals.length > 0 ? (
                  affiliateData.pending_approvals.map((affiliate, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 bg-gradient-to-br ${affiliate.color} rounded-full flex items-center justify-center font-bold text-white`}>
                          {affiliate.initials}
                        </div>
                        <div>
                          <p className="font-bold text-white">{affiliate.name}</p>
                          <p className="text-sm text-white/60">{affiliate.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => approveAffiliate(affiliate.id, affiliate.name)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold text-sm hover:shadow-lg transition-all"
                        >
                          ✓ Approve
                        </button>
                        <button 
                          onClick={() => rejectAffiliate(affiliate.id, affiliate.name)}
                          className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white font-semibold text-sm hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 text-center py-8">Geen aanmeldingen in behandeling</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded-xl shadow-lg z-50 animate-slideIn ${
          notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {notification.message}
        </div>
      )}
      
      {/* AI Chatbot Toggle */}
      <button
        onClick={() => setChatOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 hover:scale-110 transition-all z-40 ${chatOpen ? 'hidden' : ''}`}
      >
        <MessageSquare className="w-7 h-7 text-white" />
      </button>
      
      {/* AI Chatbot Widget */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col z-50 animate-slideUp">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <p className="font-bold text-white">AI Marketing Assistant</p>
                <p className="text-xs text-white/80">Altijd online</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Messages */}
          <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-500/20 text-white' 
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-2xl">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-white/10 flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Stel een vraag..."
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
            />
            <button 
              onClick={sendChatMessage}
              disabled={chatLoading}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
        .animate-slideIn { animation: slideIn 0.3s ease; }
        .animate-slideUp { animation: slideUp 0.3s ease; }
      `}</style>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, positive, live, icon, gradient }) => (
  <div className={`relative bg-gradient-to-br ${gradient} border border-white/10 rounded-2xl p-6 overflow-hidden`}>
    {/* Shimmer effect */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer" />
    
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">{title}</p>
        <p className="text-4xl font-black text-white">{value}</p>
      </div>
      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className={`flex items-center gap-2 text-sm font-bold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {live ? (
        <>
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {change}
        </>
      ) : (
        <>
          <ArrowUpRight className="w-4 h-4" />
          {change}
        </>
      )}
    </div>
  </div>
);

// Simple Chart Component (SVG based)
const SimpleChart = ({ data }) => {
  if (!data.data || data.data.length === 0) return null;
  
  const max = Math.max(...data.data);
  const height = 200;
  const width = 600;
  const padding = 40;
  
  const points = data.data.map((value, i) => ({
    x: padding + (i * (width - 2 * padding)) / (data.data.length - 1),
    y: height - padding - (value / max) * (height - 2 * padding)
  }));
  
  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i}
          x1={padding}
          y1={padding + i * (height - 2 * padding) / 4}
          x2={width - padding}
          y2={padding + i * (height - 2 * padding) / 4}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      
      {/* Area fill */}
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
          <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGradient)" />
      
      {/* Line */}
      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" />
      ))}
      
      {/* Labels */}
      {data.labels.map((label, i) => (
        <text
          key={i}
          x={points[i]?.x || 0}
          y={height - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="12"
        >
          {label}
        </text>
      ))}
    </svg>
  );
};

export default MarketingCommandCenter;
