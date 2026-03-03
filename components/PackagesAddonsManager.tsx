'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Package as PackageIcon, DollarSign } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category?: string;
}

export default function PackagesAddonsManager() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'food',
    available: true,
  });

  useEffect(() => {
    fetchAddOns();
  }, []);

  const fetchAddOns = async () => {
    try {
      const addOnsRef = collection(db, 'addOns');
      const snapshot = await getDocs(addOnsRef);
      
      const addOnsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AddOn[];
      
      setAddOns(addOnsData);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'addOns'), {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        available: formData.available,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      alert('Add-on created successfully!');
      setShowAddForm(false);
      setFormData({ name: '', description: '', price: '', category: 'food', available: true });
      fetchAddOns();
    } catch (error) {
      console.error('Error adding add-on:', error);
      alert('Failed to create add-on');
    }
  };

  const handleUpdate = async (id: string) => {
    const addOn = addOns.find(a => a.id === id);
    if (!addOn) return;

    try {
      await updateDoc(doc(db, 'addOns', id), {
        name: addOn.name,
        description: addOn.description,
        price: addOn.price,
        available: addOn.available,
        updatedAt: new Date(),
      });

      alert('Add-on updated successfully!');
      setEditingId(null);
    } catch (error) {
      console.error('Error updating add-on:', error);
      alert('Failed to update add-on');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return;

    try {
      await deleteDoc(doc(db, 'addOns', id));
      alert('Add-on deleted successfully!');
      fetchAddOns();
    } catch (error) {
      console.error('Error deleting add-on:', error);
      alert('Failed to delete add-on');
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'addOns', id), {
        available: !currentStatus,
        updatedAt: new Date(),
      });
      fetchAddOns();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add-ons Management</h2>
          <p className="text-gray-600 mt-1">Manage additional services and items for bookings</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold shadow-lg"
        >
          <Plus size={20} />
          Add New
        </motion.button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border-2 border-primary/30"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Add New Add-on</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                placeholder="e.g., Extra Table Setup"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-semibold">₱</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                placeholder="Describe this add-on..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
              >
                <option value="food">Food & Beverage</option>
                <option value="equipment">Equipment</option>
                <option value="service">Service</option>
                <option value="decoration">Decoration</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="available" className="text-sm font-semibold text-gray-700">
                Available for booking
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Add Add-on
            </button>
          </div>
        </motion.div>
      )}

      {/* Add-ons List */}
      <div className="grid grid-cols-1 gap-4">
        {addOns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <PackageIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No add-ons yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first add-on to get started</p>
          </div>
        ) : (
          addOns.map((addOn) => (
            <motion.div
              key={addOn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {editingId === addOn.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={addOn.name}
                        onChange={(e) => setAddOns(addOns.map(a => a.id === addOn.id ? { ...a, name: e.target.value } : a))}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-2 text-gray-500 font-semibold">₱</span>
                        <input
                          type="number"
                          value={addOn.price}
                          onChange={(e) => setAddOns(addOns.map(a => a.id === addOn.id ? { ...a, price: parseFloat(e.target.value) } : a))}
                          className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={addOn.description}
                        onChange={(e) => setAddOns(addOns.map(a => a.id === addOn.id ? { ...a, description: e.target.value } : a))}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(addOn.id)}
                      className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{addOn.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        addOn.available 
                          ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                          : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                      }`}>
                        {addOn.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{addOn.description}</p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-primary" />
                      <span className="text-2xl font-bold text-primary">₱{addOn.price.toLocaleString()}.00</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleAvailability(addOn.id, addOn.available)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        addOn.available
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {addOn.available ? 'Disable' : 'Enable'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingId(addOn.id)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(addOn.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
