import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

export default function Custom404() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/50 flex flex-col">
      <Head>
        <title>404 - Faqja nuk u gjet | FshatiBio</title>
      </Head>

      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl w-full animate-fade-in">
          {/* Animated 404 */}
          <div className="mb-8 relative">
            <div className={`inline-block text-9xl sm:text-[12rem] font-black bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 transform transition-all duration-1000 ${isMounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              404
            </div>
            
            {/* Search Icon */}
            <div className="text-8xl mb-6 animate-bounce">
              🔍
            </div>
          </div>

          {/* Error Message Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-2 border-white/50">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Faqja nuk u gjet
            </h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              Na vjen keq, por faqja që po kërkoni nuk ekziston ose është zhvendosur.
            </p>
            <p className="text-sm text-gray-500 italic">
              Mund të provoni të kërkoni për diçka tjetër ose të ktheheni në faqen kryesore.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl font-bold text-lg"
            >
              <span>🏠</span>
              <span>Kthehu në Faqen Kryesore</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-800 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-bold text-lg"
            >
              <span>🛍️</span>
              <span>Shiko Produktet</span>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Ose provoni:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Faqja Kryesore
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/products" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Produktet
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/profile" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Profili
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/cart" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Shporta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

