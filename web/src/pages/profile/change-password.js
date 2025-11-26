import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

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
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
        alert('Fjalëkalimi u ndryshua me sukses!');
        router.push('/profile');
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Gabim në ndryshimin e fjalëkalimit');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Ndrysho Fjalëkalimin - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <Link href="/profile" className="text-green-600 hover:underline text-sm sm:text-base">
            ← Kthehu te Profili
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Ndrysho Fjalëkalimin</h1>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Fjalëkalimi Aktual *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    value={formData.old_password}
                    onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                    className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.old ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Fjalëkalimi i Ri *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Duhet të jetë së paku 6 karaktere
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Konfirmo Fjalëkalimin e Ri *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={changing}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changing ? 'Duke ndryshuar...' : 'Ndrysho Fjalëkalimin'}
                </button>
                <Link
                  href="/profile"
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 text-center"
                >
                  Anulo
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

