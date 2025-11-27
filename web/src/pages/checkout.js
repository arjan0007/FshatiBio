import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../components/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('10:00-14:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [cartRes, addressesRes] = await Promise.all([
        axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/addresses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (cartRes.data.success) {
        setCart(cartRes.data.data);
      }
      if (addressesRes.data.success) {
        setAddresses(addressesRes.data.data.addresses);
        const defaultAddress = addressesRes.data.data.addresses.find(a => a.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/checkout');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Ju lutem shkruani një kod kupon');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/coupons/apply`,
        {
          code: couponCode,
          subtotal: parseFloat(cart.subtotal)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAppliedCoupon(response.data.data);
        setCouponError('');
        // Create confetti effect
        createConfetti(document.querySelector('.coupon-section'));
      }
    } catch (error) {
      setCouponError(error.response?.data?.error?.message || 'Kupon i pavlefshëm');
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Confetti effect function
  const createConfetti = (element) => {
    if (!element) return;
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

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAddress) {
      alert('Ju lutem zgjidhni një adresë');
      return;
    }

    if (!deliveryDate) {
      alert('Ju lutem zgjidhni datën e dorëzimit');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          address_id: selectedAddress,
          payment_method: paymentMethod,
          delivery_date: deliveryDate,
          delivery_time_slot: deliveryTimeSlot,
          notes: notes,
          coupon_id: appliedCoupon?.coupon?.id || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setShowConfetti(true);
        setTimeout(() => {
          router.push(`/orders/${response.data.data.order.id}`);
        }, 2000);
      }
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në krijimin e porosisë');
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate totals with coupon
  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 };
    
    const subtotal = parseFloat(cart.subtotal);
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const deliveryFee = parseFloat(cart.delivery_fee);
    const total = subtotal - discount + deliveryFee;

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Shporta juaj është e zbrazët</h2>
          <Link href="/products" className="text-green-600 hover:underline">
            Kthehu te Produktet
          </Link>
        </main>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Checkout - FshatiBio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {showConfetti && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center max-w-md w-full mx-4 animate-bounce-in">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Porosia u krijua me sukses!</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Ju po ridrejtoheni te detajet e porosisë...</p>
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-4 border-green-200 border-t-green-600"></div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
          <span className="text-3xl sm:text-4xl">🛒</span>
          <span>Checkout</span>
        </h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Address Selection */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 border-2 border-gray-100">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📍</span>
                <span>Adresa e Dorëzimit</span>
              </h2>
              {addresses.length === 0 ? (
                <div>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Nuk keni adresa të ruajtura</p>
                  <Link
                    href="/addresses"
                    className="text-green-600 hover:underline text-sm sm:text-base"
                  >
                    Shto adresë të re
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-[1.01] sm:hover:scale-[1.02] ${
                        selectedAddress === address.id 
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <span className="text-lg sm:text-xl">🏠</span>
                            <p className="font-semibold text-gray-800 text-sm sm:text-base">{address.street}</p>
                            {address.is_default && (
                              <span className="px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm">
                            {address.city}, {address.postal_code}
                          </p>
                          {selectedAddress === address.id && (
                            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-green-600 text-xs sm:text-sm font-medium animate-fade-in">
                              <span>✅</span>
                              <span>Adresa e zgjedhur</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                  <Link
                    href="/addresses"
                    className="text-green-600 hover:underline text-xs sm:text-sm inline-block mt-2"
                  >
                    + Shto adresë të re
                  </Link>
                </div>
              )}
            </div>

            {/* Delivery Date & Time */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 border-2 border-gray-100">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📅</span>
                <span>Data dhe Ora e Dorëzimit</span>
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block font-semibold mb-1.5 sm:mb-2 text-gray-700 text-sm sm:text-base">Data e Dorëzimit</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5 sm:mb-2 text-gray-700 text-sm sm:text-base">Orari i Dorëzimit</label>
                  <select
                    value={deliveryTimeSlot}
                    onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white text-sm sm:text-base"
                  >
                    <option value="10:00-14:00">🌅 10:00 - 14:00</option>
                    <option value="14:00-18:00">☀️ 14:00 - 18:00</option>
                    <option value="18:00-22:00">🌙 18:00 - 22:00</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="coupon-section bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 relative overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 opacity-50"></div>
              
              <div className="relative z-10">
                <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🎟️</span>
                  <span>Kupon Zbritjeje</span>
                </h2>
                {appliedCoupon ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-3 sm:p-4 md:p-5 relative overflow-hidden animate-fade-in">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    
                    {/* Pulse ring */}
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-200 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 opacity-20 animate-pulse"></div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <span className="text-xl sm:text-2xl animate-bounce">✅</span>
                          <p className="font-bold text-green-800 text-base sm:text-lg">
                            Kupon u aplikua!
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 mb-1">
                          <span className="font-semibold">Kodi:</span> {appliedCoupon.coupon.code}
                        </p>
                        <p className="text-base sm:text-lg font-bold text-green-700">
                          Zbritje: -{appliedCoupon.discount} L
                        </p>
                        {appliedCoupon.coupon.discount_type === 'percentage' && (
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                            ({appliedCoupon.coupon.discount_value}% zbritje)
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold flex-shrink-0"
                      >
                        <span className="hidden sm:inline">✕ Hiq</span>
                        <span className="sm:hidden">✕</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Shkruani kodin e kuponit"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm sm:text-base"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              applyCoupon();
                            }
                          }}
                        />
                        {couponCode && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-green-500 text-lg sm:text-xl">🎫</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-xs sm:text-sm overflow-hidden group"
                      >
                        {applyingCoupon ? (
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span className="animate-spin text-sm sm:text-base">⏳</span>
                            <span className="hidden sm:inline">Duke aplikuar...</span>
                            <span className="sm:hidden">...</span>
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                              <span className="text-sm sm:text-base">✨</span>
                              <span>Apliko</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          </>
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-2 sm:p-3 rounded animate-fade-in">
                        <p className="text-red-700 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                          <span>❌</span>
                          <span>{couponError}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                      <span>💡</span>
                      <span>Shkruani kodin e kuponit dhe klikoni "Apliko" për të marrë zbritjen</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 border-2 border-gray-100">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">💳</span>
                <span>Metoda e Pagesës</span>
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <label className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-[1.01] sm:hover:scale-[1.02] ${
                  paymentMethod === 'cod' 
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg' 
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <span className="text-lg sm:text-2xl">💰</span>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Cash on Delivery (COD)</p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Pagesa në dorëzim</p>
                    {paymentMethod === 'cod' && (
                      <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-green-600 text-xs sm:text-sm font-medium animate-fade-in">
                        <span>✅</span>
                        <span>Metoda e zgjedhur</span>
                      </div>
                    )}
                  </div>
                </label>
                <label className="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-50 bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    disabled
                    className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <span className="text-lg sm:text-2xl">💳</span>
                      <p className="font-semibold text-gray-600 text-sm sm:text-base">Pagesa Online</p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">Së shpejti...</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 border-2 border-gray-100">
              <label className="block font-semibold mb-1.5 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">📝</span>
                <span>Shënime (Opsionale)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none text-sm sm:text-base"
                placeholder="Shënime për dorëzimin (opsionale)..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-5 md:p-6 sticky top-4 border-2 border-green-100 relative overflow-hidden">
              {/* Decorative gradient background */}
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-200 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-18 h-18 sm:w-24 sm:h-24 bg-emerald-200 rounded-full -ml-9 -mb-9 sm:-ml-12 sm:-mb-12 opacity-20"></div>
              
              <div className="relative z-10">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">📋</span>
                  <span>Përmbledhje</span>
                </h2>
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                    <span>Nëntotali:</span>
                    <span className="font-medium">{totals.subtotal} L</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-semibold animate-fade-in bg-gradient-to-r from-green-50 to-emerald-50 p-2 sm:p-3 rounded-lg border-2 border-green-200 shadow-sm">
                      <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <span className="text-lg sm:text-xl animate-bounce">🎉</span>
                        <span>Zbritje:</span>
                      </span>
                      <span className="font-bold text-base sm:text-lg">-{totals.discount} L</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700 text-sm sm:text-base">
                    <span>Dërgesa:</span>
                    <span className="font-medium">{totals.deliveryFee} L</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-2 sm:pt-3 flex justify-between font-bold text-lg sm:text-xl">
                    <span className="text-gray-800">Totali:</span>
                    <span className="text-green-700 text-xl sm:text-2xl">{totals.total} L</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !selectedAddress || !deliveryDate}
                  className="relative w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden group text-sm sm:text-base"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="animate-spin text-lg sm:text-xl">⏳</span>
                      <span className="hidden sm:inline">Duke krijuar porosinë...</span>
                      <span className="sm:hidden">Duke krijuar...</span>
                    </span>
                  ) : (
                    <>
                      <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                        <span className="text-lg sm:text-xl">✅</span>
                        <span className="hidden sm:inline">Konfirmo Porosinë</span>
                        <span className="sm:hidden">Konfirmo</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </>
                  )}
                </button>
                {(!selectedAddress || !deliveryDate) && (
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 text-center">
                    ⚠️ Ju lutem plotësoni të gjitha fushat
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
