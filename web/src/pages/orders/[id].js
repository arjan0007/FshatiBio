import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';

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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  on_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrder(response.data.data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Jeni të sigurt që dëshironi të anuloni këtë porosi?')) {
      return;
    }

    setCancelling(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_URL}/orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Porosia u anulua me sukses!');
      fetchOrder(); // Refresh order data
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error?.message || 'Gabim në anulimin e porosisë');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Duke ngarkuar detajet e porosisë...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">Porosia nuk u gjet</div>
            <p className="text-gray-600 mb-6">Porosia që po kërkoni nuk ekziston ose nuk keni akses.</p>
            <Link href="/orders" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              Kthehu te Porositë
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Porosia #{order.order_number} - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-6xl">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link 
            href="/orders" 
            className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 hover:text-green-700 font-medium transition-colors group text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl group-hover:-translate-x-1 transition-transform">←</span>
            <span>Kthehu te Porositë</span>
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-white animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 drop-shadow-lg truncate">
                    Porosia #{order.order_number}
                  </h1>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-green-100">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm md:text-base truncate">
                      {new Date(order.created_at).toLocaleDateString('sq-AL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm md:text-base shadow-lg border-2 border-white/30 flex-shrink-0 ${statusColors[order.status].replace('bg-', 'bg-white/20 ').replace('text-', 'text-white ')}`}>
              {statusLabels[order.status]}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-3 sm:p-4 text-green-700 animate-fade-in">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl">✅</span>
              <span className="font-medium text-sm sm:text-base">{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 text-red-700 animate-fade-in">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl">⚠️</span>
              <span className="font-medium text-sm sm:text-base">{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-gray-100 animate-fade-in">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">🛍️</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Produktet</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {order.items.map((item, index) => (
                  <div 
                    key={item.product.id} 
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {item.product.image_urls && item.product.image_urls.length > 0 ? (
                      <img
                        src={item.product.image_urls[0]}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-xl flex-shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl sm:text-3xl">🖼️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2 break-words">{item.product.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Sasia: {item.quantity}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Çmimi: {item.unit_price.toFixed(2)} L</span>
                      </div>
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                        <span className="text-base sm:text-lg font-bold text-purple-600">
                          Total: {item.total_price.toFixed(2)} L
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-gray-100 animate-fade-in">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">📍</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Adresa e Dorëzimit</h2>
              </div>
              <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-100">
                <div className="space-y-1.5 sm:space-y-2">
                  <p className="font-bold text-base sm:text-lg text-gray-900 break-words flex items-center gap-1.5 sm:gap-2">
                    <span className="text-base sm:text-lg">🏠</span>
                    <span>{order.address.street}</span>
                  </p>
                  <p className="text-gray-700 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                    <span className="text-base sm:text-lg">🏙️</span>
                    <span>{order.address.city}, {order.address.postal_code}</span>
                  </p>
                  {order.address.delivery_notes && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-indigo-200">
                      <p className="text-gray-700 text-xs sm:text-sm break-words">
                        <span className="font-bold">📝 Shënime:</span> {order.address.delivery_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-gray-100 animate-fade-in">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">🚚</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informacione për Dorëzimin</h2>
              </div>
              <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl flex-shrink-0">📅</span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Data</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {new Date(order.delivery_date).toLocaleDateString('sq-AL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {order.delivery_time_slot && (
                  <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-blue-200">
                    <span className="text-xl sm:text-2xl flex-shrink-0">⏰</span>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Orari</p>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">{order.delivery_time_slot}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-gray-100 animate-fade-in">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">💳</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pagesa</h2>
              </div>
              <div className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl flex-shrink-0">💵</span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Metoda</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-green-200">
                  <span className="text-xl sm:text-2xl flex-shrink-0">✓</span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Statusi</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900 capitalize">{order.payment_status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-xl p-4 sm:p-5 md:p-6 border-2 border-gray-100 sticky top-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">💰</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Përmbledhje</h2>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium text-xs sm:text-sm">Nëntotali:</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{order.subtotal.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium text-xs sm:text-sm">Dërgesa:</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{order.delivery_fee.toFixed(2)} L</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <span className="text-green-700 font-medium text-xs sm:text-sm">Zbritje:</span>
                    <span className="font-bold text-green-700 text-xs sm:text-sm md:text-base">-{order.discount_amount.toFixed(2)} L</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4 flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Totali:</span>
                  <span className="text-xl sm:text-2xl font-black text-green-700">{order.total.toFixed(2)} L</span>
                </div>
              </div>

              {/* Cancel Button */}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                  >
                    {cancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">Duke anuluar...</span>
                        <span className="sm:hidden">Anulim...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base sm:text-lg">❌</span>
                        <span className="hidden sm:inline">Anulo Porosinë</span>
                        <span className="sm:hidden">Anulo</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

