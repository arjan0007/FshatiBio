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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  on_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Menaxho Porositë</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">Të gjitha</option>
          <option value="pending">Në Pritje</option>
          <option value="confirmed">E Konfirmuar</option>
          <option value="preparing">Duke Përgatitur</option>
          <option value="on_delivery">Në Dërgesë</option>
          <option value="delivered">E Dorëzuar</option>
          <option value="cancelled">E Anuluar</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klienti</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Totali</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statusi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veprime</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  #{order.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>{order.customer_name}</div>
                  <div className="text-sm text-gray-500">{order.customer_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString('sq-AL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">
                  {parseFloat(order.total).toFixed(2)} L
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="pending">Në Pritje</option>
                    <option value="confirmed">E Konfirmuar</option>
                    <option value="preparing">Duke Përgatitur</option>
                    <option value="on_delivery">Në Dërgesë</option>
                    <option value="delivered">E Dorëzuar</option>
                    <option value="cancelled">E Anuluar</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nuk ka porosi
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

