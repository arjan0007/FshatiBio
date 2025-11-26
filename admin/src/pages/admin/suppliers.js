import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SuppliersManagement() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    region: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingSupplier
        ? `${API_URL}/admin/suppliers/${editingSupplier.id}`
        : `${API_URL}/admin/suppliers`;
      const method = editingSupplier ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setEditingSupplier(null);
      resetForm();
      fetchSuppliers();
      alert(editingSupplier ? 'Furnizuesi u përditësua!' : 'Furnizuesi u krijua!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      region: supplier.region || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('A jeni të sigurt që dëshironi të fshini këtë furnizues?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_URL}/admin/suppliers/${id}`,
        { is_active: false },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchSuppliers();
      alert('Furnizuesi u fshi!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      region: '',
      notes: '',
      is_active: true
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar furnizuesit...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Menaxho Furnizuesit - Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Menaxho Furnizuesit</h2>
          <button
            onClick={() => {
              setEditingSupplier(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            + Furnizues i Ri
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rajoni</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statusi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veprime</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{supplier.name}</div>
                    {supplier.contact_person && (
                      <div className="text-sm text-gray-500">{supplier.contact_person}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{supplier.phone || '-'}</div>
                    <div className="text-sm text-gray-500">{supplier.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.region || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edito
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Fshi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {suppliers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nuk ka furnizues
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4">
                {editingSupplier ? 'Edito Furnizues' : 'Furnizues i Ri'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Emri i Furnizuesit *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Person Kontakti</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Adresa</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Rajoni</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Shënime</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Aktiv
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    {editingSupplier ? 'Përditëso' : 'Krijo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSupplier(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Anulo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}

