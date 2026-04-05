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
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-sans">Duke ngarkuar bannerat...</p>
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
            <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Bannerat</h1>
            <p className="text-forest-600 font-sans text-sm">Krijo dhe menaxho bannerat për faqen kryesore</p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all flex items-center gap-2 font-sans"
          >
            <span className="text-lg font-bold">{showForm ? '×' : '+'}</span>
            <span>{showForm ? 'Anulo' : 'Shto Banner të Ri'}</span>
          </button>
        </div>

        {/* Stats Cards */}
        {banners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Total Bannerat</p>
              <p className="font-display text-3xl font-bold mt-1">{banners.length}</p>
            </div>
            <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Bannerat Aktive</p>
              <p className="font-display text-3xl font-bold mt-1">{banners.filter(b => b.is_active).length}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-400 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Bannerat Jo Aktive</p>
              <p className="font-display text-3xl font-bold mt-1">{banners.filter(b => !b.is_active).length}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6">
            <p className="text-red-700 font-medium font-sans text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-6 md:p-8 mb-8">
            <h2 className="font-display text-xl text-forest-900 font-bold mb-6">
              {editingId ? 'Ndrysho Banner' : 'Banner i Ri'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                    Titulli <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="P.sh. Ofertë Speciale - Zbritje 20%"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                    URL e Fotografisë <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-forest-100">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-48 bg-forest-50 items-center justify-center rounded-xl">
                        <p className="text-forest-400 font-sans text-sm">Imazhi nuk u ngarkua</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                    Link URL (Opsionale)
                  </label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="https://example.com ose /products?category=..."
                  />
                  {formData.link_url && (
                    <p className="mt-1.5 text-xs text-forest-500 font-sans">
                      Banner do të çojë në: <span className="font-mono text-forest-700">{formData.link_url}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Renditja</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    min="0"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-forest-400 font-sans">Numri më i ulët shfaqet i pari</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Valid Nga</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Valid Deri</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center p-4 bg-forest-50 rounded-xl cursor-pointer hover:bg-forest-100 transition-colors border border-forest-100">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="accent-forest-700 w-4 h-4 rounded"
                    />
                    <span className="ml-3 text-forest-700 font-medium font-sans text-sm">
                      Banner aktiv (do të shfaqet në faqen kryesore)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-forest-100">
                <button
                  type="submit"
                  className="flex-1 bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
                >
                  {editingId ? 'Ruaj Ndryshimet' : 'Krijo Banner'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border-2 border-forest-600 text-forest-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-50 transition-all font-sans"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="font-display text-xl text-forest-900 font-bold mb-2">Nuk ka bannerat</h2>
            <p className="text-forest-600 font-sans mb-6">Krijo bannerin tuaj të parë për të filluar</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
            >
              + Shto Banner të Ri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {banners
              .sort((a, b) => a.display_order - b.display_order)
              .map((banner, index) => (
                <div
                  key={banner.id}
                  className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 hover:shadow-[0_4px_24px_rgba(29,78,53,0.13)] transition-all duration-300 overflow-hidden"
                >
                  {/* Banner Image */}
                  <div className="relative h-44 bg-forest-50 overflow-hidden">
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
                        <svg className="w-16 h-16 text-forest-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        banner.is_active
                          ? 'bg-forest-100 text-forest-800 border border-forest-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {banner.is_active ? 'Aktive' : 'Jo Aktive'}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 bg-black/40 text-white rounded-full text-xs font-bold backdrop-blur-sm">
                        #{banner.display_order}
                      </span>
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="p-5">
                    <h3 className="font-display text-base font-bold text-forest-900 mb-3 line-clamp-2">
                      {banner.title}
                    </h3>

                    {banner.link_url && (
                      <div className="mb-3 p-3 bg-forest-50 rounded-xl border border-forest-100">
                        <p className="text-xs text-forest-500 mb-0.5 font-sans">Link:</p>
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-forest-700 hover:text-forest-900 font-sans break-all flex items-center gap-1"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="truncate">{banner.link_url}</span>
                        </a>
                      </div>
                    )}

                    {(banner.valid_from || banner.valid_until) && (
                      <div className="mb-3 space-y-1">
                        {banner.valid_from && (
                          <p className="text-xs text-forest-500 font-sans">
                            <span className="font-medium">Nga:</span> {new Date(banner.valid_from).toLocaleDateString('sq-AL')}
                          </p>
                        )}
                        {banner.valid_until && (
                          <p className="text-xs text-forest-500 font-sans">
                            <span className="font-medium">Deri:</span> {new Date(banner.valid_until).toLocaleDateString('sq-AL')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-forest-100">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 border-2 border-forest-600 text-forest-700 px-4 py-2 rounded-xl font-semibold hover:bg-forest-50 transition-all text-sm font-sans"
                      >
                        Ndrysho
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
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
      </div>
    </AdminLayout>
  );
}
