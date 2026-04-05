import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function CategoriesManagement() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
        ? `${API_URL}/admin/categories/${editingId}`
        : `${API_URL}/admin/categories`;

      const method = editingId ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      resetForm();
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Gabim në ruajtje');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      display_order: category.display_order || 0,
      is_active: category.is_active !== undefined ? category.is_active : true
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Jeni të sigurt që dëshironi të fshini këtë kategori?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në fshirje');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: editingId ? formData.slug : generateSlug(name)
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-sans">Duke ngarkuar kategoritë...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Kategoritë - Admin</title>
      </Head>

      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Kategoritë</h1>
            <p className="text-forest-600 font-sans text-sm">Krijo dhe menaxho kategoritë e produkteve</p>
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
            <span>{showForm ? 'Anulo' : 'Shto Kategori të Re'}</span>
          </button>
        </div>

        {/* Stats Cards */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Total Kategoritë</p>
              <p className="font-display text-3xl font-bold mt-1">{categories.length}</p>
            </div>
            <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Kategoritë Aktive</p>
              <p className="font-display text-3xl font-bold mt-1">{categories.filter(c => c.is_active).length}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-400 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Kategoritë Jo Aktive</p>
              <p className="font-display text-3xl font-bold mt-1">{categories.filter(c => !c.is_active).length}</p>
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
              {editingId ? 'Ndrysho Kategori' : 'Kategori e Re'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                    Emri <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="P.sh. Qumësht"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-mono text-sm text-forest-900 transition-colors"
                    placeholder="qumesht"
                  />
                  <p className="mt-1 text-xs text-forest-400 font-sans">URL-friendly version (auto-generohet nga emri)</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Përshkrimi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors resize-none"
                    rows="3"
                    placeholder="Përshkrim i shkurtër për kategorinë..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">URL e Fotografisë</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-forest-100">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-xl border border-forest-100"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-32 bg-forest-50 items-center justify-center rounded-xl">
                        <p className="text-forest-400 font-sans text-sm">Imazhi nuk u ngarkua</p>
                      </div>
                    </div>
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

                <div className="md:col-span-2">
                  <label className="flex items-center p-4 bg-forest-50 rounded-xl cursor-pointer hover:bg-forest-100 transition-colors border border-forest-100">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="accent-forest-700 w-4 h-4 rounded"
                    />
                    <span className="ml-3 text-forest-700 font-medium font-sans text-sm">
                      Kategori aktive (do të shfaqet në faqen kryesore)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-forest-100">
                <button
                  type="submit"
                  className="flex-1 bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
                >
                  {editingId ? 'Ruaj Ndryshimet' : 'Krijo Kategori'}
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

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="font-display text-xl text-forest-900 font-bold mb-2">Nuk ka kategori</h2>
            <p className="text-forest-600 font-sans mb-6">Krijo kategorinë tënde të parë për të filluar</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
            >
              + Shto Kategori të Re
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories
              .sort((a, b) => a.display_order - b.display_order)
              .map((category, index) => (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 hover:shadow-[0_4px_24px_rgba(29,78,53,0.13)] transition-all duration-300 overflow-hidden"
                >
                  {/* Category Image */}
                  <div className="relative h-44 bg-forest-50 overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-forest-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        category.is_active
                          ? 'bg-forest-100 text-forest-800 border border-forest-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {category.is_active ? 'Aktive' : 'Jo Aktive'}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 bg-black/40 text-white rounded-full text-xs font-bold backdrop-blur-sm">
                        #{category.display_order}
                      </span>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-forest-900 mb-1">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="text-sm text-forest-600 mb-3 line-clamp-2 font-sans">
                        {category.description}
                      </p>
                    )}

                    <div className="mb-4 p-3 bg-forest-50 rounded-xl border border-forest-100">
                      <p className="text-xs text-forest-500 mb-0.5 font-sans">Slug:</p>
                      <p className="text-sm font-mono text-forest-700 break-all">
                        /{category.slug}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-forest-100">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 border-2 border-forest-600 text-forest-700 px-4 py-2 rounded-xl font-semibold hover:bg-forest-50 transition-all text-sm font-sans"
                      >
                        Ndrysho
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
