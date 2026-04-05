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
  preparing: 'bg-orange-100 text-orange-800',
  on_delivery: 'bg-purple-100 text-purple-800',
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
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto mb-4"></div>
          <div className="text-xl text-stone-600 font-display">Duke ngarkuar detajet e porosisë...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white rounded-3xl shadow-card p-10 max-w-md mx-4">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-2xl font-bold font-display text-stone-900 mb-2">Porosia nuk u gjet</div>
            <p className="text-stone-500 mb-6">Porosia që po kërkoni nuk ekziston ose nuk keni akses.</p>
            <Link href="/orders" className="bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm inline-block">
              Kthehu te Porositë
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Porosia #{order.order_number} - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Link href="/orders" className="hover:text-forest-700 transition-colors font-medium">
              Porositë
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-stone-700 font-semibold">#{order.order_number}</span>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 animate-fade-in border border-stone-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-forest-500 to-forest-700 rounded-2xl flex items-center justify-center shadow-warm flex-shrink-0">
                <span className="text-xl sm:text-2xl">📦</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-stone-900 truncate">
                  Porosia #{order.order_number}
                </h1>
                <div className="flex items-center gap-1.5 text-stone-400 mt-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs sm:text-sm">
                    {new Date(order.created_at).toLocaleDateString('sq-AL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border flex-shrink-0 ${statusColors[order.status]} border-current border-opacity-30`}>
              {statusLabels[order.status]}
            </span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-5 sm:mb-6 bg-forest-50 border border-forest-200 rounded-2xl p-4 text-forest-800 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="font-medium text-sm sm:text-base">{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 sm:mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium text-sm sm:text-base">{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">

            {/* Order Items */}
            <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-honey-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">🛍️</span>
                </div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-stone-900">Produktet</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-cream-100 rounded-2xl border border-stone-100 hover:border-forest-200 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {item.product.image_urls && item.product.image_urls.length > 0 ? (
                      <img
                        src={item.product.image_urls[0]}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-2xl flex-shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl sm:text-3xl">🖼️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-stone-900 mb-1.5 break-words">{item.product.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-500">
                        <span className="font-medium">Sasia: {item.quantity}</span>
                        <span className="hidden sm:inline text-stone-300">•</span>
                        <span>Çmimi: {item.unit_price.toFixed(2)} L</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-stone-200">
                        <span className="text-base sm:text-lg font-bold text-forest-700">
                          Total: {item.total_price.toFixed(2)} L
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">📍</span>
                </div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-stone-900">Adresa e Dorëzimit</h2>
              </div>
              <div className="p-4 sm:p-5 bg-cream-100 rounded-2xl border border-stone-100">
                <div className="space-y-2">
                  <p className="font-bold text-base sm:text-lg text-stone-900 break-words flex items-center gap-2">
                    <span>🏠</span>
                    <span>{order.address.street}</span>
                  </p>
                  <p className="text-stone-600 text-sm sm:text-base flex items-center gap-2">
                    <span>🏙️</span>
                    <span>{order.address.city}, {order.address.postal_code}</span>
                  </p>
                  {order.address.delivery_notes && (
                    <div className="mt-3 pt-3 border-t border-stone-200">
                      <p className="text-stone-600 text-xs sm:text-sm break-words">
                        <span className="font-bold">📝 Shënime:</span> {order.address.delivery_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">🚚</span>
                </div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-stone-900">Informacione për Dorëzimin</h2>
              </div>
              <div className="p-4 sm:p-5 bg-cream-100 rounded-2xl border border-stone-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-lg">📅</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-stone-400 uppercase font-semibold tracking-wide">Data</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">
                      {new Date(order.delivery_date).toLocaleDateString('sq-AL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {order.delivery_time_slot && (
                  <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-lg">⏰</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-stone-400 uppercase font-semibold tracking-wide">Orari</p>
                      <p className="text-sm sm:text-base font-bold text-stone-900">{order.delivery_time_slot}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-forest-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">💳</span>
                </div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-stone-900">Pagesa</h2>
              </div>
              <div className="p-4 sm:p-5 bg-cream-100 rounded-2xl border border-stone-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-lg">💵</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-stone-400 uppercase font-semibold tracking-wide">Metoda</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-lg">✓</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-stone-400 uppercase font-semibold tracking-wide">Statusi</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900 capitalize">{order.payment_status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 sticky top-4">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-honey-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">💰</span>
                </div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-stone-900">Përmbledhje</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-cream-100 rounded-2xl">
                  <span className="text-stone-600 font-medium text-sm">Nëntotali:</span>
                  <span className="font-bold text-stone-900 text-sm">{order.subtotal.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-cream-100 rounded-2xl">
                  <span className="text-stone-600 font-medium text-sm">Dërgesa:</span>
                  <span className="font-bold text-stone-900 text-sm">{order.delivery_fee.toFixed(2)} L</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-forest-50 rounded-2xl border border-forest-200">
                    <span className="text-forest-700 font-medium text-sm">Zbritje:</span>
                    <span className="font-bold text-forest-700 text-sm">-{order.discount_amount.toFixed(2)} L</span>
                  </div>
                )}
                <div className="border-t-2 border-stone-100 pt-4 flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-stone-900 font-display">Totali:</span>
                  <span className="text-xl sm:text-2xl font-black text-forest-700 font-display">{order.total.toFixed(2)} L</span>
                </div>
              </div>

              {/* Cancel Button */}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-2 border-stone-100">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {cancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">Duke anuluar...</span>
                        <span className="sm:hidden">Anulim...</span>
                      </>
                    ) : (
                      <>
                        <span>❌</span>
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
