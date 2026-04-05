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
            <span className={`text-2xl ${star <= rating ? 'text-honey-500' : 'text-earth-200'}`}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600 mx-auto mb-4"></div>
          <p className="font-display text-xl text-forest-700">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4">🌿</div>
          <p className="font-display text-2xl font-bold text-forest-900">Produkti nuk u gjet</p>
          <Link href="/products" className="mt-4 inline-block text-forest-600 hover:underline">
            Kthehu te Produktet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>{product.name} - FshatiBio</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-earth-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display text-2xl font-bold text-forest-700 hover:text-forest-800 transition-colors">
              🥛 FshatiBio
            </Link>
            <nav className="flex gap-6">
              <Link href="/products" className="text-forest-700 hover:text-forest-900 font-semibold transition-colors">
                Produktet
              </Link>
              <Link href="/cart" className="text-forest-700 hover:text-forest-900 font-semibold transition-colors">
                Shporta
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-earth-500">
          <Link href="/products" className="hover:text-forest-700 transition-colors">Produktet</Link>
          <span>/</span>
          <span className="text-forest-700 font-medium">{product.name}</span>
        </div>

        {/* Product card */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden mb-8">
          <div className="md:flex">
            {/* Product Image */}
            <div className="md:w-1/2">
              <div className="rounded-3xl overflow-hidden image-zoom h-72 md:h-full min-h-80">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-80 md:h-full bg-forest-50 flex items-center justify-center min-h-80">
                    <span className="text-8xl">🌾</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div
              id="product-info"
              ref={productInfoRef}
              className={`md:w-1/2 p-6 md:p-10 transform transition-all duration-700 ${
                isVisible['product-info']
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-8'
              }`}
            >
              {/* Title + wishlist */}
              <div className="flex items-start justify-between mb-4 gap-4">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-forest-900 leading-tight">
                  {product.name}
                </h1>
                <button
                  onClick={(e) => {
                    toggleWishlist();
                    if (!inWishlist) {
                      createConfetti(e.currentTarget);
                    }
                  }}
                  disabled={checkingWishlist}
                  className="flex-shrink-0 text-3xl hover:scale-110 transition-transform duration-200 disabled:opacity-50"
                  title={inWishlist ? 'Hiq nga lista e dëshirave' : 'Shto në listën e dëshirave'}
                >
                  {inWishlist ? (
                    <span className="text-honey-600">❤️</span>
                  ) : (
                    <span className="text-earth-300 hover:text-honey-500">🤍</span>
                  )}
                </button>
              </div>

              {/* BIO badge */}
              {product.is_bio && (
                <div className="mb-4">
                  <span className="bg-forest-100 text-forest-700 text-sm font-bold px-4 py-1.5 rounded-full border border-forest-200">
                    🌿 BIO Produkt
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <p className="font-display text-2xl text-forest-700 font-bold">
                  {product.price} L
                  <span className="text-base text-earth-500 font-normal ml-1">/ {product.unit}</span>
                </p>
                <p className="text-sm mt-1">
                  Stok:{' '}
                  {product.stock_quantity > 0 ? (
                    <span className="text-forest-600 font-semibold inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-forest-500 rounded-full inline-block"></span>
                      {product.stock_quantity} {product.unit}
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">Nuk ka në stok</span>
                  )}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-5 p-4 bg-cream-100 rounded-2xl border border-earth-100">
                  <h2 className="font-semibold text-forest-900 mb-2 flex items-center gap-2">
                    <span>📝</span> Përshkrimi
                  </h2>
                  <p className="text-earth-700 leading-relaxed text-sm">{product.description}</p>
                </div>
              )}

              {/* Origin */}
              {product.origin && (
                <div className="mb-4 flex items-center gap-2 text-sm text-earth-700">
                  <span className="text-lg">📍</span>
                  <span className="font-semibold text-forest-900">Origjina:</span>
                  <span>{product.origin}</span>
                </div>
              )}

              {/* Freshness */}
              {product.freshness_period && (
                <div className="mb-6 flex items-center gap-2 text-sm text-earth-700">
                  <span className="text-lg">⏰</span>
                  <span className="font-semibold text-forest-900">Afati i freskisë:</span>
                  <span>{product.freshness_period} ditë</span>
                </div>
              )}

              {/* Add to cart */}
              <div className="border-t border-earth-100 pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="font-semibold text-forest-900">Sasia:</label>
                  <div className="flex items-center gap-1 border-2 border-earth-200 rounded-2xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={product.stock_quantity}
                      className="w-14 text-center font-bold text-forest-900 border-0 focus:outline-none bg-transparent"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="w-10 h-10 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold transition-colors"
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
                  className="w-full bg-forest-700 text-white py-4 rounded-full font-semibold text-lg hover:bg-forest-800 transition-all shadow-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                      <span>Duke shtuar...</span>
                    </>
                  ) : product.stock_quantity > 0 ? (
                    <>
                      <span>🛒</span>
                      <span>Shto në Shportë</span>
                    </>
                  ) : (
                    <span>Nuk ka në stok</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div
          id="reviews-section"
          ref={reviewsRef}
          className={`bg-cream-100 rounded-3xl p-6 md:p-8 border border-earth-100 transform transition-all duration-700 ${
            isVisible['reviews-section']
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-forest-900 font-bold">
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
              className="bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm"
            >
              {showReviewForm ? 'Anulo' : 'Shkruaj Vlerësim'}
            </button>
          </div>

          {/* Review Stats */}
          {reviewStats && (
            <div className="mb-8 pb-6 border-b border-earth-200">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="font-display text-6xl font-bold text-forest-700">
                    {reviewStats.average_rating.toFixed(1)}
                  </div>
                  <div className="mt-1">{renderStars(Math.round(reviewStats.average_rating))}</div>
                  <div className="text-sm text-earth-600 mt-1 font-medium">
                    {reviewStats.total} {reviewStats.total === 1 ? 'vlerësim' : 'vlerësime'}
                  </div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.rating_distribution[rating] || 0;
                    const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold w-10 text-earth-600">{rating} ★</span>
                        <div className="flex-1 bg-earth-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-honey-500 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-earth-600 font-semibold w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-8 p-6 bg-white rounded-3xl border border-earth-200 shadow-card">
              <h3 className="font-display text-xl font-bold text-forest-900 mb-4">
                Shkruaj Vlerësimin Tënd
              </h3>
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-forest-900">Vlerësimi:</label>
                {renderStars(reviewForm.rating, true, (rating) =>
                  setReviewForm({ ...reviewForm, rating })
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-forest-900">Titulli (opsionale):</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors"
                  placeholder="Titulli i vlerësimit"
                  maxLength={255}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-forest-900">Komenti *:</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors resize-none"
                  rows="4"
                  placeholder="Shkruaj komentin tënd (min 10 karaktere)"
                  minLength={10}
                  maxLength={1000}
                />
                <div className="text-sm text-earth-500 mt-1">
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
                className="bg-forest-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submittingReview ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    <span>Duke dërguar...</span>
                  </>
                ) : (
                  <span>Dërgo Vlerësimin</span>
                )}
              </button>
            </div>
          )}

          {/* Reviews List */}
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-earth-600 font-medium text-lg">
                  Nuk ka vlerësime ende. Bëhu i pari që vlerëson këtë produkt!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-3xl p-6 border border-earth-100 shadow-card hover:shadow-card-hover transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-forest-900">{review.user_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          {review.is_verified_purchase && (
                            <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full font-bold border border-forest-200">
                              ✓ Blerje e verifikuar
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-earth-500">
                        {new Date(review.created_at).toLocaleDateString('sq-AL')}
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-bold text-forest-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-earth-700 leading-relaxed">{review.comment}</p>
                    {review.helpful_count > 0 && (
                      <div className="text-sm text-earth-500 mt-3">
                        👍 {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'persona'} e gjetën të dobishme
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
