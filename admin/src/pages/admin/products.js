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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Duke ngarkuar produkte...</p>
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
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Menaxho Produktet</h1>
              <p className="text-gray-600">Menaxhoni produktet e platformës</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Produkt i Ri</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Produkte</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Aktivë</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.active}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Stok i Ulët</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.lowStock}</p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pa Stok</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.outOfStock}</p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kërko</label>
                <input
                  type="text"
                  placeholder="Kërko produkte..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Të gjitha kategoritë</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statusi</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Të gjitha</option>
                  <option value="active">Aktivë</option>
                  <option value="inactive">Inaktivë</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.is_active
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {product.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    {product.is_bio && (
                      <div className="absolute top-2 left-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                          BIO
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{product.category_name || '-'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{product.price} L</p>
                        <p className="text-xs text-gray-500">/{product.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stoku</p>
                        <p className={`text-lg font-semibold ${
                          product.stock_quantity === 0
                            ? 'text-red-600'
                            : product.stock_quantity < 10
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}>
                          {product.stock_quantity}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                      >
                        Edito
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
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
                  className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-green-500 text-white'
                        : 'bg-white hover:shadow-lg'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-gray-600">Nuk u gjetën produkte</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingProduct ? 'Edito Produkt' : 'Produkt i Ri'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Emri i Produktit *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="Shkruani emrin e produktit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Përshkrimi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={4}
                    placeholder="Përshkrimi i produktit..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fotot e Produktit</label>
                  <p className="text-sm text-gray-500 mb-3">Maksimumi 5 foto. Formatet e lejuara: JPG, PNG, WEBP (deri në 5MB secila).</p>
                  {uploadError && (
                    <p className="text-sm text-red-600 mb-2 bg-red-50 p-2 rounded">{uploadError}</p>
                  )}
                  
                  {/* Drag & Drop Zone */}
                  {(formData.image_urls?.length || 0) < 5 && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-green-500', 'bg-green-50');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                      }}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 transition-colors hover:border-green-500 hover:bg-green-50"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Tërhiq dhe lësho foto këtu, ose
                            <label className="text-green-600 hover:text-green-700 cursor-pointer ml-1">
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
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, WEBP deri në 5MB secila
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Preview Grid */}
                  {(formData.image_urls || []).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(formData.image_urls || []).map((url, index) => (
                        <div key={url} className="relative group">
                          <img 
                            src={url} 
                            alt={`Foto ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow" 
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                            title="Hiq foto"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            Foto {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {uploadingImages && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Duke ngarkuar foto...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kategoria *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Zgjidh kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Çmimi (L) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Njësia *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="piece">copë</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stoku *</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Origjina</label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Shkodër, Korçë, etj."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Afati i freskisë (ditë)</label>
                    <input
                      type="number"
                      value={formData.freshness_period}
                      onChange={(e) => setFormData({ ...formData, freshness_period: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Produkt BIO</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktiv</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg"
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
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
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
