import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import EmptyState from '../components/EmptyState';

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

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Porositë e Mia - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Porositë e Mia</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-4">Nuk keni porosi</h2>
            <Link
              href="/products"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Shiko Produktet
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Porosia #{order.order_number}
                    </h3>
                    <p className="text-gray-600">
                      Data: {new Date(order.created_at).toLocaleDateString('sq-AL')}
                    </p>
                    <p className="text-gray-600">
                      Dorëzim: {new Date(order.delivery_date).toLocaleDateString('sq-AL')}
                    </p>
                    <p className="text-green-700 font-semibold text-lg mt-2">
                      Totali: {order.total.toFixed(2)} L
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

