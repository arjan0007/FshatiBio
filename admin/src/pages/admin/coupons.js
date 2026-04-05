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
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-sans">Duke ngarkuar kuponat...</p>
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
            <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Kuponat</h1>
            <p className="text-forest-600 font-sans text-sm">Krijo dhe menaxho kuponat e zbritjes</p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all flex items-center gap-2 font-sans"
          >
            <span className="text-lg font-bold">+</span>
            <span>Kupon i Ri</span>
          </button>
        </div>

        {/* Stats Cards */}
        {coupons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Total Kuponat</p>
              <p className="font-display text-3xl font-bold mt-1">{coupons.length}</p>
            </div>
            <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Kuponat Aktive</p>
              <p className="font-display text-3xl font-bold mt-1">{coupons.filter(c => c.is_active).length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-700 to-purple-500 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Përdorime Totale</p>
              <p className="font-display text-3xl font-bold mt-1">
                {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-600 to-amber-400 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Kuponat e Skaduar</p>
              <p className="font-display text-3xl font-bold mt-1">
                {coupons.filter(c => {
                  if (!c.valid_until) return false;
                  return new Date(c.valid_until) < new Date();
                }).length}
              </p>
            </div>
          </div>
        )}

        {/* Coupons Grid */}
        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h2 className="font-display text-xl text-forest-900 font-bold mb-2">Nuk ka kupon</h2>
            <p className="text-forest-600 font-sans mb-6">Krijo kuponin tënd të parë për të filluar</p>
            <button
              onClick={() => {
                setEditingCoupon(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
            >
              + Kupon i Ri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((coupon, index) => {
              const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
              const usagePercentage = coupon.usage_limit
                ? ((coupon.used_count || 0) / coupon.usage_limit) * 100
                : 0;

              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border overflow-hidden transition-all duration-300 hover:shadow-[0_4px_24px_rgba(29,78,53,0.13)] ${
                    isExpired ? 'border-red-100 opacity-75' : coupon.is_active ? 'border-forest-100' : 'border-gray-200'
                  }`}
                >
                  {/* Coupon Header */}
                  <div className={`p-6 ${
                    coupon.type === 'percentage'
                      ? 'bg-gradient-to-br from-purple-700 to-indigo-600'
                      : 'bg-gradient-to-br from-forest-800 to-forest-600'
                  } text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          coupon.is_active && !isExpired
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-red-500/80'
                        }`}>
                          {isExpired ? 'Skaduar' : coupon.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <span className="text-xs text-white/70 font-sans">
                          {coupon.type === 'percentage' ? 'Përqindje' : 'Fikse'}
                        </span>
                      </div>
                      <div className="font-display text-4xl font-bold mb-1">
                        {coupon.type === 'percentage'
                          ? `${coupon.value}%`
                          : `${coupon.value} L`}
                      </div>
                      <div className="font-mono text-xl font-bold tracking-widest text-white/90">
                        {coupon.code}
                      </div>
                    </div>
                  </div>

                  {/* Coupon Info */}
                  <div className="p-5">
                    {/* Usage Progress */}
                    {coupon.usage_limit && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium text-forest-700 font-sans">Përdorime</span>
                          <span className="text-xs font-bold text-forest-900 font-sans">
                            {coupon.used_count || 0} / {coupon.usage_limit}
                          </span>
                        </div>
                        <div className="w-full bg-forest-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              usagePercentage >= 100
                                ? 'bg-red-500'
                                : usagePercentage >= 80
                                ? 'bg-amber-500'
                                : 'bg-forest-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Validity */}
                    <div className="mb-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-forest-600 font-sans">
                        <svg className="w-3.5 h-3.5 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span><span className="font-medium">Nga:</span> {new Date(coupon.valid_from).toLocaleDateString('sq-AL')}</span>
                      </div>
                      {coupon.valid_until && (
                        <div className="flex items-center gap-2 text-xs text-forest-600 font-sans">
                          <svg className="w-3.5 h-3.5 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span><span className="font-medium">Deri:</span> {new Date(coupon.valid_until).toLocaleDateString('sq-AL')}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-1.5 mb-4 text-xs font-sans">
                      {coupon.min_order_amount && (
                        <div className="flex items-center gap-2 text-forest-600">
                          <span className="text-forest-400">Porosia min:</span>
                          <span className="font-semibold text-forest-800">{coupon.min_order_amount} L</span>
                        </div>
                      )}
                      {coupon.max_discount && (
                        <div className="flex items-center gap-2 text-forest-600">
                          <span className="text-forest-400">Zbritje maks:</span>
                          <span className="font-semibold text-forest-800">{coupon.max_discount} L</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="w-full border-2 border-forest-600 text-forest-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-forest-50 transition-all text-sm font-sans"
                    >
                      Edito Kupon
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(29,78,53,0.22)] p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl text-forest-900 font-bold">
                  {editingCoupon ? 'Edito Kupon' : 'Kupon i Ri'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                    Kodi i Kuponit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-mono text-lg font-bold text-forest-900 transition-colors"
                    required
                    disabled={!!editingCoupon}
                    placeholder="P.sh. SUMMER2025"
                  />
                  {editingCoupon && (
                    <p className="mt-1 text-xs text-forest-400 font-sans">Kodi i kuponit nuk mund të ndryshohet</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                      Tipi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      required
                    >
                      <option value="percentage">Përqindje (%)</option>
                      <option value="fixed">Fikse (L)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                      Vlera <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      required
                      placeholder={formData.type === 'percentage' ? '10' : '50'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Porosia Minimale (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      placeholder="Opsionale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Zbritje Maksimale (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      placeholder="Opsionale"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Kufiri i Përdorimit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="Lëreni bosh për pa kufi"
                  />
                  <p className="mt-1 text-xs text-forest-400 font-sans">Numri maksimal i përdorimeve (lëreni bosh për pa kufi)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Valid nga</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Valid deri</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    />
                  </div>
                </div>

                <label className="flex items-center p-4 bg-forest-50 rounded-xl cursor-pointer hover:bg-forest-100 transition-colors border border-forest-100">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="accent-forest-700 w-4 h-4 rounded"
                  />
                  <span className="ml-3 text-forest-700 font-medium font-sans text-sm">
                    Kupon aktiv (do të jetë i disponueshëm për përdorim)
                  </span>
                </label>

                <div className="flex gap-3 pt-4 border-t border-forest-100">
                  <button
                    type="submit"
                    className="flex-1 bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
                  >
                    {editingCoupon ? 'Përditëso' : 'Krijo Kupon'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCoupon(null);
                      resetForm();
                    }}
                    className="flex-1 border-2 border-forest-600 text-forest-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-50 transition-all font-sans"
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
