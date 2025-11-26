import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Profili Im - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Profili Im</h1>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Informacione Personale</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Emri</label>
                  <p className="text-lg">{user.first_name} {user.last_name}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Email</label>
                  <p className="text-lg">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Telefon</label>
                    <p className="text-lg">{user.phone}</p>
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Anëtar që nga</label>
                  <p className="text-lg">
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

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">Menaxhimi i Shpejtë</h2>
              <div className="space-y-2 sm:space-y-3">
                <Link
                  href="/profile/edit"
                  className="block w-full bg-green-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-green-700 transition text-sm sm:text-base"
                >
                  Ndrysho Profil
                </Link>
                <Link
                  href="/profile/change-password"
                  className="block w-full bg-blue-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  Ndrysho Fjalëkalimin
                </Link>
                <Link
                  href="/orders"
                  className="block w-full bg-purple-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
                >
                  Porositë e Mia
                </Link>
                <Link
                  href="/addresses"
                  className="block w-full bg-indigo-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition text-sm sm:text-base"
                >
                  Adresat e Mia
                </Link>
                <Link
                  href="/cart"
                  className="block w-full bg-orange-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-orange-700 transition text-sm sm:text-base"
                >
                  Shporta
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full bg-red-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
                >
                  Dil
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

