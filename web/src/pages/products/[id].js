import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isVisible, setIsVisible] = useState({});
  const [scrollY, setScrollY] = useState(0);
  const productInfoRef = useRef(null);
  const reviewsRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      checkWishlist();
    }
  }, [id]);

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

    if (productInfoRef.current) {
      observer.observe(productInfoRef.current);
    }
    if (reviewsRef.current) {
      observer.observe(reviewsRef.current);
    }

    return () => {
      if (productInfoRef.current) {
        observer.unobserve(productInfoRef.current);
      }
      if (reviewsRef.current) {
        observer.unobserve(reviewsRef.current);
      }
    };
  }, [product, reviews]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${id}`);
      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setReviewStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkWishlist = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/wishlist/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setInWishlist(response.data.data.in_wishlist);
      }
    } catch (error) {
      // Silent fail - user might not be logged in
    }
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/products/' + id);
      return;
    }

    setCheckingWishlist(true);
    try {
      if (inWishlist) {
        await axios.delete(`${API_URL}/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInWishlist(false);
        alert('Produkti u hoq nga lista e dëshirave');
      } else {
        await axios.post(
          `${API_URL}/wishlist`,
          { product_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInWishlist(true);
        alert('Produkti u shtua në listën e dëshirave');
      }
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    } finally {
      setCheckingWishlist(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/products/' + id);
      return;
    }

    setAdding(true);
    try {
      await axios.post(
        `${API_URL}/cart/add`,
        { product_id: id, quantity },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Produkti u shtua në shportë!');
      router.push('/cart');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në shtimin e produktit');
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/products/' + id);
      return;
    }

    if (!reviewForm.comment || reviewForm.comment.length < 10) {
      alert('Komenti duhet të jetë të paktën 10 karaktere');
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(
        `${API_URL}/reviews`,
        {
          product_id: id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Vlerësimi u shtua me sukses!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në shtimin e vlerësimit');
    } finally {
      setSubmittingReview(false);
    }
  };

  const createConfetti = (element) => {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = x + 'px';
      confetti.style.top = y + 'px';
      confetti.style.width = '8px';
      confetti.style.height = '8px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      
      const angle = (Math.PI * 2 * i) / 20;
      const velocity = 3 + Math.random() * 2;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      document.body.appendChild(confetti);
      
      let posX = x;
      let posY = y;
      let opacity = 1;
      
      const animate = () => {
        posX += vx;
        posY += vy + 0.5;
        opacity -= 0.02;
        
        confetti.style.left = posX + 'px';
        confetti.style.top = posY + 'px';
        confetti.style.opacity = opacity;
        
        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          confetti.remove();
        }
      };
      
      requestAnimationFrame(animate);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer transform hover:scale-125 transition-transform duration-200' : ''}`}
            disabled={!interactive}
          >
            <span className={`text-2xl ${star <= rating ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-300'}`}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 animate-bounce">🛍️</div>
          <div className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
            Duke ngarkuar...
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-blob"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 animate-bounce">❌</div>
          <div className="text-2xl font-black text-gray-800">
            Produkti nuk u gjet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-white relative overflow-hidden">
      <Head>
        <title>{product.name} - FshatiBio</title>
      </Head>

      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-green-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
              🥛 FshatiBio
            </Link>
            <nav className="flex gap-4">
              <Link href="/products" className="text-gray-700 hover:text-green-700 font-semibold transition-colors duration-300 relative group">
                Produktet
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-green-700 font-semibold transition-colors duration-300 relative group">
                Shporta
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 transform transition-all duration-500 hover:shadow-3xl">
          <div className="md:flex">
            {/* Product Image - Enhanced */}
            <div className="md:w-1/2 relative group overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Corner Accents */}
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-2xl transform group-hover:scale-110 z-10"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-2xl transform group-hover:scale-110 z-10"></div>
              
              {product.image_urls && product.image_urls.length > 0 ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="w-full h-96 md:h-[600px] object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-96 md:h-[600px] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative overflow-hidden">
                  <span className="text-gray-400 text-6xl animate-bounce">🖼️</span>
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                </div>
              )}
              
              {/* Floating Icons */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="text-3xl animate-float">✨</div>
              </div>
            </div>

            {/* Product Info - Ultra WOW */}
            <div id="product-info" ref={productInfoRef} className={`md:w-1/2 p-8 transform transition-all duration-1000 ${
              isVisible['product-info'] 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-10'
            }`}>
              <div className="flex items-start justify-between mb-4 relative">
                {/* Title Glow */}
                <div className="absolute -left-4 -top-4 w-full h-full bg-gradient-to-r from-green-400/20 to-emerald-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <h1 className="text-3xl md:text-4xl font-black relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group">
                  {product.name}
                  <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 group-hover:w-full transition-all duration-500"></span>
                </h1>
                
                <button
                  onClick={(e) => {
                    toggleWishlist();
                    if (!inWishlist) {
                      createConfetti(e.currentTarget);
                    }
                  }}
                  disabled={checkingWishlist}
                  className="relative text-4xl hover:scale-125 transition-all duration-300 disabled:opacity-50 transform hover:rotate-12 z-10"
                  title={inWishlist ? 'Hiq nga lista e dëshirave' : 'Shto në listën e dëshirave'}
                >
                  {inWishlist ? (
                    <>
                      <span className="absolute inset-0 text-red-500 blur-lg opacity-50 animate-pulse">❤️</span>
                      <span className="relative animate-heart-beat">❤️</span>
                    </>
                  ) : (
                    <span className="hover:scale-110 transition-transform duration-300">🤍</span>
                  )}
                </button>
              </div>
              
              {product.is_bio && (
                <div className="mb-4 relative inline-block group">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                  <span className="relative inline-block bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-black shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border-2 border-white/50">
                    <span className="flex items-center gap-2">
                      <span className="text-lg animate-spin-slow">✨</span>
                      <span>BIO Produkt</span>
                    </span>
                  </span>
                </div>
              )}

              <div className="mb-6 relative">
                {/* Price Glow */}
                <div className="absolute -left-4 -top-4 w-64 h-64 bg-green-400/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                
                <p className="text-5xl md:text-6xl font-black mb-2 relative z-10">
                  <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-shift">
                    {product.price} L
                  </span>
                  <span className="text-xl md:text-2xl text-gray-600 font-semibold"> / {product.unit}</span>
                </p>
                
                <p className="text-gray-700 font-semibold relative z-10">
                  Stok: {product.stock_quantity > 0 ? (
                    <span className="inline-flex items-center gap-2 text-green-600 font-black">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {product.stock_quantity} {product.unit}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-red-600 font-black">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      Nuk ka në stok
                    </span>
                  )}
                </p>
              </div>

              {product.description && (
                <div className="mb-6 relative p-4 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl border border-gray-200/50">
                  <h2 className="text-xl font-black mb-3 text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    Përshkrimi
                  </h2>
                  <p className="text-gray-700 leading-relaxed font-medium">{product.description}</p>
                </div>
              )}

              {product.origin && (
                <div className="mb-6 relative p-4 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-2xl border border-gray-200/50">
                  <p className="text-gray-700 font-medium flex items-center gap-2">
                    <span className="font-black text-gray-900 flex items-center gap-2">
                      <span className="text-xl">📍</span>
                      Origjina:
                    </span>
                    <span className="font-semibold">{product.origin}</span>
                  </p>
                </div>
              )}

              {product.freshness_period && (
                <div className="mb-6 relative p-4 bg-gradient-to-br from-gray-50 to-teal-50/30 rounded-2xl border border-gray-200/50">
                  <p className="text-gray-700 font-medium flex items-center gap-2">
                    <span className="font-black text-gray-900 flex items-center gap-2">
                      <span className="text-xl">⏰</span>
                      Afati i freskisë:
                    </span>
                    <span className="font-semibold">{product.freshness_period} ditë</span>
                  </p>
                </div>
              )}

              {/* Add to Cart - Enhanced */}
              <div className="border-t border-gray-200 pt-6 relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-teal-400/10 rounded-2xl blur-xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <label className="font-black text-gray-700">Sasia:</label>
                  <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 p-1 shadow-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-green-50 hover:text-green-600 font-black text-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={product.stock_quantity}
                      className="w-16 text-center font-black text-lg border-0 focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-green-50 hover:text-green-600 font-black text-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    handleAddToCart();
                    if (product.stock_quantity > 0) {
                      createConfetti(e.currentTarget);
                    }
                  }}
                  disabled={adding || product.stock_quantity === 0}
                  className="relative w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-4 rounded-xl font-black text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 overflow-hidden group"
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Pulse Ring */}
                  <div className="absolute inset-0 rounded-xl border-2 border-white/50 opacity-0 group-hover:opacity-100 animate-pulse-ring"></div>
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {adding ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Duke shtuar...</span>
                      </>
                    ) : product.stock_quantity > 0 ? (
                      <>
                        <span>🛒</span>
                        <span>Shto në Shportë</span>
                        <span className="transform group-hover:translate-x-2 transition-transform duration-300">→</span>
                      </>
                    ) : (
                      <span>Nuk ka në stok</span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section - Ultra WOW */}
        <div id="reviews-section" ref={reviewsRef} className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl mt-8 p-8 border border-white/50 transform transition-all duration-1000 ${
          isVisible['reviews-section'] 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex items-center justify-between mb-6 relative">
            {/* Title Glow */}
            <div className="absolute -left-4 -top-4 w-64 h-64 bg-green-400/10 rounded-full blur-3xl opacity-50"></div>
            
            <h2 className="text-3xl md:text-4xl font-black relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Vlerësimet dhe Komentet
            </h2>
            
            <button
              onClick={(e) => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                  router.push('/login?redirect=/products/' + id);
                  return;
                }
                setShowReviewForm(!showReviewForm);
                if (!showReviewForm) {
                  createConfetti(e.currentTarget);
                }
              }}
              className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden group"
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10">{showReviewForm ? 'Anulo' : 'Shkruaj Vlerësim'}</span>
            </button>
          </div>

          {/* Review Stats - Enhanced */}
          {reviewStats && (
            <div className="mb-8 border-b border-gray-200 pb-6 relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 via-emerald-400/5 to-teal-400/5 rounded-2xl blur-xl"></div>
              
              <div className="flex items-center gap-8 relative z-10">
                <div className="text-center relative">
                  {/* Rating Glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
                  </div>
                  
                  <div className="text-6xl md:text-7xl font-black relative z-10 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-shift">
                    {reviewStats.average_rating.toFixed(1)}
                  </div>
                  <div className="text-gray-700 mt-2">{renderStars(Math.round(reviewStats.average_rating))}</div>
                  <div className="text-sm text-gray-600 mt-2 font-semibold">
                    {reviewStats.total} {reviewStats.total === 1 ? 'vlerësim' : 'vlerësime'}
                  </div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.rating_distribution[rating] || 0;
                    const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3 mb-3 group">
                        <span className="text-sm font-black w-12 text-gray-700">{rating} ★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner relative">
                          <div
                            className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 h-3 rounded-full transition-all duration-1000 transform group-hover:scale-105 relative overflow-hidden"
                            style={{ width: `${percentage}%` }}
                          >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 font-black w-12">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Review Form - Enhanced */}
          {showReviewForm && (
            <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl border-2 border-green-200/50 shadow-xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-green-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
              </div>
              
              <h3 className="text-2xl font-black mb-4 relative z-10 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Shkruaj Vlerësimin Tënd
              </h3>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Vlerësimi:</label>
                {renderStars(reviewForm.rating, true, (rating) =>
                  setReviewForm({ ...reviewForm, rating })
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Titulli (opsionale):</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Titulli i vlerësimit"
                  maxLength={255}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Komenti *:</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="4"
                  placeholder="Shkruaj komentin tënd (min 10 karaktere)"
                  minLength={10}
                  maxLength={1000}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {reviewForm.comment.length}/1000 karaktere
                </div>
              </div>
              <button
                onClick={(e) => {
                  handleSubmitReview();
                  if (reviewForm.comment.length >= 10) {
                    createConfetti(e.currentTarget);
                  }
                }}
                disabled={submittingReview || reviewForm.comment.length < 10}
                className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {submittingReview ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Duke dërguar...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Dërgo Vlerësimin</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          )}

          {/* Reviews List - Enhanced */}
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12 relative">
                {/* Empty State Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-4 animate-bounce">⭐</div>
                  <p className="text-gray-600 font-semibold text-lg">
                    Nuk ka vlerësime ende. Bëhu i pari që vlerëson këtë produkt!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div 
                    key={review.id} 
                    className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-2xl"></div>
                    
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div>
                        <div className="font-black text-lg text-gray-900">{review.user_name}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {renderStars(review.rating)}
                          {review.is_verified_purchase && (
                            <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full font-black shadow-lg">
                              ✓ Blerje e verifikuar
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 font-semibold">
                        {new Date(review.created_at).toLocaleDateString('sq-AL')}
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-black text-xl mb-3 text-gray-900 relative z-10">{review.title}</h4>
                    )}
                    <p className="text-gray-700 leading-relaxed relative z-10">{review.comment}</p>
                    {review.helpful_count > 0 && (
                      <div className="text-sm text-gray-600 mt-3 font-semibold relative z-10">
                        <span className="inline-flex items-center gap-1">
                          <span>👍</span>
                          {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'persona'} e gjetën të dobishme
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

