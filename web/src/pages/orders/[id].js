import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

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
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_URL}/orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Porosia u anulua me sukses!');
      fetchOrder(); // Refresh order data
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në anulimin e porosisë');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Porosia nuk u gjet</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Porosia #{order.order_number} - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <Link href="/orders" className="text-green-600 hover:underline text-sm sm:text-base">
            ← Kthehu te Porositë
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-4 md:mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Porosia #{order.order_number}</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Data: {new Date(order.created_at).toLocaleDateString('sq-AL')}
              </p>
            </div>
            <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-sm sm:text-base ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
          </div>

          {/* Order Items */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Produktet</h2>
            <div className="space-y-3 sm:space-y-4">
              {order.items.map((item) => (
                <div key={item.product.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded">
                  {item.product.image_urls && item.product.image_urls.length > 0 && (
                    <img
                      src={item.product.image_urls[0]}
                      alt={item.product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base break-words">{item.product.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {item.quantity} x {item.unit_price.toFixed(2)} L = {item.total_price.toFixed(2)} L
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Adresa e Dorëzimit</h2>
            <div className="p-3 sm:p-4 bg-gray-50 rounded">
              <p className="font-semibold text-sm sm:text-base break-words">{order.address.street}</p>
              <p className="text-gray-600 text-xs sm:text-sm">
                {order.address.city}, {order.address.postal_code}
              </p>
              {order.address.delivery_notes && (
                <p className="text-gray-600 mt-2 text-xs sm:text-sm break-words">
                  <span className="font-semibold">Shënime:</span> {order.address.delivery_notes}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Informacione për Dorëzimin</h2>
            <div className="p-3 sm:p-4 bg-gray-50 rounded space-y-2">
              <p className="text-sm sm:text-base">
                <span className="font-semibold">Data:</span> {new Date(order.delivery_date).toLocaleDateString('sq-AL')}
              </p>
              {order.delivery_time_slot && (
                <p className="text-sm sm:text-base">
                  <span className="font-semibold">Orari:</span> {order.delivery_time_slot}
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Pagesa</h2>
            <div className="p-3 sm:p-4 bg-gray-50 rounded">
              <p className="text-sm sm:text-base">
                <span className="font-semibold">Metoda:</span> {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
              </p>
              <p className="text-sm sm:text-base">
                <span className="font-semibold">Statusi:</span> {order.payment_status}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Nëntotali:</span>
                  <span>{order.subtotal.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Dërgesa:</span>
                  <span>{order.delivery_fee.toFixed(2)} L</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>Zbritje:</span>
                    <span>-{order.discount_amount.toFixed(2)} L</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                  <span>Totali:</span>
                  <span className="text-green-700">{order.total.toFixed(2)} L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <div className="mt-4 md:mt-6">
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full bg-red-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {cancelling ? 'Duke anuluar...' : 'Anulo Porosinë'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

