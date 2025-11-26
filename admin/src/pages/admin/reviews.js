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
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Filtrat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Statusi</label>
              <select
                value={filters.is_approved}
                onChange={(e) => {
                  setFilters({ ...filters, is_approved: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">Të gjitha</option>
                <option value="true">Të aprovuara</option>
                <option value="false">Të paaprovuara</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vlerësimi</label>
              <select
                value={filters.rating}
                onChange={(e) => {
                  setFilters({ ...filters, rating: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">Të gjitha</option>
                <option value="5">5 ★</option>
                <option value="4">4 ★</option>
                <option value="3">3 ★</option>
                <option value="2">2 ★</option>
                <option value="1">1 ★</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Produkti (ID)</label>
              <input
                type="text"
                value={filters.product_id}
                onChange={(e) => {
                  setFilters({ ...filters, product_id: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="ID e produktit"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">
              Vlerësimet ({pagination.total})
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nuk ka vlerësime që përputhen me filtrat
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produkti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Përdoruesi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vlerësimi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Komenti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statusi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Veprime
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{review.product_name}</div>
                        <div className="text-xs text-gray-500">{review.product_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{review.user_name}</div>
                        <div className="text-xs text-gray-500">{review.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-yellow-500">{renderStars(review.rating)}</div>
                        {review.is_verified_purchase && (
                          <span className="text-xs text-green-600">✓ Verifikuar</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs">
                          {review.title && (
                            <div className="font-semibold mb-1">{review.title}</div>
                          )}
                          <div className="text-gray-600">{review.comment}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.is_approved ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Aprovuar
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Në Pritje
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('sq-AL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {!review.is_approved && (
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Aprovo
                            </button>
                          )}
                          {review.is_approved && (
                            <button
                              onClick={() => handleReject(review.id)}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              Refuzo
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Fshi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Faqja {pagination.page} nga {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Paraardhës
                </button>
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      page: Math.min(pagination.totalPages, pagination.page + 1),
                    })
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Tjetra
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

