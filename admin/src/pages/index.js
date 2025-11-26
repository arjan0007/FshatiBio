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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Duke ngarkuar dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Porositë Totale',
      value: stats?.total_orders || 0,
      icon: '📦',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Porositë në Proces',
      value: stats?.pending_orders || 0,
      icon: '⏳',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Shitjet Sot',
      value: `${(stats?.today_sales || 0).toFixed(2)} L`,
      icon: '💰',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+18%',
      changeType: 'positive'
    },
    {
      title: 'Shitjet Javore',
      value: `${(stats?.weekly_sales || 0).toFixed(2)} L`,
      icon: '📊',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Shitjet Mujore',
      value: `${(stats?.monthly_sales || 0).toFixed(2)} L`,
      icon: '📈',
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Përdoruesit Aktivë',
      value: stats?.active_users || 0,
      icon: '👥',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard - FshatiBio</title>
      </Head>
      <div>
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${card.color} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{card.icon}</div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm font-medium">{card.title}</p>
                      <p className="text-white text-3xl font-bold mt-1">{card.value}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Ndryshimi nga muaji i kaluar</span>
                    <span className={`text-sm font-semibold ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {card.change} ↗
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📈</span> Shitjet e 7 Ditëve të Fundit
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorShitjet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Shitjet" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorShitjet)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span> Porositë e 7 Ditëve të Fundit
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="Porositë" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> Porositë të Fundit
            </h3>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Numri i Porosisë</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Klienti</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Totali</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Statusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{order.order_number}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.user?.first_name} {order.user?.last_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 font-semibold">{order.total_amount?.toFixed(2)} L</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Nuk ka porosi të reja</p>
              </div>
            )}
            <div className="mt-4">
              <a 
                href="/admin/orders" 
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-2"
              >
                Shiko të gjitha porositë →
              </a>
            </div>
          </div>
      </div>
    </AdminLayout>
  );
}
