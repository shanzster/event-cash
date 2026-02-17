'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Search, User, X, Sparkles } from 'lucide-react';
import { packages as staticPackages, eventTypes, serviceTypes, additionalFoodItems, additionalServices } from '@/lib/packages';
import { Package } from '@/types/booking';
import { formatCurrency } from '@/lib/currency';
import { isDateClosed } from '@/lib/closedDays';

const MapSelector = dynamic(() => import('./MapSelector'), { ssr: false });

interface RegisteredClient {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
}

interface BookForClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  onBookingCreated?: () => void;
}

export default function BookForClientModal({ isOpen, onClose, managerId, onBookingCreated }: BookForClientModalProps) {
  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<'registered' | 'guest' | null>(null);
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<RegisteredClient | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);

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
      }
    };

    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

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

  // Fetch registered clients
  useEffect(() => {
    if (!isOpen) return;

    const fetchClients = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('userRole', '==', 'customer'));
        const querySnapshot = await getDocs(q);
        
        const clients = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          email: doc.data().email,
          displayName: doc.data().displayName,
          phoneNumber: doc.data().phoneNumber,
        })) as RegisteredClient[];
        
        setRegisteredClients(clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, [isOpen]);

  const handleSelectClient = (client: RegisteredClient) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      customerName: client.displayName,
      customerEmail: client.email,
      customerPhone: client.phoneNumber || '',
    }));
    setStep(2);
  };

  const handleTimeChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTimeSelection = { ...timeSelection, [field]: value };
    setTimeSelection(newTimeSelection);
    
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

  const filteredClients = registeredClients.filter(client =>
    client.displayName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Get addons based on service type
  const getAvailableAddons = () => {
    const serviceType = formData.serviceType;
    
    if (serviceType === 'food-only') {
      return { food: additionalFoodItems, services: [] };
    } else if (serviceType === 'service-only') {
      return { food: [], services: additionalServices };
    } else if (serviceType === 'mixed') {
      return { food: additionalFoodItems, services: additionalServices };
    }
    return { food: [], services: [] };
  };

  const availableAddons = getAvailableAddons();

  const handleAddonsToggle = (addonId: string, type: 'food' | 'service') => {
    if (type === 'food') {
      setFormData(prev => ({
        ...prev,
        additionalFood: prev.additionalFood.includes(addonId)
          ? prev.additionalFood.filter(id => id !== addonId)
          : [...prev.additionalFood, addonId]
      }));
    } else {
      setFormData(prev => {
        const existing = prev.additionalServices.find(s => s.id === addonId);
        if (existing) {
          return {
            ...prev,
            additionalServices: prev.additionalServices.filter(s => s.id !== addonId)
          };
        } else {
          return {
            ...prev,
            additionalServices: [...prev.additionalServices, { id: addonId, quantity: 1 }]
          };
        }
      });
    }
  };

  const handleServiceQuantityChange = (addonId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.map(s =>
        s.id === addonId ? { ...s, quantity: Math.max(1, quantity) } : s
      )
    }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({ ...prev, location }));
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
    if (!selectedPackage || !selectedClient) return;

    setIsSubmitting(true);
    
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
        userId: selectedClient.uid,
        managerId: managerId,
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
        createdByManager: true,
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      // Reset and close
      onBookingCreated?.();
      handleClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBookingType(null);
    setSelectedClient(null);
    setSelectedPackage(null);
    setFormData({
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
      additionalFood: [],
      additionalServices: [],
    });
    setTimeSelection({ hour: '', minute: '', period: 'AM' });
    setClientSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl"
        >
          {/* Close Button */}
          <div className="sticky top-0 bg-white border-b flex justify-between items-center p-6 rounded-t-2xl">
            <h1 className="text-2xl font-bold text-gray-900">Book for Client</h1>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            {/* Step 0: Choose Client Type */}
            {!bookingType && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-gray-600 mb-8">Choose how you want to create this booking</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setBookingType('registered')}
                    className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="text-4xl mb-3 text-center">👤</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Registered Client</h3>
                    <p className="text-gray-700 text-sm text-center">Select from existing customers</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setBookingType('guest')}
                    className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="text-4xl mb-3 text-center">🎭</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Guest</h3>
                    <p className="text-gray-700 text-sm text-center">Book without account</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Select Client or Enter Guest Info */}
            {bookingType && !selectedClient && step === 1 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <button
                  onClick={() => setBookingType(null)}
                  className="mb-4 flex items-center gap-2 text-primary hover:underline"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  {bookingType === 'registered' ? 'Select a Client' : 'Guest Details'}
                </h2>

                {bookingType === 'registered' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-bold mb-2 text-gray-900">Search Clients</label>
                      <Search size={18} className="absolute left-3 top-10 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">No clients found</p>
                      ) : (
                        filteredClients.map(client => (
                          <motion.div
                            key={client.uid}
                            whileHover={{ x: 5 }}
                            onClick={() => handleSelectClient(client)}
                            className="p-3 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-all bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={18} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{client.displayName}</p>
                                <p className="text-xs text-gray-600 truncate">{client.email}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-gray-900">Full Name</label>
                      <input
                        type="text"
                        name="customerName"
                        placeholder="Enter full name"
                        value={formData.customerName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-gray-900">Email</label>
                      <input
                        type="email"
                        name="customerEmail"
                        placeholder="Enter email address"
                        value={formData.customerEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-gray-900">Phone Number</label>
                      <input
                        type="tel"
                        name="customerPhone"
                        placeholder="Enter phone number"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClient({
                          uid: 'guest-' + Date.now(),
                          email: formData.customerEmail,
                          displayName: formData.customerName,
                          phoneNumber: formData.customerPhone,
                        });
                        setStep(2);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-bold text-sm"
                    >
                      Continue <ChevronRight className="inline" size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Select Package */}
            {selectedClient && step === 2 && !selectedPackage && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setStep(1);
                  }}
                  className="mb-4 flex items-center gap-2 text-primary hover:underline"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <h2 className="text-xl font-bold mb-2 text-gray-900">Choose Package</h2>
                <p className="text-sm text-gray-600 mb-4">For: <span className="font-semibold">{selectedClient.displayName}</span></p>

                {packages.length === 0 ? (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
                    <Sparkles size={48} className="text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Packages Available</h3>
                    <p className="text-gray-600 mb-4">
                      You need to create packages first before booking for clients.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        window.location.href = '/owner/packages';
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Go to Package Management
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {packages.map((pkg) => (
                      <motion.div
                        key={pkg.id}
                        whileHover={{ y: -5 }}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setStep(3);
                        }}
                        className="cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-primary transition-all"
                      >
                        {pkg.imageUrl || pkg.image ? (
                          <img src={pkg.imageUrl || pkg.image} alt={pkg.name} className="w-full h-24 object-cover" />
                        ) : (
                          <div className={`w-full h-24 bg-gradient-to-br ${pkg.gradient || 'from-primary to-yellow-600'} flex items-center justify-center`}>
                            <Sparkles size={32} className="text-white" />
                          </div>
                        )}
                        <div className="p-3">
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{pkg.name}</h3>
                          <p className="text-lg font-bold text-primary">{formatCurrency(pkg.price)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Event Details */}
            {selectedClient && selectedPackage && step === 3 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <button
                  onClick={() => {
                    setSelectedPackage(null);
                    setStep(2);
                  }}
                  className="mb-4 flex items-center gap-2 text-primary hover:underline"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-900">Event Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900">Event Type</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
                    >
                      <option value="">Select event type</option>
                      {eventTypes.map((type) => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900">Service Type</label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
                    >
                      <option value="">Select service type</option>
                      {serviceTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900">Event Date</label>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900">Number of Guests</label>
                    <input
                      type="number"
                      name="guestCount"
                      placeholder="Enter number of guests"
                      value={formData.guestCount}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900">Event Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={timeSelection.hour}
                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
                      >
                        <option value="">Hour</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                      </select>
                      <select
                        value={timeSelection.minute}
                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
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
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-black"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-900">Special Requests (Optional)</label>
                    <textarea
                      name="specialRequests"
                      placeholder="Enter any special requests..."
                      value={formData.specialRequests}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none text-sm text-black"
                    />
                  </div>

                  <div className="flex justify-between gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm"
                    >
                      <ChevronLeft className="inline mr-1" size={16} /> Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold text-sm"
                    >
                      Review <ChevronRight className="inline ml-1" size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Select Location */}
            {selectedClient && selectedPackage && step === 4 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <button
                  onClick={() => setStep(3)}
                  className="mb-4 flex items-center gap-2 text-primary hover:underline"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-900">Event Location</h2>

                <div className="bg-white border-2 border-primary/20 rounded-lg p-4 mb-6">
                  <MapSelector onLocationSelect={handleLocationSelect} initialLocation={formData.location} />
                </div>

                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm"
                  >
                    <ChevronLeft className="inline mr-1" size={16} /> Back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    disabled={!formData.location.address}
                    className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    Next <ChevronRight className="inline ml-1" size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Select Add-ons */}
            {selectedClient && selectedPackage && step === 5 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <button
                  onClick={() => setStep(4)}
                  className="mb-4 flex items-center gap-2 text-primary hover:underline"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-900">Add-ons & Extras</h2>

                {!formData.serviceType ? (
                  <p className="text-gray-600 text-center py-8">Please select a service type first</p>
                ) : availableAddons.food.length === 0 && availableAddons.services.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No add-ons available for this service type</p>
                ) : (
                  <div className={`${formData.serviceType === 'mixed' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'space-y-6'}`}>
                    {/* Food Add-ons */}
                    {availableAddons.food.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-4">Food & Beverages</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableAddons.food.map((item) => (
                            <motion.div
                              key={item.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => handleAddonsToggle(item.id, 'food')}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.additionalFood.includes(item.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-primary'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={formData.additionalFood.includes(item.id)}
                                  onChange={() => {}}
                                  className="mt-1 w-5 h-5 text-primary rounded cursor-pointer"
                                />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                  <p className="text-primary font-bold text-sm">{formatCurrency(item.price)}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Add-ons */}
                    {availableAddons.services.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-4">Services & Equipment</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableAddons.services.map((item) => {
                            const isSelected = formData.additionalServices.some(s => s.id === item.id);
                            const selectedService = formData.additionalServices.find(s => s.id === item.id);
                            
                            return (
                              <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-primary'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleAddonsToggle(item.id, 'service')}
                                    className="mt-1 w-5 h-5 text-primary rounded cursor-pointer"
                                  />
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                    <p className="text-gray-600 text-xs mb-2">{formatCurrency(item.pricePerUnit)}/{item.unit}</p>
                                    {isSelected && (
                                      <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-600">Qty:</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={selectedService?.quantity || 1}
                                          onChange={(e) => handleServiceQuantityChange(item.id, parseInt(e.target.value))}
                                          className="w-16 px-2 py-1 border-2 border-primary/20 rounded text-sm text-black"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between gap-3 mt-6">
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm"
                  >
                    <ChevronLeft className="inline mr-1" size={16} /> Back
                  </button>
                  <button
                    onClick={() => setStep(6)}
                    className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold text-sm"
                  >
                    Review <ChevronRight className="inline ml-1" size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 6: Confirm & Submit */}
            {selectedClient && selectedPackage && step === 6 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Confirm Booking</h2>

                <div className="space-y-6">
                  {/* Client Information */}
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Client</h3>
                    <p className="text-lg font-semibold text-gray-900">{selectedClient.displayName}</p>
                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                    {selectedClient.phoneNumber && (
                      <p className="text-sm text-gray-600">{selectedClient.phoneNumber}</p>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Event Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Date</p>
                        <p className="font-semibold text-gray-900">{formData.eventDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">{formData.eventTime || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Event Type</p>
                        <p className="font-semibold text-gray-900">{formData.eventType || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Number of Guests</p>
                        <p className="font-semibold text-gray-900">{formData.guestCount} people</p>
                      </div>
                    </div>
                  </div>

                  {/* Package & Service */}
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Package & Service</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-gray-700">Package:</p>
                        <p className="font-semibold text-gray-900">{selectedPackage.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-700">Service Type:</p>
                        <p className="font-semibold text-gray-900">{serviceTypes.find(st => st.id === formData.serviceType)?.name || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Add-ons Breakdown */}
                  {(formData.additionalFood.length > 0 || formData.additionalServices.length > 0) && (
                    <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
                      <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Add-ons</h3>
                      <div className="space-y-2">
                        {formData.additionalFood.map(foodId => {
                          const food = additionalFoodItems.find(f => f.id === foodId);
                          return (
                            <div key={foodId} className="flex justify-between text-sm">
                              <p className="text-gray-700">{food?.name}</p>
                              <p className="text-gray-900 font-semibold">{formatCurrency(food?.price || 0)}</p>
                            </div>
                          );
                        })}
                        {formData.additionalServices.map(service => {
                          const serviceItem = additionalServices.find(s => s.id === service.id);
                          return (
                            <div key={service.id} className="flex justify-between text-sm">
                              <p className="text-gray-700">{serviceItem?.name} x{service.quantity}</p>
                              <p className="text-gray-900 font-semibold">{formatCurrency((serviceItem?.pricePerUnit || 0) * service.quantity)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/10">
                    <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase">Pricing Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <p className="text-gray-700">Package:</p>
                        <p className="text-gray-900">{formatCurrency(calculatePricing().basePrice)}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <p className="text-gray-700">Service Add-ons:</p>
                        <p className="text-gray-900">{formatCurrency(calculatePricing().servicesAddonsPrice)}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <p className="text-gray-700">Food Add-ons:</p>
                        <p className="text-gray-900">{formatCurrency(calculatePricing().foodAddonsPrice)}</p>
                      </div>
                      <div className="border-t-2 border-primary/30 pt-2 mt-2 flex justify-between">
                        <p className="font-bold text-gray-900">Estimated Total:</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(calculatePricing().totalPrice)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests & Dietary */}
                  {(formData.specialRequests || formData.dietaryRestrictions) && (
                    <div className="border-2 border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Additional Notes</h3>
                      {formData.specialRequests && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 mb-1">Special Requests</p>
                          <p className="text-sm text-gray-900">{formData.specialRequests}</p>
                        </div>
                      )}
                      {formData.dietaryRestrictions && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Dietary Restrictions</p>
                          <p className="text-sm text-gray-900">{formData.dietaryRestrictions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-3 mt-6">
                  <button
                    onClick={() => setStep(5)}
                    className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm"
                  >
                    <ChevronLeft className="inline mr-1" size={16} /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Booking'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
