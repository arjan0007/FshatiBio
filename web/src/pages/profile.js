import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../components/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersCount: 0,
    addressesCount: 0,
    cartItemsCount: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUser();
    fetchStats();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Fetch orders count
      const ordersRes = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch addresses count
      const addressesRes = await axios.get(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        ordersCount: ordersRes.data?.data?.orders?.length || 0,
        addressesCount: addressesRes.data?.data?.addresses?.length || 0,
        cartItemsCount: JSON.parse(localStorage.getItem('cart') || '[]').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };


  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 5;
    
    if (user?.first_name && user?.last_name) completed++;
    if (user?.email) completed++;
    if (user?.phone) completed++;
    if (stats.addressesCount > 0) completed++;
    if (user?.created_at) completed++;
    
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Duke ngarkuar...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Profili Im - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-7xl">
        {/* Profile Header Section */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8 text-white animate-fade-in relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold border-4 border-white/40 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                {getInitials(user.first_name, user.last_name)}
              </div>
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full border-3 sm:border-4 border-white flex items-center justify-center shadow-lg animate-pulse-ring">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
              <div className="mb-2 sm:mb-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 drop-shadow-lg">
                  {user.first_name} {user.last_name}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-green-100 text-sm sm:text-base md:text-lg font-medium break-all">{user.email}</p>
                </div>
              </div>
              
              {/* Profile Completion */}
              <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                    <span className="text-sm sm:text-base">📊</span>
                    <span>Plotësimi i Profilit</span>
                  </span>
                  <span className="text-base sm:text-lg font-black bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-white to-green-100 rounded-full h-2 sm:h-3 transition-all duration-1000 shadow-lg"
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                {profileCompletion < 100 && (
                  <p className="text-[10px] sm:text-xs text-green-100 mt-1.5 sm:mt-2">Plotëso profilin për përvojë më të mirë</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Link href="/orders" className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-200 animate-slide-up group">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-purple-600">{stats.ordersCount}</span>
            </div>
            <p className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">Porositë</p>
            <p className="text-xs sm:text-sm text-gray-500 group-hover:text-purple-600 transition-colors">Shiko të gjitha →</p>
          </Link>

          <Link href="/addresses" className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-indigo-200 animate-slide-up group" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-indigo-600">{stats.addressesCount}</span>
            </div>
            <p className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">Adresat</p>
            <p className="text-xs sm:text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">Menaxho adresat →</p>
          </Link>

          <Link href="/cart" className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-orange-200 animate-slide-up group sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-orange-600">{stats.cartItemsCount}</span>
            </div>
            <p className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">Shporta</p>
            <p className="text-xs sm:text-sm text-gray-500 group-hover:text-orange-600 transition-colors">Shiko shportën →</p>
          </Link>
        </div>

        {/* Personal Information Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-gray-100 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Informacione Personale</h2>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-xs sm:text-sm w-full sm:w-auto justify-center"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Ndrysho</span>
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="block text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base">👤</span>
                  <span>Emri i Plotë</span>
                </label>
                <p className="text-base sm:text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</p>
              </div>
              
              <div className="space-y-1">
                <label className="block text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base">📧</span>
                  <span>Email</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <p className="text-base sm:text-lg font-bold text-gray-900 break-all">{user.email}</p>
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold rounded-full border border-green-300 flex items-center gap-1 flex-shrink-0">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Verifikuar</span>
                    <span className="sm:hidden">✓</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base">📱</span>
                  <span>Telefon</span>
                </label>
                {user.phone ? (
                  <p className="text-base sm:text-lg font-bold text-gray-900">{user.phone}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-400 italic">Nuk është vendosur</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base">📅</span>
                  <span>Anëtar që nga</span>
                </label>
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('sq-AL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

