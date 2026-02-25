import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Plus, Edit2, Trash2, Eye, Copy, Save, X, 
  ChevronLeft, Code, Link, Variable, Send, CheckCircle,
  Upload, FileArchive, Image, FolderOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const EmailTemplatesAdmin = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [availableVariables, setAvailableVariables] = useState({});
  const [cartLinkTemplates, setCartLinkTemplates] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [assets, setAssets] = useState([]);
  const [showAssets, setShowAssets] = useState(false);
  const fileInputRef = useRef(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    description: '',
    category: 'marketing',
    cartLink: '',
    active: true
  });

  useEffect(() => {
    fetchTemplates();
    fetchVariables();
    fetchAssets();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariables = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates/variables`);
      if (response.ok) {
        const data = await response.json();
        setAvailableVariables(data.variables || {});
        setCartLinkTemplates(data.cartLinkTemplates || {});
      }
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates/assets`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleZipUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'marketing');

      const response = await fetch(`${API_URL}/api/email-templates/upload-zip`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({ success: true, message: `Template "${result.template.name}" aangemaakt met ${result.images_saved} afbeeldingen!` });
        await fetchTemplates();
        await fetchAssets();
      } else {
        setUploadResult({ success: false, message: result.detail || 'Upload mislukt' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({ success: false, message: 'Upload mislukt: ' + error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: getDefaultTemplate(),
      description: '',
      category: 'marketing',
      cartLink: 'https://droomvriendjes.nl/checkout?product=leeuw&quantity=1',
      active: true
    });
    setIsEditing(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      description: template.description || '',
      category: template.category || 'marketing',
      cartLink: template.cartLink || '',
      active: template.active
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const url = selectedTemplate 
        ? `${API_URL}/api/email-templates/${selectedTemplate.id}`
        : `${API_URL}/api/email-templates`;
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
        await fetchTemplates();
        setIsEditing(false);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveStatus('error');
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Weet je zeker dat je deze template wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${templateId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicate = async (templateId) => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${templateId}/duplicate`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate && !formData.content) return;
    
    try {
      const templateId = selectedTemplate?.id;
      
      if (templateId) {
        const response = await fetch(`${API_URL}/api/email-templates/${templateId}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          setPreviewHtml(data.content);
          setShowPreview(true);
        }
      } else {
        // Preview without saving
        let html = formData.content;
        const testData = {
          firstname: 'Jan',
          lastname: 'de Vries',
          discount_code: 'FAMILIE20',
          discount_percentage: '20%',
          cart_link: formData.cartLink || 'https://droomvriendjes.nl/checkout',
          unsubscribe_link: 'https://droomvriendjes.nl/unsubscribe'
        };
        
        Object.entries(testData).forEach(([key, value]) => {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        
        setPreviewHtml(html);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData({ ...formData, content: newText });
    }
  };

  const getDefaultTemplate = () => {
    return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #8B7355, #6d5a45); }
        .content { padding: 30px; background: #fff; }
        h1 { color: #8B7355; }
        .cta-button { display: block; text-align: center; background: #8B7355; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px auto; max-width: 250px; }
        .footer { text-align: center; padding: 20px; background: #f5f5f5; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/email-assets/logo.jpg" alt="Droomvriendjes" style="height: 60px;">
    </div>
    <div class="content">
        <h1>Hallo {{firstname}}!</h1>
        <p>Hier komt je email content...</p>
        <a href="{{cart_link}}" class="cta-button">Bestel Nu →</a>
    </div>
    <div class="footer">
        <p>© 2024 Droomvriendjes | <a href="{{unsubscribe_link}}">Uitschrijven</a></p>
    </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-[#8B7355]" />
                  Email Templates
                </h1>
                <p className="text-sm text-gray-500">Maak en beheer email marketing templates</p>
              </div>
            </div>
            <Button onClick={handleCreateNew} className="bg-[#8B7355] hover:bg-[#6d5a45]">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Template
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isEditing ? (
          /* Editor View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {selectedTemplate ? 'Template Bewerken' : 'Nieuwe Template'}
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Annuleren
                    </Button>
                    <Button onClick={handlePreview} variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button onClick={handleSave} className="bg-[#8B7355] hover:bg-[#6d5a45]">
                      {saveStatus === 'saving' ? (
                        <span className="animate-spin">⏳</span>
                      ) : saveStatus === 'saved' ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      {saveStatus === 'saved' ? 'Opgeslagen!' : 'Opslaan'}
                    </Button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Template Naam</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Bijv. Familie Campagne"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categorie</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="marketing">Marketing</option>
                        <option value="transactional">Transactie</option>
                        <option value="notification">Notificatie</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Onderwerp</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Beste {{firstname}}, bekijk onze nieuwe collectie!"
                    />
                    <p className="text-xs text-gray-500 mt-1">Gebruik {"{{variabelen}}"} voor personalisatie</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Winkelwagen Link
                    </label>
                    <Input
                      value={formData.cartLink}
                      onChange={(e) => setFormData({ ...formData, cartLink: e.target.value })}
                      placeholder="https://droomvriendjes.nl/checkout?product=leeuw&quantity=1"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button 
                        onClick={() => setFormData({ ...formData, cartLink: 'https://droomvriendjes.nl/checkout?product=leeuw&quantity=1' })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Leeuw
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, cartLink: 'https://droomvriendjes.nl/checkout?product=schaap&quantity=1' })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Schaap
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, cartLink: 'https://droomvriendjes.nl/checkout?bundle=family&quantity=3&code=FAMILIE20' })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Familie Bundle + Korting
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Beschrijving</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Korte beschrijving van deze template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      HTML Content
                    </label>
                    <textarea
                      id="template-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full h-96 px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="<!DOCTYPE html>..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="active" className="text-sm">Template is actief</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Variables Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Beschikbare Variabelen
                </h3>
                <div className="space-y-2">
                  {Object.entries(availableVariables).map(([key, desc]) => (
                    <button
                      key={key}
                      onClick={() => insertVariable(key)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <code className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
                        {`{{${key}}}`}
                      </code>
                      <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3">📷 Beschikbare Afbeeldingen</h3>
                <div className="space-y-2 text-sm">
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/logo.jpg</code></p>
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/schaap.jpg</code></p>
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/panda.jpg</code></p>
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/dino.jpg</code></p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border">
                <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Geen templates</h3>
                <p className="text-gray-500 mb-4">Maak je eerste email template aan</p>
                <Button onClick={handleCreateNew} className="bg-[#8B7355] hover:bg-[#6d5a45]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Template
                </Button>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        template.category === 'marketing' ? 'bg-blue-100 text-blue-700' :
                        template.category === 'transactional' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${template.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description || template.subject}</p>
                  
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.slice(0, 3).map((v) => (
                        <span key={v} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                          {`{{${v}}}`}
                        </span>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs text-gray-400">+{template.variables.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)} className="flex-1">
                      <Edit2 className="w-3 h-3 mr-1" />
                      Bewerken
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(template.id)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesAdmin;
