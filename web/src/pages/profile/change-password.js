import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ChangePassword() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'I dobët', color: 'red' };
    if (password.length < 10) return { strength: 2, label: 'Mesatar', color: 'yellow' };
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'I fortë', color: 'green' };
    }
    return { strength: 2, label: 'Mesatar', color: 'yellow' };
  };

  const passwordStrength = getPasswordStrength(formData.new_password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.new_password !== formData.confirm_password) {
      setError('Fjalëkalimet e reja nuk përputhen');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('Fjalëkalimi i ri duhet të jetë së paku 6 karaktere');
      return;
    }

    setChanging(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login?redirect=/profile/change-password');
        return;
      }

      const response = await axios.put(
        `${API_URL}/auth/change-password`,
        {
          old_password: formData.old_password,
          new_password: formData.new_password
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Gabim në ndryshimin e fjalëkalimit');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Ndrysho Fjalëkalimin - FshatiBio</title>
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
            <span className="text-3xl sm:text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Ndrysho Fjalëkalimin</h1>
          <p className="text-gray-600 text-sm sm:text-base">Sigurohu që fjalëkalimi yt është i sigurt dhe i fortë</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 border-2 border-gray-100 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 sm:p-4 text-green-700 animate-fade-in">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl">✅</span>
                  <span className="font-medium text-sm sm:text-base">Fjalëkalimi u ndryshua me sukses! Po ktheheni te profili...</span>
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

            {/* Old Password */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">🔑</span>
                <span>Fjalëkalimi Aktual *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.old ? 'text' : 'password'}
                  value={formData.old_password}
                  onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-900 font-medium pr-10 sm:pr-12 text-sm sm:text-base"
                  placeholder="Shkruani fjalëkalimin aktual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={showPasswords.old ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  <span className="text-lg sm:text-xl">{showPasswords.old ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">🆕</span>
                <span>Fjalëkalimi i Ri *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-900 font-medium pr-10 sm:pr-12 text-sm sm:text-base"
                  placeholder="Shkruani fjalëkalimin e ri"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={showPasswords.new ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  <span className="text-lg sm:text-xl">{showPasswords.new ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold ${
                          passwordStrength.color === 'red' ? 'text-red-600' :
                          passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Duhet të jetë së paku 6 karaktere. Për fjalëkalim më të fortë, përdorni shkronja të mëdha, të vogla dhe numra.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">✓</span>
                <span>Konfirmo Fjalëkalimin e Ri *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-gray-900 font-medium pr-10 sm:pr-12 text-sm sm:text-base ${
                    formData.confirm_password && formData.new_password !== formData.confirm_password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : formData.confirm_password && formData.new_password === formData.confirm_password
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                      : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                  }`}
                  placeholder="Konfirmoni fjalëkalimin e ri"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={showPasswords.confirm ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  <span className="text-lg sm:text-xl">{showPasswords.confirm ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirm_password && (
                <div className="mt-1.5 sm:mt-2 animate-fade-in">
                  {formData.new_password === formData.confirm_password ? (
                    <p className="text-[10px] sm:text-xs text-green-600 font-medium flex items-center gap-1">
                      <span>✅</span>
                      <span>Fjalëkalimet përputhen</span>
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-red-600 font-medium flex items-center gap-1">
                      <span>❌</span>
                      <span>Fjalëkalimet nuk përputhen</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={changing || success}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                {changing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Duke ndryshuar...</span>
                    <span className="sm:hidden">Ndryshim...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base sm:text-lg">🔐</span>
                    <span className="hidden sm:inline">Ndrysho Fjalëkalimin</span>
                    <span className="sm:hidden">Ndrysho</span>
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

        {/* Security Tips Card */}
        <div className="mt-4 sm:mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4 animate-fade-in">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">Këshilla për Siguri:</h3>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1 list-disc list-inside">
                <li>Përdorni fjalëkalim të gjatë (më shumë se 8 karaktere)</li>
                <li>Përdorni kombinim të shkronjave, numrave dhe simboleve</li>
                <li>Mos përdorni informacione personale në fjalëkalim</li>
                <li>Ndryshoni fjalëkalimin rregullisht</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

