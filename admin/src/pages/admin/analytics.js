import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [salesData, setSalesData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // Fetch dashboard stats (we'll use this as base)
      const dashboardRes = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (dashboardRes.data.success) {
        const stats = dashboardRes.data.data;
        setRevenueStats({
          total: stats.total_revenue || 0,
          today: stats.today_revenue || 0,
          average: stats.average_order_value || 0
        });
        setUserStats({
          total: stats.total_users || 0,
          new: stats.new_users_today || 0,
          active: stats.active_users || 0
        });
      }

      // Generate sample data based on date range
      generateChartData();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = () => {
    const days = getDaysForRange(dateRange);
    const sales = days.map((day, index) => ({
      name: day,
      Shitjet: Math.floor(Math.random() * 5000) + 1000,
      Porositë: Math.floor(Math.random() * 20) + 5,
    }));
    setSalesData(sales);

    const orders = days.map((day, index) => ({
      name: day,
      'E Konfirmuar': Math.floor(Math.random() * 10) + 2,
      'E Dorëzuar': Math.floor(Math.random() * 8) + 1,
      'E Anuluar': Math.floor(Math.random() * 3),
    }));
    setOrdersData(orders);

    // Product performance (top 5)
    setProductPerformance([
      { name: 'Qumësht BIO', sales: 1250, orders: 45 },
      { name: 'Djathë Fshati', sales: 980, orders: 32 },
      { name: 'Vezë BIO', sales: 750, orders: 28 },
      { name: 'Mish Viçi', sales: 1200, orders: 15 },
      { name: 'Gjalpë BIO', sales: 650, orders: 22 },
    ]);

    // Category sales
    setCategorySales([
      { name: 'Qumësht & Produkte', value: 35, amount: 3500 },
      { name: 'Mish & Peshk', value: 25, amount: 2500 },
      { name: 'Vezë', value: 20, amount: 2000 },
      { name: 'Djathë & Gjalpë', value: 20, amount: 2000 },
    ]);
  };

  const getDaysForRange = (range) => {
    const days = ['Hënë', 'Martë', 'Mërkurë', 'Enjte', 'Premte', 'Shtunë', 'Diel'];
    if (range === '7d') return days;
    if (range === '30d') {
      const result = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        result.push(`${date.getDate()}/${date.getMonth() + 1}`);
      }
      return result;
    }
    return days;
  };

  const exportReport = async (format = 'csv') => {
    try {
      const token = localStorage.getItem('admin_token');
      const data = {
        dateRange,
        salesData,
        ordersData,
        productPerformance,
        categorySales,
        revenueStats,
        userStats
      };

      if (format === 'csv') {
        // Generate CSV
        let csv = 'Kategoria,Shitjet,Porositë\n';
        productPerformance.forEach(p => {
          csv += `${p.name},${p.sales},${p.orders}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fshatibio-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // JSON export
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fshatibio-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Gabim në eksportimin e raportit');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Analitikë & Raporte - FshatiBio Admin</title>
      </Head>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analitikë & Raporte</h1>
            <p className="text-gray-600 mt-1">Statistika dhe analiza të detajuara</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="7d">7 Ditët e Fundit</option>
              <option value="30d">30 Ditët e Fundit</option>
              <option value="90d">90 Ditët e Fundit</option>
              <option value="1y">1 Viti i Fundit</option>
            </select>
            <button
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Eksporto CSV
            </button>
            <button
              onClick={() => exportReport('json')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Eksporto JSON
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Shitjet Totale</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {revenueStats?.total?.toLocaleString('sq-AL') || '0'} L
                </p>
                <p className="text-green-600 text-sm mt-2">+12% nga muaji i kaluar</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Shitjet Sot</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {revenueStats?.today?.toLocaleString('sq-AL') || '0'} L
                </p>
                <p className="text-blue-600 text-sm mt-2">+5% nga dje</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Vlera Mesatare e Porosisë</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {revenueStats?.average?.toLocaleString('sq-AL') || '0'} L
                </p>
                <p className="text-purple-600 text-sm mt-2">+8% nga muaji i kaluar</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Shitjet dhe Porositë</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Shitjet" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Porositë" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Status Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Statusi i Porosive</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="E Konfirmuar" fill="#3b82f6" />
                <Bar dataKey="E Dorëzuar" fill="#10b981" />
                <Bar dataKey="E Anuluar" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Performance */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Performanca e Produkteve (Top 5)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#10b981" name="Shitjet (L)" />
                <Bar dataKey="orders" fill="#3b82f6" name="Porositë" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Sales */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Shitjet sipas Kategorive</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categorySales.map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{cat.amount.toLocaleString('sq-AL')} L</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Statistika Përdoruesish</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Përdorues Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{userStats?.total || 0}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Përdorues të Rinj Sot</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{userStats?.new || 0}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Përdorues Aktivë</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{userStats?.active || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


