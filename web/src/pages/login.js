import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        const redirect = router.query.redirect || '/';
        router.push(redirect);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gabim në login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Head>
        <title>Login - FshatiBio</title>
      </Head>

      {/* Left panel — organic hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-organic flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Decorative leaf shapes */}
        <div className="absolute top-10 left-8 opacity-20">
          <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>
        <div className="absolute bottom-16 right-10 opacity-15 rotate-45">
          <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>
        <div className="absolute top-1/3 right-6 opacity-10 -rotate-12">
          <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>

        <div className="relative z-10 text-center animate-fade-in">
          <div className="mb-8">
            <svg className="w-16 h-16 text-white mx-auto mb-4 animate-float" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">
            FshatiBio
          </h1>
          <p className="text-xl text-white/80 max-w-sm mx-auto leading-relaxed font-light">
            Produkte organike të freskëta, direkt nga fermerët lokalë në tryezën tuaj
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full border border-forest-200">
              100% Organike
            </span>
            <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full border border-forest-200">
              Fermerë Lokalë
            </span>
            <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full border border-forest-200">
              Dërgesë e Shpejtë
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 bg-cream-100 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <svg className="w-10 h-10 text-forest-700 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
            <span className="font-display text-2xl font-bold text-forest-800">FshatiBio</span>
          </div>

          <div className="bg-white rounded-4xl shadow-warm-xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-forest-900 mb-1">Mirë se kthyet</h2>
              <p className="text-earth-500 text-sm">Kyçuni në llogarinë tuaj për të vazhduar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-forest-800 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                  placeholder="emri@shembull.com"
                  required
                />
              </div>

              <div>
                <label className="block text-forest-800 text-sm font-semibold mb-2">
                  Fjalëkalimi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-forest-700 text-white w-full text-center py-4 px-6 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span>Duke u kyçur...</span>
                  </>
                ) : (
                  'Kyçu'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-earth-100 text-center">
              <p className="text-earth-500 text-sm">
                Nuk keni llogari?{' '}
                <Link href="/register" className="text-forest-700 font-semibold hover:text-forest-800 transition-colors">
                  Regjistrohu falas
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
