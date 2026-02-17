'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Heart, Briefcase, PartyPopper, GraduationCap, Baby, Gift, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EventType {
  name: string;
  description: string;
  fullDescription: string;
  features: string[];
  icon: any;
  gradient: string;
  defaultImages: string[];
  gallery?: string[]; // Custom images from Firestore
}

// Hardcoded event types
const defaultEventTypes: EventType[] = [
  {
    name: 'Weddings',
    description: 'Make your special day unforgettable with our exquisite wedding catering',
    fullDescription: 'Create magical moments with our comprehensive wedding catering services. From intimate ceremonies to grand receptions, we craft personalized menus that reflect your love story.',
    features: [
      'Customized menu planning',
      'Professional service staff',
      'Elegant presentation',
      'Cake and dessert options',
      'Beverage service',
      'Dietary accommodations'
    ],
    icon: Heart,
    gradient: 'from-pink-500 to-rose-600',
    defaultImages: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80'
    ]
  },
  {
    name: 'Corporate Events',
    description: 'Professional catering solutions for your business gatherings',
    fullDescription: 'Elevate your corporate events with our professional catering services. Perfect for conferences, seminars, product launches, and business meetings.',
    features: [
      'Breakfast & lunch packages',
      'Coffee break services',
      'Formal dinner options',
      'Buffet or plated service',
      'Professional setup',
      'Timely service'
    ],
    icon: Briefcase,
    gradient: 'from-blue-500 to-indigo-600',
    defaultImages: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80'
    ]
  },
  {
    name: 'Birthday Parties',
    description: 'Celebrate another year with delicious food and joyful memories',
    fullDescription: 'Make birthdays extra special with our fun and festive catering options. From kids parties to milestone celebrations, we bring the party to life.',
    features: [
      'Kid-friendly menus',
      'Themed decorations',
      'Birthday cake included',
      'Party games coordination',
      'Flexible packages',
      'Entertainment options'
    ],
    icon: PartyPopper,
    gradient: 'from-purple-500 to-pink-600',
    defaultImages: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80',
      'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&q=80',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'
    ]
  },
  {
    name: 'Graduations',
    description: 'Honor achievements with a memorable celebration feast',
    fullDescription: 'Celebrate academic milestones with our graduation catering services. Perfect for intimate family gatherings or large graduation parties.',
    features: [
      'Buffet-style service',
      'Formal dinner options',
      'Dessert stations',
      'Photo-worthy presentations',
      'Flexible timing',
      'Setup and cleanup'
    ],
    icon: GraduationCap,
    gradient: 'from-green-500 to-emerald-600',
    defaultImages: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
      'https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&q=80',
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80'
    ]
  },
  {
    name: 'Baby Showers',
    description: 'Welcome the little one with sweet treats and savory delights',
    fullDescription: 'Celebrate the upcoming arrival with our charming baby shower catering. We create adorable and delicious spreads perfect for this special occasion.',
    features: [
      'Themed menu options',
      'Dessert tables',
      'Light refreshments',
      'Decorative presentations',
      'Gender reveal options',
      'Dietary considerations'
    ],
    icon: Baby,
    gradient: 'from-yellow-400 to-orange-500',
    defaultImages: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&q=80',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80'
    ]
  },
  {
    name: 'Special Occasions',
    description: 'Every moment deserves to be celebrated with exceptional cuisine',
    fullDescription: 'From anniversaries to retirement parties, we cater to all of lifes special moments. Let us create a customized experience for your unique celebration.',
    features: [
      'Custom menu creation',
      'Flexible service styles',
      'Themed presentations',
      'Special dietary options',
      'Full-service catering',
      'Event coordination'
    ],
    icon: Gift,
    gradient: 'from-primary to-yellow-600',
    defaultImages: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80'
    ]
  }
];

export default function EventTypesSection() {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventTypes, setEventTypes] = useState<EventType[]>(defaultEventTypes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomImages();
  }, []);

  const fetchCustomImages = async () => {
    try {
      const eventsRef = collection(db, 'eventTypeImages');
      const snapshot = await getDocs(eventsRef);
      
      const customImages: { [key: string]: string[] } = {};
      snapshot.docs.forEach(doc => {
        customImages[doc.id] = doc.data().gallery || [];
      });
      
      // Merge custom images with default event types
      const updatedEventTypes = defaultEventTypes.map(event => ({
        ...event,
        gallery: customImages[event.name] || []
      }));
      
      setEventTypes(updatedEventTypes);
    } catch (error) {
      console.error('Error fetching custom images:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (selectedEvent) {
      setCurrentImageIndex((prev) => 
        prev === selectedEvent.gallery.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedEvent) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedEvent.gallery.length - 1 : prev - 1
      );
    }
  };

  return (
    <>
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
              Events We Cater
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              From intimate gatherings to grand celebrations, we bring culinary excellence to every occasion
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading event types...</p>
            </div>
          ) : eventTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 font-semibold">No event types available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventTypes.map((event, index) => {
                const Icon = event.icon;
                const displayImages = event.gallery && event.gallery.length > 0 ? event.gallery : event.defaultImages;
                
                return (
                  <motion.div
                    key={event.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setCurrentImageIndex(0);
                    }}
                    className="relative group cursor-pointer overflow-hidden rounded-3xl"
                    style={{
                      boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)',
                    }}
                  >
                    {/* Background image */}
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={displayImages[0]}
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${event.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                      
                      {/* Content */}
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6 }}
                          className="w-14 h-14 bg-white/90 rounded-2xl flex items-center justify-center mb-4 shadow-xl"
                        >
                          <Icon size={28} className="text-gray-900" />
                        </motion.div>
                        
                        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                          {event.name}
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed drop-shadow-md">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    {/* Decorative border on hover */}
                    <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-3xl transition-all pointer-events-none" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-7xl w-full h-[90vh] backdrop-blur-2xl bg-white/95 border-2 border-primary/30 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <X size={20} className="text-gray-900 md:hidden" />
                <X size={24} className="text-gray-900 hidden md:block" />
              </button>

              <div className="grid md:grid-cols-2 gap-0 h-full">
                {/* Image Gallery */}
                <motion.div 
                  className="relative h-[40vh] md:h-full bg-gray-900"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x;
                    if (swipe < -10000) {
                      nextImage();
                    } else if (swipe > 10000) {
                      prevImage();
                    }
                  }}
                >
                  {(() => {
                    const displayImages = selectedEvent.gallery && selectedEvent.gallery.length > 0 ? selectedEvent.gallery : selectedEvent.defaultImages;
                    return (
                      <>
                        <img
                          src={displayImages[currentImageIndex]}
                          alt={`${selectedEvent.name} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Navigation arrows */}
                        {displayImages.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                            >
                              <ChevronLeft size={20} className="text-gray-900 md:hidden" />
                              <ChevronLeft size={28} className="text-gray-900 hidden md:block" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                            >
                              <ChevronRight size={20} className="text-gray-900 md:hidden" />
                              <ChevronRight size={28} className="text-gray-900 hidden md:block" />
                            </button>

                            {/* Image indicators */}
                            <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
                              {displayImages.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`h-2 md:h-3 rounded-full transition-all ${
                                    idx === currentImageIndex
                                      ? 'bg-white w-8 md:w-12'
                                      : 'bg-white/50 w-2 md:w-3 hover:bg-white/75'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </motion.div>

                {/* Event details */}
                <div className="p-6 sm:p-8 md:p-12 lg:p-16 overflow-y-auto max-h-[50vh] md:max-h-full">
                  {(() => {
                    const ModalIcon = selectedEvent.icon;
                    return (
                      <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${selectedEvent.gradient} rounded-2xl mb-6 md:mb-8 shadow-xl`}>
                        <ModalIcon size={32} className="md:hidden" />
                        <ModalIcon size={40} className="hidden md:block" />
                      </div>
                    );
                  })()}

                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
                    {selectedEvent.name}
                  </h3>
                  
                  <p className="text-gray-700 mb-6 md:mb-8 leading-relaxed text-base sm:text-lg md:text-xl">
                    {selectedEvent.fullDescription}
                  </p>

                  <h4 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">What We Offer:</h4>
                  <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                    {selectedEvent.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 md:gap-4"
                      >
                        <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-r ${selectedEvent.gradient} flex-shrink-0`} />
                        <span className="text-gray-700 text-sm sm:text-base md:text-lg">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 md:py-5 bg-gradient-to-r ${selectedEvent.gradient} text-white rounded-xl font-semibold shadow-xl text-base md:text-xl`}
                  >
                    Request a Quote
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
