'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { motion } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  imageUrl?: string;
  icon: string;
  gradient: string;
  createdAt: any;
  updatedAt: any;
}

export default function PackagesManagementPage() {
  const router = useRouter();
  const { managerUser, loading, isManager } = useManager();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  
  // Form state - SIMPLE
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: [''],
    imageUrl: '',
    icon: 'Package',
    gradient: 'from-primary to-yellow-600',
  });
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/owner/login');
    }
  }, [managerUser, loading, isManager, router]);

  useEffect(() => {
    if (managerUser) {
      fetchPackages();
    }
  }, [managerUser]);

  const fetchPackages = async () => {
    try {
      const packagesRef = collection(db, 'packages');
      const snapshot = await getDocs(packagesRef);
      
      const packagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PackageData[];
      
      setPackages(packagesData.sort((a, b) => a.price - b.price));
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'minima');
      formData.append('cloud_name', 'do8pgc1ja');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/do8pgc1ja/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
        alert('Image uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const handleSavePackage = async () => {
    if (!formData.name.trim()) {
      alert('Please enter package name');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter package description');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (formData.features.filter(f => f.trim()).length === 0) {
      alert('Please add at least one feature');
      return;
    }

    setSaving(true);

    try {
      const packageData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        features: formData.features.filter(f => f.trim()),
        imageUrl: formData.imageUrl || '',
        icon: formData.icon,
        gradient: formData.gradient,
        updatedAt: new Date(),
      };

      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), packageData);
        alert('Package updated successfully!');
      } else {
        await addDoc(collection(db, 'packages'), {
          ...packageData,
          createdAt: new Date(),
        });
        alert('Package created successfully!');
      }

      setShowModal(false);
      setEditingPackage(null);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPackage = (pkg: PackageData) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      features: pkg.features,
      imageUrl: pkg.imageUrl || '',
      icon: pkg.icon,
      gradient: pkg.gradient,
    });
    setShowModal(true);
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      await deleteDoc(doc(db, 'packages', id));
      alert('Package deleted successfully!');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      features: [''],
      imageUrl: '',
      icon: 'Package',
      gradient: 'from-primary to-yellow-600',
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingPackage(null);
    setShowModal(true);
  };

  if (loading || loadingData) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading packages...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Package Management</h1>
              <p className="text-gray-600 mt-2">Create and manage catering packages</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold shadow-lg"
            >
              <Plus size={20} />
              Add Package
            </motion.button>
          </motion.div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                <Package size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No packages yet</p>
                <p className="text-gray-500 text-sm mt-2">Click "Add Package" to create your first package</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
                >
                  {/* Package Image */}
                  {pkg.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`h-48 bg-gradient-to-br ${pkg.gradient} flex items-center justify-center`}>
                      <Package size={64} className="text-white" />
                    </div>
                  )}

                  {/* Package Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                    
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-primary">₱{pkg.price.toLocaleString()}.00</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditPackage(pkg)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 size={16} />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Package Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPackage(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Package Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Package Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="e.g., Grand Celebration"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="Brief description of the package"
                  rows={3}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₱) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Package Image
                </label>
                {formData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={formData.imageUrl}
                      alt="Package preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mb-4"></div>
                          <p className="text-gray-600">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload size={48} className="text-gray-400 mb-4" />
                          <p className="text-gray-600 font-semibold">Click to upload image</p>
                          <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Features <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        placeholder={`Feature ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <button
                          onClick={() => handleRemoveFeature(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddFeature}
                  className="mt-2 text-primary hover:text-yellow-600 font-semibold text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>

              {/* Gradient Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color Gradient (if no image)
                </label>
                <select
                  value={formData.gradient}
                  onChange={(e) => setFormData(prev => ({ ...prev, gradient: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                >
                  <option value="from-primary to-yellow-600">EventCash (Orange to Gold)</option>
                  <option value="from-blue-500 to-purple-600">Blue to Purple</option>
                  <option value="from-green-500 to-teal-600">Green to Teal</option>
                  <option value="from-orange-500 to-red-600">Orange to Red</option>
                  <option value="from-pink-500 to-purple-600">Pink to Purple</option>
                  <option value="from-yellow-500 to-orange-600">Yellow to Orange</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowModal(false);
                  setEditingPackage(null);
                  resetForm();
                }}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSavePackage}
                disabled={saving || uploading}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </ManagerSidebar>
  );
}
