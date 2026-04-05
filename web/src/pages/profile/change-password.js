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
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Ndrysho Fjalëkalimin - FshatiBio</title>
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
            <span className="text-3xl sm:text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-stone-900 mb-1 sm:mb-2">
            Ndrysho Fjalëkalimin
          </h1>
          <p className="text-stone-500 text-sm sm:text-base">Sigurohu që fjalëkalimi yt është i sigurt dhe i fortë</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 lg:p-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 text-forest-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span className="font-medium text-sm sm:text-base">Fjalëkalimi u ndryshua me sukses! Po ktheheni te profili...</span>
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

            {/* Old Password */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>🔑</span>
                <span>Fjalëkalimi Aktual *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.old ? 'text' : 'password'}
                  value={formData.old_password}
                  onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-stone-900 font-medium pr-12 text-sm sm:text-base"
                  placeholder="Shkruani fjalëkalimin aktual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  title={showPasswords.old ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  <span className="text-lg sm:text-xl">{showPasswords.old ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>🆕</span>
                <span>Fjalëkalimi i Ri *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-stone-900 font-medium pr-12 text-sm sm:text-base"
                  placeholder="Shkruani fjalëkalimin e ri"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  title={showPasswords.new ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  <span className="text-lg sm:text-xl">{showPasswords.new ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="mt-2 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          passwordStrength.color === 'red' ? 'bg-red-400' :
                          passwordStrength.color === 'yellow' ? 'bg-honey-400' :
                          'bg-forest-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-bold min-w-fit ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'yellow' ? 'text-honey-600' :
                      'text-forest-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Duhet të jetë së paku 6 karaktere. Për fjalëkalim më të fortë, përdorni shkronja të mëdha, të vogla dhe numra.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                <span>✓</span>
                <span>Konfirmo Fjalëkalimin e Ri *</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition-colors text-stone-900 font-medium pr-12 text-sm sm:text-base ${
                    formData.confirm_password && formData.new_password !== formData.confirm_password
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : formData.confirm_password && formData.new_password === formData.confirm_password
                      ? 'border-forest-400 focus:border-forest-500 bg-forest-50'
                      : 'border-earth-200 bg-white focus:border-forest-500'
                  }`}
                  placeholder="Konfirmoni fjalëkalimin e ri"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  title={showPasswords.confirm ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  <span className="text-lg sm:text-xl">{showPasswords.confirm ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirm_password && (
                <div className="mt-2 animate-fade-in">
                  {formData.new_password === formData.confirm_password ? (
                    <p className="text-xs text-forest-600 font-medium flex items-center gap-1">
                      <span>✅</span>
                      <span>Fjalëkalimet përputhen</span>
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                      <span>❌</span>
                      <span>Fjalëkalimet nuk përputhen</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-5 border-t border-stone-100">
              <button
                type="submit"
                disabled={changing || success}
                className="flex-1 bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {changing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Duke ndryshuar...</span>
                    <span className="sm:hidden">Ndryshim...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span className="hidden sm:inline">Ndrysho Fjalëkalimin</span>
                    <span className="sm:hidden">Ndrysho</span>
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

        {/* Security Tips Card */}
        <div className="mt-5 sm:mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-1.5 text-sm sm:text-base">Këshilla për Siguri:</h3>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1 list-disc list-inside">
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
