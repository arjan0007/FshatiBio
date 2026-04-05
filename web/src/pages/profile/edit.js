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
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto mb-4"></div>
          <div className="text-xl text-stone-600 font-display">Duke ngarkuar profilin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Ndrysho Profil - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-4xl">
        {/* Back */}
        <div className="mb-5 sm:mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-forest-700 hover:text-forest-800 font-semibold transition-colors group text-sm sm:text-base"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Kthehu te Profili</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-forest-400 to-forest-700 rounded-full mb-4 shadow-warm">
            <span className="text-3xl sm:text-4xl">✏️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-stone-900 mb-1 sm:mb-2">
            Ndrysho Profil
          </h1>
          <p className="text-stone-500 text-sm sm:text-base">Përditëso informacionet e profilit tuaj</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 lg:p-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 text-forest-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span className="font-medium text-sm sm:text-base">Profili u përditësua me sukses! Po ktheheni te profili...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium text-sm sm:text-base">{error}</span>
                </div>
              </div>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>👤</span>
                <span>Emri *</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-stone-900 font-medium text-sm sm:text-base"
                placeholder="Shkruani emrin tuaj"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>👤</span>
                <span>Mbiemri *</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-stone-900 font-medium text-sm sm:text-base"
                placeholder="Shkruani mbiemrin tuaj"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>📱</span>
                <span>Telefon</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-stone-900 font-medium text-sm sm:text-base"
                placeholder="+355 69 123 4567"
              />
              <p className="text-xs text-stone-400 mt-1.5">Format: +355 XX XXX XXXX</p>
            </div>

            {/* Email (Disabled) */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>📧</span>
                <span>Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed text-sm sm:text-base"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-stone-400 text-sm">🔒</span>
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1">
                <span>ℹ️</span>
                <span>Email nuk mund të ndryshohet</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-5 border-t border-stone-100">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Duke ruajtur...</span>
                    <span className="sm:hidden">Ruajtje...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span className="hidden sm:inline">Ruaj Ndryshimet</span>
                    <span className="sm:hidden">Ruaj</span>
                  </>
                )}
              </button>
              <Link
                href="/profile"
                className="flex-1 bg-stone-200 text-stone-700 px-6 py-3 rounded-full font-semibold hover:bg-stone-300 transition-all text-center flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span>❌</span>
                <span>Anulo</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-5 sm:mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-1 text-sm sm:text-base">Kujdes!</h3>
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
