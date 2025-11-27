import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ProfileEdit() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/profile/edit');
      return;
    }
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/profile/edit');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(`${API_URL}/auth/me`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Gabim në përditësimin e profilit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Duke ngarkuar profilin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Ndrysho Profil - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 hover:text-green-700 font-medium transition-colors group text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl group-hover:-translate-x-1 transition-transform">←</span>
            <span>Kthehu te Profili</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 sm:mb-4 shadow-lg">
            <span className="text-3xl sm:text-4xl">✏️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Ndrysho Profil</h1>
          <p className="text-gray-600 text-sm sm:text-base">Përditëso informacionet e profilit tuaj</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 border-2 border-gray-100 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 sm:p-4 text-green-700 animate-fade-in">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl">✅</span>
                  <span className="font-medium text-sm sm:text-base">Profili u përditësua me sukses! Po ktheheni te profili...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 text-red-700 animate-fade-in">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl">⚠️</span>
                  <span className="font-medium text-sm sm:text-base">{error}</span>
                </div>
              </div>
            )}

            {/* First Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">👤</span>
                <span>Emri *</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-900 font-medium text-sm sm:text-base"
                placeholder="Shkruani emrin tuaj"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">👤</span>
                <span>Mbiemri *</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-900 font-medium text-sm sm:text-base"
                placeholder="Shkruani mbiemrin tuaj"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">📱</span>
                <span>Telefon</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-900 font-medium text-sm sm:text-base"
                placeholder="+355 69 123 4567"
              />
              <p className="text-[10px] sm:text-xs text-gray-500">Format: +355 XX XXX XXXX</p>
            </div>

            {/* Email (Disabled) */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">📧</span>
                <span>Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed text-sm sm:text-base"
                />
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                  <span className="text-gray-400 text-xs sm:text-sm">🔒</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>Email nuk mund të ndryshohet</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Duke ruajtur...</span>
                    <span className="sm:hidden">Ruajtje...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base sm:text-lg">💾</span>
                    <span className="hidden sm:inline">Ruaj Ndryshimet</span>
                    <span className="sm:hidden">Ruaj</span>
                  </>
                )}
              </button>
              <Link
                href="/profile"
                className="flex-1 bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-gray-300 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-center flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                <span className="text-base sm:text-lg">❌</span>
                <span>Anulo</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-4 sm:mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4 animate-fade-in">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Kujdes!</h3>
              <p className="text-xs sm:text-sm text-blue-800">
                Pas ruajtjes së ndryshimeve, do të ktheheni automatikisht te faqja e profilit.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

