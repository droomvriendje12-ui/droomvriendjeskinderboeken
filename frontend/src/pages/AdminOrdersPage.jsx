import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Package, Truck, Mail, Check, X, Search, RefreshCw, Printer, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Manual carrier configurations (fallback)
const MANUAL_CARRIERS = {
  postnl: { name: 'PostNL', trackingUrl: (code) => `https://postnl.nl/tracktrace/?B=${code}&P=&D=NL&T=C`, logo: '📦' },
  dhl: { name: 'DHL', trackingUrl: (code) => `https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${code}`, logo: '🚚' },
  dpd: { name: 'DPD', trackingUrl: (code) => `https://tracking.dpd.de/parcelstatus?locale=nl_NL&query=${code}`, logo: '📮' },
  gls: { name: 'GLS', trackingUrl: (code) => `https://gls-group.eu/NL/nl/volg-je-pakket?match=${code}`, logo: '🚛' },
  bpost: { name: 'bpost', trackingUrl: (code) => `https://track.bpost.cloud/btr/web/#/search?itemCode=${code}`, logo: '🇧🇪' }
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingMode, setShippingMode] = useState('sendcloud'); // 'sendcloud' or 'manual'
  
  // Manual tracking state
  const [trackingCode, setTrackingCode] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('postnl');
  
  // Sendcloud state
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [weight, setWeight] = useState('0.5');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchShippingMethods();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  const fetchShippingMethods = async () => {
    try {
      const response = await fetch(`/api/sendcloud/shipping-methods`);
      if (response.ok) {
        const data = await response.json();
        const nlMethods = (data.shipping_methods || []).filter(m => 
          m.countries?.includes('NL') || m.countries?.includes('BE')
        );
        setShippingMethods(nlMethods);
        if (nlMethods.length > 0) {
          setSelectedShippingMethod(nlMethods[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
    }
  };

  const handleSendcloudShip = async (orderId) => {
    if (!selectedShippingMethod) {
      setMessage({ type: 'error', text: 'Selecteer een verzendmethode' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/sendcloud/create-parcel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          shipping_method_id: selectedShippingMethod,
          weight: parseFloat(weight) || 0.5,
          request_label: true
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `Verzendlabel aangemaakt! Tracking: ${data.tracking_number}`,
          labelUrl: data.label_url
        });
        setSelectedOrder(null);
        fetchOrders();
      } else {
        setMessage({ type: 'error', text: data.detail || 'Fout bij aanmaken verzendlabel' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij verbinden met Sendcloud' });
    }
    setSaving(false);
  };

  const handleManualTracking = async (orderId) => {
    if (!trackingCode.trim()) {
      setMessage({ type: 'error', text: 'Voer een track & trace code in' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_code: trackingCode.trim(),
          carrier: selectedCarrier,
          send_email: true
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Track & trace toegevoegd en email verzonden!' });
        setSelectedOrder(null);
        setTrackingCode('');
        fetchOrders();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Fout bij opslaan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij verbinden met server' });
    }
    setSaving(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      shipped: 'bg-blue-100 text-blue-800',
      delivered: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'In afwachting',
      paid: 'Betaald',
      shipped: 'Verzonden',
      delivered: 'Afgeleverd',
      cancelled: 'Geannuleerd',
      failed: 'Mislukt'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      order.order_id?.toLowerCase().includes(search) ||
      order.customer_email?.toLowerCase().includes(search) ||
      order.customer_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Bestellingen Beheer</h1>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Sendcloud Connected
              </span>
            </div>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                {message.type === 'success' ? <Check className="inline w-4 h-4 mr-2" /> : <X className="inline w-4 h-4 mr-2" />}
                {message.text}
              </div>
              <div className="flex items-center gap-2">
                {message.labelUrl && (
                  <a 
                    href={message.labelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    <Printer className="w-4 h-4" />
                    Print Label
                  </a>
                )}
                <button onClick={() => setMessage(null)} className="text-lg">×</button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Zoek op bestelnummer, email of naam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-sm text-gray-500">Totaal</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
              <div className="text-sm text-gray-500">In afwachting</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'paid').length}</div>
              <div className="text-sm text-gray-500">Betaald</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'shipped').length}</div>
              <div className="text-sm text-gray-500">Verzonden</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{orders.filter(o => o.tracking_code).length}</div>
              <div className="text-sm text-gray-500">Met tracking</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Bestellingen ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Laden...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Geen bestellingen gevonden</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Bestelling</th>
                      <th className="text-left p-3 font-medium text-gray-700">Klant</th>
                      <th className="text-left p-3 font-medium text-gray-700">Bedrag</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 font-medium text-gray-700">Track & Trace</th>
                      <th className="text-left p-3 font-medium text-gray-700">Datum</th>
                      <th className="text-left p-3 font-medium text-gray-700">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <React.Fragment key={order.order_id}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-mono text-sm font-medium">#{order.order_id?.slice(-8).toUpperCase()}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                          </td>
                          <td className="p-3 font-medium">€{order.total_amount?.toFixed(2)}</td>
                          <td className="p-3">{getStatusBadge(order.status)}</td>
                          <td className="p-3">
                            {order.tracking_code ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={order.tracking_url || MANUAL_CARRIERS[order.carrier]?.trackingUrl(order.tracking_code)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm font-mono flex items-center gap-1"
                                >
                                  {order.tracking_code}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('nl-NL')}
                          </td>
                          <td className="p-3">
                            {order.status === 'paid' && !order.tracking_code && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedOrder(selectedOrder === order.order_id ? null : order.order_id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Verzenden
                              </Button>
                            )}
                            {order.tracking_code && order.label_url && (
                              <a
                                href={order.label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                              >
                                <Printer className="w-4 h-4" />
                                Label
                              </a>
                            )}
                          </td>
                        </tr>
                        
                        {/* Shipping Panel */}
                        {selectedOrder === order.order_id && (
                          <tr className="bg-blue-50">
                            <td colSpan="7" className="p-4">
                              {/* Mode Toggle */}
                              <div className="flex gap-2 mb-4">
                                <button
                                  onClick={() => setShippingMode('sendcloud')}
                                  className={`px-4 py-2 rounded-lg font-medium ${shippingMode === 'sendcloud' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                                >
                                  📦 Sendcloud (Automatisch)
                                </button>
                                <button
                                  onClick={() => setShippingMode('manual')}
                                  className={`px-4 py-2 rounded-lg font-medium ${shippingMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                                >
                                  ✏️ Handmatig
                                </button>
                              </div>

                              {shippingMode === 'sendcloud' ? (
                                /* Sendcloud Mode */
                                <div className="flex flex-wrap items-end gap-4">
                                  <div className="flex-1 min-w-[250px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Verzendmethode</label>
                                    <select
                                      value={selectedShippingMethod || ''}
                                      onChange={(e) => setSelectedShippingMethod(parseInt(e.target.value))}
                                      className="w-full border rounded-md px-3 py-2 bg-white"
                                    >
                                      <option value="">Selecteer methode...</option>
                                      {shippingMethods.map((method) => (
                                        <option key={method.id} value={method.id}>
                                          {method.carrier} - {method.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="w-32">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gewicht (kg)</label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0.1"
                                      value={weight}
                                      onChange={(e) => setWeight(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleSendcloudShip(order.order_id)}
                                    disabled={saving || !selectedShippingMethod}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {saving ? 'Bezig...' : (
                                      <>
                                        <Printer className="w-4 h-4 mr-1" />
                                        Label Aanmaken
                                      </>
                                    )}
                                  </Button>
                                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                    Annuleren
                                  </Button>
                                </div>
                              ) : (
                                /* Manual Mode */
                                <div className="flex flex-wrap items-end gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Verzendservice</label>
                                    <select
                                      value={selectedCarrier}
                                      onChange={(e) => setSelectedCarrier(e.target.value)}
                                      className="border rounded-md px-3 py-2 bg-white"
                                    >
                                      {Object.entries(MANUAL_CARRIERS).map(([key, carrier]) => (
                                        <option key={key} value={key}>{carrier.logo} {carrier.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Track & Trace Code</label>
                                    <Input
                                      placeholder="Bijv. 3SABCD1234567890"
                                      value={trackingCode}
                                      onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleManualTracking(order.order_id)}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {saving ? 'Opslaan...' : (
                                      <>
                                        <Mail className="w-4 h-4 mr-1" />
                                        Opslaan & Email
                                      </>
                                    )}
                                  </Button>
                                  <Button variant="outline" onClick={() => { setSelectedOrder(null); setTrackingCode(''); }}>
                                    Annuleren
                                  </Button>
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-500 mt-3">
                                <Mail className="inline w-4 h-4 mr-1" />
                                De klant ontvangt automatisch een email met de tracking link
                              </p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
