'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Heart, Briefcase, PartyPopper, GraduationCap, Baby, Gift, X, ChevronLeft, ChevronRight } from 'lucide-react';

const eventTypes = [
  {
    id: 1,
    name: 'Weddings',
    icon: Heart,
    description: 'Make your special day unforgettable with our elegant wedding catering',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
    gradient: 'from-pink-500 to-rose-600',
    fullDescription: 'Create magical moments with our comprehensive wedding catering services. From intimate ceremonies to grand receptions, we craft personalized menus that reflect your love story. Our experienced team handles everything from elegant appetizers to stunning wedding cakes.',
    features: [
      'Custom menu design',
      'Cake and dessert bar',
      'Full bar service',
      'Professional wait staff',
      'Table settings and decor',
      'Dietary accommodations',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
      'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800&q=80',
    ],
  },
  {
    id: 2,
    name: 'Corporate Events',
    icon: Briefcase,
    description: 'Impress clients and colleagues with professional catering services',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
    gradient: 'from-blue-500 to-indigo-600',
    fullDescription: 'Elevate your corporate gatherings with sophisticated catering that impresses. Whether it\'s a business lunch, conference, or company celebration, we deliver professional service and exceptional cuisine that reflects your brand\'s excellence.',
    features: [
      'Breakfast and lunch options',
      'Coffee and refreshment stations',
      'Formal dinner service',
      'Networking reception packages',
      'On-time delivery guaranteed',
      'Corporate invoicing available',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
      'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800&q=80',
    ],
  },
  {
    id: 3,
    name: 'Birthday Parties',
    icon: PartyPopper,
    description: 'Celebrate another year with delicious food and festive atmosphere',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
    gradient: 'from-purple-500 to-pink-600',
    fullDescription: 'Make birthdays memorable with our fun and delicious catering options. From kids\' parties to milestone celebrations, we create festive menus that delight guests of all ages. Let us handle the food while you enjoy the celebration.',
    features: [
      'Kid-friendly menu options',
      'Custom birthday cakes',
      'Themed food presentations',
      'Buffet or plated service',
      'Allergy-conscious preparations',
      'Party favor coordination',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&q=80',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80',
    ],
  },
  {
    id: 4,
    name: 'Graduations',
    icon: GraduationCap,
    description: 'Honor achievements with a memorable graduation celebration',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80',
    gradient: 'from-green-500 to-emerald-600',
    fullDescription: 'Celebrate academic achievements with catering that honors this important milestone. Our graduation packages offer flexible options perfect for backyard parties or formal receptions, ensuring your graduate\'s day is truly special.',
    features: [
      'Casual to formal options',
      'Outdoor-friendly menus',
      'Graduation cake designs',
      'Family-style service',
      'Flexible serving times',
      'Setup and cleanup included',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
      'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    ],
  },
  {
    id: 5,
    name: 'Baby Showers',
    icon: Baby,
    description: 'Welcome new arrivals with sweet treats and savory delights',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
    gradient: 'from-yellow-400 to-orange-500',
    fullDescription: 'Welcome the newest family member with our charming baby shower catering. We create delightful menus featuring elegant finger foods, beautiful desserts, and refreshing beverages perfect for this joyous occasion.',
    features: [
      'Elegant finger foods',
      'Custom dessert tables',
      'Non-alcoholic beverage bar',
      'Gender reveal cake options',
      'Beautiful food presentations',
      'Dietary restriction accommodations',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
      'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&q=80',
    ],
  },
  {
    id: 6,
    name: 'Special Occasions',
    icon: Gift,
    description: 'Any celebration deserves exceptional food and service',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80',
    gradient: 'from-primary to-yellow-600',
    fullDescription: 'Every occasion is special and deserves exceptional catering. Whether it\'s an anniversary, retirement party, holiday gathering, or any celebration, we create custom menus that make your event unforgettable.',
    features: [
      'Fully customizable menus',
      'Seasonal specialties',
      'Themed presentations',
      'Flexible service styles',
      'Accommodates all group sizes',
      'Special dietary needs',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
      'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800&q=80',
      'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800&q=80',
    ],
  },
];

export default function EventTypesSection() {
  const [selectedEvent, setSelectedEvent] = useState<typeof eventTypes[0] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((event, index) => {
              const Icon = event.icon;
              
              return (
                <motion.div
                  key={event.id}
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
                      src={event.image}
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
                  <img
                    src={selectedEvent.gallery[currentImageIndex]}
                    alt={`${selectedEvent.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation arrows */}
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
                    {selectedEvent.gallery.map((_, idx) => (
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
                </motion.div>

                {/* Event details */}
                <div className="p-6 sm:p-8 md:p-12 lg:p-16 overflow-y-auto max-h-[50vh] md:max-h-full">
                  <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${selectedEvent.gradient} rounded-2xl mb-6 md:mb-8 shadow-xl`}>
                    <selectedEvent.icon size={32} className="md:hidden" />
                    <selectedEvent.icon size={40} className="hidden md:block" />
                  </div>

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
