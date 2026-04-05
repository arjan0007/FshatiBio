import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ProductsManagement() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    unit: 'kg',
    stock_quantity: '',
    min_order_quantity: '1',
    origin: '',
    freshness_period: '',
    is_bio: true,
    is_active: true,
    image_urls: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [currentPage, searchTerm, selectedCategory, statusFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (statusFilter !== 'all') params.append('is_active', statusFilter === 'active');
      params.append('page', currentPage);
      params.append('limit', '12');

      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/products?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/categories`)
      ]);

      if (productsRes.data.success) {
        setProducts(productsRes.data.data.products || []);
        setTotalPages(productsRes.data.data.pagination?.totalPages || 1);
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      const url = editingProduct
        ? `${API_URL}/admin/products/${editingProduct.id}`
        : `${API_URL}/admin/products`;
      const method = editingProduct ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
      showToast(editingProduct ? 'Produkti u përditësua me sukses!' : 'Produkti u krijua me sukses!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error?.message || 'Gabim në ruajtje', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      price: product.price,
      unit: product.unit,
      stock_quantity: product.stock_quantity,
      min_order_quantity: product.min_order_quantity || 1,
      origin: product.origin || '',
      freshness_period: product.freshness_period || '',
      is_bio: product.is_bio,
      is_active: product.is_active,
      image_urls: product.image_urls || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('A jeni të sigurt që dëshironi të fshini këtë produkt?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/products/${id}`,
        { is_active: false },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchData();
      showToast('Produkti u fshi me sukses!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error?.message || 'Gabim në fshirje', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price: '',
      unit: 'kg',
      stock_quantity: '',
      min_order_quantity: '1',
      origin: '',
      freshness_period: '',
      is_bio: true,
      is_active: true,
      image_urls: []
    });
    setUploadError('');
  };

  const handleImageUpload = async (files) => {
    const fileArray = Array.from(files || []);
    if (!fileArray.length) return;

    if ((formData.image_urls?.length || 0) + fileArray.length > 5) {
      setUploadError('Maksimumi 5 foto për produkt.');
      return;
    }

    setUploadingImages(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('admin_token');
      const uploadData = new FormData();
      fileArray.forEach((file) => uploadData.append('images', file));

      const response = await axios.post(`${API_URL}/uploads/products`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setFormData((prev) => ({
          ...prev,
          image_urls: [
            ...(prev.image_urls || []),
            ...response.data.data.urls
          ].slice(0, 5)
        }));
        showToast('Foto u ngarkuan me sukses!', 'success');
      }
    } catch (error) {
      setUploadError(error.response?.data?.error?.message || 'Ngarkimi dështoi');
      showToast('Gabim në ngarkimin e fotove', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files) {
      handleImageUpload(files);
      event.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files) {
      handleImageUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveImage = (url) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: (prev.image_urls || []).filter((img) => img !== url)
    }));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    lowStock: products.filter(p => p.stock_quantity < 10).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0faf4]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-700 font-medium font-sans">Duke ngarkuar produkte...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Produktet - Admin</title>
      </Head>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-xl transform transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-forest-700 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3 font-sans font-semibold">
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Produktet</h1>
              <p className="text-forest-600 font-sans text-sm">Menaxhoni produktet e platformës</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all flex items-center gap-2 font-sans"
            >
              <span className="text-lg font-bold">+</span>
              <span>Produkt i Ri</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Total Produkte</p>
              <p className="font-display text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Aktivë</p>
              <p className="font-display text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600 to-amber-400 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Stok i Ulët</p>
              <p className="font-display text-3xl font-bold mt-1">{stats.lowStock}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-400 text-white rounded-2xl p-6">
              <p className="text-white/80 text-sm font-medium font-sans">Pa Stok</p>
              <p className="font-display text-3xl font-bold mt-1">{stats.outOfStock}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-4 flex flex-wrap gap-3 items-center mb-6">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="Kërko produkte..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
              >
                <option value="">Të gjitha kategoritë</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
              >
                <option value="all">Të gjitha</option>
                <option value="active">Aktivë</option>
                <option value="inactive">Inaktivë</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 hover:shadow-[0_4px_24px_rgba(29,78,53,0.13)] transition-all duration-300 overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative h-44 bg-forest-50">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-forest-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        product.is_active
                          ? 'bg-forest-100 text-forest-800 border border-forest-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {product.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    {product.is_bio && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-honey-500 text-white">
                          BIO
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-display text-base font-bold text-forest-900 mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-forest-500 font-sans mb-3">{product.category_name || '-'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-display text-xl font-bold text-forest-700">{product.price} L</p>
                        <p className="text-xs text-forest-400 font-sans">/{product.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-forest-500 font-sans">Stoku</p>
                        <p className={`text-base font-bold font-display ${
                          product.stock_quantity === 0
                            ? 'text-red-600'
                            : product.stock_quantity < 10
                            ? 'text-amber-600'
                            : 'text-forest-600'
                        }`}>
                          {product.stock_quantity}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 border-2 border-forest-600 text-forest-700 px-3 py-2 rounded-xl font-semibold hover:bg-forest-50 transition-all text-sm font-sans"
                      >
                        Edito
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all text-sm font-sans"
                      >
                        Fshi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-forest-200 text-forest-700 hover:bg-forest-50 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                >
                  ←
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 rounded-xl border text-sm font-sans transition-all ${
                      currentPage === i + 1
                        ? 'bg-forest-700 text-white border-forest-700'
                        : 'border-forest-200 text-forest-700 hover:bg-forest-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-forest-200 text-forest-700 hover:bg-forest-50 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-forest-600 font-sans text-lg font-medium">Nuk u gjetën produkte</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(29,78,53,0.22)] p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl text-forest-900 font-bold">
                  {editingProduct ? 'Edito Produkt' : 'Produkt i Ri'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Emri i Produktit *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                    required
                    placeholder="Shkruani emrin e produktit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Përshkrimi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors resize-none"
                    rows={3}
                    placeholder="Përshkrimi i produktit..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Fotot e Produktit</label>
                  <p className="text-xs text-forest-500 mb-2 font-sans">Maksimumi 5 foto. Formatet e lejuara: JPG, PNG, WEBP (deri në 5MB secila).</p>
                  {uploadError && (
                    <p className="text-sm text-red-600 mb-2 bg-red-50 p-2 rounded-xl font-sans">{uploadError}</p>
                  )}

                  {(formData.image_urls?.length || 0) < 5 && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-forest-400', 'bg-forest-50');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-forest-400', 'bg-forest-50');
                      }}
                      className="border-2 border-dashed border-forest-200 rounded-xl p-6 text-center mb-3 transition-colors hover:border-forest-400 hover:bg-forest-50 cursor-pointer"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-forest-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-forest-700 font-sans">
                          Tërhiq dhe lësho foto këtu, ose{' '}
                          <label className="text-forest-600 hover:text-forest-800 cursor-pointer underline">
                            kliko për të zgjedhur
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-xs text-forest-400 font-sans">PNG, JPG, WEBP deri në 5MB secila</p>
                      </div>
                    </div>
                  )}

                  {(formData.image_urls || []).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {(formData.image_urls || []).map((url, index) => (
                        <div key={url} className="relative group">
                          <img
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl border border-forest-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadingImages && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-forest-600 bg-forest-50 p-3 rounded-xl font-sans">
                      <svg className="animate-spin h-4 w-4 text-forest-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Duke ngarkuar foto...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Kategoria *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      required
                    >
                      <option value="">Zgjidh kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Çmimi (L) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Njësia *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="piece">copë</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Stoku *</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      required
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Origjina</label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      placeholder="Shkodër, Korçë, etj."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest-700 mb-1.5 font-sans">Afati i freskisë (ditë)</label>
                    <input
                      type="number"
                      value={formData.freshness_period}
                      onChange={(e) => setFormData({ ...formData, freshness_period: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
                      placeholder="7"
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_bio}
                      onChange={(e) => setFormData({ ...formData, is_bio: e.target.checked })}
                      className="accent-forest-700 w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-forest-700 font-sans">Produkt BIO</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="accent-forest-700 w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-forest-700 font-sans">Aktiv</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-forest-100">
                  <button
                    type="submit"
                    className="flex-1 bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all font-sans"
                  >
                    {editingProduct ? 'Përditëso Produktin' : 'Krijo Produktin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
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
