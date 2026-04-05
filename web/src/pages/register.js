import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData);

      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        router.push('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gabim në regjistrim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Head>
        <title>Regjistrohu - FshatiBio</title>
      </Head>

      {/* Left panel — organic hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-organic flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Decorative leaf shapes */}
        <div className="absolute top-12 right-10 opacity-20 rotate-12">
          <svg className="w-28 h-28 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>
        <div className="absolute bottom-20 left-8 opacity-15 -rotate-30">
          <svg className="w-36 h-36 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>
        <div className="absolute top-1/2 left-6 opacity-10 rotate-45">
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
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
            Bashkohuni me mijëra familje që zgjedhin organiken çdo ditë
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {[
              'Produkte 100% organike të certifikuara',
              'Dërgesë e shpejtë deri në shtëpi',
              'Fermerë lokalë të verifikuar',
              'Garanci cilësie ose rimbursim',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90 text-sm">
                <svg className="w-4 h-4 text-honey-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 bg-cream-100 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <svg className="w-10 h-10 text-forest-700 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
            <span className="font-display text-2xl font-bold text-forest-800">FshatiBio</span>
          </div>

          <div className="bg-white rounded-4xl shadow-warm-xl p-8 md:p-10">
            <div className="mb-7">
              <h2 className="font-display text-3xl font-bold text-forest-900 mb-1">Krijo Llogari</h2>
              <p className="text-earth-500 text-sm">Filloni udhëtimin tuaj organik sot</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-forest-800 text-sm font-semibold mb-2">
                    Emri
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                    placeholder="Emri"
                    required
                  />
                </div>
                <div>
                  <label className="block text-forest-800 text-sm font-semibold mb-2">
                    Mbiemri
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                    placeholder="Mbiemri"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-forest-800 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                  placeholder="emri@shembull.com"
                  required
                />
              </div>

              <div>
                <label className="block text-forest-800 text-sm font-semibold mb-2">
                  Telefon <span className="text-earth-400 font-normal">(Opsionale)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                  placeholder="+383 4X XXX XXX"
                />
              </div>

              <div>
                <label className="block text-forest-800 text-sm font-semibold mb-2">
                  Fjalëkalimi
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-forest-900 placeholder-earth-400"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-earth-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Minimum 6 karaktere
                </p>
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
                    <span>Duke regjistruar...</span>
                  </>
                ) : (
                  'Regjistrohu'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-earth-100 text-center">
              <p className="text-earth-500 text-sm">
                Tashmë keni llogari?{' '}
                <Link href="/login" className="text-forest-700 font-semibold hover:text-forest-800 transition-colors">
                  Kyçuni këtu
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
