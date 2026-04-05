import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchDashboard();
    fetchRecentOrders();
    fetchSalesData();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('admin_token')}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders?limit=5`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('admin_token')}`
        }
      });
      if (response.data.success) {
        setRecentOrders(response.data.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      // Try to fetch real data from backend
      // For now, generate sample data for last 7 days
      const days = ['Hënë', 'Martë', 'Mërkurë', 'Enjte', 'Premte', 'Shtunë', 'Diel'];
      const data = days.map((day, index) => ({
        name: day,
        Shitjet: Math.floor(Math.random() * 5000) + 1000,
        Porositë: Math.floor(Math.random() * 20) + 5,
      }));
      setSalesData(data);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
      fetchRecentOrders();
      fetchSalesData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-600 font-medium">Duke ngarkuar dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Porositë Totale',
      value: stats?.total_orders || 0,
      icon: '📦',
      gradient: 'bg-gradient-to-br from-forest-700 to-forest-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Porositë në Proces',
      value: stats?.pending_orders || 0,
      icon: '⏳',
      gradient: 'bg-gradient-to-br from-amber-600 to-amber-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Shitjet Sot',
      value: `${(stats?.today_sales || 0).toFixed(2)} L`,
      icon: '💰',
      gradient: 'bg-gradient-to-br from-honey-600 to-honey-500',
      change: '+18%',
      changeType: 'positive'
    },
    {
      title: 'Shitjet Javore',
      value: `${(stats?.weekly_sales || 0).toFixed(2)} L`,
      icon: '📊',
      gradient: 'bg-gradient-to-br from-forest-600 to-forest-500',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Shitjet Mujore',
      value: `${(stats?.monthly_sales || 0).toFixed(2)} L`,
      icon: '📈',
      gradient: 'bg-gradient-to-br from-honey-600 to-honey-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Përdoruesit Aktivë',
      value: stats?.active_users || 0,
      icon: '👥',
      gradient: 'bg-gradient-to-br from-forest-600 to-forest-500',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  const statusBadge = (status) => {
    const map = {
      completed:  'bg-forest-100 text-forest-800 border border-forest-200',
      delivered:  'bg-forest-100 text-forest-800 border border-forest-200',
      pending:    'bg-amber-100 text-amber-800 border border-amber-200',
      confirmed:  'bg-blue-100 text-blue-800 border border-blue-200',
      preparing:  'bg-orange-100 text-orange-800 border border-orange-200',
      on_delivery:'bg-purple-100 text-purple-800 border border-purple-200',
      cancelled:  'bg-red-100 text-red-800 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard - FshatiBio</title>
      </Head>
      <div className="space-y-6">
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={`${card.gradient} text-white rounded-2xl shadow-card overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{card.icon}</div>
                  <span className="text-white/70 text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-full">
                    {card.change} ↗
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-white text-3xl font-bold">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sales Chart */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-forest-100">
            <h3 className="font-display text-lg text-forest-900 mb-4 flex items-center gap-2">
              <span>📈</span> Shitjet e 7 Ditëve të Fundit
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorShitjet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8f3dc" />
                <XAxis dataKey="name" stroke="#40916c" tick={{ fontSize: 12 }} />
                <YAxis stroke="#40916c" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #d8f3dc',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(29,78,53,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Shitjet"
                  stroke="#2d6a4f"
                  fillOpacity={1}
                  fill="url(#colorShitjet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-forest-100">
            <h3 className="font-display text-lg text-forest-900 mb-4 flex items-center gap-2">
              <span>📊</span> Porositë e 7 Ditëve të Fundit
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8f3dc" />
                <XAxis dataKey="name" stroke="#40916c" tick={{ fontSize: 12 }} />
                <YAxis stroke="#40916c" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #d8f3dc',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(29,78,53,0.1)'
                  }}
                />
                <Bar dataKey="Porositë" fill="#40916c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-forest-100">
          <div className="px-6 py-4 border-b border-forest-50">
            <h3 className="font-display text-lg text-forest-900 flex items-center gap-2">
              <span>📋</span> Porositë të Fundit
            </h3>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-forest-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Numri i Porosisë</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Klienti</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Totali</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-forest-700 uppercase tracking-wide">Statusi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-forest-50/50 transition-colors">
                      <td className="px-4 py-3 border-b border-forest-50 text-sm text-forest-900 font-semibold">{order.order_number}</td>
                      <td className="px-4 py-3 border-b border-forest-50 text-sm text-forest-700">{order.user?.first_name} {order.user?.last_name}</td>
                      <td className="px-4 py-3 border-b border-forest-50 text-sm text-forest-900 font-bold">{order.total_amount?.toFixed(2)} L</td>
                      <td className="px-4 py-3 border-b border-forest-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-forest-400">
              <p className="text-lg font-medium">Nuk ka porosi të reja</p>
            </div>
          )}
          <div className="px-6 py-4 bg-forest-50/50 border-t border-forest-100">
            <a
              href="/admin/orders"
              className="text-forest-700 hover:text-forest-900 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              Shiko të gjitha porositë →
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
