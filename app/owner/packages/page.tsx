'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { motion } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  imageUrl?: string; // Keep for backward compatibility
  gallery?: string[]; // NEW: Array of image URLs for carousel
  icon: string;
  gradient: string;
  createdAt: any;
  updatedAt: any;
}

interface EventTypeData {
  name: string;
  gallery: string[];
}

const eventTypeNames = ['Weddings', 'Corporate Events', 'Birthday Parties', 'Graduations', 'Baby Showers', 'Special Occasions'];

export default function PackagesManagementPage() {
  const router = useRouter();
  const { managerUser, loading, isManager } = useManager();
  const [activeTab, setActiveTab] = useState<'packages' | 'events'>('packages');
  
  // Packages state
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  
  // Event Types state
  const [eventTypes, setEventTypes] = useState<EventTypeData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventTypeData | null>(null);
  
  // Form state - Packages
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: [''],
    imageUrl: '', // Keep for backward compatibility
    gallery: [] as string[], // NEW: Array of images
    icon: 'Package',
    gradient: 'from-primary to-yellow-600',
  });
  
  // Form state - Event Types
  const [eventFormData, setEventFormData] = useState({
    name: '',
    gallery: [] as string[],
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
      fetchEventTypes();
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

  const fetchEventTypes = async () => {
    try {
      const eventsRef = collection(db, 'eventTypeImages');
      const snapshot = await getDocs(eventsRef);
      
      const eventsData: EventTypeData[] = eventTypeNames.map(name => {
        const doc = snapshot.docs.find(d => d.id === name);
        return {
          name,
          gallery: doc?.data()?.gallery || []
        };
      });
      
      setEventTypes(eventsData);
    } catch (error) {
      console.error('Error fetching event types:', error);
    } finally {
      setLoadingEvents(false);
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
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'minima');
      formDataUpload.append('cloud_name', 'do8pgc1ja');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/do8pgc1ja/image/upload',
        {
          method: 'POST',
          body: formDataUpload,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        // Add to gallery array
        setFormData(prev => ({ 
          ...prev, 
          gallery: [...prev.gallery, data.secure_url],
          imageUrl: prev.gallery.length === 0 ? data.secure_url : prev.imageUrl // Set first image as main for backward compatibility
        }));
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

  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      const newGallery = prev.gallery.filter((_, i) => i !== index);
      return {
        ...prev,
        gallery: newGallery,
        imageUrl: newGallery.length > 0 ? newGallery[0] : '' // Update main image
      };
    });
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
        imageUrl: formData.gallery.length > 0 ? formData.gallery[0] : '', // First image as main
        gallery: formData.gallery, // NEW: Full gallery array
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
      gallery: pkg.gallery || (pkg.imageUrl ? [pkg.imageUrl] : []), // Use gallery or convert old imageUrl
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
      gallery: [],
      icon: 'Package',
      gradient: 'from-primary to-yellow-600',
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingPackage(null);
    setShowModal(true);
  };

  // ============ EVENT TYPES FUNCTIONS ============
  
  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'minima');
      formDataUpload.append('cloud_name', 'do8pgc1ja');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/do8pgc1ja/image/upload',
        {
          method: 'POST',
          body: formDataUpload,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        setEventFormData(prev => ({ 
          ...prev, 
          gallery: [...prev.gallery, data.secure_url]
        }));
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

  const handleRemoveEventImage = (index: number) => {
    setEventFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleAddEventFeature = () => {
    setEventFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveEventFeature = (index: number) => {
    // Not needed anymore
  };

  const handleEventFeatureChange = (index: number, value: string) => {
    // Not needed anymore
  };

  const handleSaveEvent = async () => {
    if (!eventFormData.name.trim()) {
      alert('Please select an event type');
      return;
    }
    if (eventFormData.gallery.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setSaving(true);

    try {
      const eventData = {
        gallery: eventFormData.gallery,
        updatedAt: new Date(),
      };

      // Use event name as document ID
      await setDoc(doc(db, 'eventTypeImages', eventFormData.name), eventData, { merge: true });

      alert('Event type images updated successfully!');
      setShowEventModal(false);
      setEditingEvent(null);
      resetEventForm();
      fetchEventTypes();
    } catch (error) {
      console.error('Error saving event type:', error);
      alert('Failed to save event type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEvent = (event: EventTypeData) => {
    setEditingEvent(event);
    setEventFormData({
      name: event.name,
      gallery: event.gallery || [],
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (name: string) => {
    // Not needed - can't delete hardcoded event types, just clear images
  };

  const resetEventForm = () => {
    setEventFormData({
      name: '',
      gallery: [],
    });
  };

  const openAddEventModal = () => {
    resetEventForm();
    setEditingEvent(null);
    setShowEventModal(true);
  };

  if (loading || (activeTab === 'packages' && loadingData) || (activeTab === 'events' && loadingEvents)) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading...</p>
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
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Content Management</h1>
                <p className="text-gray-600 mt-2">Manage packages and event types</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={activeTab === 'packages' ? openAddModal : () => {}}
                className={`flex items-center gap-2 px-6 py-3 ${
                  activeTab === 'packages' 
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } rounded-lg font-semibold shadow-lg`}
                disabled={activeTab === 'events'}
              >
                <Plus size={20} />
                {activeTab === 'packages' ? 'Add Package' : 'Select Event to Edit'}
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'packages'
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Packages
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'events'
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Event Types
              </button>
            </div>
          </motion.div>

          {/* Packages Grid */}
          {activeTab === 'packages' && (
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
                  {(pkg.gallery && pkg.gallery.length > 0) ? (
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={pkg.gallery[0]}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                      {pkg.gallery.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          +{pkg.gallery.length - 1} more
                        </div>
                      )}
                    </div>
                  ) : pkg.imageUrl ? (
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
          )}

          {/* Event Types Grid */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventTypes.map((event) => (
                <motion.div
                  key={event.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
                >
                  {/* Event Image */}
                  {event.gallery && event.gallery.length > 0 ? (
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={event.gallery[0]}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                      {event.gallery.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          {event.gallery.length} images
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Package size={64} className="text-gray-400" />
                      <div className="absolute text-center">
                        <p className="text-gray-600 font-semibold">No images yet</p>
                      </div>
                    </div>
                  )}

                  {/* Event Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h3>

                    {/* Actions */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditEvent(event)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 size={16} />
                      Manage Images
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

              {/* Image Gallery Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Package Images (Unlimited)
                </label>
                
                {/* Display uploaded images */}
                {formData.gallery.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {formData.gallery.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Package image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {index === 0 ? 'Main' : `#${index + 1}`}
                        </div>
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                        <p className="text-gray-600 font-semibold">
                          {formData.gallery.length === 0 ? 'Click to upload first image' : 'Click to add more images'}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB each</p>
                        {formData.gallery.length > 0 && (
                          <p className="text-primary text-sm mt-1 font-semibold">
                            {formData.gallery.length} image{formData.gallery.length !== 1 ? 's' : ''} uploaded
                          </p>
                        )}
                      </>
                    )}
                  </label>
                </div>
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

      {/* Add/Edit Event Type Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Manage Event Type Images
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  resetEventForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Event Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Type <span className="text-red-600">*</span>
                </label>
                <select
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  disabled={!!editingEvent}
                >
                  <option value="">Select an event type</option>
                  {eventTypeNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {editingEvent && (
                  <p className="text-xs text-gray-500 mt-1">Event type cannot be changed when editing</p>
                )}
              </div>

              {/* Image Gallery Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Images (Unlimited) <span className="text-red-600">*</span>
                </label>
                
                {/* Display uploaded images */}
                {eventFormData.gallery.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {eventFormData.gallery.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                        <button
                          onClick={() => handleRemoveEventImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEventImageUpload}
                    className="hidden"
                    id="event-image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="event-image-upload"
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
                        <p className="text-gray-600 font-semibold">
                          {eventFormData.gallery.length === 0 ? 'Click to upload first image' : 'Click to add more images'}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB each</p>
                        {eventFormData.gallery.length > 0 && (
                          <p className="text-primary text-sm mt-1 font-semibold">
                            {eventFormData.gallery.length} image{eventFormData.gallery.length !== 1 ? 's' : ''} uploaded
                          </p>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  resetEventForm();
                }}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEvent}
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
                    Save Images
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
