import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import EmptyState from '../components/EmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
      alert(error.response?.data?.error?.message || 'Gabim');
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Adresat e Mia - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Adresat e Mia</h1>
          <button
            onClick={() => {
              setEditingAddress(null);
              resetForm();
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg hover:bg-green-700 text-sm sm:text-base w-full sm:w-auto"
          >
            + Shto Adresë të Re
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4">
              {editingAddress ? 'Edito Adresë' : 'Adresë e Re'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="block font-semibold mb-2">Rruga</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Qyteti</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Kodi Postar</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2">Shteti</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Shënime për Dorëzim (Opsionale)</label>
                <textarea
                  value={formData.delivery_notes}
                  onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:border-green-500"
                  rows={3}
                  placeholder="P.sh. Kati 3, Apartamenti 5"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="mr-2"
                  />
                  Vendos si adresë default
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  {editingAddress ? 'Përditëso' : 'Ruaj'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
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
          <div className="grid gap-3 sm:gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-lg shadow p-4 sm:p-6 ${
                  address.is_default ? 'border-2 border-green-500' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {address.is_default && (
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold mb-2">
                        Default
                      </span>
                    )}
                    <p className="font-semibold text-base sm:text-lg break-words">{address.street}</p>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {address.city}, {address.postal_code}
                    </p>
                    <p className="text-gray-600 text-sm sm:text-base">{address.country}</p>
                    {address.delivery_notes && (
                      <p className="text-gray-500 text-xs sm:text-sm mt-2 break-words">
                        <strong>Shënime:</strong> {address.delivery_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base flex-1 sm:flex-initial"
                    >
                      Edito
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base flex-1 sm:flex-initial"
                    >
                      Fshi
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

