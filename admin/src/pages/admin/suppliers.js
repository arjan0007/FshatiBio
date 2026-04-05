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
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-sans">Duke ngarkuar furnizuesit...</p>
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
            <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Furnizuesit</h1>
            <p className="text-forest-600 font-sans text-sm">Krijo dhe menaxho furnizuesit e produkteve</p>
          </div>
          <button
            onClick={() => {
              setEditingSupplier(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all flex items-center gap-2 font-sans"
          >
            <span className="text-lg font-bold">+</span>
            <span>Furnizues i Ri</span>
          </button>
        </div>

        {/* Stats Cards */}
        {suppliers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Total Furnizuesit</p>
              <p className="font-display text-3xl font-bold mt-1">{suppliers.length}</p>
            </div>
            <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Furnizuesit Aktivë</p>
              <p className="font-display text-3xl font-bold mt-1">{suppliers.filter(s => s.is_active).length}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-400 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Furnizuesit Jo Aktivë</p>
              <p className="font-display text-3xl font-bold mt-1">{suppliers.filter(s => !s.is_active).length}</p>
            </div>
          </div>
        )}

        {/* Suppliers Grid */}
        {suppliers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <h2 className="font-display text-xl text-forest-900 font-bold mb-2">Nuk ka furnizues</h2>
            <p className="text-forest-600 font-sans mb-6">Krijo furnizuesin tënd të parë për të filluar</p>
            <button
              onClick={() => {
                setEditingSupplier(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
            >
              + Furnizues i Ri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {suppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border overflow-hidden transition-all duration-300 hover:shadow-[0_4px_24px_rgba(29,78,53,0.13)] ${
                  supplier.is_active ? 'border-forest-100' : 'border-gray-200 opacity-75'
                }`}
              >
                {/* Supplier Header */}
                <div className={`p-6 ${
                  supplier.is_active
                    ? 'bg-gradient-to-br from-forest-800 to-forest-600'
                    : 'bg-gradient-to-br from-gray-500 to-gray-400'
                } text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        supplier.is_active
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-red-500/80'
                      }`}>
                        {supplier.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                      <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </div>
                    <h3 className="font-display text-xl font-bold mb-0.5">{supplier.name}</h3>
                    {supplier.contact_person && (
                      <p className="text-sm text-white/80 font-sans">Kontakt: {supplier.contact_person}</p>
                    )}
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="p-5">
                  {/* Contact Information */}
                  <div className="space-y-2.5 mb-4">
                    {supplier.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 bg-forest-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <a
                          href={`tel:${supplier.phone}`}
                          className="text-forest-700 hover:text-forest-900 font-sans font-medium"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}

                    {supplier.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 bg-forest-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-forest-700 hover:text-forest-900 font-sans font-medium break-all"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}

                    {supplier.region && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 bg-forest-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="text-forest-700 font-medium font-sans">{supplier.region}</span>
                      </div>
                    )}

                    {supplier.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-7 h-7 bg-forest-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <span className="text-forest-600 font-sans line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {supplier.notes && (
                    <div className="mb-4 p-3 bg-forest-50 rounded-xl border border-forest-100">
                      <p className="text-xs text-forest-500 mb-0.5 font-sans font-medium">Shënime:</p>
                      <p className="text-xs text-forest-700 font-sans line-clamp-2">{supplier.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-forest-100">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="flex-1 border-2 border-forest-600 text-forest-700 px-4 py-2 rounded-xl font-semibold hover:bg-forest-50 transition-all text-sm font-sans"
                    >
                      Edito
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all text-sm font-sans"
                    >
                      Fshi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(29,78,53,0.22)] p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl text-forest-900 font-bold">
                  {editingSupplier ? 'Edito Furnizues' : 'Furnizues i Ri'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
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
                    Emri i Furnizuesit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    required
                    placeholder="P.sh. Ferma e Verës"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Person Kontakti</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      placeholder="P.sh. Gjergj Marku"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      placeholder="+355 69 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="furnizues@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Adresa</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors resize-none"
                    rows={2}
                    placeholder="Rruga, Qyteti, Shqipëri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Rajoni</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="P.sh. Tiranë, Durrës, etj."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Shënime</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors resize-none"
                    rows={3}
                    placeholder="Shënime shtesë për furnizuesin..."
                  />
                </div>

                <label className="flex items-center p-4 bg-forest-50 rounded-xl cursor-pointer hover:bg-forest-100 transition-colors border border-forest-100">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="accent-forest-700 w-4 h-4 rounded"
                  />
                  <span className="ml-3 text-forest-700 font-medium font-sans text-sm">
                    Furnizues aktiv (do të jetë i disponueshëm për përdorim)
                  </span>
                </label>

                <div className="flex gap-3 pt-4 border-t border-forest-100">
                  <button
                    type="submit"
                    className="flex-1 bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
                  >
                    {editingSupplier ? 'Përditëso' : 'Krijo Furnizues'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSupplier(null);
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
