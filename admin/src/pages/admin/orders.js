import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const statusLabels = {
  pending: 'Në Pritje',
  confirmed: 'E Konfirmuar',
  preparing: 'Duke Përgatitur',
  on_delivery: 'Në Dërgesë',
  delivered: 'E Dorëzuar',
  cancelled: 'E Anuluar'
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border border-orange-200',
  on_delivery: 'bg-purple-100 text-purple-800 border border-purple-200',
  delivered: 'bg-forest-100 text-forest-800 border border-forest-200',
  cancelled: 'bg-red-100 text-red-800 border border-red-200'
};

const statusIcons = {
  pending: '⏳',
  confirmed: '✅',
  preparing: '👨‍🍳',
  on_delivery: '🚚',
  delivered: '📦',
  cancelled: '❌'
};

export default function OrdersManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const response = await axios.get(`${API_URL}/admin/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchOrders();
      alert('Statusi u përditësua!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-medium">Duke ngarkuar porositë...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Porositë - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl text-forest-900 flex items-center gap-3">
              <span>📦</span> Menaxho Porositë
            </h1>
            <p className="text-forest-600 text-sm mt-1">Shiko dhe menaxho të gjitha porositë</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl shadow-card p-5 border border-forest-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-xs font-semibold uppercase tracking-wide mb-1">Total</p>
                <p className="text-3xl font-bold text-forest-900">{orders.length}</p>
              </div>
              <div className="w-11 h-11 bg-forest-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5 border border-forest-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-xs font-semibold uppercase tracking-wide mb-1">Në Pritje</p>
                <p className="text-3xl font-bold text-amber-600">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5 border border-forest-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-xs font-semibold uppercase tracking-wide mb-1">Në Dërgesë</p>
                <p className="text-3xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'on_delivery').length}
                </p>
              </div>
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">🚚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5 border border-forest-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-xs font-semibold uppercase tracking-wide mb-1">E Dorëzuara</p>
                <p className="text-3xl font-bold text-forest-600">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <div className="w-11 h-11 bg-forest-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5 border border-forest-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-xs font-semibold uppercase tracking-wide mb-1">Total Shitje</p>
                <p className="text-xl font-bold text-honey-600">
                  {orders.reduce((sum, o) => sum + parseFloat(o.total), 0).toFixed(2)} L
                </p>
              </div>
              <div className="w-11 h-11 bg-honey-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-card p-5 border border-forest-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-forest-50 rounded-xl flex items-center justify-center">
              <span className="text-lg">🔍</span>
            </div>
            <h2 className="font-display text-lg text-forest-900">Filtro Porositë</h2>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 transition-colors font-medium text-forest-800"
          >
            <option value="">Të gjitha porositë</option>
            <option value="pending">⏳ Në Pritje</option>
            <option value="confirmed">✅ E Konfirmuar</option>
            <option value="preparing">👨‍🍳 Duke Përgatitur</option>
            <option value="on_delivery">🚚 Në Dërgesë</option>
            <option value="delivered">📦 E Dorëzuar</option>
            <option value="cancelled">❌ E Anuluar</option>
          </select>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center border border-forest-100">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="font-display text-2xl text-forest-900 mb-2">Nuk ka porosi</h2>
            <p className="text-forest-600">Nuk u gjetën porosi që përputhen me filterin</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-forest-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-forest-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Numri</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Klienti</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Totali</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Statusi</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr
                      key={order.id}
                      className="hover:bg-forest-50/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-4 py-3 border-b border-forest-50">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-gradient-to-br from-forest-700 to-forest-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">#{order.order_number.split('-').pop()}</span>
                          </div>
                          <div>
                            <div className="font-bold text-forest-900 text-sm">{order.order_number}</div>
                            {order.tracking_number && (
                              <div className="text-xs text-forest-500 font-mono">Track: {order.tracking_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-forest-50">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-forest-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-forest-600 text-sm">👤</span>
                          </div>
                          <div>
                            <div className="font-semibold text-forest-900 text-sm">{order.customer_name}</div>
                            <div className="text-xs text-forest-500">{order.customer_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-forest-50">
                        <div className="text-sm font-medium text-forest-800">
                          {new Date(order.created_at).toLocaleDateString('sq-AL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        {order.delivery_date && (
                          <div className="text-xs text-forest-500">
                            Dorëzim: {new Date(order.delivery_date).toLocaleDateString('sq-AL')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-forest-50">
                        <div className="text-base font-bold text-forest-700">
                          {parseFloat(order.total).toFixed(2)} L
                        </div>
                        {order.payment_method && (
                          <div className="text-xs text-forest-500">
                            {order.payment_method === 'cod' ? '💵 Cash' : '💳 Online'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-forest-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold gap-1 ${statusColors[order.status]}`}>
                          <span>{statusIcons[order.status]}</span>
                          <span>{statusLabels[order.status]}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-forest-50">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="px-3 py-2 border-2 border-forest-100 rounded-xl focus:outline-none focus:border-forest-400 transition-colors font-medium text-sm bg-white text-forest-800 cursor-pointer"
                        >
                          <option value="pending">⏳ Në Pritje</option>
                          <option value="confirmed">✅ E Konfirmuar</option>
                          <option value="preparing">👨‍🍳 Duke Përgatitur</option>
                          <option value="on_delivery">🚚 Në Dërgesë</option>
                          <option value="delivered">📦 E Dorëzuar</option>
                          <option value="cancelled">❌ E Anuluar</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
