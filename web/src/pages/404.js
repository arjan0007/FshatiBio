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
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <Head>
        <title>404 - Faqja nuk u gjet | FshatiBio</title>
      </Head>

      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl w-full animate-fade-in">

          {/* 404 number + leaf illustration */}
          <div className="mb-10 relative inline-block">
            {/* Floating leaf decorations */}
            <div className="absolute -top-6 -left-8 animate-float opacity-60">
              <svg className="w-10 h-10 text-forest-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-6 animate-float opacity-40" style={{ animationDelay: '0.5s' }}>
              <svg className="w-6 h-6 text-honey-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
            </div>
            <div className="absolute -bottom-4 -right-10 animate-float opacity-50 rotate-45" style={{ animationDelay: '1s' }}>
              <svg className="w-8 h-8 text-forest-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
            </div>

            <div
              className={`font-display text-9xl sm:text-[11rem] font-bold leading-none transition-all duration-1000 ${
                isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{
                background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 50%, #f4a261 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </div>
          </div>

          {/* Central leaf SVG illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center animate-bounce-soft">
                <svg className="w-10 h-10 text-forest-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-honey-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">?</span>
              </div>
            </div>
          </div>

          {/* Error message card */}
          <div className="bg-white rounded-3xl shadow-card p-8 md:p-10 mb-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest-900 mb-3">
              Faqja nuk u gjet
            </h2>
            <p className="text-earth-600 text-lg mb-3 leading-relaxed">
              Na vjen keq, por faqja që po kërkoni nuk ekziston ose është zhvendosur.
            </p>
            <p className="text-earth-400 text-sm italic">
              Mund të provoni të kërkoni për diçka tjetër ose të ktheheni në faqen kryesore.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 bg-forest-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm transform hover:scale-105 text-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Kthehu në Faqen Kryesore</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-2 bg-white border-2 border-earth-200 text-forest-800 px-8 py-4 rounded-full font-semibold hover:border-forest-400 hover:bg-forest-50 transition-all transform hover:scale-105 text-lg shadow-card"
            >
              <svg className="w-5 h-5 text-forest-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
              <span>Shiko Produktet</span>
            </Link>
          </div>

          {/* Helpful links */}
          <div className="pt-6 border-t border-earth-200">
            <p className="text-earth-400 text-sm mb-4">Ose provoni:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/" className="text-sm text-earth-500 hover:text-forest-700 transition-colors font-medium">
                Faqja Kryesore
              </Link>
              <span className="text-earth-300">•</span>
              <Link href="/products" className="text-sm text-earth-500 hover:text-forest-700 transition-colors font-medium">
                Produktet
              </Link>
              <span className="text-earth-300">•</span>
              <Link href="/profile" className="text-sm text-earth-500 hover:text-forest-700 transition-colors font-medium">
                Profili
              </Link>
              <span className="text-earth-300">•</span>
              <Link href="/cart" className="text-sm text-earth-500 hover:text-forest-700 transition-colors font-medium">
                Shporta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
