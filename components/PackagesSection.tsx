'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Users, Utensils, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Package {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: any;
  gradient: string;
  images: string[];
}

const packages: Package[] = [
  {
    id: 1,
    name: 'Intimate Gathering',
    price: '₱1,500.00',
    description: 'Perfect for small celebrations and private dinners',
    features: [
      'Up to 25 guests',
      '3-course gourmet menu',
      'Professional service staff',
      'Table setup & decoration',
      'Premium tableware',
    ],
    icon: Users,
    gradient: 'from-primary via-yellow-500 to-yellow-600',
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
    ],
  },
  {
    id: 2,
    name: 'Grand Celebration',
    price: '₱3,500.00',
    description: 'Ideal for weddings, corporate events, and large parties',
    features: [
      'Up to 100 guests',
      '5-course premium menu',
      'Full service team',
      'Complete venue setup',
      'Custom menu planning',
      'Beverage service',
    ],
    icon: Sparkles,
    gradient: 'from-yellow-600 via-primary to-yellow-500',
    images: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800&q=80',
    ],
  },
  {
    id: 3,
    name: 'Luxury Experience',
    price: '₱7,500.00+',
    description: 'Ultimate fine dining experience for exclusive events',
    features: [
      'Unlimited guests',
      'Custom gourmet menu',
      'Celebrity chef service',
      'Full event coordination',
      'Premium wine pairing',
      'Live cooking stations',
      'Personalized service',
    ],
    icon: Utensils,
    gradient: 'from-primary via-yellow-600 to-primary',
    images: [
      'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800&q=80',
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    ],
  },
];

export default function PackagesSection() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredPackage, setHoveredPackage] = useState<number | null>(null);
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [imageDragX, setImageDragX] = useState(0);

  const nextImage = () => {
    if (selectedPackage) {
      setCurrentImageIndex((prev) => 
        prev === selectedPackage.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedPackage) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedPackage.images.length - 1 : prev - 1
      );
    }
  };

  const nextPackage = () => {
    setCurrentPackageIndex((prev) => (prev + 1) % packages.length);
  };

  const prevPackage = () => {
    setCurrentPackageIndex((prev) => (prev - 1 + packages.length) % packages.length);
  };

  const getVisiblePackages = () => {
    const visible = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentPackageIndex + i + packages.length) % packages.length;
      visible.push({ ...packages[index], position: i });
    }
    return visible;
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
              Our Packages
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Choose the perfect catering package for your special occasion
            </p>
          </motion.div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={prevPackage}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white/90 hover:bg-white border-2 border-primary/30 rounded-full items-center justify-center shadow-xl transition-all hover:scale-110"
            >
              <ChevronLeft size={24} className="text-primary" />
            </button>
            <button
              onClick={nextPackage}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white/90 hover:bg-white border-2 border-primary/30 rounded-full items-center justify-center shadow-xl transition-all hover:scale-110"
            >
              <ChevronRight size={24} className="text-primary" />
            </button>

            {/* Packages Grid */}
            <motion.div 
              className="flex items-center justify-center gap-4 md:gap-8 min-h-[500px] md:min-h-[600px]"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                if (swipe < -10000) {
                  nextPackage();
                } else if (swipe > 10000) {
                  prevPackage();
                }
              }}
            >
              <AnimatePresence mode="popLayout">
                {getVisiblePackages().map((pkg) => {
                  const Icon = pkg.icon;
                  const isCenter = pkg.position === 0;
                  const isHovered = hoveredPackage === pkg.id;
                  
                  return (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isCenter ? 1 : 0.7,
                        zIndex: isCenter ? 20 : 10,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ 
                        scale: isCenter ? 1.02 : 0.72,
                        y: isCenter ? -10 : 0,
                      }}
                      onHoverStart={() => setHoveredPackage(pkg.id)}
                      onHoverEnd={() => setHoveredPackage(null)}
                      onClick={() => {
                        if (isCenter) {
                          setSelectedPackage(pkg);
                          setCurrentImageIndex(0);
                        } else if (pkg.position === -1) {
                          prevPackage();
                        } else if (pkg.position === 1) {
                          nextPackage();
                        }
                      }}
                      className={`relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl cursor-pointer overflow-hidden group ${
                        isCenter ? 'w-[280px] sm:w-[350px] md:w-[450px] p-6 sm:p-8 md:p-10' : 'w-[180px] sm:w-[220px] md:w-[280px] p-4 sm:p-5 md:p-6 opacity-60'
                      }`}
                      style={{
                        boxShadow: isCenter 
                          ? '0 20px 60px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                          : '0 10px 30px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {/* Animated background */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${pkg.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }}
                        style={{ backgroundSize: '200% 200%' }}
                      />

                      {/* Decorative corner */}
                      <div className={`absolute top-0 right-0 ${isCenter ? 'w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24' : 'w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16'} bg-gradient-to-br ${pkg.gradient} opacity-20 rounded-bl-full`} />

                      <div className="relative z-10">
                        {/* Icon */}
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6 }}
                          className={`${isCenter ? 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20' : 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14'} bg-gradient-to-br ${pkg.gradient} rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-xl relative`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                          <Icon size={isCenter ? 28 : 20} className="text-white relative z-10 sm:hidden" />
                          <Icon size={isCenter ? 36 : 28} className="text-white relative z-10 hidden sm:block" />
                        </motion.div>

                        {/* Package name and price */}
                        <h3 className={`${isCenter ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base sm:text-lg md:text-xl'} font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors`}>
                          {pkg.name}
                        </h3>
                        <div className={`${isCenter ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-xl md:text-2xl'} font-bold bg-gradient-to-r ${pkg.gradient} bg-clip-text text-transparent mb-3 md:mb-4`}>
                          {pkg.price}
                        </div>
                        
                        {isCenter && (
                          <>
                            <p className="text-gray-700 mb-4 md:mb-6 leading-relaxed text-sm sm:text-base">
                              {pkg.description}
                            </p>

                            {/* Features - Show on hover for center card only */}
                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-2 mb-4 md:mb-6"
                                >
                                  {pkg.features.map((feature, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-center gap-2 text-xs sm:text-sm text-gray-700"
                                    >
                                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r ${pkg.gradient} flex-shrink-0`} />
                                      {feature}
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* CTA */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-full py-2.5 sm:py-3 bg-gradient-to-r ${pkg.gradient} text-white rounded-xl font-semibold shadow-lg mt-3 md:mt-4 text-sm sm:text-base`}
                            >
                              View Gallery
                            </motion.button>

                            {/* Decorative line */}
                            <motion.div
                              className={`mt-4 md:mt-6 h-1 bg-gradient-to-r ${pkg.gradient} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.8 }}
                            />
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {packages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPackageIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentPackageIndex
                      ? 'bg-primary w-8'
                      : 'bg-primary/30 w-2 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modal - BIGGER */}
      <AnimatePresence>
        {selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPackage(null)}
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
                onClick={() => setSelectedPackage(null)}
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
                    src={selectedPackage.images[currentImageIndex]}
                    alt={`${selectedPackage.name} - Image ${currentImageIndex + 1}`}
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
                    {selectedPackage.images.map((_, idx) => (
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

                {/* Package details */}
                <div className="p-6 sm:p-8 md:p-12 lg:p-16 overflow-y-auto max-h-[50vh] md:max-h-full">
                  <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${selectedPackage.gradient} rounded-2xl mb-6 md:mb-8 shadow-xl`}>
                    <selectedPackage.icon size={32} className="text-white md:hidden" />
                    <selectedPackage.icon size={40} className="text-white hidden md:block" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-gray-900">
                    {selectedPackage.name}
                  </h3>
                  <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${selectedPackage.gradient} bg-clip-text text-transparent mb-4 md:mb-6`}>
                    {selectedPackage.price}
                  </div>
                  <p className="text-gray-700 mb-6 md:mb-10 leading-relaxed text-base sm:text-lg md:text-xl">
                    {selectedPackage.description}
                  </p>

                  <h4 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">What's Included:</h4>
                  <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                    {selectedPackage.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 md:gap-4"
                      >
                        <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-r ${selectedPackage.gradient} flex-shrink-0`} />
                        <span className="text-gray-700 text-sm sm:text-base md:text-lg">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 md:py-5 bg-gradient-to-r ${selectedPackage.gradient} text-white rounded-xl font-semibold shadow-xl text-base md:text-xl`}
                  >
                    Book This Package
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
