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
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-white ${isMounted ? seasonalClass : ''}`}>
      <Head>
        <title>FshatiBio - Produkte BIO të Fshatit</title>
        <meta name="description" content="Platforma më e besueshme për produkte BIO të fshatit - Direkt nga fermerët tek ju" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* Banners Carousel - Ultra WOW Design */}
      {banners.length > 0 && (
        <section className="relative overflow-hidden rounded-b-3xl shadow-2xl">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 animate-gradient-shift z-0"></div>
          
          {/* Floating Particles */}
          {isMounted && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
              {[...Array(15)].map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = Math.random() * 4;
                const duration = 3 + Math.random() * 3;
                return (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-float"
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
          
          {/* Sparkle Effects */}
          {isMounted && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
              {[...Array(8)].map((_, i) => {
                const left = 20 + Math.random() * 60;
                const top = 20 + Math.random() * 60;
                const delay = Math.random() * 2;
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 animate-sparkle"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      animationDelay: `${delay}s`
                    }}
                  >
                    <div className="w-full h-full bg-white rounded-full"></div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden rounded-b-3xl">
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
                      <div className="relative h-full overflow-hidden perspective-1000">
                        {/* Image with 3D Zoom Effect */}
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover transform group-hover/banner:scale-110 group-hover/banner:rotate-1 transition-all duration-700"
                        />
                        
                        {/* Animated Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 via-emerald-600/20 to-transparent opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Multiple Shine Effects */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover/banner:translate-x-full transition-transform duration-1000"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/banner:opacity-100 transition-opacity duration-700"></div>
                        
                        {/* Glow Border Effect */}
                        <div className="absolute inset-0 border-4 border-white/0 group-hover/banner:border-white/20 transition-all duration-500 rounded-b-3xl"></div>
                        
                        {/* Pulse Rings */}
                        <div className="absolute inset-0 rounded-b-3xl border-2 border-white/0 group-hover/banner:border-white/10 animate-pulse-ring scale-110 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500"></div>
                        
                        {banner.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white z-20">
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-2 animate-fade-in relative inline-block group/title transform group-hover/banner:translate-y-[-4px] transition-transform duration-500">
                              {/* Multiple Glow Layers */}
                              <span className="relative z-10 block">{banner.title}</span>
                              <span className="absolute inset-0 text-white blur-xl opacity-60 group-hover/title:opacity-100 transition-opacity duration-300">
                              {banner.title}
                              </span>
                              <span className="absolute inset-0 text-green-300 blur-2xl opacity-0 group-hover/title:opacity-40 transition-opacity duration-500">
                                {banner.title}
                              </span>
                              {/* Animated Underline */}
                              <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 transform scale-x-0 group-hover/title:scale-x-100 transition-transform duration-700 rounded-full"></span>
                            </h2>
                            {isFlashSale && (
                              <div className="mt-3 group/flash">
                                <p className="text-xs sm:text-sm mb-1.5 opacity-90">Oferta përfundon në:</p>
                                <div className="relative inline-block">
                                  <div className="absolute inset-0 bg-green-400 blur-lg opacity-0 group-hover/flash:opacity-50 animate-pulse"></div>
                                {flashSaleEnd && (
                                  <CountdownTimer 
                                    endDate={flashSaleEnd.toISOString()} 
                                    className="text-xs sm:text-sm relative z-10"
                                  />
                                )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Enhanced Corner Accents */}
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-3 border-r-3 border-white/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-500 rounded-tr-2xl transform group-hover/banner:scale-110 group-hover/banner:rotate-12">
                          <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-3 border-l-3 border-white/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-500 rounded-bl-2xl transform group-hover/banner:scale-110 group-hover/banner:-rotate-12">
                          <div className="absolute bottom-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                        
                        {/* Navigation Icons - Left (Previous) */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                            createRipple(e.currentTarget, e);
                          }}
                          className="absolute top-1/2 left-4 sm:left-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-700 transform group-hover/banner:translate-x-0 -translate-x-4 z-30 cursor-pointer"
                          aria-label="Previous banner"
                        >
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 group/icon">
                            <span className="text-2xl transform group-hover/icon:scale-125 group-hover/icon:rotate-12 transition-all duration-300">✨</span>
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
                          className="absolute top-1/2 right-4 sm:right-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-700 transform group-hover/banner:translate-x-0 translate-x-4 z-30 cursor-pointer"
                          aria-label="Next banner"
                        >
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 group/icon">
                            <span className="text-2xl transform group-hover/icon:scale-125 group-hover/icon:rotate-12 transition-all duration-300">⭐</span>
                          </div>
                        </button>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative h-full group/banner overflow-hidden perspective-1000">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover transform group-hover/banner:scale-110 group-hover/banner:rotate-1 transition-all duration-700"
                      />
                      
                      {/* Animated Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 via-emerald-600/20 to-transparent opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Multiple Shine Effects */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover/banner:translate-x-full transition-transform duration-1000"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/banner:opacity-100 transition-opacity duration-700"></div>
                      
                      {/* Glow Border Effect */}
                      <div className="absolute inset-0 border-4 border-white/0 group-hover/banner:border-white/20 transition-all duration-500 rounded-b-3xl"></div>
                      
                      {/* Pulse Rings */}
                      <div className="absolute inset-0 rounded-b-3xl border-2 border-white/0 group-hover/banner:border-white/10 animate-pulse-ring scale-110 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500"></div>
                      
                      {banner.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white z-20">
                          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-2 animate-fade-in relative inline-block group/title transform group-hover/banner:translate-y-[-4px] transition-transform duration-500">
                            {/* Multiple Glow Layers */}
                            <span className="relative z-10 block">{banner.title}</span>
                            <span className="absolute inset-0 text-white blur-xl opacity-60 group-hover/title:opacity-100 transition-opacity duration-300">
                            {banner.title}
                            </span>
                            <span className="absolute inset-0 text-green-300 blur-2xl opacity-0 group-hover/title:opacity-40 transition-opacity duration-500">
                              {banner.title}
                            </span>
                            {/* Animated Underline */}
                            <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 transform scale-x-0 group-hover/title:scale-x-100 transition-transform duration-700 rounded-full"></span>
                          </h2>
                          {isFlashSale && (
                            <div className="mt-3 group/flash">
                              <p className="text-xs sm:text-sm mb-1.5 opacity-90">Oferta përfundon në:</p>
                              <div className="relative inline-block">
                                <div className="absolute inset-0 bg-green-400 blur-lg opacity-0 group-hover/flash:opacity-50 animate-pulse"></div>
                              {flashSaleEnd && (
                                <CountdownTimer 
                                  endDate={flashSaleEnd.toISOString()} 
                                  className="text-xs sm:text-sm relative z-10"
                                />
                              )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Enhanced Corner Accents */}
                      <div className="absolute top-4 right-4 w-16 h-16 border-t-3 border-r-3 border-white/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-500 rounded-tr-2xl transform group-hover/banner:scale-110 group-hover/banner:rotate-12">
                        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-3 border-l-3 border-white/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-500 rounded-bl-2xl transform group-hover/banner:scale-110 group-hover/banner:-rotate-12">
                        <div className="absolute bottom-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Navigation Icons - Left (Previous) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                          createRipple(e.currentTarget, e);
                        }}
                        className="absolute top-1/2 left-4 sm:left-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-700 transform group-hover/banner:translate-x-0 -translate-x-4 z-30 cursor-pointer"
                        aria-label="Previous banner"
                      >
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 group/icon">
                          <span className="text-2xl transform group-hover/icon:scale-125 group-hover/icon:rotate-12 transition-all duration-300">✨</span>
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
                        className="absolute top-1/2 right-4 sm:right-8 transform -translate-y-1/2 opacity-0 group-hover/banner:opacity-100 transition-all duration-700 transform group-hover/banner:translate-x-0 translate-x-4 z-30 cursor-pointer"
                        aria-label="Next banner"
                      >
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 group/icon">
                          <span className="text-2xl transform group-hover/icon:scale-125 group-hover/icon:rotate-12 transition-all duration-300">⭐</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Ultra Enhanced Carousel Indicators */}
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
                    className={`relative rounded-full transition-all duration-500 transform hover:scale-150 group/indicator ${
                      index === currentBannerIndex
                        ? 'bg-white w-10 h-3 shadow-2xl'
                        : 'bg-white/50 hover:bg-white/90 w-3 h-3'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  >
                    {index === currentBannerIndex && (
                      <>
                        <div className="absolute inset-0 bg-white rounded-full animate-pulse opacity-60"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-30 animate-pulse"></div>
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50 animate-pulse"></div>
                      </>
                    )}
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-0 group-hover/indicator:opacity-50 transition-opacity duration-300"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Enhanced Bottom Glow Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/20 via-white/10 to-transparent pointer-events-none"></div>
          
          {/* Top Glow Effect */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-green-400/10 to-transparent pointer-events-none"></div>
          
          {/* Side Glow Effects */}
          <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-green-400/5 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-emerald-400/5 to-transparent pointer-events-none"></div>
        </section>
      )}

      {/* Hero Section - Ultra Wow */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-700 text-white py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Glow layers */}
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-8 w-72 h-72 bg-emerald-400/40 blur-3xl rounded-full animate-pulse"></div>
          <div className="absolute top-10 right-0 w-60 h-60 bg-green-300/30 blur-3xl rounded-full animate-[pulse_6s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-300/20 blur-[140px] rounded-full"></div>
        </div>

        {/* floating icons */}
        {isMounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => {
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 4;
              return (
                <span
                  key={i}
                  className="absolute text-white/20 text-lg sm:text-xl animate-float"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                  }}
                >
                  {['🌾','✨','🥕','🍃','🌱'][i % 5]}
                </span>
              );
            })}
          </div>
        )}

        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10">
            {/* Left column */}
            <div className="text-center lg:text-left w-full lg:w-1/2 space-y-3 sm:space-y-4">
              {isMounted && (
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs sm:text-sm md:text-base">
                  <span className="text-lg sm:text-xl">{seasonalEmoji}</span>
                  <span className="font-semibold">{seasonalGreeting}</span>
                  <span className="text-white/70 text-[10px] sm:text-xs md:text-sm hidden sm:inline">• Sezoni i saborshëm</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight">
                Produkte BIO <span className="text-amber-200 relative inline-block">
                  të Freskëta
                  <span className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-1 sm:h-2 bg-amber-400/70 blur-sm rounded-full"></span>
                </span><br />drejt në shtëpinë tënde
              </h1>

              <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0">
                Bëje tavolinën të valezojë me aromat e fshatit — zgjedh produkte të çertifikuara BIO,
                të mbledhura çdo mëngjes nga fermerët e besuar shqiptarë.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                {['100% BIO të certifikuara','Dorëzim në 24h','Fermerë lokalë'].map((text, idx)=>(
                  <span
                    key={text}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                    style={{animationDelay:`${idx*0.15}s`}}
                  >
                    <span className="text-base sm:text-lg">✅</span>
                    <span className="hidden xs:inline">{text}</span>
                    <span className="xs:hidden">{text.split(' ')[0]}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  href="/products"
                  onClick={(e)=>createConfetti(e.currentTarget)}
                  className="relative inline-flex items-center gap-2 sm:gap-3 bg-white text-emerald-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base md:text-lg shadow-2xl hover:scale-105 transition-transform overflow-hidden group w-full sm:w-auto justify-center"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <span className="relative z-10">Shiko Produktet</span>
                  <span className="relative z-10 text-xl sm:text-2xl">→</span>
                </Link>
                <Link
                  href="/about"
                  onClick={(e) => createConfetti(e.currentTarget)}
                  className="group relative inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border-2 border-white/40 text-white/90 hover:text-white hover:border-white transition-all overflow-hidden bg-white/5 hover:bg-white/10 backdrop-blur-sm font-bold text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <span className="relative z-10">Mëso më shumë</span>
                  <span className="relative z-10 text-lg sm:text-xl transform group-hover:rotate-12 transition-transform">🌱</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4">
                {[
                  {value:'150+',label:'Fermerë të përfshirë'},
                  {value:'4.9/5',label:'Mesatarja e vlerësimeve'},
                  {value:'12K+',label:'Porosi të dorëzuara'}
                ].map(stat=>(
                  <div key={stat.label} className="bg-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-white/10">
                    <div className="text-lg sm:text-xl md:text-2xl font-black">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column image card */}
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-8 -right-4 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 bg-white/10 rounded-full blur-2xl"></div>

                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-[32px] p-4 sm:p-5 md:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-white/70">Sezoni i</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-amber-200">Vjeshtës së Ngrohtë</p>
                      </div>
                      <span className="text-4xl">🍂</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Djathë Artizanal','Qumësht i Freskët','Mish BIO','Vezë Fshati'].map((product)=>(
                        <div key={product} className="p-3 rounded-2xl bg-white/10 border border-white/10 text-sm font-semibold flex items-center gap-2">
                          <span className="text-xl">✨</span>{product}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center rounded-2xl p-4 border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
                      Produktet e listuara janë certifikuar 100% BIO ✔
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Ultra Modern Design */}
      <section ref={categorySectionRef} className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden bg-white">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* Header with Glow Effect */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20 relative">
            <div className="inline-block mb-4 sm:mb-6 relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <span className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl animate-bounce block">✨</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4 md:mb-6 relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent animate-gradient-shift">
                Kategoritë
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent blur-xl opacity-50 animate-pulse">
                Kategoritë
              </span>
            </h2>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl px-3 sm:px-4 font-semibold relative">
              <span className="relative z-10">Zgjidh nga kategoritë tona të gjerë</span>
              <span className="absolute inset-0 text-green-400 blur-sm opacity-30">Zgjidh nga kategoritë tona të gjerë</span>
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-16 md:py-20">
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl animate-pulse"></div>
                <div className="relative animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-green-600 border-t-transparent"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
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

                // Get vibrant gradient colors for each category
                const getGradient = (name) => {
                  const gradients = {
                    'Qumësht': 'from-blue-400 via-cyan-300 to-blue-500',
                    'Djathë': 'from-yellow-400 via-amber-300 to-orange-400',
                    'Vezë': 'from-amber-400 via-yellow-300 to-orange-300',
                    'Zogj Fshati': 'from-red-400 via-pink-300 to-rose-400',
                    'Mish Viçi': 'from-amber-600 via-orange-400 to-red-500',
                    'Mish Qengji': 'from-pink-400 via-rose-300 to-red-400',
                    'Gjalpë & Kos': 'from-yellow-300 via-amber-200 to-orange-300'
                  };
                  return gradients[name] || 'from-green-400 via-emerald-300 to-teal-400';
                };

                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="group relative perspective-1000"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* 3D Card Container */}
                    <div className="relative h-full transform-style-preserve-3d transition-all duration-700 group-hover:rotate-y-12">
                      {/* Front of Card - Glassmorphism */}
                      <div className="relative h-full bg-white/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden transform translate-z-0 group-hover:translate-z-20 transition-all duration-700">
                        {/* Animated Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(category.name)} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                        
                        {/* Glassmorphism Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Sparkle Particles */}
                        {isMounted && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            {[...Array(8)].map((_, i) => {
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
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10 text-center h-full flex flex-col items-center justify-center">
                          {/* Icon Container with 3D Effect */}
                          <div className="relative mb-4 sm:mb-6 md:mb-8 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                            {/* Icon Background */}
                            <div className="relative inline-block p-3 sm:p-4 md:p-5 lg:p-7 bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-md rounded-full shadow-2xl border-2 border-white/50 transition-all duration-500">
                              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl block transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 filter drop-shadow-2xl">
                                {getEmoji(category.name)}
                              </span>
                            </div>
                            
                          </div>
                          
                          {/* Category Name with Glow */}
                          <h3 className="font-black text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-800 group-hover:text-white transition-colors duration-500 relative mb-2 sm:mb-3 md:mb-4 group-hover:neon-glow line-clamp-2">
                            <span className="relative z-10 drop-shadow-lg group-hover:text-green-300">{category.name}</span>
                            <span className="absolute inset-0 text-green-400 blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-500 animate-pulse">
                              {category.name}
                            </span>
                          </h3>
                          
                          {/* Arrow with Animation */}
                          <div className="mt-2 sm:mt-3 md:mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-white/50">
                              <span className="text-green-600 text-base sm:text-lg md:text-xl font-bold transform group-hover:translate-x-2 transition-transform duration-300">→</span>
                              <span className="text-xs sm:text-sm font-bold text-gray-700">Shiko</span>
                            </div>
                          </div>
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

      {/* Featured Products - Ultra Modern Design */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden bg-white">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* Header with Glow Effect */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20 relative">
            <div className="inline-block mb-4 sm:mb-6 relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <span className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl animate-bounce block">⭐</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4 md:mb-6 relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent animate-gradient-shift">
                Produktet e Rekomanduara
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent blur-xl opacity-50 animate-pulse">
                Produktet e Rekomanduara
              </span>
            </h2>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl px-3 sm:px-4 font-semibold relative">
              <span className="relative z-10">Produktet më të kërkuara nga klientët tanë</span>
              <span className="absolute inset-0 text-green-400 blur-sm opacity-30">Produktet më të kërkuara nga klientët tanë</span>
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
                  <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 animate-shimmer"></div>
                  <div className="p-3 sm:p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="group relative perspective-1000 product-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={(e) => {
                    // Create ripple effect
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
                      
                      {/* Image Container */}
                      <div className="relative overflow-hidden h-40 sm:h-48 md:h-56 lg:h-64">
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
                      </div>
                      
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
                            <span className="transform group-hover:translate-x-1 transition-transform duration-300 text-sm sm:text-base">→</span>
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
          <div className="text-center mt-8 sm:mt-12 md:mt-16 relative">
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <Link
                href="/products"
                className="relative inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-5 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 md:py-4 lg:py-5 rounded-full font-black text-sm sm:text-base md:text-lg lg:text-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all transform hover:scale-110 hover:shadow-2xl border-2 border-white/30 shadow-xl"
              >
                <span className="hidden sm:inline">Shiko Të Gjitha Produktet</span>
                <span className="sm:hidden">Shiko Të Gjitha</span>
                <span className="text-lg sm:text-xl md:text-2xl transform group-hover:translate-x-2 transition-transform duration-300">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
