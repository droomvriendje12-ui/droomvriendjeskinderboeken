import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  Star, 
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Package,
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  FileText,
  Edit,
  Save,
  X as XIcon,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Inbox,
  Check
} from 'lucide-react';
import { products as mockProducts } from '../mockData';


const AdminReviewsToolAdvanced = () => {
  // Import section state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  // Reviews management state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  
  // Bulk operations state
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  
  // Edit mode state
  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('manage');
  const [showFilters, setShowFilters] = useState(false);

  // Products from Supabase
  const [products, setProducts] = useState([]);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.map(p => ({
          id: p.id,
          shortName: p.short_name || p.shortName || p.name,
          name: p.name,
          image: p.image,
          price: p.price
        })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch reviews from database
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews/admin`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoadingReviews(false);
  };

  // Fetch review stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reviews/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchStats();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Selecteer een CSV-bestand');
    }
  };

  // Handle CSV import
  const handleImport = async () => {
    if (!selectedProduct || !file) {
      alert('Selecteer een product en CSV-bestand');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', selectedProduct.id);
      formData.append('product_name', selectedProduct.shortName);

      const response = await fetch(`/api/reviews/import-csv`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResult({
          success: true,
          ...result
        });
        fetchReviews();
        fetchStats();
        setFile(null);
      } else {
        setImportResult({
          success: false,
          errors: [result.detail || 'Import mislukt']
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [error.message]
      });
    }

    setImporting(false);
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Weet je zeker dat je deze review wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchReviews();
        fetchStats();
      } else {
        alert('Verwijderen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Handle toggle visibility
  const handleToggleVisibility = async (reviewId, currentVisible) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/visibility?visible=${!currentVisible}`, {
        method: 'PUT'
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Wijzigen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Handle edit review
  const handleEditClick = (review) => {
    setEditingReview(review.id);
    setEditFormData({
      name: review.name,
      rating: review.rating,
      title: review.title,
      text: review.text,
      verified: review.verified,
      avatar: review.avatar
    });
  };

  // Handle save edit
  const handleSaveEdit = async (reviewId) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        setEditingReview(null);
        setEditFormData({});
        fetchReviews();
      } else {
        alert('Wijzigen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      alert('Geen reviews geselecteerd');
      return;
    }

    if (!window.confirm(`Weet je zeker dat je ${selectedReviews.length} reviews wilt verwijderen?`)) return;

    try {
      const response = await fetch(`/api/reviews/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedReviews })
      });

      if (response.ok) {
        setSelectedReviews([]);
        setBulkMode(false);
        fetchReviews();
        fetchStats();
      } else {
        alert('Bulk verwijderen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `name,rating,title,text,verified,avatar_url,date
Silke van de Wetering,5,Klassiek met twist,Een klassieke beer met een moderne twist. Prachtig licht.,true,https://api.dicebear.com/7.x/avataaars/svg?seed=SilkeW,2026-01-12
Duuk van de Plas,5,Ideaal voor voeding,De beer is super pluizig. De lichtsterkte is ideaal voor het voeden 's nachts.,true,https://api.dicebear.com/7.x/avataaars/svg?seed=DuukP,2026-01-14
Kyra van Montfoort,2,Wazige projector,De knuffel zelf is prima maar de projector geeft een erg wazig beeld op het plafond.,true,https://api.dicebear.com/7.x/avataaars/svg?seed=KyraM,2026-01-15`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reviews-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === '' || review.rating === parseInt(filterRating);
    const matchesProduct = filterProduct === '' || review.product_name === filterProduct;
    const matchesSource = filterSource === '' || review.source === filterSource;
    const matchesVisibility = filterVisibility === '' || 
      (filterVisibility === 'visible' && review.visible !== false) ||
      (filterVisibility === 'hidden' && review.visible === false);
    
    return matchesSearch && matchesRating && matchesProduct && matchesSource && matchesVisibility;
  });

  // Get unique product names from reviews
  const productNames = [...new Set(reviews.map(r => r.product_name))];

  // Render star rating
  const renderStars = (rating, size = 'w-4 h-4') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews Beheer</h1>
                <p className="text-sm text-gray-500">Importeer, bewerk en beheer productreviews</p>
              </div>
            </div>
            <Button onClick={() => fetchReviews()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#8B7355] to-[#6d5a43] text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Totaal Reviews</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_reviews}</p>
                </div>
                <MessageSquare className="w-10 h-10 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">5-Sterren</p>
                  <p className="text-3xl font-bold mt-1">
                    {reviews.filter(r => r.rating === 5).length}
                  </p>
                </div>
                <Star className="w-10 h-10 opacity-80 fill-current" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Zichtbaar</p>
                  <p className="text-3xl font-bold mt-1">
                    {reviews.filter(r => r.visible !== false).length}
                  </p>
                </div>
                <Eye className="w-10 h-10 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Producten</p>
                  <p className="text-3xl font-bold mt-1">{stats.by_product?.length || 0}</p>
                </div>
                <Package className="w-10 h-10 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'manage'
                    ? 'border-[#8B7355] text-[#8B7355]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Reviews Beheren
                </div>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'import'
                    ? 'border-[#8B7355] text-[#8B7355]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  CSV Importeren
                </div>
              </button>
            </div>
          </div>

          {/* Import Tab Content */}
          {activeTab === 'import' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Import Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Reviews Importeren</h3>
                  
                  {/* Product Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecteer Product
                    </label>
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        setSelectedProduct(product);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                    >
                      <option value="">-- Kies een product --</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV Bestand
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#8B7355] transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {file ? file.name : 'Klik om een CSV-bestand te selecteren'}
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Import Button */}
                  <Button
                    onClick={handleImport}
                    disabled={!selectedProduct || !file || importing}
                    className="w-full bg-[#8B7355] hover:bg-[#6d5a43]"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Importeren...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importeer Reviews
                      </>
                    )}
                  </Button>

                  {/* Import Result */}
                  {importResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {importResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                            {importResult.success ? 'Import succesvol!' : 'Import mislukt'}
                          </p>
                          {importResult.success && (
                            <p className="text-sm text-green-700 mt-1">
                              {importResult.imported} reviews geïmporteerd
                              {importResult.skipped > 0 && `, ${importResult.skipped} overgeslagen`}
                            </p>
                          )}
                          {importResult.errors && importResult.errors.length > 0 && (
                            <ul className="text-sm text-red-700 mt-2 space-y-1">
                              {importResult.errors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Instructies</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">CSV Formaat</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Je CSV-bestand moet de volgende kolommen bevatten:
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                          <li>• <strong>name</strong>: Naam van de reviewer (verplicht)</li>
                          <li>• <strong>rating</strong>: 1-5 sterren (verplicht)</li>
                          <li>• <strong>title</strong>: Review titel (optioneel)</li>
                          <li>• <strong>text</strong>: Review tekst (verplicht)</li>
                          <li>• <strong>verified</strong>: true/false (optioneel, standaard true)</li>
                          <li>• <strong>avatar_url</strong>: URL naar avatar (optioneel)</li>
                          <li>• <strong>date</strong>: Datum als tekst (optioneel)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Voorbeeld CSV
                  </Button>

                  {/* Stats by Product */}
                  {stats && stats.by_product && stats.by_product.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Reviews per Product</h4>
                      <div className="space-y-2">
                        {stats.by_product.map(product => (
                          <div key={product.product_name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{product.product_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{product.count}</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-gray-600">{product.avg_rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manage Tab Content */}
          {activeTab === 'manage' && (
            <div className="p-6">
              {/* Filters and Actions Bar */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Search */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Zoek reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                  </Button>

                  {/* Bulk Mode Toggle */}
                  <Button
                    onClick={() => {
                      setBulkMode(!bulkMode);
                      setSelectedReviews([]);
                    }}
                    variant={bulkMode ? "default" : "outline"}
                    className={bulkMode ? "bg-[#8B7355] hover:bg-[#6d5a43]" : ""}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Bulk Selectie
                  </Button>

                  {/* Bulk Delete Button */}
                  {bulkMode && selectedReviews.length > 0 && (
                    <Button
                      onClick={handleBulkDelete}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijder ({selectedReviews.length})
                    </Button>
                  )}
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                      <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Alle ratings</option>
                        <option value="5">5 sterren</option>
                        <option value="4">4 sterren</option>
                        <option value="3">3 sterren</option>
                        <option value="2">2 sterren</option>
                        <option value="1">1 ster</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                      <select
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Alle producten</option>
                        {productNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bron</label>
                      <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Alle bronnen</option>
                        <option value="csv_import">CSV Import</option>
                        <option value="user_submitted">Klant Reviews</option>
                        <option value="manual">Handmatig</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Zichtbaarheid</label>
                      <select
                        value={filterVisibility}
                        onChange={(e) => setFilterVisibility(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Alles</option>
                        <option value="visible">Zichtbaar</option>
                        <option value="hidden">Verborgen</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Selection Controls */}
              {bulkMode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Inbox className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedReviews.length} van {filteredReviews.length} geselecteerd
                    </span>
                  </div>
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedReviews.length === filteredReviews.length ? 'Deselecteer alles' : 'Selecteer alles'}
                  </Button>
                </div>
              )}

              {/* Reviews List */}
              {loadingReviews ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-gray-500">Reviews laden...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    {searchTerm || filterRating || filterProduct || filterSource || filterVisibility
                      ? 'Geen reviews gevonden met deze filters'
                      : 'Nog geen reviews. Importeer je eerste reviews!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        bulkMode && selectedReviews.includes(review.id) ? 'ring-2 ring-[#8B7355]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Bulk Selection Checkbox */}
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedReviews.includes(review.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReviews([...selectedReviews, review.id]);
                              } else {
                                setSelectedReviews(selectedReviews.filter(id => id !== review.id));
                              }
                            }}
                            className="mt-1 w-4 h-4 text-[#8B7355] border-gray-300 rounded focus:ring-[#8B7355]"
                          />
                        )}

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {review.avatar ? (
                            <img
                              src={review.avatar}
                              alt={review.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-semibold">
                              {review.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          {editingReview === review.id ? (
                            // Edit Mode
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  value={editFormData.name}
                                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                  placeholder="Naam"
                                />
                                <select
                                  value={editFormData.rating}
                                  onChange={(e) => setEditFormData({ ...editFormData, rating: parseInt(e.target.value) })}
                                  className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                  <option value="5">5 sterren</option>
                                  <option value="4">4 sterren</option>
                                  <option value="3">3 sterren</option>
                                  <option value="2">2 sterren</option>
                                  <option value="1">1 ster</option>
                                </select>
                              </div>
                              <Input
                                value={editFormData.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                placeholder="Titel"
                              />
                              <textarea
                                value={editFormData.text}
                                onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                                placeholder="Review tekst"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                              />
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editFormData.verified}
                                    onChange={(e) => setEditFormData({ ...editFormData, verified: e.target.checked })}
                                    className="w-4 h-4 text-[#8B7355] border-gray-300 rounded focus:ring-[#8B7355]"
                                  />
                                  <span className="text-sm text-gray-700">Geverifieerd</span>
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleSaveEdit(review.id)}
                                  size="sm"
                                  className="bg-[#8B7355] hover:bg-[#6d5a43]"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Opslaan
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingReview(null);
                                    setEditFormData({});
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  <XIcon className="w-4 h-4 mr-2" />
                                  Annuleren
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                                    {review.verified && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Geverifieerd
                                      </span>
                                    )}
                                    {review.visible === false && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        <EyeOff className="w-3 h-3 mr-1" />
                                        Verborgen
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    {renderStars(review.rating)}
                                    <span>•</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{review.product_name}</span>
                                    <span>•</span>
                                    <span className="text-xs">{review.date}</span>
                                  </div>
                                </div>
                              </div>
                              <h5 className="font-medium text-gray-900 mb-1">{review.title}</h5>
                              <p className="text-gray-700 text-sm mb-3">{review.text}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                  {review.source === 'csv_import' && 'CSV Import'}
                                  {review.source === 'user_submitted' && 'Klant Review'}
                                  {review.source === 'manual' && 'Handmatig'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {!bulkMode && editingReview !== review.id && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              onClick={() => handleEditClick(review)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleToggleVisibility(review.id, review.visible !== false)}
                              size="sm"
                              variant="outline"
                            >
                              {review.visible !== false ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleDeleteReview(review.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results Summary */}
              {filteredReviews.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  {filteredReviews.length} van {reviews.length} reviews
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsToolAdvanced;
