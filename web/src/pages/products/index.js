import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';
import Toast from '../../components/Toast';
import { getSeasonalClass } from '../../utils/seasonalTheme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Products() {
  const router = useRouter();
  const { category, search, min_price, max_price, is_bio, in_stock, min_rating, sort, page } = router.query;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const currentPage = parseInt(page) || 1;
  const [isVisible, setIsVisible] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [seasonalClass, setSeasonalClass] = useState('');
  const [addingToCart, setAddingToCart] = useState({});
  const [toast, setToast] = useState(null);
  const categoriesRef = useRef(null);
  const productsRef = useRef(null);

  // Fix hydration error by only rendering random values on client
  useEffect(() => {
    setIsMounted(true);
    setSeasonalClass(getSeasonalClass());
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [category, search, min_price, max_price, is_bio, in_stock, min_rating, sort, page]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    if (categoriesRef.current) {
      observer.observe(categoriesRef.current);
    }
    if (productsRef.current) {
      observer.observe(productsRef.current);
    }

    return () => {
      if (categoriesRef.current) {
        observer.unobserve(categoriesRef.current);
      }
      if (productsRef.current) {
        observer.unobserve(productsRef.current);
      }
    };
  }, [products, categories]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (min_price) params.append('min_price', min_price);
      if (max_price) params.append('max_price', max_price);
      if (is_bio) params.append('is_bio', is_bio);
      if (in_stock) params.append('in_stock', in_stock);
      if (min_rating) params.append('min_rating', min_rating);
      if (sort) params.append('sort', sort);
      params.append('limit', '9');
      params.append('page', currentPage.toString());

      const response = await axios.get(`${API_URL}/products?${params}`);
      if (response.data.success) {
        const productsData = response.data.data.products || [];
        const pagination = response.data.data.pagination || {};

        const total = pagination.total || response.data.data.total || productsData.length;
        const totalPagesFromAPI = pagination.totalPages;

        setProducts(productsData);
        setTotalProducts(total);

        // Calculate totalPages if not provided by API
        if (totalPagesFromAPI) {
          setTotalPages(totalPagesFromAPI);
        } else if (total > 0) {
          // Calculate based on total products and limit
          const calculatedPages = Math.ceil(total / 9);
          setTotalPages(calculatedPages || 1);
        } else {
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push({
      pathname: '/products',
      query: { ...router.query, search: searchTerm, page: 1 }
    });
  };


  const handlePageChange = (newPage) => {
    router.push({
      pathname: '/products',
      query: { ...router.query, page: newPage }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('auth_token');
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=/products';
      }
      return;
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }));
    try {
      await axios.post(
        `${API_URL}/cart/add`,
        { product_id: productId, quantity: 1 },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setToast({
        message: 'Produkti u shtua në shportë me sukses! 🛒',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: error.response?.data?.error?.message || 'Gabim në shtimin e produktit',
        type: 'error'
      });
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Confetti effect function
  const createConfetti = (element) => {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#fcd34d'];
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-particle';
      confetti.style.left = centerX + 'px';
      confetti.style.top = centerY + 'px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.setProperty('--random-x', `${(Math.random() - 0.5) * 200}px`);
      confetti.style.setProperty('--random-y', `${(Math.random() - 0.5) * 200}px`);
      confetti.style.setProperty('--random-rotate', `${Math.random() * 720}deg`);
      document.body.appendChild(confetti);

      setTimeout(() => {
        confetti.remove();
      }, 2000);
    }
  };

  // Ripple effect function
  const createRipple = (element, event) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Produktet - FshatiBio</title>
        <meta name="description" content="Shiko të gjitha produktet BIO të fshatit - FshatiBio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* Hero Banner */}
      <div className="bg-forest-800 text-cream-100 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-6xl">🌿</div>
          <div className="absolute top-8 right-16 text-4xl">🌾</div>
          <div className="absolute bottom-4 left-1/4 text-5xl">🥛</div>
          <div className="absolute bottom-6 right-1/3 text-3xl">✨</div>
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <p className="text-forest-200 text-sm font-semibold uppercase tracking-widest mb-3">Koleksioni ynë</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-cream-100 mb-4">
            Produktet BIO
          </h1>
          <p className="text-forest-200 text-base md:text-lg max-w-xl mx-auto">
            Zgjidh nga koleksioni ynë i gjerë i produkteve të freskëta organike
          </p>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L60 33.3C120 26.7 240 13.3 360 10C480 6.7 600 13.3 720 18.3C840 23.3 960 26.7 1080 25C1200 23.3 1320 16.7 1380 13.3L1440 10V40H1380C1320 40 1200 40 1080 40C960 40 840 40 720 40C600 40 480 40 360 40C240 40 120 40 60 40H0Z" fill="#fefae0"/>
          </svg>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">

        {/* Categories filter bar */}
        <div
          id="categories-section"
          ref={categoriesRef}
          className={`mb-6 transform transition-all duration-700 ${
            isVisible['categories-section']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-forest-600 text-lg">🏷️</span>
              <h3 className="font-semibold text-sm text-forest-700 uppercase tracking-wide">Kategoritë</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                onClick={(e) => {
                  if (!category) {
                    createConfetti(e.currentTarget);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  !category
                    ? 'bg-forest-700 text-white shadow-warm'
                    : 'bg-white border border-forest-200 text-forest-700 hover:bg-forest-50'
                }`}
              >
                Të Gjitha
              </Link>
              {categories.map((cat, index) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  onClick={(e) => {
                    if (category === cat.id) {
                      createConfetti(e.currentTarget);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    category === cat.id
                      ? 'bg-forest-700 text-white shadow-warm'
                      : 'bg-white border border-forest-200 text-forest-700 hover:bg-forest-50'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          id="products-section"
          ref={productsRef}
          className={`transform transition-all duration-700 ${
            isVisible['products-section']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-card overflow-hidden animate-pulse">
                  <div className="w-full h-56 bg-earth-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-earth-200 rounded-full w-3/4"></div>
                    <div className="h-4 bg-earth-200 rounded-full w-1/2"></div>
                    <div className="h-6 bg-earth-200 rounded-full w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-card">
              <div className="text-7xl mb-4">🔍</div>
              <h3 className="font-display text-2xl text-forest-900 font-bold mb-3">Nuk u gjetën produkte</h3>
              <p className="text-earth-600 mb-8">Provoni të kërkoni diçka tjetër</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm"
              >
                <span>Shiko Të Gjitha Produktet</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`product-card bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={(e) => {
                    createRipple(e.currentTarget, e);
                  }}
                >
                  {/* Image area */}
                  <Link href={`/products/${product.id}`} className="image-zoom h-56 block relative overflow-hidden">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-forest-50 flex items-center justify-center">
                        <span className="text-6xl">🌾</span>
                      </div>
                    )}

                    {/* BIO Badge */}
                    {product.is_bio && (
                      <div className="absolute top-3 left-3 z-20">
                        <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full border border-forest-200">
                          🌿 BIO
                        </span>
                      </div>
                    )}

                    {/* Out of stock overlay */}
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-white text-forest-900 px-4 py-2 rounded-full font-bold text-sm">
                          Jashtë Stokut
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Card content */}
                  <div className="p-4 md:p-5">
                    <h3 className="font-semibold text-forest-900 text-base md:text-lg mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div>
                        <p className="font-display text-xl text-forest-700 font-bold leading-none">
                          {product.price} L
                        </p>
                        <p className="text-earth-500 text-xs mt-0.5">/ {product.unit}</p>
                      </div>
                      {product.average_rating > 0 && (
                        <div className="flex items-center gap-1 bg-honey-50 px-2 py-1 rounded-full border border-honey-200">
                          <span className="text-honey-500 text-sm">★</span>
                          <span className="text-xs font-bold text-forest-800">
                            {product.average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 border-2 border-forest-700 text-forest-700 px-3 py-2 rounded-full font-semibold hover:bg-forest-50 transition-all text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Detajet
                      </Link>
                      <button
                        onClick={(e) => handleAddToCart(product.id, e)}
                        disabled={addingToCart[product.id] || product.stock_quantity === 0}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-honey-500 text-white px-3 py-2 rounded-full font-semibold hover:bg-honey-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {addingToCart[product.id] ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        ) : (
                          <>🛒 Shto</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="text-sm text-earth-600 font-medium">
              Shfaqen {((currentPage - 1) * 9) + 1} - {Math.min(currentPage * 9, totalProducts)} nga {totalProducts} produkte
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  currentPage === 1
                    ? 'bg-earth-100 text-earth-400 cursor-not-allowed'
                    : 'bg-forest-700 text-white hover:bg-forest-800 shadow-warm'
                }`}
              >
                ← Para
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                          currentPage === pageNum
                            ? 'bg-forest-700 text-white shadow-warm'
                            : 'bg-white text-forest-700 border border-forest-200 hover:bg-forest-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })
                ) : (
                  <>
                    {currentPage > 4 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="w-10 h-10 rounded-full font-semibold text-sm bg-white text-forest-700 border border-forest-200 hover:bg-forest-50 transition-all"
                        >
                          1
                        </button>
                        {currentPage > 5 && (
                          <span className="px-2 text-earth-500 text-sm">...</span>
                        )}
                      </>
                    )}

                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                            currentPage === pageNum
                              ? 'bg-forest-700 text-white shadow-warm'
                              : 'bg-white text-forest-700 border border-forest-200 hover:bg-forest-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {currentPage < totalPages - 3 && (
                      <>
                        {currentPage < totalPages - 4 && (
                          <span className="px-2 text-earth-500 text-sm">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="w-10 h-10 rounded-full font-semibold text-sm bg-white text-forest-700 border border-forest-200 hover:bg-forest-50 transition-all"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  currentPage === totalPages
                    ? 'bg-earth-100 text-earth-400 cursor-not-allowed'
                    : 'bg-forest-700 text-white hover:bg-forest-800 shadow-warm'
                }`}
              >
                Tjetër →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-forest-900 text-cream-100 py-8 mt-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="font-display text-lg font-bold mb-2 text-cream-100">🥛 FshatiBio</h3>
              <p className="text-forest-300 text-xs mb-3">Platforma më e besueshme për produkte BIO</p>
              <div className="flex gap-2">
                {[
                  { icon: '📘', label: 'Facebook', href: '#' },
                  { icon: '📷', label: 'Instagram', href: '#' },
                  { icon: '🐦', label: 'Twitter', href: '#' }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-sm hover:bg-forest-600 transition-colors"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-forest-300 mb-2">Linqe të Shpejta</h4>
              <ul className="space-y-1 text-xs text-forest-400">
                {[
                  { href: '/products', label: 'Produktet' },
                  { href: '/cart', label: 'Shporta' },
                  { href: '/orders', label: 'Porositë' },
                  { href: '/profile', label: 'Profili' }
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-cream-100 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-forest-300 mb-2">Kontakt</h4>
              <div className="space-y-1 text-xs text-forest-400">
                <p><a href="tel:+35569XXXXXXX" className="hover:text-cream-100 transition-colors">📞 +355 69 XXX XXXX</a></p>
                <p><a href="mailto:info@fshatibio.com" className="hover:text-cream-100 transition-colors break-all">📧 info@fshatibio.com</a></p>
              </div>
            </div>
          </div>
          <div className="border-t border-forest-700 mt-6 pt-4 text-center">
            <p className="text-forest-400 text-xs">&copy; 2025 FshatiBio. Të gjitha të drejtat e rezervuara.</p>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
}
