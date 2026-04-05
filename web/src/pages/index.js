import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../components/Header';
import CountdownTimer from '../components/CountdownTimer';
import LiveChat from '../components/LiveChat';
import Toast from '../components/Toast';
import { getSeasonalClass, getSeasonalEmoji, getSeasonalGreeting } from '../utils/seasonalTheme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  const [toast, setToast] = useState(null);
  const categorySectionRef = useRef(null);

  // Fix hydration error by only rendering random values on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchData = async () => {
    try {
      const [categoriesRes, productsRes, bannersRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/products?limit=8`),
        axios.get(`${API_URL}/banners`)
      ]);

      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data.categories);
      }
      if (productsRes.data.success) {
        setProducts(productsRes.data.data.products);
      }
      if (bannersRes.data.success) {
        setBanners(bannersRes.data.data.banners);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only calculate seasonal values on client to avoid hydration error
  const [seasonalClass, setSeasonalClass] = useState('');
  const [seasonalEmoji, setSeasonalEmoji] = useState('');
  const [seasonalGreeting, setSeasonalGreeting] = useState('');

  useEffect(() => {
    setSeasonalClass(getSeasonalClass());
    setSeasonalEmoji(getSeasonalEmoji());
    setSeasonalGreeting(getSeasonalGreeting());
  }, []);

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

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('auth_token');
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=/';
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

  return (
    <div className={`min-h-screen bg-[#fefae0] ${isMounted ? seasonalClass : ''}`}>
      <Head>
        <title>FshatiBio - Produkte BIO të Fshatit</title>
        <meta name="description" content="Platforma më e besueshme për produkte BIO të fshatit - Direkt nga fermerët tek ju" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* Banners Carousel */}
      {banners.length > 0 && (
        <section className="relative overflow-hidden shadow-[0_8px_30px_rgba(27,67,50,0.15)]">
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden">
            {banners.map((banner, index) => {
              // Check if this is a flash sale banner (contains "Oferta" or "Zbritje")
              const isFlashSale = banner.title.toLowerCase().includes('oferta') ||
                                  banner.title.toLowerCase().includes('zbritje');
              // Only calculate date on client to avoid hydration error
              const flashSaleEnd = isMounted ? (() => {
                const date = new Date();
                date.setDate(date.getDate() + 2); // 2 days from now
                return date;
              })() : null;

              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentBannerIndex
                      ? 'opacity-100 z-10 scale-100'
                      : 'opacity-0 z-0 scale-105'
                  }`}
                >
                  {banner.link_url ? (
                    <Link href={banner.link_url} className="block h-full group/banner" onClick={(e) => createConfetti(e.currentTarget)}>
                      <div className="relative h-full overflow-hidden">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover transform group-hover/banner:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/80 via-[#1b4332]/30 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/banner:translate-x-full transition-transform duration-1000"></div>

                        {banner.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white z-20">
                            <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 animate-fade-in">
                              {banner.title}
                            </h2>
                            {isFlashSale && (
                              <div className="mt-3">
                                <p className="text-xs sm:text-sm mb-1.5 text-[#fefae0]/90">Oferta përfundon në:</p>
                                {flashSaleEnd && (
                                  <CountdownTimer
                                    endDate={flashSaleEnd.toISOString()}
                                    className="text-xs sm:text-sm"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Navigation Icons - Left (Previous) */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                            createRipple(e.currentTarget, e);
                          }}
                          className="absolute top-1/2 left-4 sm:left-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 z-30 cursor-pointer"
                          aria-label="Previous banner"
                        >
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 hover:bg-white/30 transition-all duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Navigation Icons - Right (Next) */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
                            createRipple(e.currentTarget, e);
                          }}
                          className="absolute top-1/2 right-4 sm:right-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 z-30 cursor-pointer"
                          aria-label="Next banner"
                        >
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 hover:bg-white/30 transition-all duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative h-full group/banner overflow-hidden">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover transform group-hover/banner:scale-105 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/80 via-[#1b4332]/30 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/banner:translate-x-full transition-transform duration-1000"></div>

                      {banner.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white z-20">
                          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 animate-fade-in">
                            {banner.title}
                          </h2>
                          {isFlashSale && (
                            <div className="mt-3">
                              <p className="text-xs sm:text-sm mb-1.5 text-[#fefae0]/90">Oferta përfundon në:</p>
                              {flashSaleEnd && (
                                <CountdownTimer
                                  endDate={flashSaleEnd.toISOString()}
                                  className="text-xs sm:text-sm"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Navigation Icons - Left (Previous) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                          createRipple(e.currentTarget, e);
                        }}
                        className="absolute top-1/2 left-4 sm:left-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 z-30 cursor-pointer"
                        aria-label="Previous banner"
                      >
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 hover:bg-white/30 transition-all duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Navigation Icons - Right (Next) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
                          createRipple(e.currentTarget, e);
                        }}
                        className="absolute top-1/2 right-4 sm:right-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 z-30 cursor-pointer"
                        aria-label="Next banner"
                      >
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 hover:bg-white/30 transition-all duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Carousel Indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2 items-center">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      setCurrentBannerIndex(index);
                      createRipple(e.currentTarget, e);
                      createConfetti(e.currentTarget);
                    }}
                    className={`relative rounded-full transition-all duration-500 ${
                      index === currentBannerIndex
                        ? 'bg-[#f4a261] w-8 h-2.5 shadow-lg'
                        : 'bg-white/60 hover:bg-white/90 w-2.5 h-2.5'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2d6a4f] via-[#40916c] to-[#1b4332] text-white py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Organic background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-12 w-80 h-80 bg-[#52b788]/30 blur-3xl rounded-full"></div>
          <div className="absolute top-10 right-0 w-64 h-64 bg-[#74c69d]/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-64 bg-[#1b4332]/40 blur-3xl rounded-full"></div>
        </div>

        {/* Floating leaf decorations */}
        {isMounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => {
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 4;
              return (
                <svg
                  key={i}
                  className="absolute w-5 h-5 text-white/10 animate-float"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                  }}
                >
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                </svg>
              );
            })}
          </div>
        )}

        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10">
            {/* Left column */}
            <div className="text-center lg:text-left w-full lg:w-1/2 space-y-4 sm:space-y-5">
              {isMounted && (
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs sm:text-sm">
                  <span className="text-lg sm:text-xl">{seasonalEmoji}</span>
                  <span className="font-semibold">{seasonalGreeting}</span>
                  <span className="text-white/70 text-[10px] sm:text-xs hidden sm:inline">• Sezoni i saborshëm</span>
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#fefae0]">
                Produkte BIO{' '}
                <span className="text-[#f4a261] relative inline-block">
                  të Freskëta
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#f4a261]/40 blur-sm rounded-full"></span>
                </span>
                <br />drejt në shtëpinë tënde
              </h1>

              <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-2xl mx-auto lg:mx-0">
                Bëje tavolinën të valezojë me aromat e fshatit — zgjedh produkte të çertifikuara BIO,
                të mbledhura çdo mëngjes nga fermerët e besuar shqiptarë.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                {['100% BIO të certifikuara', 'Dorëzim në 24h', 'Fermerë lokalë'].map((text, idx) => (
                  <span
                    key={text}
                    className="px-3 sm:px-4 py-1.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm text-xs sm:text-sm flex items-center gap-1.5 font-medium"
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    <svg className="w-3.5 h-3.5 text-[#74c69d] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden xs:inline">{text}</span>
                    <span className="xs:hidden">{text.split(' ')[0]}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
                <Link
                  href="/products"
                  onClick={(e) => createConfetti(e.currentTarget)}
                  className="relative inline-flex items-center gap-2 sm:gap-3 bg-white text-[#2d6a4f] px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full font-bold text-sm sm:text-base shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:scale-105 transition-all overflow-hidden group w-full sm:w-auto justify-center"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <span className="relative z-10 font-semibold">Shiko Produktet</span>
                  <svg className="relative z-10 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/about"
                  onClick={(e) => createConfetti(e.currentTarget)}
                  className="group relative inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full border-2 border-white/40 text-white/90 hover:text-white hover:border-white transition-all bg-white/5 hover:bg-white/10 backdrop-blur-sm font-semibold text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <span className="relative z-10">Mëso më shumë</span>
                  <svg className="w-4 h-4 text-[#74c69d] group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                  </svg>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                {[
                  { value: '150+', label: 'Fermerë të përfshirë' },
                  { value: '4.9/5', label: 'Mesatarja e vlerësimeve' },
                  { value: '12K+', label: 'Porosi të dorëzuara' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white/10 rounded-2xl p-2.5 sm:p-3 text-center border border-white/15 backdrop-blur-sm">
                    <div className="font-display text-lg sm:text-xl md:text-2xl font-bold text-[#f4a261]">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 leading-tight mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column image card */}
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-8 -right-4 w-20 h-20 bg-[#f4a261]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>

                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-white/70 font-medium">Sezoni i</p>
                        <p className="font-display text-xl sm:text-2xl font-bold text-[#f4a261]">Vjeshtës së Ngrohtë</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#f4a261]/20 border border-[#f4a261]/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#f4a261] animate-leaf-sway" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Djathë Artizanal', 'Qumësht i Freskët', 'Mish BIO', 'Vezë Fshati'].map((product) => (
                        <div key={product} className="p-3 rounded-2xl bg-white/10 border border-white/15 text-sm font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#74c69d] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                          </svg>
                          {product}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center rounded-2xl p-3 border border-white/15 bg-white/5 text-sm font-medium text-white/80 gap-2">
                      <svg className="w-4 h-4 text-[#74c69d]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Produktet e listuara janë certifikuar 100% BIO
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="wave-divider -mt-1 leading-none">
        <svg viewBox="0 0 1200 56" preserveAspectRatio="none" fill="#fefae0" className="w-full block" style={{ height: '56px' }}>
          <path d="M0,28 C300,56 900,0 1200,28 L1200,56 L0,56 Z"/>
        </svg>
      </div>

      {/* Stats bar */}
      <section className="bg-white py-8 sm:py-10 border-b border-[#d8f3dc]">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto">
            {[
              { value: '150+', label: 'Fermerë Partnerë', icon: (
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )},
              { value: '4.9★', label: 'Vlerësim Mesatar', icon: (
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#f4a261]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )},
              { value: '12K+', label: 'Porosi të Dorëzuara', icon: (
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            ].map(stat => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#f0faf2] mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[#1b4332]">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#52b788] font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section ref={categorySectionRef} className="relative py-12 sm:py-16 md:py-20 overflow-hidden bg-[#fefae0]">
        {/* Decorative leaf */}
        <div className="absolute top-8 right-8 opacity-10">
          <svg className="w-24 h-24 text-[#2d6a4f]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-14">
            <div className="inline-flex items-center gap-2 bg-[#d8f3dc] text-[#2d6a4f] text-xs font-bold px-4 py-1.5 rounded-full border border-[#b7e4c7] mb-4">
              <svg className="w-4 h-4 animate-leaf-sway" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
              Koleksioni BIO
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#1b4332] mb-3 sm:mb-4">
              Kategoritë
            </h2>
            <p className="text-[#52b788] text-sm sm:text-base md:text-lg font-medium max-w-xl mx-auto">
              Zgjidh nga kategoritë tona të gjerë të produkteve organike
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 md:py-20">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#2d6a4f] border-t-transparent"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {categories.map((category, index) => {
                // Get emoji for category
                const getEmoji = (name) => {
                  const emojiMap = {
                    'Qumësht': '🥛',
                    'Djathë': '🧀',
                    'Vezë': '🥚',
                    'Zogj Fshati': '🐔',
                    'Mish Viçi': '🐄',
                    'Mish Qengji': '🐑',
                    'Gjalpë & Kos': '🧈'
                  };
                  return emojiMap[name] || '🌾';
                };

                // Get nature-inspired gradient colors for each category
                const getGradient = (name) => {
                  const gradients = {
                    'Qumësht': 'from-[#caf0f8] to-[#90e0ef]',
                    'Djathë': 'from-[#fff3cd] to-[#ffc107]',
                    'Vezë': 'from-[#fff0d3] to-[#f4a261]',
                    'Zogj Fshati': 'from-[#fce4ec] to-[#f48fb1]',
                    'Mish Viçi': 'from-[#ffe0b2] to-[#e76f51]',
                    'Mish Qengji': 'from-[#fce4ec] to-[#ef9a9a]',
                    'Gjalpë & Kos': 'from-[#fff9c4] to-[#f9a825]'
                  };
                  return gradients[name] || 'from-[#d8f3dc] to-[#52b788]';
                };

                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(45,106,79,0.08)] hover:shadow-[0_8px_30px_rgba(45,106,79,0.18)] border border-[#d8f3dc] overflow-hidden transition-all duration-300 hover:-translate-y-1">
                      {/* Category icon background */}
                      <div className={`h-24 sm:h-28 md:h-32 bg-gradient-to-br ${getGradient(category.name)} flex items-center justify-center relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="text-4xl sm:text-5xl transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-md">
                          {getEmoji(category.name)}
                        </span>
                      </div>

                      {/* Category name */}
                      <div className="p-3 sm:p-4 text-center">
                        <h3 className="font-semibold text-sm sm:text-base text-[#1b4332] group-hover:text-[#2d6a4f] transition-colors duration-300 line-clamp-2 leading-tight">
                          {category.name}
                        </h3>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-[#52b788] font-semibold">
                            Shiko
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Wave divider into white products section */}
      <div className="-mb-1 leading-none bg-[#fefae0]">
        <svg viewBox="0 0 1200 56" preserveAspectRatio="none" fill="white" className="w-full block" style={{ height: '40px' }}>
          <path d="M0,56 C300,20 900,40 1200,10 L1200,56 L0,56 Z"/>
        </svg>
      </div>

      {/* Featured Products */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden bg-white">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-14">
            <div className="inline-flex items-center gap-2 bg-[#fff3e0] text-[#e76f51] text-xs font-bold px-4 py-1.5 rounded-full border border-[#f4a261]/30 mb-4">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Të Rekomanduara
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#1b4332] mb-3 sm:mb-4">
              Produktet e Rekomanduara
            </h2>
            <p className="text-[#52b788] text-sm sm:text-base md:text-lg font-medium max-w-xl mx-auto">
              Produktet më të kërkuara nga klientët tanë
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(45,106,79,0.08)] border border-[#d8f3dc] overflow-hidden animate-pulse">
                  <div className="w-full h-48 sm:h-56 bg-[#d8f3dc]/60"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-[#d8f3dc]/60 rounded-xl w-3/4"></div>
                    <div className="h-6 bg-[#d8f3dc]/60 rounded-xl w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="group relative product-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={(e) => {
                    // Create ripple effect
                    createRipple(e.currentTarget, e);
                  }}
                >
                  <div className="relative h-full bg-white rounded-3xl shadow-[0_4px_20px_rgba(45,106,79,0.08)] hover:shadow-[0_12px_40px_rgba(45,106,79,0.18)] border border-[#d8f3dc] overflow-hidden transition-all duration-300 group-hover:-translate-y-1">

                    {/* Image Container */}
                    <div className="relative overflow-hidden h-40 sm:h-48 md:h-52 bg-[#f0faf2]">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <>
                          <img
                            src={product.image_urls[0]}
                            alt={product.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7] flex items-center justify-center">
                          <svg className="w-16 h-16 text-[#52b788] group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                          </svg>
                        </div>
                      )}

                      {/* BIO Badge */}
                      {product.is_bio && (
                        <div className="absolute top-3 right-3 z-20">
                          <span className="bg-[#d8f3dc] text-[#2d6a4f] text-xs font-bold px-2.5 py-1 rounded-full border border-[#b7e4c7] shadow-sm">
                            BIO
                          </span>
                        </div>
                      )}

                      {/* Stock Status */}
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-[#1b4332]/60 backdrop-blur-sm flex items-center justify-center z-30">
                          <div className="bg-white text-[#e76f51] px-4 py-2 rounded-2xl font-bold text-sm shadow-lg border border-[#fce4ec]">
                            Jashtë Stokut
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      {/* Product Name */}
                      <h3 className="font-semibold text-sm sm:text-base text-[#1b4332] group-hover:text-[#2d6a4f] transition-colors duration-300 line-clamp-2 mb-2 sm:mb-3 leading-snug">
                        {product.name}
                      </h3>

                      {/* Price and Rating */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-display text-xl sm:text-2xl font-bold text-[#2d6a4f]">
                            {product.price} <span className="text-base font-semibold">L</span>
                          </p>
                          <p className="text-[#52b788] text-[10px] sm:text-xs font-medium">
                            / {product.unit}
                          </p>
                        </div>

                        {/* Rating */}
                        {product.average_rating > 0 && (
                          <div className="flex items-center gap-1 bg-[#fff9e6] px-2.5 py-1 rounded-full border border-[#f4a261]/30">
                            <svg className="w-3.5 h-3.5 text-[#f4a261]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[10px] sm:text-xs font-bold text-[#1b4332]">
                              {product.average_rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 border-2 border-[#2d6a4f] text-[#2d6a4f] px-2 sm:px-3 py-2 rounded-full hover:bg-[#d8f3dc] transition-all text-xs sm:text-sm font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="hidden sm:inline">Detajet</span>
                          <span className="sm:hidden">Detaje</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(product.id, e)}
                          disabled={addingToCart[product.id] || product.stock_quantity === 0}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-[#2d6a4f] text-white px-2 sm:px-3 py-2 rounded-full hover:bg-[#1b4332] transition-all shadow-[0_4px_14px_rgba(45,106,79,0.25)] hover:shadow-[0_6px_20px_rgba(45,106,79,0.35)] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold"
                        >
                          {addingToCart[product.id] ? (
                            <>
                              <span className="hidden sm:inline">Duke shtuar...</span>
                              <span className="sm:hidden">...</span>
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="hidden sm:inline">Shto</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-12 md:mt-14">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 sm:gap-3 bg-[#2d6a4f] text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-[#1b4332] transition-all shadow-[0_8px_30px_rgba(45,106,79,0.3)] hover:shadow-[0_12px_40px_rgba(45,106,79,0.4)] hover:scale-105"
            >
              <span>Shiko Të Gjitha Produktet</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[#1b4332] text-[#fefae0] py-10 md:py-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#52b788]/40 to-transparent"></div>
        <div className="absolute -top-20 right-0 w-64 h-64 bg-[#2d6a4f]/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#40916c]/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Subtle floating leaves */}
        {isMounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => {
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 3;
              const duration = 3 + Math.random() * 2;
              return (
                <svg
                  key={i}
                  className="absolute w-4 h-4 text-[#52b788]/20 animate-float"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`
                  }}
                >
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                </svg>
              );
            })}
          </div>
        )}

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Column 1: Logo + Social Media */}
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-8 h-8 bg-[#2d6a4f] rounded-xl flex items-center justify-center border border-[#52b788]/30">
                  <svg className="w-4 h-4 text-[#fefae0]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                  </svg>
                </div>
                <h3 className="font-display text-lg font-bold text-[#fefae0]">FshatiBio</h3>
              </div>
              <p className="text-[#74c69d] text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Platforma më e besueshme për produkte BIO
              </p>

              {/* Social Media Icons */}
              <div className="flex gap-2">
                {[
                  { label: 'Facebook', href: '#', icon: (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                    </svg>
                  )},
                  { label: 'Instagram', href: '#', icon: (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  )},
                  { label: 'Twitter', href: '#', icon: (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  )}
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-8 h-8 rounded-xl bg-[#2d6a4f] flex items-center justify-center text-[#74c69d] hover:bg-[#40916c] hover:text-[#fefae0] transition-all duration-300 border border-[#52b788]/20 hover:scale-110"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm text-[#74c69d] uppercase tracking-wider">
                Linqe të Shpejta
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-[#74c69d]">
                {[
                  { href: '/products', label: 'Produktet' },
                  { href: '/cart', label: 'Shporta' },
                  { href: '/orders', label: 'Porositë' },
                  { href: '/profile', label: 'Profili' }
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 hover:text-[#fefae0] transition-colors duration-300"
                    >
                      <svg className="w-3 h-3 text-[#52b788] group-hover:translate-x-0.5 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                      </svg>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm text-[#74c69d] uppercase tracking-wider">
                Kontakt
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-[#74c69d]">
                <p>
                  <a
                    href="tel:+35569XXXXXXX"
                    className="flex items-center gap-2 hover:text-[#fefae0] transition-colors duration-300 group"
                  >
                    <svg className="w-3.5 h-3.5 text-[#52b788] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    +355 69 XXX XXXX
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:info@fshatibio.com"
                    className="flex items-center gap-2 hover:text-[#fefae0] transition-colors duration-300 group break-all"
                  >
                    <svg className="w-3.5 h-3.5 text-[#52b788] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    info@fshatibio.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-[#2d6a4f] mt-8 sm:mt-10 pt-5 sm:pt-6 text-center">
            <p className="text-[#52b788] text-xs sm:text-sm">
              &copy; 2025 FshatiBio. Të gjitha të drejtat e rezervuara.
            </p>
          </div>
        </div>
      </footer>

      {/* Live Chat */}
      <LiveChat />

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
