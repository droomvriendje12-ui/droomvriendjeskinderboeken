import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  Mail, Users, Send, Upload, FileText, ChevronLeft, 
  Check, AlertTriangle, Trash2, RefreshCw, BarChart3,
  ArrowUpRight, Clock, CheckCircle, XCircle, Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MarketingCommandCenter = () => {
  const { admin } = useAdminAuth();
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  // CSV Import state
  const [csvFile, setCsvFile] = useState(null);
  const [csvSource, setCsvSource] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Queue state
  const [queueStats, setQueueStats] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  // Campaign state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchQueueStats();
    fetchTemplates();
    fetchQueueItems();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const fetchQueueStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/email/csv/queue/stats`);
      if (res.ok) {
        const data = await res.json();
        setQueueStats(data.sources || {});
      }
    } catch (e) { console.error('Stats error:', e); }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/email-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) { console.error('Templates error:', e); }
  };

  const fetchQueueItems = async () => {
    setQueueLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/email/csv/queue?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data.items || []);
      }
    } catch (e) { console.error('Queue error:', e); }
    setQueueLoading(false);
  };

  // CSV Import
  const handleFileUpload = async (file) => {
    if (!file?.name.endsWith('.csv')) {
      setImportResult({ success: false, message: 'Alleen CSV bestanden zijn toegestaan' });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (csvSource) formData.append('source', csvSource);

      const res = await fetch(`${API_URL}/api/email/csv/import`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        setCsvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchQueueStats();
        fetchQueueItems();
      } else {
        setImportResult({ success: false, message: data.detail || 'Import mislukt' });
      }
    } catch (e) {
      setImportResult({ success: false, message: 'Verbindingsfout: ' + e.message });
    }
    setImporting(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setCsvFile(file);
      handleFileUpload(file);
    }
  };

  // Campaign sending
  const startCampaign = async (source) => {
    if (!selectedTemplate) return;
    setCampaignRunning(true);
    setCampaignProgress(null);
    try {
      const res = await fetch(`${API_URL}/api/email/csv/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate,
          source: source || undefined,
          batch_size: 25,
          delay_seconds: 1.2
        })
      });
      const data = await res.json();
      if (res.ok && data.campaign_id) {
        setCampaignProgress({ total: data.total, sent: 0, failed: 0, processed: 0, percent: 0, status: 'running' });
        progressRef.current = setInterval(async () => {
          try {
            const r = await fetch(`${API_URL}/api/email/csv/campaign-progress/${data.campaign_id}`);
            if (r.ok) {
              const prog = await r.json();
              setCampaignProgress(prog);
              if (prog.status === 'completed') {
                clearInterval(progressRef.current);
                setCampaignRunning(false);
                fetchQueueStats();
                fetchQueueItems();
              }
            }
          } catch {}
        }, 2000);
      } else {
        setCampaignProgress({ status: 'error', message: data.detail || 'Campagne starten mislukt' });
        setCampaignRunning(false);
      }
    } catch (e) {
      setCampaignProgress({ status: 'error', message: e.message });
      setCampaignRunning(false);
    }
  };

  const clearQueue = async (source) => {
    if (!window.confirm(`Weet je zeker dat je ${source ? `"${source}"` : 'de hele wachtrij'} wilt verwijderen?`)) return;
    try {
      const url = source ? `${API_URL}/api/email/csv/queue?source=${encodeURIComponent(source)}` : `${API_URL}/api/email/csv/queue`;
      await fetch(url, { method: 'DELETE' });
      fetchQueueStats();
      fetchQueueItems();
    } catch (e) { console.error('Clear error:', e); }
  };

  // Stats calculations
  const totalContacts = queueStats ? Object.values(queueStats).reduce((sum, s) => sum + (s.total || 0), 0) : 0;
  const totalPending = queueStats ? Object.values(queueStats).reduce((sum, s) => sum + (s.pending || 0), 0) : 0;
  const totalSent = queueStats ? Object.values(queueStats).reduce((sum, s) => sum + (s.sent || 0), 0) : 0;
  const totalFailed = queueStats ? Object.values(queueStats).reduce((sum, s) => sum + (s.failed || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-slate-400 hover:text-slate-600 transition">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#8B7355]" />
                  Email Marketing
                </h1>
                <p className="text-sm text-slate-500">Bulk verzending & contactbeheer</p>
              </div>
            </div>
            <button onClick={() => { fetchQueueStats(); fetchQueueItems(); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" data-testid="refresh-btn">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-cards">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{totalContacts.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Totaal contacten</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{totalPending.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Wachtend</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{totalSent.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Verzonden</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{totalFailed.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Mislukt</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - Import & Send */}
          <div className="lg:col-span-3 space-y-6">

            {/* CSV Import */}
            <div className="bg-white rounded-xl border shadow-sm" data-testid="csv-import-section">
              <div className="p-5 border-b">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#8B7355]" />
                  CSV Contacten Importeren
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging ? 'border-[#8B7355] bg-[#8B7355]/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  data-testid="csv-dropzone"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setCsvFile(f); handleFileUpload(f); }
                    }}
                    className="hidden"
                    data-testid="csv-file-input"
                  />
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">
                    {importing ? 'Bezig met importeren...' : 'Sleep je CSV bestand hierheen'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">of klik om te selecteren</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">email</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">firstname</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">lastname</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">naam</span>
                  </div>
                </div>

                {/* Source tag input */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Bron label (optioneel)</label>
                  <input
                    type="text"
                    placeholder="bijv. nieuwsbrief_maart_2026"
                    value={csvSource}
                    onChange={(e) => setCsvSource(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]"
                    data-testid="csv-source-input"
                  />
                </div>

                {/* Import loading */}
                {importing && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">CSV wordt verwerkt en gevalideerd...</span>
                  </div>
                )}

                {/* Import Result */}
                {importResult && (
                  <div className={`p-4 rounded-xl ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`} data-testid="import-result">
                    <div className="flex items-start gap-3">
                      {importResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {importResult.message}
                        </p>
                        {importResult.success && (
                          <>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="bg-white p-2.5 rounded-lg text-center">
                                <div className="text-xl font-bold text-slate-800">{importResult.total_rows?.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Totaal rijen</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg text-center">
                                <div className="text-xl font-bold text-green-600">{importResult.added?.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Toegevoegd</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg text-center">
                                <div className="text-xl font-bold text-amber-500">{importResult.skipped_existing?.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Al bestaand</div>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg text-center">
                                <div className="text-xl font-bold text-red-500">{importResult.invalid?.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Ongeldig</div>
                              </div>
                            </div>
                            {importResult.columns_found && (
                              <p className="mt-2 text-xs text-slate-500">
                                Gevonden kolommen: {importResult.columns_found.join(', ')}
                              </p>
                            )}
                            {importResult.source && (
                              <p className="text-xs text-slate-500">Bron: <code className="bg-green-100 px-1 rounded">{importResult.source}</code></p>
                            )}
                          </>
                        )}
                        {importResult.invalid_emails?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-red-600 font-medium mb-1">Ongeldige e-mails:</p>
                            <div className="flex flex-wrap gap-1">
                              {importResult.invalid_emails.map((e, i) => (
                                <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{e}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Sender */}
            <div className="bg-white rounded-xl border shadow-sm" data-testid="campaign-section">
              <div className="p-5 border-b">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#8B7355]" />
                  Campagne Versturen
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Kies template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]"
                    data-testid="campaign-template-select"
                  >
                    <option value="">Selecteer een email template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
                    ))}
                  </select>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">Verzend tips:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Emails worden in batches van 25 verzonden met 1.2s pauze</li>
                    <li>Gebruik placeholders: <code className="bg-blue-100 px-1 rounded">{'{{naam}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{voornaam}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{email}}'}</code></li>
                    <li>Alleen contacten met status "pending" worden gemaild</li>
                  </ul>
                </div>

                {/* Send Button */}
                <button
                  onClick={() => startCampaign()}
                  disabled={!selectedTemplate || campaignRunning || totalPending === 0}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="campaign-send-btn"
                >
                  {campaignRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Bezig met verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Verstuur naar {totalPending.toLocaleString()} contacten
                    </>
                  )}
                </button>

                {/* Progress */}
                {campaignProgress?.status === 'running' && (
                  <div className="space-y-2" data-testid="campaign-progress">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{campaignProgress.processed || 0} / {campaignProgress.total}</span>
                      <span className="font-semibold">{campaignProgress.percent || 0}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${campaignProgress.percent || 0}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />{campaignProgress.sent || 0} verzonden</span>
                      {campaignProgress.failed > 0 && <span className="text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" />{campaignProgress.failed} mislukt</span>}
                    </div>
                  </div>
                )}

                {/* Campaign Complete */}
                {campaignProgress?.status === 'completed' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl" data-testid="campaign-result">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Campagne voltooid!</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-slate-800">{campaignProgress.total}</div>
                        <div className="text-xs text-slate-500">Totaal</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{campaignProgress.sent}</div>
                        <div className="text-xs text-slate-500">Verzonden</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-500">{campaignProgress.failed}</div>
                        <div className="text-xs text-slate-500">Mislukt</div>
                      </div>
                    </div>
                    {campaignProgress.failed_emails?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-red-600 font-medium mb-1">Mislukte adressen:</p>
                        <div className="flex flex-wrap gap-1">
                          {campaignProgress.failed_emails.map((e, i) => (
                            <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {campaignProgress?.status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {campaignProgress.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Queue Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sources Overview */}
            <div className="bg-white rounded-xl border shadow-sm" data-testid="sources-overview">
              <div className="p-5 border-b flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#8B7355]" />
                  Bronnen Overzicht
                </h2>
              </div>
              <div className="p-5">
                {!queueStats || Object.keys(queueStats).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Nog geen contacten geimporteerd</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(queueStats).map(([src, stats]) => (
                      <div key={src} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{src}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">{stats.total || 0} contacten</span>
                            <button
                              onClick={() => clearQueue(src)}
                              className="p-1 text-slate-300 hover:text-red-500 transition"
                              title="Verwijder deze bron"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(stats.pending || 0) > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{stats.pending} wachtend</span>
                          )}
                          {(stats.sent || 0) > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{stats.sent} verzonden</span>
                          )}
                          {(stats.failed || 0) > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{stats.failed} mislukt</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Queue Items */}
            <div className="bg-white rounded-xl border shadow-sm" data-testid="queue-list">
              <div className="p-5 border-b flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#8B7355]" />
                  Recente contacten
                </h2>
                {queueItems.length > 0 && (
                  <button
                    onClick={() => clearQueue()}
                    className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1"
                    data-testid="clear-all-btn"
                  >
                    <Trash2 className="w-3 h-3" />
                    Alles wissen
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {queueLoading ? (
                  <div className="p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
                  </div>
                ) : queueItems.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400 text-center">Geen contacten in de wachtrij</p>
                ) : (
                  <div className="divide-y">
                    {queueItems.slice(0, 30).map((item, i) => (
                      <div key={item.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{item.email}</p>
                          <p className="text-xs text-slate-400">{item.naam || '-'}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.status === 'sent' ? 'bg-green-100 text-green-700' :
                          item.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {item.status === 'sent' ? 'Verzonden' : item.status === 'failed' ? 'Mislukt' : 'Wachtend'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingCommandCenter;
