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
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  preparing: 'bg-purple-100 text-purple-800 border-purple-300',
  on_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar porositë...</p>
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

      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">📦</span>
              <span>Menaxho Porositë</span>
            </h1>
            <p className="text-gray-600">Shiko dhe menaxho të gjitha porositë</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Porositë</p>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Në Pritje</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Në Dërgesë</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {orders.filter(o => o.status === 'on_delivery').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">E Dorëzuara</p>
                <p className="text-3xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Shitje</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {orders.reduce((sum, o) => sum + parseFloat(o.total), 0).toFixed(2)} L
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Filtro Porositë</h2>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-6 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all font-medium"
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
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuk ka porosi</h2>
            <p className="text-gray-600">Nuk u gjetën porosi që përputhen me filterin</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Numri</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Klienti</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Totali</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Statusi</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order, index) => (
                    <tr 
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">#{order.order_number.split('-').pop()}</span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{order.order_number}</div>
                            {order.tracking_number && (
                              <div className="text-xs text-gray-500 font-mono">Tracking: {order.tracking_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-lg">👤</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                          </div>
                        </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📅</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(order.created_at).toLocaleDateString('sq-AL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            {order.delivery_date && (
                              <div className="text-xs text-gray-500">
                                Dorëzim: {new Date(order.delivery_date).toLocaleDateString('sq-AL')}
                              </div>
                            )}
                          </div>
                        </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">💰</span>
                          <div>
                            <div className="text-lg font-bold text-green-700">
                    {parseFloat(order.total).toFixed(2)} L
                            </div>
                            {order.payment_method && (
                              <div className="text-xs text-gray-500">
                                {order.payment_method === 'cod' ? '💵 Cash' : '💳 Online'}
                              </div>
                            )}
                          </div>
                        </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 flex items-center gap-1.5 w-fit ${statusColors[order.status]}`}>
                          <span className="text-sm">{statusIcons[order.status]}</span>
                          <span>{statusLabels[order.status]}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all font-medium text-sm bg-white hover:bg-gray-50 cursor-pointer"
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

