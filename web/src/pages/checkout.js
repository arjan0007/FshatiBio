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
      <div className="min-h-screen bg-[#fefae0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-100 border-t-forest-600"></div>
          <p className="text-forest-700 font-medium">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fefae0]">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">🌿</div>
          <h2 className="font-display text-3xl text-forest-900 font-bold mb-4">Shporta juaj është e zbrazët</h2>
          <p className="text-forest-700 mb-8">Shtoni produkte organike para se të vazhdoni me checkout.</p>
          <Link href="/products" className="bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-[0_4px_24px_rgba(29,78,53,0.08)]">
            Kthehu te Produktet
          </Link>
        </main>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-[#fefae0]">
      <Head>
        <title>Checkout - FshatiBio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {showConfetti && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(29,78,53,0.22)] p-8 text-center max-w-md w-full mx-4 animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-display text-2xl text-forest-900 font-bold mb-2">Porosia u krijua me sukses!</h2>
            <p className="text-forest-700 mb-6">Ju po ridrejtoheni te detajet e porosisë...</p>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-forest-100 border-t-forest-600"></div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-forest-900 font-bold flex items-center gap-3">
            <span className="text-4xl">🛒</span>
            Checkout
          </h1>
          <p className="text-forest-700 mt-2 text-sm">Plotësoni detajet për të finalizuar porosinë tuaj organike.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Form Steps */}
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1 - Address */}
            <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-forest-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <h2 className="font-display text-xl text-forest-900 font-semibold">Adresa e Dorëzimit</h2>
              </div>
              {addresses.length === 0 ? (
                <div>
                  <p className="text-forest-700 mb-4">Nuk keni adresa të ruajtura.</p>
                  <Link href="/addresses" className="bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-[0_4px_24px_rgba(29,78,53,0.08)] text-sm inline-block">
                    + Shto adresë të re
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                        selectedAddress === address.id
                          ? 'border-forest-700 bg-forest-50'
                          : 'border-[#e8d5c4] hover:border-forest-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="accent-forest-700 w-4 h-4 mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-lg">🏠</span>
                            <p className="font-semibold text-forest-900 text-sm">{address.street}</p>
                            {address.is_default && (
                              <span className="bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full border border-forest-200">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-forest-700 text-xs">
                            {address.city}, {address.postal_code}
                          </p>
                          {selectedAddress === address.id && (
                            <div className="mt-2 flex items-center gap-1 text-forest-700 text-xs font-medium animate-fade-in">
                              <span>✓</span>
                              <span>Adresa e zgjedhur</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                  <Link href="/addresses" className="text-forest-700 hover:text-forest-900 text-sm font-medium inline-block mt-1 transition-colors">
                    + Shto adresë të re
                  </Link>
                </div>
              )}
            </div>

            {/* Step 2 - Date & Time */}
            <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-forest-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <h2 className="font-display text-xl text-forest-900 font-semibold">Data e Dorëzimit</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2 text-forest-900 text-sm">Data e Dorëzimit</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8d5c4] bg-white focus:outline-none focus:border-forest-500 transition-colors font-sans text-forest-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-3 text-forest-900 text-sm">Orari i Dorëzimit</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '10:00-14:00', label: '🌅 10:00 – 14:00' },
                      { value: '14:00-18:00', label: '☀️ 14:00 – 18:00' },
                      { value: '18:00-22:00', label: '🌙 18:00 – 22:00' },
                    ].map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setDeliveryTimeSlot(slot.value)}
                        className={`rounded-full px-4 py-2 border-2 text-sm font-medium cursor-pointer transition-all ${
                          deliveryTimeSlot === slot.value
                            ? 'border-forest-700 bg-forest-700 text-white'
                            : 'border-[#e8d5c4] text-forest-700 hover:border-forest-400'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Payment */}
            <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-forest-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <h2 className="font-display text-xl text-forest-900 font-semibold">Metoda e Pagesës</h2>
              </div>
              <div className="space-y-3">
                <label className={`flex items-center rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-forest-700 bg-forest-50'
                    : 'border-[#e8d5c4] hover:border-forest-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-forest-700 w-4 h-4 mr-3 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xl">💰</span>
                      <p className="font-semibold text-forest-900 text-sm">Cash on Delivery (COD)</p>
                    </div>
                    <p className="text-forest-700 text-xs">Pagesa në dorëzim</p>
                    {paymentMethod === 'cod' && (
                      <div className="mt-1.5 flex items-center gap-1 text-forest-700 text-xs font-medium animate-fade-in">
                        <span>✓</span>
                        <span>Metoda e zgjedhur</span>
                      </div>
                    )}
                  </div>
                </label>
                <label className="flex items-center rounded-2xl border-2 border-[#e8d5c4] p-4 cursor-not-allowed opacity-50 bg-[#fafaf8]">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    disabled
                    className="w-4 h-4 mr-3 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xl">💳</span>
                      <p className="font-semibold text-forest-700 text-sm">Pagesa Online</p>
                    </div>
                    <p className="text-forest-700 text-xs">Së shpejti...</p>
                  </div>
                </label>
              </div>

              {/* Coupon Code inside payment step */}
              <div className="coupon-section mt-6 pt-5 border-t border-[#f2e5cc]">
                <p className="font-semibold text-forest-900 text-sm mb-3 flex items-center gap-2">
                  <span>🎟️</span> Kupon Zbritjeje
                </p>
                {appliedCoupon ? (
                  <div className="bg-forest-50 border-2 border-forest-200 rounded-2xl p-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-forest-800 text-sm mb-1">✓ Kupon u aplikua!</p>
                        <p className="text-xs text-forest-700 mb-1">Kodi: <span className="font-semibold">{appliedCoupon.coupon.code}</span></p>
                        <span className="bg-forest-100 text-forest-700 text-sm px-3 py-1 rounded-full border border-forest-200 font-semibold">
                          Zbritje: -{appliedCoupon.discount} L
                        </span>
                        {appliedCoupon.coupon.discount_type === 'percentage' && (
                          <p className="text-xs text-forest-700 mt-1">({appliedCoupon.coupon.discount_value}% zbritje)</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-all text-xs flex-shrink-0"
                      >
                        ✕ Hiq
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Shkruani kodin e kuponit"
                        className="flex-1 px-4 py-3 rounded-l-2xl border-2 border-r-0 border-[#e8d5c4] bg-white focus:outline-none focus:border-forest-500 transition-colors font-sans text-forest-900 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="bg-honey-500 text-white px-4 py-3 rounded-r-2xl hover:bg-honey-600 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applyingCoupon ? '...' : 'Apliko'}
                      </button>
                    </div>
                    {couponError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-fade-in">
                        <p className="text-red-700 text-xs flex items-center gap-1.5">
                          <span>✕</span>
                          <span>{couponError}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-forest-700 opacity-70">Shkruani kodin e kuponit dhe klikoni "Apliko"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4 - Notes */}
            <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-forest-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <h2 className="font-display text-xl text-forest-900 font-semibold">Shënime</h2>
              </div>
              <label className="block font-semibold mb-2 text-forest-900 text-sm">
                Shënime opsionale për dorëzimin
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8d5c4] bg-white focus:outline-none focus:border-forest-500 transition-colors font-sans text-forest-900 resize-none text-sm"
                placeholder="Shënime për dorëzimin (opsionale)..."
              />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(29,78,53,0.08)] p-6 sticky top-4">
              <h2 className="font-display text-xl text-forest-900 font-semibold mb-5 flex items-center gap-2">
                <span>📋</span> Përmbledhje
              </h2>

              {/* Cart items */}
              {cart.items && cart.items.length > 0 && (
                <div className="mb-4 space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-[#f2e5cc] last:border-0">
                      <span className="text-forest-900 text-sm flex-1 pr-2 line-clamp-1">
                        {item.product?.name} <span className="text-forest-700">×{item.quantity}</span>
                      </span>
                      <span className="text-forest-700 font-medium text-sm whitespace-nowrap">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)} L
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 mb-6">
                <div className="flex justify-between py-2 border-b border-[#f2e5cc]">
                  <span className="text-forest-700 text-sm">Nëntotali:</span>
                  <span className="font-medium text-forest-900 text-sm">{totals.subtotal} L</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between py-2 border-b border-[#f2e5cc] animate-fade-in">
                    <span className="text-forest-700 text-sm flex items-center gap-1">
                      <span>🎉</span> Zbritje:
                    </span>
                    <span className="font-bold text-forest-700 text-sm">-{totals.discount} L</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-[#f2e5cc]">
                  <span className="text-forest-700 text-sm">Dërgesa:</span>
                  <span className="font-medium text-forest-900 text-sm">{totals.deliveryFee} L</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-forest-900 font-bold">Totali:</span>
                  <span className="font-display text-2xl text-forest-700 font-bold">{totals.total} L</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedAddress || !deliveryDate}
                className="w-full bg-honey-500 text-white py-4 rounded-full text-lg font-bold hover:bg-honey-600 transition-all shadow-[0_4px_20px_rgba(244,162,97,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white inline-block"></span>
                    Duke krijuar...
                  </span>
                ) : (
                  '✓ Konfirmo Porosinë'
                )}
              </button>

              {(!selectedAddress || !deliveryDate) && (
                <p className="text-xs text-forest-700 opacity-60 mt-3 text-center">
                  Ju lutem plotësoni të gjitha fushat e detyrueshme
                </p>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
