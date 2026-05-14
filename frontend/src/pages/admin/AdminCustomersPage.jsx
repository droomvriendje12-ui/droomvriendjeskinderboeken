import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, RefreshCw, ChevronLeft, Loader2, Mail, Phone, ShoppingBag,
  Euro, Calendar, X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const t = localStorage.getItem('admin_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const fmtMoney = (v) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AdminCustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const r = await fetch(`${API}/api/admin/customers?${params}`, { headers: authHeaders() });
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      setCustomers(d.customers || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openDetail = async (email) => {
    setSelected({ email, _loading: true });
    try {
      const r = await fetch(`${API}/api/admin/customers/${encodeURIComponent(email)}`, { headers: authHeaders() });
      const d = await r.json();
      setSelected(d);
    } catch (e) {
      console.error(e);
      setSelected(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100" data-testid="admin-customers-page">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900" data-testid="back-btn">
            <ChevronLeft className="w-5 h-5" /> Terug
          </button>
          <div className="h-6 w-px bg-slate-300" />
          <Users className="w-7 h-7 text-amber-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Klanten</h1>
            <p className="text-sm text-slate-500">{total} unieke klanten</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Zoek op naam, email of telefoon..."
                className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 w-72"
                data-testid="search-input"
              />
            </form>
            <button onClick={fetchCustomers} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50" data-testid="refresh-btn">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && customers.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : customers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            Nog geen klanten gevonden.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Klant</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Telefoon</th>
                  <th className="text-right px-4 py-3">Bestellingen</th>
                  <th className="text-right px-4 py-3">Betaald</th>
                  <th className="text-right px-4 py-3">Omzet</th>
                  <th className="text-left px-4 py-3">Laatste order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.email}
                    onClick={() => openDetail(c.email)}
                    className="hover:bg-amber-50/40 cursor-pointer transition"
                    data-testid={`customer-row-${c.email}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-right">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${c.paid_orders > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.paid_orders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtMoney(c.total_spent)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(c.last_order_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDetailModal data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

const CustomerDetailModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" data-testid="customer-detail-modal">
    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sticky top-0 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Klant details</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" data-testid="close-modal">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">
        {data._loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        ) : !data.customer ? (
          <div className="text-slate-500">Geen data gevonden</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Info icon={Users} label="Naam" value={data.customer.name || '—'} />
              <Info icon={Mail} label="Email" value={data.customer.email} />
              <Info icon={Phone} label="Telefoon" value={data.customer.phone || '—'} />
              <Info icon={ShoppingBag} label="Totaal bestellingen" value={data.customer.total_orders} />
              <Info icon={Euro} label="Totaal besteed" value={fmtMoney(data.customer.total_spent)} />
              <Info icon={Calendar} label="Klant sinds" value={fmtDate(data.customer.first_order_at)} />
            </div>
            {data.customer.shipping_address && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Laatst gebruikte verzendadres</div>
                <div className="text-slate-700">
                  {data.customer.shipping_address}, {data.customer.shipping_zipcode} {data.customer.shipping_city}
                </div>
              </div>
            )}

            <h3 className="text-sm font-semibold text-slate-900 mb-3">Bestellingen ({data.orders?.length || 0})</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {(data.orders || []).map((o) => (
                <div key={o.id} className="px-4 py-3 flex items-center justify-between text-sm" data-testid={`order-row-${o.id}`}>
                  <div>
                    <div className="font-medium text-slate-900">#{(o.order_number || o.id || '').slice(-8).toUpperCase()}</div>
                    <div className="text-xs text-slate-500">{fmtDate(o.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <div className="font-semibold text-slate-900 w-24 text-right">{fmtMoney(o.total_amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

const Info = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-50 rounded-lg p-3">
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-1">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <div className="text-slate-900 font-medium">{value}</div>
  </div>
);

const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = {
  pending: 'In afwachting', paid: 'Betaald', shipped: 'Verzonden',
  delivered: 'Afgeleverd', cancelled: 'Geannuleerd',
};
const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[status] || 'bg-slate-100 text-slate-600'}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

export default AdminCustomersPage;
