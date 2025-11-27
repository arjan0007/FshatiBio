import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../components/Header';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/cart');
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${API_URL}/cart/update/${itemId}`,
        { quantity: newQuantity },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në përditësim');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveClick = (itemId) => {
    setItemToRemove(itemId);
    setShowRemoveModal(true);
  };

  const removeItem = async () => {
    if (!itemToRemove) return;

    setUpdating(true);
    setShowRemoveModal(false);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/cart/remove/${itemToRemove}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
      setToast({
        message: 'Produkti u hoq nga shporta',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: error.response?.data?.error?.message || 'Gabim në heqjen e produktit',
        type: 'error'
      });
    } finally {
      setUpdating(false);
      setItemToRemove(null);
    }
  };

  const handleClearClick = () => {
    setShowClearModal(true);
  };

  const clearCart = async () => {
    setClearing(true);
    setShowClearModal(false);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
      setToast({
        message: 'Shporta u boshëtua me sukses',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: error.response?.data?.error?.message || 'Gabim në boshëtimin e shportës',
        type: 'error'
      });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Duke ngarkuar shportën...</div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
        <Head>
          <title>Shporta - FshatiBio</title>
        </Head>
        <Header />
        <main className="container mx-auto px-4 py-12 text-center max-w-2xl">
          <div className="bg-white rounded-xl shadow-xl p-12 border-2 border-gray-100">
            <div className="text-8xl mb-6 animate-bounce">🛒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shporta juaj është e zbrazët</h2>
            <p className="text-gray-600 mb-8">Shtoni produkte në shportë për të filluar blerjen</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
            >
              <span>🛍️</span>
              <span>Shiko Produktet</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Shporta - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl">🛒</span>
              <span>Shporta</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Produktet në shportën tuaj</p>
          </div>
          {cart && cart.items.length > 0 && (
            <button
              onClick={handleClearClick}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-xl font-semibold text-xs sm:text-sm md:text-base hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base sm:text-lg">🗑️</span>
              <span className="hidden sm:inline">Boshët Shportën</span>
              <span className="sm:hidden">Boshëto</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Produkte në Shportë</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{cart.items.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Nëntotali</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{parseFloat(cart.subtotal).toFixed(2)} L</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Totali</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{parseFloat(cart.total).toFixed(2)} L</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">💳</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {updating && (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 text-blue-700 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                  <span className="font-medium">Duke përditësuar shportën...</span>
                </div>
              </div>
            )}
            {cart.items.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-100 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product.image_urls && item.product.image_urls.length > 0 ? (
                        <img
                          src={item.product.image_urls[0]}
                          alt={item.product.name}
                          className="w-full sm:w-28 md:w-32 h-28 md:h-32 object-cover rounded-xl shadow-md"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full sm:w-28 md:w-32 h-28 md:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-gray-400 text-3xl sm:text-4xl">🖼️</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 mb-1 sm:mb-2 line-clamp-2">{item.product.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <span className="text-gray-600 font-medium text-sm sm:text-base">
                              {parseFloat(item.product.price).toFixed(2)} L / {item.product.unit}
                            </span>
                            {item.product.is_bio && (
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-[10px] sm:text-xs font-bold border border-green-300">
                                🌱 BIO
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveClick(item.id)}
                          disabled={updating}
                          className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                          title="Hiq produktin"
                        >
                          <span className="text-base sm:text-xl">🗑️</span>
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">Sasia:</span>
                          <div className="flex items-center gap-1 sm:gap-2 border-2 border-gray-300 rounded-xl">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-xl transition-colors font-bold text-base sm:text-lg"
                            >
                              −
                            </button>
                            <span className="w-10 sm:w-12 text-center font-bold text-gray-900 text-sm sm:text-base">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating || item.quantity >= item.product.stock_quantity}
                              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-xl transition-colors font-bold text-base sm:text-lg"
                            >
                              +
                            </button>
                          </div>
                          {item.quantity >= item.product.stock_quantity && (
                            <span className="text-[10px] sm:text-xs text-orange-600 font-medium flex items-center gap-1">
                              <span>⚠️</span>
                              <span>Maksimum</span>
                            </span>
                          )}
                        </div>
                        <div className="text-right sm:text-left lg:text-right">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Total:</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-700">
                            {parseFloat(item.total_price).toFixed(2)} L
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-4 sm:p-5 md:p-6 sticky top-4 border-2 border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">📋</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Përmbledhje e Porosisë</h2>
              </div>
              
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">Nëntotali:</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{parseFloat(cart.subtotal).toFixed(2)} L</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">Tarifa e dërgesës:</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{parseFloat(cart.delivery_fee).toFixed(2)} L</span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4 flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Totali:</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-700">{parseFloat(cart.total).toFixed(2)} L</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-3 sm:py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base md:text-lg mb-2 sm:mb-3"
              >
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg">💳</span>
                  <span className="hidden sm:inline">Vazhdo te Checkout</span>
                  <span className="sm:hidden">Checkout</span>
                  <span className="text-base sm:text-lg">→</span>
                </span>
              </Link>
              <Link
                href="/products"
                className="block w-full text-center py-2 sm:py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm sm:text-base"
              >
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg">🛍️</span>
                  <span className="hidden sm:inline">Vazhdo me blerje</span>
                  <span className="sm:hidden">Bli më shumë</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearCart}
        title="Boshët Shportën"
        message="A jeni të sigurt që dëshironi të boshëtoni të gjithë shportën? Kjo veprim nuk mund të zhbëhet dhe të gjitha produktet do të hiqen."
        confirmText="Po, Boshët Shportën"
        cancelText="Anulo"
        type="danger"
        loading={clearing}
      />

      {/* Remove Item Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setItemToRemove(null);
        }}
        onConfirm={removeItem}
        title="Hiq Produktin"
        message="A jeni të sigurt që dëshironi të hiqni këtë produkt nga shporta?"
        confirmText="Po, Hiq Produktin"
        cancelText="Anulo"
        type="warning"
        loading={updating}
      />
    </div>
  );
}

