import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SuppliersManagement() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    region: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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
      const url = editingSupplier
        ? `${API_URL}/admin/suppliers/${editingSupplier.id}`
        : `${API_URL}/admin/suppliers`;
      const method = editingSupplier ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingSupplier(null);
      resetForm();
      fetchSuppliers();
      alert(editingSupplier ? 'Furnizuesi u përditësua!' : 'Furnizuesi u krijua!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      region: supplier.region || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('A jeni të sigurt që dëshironi të fshini këtë furnizues?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/suppliers/${id}`,
        { is_active: false },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchSuppliers();
      alert('Furnizuesi u fshi!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      region: '',
      notes: '',
      is_active: true
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar furnizuesit...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Furnizuesit - Admin</title>
      </Head>

      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">🚚</span>
              <span>Menaxho Furnizuesit</span>
            </h1>
            <p className="text-gray-600">Krijo dhe menaxho furnizuesit e produkteve</p>
          </div>
          <button
            onClick={() => {
              setEditingSupplier(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <span className="text-xl">+</span>
            <span>Furnizues i Ri</span>
          </button>
        </div>

        {/* Stats Cards */}
        {suppliers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Furnizuesit</p>
                  <p className="text-3xl font-bold text-gray-900">{suppliers.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚚</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Furnizuesit Aktivë</p>
                  <p className="text-3xl font-bold text-green-600">
                    {suppliers.filter(s => s.is_active).length}
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
                  <p className="text-gray-600 text-sm font-medium mb-1">Furnizuesit Jo Aktivë</p>
                  <p className="text-3xl font-bold text-red-600">
                    {suppliers.filter(s => !s.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
          </div>
        </div>
        )}

        {/* Suppliers Grid */}
        {suppliers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🚚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuk ka furnizues</h2>
            <p className="text-gray-600 mb-6">Krijo furnizuesin tënd të parë për të filluar</p>
          <button
            onClick={() => {
              setEditingSupplier(null);
              resetForm();
              setShowModal(true);
            }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            + Furnizues i Ri
          </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 overflow-hidden animate-fade-in ${
                  supplier.is_active ? 'border-green-100' : 'border-gray-200 opacity-75'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Supplier Header */}
                <div className={`p-6 ${
                  supplier.is_active 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                } text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        supplier.is_active
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-red-500/80'
                      }`}>
                        {supplier.is_active ? '✓ Aktiv' : '✕ Inaktiv'}
                      </span>
                      <span className="text-3xl">🚚</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{supplier.name}</h3>
                    {supplier.contact_person && (
                      <p className="text-sm opacity-90">Kontakt: {supplier.contact_person}</p>
                    )}
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="p-6">
                  {/* Contact Information */}
                  <div className="space-y-3 mb-4">
                    {supplier.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600">📞</span>
                        </div>
                        <a 
                          href={`tel:${supplier.phone}`}
                          className="text-gray-700 hover:text-blue-600 font-medium"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}

                    {supplier.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600">✉️</span>
                        </div>
                        <a 
                          href={`mailto:${supplier.email}`}
                          className="text-gray-700 hover:text-green-600 font-medium break-all"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}

                    {supplier.region && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600">📍</span>
                        </div>
                        <span className="text-gray-700 font-medium">{supplier.region}</span>
                      </div>
                    )}

                    {supplier.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-orange-600">🏠</span>
                        </div>
                        <span className="text-gray-600 line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
        </div>

                  {/* Notes */}
                  {supplier.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Shënime:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{supplier.notes}</p>
                    </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium"
                    >
                      <span>✏️</span>
                      <span>Edito</span>
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-all font-medium"
                    >
                      <span>🗑️</span>
                      <span>Fshi</span>
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in border-2 border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{editingSupplier ? '✏️' : '➕'}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                {editingSupplier ? 'Edito Furnizues' : 'Furnizues i Ri'}
              </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emri i Furnizuesit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    required
                    placeholder="P.sh. Ferma e Verës"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Person Kontakti
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="P.sh. Gjergj Marku"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="+355 69 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="furnizues@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresa
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                    rows={2}
                    placeholder="Rruga, Qyteti, Shqipëri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rajoni
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="P.sh. Tiranë, Durrës, etj."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shënime
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                    rows={3}
                    placeholder="Shënime shtesë për furnizuesin..."
                  />
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
                      Furnizues aktiv (do të jetë i disponueshëm për përdorim)
                    </span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    {editingSupplier ? '💾 Përditëso' : '✨ Krijo Furnizues'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSupplier(null);
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

