import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        localStorage.setItem('admin_token', response.data.data.token);
        router.push('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gabim në login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-forest flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mt-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mb-48"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full"></div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
            </svg>
          </div>
          <h1 className="font-display text-4xl text-white mb-4">FshatiBio</h1>
          <p className="text-forest-200 text-lg mb-8 font-medium">Platforma e Produkteve Organike</p>
          <div className="space-y-3 text-left max-w-xs">
            {['Menaxho porositë në kohë reale', 'Analitikë dhe raporte të detajuara', 'Kontrollo produktet dhe stokun', 'Chat live me klientët'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-forest-100">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-forest-50 p-6">
        <div className="bg-white rounded-3xl shadow-warm-xl p-10 w-full max-w-md border border-forest-100">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-forest rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
            </div>
            <span className="font-display text-2xl text-forest-900">FshatiBio</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl text-forest-900 mb-2">Mirë se vini</h2>
            <p className="text-forest-600 text-sm">Kyçuni në panelin admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-forest-800 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 transition-colors text-forest-900 placeholder-forest-300"
                placeholder="admin@fshatibio.com"
                required
              />
            </div>

            <div>
              <label className="block text-forest-800 text-sm font-bold mb-2">
                Fjalëkalimi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 transition-colors text-forest-900 placeholder-forest-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-700 text-white py-3 px-5 rounded-xl font-semibold hover:bg-forest-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-warm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                  Duke u kyçur...
                </span>
              ) : 'Kyçu'}
            </button>
          </form>

          <p className="mt-6 text-xs text-forest-400 text-center">
            Default: admin@fshatibio.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
