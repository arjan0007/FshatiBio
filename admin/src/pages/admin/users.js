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
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar përdoruesit...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: pagination.total || users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    totalOrders: users.reduce((sum, u) => sum + (u.order_count || 0), 0)
  };

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Përdoruesit - Admin</title>
      </Head>
      <div>
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span className="text-4xl">👥</span>
            <span>Menaxho Përdoruesit</span>
          </h1>
          <p className="text-gray-600">Shiko dhe menaxho të gjithë përdoruesit e platformës</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Përdoruesit</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Përdoruesit Aktivë</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Përdoruesit Jo Aktivë</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Porositë</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Kërko përdorues (email, emër)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuk u gjetën përdorues</h2>
            <p className="text-gray-600">Provoni me terma të ndryshëm kërkimi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Përdoruesi</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Telefon</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Porositë</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Statusi</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Veprime</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr 
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <span>📅</span>
                              <span>Regjistruar: {new Date(user.created_at).toLocaleDateString('sq-AL')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">✉️</span>
                          <a 
                            href={`mailto:${user.email}`}
                            className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                          >
                            {user.email}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">📞</span>
                            <a 
                              href={`tel:${user.phone}`}
                              className="text-sm text-gray-700 hover:text-green-600 font-medium"
                            >
                              {user.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📦</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {user.order_count || 0} porosi
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 flex items-center gap-1.5 w-fit ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          <span>{user.is_active ? '✓' : '✕'}</span>
                          <span>{user.is_active ? 'Aktive' : 'Jo Aktive'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(user.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                          >
                            <span>👁️</span>
                            <span>Detaje</span>
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                              user.is_active
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <span>{user.is_active ? '🚫' : '✓'}</span>
                            <span>{user.is_active ? 'Deaktivizo' : 'Aktivizo'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 font-medium">
              Faqja <span className="font-bold text-gray-900">{pagination.page}</span> nga{' '}
              <span className="font-bold text-gray-900">{Math.ceil(pagination.total / pagination.limit)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Paraardhës
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tjetër →
              </button>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fade-in border-2 border-green-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.user.first_name.charAt(0)}{selectedUser.user.last_name.charAt(0)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Detaje Përdoruesi</h2>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Emri i Plotë</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {selectedUser.user.first_name} {selectedUser.user.last_name}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <a 
                      href={`mailto:${selectedUser.user.email}`}
                      className="font-bold text-blue-600 hover:text-blue-800 text-lg"
                    >
                      {selectedUser.user.email}
                    </a>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Telefon</p>
                    {selectedUser.user.phone ? (
                      <a 
                        href={`tel:${selectedUser.user.phone}`}
                        className="font-bold text-green-600 hover:text-green-800 text-lg"
                      >
                        {selectedUser.user.phone}
                      </a>
                    ) : (
                      <p className="text-gray-400">-</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Statusi</p>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${
                        selectedUser.user.is_active
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      <span className="mr-1.5">{selectedUser.user.is_active ? '✓' : '✕'}</span>
                      {selectedUser.user.is_active ? 'Aktive' : 'Jo Aktive'}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Data e Regjistrimit</p>
                    <p className="font-bold text-gray-900">
                      {new Date(selectedUser.user.created_at).toLocaleDateString('sq-AL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📦</span>
                    <span>Porositë e Fundit</span>
                  </h3>
                  {selectedUser.recent_orders.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <span className="text-4xl mb-2 block">📦</span>
                      <p className="text-gray-500">Nuk ka porosi</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.recent_orders.map((order) => (
                        <div key={order.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-green-300 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gray-900">Porosi #{order.order_number || order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleString('sq-AL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-700 text-lg">{parseFloat(order.total).toFixed(2)} L</p>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

