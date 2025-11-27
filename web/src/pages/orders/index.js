import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/orders');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.total), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Duke ngarkuar porositë...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Porositë e Mia - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span className="text-4xl">📦</span>
            <span>Porositë e Mia</span>
          </h1>
          <p className="text-gray-600">Menaxho dhe shiko të gjitha porositë tuaja</p>
        </div>

        {/* Stats Cards */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Porositë</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Në Pritje</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">E Dorëzuara</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Shpenzuar</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.totalAmount.toFixed(2)} L</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        {orders.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                    filterStatus === 'all'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Të Gjitha ({orders.length})
                </button>
                {Object.keys(statusLabels).map((status) => {
                  const count = orders.filter(o => o.status === status).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                        filterStatus === status
                          ? `${statusColors[status]} border-2 shadow-md`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{statusIcons[status]}</span>
                      <span className="hidden sm:inline">{statusLabels[status]} ({count})</span>
                      <span className="sm:hidden">{statusLabels[status]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title={orders.length === 0 ? "Nuk keni porosi" : "Nuk u gjetën porosi me këtë filter"}
            description={orders.length === 0 
              ? "Filloni të blini produkte për të krijuar porosinë tuaj të parë"
              : "Provoni me një filter tjetër"}
            actionLabel={orders.length === 0 ? "Shiko Produktet" : "Fshi Filter"}
            onAction={() => {
              if (orders.length === 0) {
                router.push('/products');
              } else {
                setFilterStatus('all');
              }
            }}
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-green-500 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xl font-bold">#{order.order_number.split('-').pop()}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Porosia {order.order_number}
                          </h3>
                          {order.tracking_number && (
                            <p className="text-sm text-gray-500">
                              Tracking: <span className="font-mono font-semibold">{order.tracking_number}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Data e Porosisë</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(order.created_at).toLocaleDateString('sq-AL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Data e Dorëzimit</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(order.delivery_date).toLocaleDateString('sq-AL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Totali</p>
                            <p className="text-lg font-bold text-green-700">
                              {parseFloat(order.total).toFixed(2)} L
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-2 rounded-lg font-semibold text-sm border-2 flex items-center gap-2 ${statusColors[order.status]}`}>
                        <span className="text-lg">{statusIcons[order.status]}</span>
                        <span>{statusLabels[order.status]}</span>
                      </span>
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <span>Shiko Detajet</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

