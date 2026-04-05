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
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-700 font-medium">Duke ngarkuar shportën...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Head>
          <title>Shporta - FshatiBio</title>
        </Head>
        <Header />
        <main className="container mx-auto px-4 py-16 text-center max-w-lg">
          <div className="bg-white rounded-3xl shadow-card p-12">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="font-display text-3xl font-bold text-forest-900 mb-4">
              Shporta juaj është e zbrazët
            </h2>
            <p className="text-earth-600 mb-8">Shtoni produkte në shportë për të filluar blerjen</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm"
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
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Shporta - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10 max-w-7xl">
        {/* Page title */}
        <div className="mb-6 md:mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-forest-900 font-bold flex items-center gap-3">
              <span>🛒</span>
              <span>Shporta</span>
            </h1>
            <p className="text-earth-600 text-sm mt-1">Produktet në shportën tuaj</p>
          </div>
          {cart && cart.items.length > 0 && (
            <button
              onClick={handleClearClick}
              disabled={clearing}
              className="inline-flex items-center gap-2 border-2 border-red-300 text-red-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Boshët Shportën</span>
              <span className="sm:hidden">Boshëto</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-earth-500 text-xs font-medium mb-1">Produkte në Shportë</p>
                <p className="font-display text-3xl font-bold text-forest-900">{cart.items.length}</p>
              </div>
              <div className="w-12 h-12 bg-forest-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-earth-500 text-xs font-medium mb-1">Nëntotali</p>
                <p className="font-display text-2xl font-bold text-forest-900">{parseFloat(cart.subtotal).toFixed(2)} L</p>
              </div>
              <div className="w-12 h-12 bg-honey-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-earth-500 text-xs font-medium mb-1">Totali</p>
                <p className="font-display text-2xl font-bold text-forest-700">{parseFloat(cart.total).toFixed(2)} L</p>
              </div>
              <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {updating && (
              <div className="bg-forest-50 border-l-4 border-forest-500 rounded-2xl p-4 text-forest-700 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-forest-600 border-t-transparent"></div>
                  <span className="font-medium">Duke përditësuar shportën...</span>
                </div>
              </div>
            )}

            {cart.items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product.image_urls && item.product.image_urls.length > 0 ? (
                        <img
                          src={item.product.image_urls[0]}
                          alt={item.product.name}
                          className="w-full sm:w-28 md:w-32 h-28 md:h-32 rounded-2xl object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full sm:w-28 md:w-32 h-28 md:h-32 bg-forest-50 rounded-2xl flex items-center justify-center">
                          <span className="text-4xl">🌾</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-forest-900 mb-1 line-clamp-2">{item.product.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-earth-600 text-sm">
                              {parseFloat(item.product.price).toFixed(2)} L / {item.product.unit}
                            </span>
                            {item.product.is_bio && (
                              <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-0.5 rounded-full border border-forest-200">
                                🌿 BIO
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveClick(item.id)}
                          disabled={updating}
                          className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Hiq produktin"
                        >
                          <span>🗑️</span>
                        </button>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-earth-600 font-medium">Sasia:</span>
                          <div className="flex items-center gap-1 border-2 border-earth-200 rounded-xl">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="w-9 h-9 flex items-center justify-center hover:bg-forest-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-xl transition-colors font-bold text-forest-700"
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold text-forest-900 text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating || item.quantity >= item.product.stock_quantity}
                              className="w-9 h-9 flex items-center justify-center hover:bg-forest-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-xl transition-colors font-bold text-forest-700"
                            >
                              +
                            </button>
                          </div>
                          {item.quantity >= item.product.stock_quantity && (
                            <span className="text-xs text-honey-600 font-medium">⚠️ Maksimum</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-earth-500 mb-0.5">Total:</p>
                          <p className="font-display text-2xl text-forest-700 font-bold">
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
            <div className="bg-white rounded-3xl shadow-card p-6 sticky top-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-forest-100 rounded-2xl flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <h2 className="font-display text-xl font-bold text-forest-900">Përmbledhje e Porosisë</h2>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-cream-100 rounded-2xl">
                  <span className="text-earth-700 font-medium text-sm">Nëntotali:</span>
                  <span className="font-bold text-forest-900 text-sm">{parseFloat(cart.subtotal).toFixed(2)} L</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-cream-100 rounded-2xl">
                  <span className="text-earth-700 font-medium text-sm">Tarifa e dërgesës:</span>
                  <span className="font-bold text-forest-900 text-sm">{parseFloat(cart.delivery_fee).toFixed(2)} L</span>
                </div>
                <div className="border-t-2 border-earth-100 pt-3 flex justify-between items-center">
                  <span className="font-bold text-forest-900">Totali:</span>
                  <span className="font-display text-3xl text-forest-700 font-bold">{parseFloat(cart.total).toFixed(2)} L</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-forest-700 text-white text-center py-4 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm text-lg mb-3"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>💳</span>
                  <span>Vazhdo te Checkout</span>
                </span>
              </Link>
              <Link
                href="/products"
                className="block w-full text-center py-3 text-earth-600 hover:text-forest-700 font-medium transition-colors text-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🛍️</span>
                  <span>Vazhdo me blerje</span>
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
