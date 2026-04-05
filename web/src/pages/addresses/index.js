import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import dynamic from 'next/dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('../../components/AddressMap'), { ssr: false });

export default function Addresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    postal_code: '',
    country: 'Albania',
    is_default: false,
    delivery_notes: ''
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    addressId: null,
    addressName: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/addresses');
      return;
    }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAddresses(response.data.data.addresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/addresses');
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingAddress
        ? `${API_URL}/addresses/${editingAddress.id}`
        : `${API_URL}/addresses`;
      const method = editingAddress ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowForm(false);
      setEditingAddress(null);
      resetForm();
      fetchAddresses();
      showToast(editingAddress ? 'Adresa u përditësua me sukses!' : 'Adresa u shtua me sukses!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error?.message || 'Gabim gjatë ruajtjes së adresës', 'error');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      street: address.street,
      city: address.city,
      postal_code: address.postal_code || '',
      country: address.country || 'Albania',
      is_default: address.is_default,
      delivery_notes: address.delivery_notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (address) => {
    setDeleteModal({
      open: true,
      addressId: address.id,
      addressName: address.street
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.addressId) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/addresses/${deleteModal.addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAddresses();
      showToast('Adresa u fshi me sukses!', 'success');
    } catch (error) {
      const apiError = error.response?.data?.error;
      const errorMessage = apiError?.message || 'Gabim në fshirjen e adresës';
      showToast(errorMessage, 'error');

      if (apiError?.code === 'ADDRESS_IN_USE' && apiError?.order_count) {
        showToast(`Kjo adresë është e lidhur me ${apiError.order_count} porosi. Ju lutem kontrolloni porositë përpara se ta fshini.`, 'warning');
      }
    } finally {
      setDeleteModal({ open: false, addressId: null, addressName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, addressId: null, addressName: '' });
  };

  const resetForm = () => {
    setFormData({
      street: '',
      city: '',
      postal_code: '',
      country: 'Albania',
      is_default: false,
      delivery_notes: ''
    });
    setMapCoordinates(null);
  };

  // Geocode address to show on map
  const geocodeAddress = async () => {
    if (!formData.street || !formData.city) return;

    try {
      const query = `${formData.street}, ${formData.city}, ${formData.country}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=sq,en`,
        {
          headers: {
            'User-Agent': 'FshatiBio/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setMapCoordinates({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          });
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  // Geocode when form data changes
  useEffect(() => {
    if (formData.street && formData.city && !mapCoordinates) {
      const timer = setTimeout(() => {
        geocodeAddress();
      }, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [formData.street, formData.city, formData.country]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation nuk mbështetet nga shfletuesi juaj.', 'error');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=sq,en`,
            {
              headers: { 'User-Agent': 'FshatiBio/1.0' }
            }
          );

          if (!response.ok) {
            throw new Error('Gabim në marrjen e adresës');
          }

          const data = await response.json();

          if (data && data.address) {
            const address = data.address;
            const street = address.road || address.pedestrian || address.path || '';
            const houseNumber = address.house_number || '';
            const fullStreet = houseNumber ? `${street} ${houseNumber}`.trim() : street;
            const city = address.city || address.town || address.village || address.municipality || address.county || '';
            const postalCode = address.postcode || '';
            const country = address.country || 'Albania';

            setFormData(prev => ({
              ...prev,
              street: fullStreet || prev.street,
              city: city || prev.city,
              postal_code: postalCode || prev.postal_code,
              country: country || prev.country
            }));

            setMapCoordinates({ lat: latitude, lng: longitude });
            showToast('Adresa u gjet automatikisht! Ju lutem kontrolloni të dhënat.', 'success');
          } else {
            throw new Error('Nuk u gjet adresë për këtë lokacion');
          }
        } catch (error) {
          console.error('Error getting address:', error);
          showToast('Gabim në marrjen e adresës. Ju lutem shkruani manualisht.', 'error');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Gabim në marrjen e lokacionit.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Qasja në lokacion u refuzua. Ju lutem lejoni qasjen në cilësimet e shfletuesit.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informacioni i lokacionit nuk është i disponueshëm.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Koha për marrjen e lokacionit ka skaduar. Provoni përsëri.';
            break;
          default:
            errorMessage = 'Nuk mundëm të marrim lokacionin. Provoni sërish.';
        }

        showToast(errorMessage, 'warning');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto mb-4"></div>
          <div className="text-xl text-stone-600 font-display">Duke ngarkuar adresat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Adresat e Mia - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 bg-forest-700 rounded-2xl flex items-center justify-center shadow-warm">
                <span className="text-2xl">📍</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-stone-900">
                Adresat e Mia
              </h1>
            </div>
            <p className="text-stone-500 text-sm sm:text-base pl-1">Menaxho adresat tuaja për dorëzim</p>
          </div>
          <button
            onClick={() => {
              setEditingAddress(null);
              resetForm();
              setShowForm(true);
            }}
            className="bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <span className="text-lg">+</span>
            <span className="hidden sm:inline">Shto Adresë të Re</span>
            <span className="sm:hidden">Shto Adresë</span>
          </button>
        </div>

        {/* Stats Card */}
        {addresses.length > 0 && (
          <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 mb-6 sm:mb-8 hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-500 text-xs sm:text-sm font-medium mb-1">Total Adresat</p>
                <p className="text-2xl sm:text-3xl font-bold text-stone-900">{addresses.length}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-forest-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📍</span>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-card p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 border-2 border-forest-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-forest-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">{editingAddress ? '✏️' : '➕'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900">
                {editingAddress ? 'Edito Adresë' : 'Adresë e Re'}
              </h2>
            </div>
            {!editingAddress && (
              <div className="mb-5 sm:mb-6">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm sm:text-base w-full sm:w-auto justify-center shadow-sm"
                >
                  {gettingLocation ? (
                    <>
                      <span className="animate-spin text-lg">⏳</span>
                      <span className="hidden sm:inline">Duke marrë lokacionin...</span>
                      <span className="sm:hidden">Duke marrë...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">📍</span>
                      <span className="hidden sm:inline">Merr Adresën Automatikisht</span>
                      <span className="sm:hidden">Merr Lokacionin</span>
                    </>
                  )}
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 sm:mb-2">
                  Rruga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-sm sm:text-base"
                  required
                  placeholder="P.sh. Rruga Dëshmorët e Kombit"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 sm:mb-2">
                    Qyteti <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-sm sm:text-base"
                    required
                    placeholder="P.sh. Tiranë"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 sm:mb-2">
                    Kodi Postar
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-sm sm:text-base"
                    placeholder="P.sh. 1001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 sm:mb-2">
                  Shteti <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 sm:mb-2">
                  Shënime për Dorëzim (Opsionale)
                </label>
                <textarea
                  value={formData.delivery_notes}
                  onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-earth-200 bg-white focus:outline-none focus:border-forest-500 transition-colors resize-none text-sm sm:text-base"
                  rows={3}
                  placeholder="P.sh. Kati 3, Apartamenti 5, Zyra 12"
                />
              </div>
              <div>
                <label className="flex items-center p-3 sm:p-4 bg-cream-100 rounded-2xl cursor-pointer hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-forest-600 border-stone-300 rounded focus:ring-forest-500 flex-shrink-0"
                  />
                  <span className="ml-3 text-stone-700 font-medium text-xs sm:text-sm">
                    Vendos si adresë default (do të përdoret si adresë kryesore për dorëzim)
                  </span>
                </label>
              </div>
              {mapCoordinates && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5 sm:mb-2">📍 Harta e Lokacionit</label>
                  <div className="w-full h-48 sm:h-56 md:h-64 rounded-3xl overflow-hidden shadow-card border border-stone-200">
                    <MapComponent coordinates={mapCoordinates} address={formData} />
                  </div>
                  <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                    <span>🗺️</span>
                    <span>Harta tregon lokacionin e përafërt të adresës</span>
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-forest-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-forest-800 transition-all shadow-warm text-sm sm:text-base"
                >
                  {editingAddress ? '💾 Përditëso' : '✨ Ruaj Adresë'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 transition-all font-semibold text-sm sm:text-base"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <EmptyState
            icon="📍"
            title="Nuk keni adresa të ruajtura"
            description="Shtoni adresën tuaj të parë për të filluar me blerjet"
            actionLabel="Shto Adresë të Re"
            onAction={() => {
              setEditingAddress(null);
              resetForm();
              setShowForm(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {addresses.map((address, index) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl shadow-card border-2 hover:border-forest-400 transition-all cursor-pointer animate-fade-in ${
                  address.is_default
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-stone-100'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Address Header */}
                <div className={`p-4 sm:p-5 rounded-t-2xl relative overflow-hidden ${
                  address.is_default
                    ? 'bg-gradient-to-br from-forest-600 to-forest-800'
                    : 'bg-gradient-to-br from-stone-600 to-stone-700'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      {address.is_default && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                          ✓ Default
                        </span>
                      )}
                      <span className="text-2xl sm:text-3xl ml-auto">📍</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 break-words">{address.street}</h3>
                    <p className="text-xs sm:text-sm text-white/80">
                      {address.city}, {address.postal_code}
                    </p>
                  </div>
                </div>

                {/* Address Info */}
                <div className="p-4 sm:p-5">
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base text-blue-600">🏙️</span>
                      </div>
                      <span className="text-stone-700 font-medium">{address.city}</span>
                    </div>

                    {address.postal_code && (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-sm sm:text-base text-purple-600">📮</span>
                        </div>
                        <span className="text-stone-700 font-medium">{address.postal_code}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-forest-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base text-forest-600">🌍</span>
                      </div>
                      <span className="text-stone-700 font-medium">{address.country}</span>
                    </div>

                    {address.delivery_notes && (
                      <div className="mt-3 p-3 bg-cream-100 rounded-2xl border border-stone-100">
                        <p className="text-xs text-stone-400 mb-0.5 font-medium">Shënime:</p>
                        <p className="text-xs sm:text-sm text-stone-700 break-words">{address.delivery_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-full hover:bg-blue-700 transition-all font-semibold text-xs sm:text-sm"
                    >
                      <span>✏️</span>
                      <span>Edito</span>
                    </button>
                    <button
                      onClick={() => handleDelete(address)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-full hover:bg-red-700 transition-all font-semibold text-xs sm:text-sm"
                    >
                      <span>🗑️</span>
                      <span>Fshi</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {deleteModal.open && (
        <ConfirmModal
          type="danger"
          title="Fshi Adresën"
          message={`A jeni i sigurt që dëshironi të fshini adresën "${deleteModal.addressName}"?`}
          confirmText="Po, Fshije"
          cancelText="Anulo"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
