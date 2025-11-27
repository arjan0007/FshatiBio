import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    is_approved: '',
    rating: '',
    product_id: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchReviews();
  }, [filters, pagination.page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filters.is_approved) params.append('is_approved', filters.is_approved);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.product_id) params.append('product_id', filters.product_id);

      const response = await axios.get(`${API_URL}/admin/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/reviews/${reviewId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në aprovimin e vlerësimit');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/reviews/${reviewId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në refuzimin e vlerësimit');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Jeni të sigurt që dëshironi të fshini këtë vlerësim?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/admin/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në fshirjen e vlerësimit');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar vlerësimet...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxhimi i Vlerësimeve - Admin Panel</title>
      </Head>

      <div>
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span className="text-4xl">⭐</span>
            <span>Menaxho Vlerësimet</span>
          </h1>
          <p className="text-gray-600">Shiko dhe menaxho vlerësimet e produkteve</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Vlerësimet</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Të Aprovuara</p>
                <p className="text-3xl font-bold text-green-600">
                  {reviews.filter(r => r.is_approved).length}
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
                <p className="text-gray-600 text-sm font-medium mb-1">Në Pritje</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reviews.filter(r => !r.is_approved).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Mesatarja</p>
                <p className="text-3xl font-bold text-purple-600">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Filtrat</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Statusi</label>
              <select
                value={filters.is_approved}
                onChange={(e) => {
                  setFilters({ ...filters, is_approved: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              >
                <option value="">Të gjitha</option>
                <option value="true">Të aprovuara</option>
                <option value="false">Të paaprovuara</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vlerësimi</label>
              <select
                value={filters.rating}
                onChange={(e) => {
                  setFilters({ ...filters, rating: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              >
                <option value="">Të gjitha</option>
                <option value="5">5 ⭐</option>
                <option value="4">4 ⭐</option>
                <option value="3">3 ⭐</option>
                <option value="2">2 ⭐</option>
                <option value="1">1 ⭐</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Produkti (ID)</label>
              <input
                type="text"
                value={filters.product_id}
                onChange={(e) => {
                  setFilters({ ...filters, product_id: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="ID e produktit"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuk ka vlerësime</h2>
            <p className="text-gray-600">Nuk u gjetën vlerësime që përputhen me filtrat</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Vlerësimet ({pagination.total})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              {reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-100 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Side - Product & User Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl">📦</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {review.product_name}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {review.product_id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">👤</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{review.user_name}</p>
                            <p className="text-sm text-gray-500">{review.user_email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Rating & Status */}
                      <div className="lg:w-64">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-2xl text-yellow-500">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {review.rating}/5
                            </span>
                          </div>
                          {review.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <span>✓</span>
                              <span>Blerje e Verifikuar</span>
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          {review.is_approved ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300">
                              ✓ Aprovuar
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300">
                              ⏳ Në Pritje
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                          {new Date(review.created_at).toLocaleDateString('sq-AL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      {review.title && (
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{review.title}</h4>
                      )}
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                      {!review.is_approved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all font-medium"
                        >
                          <span>✓</span>
                          <span>Aprovo</span>
                        </button>
                      )}
                      {review.is_approved && (
                        <button
                          onClick={() => handleReject(review.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-700 transition-all font-medium"
                        >
                          <span>↩️</span>
                          <span>Refuzo</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium">
                  Faqja <span className="font-bold text-gray-900">{pagination.page}</span> nga{' '}
                  <span className="font-bold text-gray-900">{pagination.totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                    }
                    disabled={pagination.page === 1}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Paraardhës
                  </button>
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: Math.min(pagination.totalPages, pagination.page + 1),
                      })
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tjetra →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

