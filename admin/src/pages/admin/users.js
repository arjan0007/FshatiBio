import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function UsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm
        }
      });
      setUsers(response.data.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/users/${user.id}`,
        { is_active: !user.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në përditësim');
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(response.data.data);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në ngarkim');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Duke ngarkuar...</div>;
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Përdoruesit - Admin</title>
      </Head>
      <div>
        <h1 className="text-3xl font-bold mb-6">Menaxho Përdoruesit</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Kërko përdorues (email, emër)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Përdoruesi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Porositë</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statusi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veprime</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Nuk u gjetën përdorues
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Regjistruar: {new Date(user.created_at).toLocaleDateString('sq-AL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.order_count || 0} porosi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Aktive' : 'Jo Aktive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Detaje
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`${
                          user.is_active
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.is_active ? 'Deaktivizo' : 'Aktivizo'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total > pagination.limit && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Paraardhës
            </button>
            <span className="px-4 py-2">
              Faqja {pagination.page} nga {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Tjetër
            </button>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detaje Përdoruesi</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <strong>Emri:</strong> {selectedUser.user.first_name} {selectedUser.user.last_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.user.email}
                </div>
                <div>
                  <strong>Telefon:</strong> {selectedUser.user.phone || '-'}
                </div>
                <div>
                  <strong>Statusi:</strong>{' '}
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      selectedUser.user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedUser.user.is_active ? 'Aktive' : 'Jo Aktive'}
                  </span>
                </div>
                <div>
                  <strong>Porositë e Fundit:</strong>
                  {selectedUser.recent_orders.length === 0 ? (
                    <p className="text-gray-500 mt-2">Nuk ka porosi</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {selectedUser.recent_orders.map((order) => (
                        <li key={order.id} className="border p-2 rounded">
                          <div className="flex justify-between">
                            <span>Porosi #{order.id.substring(0, 8)}</span>
                            <span className="font-bold">{order.total} L</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString('sq-AL')} - {order.status}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

