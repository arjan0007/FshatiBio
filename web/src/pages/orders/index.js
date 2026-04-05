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
  pending: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-50 text-blue-800 border-blue-300',
  preparing: 'bg-orange-50 text-orange-800 border-orange-300',
  on_delivery: 'bg-purple-50 text-purple-800 border-purple-300',
  delivered: 'bg-forest-50 text-forest-800 border-forest-300',
  cancelled: 'bg-red-50 text-red-800 border-red-300'
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
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto mb-4"></div>
          <div className="text-xl text-stone-600 font-display">Duke ngarkuar porositë...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Porositë e Mia - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-forest-700 rounded-2xl flex items-center justify-center shadow-warm">
              <span className="text-2xl">📦</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-900">
              Porositë e Mia
            </h1>
          </div>
          <p className="text-stone-500 ml-15 pl-1">Menaxho dhe shiko të gjitha porositë tuaja</p>
        </div>

        {/* Stats Cards */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stone-500 text-xs sm:text-sm font-medium mb-1">Total Porositë</p>
                  <p className="text-2xl sm:text-3xl font-bold text-stone-900">{stats.total}</p>
                </div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stone-500 text-xs sm:text-sm font-medium mb-1">Në Pritje</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stone-500 text-xs sm:text-sm font-medium mb-1">E Dorëzuara</p>
                  <p className="text-2xl sm:text-3xl font-bold text-forest-700">{stats.delivered}</p>
                </div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-forest-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all p-5 md:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-stone-500 text-xs sm:text-sm font-medium mb-1">Total Shpenzuar</p>
                  <p className="text-xl sm:text-2xl font-bold text-forest-700">{stats.totalAmount.toFixed(2)} L</p>
                </div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-honey-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-3xl shadow-card p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-full font-semibold transition-all text-sm ${
                    filterStatus === 'all'
                      ? 'bg-forest-700 text-white shadow-warm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                      className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5 text-sm ${
                        filterStatus === status
                          ? `${statusColors[status]} border-2 shadow-sm`
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>{statusIcons[status]}</span>
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
                className="block bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all border-l-4 border-forest-500 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-forest-500 to-forest-700 rounded-2xl flex items-center justify-center shadow-warm flex-shrink-0">
                          <span className="text-white text-sm font-bold font-display">#{order.order_number.split('-').pop()}</span>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
                            Porosia {order.order_number}
                          </h3>
                          {order.tracking_number && (
                            <p className="text-sm text-stone-400">
                              Tracking: <span className="font-mono font-semibold text-stone-600">{order.tracking_number}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Data e Porosisë</p>
                            <p className="text-sm font-semibold text-stone-800">
                              {new Date(order.created_at).toLocaleDateString('sq-AL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Data e Dorëzimit</p>
                            <p className="text-sm font-semibold text-stone-800">
                              {new Date(order.delivery_date).toLocaleDateString('sq-AL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-honey-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-honey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">Totali</p>
                            <p className="text-lg font-bold text-forest-700">
                              {parseFloat(order.total).toFixed(2)} L
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status]}`}>
                        <span>{statusIcons[order.status]}</span>
                        <span>{statusLabels[order.status]}</span>
                      </span>
                      <div className="flex items-center gap-1.5 text-forest-600 text-sm font-semibold group-hover:text-forest-800 transition-colors">
                        <span>Shiko Detajet</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
