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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Lista e Dëshirave - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-green-700">
              🥛 FshatiBio
            </Link>
            <nav className="flex gap-4">
              <Link href="/products" className="text-gray-700 hover:text-green-700">
                Produktet
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-green-700">
                Shporta
              </Link>
              <Link href="/wishlist" className="text-green-700 font-semibold">
                Lista e Dëshirave
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Lista e Dëshirave</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <SkeletonLoader type="product" count={8} />
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="Lista juaj e dëshirave është bosh"
            description="Shtoni produkte në listën e dëshirave për t'i shikuar më vonë"
            actionLabel="Shiko Produktet"
            onAction={() => router.push('/products')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden relative"
              >
                <button
                  onClick={() => removeFromWishlist(item.product.id)}
                  className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow hover:bg-red-50 transition"
                  title="Hiq nga lista e dëshirave"
                >
                  <span className="text-red-500 text-xl">❤️</span>
                </button>

                <Link href={`/products/${item.product.id}`}>
                  {item.product.image_urls && item.product.image_urls.length > 0 && (
                    <img
                      src={item.product.image_urls[0]}
                      alt={item.product.name}
                      className="w-full h-40 sm:h-48 object-cover"
                    />
                  )}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{item.product.name}</h3>
                    {item.product.is_bio && (
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mb-2">
                        BIO
                      </span>
                    )}
                    <p className="text-green-700 font-bold text-lg sm:text-xl">
                      {item.product.price} L / {item.product.unit}
                    </p>
                    <p className={`text-xs sm:text-sm mt-1 ${item.product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.product.stock_quantity > 0 
                        ? `Në stok: ${item.product.stock_quantity} ${item.product.unit}`
                        : 'Jashtë stokut'}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

