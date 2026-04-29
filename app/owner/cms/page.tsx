'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Home, Award, Users, Heart, Plus, Edit2, Trash2, X, Upload, FileText } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import PackagesAddonsManager from '@/components/PackagesAddonsManager';
import { Package } from 'lucide-react';

interface ContactInfo {
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  hours: {
    weekdays: string;
    weekends: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    showFacebook?: boolean;
    showInstagram?: boolean;
    showTwitter?: boolean;
  };
  mapUrl?: string;
}

interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
  };
  stats: {
    eventsCatered: string;
    happyGuests: string;
    awardsWon: string;
    clientSatisfaction: string;
  };
  whyus: {
    title: string;
    feature1: {
      title: string;
      description: string;
    };
    feature2: {
      title: string;
      description: string;
    };
    feature3: {
      title: string;
      description: string;
    };
  };
  cta: {
    title: string;
    description: string;
  };
}

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  imageUrl?: string;
  gallery?: string[];
  icon: string;
  gradient: string;
  createdAt: any;
  updatedAt: any;
}

export default function CMSPage() {
  const router = useRouter();
  const { managerUser, isManager, loading: managerLoading } = useManager();
  const [activeTab, setActiveTab] = useState<'contact' | 'content' | 'packages' | 'business'>('content');
  const [packagesSubTab, setPackagesSubTab] = useState<'packages' | 'addons'>('packages');
  const [businessInfo, setBusinessInfo] = useState({ businessName: '', address: '', tinNumber: '', email: '', phone: '' });
  const [savingBusiness, setSavingBusiness] = useState(false);
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    hours: {
      weekdays: '',
      weekends: '',
    },
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      showFacebook: true,
      showInstagram: true,
      showTwitter: true,
    },
    mapUrl: '',
  });

  const [homeContent, setHomeContent] = useState<HomeContent>({
    hero: {
      title: 'EventCash',
      subtitle: 'Elevate your events with exquisite catering from EventCash Catering. Premium culinary excellence for every occasion.',
    },
    stats: {
      eventsCatered: '500+',
      happyGuests: '10,000+',
      awardsWon: '25+',
      clientSatisfaction: '98%',
    },
    whyus: {
      title: 'Why Choose EventCash?',
      feature1: {
        title: 'Excellence & Quality',
        description: 'Award-winning chefs and premium ingredients for exceptional cuisine.',
      },
      feature2: {
        title: 'Professional Team',
        description: 'Expert staff for seamless execution and impeccable service.',
      },
      feature3: {
        title: 'Personalized Touch',
        description: 'Custom menus tailored to your preferences and dietary needs.',
      },
    },
    cta: {
      title: 'Ready to Plan Your Event?',
      description: "Let's create a memorable culinary experience for your special occasion.",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Package management state
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  const [uploading, setUploading] = useState(false);

  // Debug: Log packages state changes
  useEffect(() => {
    console.log('Packages state updated:', packages);
  }, [packages]);
  
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: [''],
    imageUrl: '',
    gallery: [] as string[],
    icon: 'Package',
    gradient: 'from-primary to-yellow-600',
  });

  useEffect(() => {
    if (!managerLoading && (!isManager || !managerUser)) {
      router.push('/owner/login');
      return;
    }
    
    if (isManager) {
      fetchContactInfo();
      fetchHomeContent();
      fetchPackages();
      fetchBusinessInfo();
    }
  }, [isManager, managerUser, managerLoading, router]);

  const fetchPackages = async () => {
    try {
      const packagesRef = collection(db, 'packages');
      const snapshot = await getDocs(packagesRef);
      
      const packagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PackageData[];
      
      console.log('Fetched packages:', packagesData); // Debug log
      setPackages(packagesData.sort((a, b) => a.price - b.price));
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const docRef = doc(db, 'settings', 'contact');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContactInfo(docSnap.data() as ContactInfo);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'business'));
      if (snap.exists()) setBusinessInfo(snap.data() as any);
    } catch (e) { console.error('Error fetching business info:', e); }
  };

  const handleSaveBusiness = async () => {
    setSavingBusiness(true);
    try {
      await setDoc(doc(db, 'settings', 'business'), businessInfo, { merge: true });
      alert('Business information saved!');
    } catch (e) {
      console.error('Error saving business info:', e);
      alert('Failed to save business information');
    } finally {
      setSavingBusiness(false);
    }
  };

  const fetchHomeContent = async () => {
    try {
      const docRef = doc(db, 'cms', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.home) {
          // Merge with default values to ensure all properties exist
          setHomeContent(prevContent => ({
            hero: { ...prevContent.hero, ...(data.home.hero || {}) },
            stats: { ...prevContent.stats, ...(data.home.stats || {}) },
            whyus: {
              title: data.home.whyus?.title || prevContent.whyus.title,
              feature1: { ...prevContent.whyus.feature1, ...(data.home.whyus?.feature1 || {}) },
              feature2: { ...prevContent.whyus.feature2, ...(data.home.whyus?.feature2 || {}) },
              feature3: { ...prevContent.whyus.feature3, ...(data.home.whyus?.feature3 || {}) },
            },
            cta: { ...prevContent.cta, ...(data.home.cta || {}) },
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching home content:', error);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'contact');
      await setDoc(docRef, contactInfo);
      alert('Contact information saved successfully!');
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Failed to save contact information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      // Save homepage content
      const docRef = doc(db, 'cms', 'content');
      await setDoc(docRef, { home: homeContent }, { merge: true });
      // Also save social links (stored in contact settings)
      const contactRef = doc(db, 'settings', 'contact');
      await setDoc(contactRef, contactInfo, { merge: true });
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Package management functions
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
        setPackageFormData(prev => ({ 
          ...prev, 
          gallery: [...prev.gallery, data.secure_url],
          imageUrl: prev.gallery.length === 0 ? data.secure_url : prev.imageUrl
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
    setPackageFormData(prev => {
      const newGallery = prev.gallery.filter((_, i) => i !== index);
      return {
        ...prev,
        gallery: newGallery,
        imageUrl: newGallery.length > 0 ? newGallery[0] : ''
      };
    });
  };

  const handleAddFeature = () => {
    setPackageFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setPackageFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setPackageFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const handleSavePackage = async () => {
    if (!packageFormData.name.trim()) {
      alert('Please enter package name');
      return;
    }
    if (!packageFormData.description.trim()) {
      alert('Please enter package description');
      return;
    }
    if (!packageFormData.price || parseFloat(packageFormData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (packageFormData.features.filter(f => f.trim()).length === 0) {
      alert('Please add at least one feature');
      return;
    }

    setSaving(true);

    try {
      const packageData = {
        name: packageFormData.name.trim(),
        description: packageFormData.description.trim(),
        price: parseFloat(packageFormData.price),
        features: packageFormData.features.filter(f => f.trim()),
        imageUrl: packageFormData.gallery.length > 0 ? packageFormData.gallery[0] : '',
        gallery: packageFormData.gallery,
        icon: packageFormData.icon,
        gradient: packageFormData.gradient,
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

      setShowPackageModal(false);
      setEditingPackage(null);
      resetPackageForm();
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
    setPackageFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      features: pkg.features,
      imageUrl: pkg.imageUrl || '',
      gallery: pkg.gallery || (pkg.imageUrl ? [pkg.imageUrl] : []),
      icon: pkg.icon,
      gradient: pkg.gradient,
    });
    setShowPackageModal(true);
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

  const resetPackageForm = () => {
    setPackageFormData({
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

  const openAddPackageModal = () => {
    resetPackageForm();
    setEditingPackage(null);
    setShowPackageModal(true);
  };

  if (managerLoading || loading) {
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
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Website CMS</h1>
                <p className="text-gray-600 mt-2">Manage your website content and contact information</p>
              </div>
              {(activeTab === 'content' || activeTab === 'contact') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={activeTab === 'contact' ? handleSaveContact : handleSaveContent}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'content'
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="inline mr-2" size={20} />
                Homepage Content
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'packages'
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="inline mr-2" size={20} />
                Packages & Add-ons
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'contact'
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Phone className="inline mr-2" size={20} />
                Contact Information
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'business'
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Business Info (Invoice)
              </button>
            </div>
          </motion.div>

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Hero Section</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Main Title
                    </label>
                    <input
                      type="text"
                      value={homeContent.hero.title}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        hero: { ...homeContent.hero, title: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subtitle
                    </label>
                    <textarea
                      value={homeContent.hero.subtitle}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        hero: { ...homeContent.hero, subtitle: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Events Catered
                    </label>
                    <input
                      type="text"
                      value={homeContent.stats.eventsCatered}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        stats: { ...homeContent.stats, eventsCatered: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="500+"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Happy Guests
                    </label>
                    <input
                      type="text"
                      value={homeContent.stats.happyGuests}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        stats: { ...homeContent.stats, happyGuests: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="10,000+"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Awards Won
                    </label>
                    <input
                      type="text"
                      value={homeContent.stats.awardsWon}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        stats: { ...homeContent.stats, awardsWon: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="25+"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Client Satisfaction
                    </label>
                    <input
                      type="text"
                      value={homeContent.stats.clientSatisfaction}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        stats: { ...homeContent.stats, clientSatisfaction: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="98%"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Why Choose Us Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us Section</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={homeContent.whyus.title}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        whyus: { ...homeContent.whyus, title: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>

                  {/* Feature 1 */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Award size={20} className="text-primary" />
                      Feature 1
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={homeContent.whyus.feature1.title}
                          onChange={(e) => setHomeContent({
                            ...homeContent,
                            whyus: {
                              ...homeContent.whyus,
                              feature1: { ...homeContent.whyus.feature1, title: e.target.value }
                            }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={homeContent.whyus.feature1.description}
                          onChange={(e) => setHomeContent({
                            ...homeContent,
                            whyus: {
                              ...homeContent.whyus,
                              feature1: { ...homeContent.whyus.feature1, description: e.target.value }
                            }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Users size={20} className="text-primary" />
                      Feature 2
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={homeContent.whyus.feature2.title}
                          onChange={(e) => setHomeContent({
                            ...homeContent,
                            whyus: {
                              ...homeContent.whyus,
                              feature2: { ...homeContent.whyus.feature2, title: e.target.value }
                            }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={homeContent.whyus.feature2.description}
                          onChange={(e) => setHomeContent({
                            ...homeContent,
                            whyus: {
                              ...homeContent.whyus,
                              feature2: { ...homeContent.whyus.feature2, description: e.target.value }
                            }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Heart size={20} className="text-primary" />
                      Feature 3
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={homeContent.whyus.feature3.title}
                          onChange={(e) => setHomeContent({
                            ...homeContent,
                            whyus: {
                              ...homeContent.whyus,
                              feature3: { ...homeContent.whyus.feature3, title: e.target.value }
                            }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={homeContent.whyus.feature3.description}
                          onChange={(e) => setHomeContent({
                            ...homeContent,
                            whyus: {
                              ...homeContent.whyus,
                              feature3: { ...homeContent.whyus.feature3, description: e.target.value }
                            }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Call-to-Action Section</h2>                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CTA Title
                    </label>
                    <input
                      type="text"
                      value={homeContent.cta.title}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        cta: { ...homeContent.cta, title: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CTA Description
                    </label>
                    <textarea
                      value={homeContent.cta.description}
                      onChange={(e) => setHomeContent({
                        ...homeContent,
                        cta: { ...homeContent.cta, description: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      rows={2}
                    />
                  </div>
                </div>
              </motion.div>

            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
            {/* Phone & Email */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={24} className="text-primary" />
                Contact Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="info@eventcash.com"
                  />
                </div>
              </div>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-primary" />
                Business Address
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={contactInfo.address.street}
                    onChange={(e) => setContactInfo({ 
                      ...contactInfo, 
                      address: { ...contactInfo.address, street: e.target.value }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="123 Culinary Lane"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={contactInfo.address.city}
                      onChange={(e) => setContactInfo({ 
                        ...contactInfo, 
                        address: { ...contactInfo.address, city: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="Gourmet City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={contactInfo.address.state}
                      onChange={(e) => setContactInfo({ 
                        ...contactInfo, 
                        address: { ...contactInfo.address, state: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="FC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      value={contactInfo.address.zip}
                      onChange={(e) => setContactInfo({ 
                        ...contactInfo, 
                        address: { ...contactInfo.address, zip: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={contactInfo.address.country}
                      onChange={(e) => setContactInfo({ 
                        ...contactInfo, 
                        address: { ...contactInfo.address, country: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Business Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={24} className="text-primary" />
                Business Hours
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monday - Friday
                  </label>
                  <input
                    type="text"
                    value={contactInfo.hours.weekdays}
                    onChange={(e) => setContactInfo({ 
                      ...contactInfo, 
                      hours: { ...contactInfo.hours, weekdays: e.target.value }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="9:00 AM - 6:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Saturday - Sunday
                  </label>
                  <input
                    type="text"
                    value={contactInfo.hours.weekends}
                    onChange={(e) => setContactInfo({ 
                      ...contactInfo, 
                      hours: { ...contactInfo.hours, weekends: e.target.value }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="10:00 AM - 4:00 PM"
                  />
                </div>
              </div>
            </motion.div>

            {/* Map Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-primary" />
                Map Location
              </h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Maps Embed Code or URL
                </label>
                <textarea
                  value={contactInfo.mapUrl || ''}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    
                    // Auto-extract URL from iframe code if user pastes the whole iframe
                    if (value.includes('<iframe') && value.includes('src=')) {
                      const srcMatch = value.match(/src=["']([^"']+)["']/);
                      if (srcMatch && srcMatch[1]) {
                        value = srcMatch[1];
                      }
                    }
                    
                    setContactInfo({ ...contactInfo, mapUrl: value });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black font-mono text-sm"
                  rows={4}
                  placeholder="Paste either the full iframe code OR just the URL..."
                />
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📍 How to get your map:</p>
                  <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                    <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Maps</a></li>
                    <li>Search for your business location</li>
                    <li>Click the <strong>"Share"</strong> button</li>
                    <li>Click the <strong>"Embed a map"</strong> tab</li>
                    <li>Copy the <strong>entire iframe code</strong> and paste it here</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-2 font-semibold">
                    ✨ Tip: You can paste the entire iframe code - we'll automatically extract the URL!
                  </p>
                </div>
                {contactInfo.mapUrl && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-900 mb-1">✓ Map URL Configured:</p>
                    <p className="text-xs text-green-700 font-mono break-all">
                      {contactInfo.mapUrl.substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Facebook size={24} className="text-primary" />
                Social Media Links
              </h2>
              <p className="text-sm text-gray-500 mb-5">Check the box next to each platform to show it on the website. Uncheck to hide it.</p>

              <div className="space-y-4">
                {/* Facebook */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Facebook size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Facebook</span>
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show-facebook"
                        checked={contactInfo.social.showFacebook !== false}
                        onChange={(e) => setContactInfo({
                          ...contactInfo,
                          social: { ...contactInfo.social, showFacebook: e.target.checked }
                        })}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                      <label htmlFor="show-facebook" className="text-sm font-semibold text-gray-600 cursor-pointer select-none">
                        Show on website
                      </label>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={contactInfo.social.facebook}
                    onChange={(e) => setContactInfo({
                      ...contactInfo,
                      social: { ...contactInfo.social, facebook: e.target.value }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="https://facebook.com/eventcash"
                  />
                </div>

                {/* Instagram */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Instagram size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Instagram</span>
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show-instagram"
                        checked={contactInfo.social.showInstagram !== false}
                        onChange={(e) => setContactInfo({
                          ...contactInfo,
                          social: { ...contactInfo.social, showInstagram: e.target.checked }
                        })}
                        className="w-4 h-4 accent-pink-600 cursor-pointer"
                      />
                      <label htmlFor="show-instagram" className="text-sm font-semibold text-gray-600 cursor-pointer select-none">
                        Show on website
                      </label>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={contactInfo.social.instagram}
                    onChange={(e) => setContactInfo({
                      ...contactInfo,
                      social: { ...contactInfo.social, instagram: e.target.value }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="https://instagram.com/eventcash"
                  />
                </div>

                {/* Twitter */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Twitter size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Twitter / X</span>
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show-twitter"
                        checked={contactInfo.social.showTwitter !== false}
                        onChange={(e) => setContactInfo({
                          ...contactInfo,
                          social: { ...contactInfo.social, showTwitter: e.target.checked }
                        })}
                        className="w-4 h-4 accent-sky-500 cursor-pointer"
                      />
                      <label htmlFor="show-twitter" className="text-sm font-semibold text-gray-600 cursor-pointer select-none">
                        Show on website
                      </label>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={contactInfo.social.twitter}
                    onChange={(e) => setContactInfo({
                      ...contactInfo,
                      social: { ...contactInfo.social, twitter: e.target.value }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="https://twitter.com/eventcash"
                  />
                </div>
              </div>
            </motion.div>
          </div>
          )}

          {/* Save Button (Bottom) - Only show for content and contact tabs */}
          {(activeTab === 'content' || activeTab === 'contact') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex justify-end"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={activeTab === 'contact' ? handleSaveContact : handleSaveContent}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-xl disabled:opacity-50"
              >
                <Save size={24} />
                {saving ? 'Saving...' : 'Save All Changes'}
              </motion.button>
            </motion.div>
          )}

          {/* Packages & Add-ons Tab */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              {/* Sub-tabs */}              <div className="flex gap-2">
                <button
                  onClick={() => setPackagesSubTab('packages')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    packagesSubTab === 'packages'
                      ? 'bg-white text-primary border-2 border-primary shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Packages
                </button>
                <button
                  onClick={() => setPackagesSubTab('addons')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    packagesSubTab === 'addons'
                      ? 'bg-white text-primary border-2 border-primary shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Add-ons
                </button>
              </div>

              {/* Packages Section */}
              {packagesSubTab === 'packages' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Packages Management</h2>
                      <p className="text-gray-600 mt-1">Create and manage your catering packages</p>
                      <p className="text-xs text-gray-500 mt-1">Debug: {packages.length} packages loaded, loading: {loadingPackages.toString()}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openAddPackageModal}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold shadow-lg"
                    >
                      <Plus size={20} />
                      Add Package
                    </motion.button>
                  </div>

                  {loadingPackages ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                      <p className="text-gray-600 mt-4">Loading packages...</p>
                    </div>
                  ) : (
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

                            <div className="p-6">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                              <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                              
                              <div className="mb-4">
                                <p className="text-3xl font-bold text-primary">₱{pkg.price.toLocaleString()}.00</p>
                              </div>

                              <div className="space-y-2 mb-4">
                                {pkg.features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>

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
                </div>
              )}

              {/* Add-ons Section */}
              {packagesSubTab === 'addons' && (
                <PackagesAddonsManager />
              )}
            </div>
          )}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">

              {/* Business Name & TIN */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award size={24} className="text-primary" />
                  Business Identity
                </h2>
                <p className="text-sm text-gray-500 mb-5">This information appears on all generated Sales Invoices and Official Receipts (BIR-compliant).</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessInfo.businessName}
                      onChange={e => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="EventCash Catering Services"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      value={businessInfo.tinNumber}
                      onChange={e => setBusinessInfo(prev => ({ ...prev, tinNumber: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="000-000-000-000"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Contact Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone size={24} className="text-primary" />
                  Contact Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={businessInfo.email}
                      onChange={e => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="info@eventcash.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={e => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Business Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={24} className="text-primary" />
                  Business Address
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    value={businessInfo.address}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="123 Main Street, Barangay, City, Province 00000"
                    rows={3}
                  />
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-end"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveBusiness}
                  disabled={savingBusiness}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-xl disabled:opacity-50"
                >
                  <Save size={20} />
                  {savingBusiness ? 'Saving...' : 'Save Business Info'}
                </motion.button>
              </motion.div>
            </div>
          )}

        </div>
      </div>

      {/* Add/Edit Package Modal */}
      {showPackageModal && (
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
                  setShowPackageModal(false);
                  setEditingPackage(null);
                  resetPackageForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Package Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={packageFormData.name}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="e.g., Grand Celebration"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={packageFormData.description}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="Brief description of the package"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₱) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={packageFormData.price}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Package Images (Unlimited)
                </label>
                
                {packageFormData.gallery.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {packageFormData.gallery.map((imageUrl, index) => (
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
                          {packageFormData.gallery.length === 0 ? 'Click to upload first image' : 'Click to add more images'}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB each</p>
                        {packageFormData.gallery.length > 0 && (
                          <p className="text-primary text-sm mt-1 font-semibold">
                            {packageFormData.gallery.length} image{packageFormData.gallery.length !== 1 ? 's' : ''} uploaded
                          </p>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Features <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {packageFormData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        placeholder={`Feature ${index + 1}`}
                      />
                      {packageFormData.features.length > 1 && (
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color Gradient (if no image)
                </label>
                <select
                  value={packageFormData.gradient}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, gradient: e.target.value }))}
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

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowPackageModal(false);
                  setEditingPackage(null);
                  resetPackageForm();
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
