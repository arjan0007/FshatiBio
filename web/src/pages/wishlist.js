import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import Toast from '../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Wishlist() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/wishlist');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setWishlist(response.data.data.wishlist);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem('auth_token');
    try {
      await axios.delete(`${API_URL}/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(wishlist.filter(item => item.product.id !== productId));
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në heqjen e produktit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fefae0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600"></div>
          <p className="text-forest-700 font-medium">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefae0]">
      <Head>
        <title>Lista e Dëshirave - FshatiBio</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-[0_2px_12px_rgba(29,78,53,0.07)] sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display text-2xl font-bold text-forest-700 flex items-center gap-2">
              <span>🌿</span> FshatiBio
            </Link>
            <nav className="flex items-center gap-1 sm:gap-4">
              <Link href="/products" className="text-forest-700 hover:text-forest-900 px-3 py-2 rounded-full hover:bg-forest-50 transition-all text-sm font-medium hidden sm:inline-block">
                Produktet
              </Link>
              <Link href="/cart" className="text-forest-700 hover:text-forest-900 px-3 py-2 rounded-full hover:bg-forest-50 transition-all text-sm font-medium hidden sm:inline-block">
                Shporta
              </Link>
              <Link href="/wishlist" className="bg-forest-700 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-forest-800 transition-all">
                Lista e Dëshirave
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* Page Header Card */}
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#fff4ed] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              <span style={{ color: '#f4a261' }}>♥</span>
            </div>
            <div>
              <h1 className="font-display text-3xl text-forest-900 font-bold leading-tight">Lista e Dëshirave</h1>
              {!loading && wishlist.length > 0 && (
                <p className="text-forest-700 text-sm mt-1">{wishlist.length} produkt{wishlist.length !== 1 ? 'e' : ''} të ruajtura</p>
              )}
            </div>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={() => setShowShareModal(true)}
              className="border-2 border-forest-700 text-forest-700 px-6 py-3 rounded-full font-semibold hover:bg-forest-50 transition-all text-sm flex-shrink-0"
            >
              Ndaj Listën
            </button>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(29,78,53,0.22)] p-8 max-w-md w-full mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-2xl text-forest-900 font-bold mb-2">Ndaj Listën</h2>
              <p className="text-forest-700 text-sm mb-6">Ndani listën tuaj të dëshirave me miqtë dhe familjen.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 border-2 border-forest-700 text-forest-700 px-6 py-3 rounded-full font-semibold hover:bg-forest-50 transition-all text-sm"
                >
                  Mbyll
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setShowShareModal(false);
                  }}
                  className="flex-1 bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-[0_4px_24px_rgba(29,78,53,0.08)] text-sm"
                >
                  Kopjo Linkun
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SkeletonLoader type="product" count={8} />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-7xl mb-6">🌿</div>
            <h2 className="font-display text-3xl text-forest-900 font-bold mb-3">Lista juaj e dëshirave është bosh</h2>
            <p className="text-forest-700 mb-8 max-w-sm">Shtoni produkte organike në listën e dëshirave për t'i shikuar më vonë.</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-[0_4px_24px_rgba(29,78,53,0.08)]"
            >
              Shiko Produktet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] overflow-hidden hover:shadow-[0_12px_40px_rgba(29,78,53,0.14)] hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image wrapper */}
                <div className="relative overflow-hidden">
                  {/* Bio badge */}
                  {item.product.is_bio && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full border border-forest-200">
                        BIO
                      </span>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromWishlist(item.product.id)}
                    className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center hover:text-red-500 hover:bg-red-50 shadow-sm transition-all"
                    title="Hiq nga lista e dëshirave"
                    style={{ color: '#f4a261' }}
                  >
                    <span className="text-lg leading-none">♥</span>
                  </button>

                  <Link href={`/products/${item.product.id}`}>
                    {item.product.image_urls && item.product.image_urls.length > 0 ? (
                      <img
                        src={item.product.image_urls[0]}
                        alt={item.product.name}
                        className="h-52 object-cover w-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-52 bg-[#f2e5cc] flex items-center justify-center">
                        <span className="text-4xl opacity-40">🌿</span>
                      </div>
                    )}
                  </Link>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <Link href={`/products/${item.product.id}`}>
                    <h3 className="font-display text-lg text-forest-900 font-semibold line-clamp-2 mb-2 hover:text-forest-700 transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>

                  <p className="text-forest-700 font-bold text-xl font-display mb-2">
                    {item.product.price} L
                    <span className="text-sm font-normal text-forest-700 opacity-70 ml-1">/ {item.product.unit}</span>
                  </p>

                  <p className={`text-xs mb-4 font-medium ${item.product.stock_quantity > 0 ? 'text-forest-700' : 'text-red-600'}`}>
                    {item.product.stock_quantity > 0
                      ? `✓ Në stok: ${item.product.stock_quantity} ${item.product.unit}`
                      : '✕ Jashtë stokut'}
                  </p>

                  <Link
                    href={`/products/${item.product.id}`}
                    className="w-full bg-forest-700 text-white py-2.5 rounded-full font-semibold hover:bg-forest-800 transition-all text-sm text-center block"
                  >
                    Shiko Produktin
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
