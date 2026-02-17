'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, MapPin, Users, Clock, FileText, ChevronRight, ChevronLeft,
  Check, Sparkles, Info, Phone, Mail, User as UserIcon,
  UtensilsCrossed, Armchair, Table2, Plus, Minus, ShoppingCart
} from 'lucide-react';
import { packages as staticPackages, eventTypes, serviceTypes, additionalFoodItems, additionalServices } from '@/lib/packages';
import { Package } from '@/types/booking';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isDateClosed } from '@/lib/closedDays';
import { format } from 'date-fns';

const MapSelector = dynamic(() => import('@/components/MapSelector'), { ssr: false });

export default function NewBooking() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Fetch packages from Firestore
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packagesRef = collection(db, 'packages');
        const snapshot = await getDocs(packagesRef);
        
        const packagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Package[];
        
        setPackages(packagesData.sort((a, b) => a.price - b.price));
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  // Convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventType: '',
    serviceType: '',
    eventDate: '',
    eventTime: '',
    guestCount: '',
    location: { lat: 40.7128, lng: -74.0060, address: '' },
    specialRequests: '',
    dietaryRestrictions: '',
    additionalFood: [] as string[],
    additionalServices: [] as { id: string; quantity: number }[],
  });

  const [timeSelection, setTimeSelection] = useState({
    hour: '',
    minute: '',
    period: 'AM'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.displayName || '',
        customerEmail: user.email || '',
      }));
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTimeSelection = { ...timeSelection, [field]: value };
    setTimeSelection(newTimeSelection);
    
    // Convert to 24-hour format for storage
    if (newTimeSelection.hour && newTimeSelection.minute) {
      let hour24 = parseInt(newTimeSelection.hour, 10);
      if (newTimeSelection.period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (newTimeSelection.period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      const formattedTime = `${hour24.toString().padStart(2, '0')}:${newTimeSelection.minute}`;
      setFormData(prev => ({ ...prev, eventTime: formattedTime }));
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({ ...prev, location }));
  };

  const toggleFoodItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalFood: prev.additionalFood.includes(itemId)
        ? prev.additionalFood.filter(id => id !== itemId)
        : [...prev.additionalFood, itemId]
    }));
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setFormData(prev => {
      const existing = prev.additionalServices.find(s => s.id === serviceId);
      if (quantity <= 0) {
        return {
          ...prev,
          additionalServices: prev.additionalServices.filter(s => s.id !== serviceId)
        };
      }
      if (existing) {
        return {
          ...prev,
          additionalServices: prev.additionalServices.map(s =>
            s.id === serviceId ? { ...s, quantity } : s
          )
        };
      }
      return {
        ...prev,
        additionalServices: [...prev.additionalServices, { id: serviceId, quantity }]
      };
    });
  };

  const calculatePricing = () => {
    const basePrice = selectedPackage?.price || 0;
    const guestCount = parseInt(formData.guestCount) || 0;
    const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceType);
    const servicePrice = selectedServiceType ? selectedServiceType.pricePerGuest * guestCount : 0;
    
    const foodAddonsPrice = formData.additionalFood.reduce((total, foodId) => {
      const item = additionalFoodItems.find(f => f.id === foodId);
      return total + (item?.price || 0);
    }, 0);
    
    const servicesAddonsPrice = formData.additionalServices.reduce((total, service) => {
      const item = additionalServices.find(s => s.id === service.id);
      return total + (item?.pricePerUnit || 0) * service.quantity;
    }, 0);
    
    const totalPrice = basePrice + servicePrice + foodAddonsPrice + servicesAddonsPrice;
    
    return { basePrice, servicePrice, foodAddonsPrice, servicesAddonsPrice, totalPrice };
  };

  const handleSubmit = async () => {
    if (!user || !selectedPackage) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      // Check if the selected date is closed
      const isClosed = await isDateClosed(formData.eventDate);
      if (isClosed) {
        alert('Sorry, the selected date is not available for bookings. Please choose another date.');
        setIsSubmitting(false);
        return;
      }

      const pricing = calculatePricing();
      const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceType);
      
      const bookingData = {
        userId: user.uid,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        eventType: formData.eventType,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        serviceType: formData.serviceType,
        serviceTypeName: selectedServiceType?.name || '',
        eventDate: new Date(formData.eventDate),
        eventTime: formData.eventTime,
        guestCount: parseInt(formData.guestCount),
        location: formData.location,
        specialRequests: formData.specialRequests,
        dietaryRestrictions: formData.dietaryRestrictions,
        additionalFood: formData.additionalFood,
        additionalServices: formData.additionalServices,
        status: 'pending',
        basePrice: pricing.basePrice,
        servicePrice: pricing.servicePrice,
        foodAddonsPrice: pricing.foodAddonsPrice,
        servicesAddonsPrice: pricing.servicesAddonsPrice,
        totalPrice: pricing.totalPrice,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      router.push(`/booking/${docRef.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = selectedPackage !== null;
  const canProceedToStep3 = 
    formData.customerName &&
    formData.customerEmail &&
    formData.customerPhone &&
    formData.eventType &&
    formData.serviceType &&
    formData.eventDate &&
    formData.eventTime &&
    formData.guestCount;
  const canProceedToStep4 = true;
  const canSubmit = formData.location.address !== '';

  if (loading || !user) {
    return null;
  }

  const pricing = calculatePricing();
  const stepVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
  };

  return (
    <>
      <Navigation />
      <main className="relative z-10 min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="inline-block mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
                <Sparkles size={40} className="text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
              Create Your Perfect Event
            </h1>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              Follow our simple 4-step process to book your catering service
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10" />
                <motion.div 
                  className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-yellow-600 -z-10"
                  initial={{ width: '0%' }}
                  animate={{ width: step === 1 ? '0%' : step === 2 ? '33%' : step === 3 ? '66%' : '100%' }}
                  transition={{ duration: 0.5 }}
                />

                {[
                  { num: 1, label: 'Package', icon: Sparkles },
                  { num: 2, label: 'Details', icon: FileText },
                  { num: 3, label: 'Add-ons', icon: ShoppingCart },
                  { num: 4, label: 'Location', icon: MapPin }
                ].map((s) => (
                  <div key={s.num} className="flex flex-col items-center relative">
                    <motion.div whileHover={{ scale: 1.1 }} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-lg ${
                        step >= s.num ? 'bg-gradient-to-r from-primary to-yellow-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'
                      }`}>
                      {step > s.num ? <Check size={24} /> : <s.icon size={20} />}
                    </motion.div>
                    <span className={`text-xs sm:text-sm font-semibold mt-3 absolute top-14 whitespace-nowrap ${step >= s.num ? 'text-primary' : 'text-gray-500'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-3 text-gray-900 text-center">Choose Your Perfect Package</h2>
                  <p className="text-gray-600 text-center mb-8">Select the package that best fits your event needs</p>
                </div>
                
                {loadingPackages ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600 font-semibold">Loading packages...</p>
                    </div>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="backdrop-blur-xl bg-yellow-50/95 border-2 border-yellow-200 rounded-3xl p-12 mb-12 text-center shadow-xl">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                      <Sparkles size={64} className="text-yellow-600 mx-auto mb-6" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Packages Available</h3>
                    <p className="text-gray-700 mb-6 max-w-md mx-auto">
                      We're currently updating our catering packages. Please check back soon or contact us directly for custom event planning.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.a
                        href="/contact"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-lg"
                      >
                        Contact Us
                      </motion.a>
                      <motion.a
                        href="/"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-xl font-bold shadow-lg"
                      >
                        Back to Home
                      </motion.a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {packages.map((pkg, index) => (
                      <motion.div key={pkg.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -15, scale: 1.03 }} onHoverStart={() => setHoveredPackage(pkg.id)} onHoverEnd={() => setHoveredPackage(null)}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`cursor-pointer backdrop-blur-xl bg-white/95 border-2 rounded-3xl overflow-hidden shadow-xl transition-all relative ${
                          selectedPackage?.id === pkg.id ? 'border-primary ring-4 ring-primary/30 shadow-2xl' : 'border-primary/20 hover:border-primary/60'
                        }`}>
                        {selectedPackage?.id === pkg.id && (
                          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-4 right-4 z-10 w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                            <Check size={24} className="text-white" />
                          </motion.div>
                        )}
                        <div className="relative h-56 overflow-hidden">
                          {pkg.imageUrl || pkg.image ? (
                            <motion.img 
                              src={pkg.imageUrl || pkg.image} 
                              alt={pkg.name} 
                              className="w-full h-full object-cover"
                              animate={{ scale: hoveredPackage === pkg.id ? 1.1 : 1 }} 
                              transition={{ duration: 0.3 }} 
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${pkg.gradient || 'from-primary to-yellow-600'} flex items-center justify-center`}>
                              <Sparkles size={64} className="text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-2xl font-bold text-white drop-shadow-lg">{pkg.name}</h3>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Sparkles size={28} className="text-primary" />
                              <span className="text-4xl font-bold text-primary">₱{pkg.price.toLocaleString()}.00</span>
                            </div>
                            <span className="text-sm text-gray-600 font-medium">base price</span>
                          </div>
                          <p className="text-gray-700 mb-6 leading-relaxed">{pkg.description}</p>
                          <div className="space-y-2 mb-6">
                            {pkg.features.slice(0, 5).map((feature, idx) => (
                              <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.05 }}
                                className="flex items-start gap-2 text-sm text-gray-700">
                                <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </motion.div>
                            ))}
                          </div>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPackage(pkg)}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${
                              selectedPackage?.id === pkg.id ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}>
                            {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Package'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }} onClick={() => canProceedToStep2 && setStep(2)}
                    disabled={!canProceedToStep2}
                    className="px-10 py-4 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue to Event Details <ChevronRight size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-3 text-gray-900 text-center">Tell Us About Your Event</h2>
                  <p className="text-gray-600 text-center mb-8">Provide details so we can make your event perfect</p>
                </div>

                {selectedPackage && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-3xl p-6 mb-8 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles size={28} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Selected Package</p>
                          <h3 className="text-2xl font-bold text-gray-900">{selectedPackage.name}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-medium">Base Price</p>
                        <p className="text-3xl font-bold text-primary">₱{selectedPackage.price.toLocaleString()}.00</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl p-8 shadow-xl mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <UserIcon size={18} className="text-primary" /> Full Name
                      </label>
                      <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Mail size={18} className="text-primary" /> Email
                      </label>
                      <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} required
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Phone size={18} className="text-primary" /> Phone Number
                      </label>
                      <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} required placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-primary" /> Event Type
                      </label>
                      <select name="eventType" value={formData.eventType} onChange={handleChange} required
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all">
                        <option value="">Select event type</option>
                        {eventTypes.map((type) => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Calendar size={18} className="text-primary" /> Event Date
                      </label>
                      <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Clock size={18} className="text-primary" /> Event Time
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <select 
                          value={timeSelection.hour} 
                          onChange={(e) => handleTimeChange('hour', e.target.value)}
                          required
                          className="px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all"
                        >
                          <option value="">Hour</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                            <option key={hour} value={hour}>{hour}</option>
                          ))}
                        </select>
                        <select 
                          value={timeSelection.minute} 
                          onChange={(e) => handleTimeChange('minute', e.target.value)}
                          required
                          className="px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all"
                        >
                          <option value="">Min</option>
                          {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                            <option key={minute} value={minute.toString().padStart(2, '0')}>
                              {minute.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <select 
                          value={timeSelection.period} 
                          onChange={(e) => handleTimeChange('period', e.target.value)}
                          required
                          className="px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Users size={18} className="text-primary" /> Number of Guests
                      </label>
                      <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} required min="1" placeholder="50"
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <UtensilsCrossed size={18} className="text-primary" /> Service Type
                      </label>
                      <select name="serviceType" value={formData.serviceType} onChange={handleChange} required
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 transition-all">
                        <option value="">Select service type</option>
                        {serviceTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="md:col-span-2">
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <Info size={18} className="text-primary" /> Dietary Restrictions (Optional)
                      </label>
                      <textarea name="dietaryRestrictions" value={formData.dietaryRestrictions} onChange={handleChange} rows={3}
                        placeholder="Any allergies or dietary requirements..."
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 resize-none transition-all" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="md:col-span-2">
                      <label className="block text-sm font-bold mb-2 text-gray-900 flex items-center gap-2">
                        <FileText size={18} className="text-primary" /> Special Requests (Optional)
                      </label>
                      <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows={3}
                        placeholder="Any special requests or notes..."
                        className="w-full px-4 py-3 bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-gray-900 resize-none transition-all" />
                    </motion.div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <motion.button whileHover={{ scale: 1.05, x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => setStep(1)}
                    className="px-10 py-4 bg-gray-200 text-gray-900 rounded-xl font-bold shadow-lg flex items-center gap-3">
                    <ChevronLeft size={24} /> Back
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }} onClick={() => canProceedToStep3 && setStep(3)}
                    disabled={!canProceedToStep3}
                    className="px-10 py-4 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue to Add-ons <ChevronRight size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-3 text-gray-900 text-center">Customize Your Experience</h2>
                  <p className="text-gray-600 text-center mb-8">Add extra items based on your service type selection</p>
                  
                  {/* Service Type Info Badge */}
                  <div className="max-w-2xl mx-auto mb-6">
                    <div className="bg-gradient-to-r from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-2xl p-4">
                      <div className="flex items-center justify-center gap-3">
                        <Info size={20} className="text-primary" />
                        <p className="text-gray-900 font-semibold">
                          Service Type: <span className="text-primary">{serviceTypes.find(st => st.id === formData.serviceType)?.name}</span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 text-center mt-2">
                        {formData.serviceType === 'food-only' && 'You can add additional food items below'}
                        {formData.serviceType === 'service-only' && 'You can add additional services and equipment below'}
                        {formData.serviceType === 'mixed' && 'You can add both food items and services below'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${formData.serviceType === 'mixed' ? 'lg:grid-cols-2' : ''} gap-8 mb-8`}>
                  {/* Food Section - Show only for food-only or mixed */}
                  {(formData.serviceType === 'food-only' || formData.serviceType === 'mixed') && (
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                      className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl p-8 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                          <UtensilsCrossed size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Additional Food</h3>
                          <p className="text-sm text-gray-600">Select extra items to add</p>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {['appetizers', 'stations', 'desserts', 'beverages'].map((category) => (
                          <div key={category}>
                            <h4 className="text-sm font-bold text-primary uppercase mb-2 mt-4 first:mt-0">
                              {category}
                            </h4>
                            {additionalFoodItems.filter(item => item.category === category).map((item, idx) => (
                              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 * idx }}
                                onClick={() => toggleFoodItem(item.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  formData.additionalFood.includes(item.id)
                                    ? 'border-primary bg-primary/10 shadow-md'
                                    : 'border-gray-200 hover:border-primary/50 bg-white'
                                }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                      formData.additionalFood.includes(item.id)
                                        ? 'border-primary bg-primary'
                                        : 'border-gray-300'
                                    }`}>
                                      {formData.additionalFood.includes(item.id) && (
                                        <Check size={16} className="text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">{item.name}</p>
                                    </div>
                                  </div>
                                  <p className="text-lg font-bold text-primary">₱{item.price}.00</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t-2 border-primary/20">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-gray-900">Food Add-ons Total:</p>
                          <p className="text-2xl font-bold text-primary">₱{pricing.foodAddonsPrice.toLocaleString()}.00</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Services Section - Show only for service-only or mixed */}
                  {(formData.serviceType === 'service-only' || formData.serviceType === 'mixed') && (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl p-8 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Armchair size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Additional Services</h3>
                          <p className="text-sm text-gray-600">Add furniture and equipment</p>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {additionalServices.map((service, idx) => {
                          const quantity = formData.additionalServices.find(s => s.id === service.id)?.quantity || 0;
                          return (
                            <motion.div key={service.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * idx }}
                              className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-primary/50 transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900">{service.name}</p>
                                  <p className="text-sm text-gray-600">₱{service.pricePerUnit}.00 per {service.unit}</p>
                                </div>
                                <p className="text-lg font-bold text-primary">₱{(service.pricePerUnit * quantity).toLocaleString()}.00</p>
                              </div>
                              <div className="flex items-center gap-3">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => updateServiceQuantity(service.id, Math.max(0, quantity - 1))}
                                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700 transition-all">
                                <Minus size={20} />
                              </motion.button>
                              <div className="flex-1 text-center">
                                <input type="number" value={quantity} onChange={(e) => updateServiceQuantity(service.id, parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-center font-bold text-gray-900 focus:outline-none focus:border-primary" />
                              </div>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                                className="w-10 h-10 bg-gradient-to-r from-primary to-yellow-600 hover:shadow-lg rounded-lg flex items-center justify-center font-bold text-white transition-all">
                                <Plus size={20} />
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-6 border-t-2 border-primary/20">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-gray-900">Services Add-ons Total:</p>
                        <p className="text-2xl font-bold text-primary">₱{pricing.servicesAddonsPrice.toLocaleString()}.00</p>
                      </div>
                    </div>
                  </motion.div>
                  )}
                </div>

                {/* Pricing Summary */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-3xl p-8 mb-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Estimated Total</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Package Base Price:</p>
                      <p className="font-bold text-gray-900">₱{pricing.basePrice.toLocaleString()}.00</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Service Type ({formData.guestCount} guests):</p>
                      <p className="font-bold text-gray-900">₱{pricing.servicePrice.toLocaleString()}.00</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Food Add-ons:</p>
                      <p className="font-bold text-gray-900">₱{pricing.foodAddonsPrice.toLocaleString()}.00</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Services Add-ons:</p>
                      <p className="font-bold text-gray-900">₱{pricing.servicesAddonsPrice.toLocaleString()}.00</p>
                    </div>
                    <div className="pt-4 border-t-2 border-primary/30 flex justify-between items-center">
                      <p className="text-xl font-bold text-gray-900">Estimated Price:</p>
                      <p className="text-4xl font-bold text-primary">₱{pricing.totalPrice.toLocaleString()}.00</p>
                    </div>
                  </div>
                </motion.div>

                <div className="flex justify-between">
                  <motion.button whileHover={{ scale: 1.05, x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => setStep(2)}
                    className="px-10 py-4 bg-gray-200 text-gray-900 rounded-xl font-bold shadow-lg flex items-center gap-3">
                    <ChevronLeft size={24} /> Back
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }} onClick={() => setStep(4)}
                    className="px-10 py-4 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-3">
                    Continue to Location <ChevronRight size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-3 text-gray-900 text-center">Where's Your Event?</h2>
                  <p className="text-gray-600 text-center mb-8">Pin your event location on the map</p>
                </div>

                <div className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl p-8 shadow-xl mb-8">
                  <MapSelector onLocationSelect={handleLocationSelect} initialLocation={formData.location} />
                  {formData.location.address && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <MapPin size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-green-900 text-lg mb-1">Location Selected!</p>
                          <p className="text-green-800 font-medium">{formData.location.address}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Final Booking Summary */}
                {selectedPackage && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-3xl p-8 mb-8 shadow-xl">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">Final Booking Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-primary" />
                        <div>
                          <p className="text-sm text-gray-600">Package</p>
                          <p className="font-bold text-gray-900">{selectedPackage.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-primary" />
                        <div>
                          <p className="text-sm text-gray-600">Date & Time</p>
                          <p className="font-bold text-gray-900">{formData.eventDate} at {formatTimeTo12Hour(formData.eventTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-primary" />
                        <div>
                          <p className="text-sm text-gray-600">Guests</p>
                          <p className="font-bold text-gray-900">{formData.guestCount} people</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <UtensilsCrossed size={20} className="text-primary" />
                        <div>
                          <p className="text-sm text-gray-600">Service Type</p>
                          <p className="font-bold text-gray-900">{serviceTypes.find(st => st.id === formData.serviceType)?.name}</p>
                        </div>
                      </div>
                      {formData.additionalFood.length > 0 && (
                        <div className="flex items-start gap-3 md:col-span-2">
                          <UtensilsCrossed size={20} className="text-primary mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Additional Food ({formData.additionalFood.length} items)</p>
                            <p className="font-bold text-gray-900 text-sm">
                              {formData.additionalFood.map(id => additionalFoodItems.find(f => f.id === id)?.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                      {formData.additionalServices.length > 0 && (
                        <div className="flex items-start gap-3 md:col-span-2">
                          <Armchair size={20} className="text-primary mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Additional Services</p>
                            <p className="font-bold text-gray-900 text-sm">
                              {formData.additionalServices.map(s => {
                                const service = additionalServices.find(as => as.id === s.id);
                                return `${service?.name} (${s.quantity})`;
                              }).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pt-6 border-t-2 border-primary/30">
                      <div className="flex justify-between items-center">
                        <p className="text-xl font-bold text-gray-900">Estimated Price:</p>
                        <p className="text-4xl font-bold text-primary">₱{pricing.totalPrice.toLocaleString()}.00</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between">
                  <motion.button whileHover={{ scale: 1.05, x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => setStep(3)}
                    className="px-10 py-4 bg-gray-200 text-gray-900 rounded-xl font-bold shadow-lg flex items-center gap-3">
                    <ChevronLeft size={24} /> Back
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!canSubmit || isSubmitting}
                    className="px-10 py-4 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Check size={24} />
                    Complete Booking
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isSubmitting && setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary to-yellow-600 p-6 rounded-t-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <Check size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Confirm Your Booking</h2>
                    <p className="text-white/90">Please review your booking details</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Package Info */}
                {selectedPackage && (
                  <div className="bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles size={24} className="text-primary" />
                      <h3 className="text-xl font-bold text-gray-900">Package Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Package</p>
                        <p className="text-lg font-bold text-gray-900">{selectedPackage.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Event Type</p>
                        <p className="text-lg font-bold text-gray-900">{formData.eventType}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Event Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Date</p>
                        <p className="font-bold text-gray-900">{formData.eventDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Time</p>
                        <p className="font-bold text-gray-900">{formatTimeTo12Hour(formData.eventTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Guests</p>
                        <p className="font-bold text-gray-900">{formData.guestCount} people</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <MapPin size={18} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Location</p>
                        <p className="font-bold text-gray-900 text-sm line-clamp-2">{formData.location.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserIcon size={20} className="text-primary" />
                    Contact Information
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <UserIcon size={16} className="text-gray-600" />
                      <span className="text-gray-900 font-medium">{formData.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-600" />
                      <span className="text-gray-900 font-medium">{formData.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-600" />
                      <span className="text-gray-900 font-medium">{formData.customerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                {selectedPackage && (
                  <div className="bg-gradient-to-br from-primary/20 to-yellow-600/20 border-2 border-primary/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold text-lg">Total Amount</span>
                      <span className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                        ₱{calculatePricing().totalPrice.toLocaleString()}.00
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Payment will be processed after confirmation</p>
                  </div>
                )}

                {/* Terms */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Note:</span> By confirming this booking, you agree to our terms and conditions. 
                    Your booking will be marked as pending and our team will contact you shortly to confirm the details.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 rounded-b-3xl flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-xl font-bold shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={24} />
                      Confirm Booking
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
