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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Menaxho Kuponat</h2>
          <button
            onClick={() => {
              setEditingCoupon(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            + Kupon i Ri
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kodi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vlera</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Përdorime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validiteti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statusi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veprime</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">
                    {coupon.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coupon.type === 'percentage' ? 'Përqindje' : 'Fikse'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coupon.type === 'percentage' 
                      ? `${coupon.value}%`
                      : `${coupon.value} L`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coupon.used_count || 0} / {coupon.usage_limit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {new Date(coupon.valid_from).toLocaleDateString('sq-AL')}
                    </div>
                    {coupon.valid_until && (
                      <div className="text-sm text-gray-500">
                        - {new Date(coupon.valid_until).toLocaleDateString('sq-AL')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edito
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nuk ka kupon
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4">
                {editingCoupon ? 'Edito Kupon' : 'Kupon i Ri'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Kodi i Kuponit *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border rounded"
                    required
                    disabled={!!editingCoupon}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Tipi *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                      required
                    >
                      <option value="percentage">Përqindje (%)</option>
                      <option value="fixed">Fikse (L)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Vlera *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Porosia Minimale (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Zbritje Maksimale (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-2">Kufiri i Përdorimit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="Lëreni bosh për pa kufi"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Valid nga</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Valid deri</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Aktiv
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    {editingCoupon ? 'Përditëso' : 'Krijo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCoupon(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
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

