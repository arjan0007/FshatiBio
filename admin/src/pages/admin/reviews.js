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
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
            <p className="text-forest-600 font-sans">Duke ngarkuar vlerësimet...</p>
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
          <h1 className="font-display text-2xl text-forest-900 font-bold mb-1">Menaxho Vlerësimet</h1>
          <p className="text-forest-600 font-sans text-sm">Shiko dhe menaxho vlerësimet e produkteve</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-forest-800 to-forest-600 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Total Vlerësimet</p>
            <p className="font-display text-3xl font-bold mt-1">{pagination.total}</p>
          </div>
          <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Të Aprovuara</p>
            <p className="font-display text-3xl font-bold mt-1">{reviews.filter(r => r.is_approved).length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-600 to-amber-400 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Në Pritje</p>
            <p className="font-display text-3xl font-bold mt-1">{reviews.filter(r => !r.is_approved).length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-700 to-purple-500 text-white rounded-2xl p-6">
            <p className="text-white/80 text-sm font-medium font-sans">Mesatarja</p>
            <p className="font-display text-3xl font-bold mt-1">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0.0'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-4 flex flex-wrap gap-3 items-center mb-6">
          <div className="flex-1 min-w-[160px]">
            <select
              value={filters.is_approved}
              onChange={(e) => {
                setFilters({ ...filters, is_approved: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
            >
              <option value="">Të gjitha statuset</option>
              <option value="true">Të aprovuara</option>
              <option value="false">Të paaprovuara</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <select
              value={filters.rating}
              onChange={(e) => {
                setFilters({ ...filters, rating: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
            >
              <option value="">Të gjitha vlerësimet</option>
              <option value="5">5 yje</option>
              <option value="4">4 yje</option>
              <option value="3">3 yje</option>
              <option value="2">2 yje</option>
              <option value="1">1 yll</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <input
              type="text"
              value={filters.product_id}
              onChange={(e) => {
                setFilters({ ...filters, product_id: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              placeholder="ID e produktit"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors"
            />
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-12 text-center">
            <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h2 className="font-display text-xl text-forest-900 font-bold mb-2">Nuk ka vlerësime</h2>
            <p className="text-forest-600 font-sans">Nuk u gjetën vlerësime që përputhen me filtrat</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-4 mb-5">
              <h2 className="font-display text-lg text-forest-900 font-semibold">
                Vlerësimet ({pagination.total})
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              {reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 overflow-hidden hover:shadow-[0_4px_24px_rgba(29,78,53,0.1)] transition-all"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row gap-5">
                      {/* Left Side - Product & User Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-forest-400 to-forest-700 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-display text-base font-bold text-forest-900">
                              {review.product_name}
                            </h3>
                            <p className="text-xs text-forest-400 font-sans">ID: {review.product_id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-forest-400 to-forest-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {review.user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-forest-900 font-sans text-sm">{review.user_name}</p>
                            <p className="text-xs text-forest-400 font-sans">{review.user_email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Rating & Status */}
                      <div className="lg:w-56">
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xl text-honey-400 tracking-tight">{renderStars(review.rating)}</span>
                            <span className="text-sm font-bold text-forest-900 font-sans">{review.rating}/5</span>
                          </div>
                          {review.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-forest-100 text-forest-700 border border-forest-200 rounded-full text-xs font-bold">
                              Blerje e Verifikuar
                            </span>
                          )}
                        </div>

                        <div className="mb-3">
                          {review.is_approved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
                              Aprovuar
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Në Pritje
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-forest-400 font-sans">
                          {new Date(review.created_at).toLocaleDateString('sq-AL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="border-t border-forest-100 pt-4 mt-3">
                      {review.title && (
                        <h4 className="font-display text-base font-bold text-forest-900 mb-1.5">{review.title}</h4>
                      )}
                      <p className="text-forest-700 font-sans text-sm leading-relaxed">{review.comment}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-forest-100">
                      {!review.is_approved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="flex-1 bg-forest-700 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all text-sm font-sans"
                        >
                          Aprovo
                        </button>
                      )}
                      {review.is_approved && (
                        <button
                          onClick={() => handleReject(review.id)}
                          className="flex-1 bg-honey-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-honey-600 transition-all text-sm font-sans"
                        >
                          Refuzo
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all text-sm font-sans"
                      >
                        Fshi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 p-4 flex items-center justify-between">
                <div className="text-sm text-forest-700 font-sans">
                  Faqja <span className="font-bold text-forest-900">{pagination.page}</span> nga{' '}
                  <span className="font-bold text-forest-900">{pagination.totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-xl border border-forest-200 text-forest-700 hover:bg-forest-50 transition-all text-sm font-sans disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="px-4 py-2 rounded-xl border border-forest-200 text-forest-700 hover:bg-forest-50 transition-all text-sm font-sans disabled:opacity-40 disabled:cursor-not-allowed"
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
