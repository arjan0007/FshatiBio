import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function CouponsManagement() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCoupons(response.data.data.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingCoupon
        ? `${API_URL}/admin/coupons/${editingCoupon.id}`
        : `${API_URL}/admin/coupons`;
      const method = editingCoupon ? 'put' : 'post';

      const submitData = {
        ...formData,
        value: parseFloat(formData.value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until || null
      };

      await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
      alert(editingCoupon ? 'Kuponi u përditësua!' : 'Kuponi u krijua!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount || '',
      max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      min_order_amount: '',
      max_discount: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar kuponat...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Kuponat - Admin</title>
      </Head>

      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">🎫</span>
              <span>Menaxho Kuponat</span>
            </h1>
            <p className="text-gray-600">Krijo dhe menaxho kuponat e zbritjes</p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <span className="text-xl">+</span>
            <span>Kupon i Ri</span>
          </button>
        </div>

        {/* Stats Cards */}
        {coupons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Kuponat</p>
                  <p className="text-3xl font-bold text-gray-900">{coupons.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Kuponat Aktive</p>
                  <p className="text-3xl font-bold text-green-600">
                    {coupons.filter(c => c.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Përdorime Totale</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Kuponat e Skaduar</p>
                  <p className="text-3xl font-bold text-red-600">
                    {coupons.filter(c => {
                      if (!c.valid_until) return false;
                      return new Date(c.valid_until) < new Date();
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coupons Grid */}
        {coupons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuk ka kupon</h2>
            <p className="text-gray-600 mb-6">Krijo kuponin tënd të parë për të filluar</p>
            <button
              onClick={() => {
                setEditingCoupon(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              + Kupon i Ri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon, index) => {
              const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
              const usagePercentage = coupon.usage_limit 
                ? ((coupon.used_count || 0) / coupon.usage_limit) * 100 
                : 0;
              
              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 overflow-hidden animate-fade-in ${
                    isExpired ? 'border-red-200 opacity-75' : coupon.is_active ? 'border-green-100' : 'border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Coupon Header */}
                  <div className={`p-6 ${
                    coupon.type === 'percentage' 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-green-500 to-emerald-600'
                  } text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          coupon.is_active && !isExpired
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-red-500/80'
                        }`}>
                          {isExpired ? '⏰ Skaduar' : coupon.is_active ? '✓ Aktiv' : '✕ Inaktiv'}
                        </span>
                        <span className="text-sm opacity-90">
                          {coupon.type === 'percentage' ? 'Përqindje' : 'Fikse'}
                        </span>
                      </div>
                      <div className="text-4xl font-bold mb-2">
                        {coupon.type === 'percentage' 
                          ? `${coupon.value}%`
                          : `${coupon.value} L`}
                      </div>
                      <div className="text-2xl font-mono font-bold tracking-wider">
                        {coupon.code}
                      </div>
                    </div>
                  </div>

                  {/* Coupon Info */}
                  <div className="p-6">
                    {/* Usage Progress */}
                    {coupon.usage_limit && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Përdorime</span>
                          <span className="text-sm font-bold text-gray-900">
                            {coupon.used_count || 0} / {coupon.usage_limit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              usagePercentage >= 100 
                                ? 'bg-red-500' 
                                : usagePercentage >= 80 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Validity */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📅</span>
                        <span>
                          <span className="font-medium">Nga:</span> {new Date(coupon.valid_from).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                      {coupon.valid_until && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>⏰</span>
                          <span>
                            <span className="font-medium">Deri:</span> {new Date(coupon.valid_until).toLocaleDateString('sq-AL')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-2 mb-4 text-sm">
                      {coupon.min_order_amount && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>💰</span>
                          <span>Porosia minimale: <span className="font-semibold">{coupon.min_order_amount} L</span></span>
                        </div>
                      )}
                      {coupon.max_discount && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>🎯</span>
                          <span>Zbritje maksimale: <span className="font-semibold">{coupon.max_discount} L</span></span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium"
                    >
                      <span>✏️</span>
                      <span>Edito Kupon</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in border-2 border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{editingCoupon ? '✏️' : '➕'}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingCoupon ? 'Edito Kupon' : 'Kupon i Ri'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kodi i Kuponit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all font-mono text-lg font-bold"
                    required
                    disabled={!!editingCoupon}
                    placeholder="P.sh. SUMMER2025"
                  />
                  {editingCoupon && (
                    <p className="mt-1 text-xs text-gray-500">Kodi i kuponit nuk mund të ndryshohet</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      required
                    >
                      <option value="percentage">Përqindje (%)</option>
                      <option value="fixed">Fikse (L)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vlera <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      required
                      placeholder={formData.type === 'percentage' ? '10' : '50'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Porosia Minimale (L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="Opsionale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zbritje Maksimale (L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="Opsionale"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kufiri i Përdorimit
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="Lëreni bosh për pa kufi"
                  />
                  <p className="mt-1 text-xs text-gray-500">Numri maksimal i përdorimeve (lëreni bosh për pa kufi)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid nga
                    </label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid deri
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-gray-700 font-medium">
                      Kupon aktiv (do të jetë i disponueshëm për përdorim)
                    </span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    {editingCoupon ? '💾 Përditëso' : '✨ Krijo Kupon'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCoupon(null);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    Anulo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

