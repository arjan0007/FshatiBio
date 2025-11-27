import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';
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
      alert(editingAddress ? 'Adresa u përditësua!' : 'Adresa u shtua!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
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

  const handleDelete = async (id) => {
    if (!confirm('A jeni të sigurt që dëshironi të fshini këtë adresë?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAddresses();
      alert('Adresa u fshi!');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Gabim në fshirjen e adresës';
      alert(errorMessage);
      
      // If address is in use, show more helpful message
      if (error.response?.data?.error?.code === 'ADDRESS_IN_USE') {
        const orderCount = error.response?.data?.error?.order_count;
        if (orderCount) {
          alert(`Kjo adresë është e lidhur me ${orderCount} porosi. Ju lutem shkoni te faqja "Porositë" dhe kontrolloni porositë që përdorin këtë adresë.`);
        }
      }
    }
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
      alert('Geolocation nuk mbështetet nga shfletuesi juaj.');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=sq,en`,
            {
              headers: {
                'User-Agent': 'FshatiBio/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Gabim në marrjen e adresës');
          }

          const data = await response.json();
          
          if (data && data.address) {
            const address = data.address;
            
            // Extract address components
            const street = address.road || address.pedestrian || address.path || '';
            const houseNumber = address.house_number || '';
            const fullStreet = houseNumber ? `${street} ${houseNumber}`.trim() : street;
            
            const city = address.city || 
                        address.town || 
                        address.village || 
                        address.municipality || 
                        address.county || '';
            
            const postalCode = address.postcode || '';
            const country = address.country || 'Albania';
            
            // Update form data
            setFormData(prev => ({
              ...prev,
              street: fullStreet || prev.street,
              city: city || prev.city,
              postal_code: postalCode || prev.postal_code,
              country: country || prev.country
            }));

            // Set map coordinates
            setMapCoordinates({ lat: latitude, lng: longitude });

            alert('Adresa u gjet automatikisht! Ju lutem kontrolloni dhe plotësoni nëse nevojitet.');
          } else {
            throw new Error('Nuk u gjet adresë për këtë lokacion');
          }
        } catch (error) {
          console.error('Error getting address:', error);
          alert('Gabim në marrjen e adresës. Ju lutem shkruani manualisht.');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Gabim në marrjen e lokacionit.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Qasja në lokacion u refuzua. Ju lutem lejoni qasjen në lokacion në cilësimet e shfletuesit.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informacioni i lokacionit nuk është i disponueshëm.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Koha për marrjen e lokacionit ka skaduar.';
            break;
        }
        
        alert(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Duke ngarkuar adresat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50">
      <Head>
        <title>Adresat e Mia - FshatiBio</title>
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">📍</span>
              <span>Adresat e Mia</span>
            </h1>
            <p className="text-gray-600">Menaxho adresat tuaja për dorëzim</p>
          </div>
          <button
            onClick={() => {
              setEditingAddress(null);
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <span className="text-xl">+</span>
            <span>Shto Adresë të Re</span>
          </button>
        </div>

        {/* Stats Card */}
        {addresses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Adresat</p>
                <p className="text-3xl font-bold text-gray-900">{addresses.length}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📍</span>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8 border-2 border-green-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{editingAddress ? '✏️' : '➕'}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAddress ? 'Edito Adresë' : 'Adresë e Re'}
              </h2>
            </div>
            {!editingAddress && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  {gettingLocation ? (
                    <>
                      <span className="animate-spin text-xl">⏳</span>
                      <span>Duke marrë lokacionin...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">📍</span>
                      <span>Merr Adresën Automatikisht</span>
                    </>
                  )}
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rruga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  required
                  placeholder="P.sh. Rruga Dëshmorët e Kombit"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Qyteti <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    required
                    placeholder="P.sh. Tiranë"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kodi Postar
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="P.sh. 1001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shteti <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shënime për Dorëzim (Opsionale)
                </label>
                <textarea
                  value={formData.delivery_notes}
                  onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                  rows={3}
                  placeholder="P.sh. Kati 3, Apartamenti 5, Zyra 12"
                />
              </div>
              <div>
                <label className="flex items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">
                    Vendos si adresë default (do të përdoret si adresë kryesore për dorëzim)
                  </span>
                </label>
              </div>
              {mapCoordinates && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Harta e Lokacionit</label>
                  <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                    <MapComponent coordinates={mapCoordinates} address={formData} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>🗺️</span>
                    <span>Harta tregon lokacionin e përafërt të adresës</span>
                  </p>
                </div>
              )}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
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
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address, index) => (
              <div
                key={address.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 overflow-hidden animate-fade-in ${
                  address.is_default ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Address Header */}
                <div className={`p-6 ${
                  address.is_default 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                } text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      {address.is_default && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                          ✓ Default
                        </span>
                      )}
                      <span className="text-3xl">📍</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{address.street}</h3>
                    <p className="text-sm opacity-90">
                      {address.city}, {address.postal_code}
                    </p>
                  </div>
                </div>

                {/* Address Info */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600">🏙️</span>
                      </div>
                      <span className="text-gray-700 font-medium">{address.city}</span>
                    </div>

                    {address.postal_code && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600">📮</span>
                        </div>
                        <span className="text-gray-700 font-medium">{address.postal_code}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600">🌍</span>
                      </div>
                      <span className="text-gray-700 font-medium">{address.country}</span>
                    </div>

                    {address.delivery_notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Shënime:</p>
                        <p className="text-sm text-gray-700">{address.delivery_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium"
                    >
                      <span>✏️</span>
                      <span>Edito</span>
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-all font-medium"
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
    </div>
  );
}

