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
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-sans">Duke ngarkuar përdoruesit...</p>
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
          <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Përdoruesit</h1>
          <p className="text-forest-600 font-sans text-sm">Shiko dhe menaxho të gjithë përdoruesit e platformës</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Total Përdoruesit</p>
            <p className="font-display text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Përdoruesit Aktivë</p>
            <p className="font-display text-3xl font-bold mt-1">{stats.active}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-400 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Jo Aktivë</p>
            <p className="font-display text-3xl font-bold mt-1">{stats.inactive}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-700 to-purple-500 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Total Porositë</p>
            <p className="font-display text-3xl font-bold mt-1">{stats.totalOrders}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-4 mb-6">
          <input
            type="text"
            placeholder="Kërko përdorues (email, emër)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
          />
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="font-display text-xl text-forest-900 font-bold mb-2">Nuk u gjetën përdorues</h2>
            <p className="text-forest-600 font-sans">Provoni me terma të ndryshëm kërkimi</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-forest-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wider font-sans">Përdoruesi</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wider font-sans">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wider font-sans">Telefon</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wider font-sans">Porositë</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wider font-sans">Statusi</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wider font-sans">Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className="hover:bg-forest-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-forest-800 border-b border-forest-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-forest-400 to-forest-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-forest-900 font-sans">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-forest-500 font-sans">
                              Regjistruar: {new Date(user.created_at).toLocaleDateString('sq-AL')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-forest-800 border-b border-forest-50">
                        <a
                          href={`mailto:${user.email}`}
                          className="text-sm text-forest-700 hover:text-forest-900 font-sans"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-forest-800 border-b border-forest-50">
                        {user.phone ? (
                          <a
                            href={`tel:${user.phone}`}
                            className="text-sm text-forest-700 hover:text-forest-900 font-sans"
                          >
                            {user.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-forest-400 font-sans">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-forest-800 border-b border-forest-50">
                        <span className="text-sm font-semibold text-forest-900 font-sans">
                          {user.order_count || 0} porosi
                        </span>
                      </td>
                      <td className="px-4 py-3 text-forest-800 border-b border-forest-50 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.is_active
                            ? 'bg-forest-100 text-forest-700 border border-forest-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {user.is_active ? 'Aktive' : 'Jo Aktive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-forest-800 border-b border-forest-50 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(user.id)}
                            className="border-2 border-forest-600 text-forest-700 px-3 py-1.5 rounded-xl font-semibold hover:bg-forest-50 transition-all text-xs font-sans"
                          >
                            Detaje
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`px-3 py-1.5 rounded-xl font-semibold transition-all text-xs font-sans ${
                              user.is_active
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-forest-700 text-white hover:bg-forest-800'
                            }`}
                          >
                            {user.is_active ? 'Deaktivizo' : 'Aktivizo'}
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
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-4 mt-6 flex items-center justify-between">
            <div className="text-sm text-forest-700 font-sans">
              Faqja <span className="font-bold text-forest-900">{pagination.page}</span> nga{' '}
              <span className="font-bold text-forest-900">{Math.ceil(pagination.total / pagination.limit)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-xl border border-forest-200 text-forest-700 hover:bg-forest-50 transition-all text-sm font-sans disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Paraardhës
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-4 py-2 rounded-xl border border-forest-200 text-forest-700 hover:bg-forest-50 transition-all text-sm font-sans disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Tjetër →
              </button>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(29,78,53,0.22)] p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-forest-400 to-forest-700 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedUser.user.first_name.charAt(0)}{selectedUser.user.last_name.charAt(0)}
                  </div>
                  <h2 className="font-display text-xl text-forest-900 font-bold">Detaje Përdoruesi</h2>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-forest-50 rounded-2xl border border-forest-100">
                    <p className="text-xs text-forest-500 mb-1 font-sans font-medium">Emri i Plotë</p>
                    <p className="font-bold text-forest-900 font-sans">
                      {selectedUser.user.first_name} {selectedUser.user.last_name}
                    </p>
                  </div>
                  <div className="p-4 bg-forest-50 rounded-2xl border border-forest-100">
                    <p className="text-xs text-forest-500 mb-1 font-sans font-medium">Email</p>
                    <a
                      href={`mailto:${selectedUser.user.email}`}
                      className="font-bold text-forest-700 hover:text-forest-900 font-sans text-sm break-all"
                    >
                      {selectedUser.user.email}
                    </a>
                  </div>
                  <div className="p-4 bg-forest-50 rounded-2xl border border-forest-100">
                    <p className="text-xs text-forest-500 mb-1 font-sans font-medium">Telefon</p>
                    {selectedUser.user.phone ? (
                      <a
                        href={`tel:${selectedUser.user.phone}`}
                        className="font-bold text-forest-700 hover:text-forest-900 font-sans"
                      >
                        {selectedUser.user.phone}
                      </a>
                    ) : (
                      <p className="text-forest-400 font-sans">-</p>
                    )}
                  </div>
                  <div className="p-4 bg-forest-50 rounded-2xl border border-forest-100">
                    <p className="text-xs text-forest-500 mb-1 font-sans font-medium">Statusi</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedUser.user.is_active
                        ? 'bg-forest-100 text-forest-700 border border-forest-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {selectedUser.user.is_active ? 'Aktive' : 'Jo Aktive'}
                    </span>
                  </div>
                  <div className="p-4 bg-forest-50 rounded-2xl border border-forest-100 md:col-span-2">
                    <p className="text-xs text-forest-500 mb-1 font-sans font-medium">Data e Regjistrimit</p>
                    <p className="font-bold text-forest-900 font-sans">
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
                  <h3 className="font-display text-base text-forest-900 font-semibold mb-3">Porositë e Fundit</h3>
                  {selectedUser.recent_orders.length === 0 ? (
                    <div className="bg-forest-50 rounded-2xl p-6 text-center border border-forest-100">
                      <p className="text-forest-500 font-sans">Nuk ka porosi</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.recent_orders.map((order) => (
                        <div key={order.id} className="bg-forest-50 rounded-2xl p-4 border border-forest-100 hover:border-forest-300 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-forest-900 font-sans text-sm">Porosi #{order.order_number || order.id.substring(0, 8)}</p>
                              <p className="text-xs text-forest-500 font-sans mt-0.5">
                                {new Date(order.created_at).toLocaleString('sq-AL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-forest-700 font-sans">{parseFloat(order.total).toFixed(2)} L</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold mt-1 inline-block ${
                                order.status === 'delivered' ? 'bg-forest-100 text-forest-800 border border-forest-200' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-amber-100 text-amber-800 border border-amber-200'
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
