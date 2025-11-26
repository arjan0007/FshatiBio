import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const removeItem = async (itemId) => {
    if (!confirm('A jeni të sigurt që dëshironi të hiqni këtë produkt?')) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në heqjen e produktit');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Shporta - FshatiBio</title>
        </Head>
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-green-700">
              🥛 FshatiBio
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 text-center">
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-4">Shporta juaj është e zbrazët</h2>
            <Link
              href="/products"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Shiko Produktet
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Shporta - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Shporta</h1>

        <div className="grid md:grid-cols-3 gap-4 md:gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {updating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                  <span>Duke përditësuar...</span>
                </div>
              </div>
            )}
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {item.product.image_urls && item.product.image_urls.length > 0 ? (
                    <img
                      src={item.product.image_urls[0]}
                      alt={item.product.name}
                      className="w-full sm:w-24 md:w-28 h-32 sm:h-24 md:h-28 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full sm:w-24 md:w-28 h-32 sm:h-24 md:h-28 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">🖼️</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg mb-1">{item.product.name}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-2">
                          {item.product.price} L / {item.product.unit}
                        </p>
                        {item.product.is_bio && (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mb-2">
                            BIO
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 text-lg sm:text-xl"
                        title="Hiq produktin"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-3">
                      <div className="flex items-center gap-2 border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updating || item.quantity <= 1}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          −
                        </button>
                        <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating || item.quantity >= item.product.stock_quantity}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-green-700 text-base sm:text-lg">
                        {item.total_price.toFixed(2)} L
                      </span>
                    </div>
                    {item.quantity >= item.product.stock_quantity && (
                      <p className="text-xs sm:text-sm text-orange-600 mt-2">
                        ⚠️ Kjo është sasia maksimale në dispozicion
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 sticky top-4">
              <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Përmbledhje e Porosisë</h2>
              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                  <span>Nëntotali:</span>
                  <span className="font-medium">{parseFloat(cart.subtotal).toFixed(2)} L</span>
                </div>
                <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                  <span>Tarifa e dërgesës:</span>
                  <span className="font-medium">{parseFloat(cart.delivery_fee).toFixed(2)} L</span>
                </div>
                <div className="border-t pt-2 sm:pt-3 flex justify-between font-bold text-lg sm:text-xl">
                  <span>Totali:</span>
                  <span className="text-green-700">{parseFloat(cart.total).toFixed(2)} L</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="block w-full bg-green-600 text-white text-center py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                Vazhdo te Checkout →
              </Link>
              <Link
                href="/products"
                className="block w-full mt-2 sm:mt-3 text-center py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base"
              >
                Vazhdo me blerje
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

