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
    <div className="min-h-screen relative overflow-hidden">
      {/* Ultra WOW Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 via-teal-50 to-white"></div>
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/30 via-emerald-100/20 via-teal-100/30 to-green-100/30 animate-gradient-shift"></div>
        
        {/* Large Animated Blobs */}
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-green-200/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-teal-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-green-300/15 rounded-full blur-3xl animate-blob animation-delay-1000"></div>
        
        {/* Mesh Gradient Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)`
        }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative z-0">
      <Head>
        <title>Produktet - FshatiBio</title>
        <meta name="description" content="Shiko të gjitha produktet BIO të fshatit - FshatiBio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <main className="relative container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-10 overflow-hidden">
        {/* Ultra WOW Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Enhanced Floating Particles */}
        {isMounted && (
          <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {[...Array(15)].map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = Math.random() * 5;
                const duration = 4 + Math.random() * 3;
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-green-400/30 rounded-full animate-float"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Floating Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {['🌾', '🥛', '🌿', '✨', '⭐'].map((icon, i) => {
                const left = 10 + Math.random() * 80;
                const top = 10 + Math.random() * 80;
                const delay = Math.random() * 5;
                const duration = 5 + Math.random() * 3;
                return (
                  <div
                    key={i}
                    className="absolute text-3xl opacity-10 animate-float"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`
                    }}
                  >
                    {icon}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="relative z-10">
          {/* Page Header - Ultra WOW Design */}
          <div className="text-center mb-8 md:mb-12 relative">
            {/* Multiple Glow Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
              <div className="absolute w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
              </div>

            <div className="inline-block mb-4 relative group">
              {/* Pulse Rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-20 h-20 border-4 border-green-400/30 rounded-full animate-pulse-ring"></div>
                <div className="absolute w-24 h-24 border-4 border-emerald-400/30 rounded-full animate-pulse-ring animation-delay-500"></div>
                <div className="absolute w-28 h-28 border-4 border-teal-400/30 rounded-full animate-pulse-ring animation-delay-1000"></div>
              </div>

              <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity duration-500"></div>
              <span className="relative text-4xl sm:text-5xl md:text-6xl block transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-bounce">🛍️</span>
              </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 relative inline-block group">
              {/* Multi-layered Glow */}
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></span>
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent blur-xl opacity-50 animate-pulse"></span>
              <span className="relative z-10 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent animate-gradient-shift">
                Produktet
              </span>
              
              {/* Animated Underline */}
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full"></span>
            </h1>
            
            <p className="text-gray-700 text-base sm:text-lg md:text-xl px-4 font-semibold relative group">
              <span className="relative z-10">Zgjidh nga koleksioni ynë i gjerë i produkteve BIO</span>
              <span className="absolute inset-0 text-green-400 blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-500">
                Zgjidh nga koleksioni ynë i gjerë i produkteve BIO
              </span>
            </p>
              </div>

          {/* Main Content */}
        <div className="w-full">
            {/* Categories - Animated */}
            <div 
              id="categories-section"
              ref={categoriesRef}
              className={`mb-6 transform transition-all duration-1000 ${
                isVisible['categories-section'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg animate-bounce">🏷️</span>
                  <h3 className="font-black text-sm text-gray-600 uppercase tracking-wide">Kategoritë</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/products"
                    onClick={(e) => {
                      if (!category) {
                        createConfetti(e.currentTarget);
                      }
                    }}
                    className={`group relative px-4 py-2.5 rounded-xl font-semibold text-sm transition-all transform hover:scale-110 overflow-hidden ${
                      !category 
                        ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg' 
                        : 'bg-white text-gray-700 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300'
                  }`}
                    style={{ animationDelay: '0s' }}
                  >
                    {/* Shine Effect for Active */}
                    {!category && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    )}
                    <span className="relative z-10">Të Gjitha</span>
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
                      className={`group relative px-4 py-2.5 rounded-xl font-semibold text-sm transition-all transform hover:scale-110 overflow-hidden ${
                      category === cat.id
                          ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300'
                    }`}
                      style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                  >
                      {/* Shine Effect for Active */}
                      {category === cat.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      )}
                      <span className="relative z-10">{cat.name}</span>
                  </Link>
                ))}
                </div>
              </div>
            </div>

            {/* Products Grid - Animated */}
            <div 
              id="products-section"
              ref={productsRef}
              className={`transform transition-all duration-1000 ${
                isVisible['products-section'] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
            >
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
                    <div className="w-full h-40 sm:h-48 md:h-64 bg-gray-200 animate-shimmer"></div>
                    <div className="p-3 sm:p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-shimmer"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-black text-gray-800 mb-3">Nuk u gjetën produkte</h3>
                <p className="text-gray-600 mb-6">Provoni të kërkoni diçka tjetër</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span>Shiko Të Gjitha Produktet</span>
                  <span>↻</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="group relative perspective-1000 product-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onMouseEnter={(e) => {
                      createRipple(e.currentTarget, e);
                    }}
                  >
                    {/* 3D Card Container */}
                    <div className="relative h-full transform-style-preserve-3d transition-all duration-700 group-hover:rotate-y-6 group-hover:-translate-y-2">
                      {/* Front of Card - Glassmorphism */}
                      <div className="relative h-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden transform translate-z-0 group-hover:translate-z-10 group-hover:shadow-3xl transition-all duration-700">
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-emerald-300/0 to-teal-400/0 group-hover:from-green-400/10 group-hover:via-emerald-300/10 group-hover:to-teal-400/10 transition-all duration-700"></div>
                        
                        {/* Glassmorphism Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Sparkle Particles */}
                        {isMounted && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            {[...Array(6)].map((_, i) => {
                              const left = 20 + Math.random() * 60;
                              const top = 20 + Math.random() * 60;
                              const delay = Math.random() * 2;
                              return (
                                <div
                                  key={i}
                                  className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
                                  style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    animationDelay: `${delay}s`
                                  }}
                                ></div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        </div>
                        
                        {/* Image Container - Clickable Link */}
                        <Link href={`/products/${product.id}`} className="relative overflow-hidden h-40 sm:h-48 md:h-56 lg:h-64 block">
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <>
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                                className="w-full h-full object-cover transform group-hover:scale-125 transition-transform duration-700"
                      />
                              {/* Gradient Overlay on Image */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 flex items-center justify-center group-hover:from-green-200 group-hover:via-emerald-200 group-hover:to-teal-200 transition-all duration-500">
                              <span className="text-5xl sm:text-6xl md:text-7xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">🌾</span>
                          </div>
                          )}
                          
                          {/* BIO Badge - Enhanced */}
                        {product.is_bio && (
                            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
                              <div className="relative">
                                <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
                                <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-black shadow-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 border-2 border-white/50">
                                  <span className="relative z-10 flex items-center gap-1">
                                    <span className="text-sm">✨</span>
                                    <span>BIO</span>
                          </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Stock Status */}
                          {product.stock_quantity === 0 && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                              <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 md:px-5 md:py-3 rounded-xl font-black text-sm md:text-base shadow-2xl transform group-hover:scale-110 transition-transform duration-300 border-2 border-white/30">
                                Jashtë Stokut
                              </div>
                            </div>
                        )}
                      </Link>
                        
                        {/* Content */}
                        <div className="relative z-10 p-3 sm:p-4 md:p-5 lg:p-6 bg-white/80 backdrop-blur-md">
                          {/* Product Name */}
                          <h3 className="font-black text-sm sm:text-base md:text-lg lg:text-xl mb-2 sm:mb-3 text-gray-800 group-hover:text-green-600 transition-colors duration-500 line-clamp-2 relative">
                            <span className="relative z-10">{product.name}</span>
                            <span className="absolute inset-0 text-green-400 blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-500">
                              {product.name}
                            </span>
                          </h3>
                          
                          {/* Price and Rating */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="relative flex-shrink-0">
                              {/* Price with Glow */}
                              <div className="relative">
                                <p className="text-green-700 font-black text-lg sm:text-xl md:text-2xl lg:text-3xl transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                                  {product.price} L
                                </p>
                                <p className="absolute inset-0 text-green-400 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                                  {product.price} L
                                </p>
                              </div>
                              <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm font-semibold mt-0.5 sm:mt-1">
                                / {product.unit}
                              </p>
                            </div>
                            
                            {/* Rating with Animation */}
                            {product.average_rating > 0 && (
                              <div className="flex items-center gap-1 sm:gap-1.5 bg-yellow-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-yellow-200 group-hover:border-yellow-300 group-hover:bg-yellow-100 transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">
                                <span className="text-yellow-400 text-sm sm:text-base md:text-lg transform group-hover:rotate-12 group-hover:scale-125 transition-all duration-300">⭐</span>
                                <span className="text-[10px] sm:text-xs md:text-sm font-black text-gray-800">
                                  {product.average_rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2">
                            <Link
                              href={`/products/${product.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 text-xs sm:text-sm font-black"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="hidden sm:inline">Detajet</span>
                              <span className="sm:hidden">Detaje</span>
                              <span className="transform group-hover:translate-x-1 transition-transform duration-300 text-xs sm:text-sm">→</span>
                            </Link>
                            <button
                              onClick={(e) => handleAddToCart(product.id, e)}
                              disabled={addingToCart[product.id] || product.stock_quantity === 0}
                              className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-black"
                            >
                              {addingToCart[product.id] ? (
                                <>
                                  <span className="hidden sm:inline">Duke shtuar...</span>
                                  <span className="sm:hidden">...</span>
                                  <span className="animate-spin text-xs sm:text-sm">⏳</span>
                                </>
                              ) : (
                                <>
                                  <span className="hidden sm:inline">🛒 Shto</span>
                                  <span className="sm:hidden">🛒</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Corner Accents */}
                        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-2xl transform group-hover:scale-110"></div>
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-2xl transform group-hover:scale-110"></div>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            
            {/* Pagination - Enhanced */}
            {!loading && products.length > 0 && totalPages > 1 && (
              <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col items-center gap-3 sm:gap-4 relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-teal-400/10 rounded-2xl blur-xl"></div>
                
                <div className="relative text-xs sm:text-sm text-gray-600 font-semibold bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-gray-200 text-center">
                  Shfaqen {((currentPage - 1) * 9) + 1} - {Math.min(currentPage * 9, totalProducts)} nga {totalProducts} produkte
                </div>
                <div className="relative flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all transform ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <span className="hidden sm:inline">← Para</span>
                    <span className="sm:hidden">←</span>
                  </button>
                  
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {totalPages <= 7 ? (
                      // Show all pages if 7 or less
                      Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm transition-all transform ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg scale-110'
                                : 'bg-white text-gray-700 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 hover:scale-105'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })
                    ) : (
                      // Show pages with ellipsis for more than 7 pages
                      <>
                        {currentPage > 4 && (
                          <>
                            <button
                              onClick={() => handlePageChange(1)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm bg-white text-gray-700 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 hover:scale-105 transition-all transform"
                            >
                              1
                            </button>
                            {currentPage > 5 && (
                              <span className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
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
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm transition-all transform ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg scale-110'
                                  : 'bg-white text-gray-700 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 hover:scale-105'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {currentPage < totalPages - 3 && (
                          <>
                            {currentPage < totalPages - 4 && (
                              <span className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm bg-white text-gray-700 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 hover:scale-105 transition-all transform"
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
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all transform ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <span className="hidden sm:inline">Tjetër →</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      

      {/* Footer - Compact, Organized & WOW */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-3 md:py-4 mt-3 md:mt-4 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-emerald-600/5 to-teal-600/5 animate-gradient-shift"></div>
        
        {/* Animated Top Border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-pulse"></div>
        
        {/* Subtle Floating Particles */}
        {isMounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => {
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 3;
              const duration = 3 + Math.random() * 2;
              return (
                <div
                  key={i}
                  className="absolute w-0.5 h-0.5 bg-green-400 rounded-full opacity-20 animate-float"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`
                  }}
                ></div>
              );
            })}
          </div>
        )}
        
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {/* Column 1: Logo + Social Media */}
            <div className="group relative">
              <div className="absolute inset-0 bg-green-400/0 group-hover:bg-green-400/5 rounded transition-all duration-500"></div>
              <div className="relative text-center sm:text-left">
                <h3 className="text-base md:text-lg font-black mb-0.5 flex items-center justify-center sm:justify-start gap-1.5 transform group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg md:text-xl transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">🥛</span>
                  <span className="bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent animate-gradient-shift relative">
                    FshatiBio
                    <span className="absolute inset-0 bg-green-400 blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300">FshatiBio</span>
                  </span>
                </h3>
                <p className="text-gray-400 text-[10px] sm:text-xs group-hover:text-gray-300 transition-colors duration-300 mb-2">
                  Platforma më e besueshme për produkte BIO
                </p>
                
                {/* Social Media Icons */}
                <div className="flex gap-2 justify-center sm:justify-start">
                  {[
                    { icon: '📘', label: 'Facebook', href: '#' },
                    { icon: '📷', label: 'Instagram', href: '#' },
                    { icon: '🐦', label: 'Twitter', href: '#' }
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-sm sm:text-base hover:bg-green-500/20 hover:scale-110 hover:rotate-12 transition-all duration-300 cursor-pointer border border-white/10 hover:border-green-400/50 group/social"
                      aria-label={social.label}
                    >
                      <span className="transform group-hover/social:scale-125 transition-transform duration-300">{social.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Column 2: Quick Links */}
            <div className="group relative">
              <div className="absolute inset-0 bg-green-400/0 group-hover:bg-green-400/5 rounded transition-all duration-500"></div>
              <div className="relative">
                <h4 className="font-black mb-1.5 sm:mb-1 text-[10px] sm:text-xs relative inline-block text-left w-full">
                  <span className="relative z-10">Linqe të Shpejta</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                </h4>
                <ul className="space-y-0.5 text-[10px] sm:text-xs text-gray-400">
                  {[
                    { href: '/products', label: 'Produktet', icon: '🛍️' },
                    { href: '/cart', label: 'Shporta', icon: '🛒' },
                    { href: '/orders', label: 'Porositë', icon: '📦' },
                    { href: '/profile', label: 'Profili', icon: '👤' }
                  ].map((link) => (
                    <li key={link.href} className="text-left">
                      <Link 
                        href={link.href} 
                        className="group/link flex items-center gap-1 hover:text-white transition-all duration-300 relative overflow-hidden"
                      >
                        <span className="text-[10px] sm:text-xs transform group-hover/link:scale-125 group-hover/link:rotate-12 transition-all duration-300">{link.icon}</span>
                        <span className="relative z-10 transform group-hover/link:translate-x-1 transition-transform duration-300">{link.label}</span>
                        <span className="absolute left-0 bottom-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 w-0 group-hover/link:w-full transition-all duration-500"></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Column 3: Contact (Phone + Email) */}
            <div className="group relative">
              <div className="absolute inset-0 bg-green-400/0 group-hover:bg-green-400/5 rounded transition-all duration-500"></div>
              <div className="relative">
                <h4 className="font-black mb-1.5 sm:mb-1 text-[10px] sm:text-xs relative inline-block text-left w-full">
                  <span className="relative z-10">Kontakt</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                </h4>
                <div className="space-y-0.5 text-[10px] sm:text-xs text-gray-400">
                  <p className="group/phone text-left">
                    <span className="text-[10px] sm:text-xs mr-0.5">📞</span>
                    <a 
                      href="tel:+35569XXXXXXX" 
                      className="hover:text-green-400 transition-colors duration-300 relative group/link block"
                    >
                      <span className="relative z-10">+355 69 XXX XXXX</span>
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 transform scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300"></span>
                    </a>
                  </p>
                  <p className="group/email text-left">
                    <span className="text-[10px] sm:text-xs mr-0.5">📧</span>
                    <a 
                      href="mailto:info@fshatibio.com" 
                      className="hover:text-green-400 transition-colors duration-300 relative group/link break-all block"
                    >
                      <span className="relative z-10">info@fshatibio.com</span>
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 transform scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300"></span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright - Compact */}
          <div className="border-t border-gray-700/50 mt-3 sm:mt-2 pt-2 sm:pt-2 text-center relative">
            {/* Animated Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent"></div>
            
            <p className="text-gray-500 text-[10px] sm:text-xs relative inline-block group px-2 sm:px-0">
              <span className="relative z-10 break-words">
                &copy; 2025 FshatiBio. Të gjitha të drejtat e rezervuara.
              </span>
              <span className="absolute inset-0 text-green-400 blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                &copy; 2025 FshatiBio. Të gjitha të drejtat e rezervuara.
              </span>
            </p>
          </div>
        </div>
        
        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-green-500/5 to-transparent pointer-events-none"></div>
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
    </div>
  );
}
