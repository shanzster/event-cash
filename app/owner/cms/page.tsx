'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Home, Award, Users, Heart } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';

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

export default function CMSPage() {
  const router = useRouter();
  const { managerUser, isManager, loading: managerLoading } = useManager();
  const [activeTab, setActiveTab] = useState<'contact' | 'content'>('content');
  
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

  useEffect(() => {
    if (!managerLoading && (!isManager || !managerUser)) {
      router.push('/owner/login');
      return;
    }
    
    if (isManager) {
      fetchContactInfo();
      fetchHomeContent();
    }
  }, [isManager, managerUser, managerLoading, router]);

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
      const docRef = doc(db, 'cms', 'content');
      await setDoc(docRef, { home: homeContent }, { merge: true });
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
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
                  Google Maps Embed URL
                </label>
                <textarea
                  value={contactInfo.mapUrl || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, mapUrl: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black font-mono text-sm"
                  rows={4}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  To get the embed URL: Go to Google Maps → Search your location → Click "Share" → Click "Embed a map" → Copy the URL from the iframe src attribute
                </p>
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Facebook size={18} />
                    Facebook URL
                  </label>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Instagram size={18} />
                    Instagram URL
                  </label>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Twitter size={18} />
                    Twitter URL
                  </label>
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

          {/* Save Button (Bottom) */}
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
        </div>
      </div>
    </ManagerSidebar>
  );
}
