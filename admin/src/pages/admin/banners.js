import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function BannersManagement() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    display_order: 0,
    valid_from: '',
    valid_until: '',
    is_active: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(response.data.data.banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      const url = editingId
        ? `${API_URL}/admin/banners/${editingId}`
        : `${API_URL}/admin/banners`;

      const method = editingId ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      resetForm();
      fetchBanners();
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Gabim në ruajtje');
    }
  };

  const handleEdit = (banner) => {
    setFormData({
      title: banner.title,
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      display_order: banner.display_order || 0,
      valid_from: banner.valid_from ? banner.valid_from.split('T')[0] : '',
      valid_until: banner.valid_until ? banner.valid_until.split('T')[0] : '',
      is_active: banner.is_active !== undefined ? banner.is_active : true
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Jeni të sigurt që dëshironi të fshini këtë banner?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në fshirje');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      display_order: 0,
      valid_from: '',
      valid_until: '',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar bannerat...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Bannerat - Admin</title>
      </Head>
      
      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">🖼️</span>
              <span>Menaxho Bannerat</span>
            </h1>
            <p className="text-gray-600">Krijo dhe menaxho bannerat për faqen kryesore</p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <span className="text-xl">{showForm ? '✕' : '+'}</span>
            <span>{showForm ? 'Anulo' : 'Shto Banner të Ri'}</span>
          </button>
        </div>

        {/* Stats Cards */}
        {banners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Bannerat</p>
                  <p className="text-3xl font-bold text-gray-900">{banners.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🖼️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Bannerat Aktive</p>
                  <p className="text-3xl font-bold text-green-600">
                    {banners.filter(b => b.is_active).length}
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
                  <p className="text-gray-600 text-sm font-medium mb-1">Bannerat Jo Aktive</p>
                  <p className="text-3xl font-bold text-red-600">
                    {banners.filter(b => !b.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8 border-2 border-green-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{editingId ? '✏️' : '➕'}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Ndrysho Banner' : 'Banner i Ri'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titulli <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="P.sh. Ofertë Speciale - Zbritje 20%"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL e Fotografisë <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-4 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-64 bg-gray-100 items-center justify-center">
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">🖼️</span>
                          <p className="text-gray-500">Imazhi nuk u ngarkua</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link URL (Opsionale)
                  </label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="https://example.com ose /products?category=..."
                  />
                  {formData.link_url && (
                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <span>🔗</span>
                      <span>Banner do të çojë në: <span className="font-mono text-blue-600">{formData.link_url}</span></span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Renditja
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    min="0"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">Numri më i ulët shfaqet i pari</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid Nga
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
                      Valid Deri
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-gray-700 font-medium">
                      Banner aktiv (do të shfaqet në faqen kryesore)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  {editingId ? '💾 Ruaj Ndryshimet' : '✨ Krijo Banner'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuk ka bannerat</h2>
            <p className="text-gray-600 mb-6">Krijo bannerin tuaj të parë për të filluar</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              + Shto Banner të Ri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners
              .sort((a, b) => a.display_order - b.display_order)
              .map((banner, index) => (
                <div
                  key={banner.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Banner Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🖼️</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        banner.is_active
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-red-500 text-white shadow-lg'
                      }`}>
                        {banner.is_active ? '✓ Aktive' : '✕ Jo Aktive'}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-black/50 text-white rounded-full text-xs font-bold backdrop-blur-sm">
                        #{banner.display_order}
                      </span>
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {banner.title}
                    </h3>
                    
                    {banner.link_url && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-500 mb-1">Link:</p>
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium break-all flex items-center gap-2"
                        >
                          <span>🔗</span>
                          <span className="truncate">{banner.link_url}</span>
                        </a>
                      </div>
                    )}

                    {(banner.valid_from || banner.valid_until) && (
                      <div className="mb-4 space-y-1">
                        {banner.valid_from && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Nga:</span> {new Date(banner.valid_from).toLocaleDateString('sq-AL')}
                          </p>
                        )}
                        {banner.valid_until && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Deri:</span> {new Date(banner.valid_until).toLocaleDateString('sq-AL')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium"
                      >
                        <span>✏️</span>
                        <span>Ndrysho</span>
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
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
      </div>
    </AdminLayout>
  );
}

