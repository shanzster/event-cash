'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, Utensils, Sparkles, X, Package as PackageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  imageUrl?: string;
  gallery?: string[]; // NEW: Array of images for carousel
  icon: string;
  gradient: string;
}

// Icon mapping
const iconMap: { [key: string]: any } = {
  Users,
  Utensils,
  Sparkles,
  Package: PackageIcon,
};

export default function PackagesSection() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    // Reset image index when package changes
    if (selectedPackage) {
      setCurrentImageIndex(0);
    }
  }, [selectedPackage]);

  const nextImage = () => {
    if (selectedPackage && selectedPackage.gallery && selectedPackage.gallery.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === selectedPackage.gallery!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedPackage && selectedPackage.gallery && selectedPackage.gallery.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedPackage.gallery!.length - 1 : prev - 1
      );
    }
  };

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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading packages...</p>
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) {
    return (
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
              Our Packages
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              Choose the perfect catering package for your special occasion
            </p>
            <div className="bg-white rounded-xl shadow-lg p-12">
              <PackageIcon size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">No packages available yet</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for our catering packages</p>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

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

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => {
              const Icon = iconMap[pkg.icon] || PackageIcon;
              const isHovered = hoveredPackage === pkg.id;
              
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onHoverStart={() => setHoveredPackage(pkg.id)}
                  onHoverEnd={() => setHoveredPackage(null)}
                  onClick={() => setSelectedPackage(pkg)}
                  className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl cursor-pointer overflow-hidden group shadow-xl hover:shadow-2xl transition-all"
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
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${pkg.gradient} opacity-20 rounded-bl-full`} />

                  {/* Package Image or Gradient */}
                  {pkg.gallery && pkg.gallery.length > 0 ? (
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={pkg.gallery[0]}
                        alt={pkg.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {pkg.gallery.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          +{pkg.gallery.length - 1} more
                        </div>
                      )}
                    </div>
                  ) : pkg.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className={`h-48 bg-gradient-to-br ${pkg.gradient} flex items-center justify-center`}>
                      <Icon size={64} className="text-white" />
                    </div>
                  )}

                  <div className="p-6 sm:p-8 relative z-10">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className={`w-16 h-16 bg-gradient-to-br ${pkg.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-xl relative -mt-12`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                      <Icon size={32} className="text-white relative z-10" />
                    </motion.div>

                    {/* Package name and price */}
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">
                      {pkg.name}
                    </h3>
                    <div className={`text-3xl font-bold bg-gradient-to-r ${pkg.gradient} bg-clip-text text-transparent mb-4`}>
                      ₱{pkg.price.toLocaleString()}.00
                    </div>
                    
                    <p className="text-gray-700 mb-6 leading-relaxed text-sm">
                      {pkg.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {pkg.features.slice(0, 5).map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="flex items-center gap-2 text-xs text-gray-700"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${pkg.gradient} flex-shrink-0`} />
                          {feature}
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3 bg-gradient-to-r ${pkg.gradient} text-white rounded-xl font-semibold shadow-lg text-sm`}
                    >
                      View Details
                    </motion.button>

                    {/* Decorative line */}
                    <motion.div
                      className={`mt-4 h-1 bg-gradient-to-r ${pkg.gradient} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: isHovered ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal */}
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
              className="relative max-w-6xl w-full max-h-[90vh] backdrop-blur-2xl bg-white/95 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPackage(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <X size={24} className="text-gray-900" />
              </button>

              <div className="grid md:grid-cols-2 gap-0 h-full max-h-[90vh]">
                {/* LEFT SIDE - Image Gallery */}
                <div className="relative bg-gray-900 flex items-center justify-center min-h-[40vh] md:min-h-full">
                  {selectedPackage.gallery && selectedPackage.gallery.length > 0 ? (
                    <motion.div 
                      className="relative w-full h-full flex items-center justify-center p-4"
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
                        src={selectedPackage.gallery[currentImageIndex]}
                        alt={`${selectedPackage.name} - Image ${currentImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: 'calc(90vh - 2rem)' }}
                      />

                      {/* Navigation arrows - only show if more than 1 image */}
                      {selectedPackage.gallery.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                          >
                            <ChevronLeft size={20} className="text-gray-900 md:hidden" />
                            <ChevronLeft size={28} className="text-gray-900 hidden md:block" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                          >
                            <ChevronRight size={20} className="text-gray-900 md:hidden" />
                            <ChevronRight size={28} className="text-gray-900 hidden md:block" />
                          </button>

                          {/* Image indicators */}
                          <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-10">
                            {selectedPackage.gallery.map((_, idx) => (
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
                    </motion.div>
                  ) : selectedPackage.imageUrl ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={selectedPackage.imageUrl}
                        alt={selectedPackage.name}
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: 'calc(90vh - 2rem)' }}
                      />
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${selectedPackage.gradient} flex items-center justify-center`}>
                      {(() => {
                        const Icon = iconMap[selectedPackage.icon] || PackageIcon;
                        return <Icon size={80} className="text-white" />;
                      })()}
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE - Package details */}
                <div className="p-6 sm:p-8 md:p-10 lg:p-12 overflow-y-auto max-h-[50vh] md:max-h-full bg-gradient-to-br from-white via-white to-primary/5">
                  <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${selectedPackage.gradient} rounded-2xl mb-6 md:mb-8 shadow-xl`}>
                    {(() => {
                      const Icon = iconMap[selectedPackage.icon] || PackageIcon;
                      return <Icon size={32} className="text-white md:hidden" />;
                    })()}
                    {(() => {
                      const Icon = iconMap[selectedPackage.icon] || PackageIcon;
                      return <Icon size={40} className="text-white hidden md:block" />;
                    })()}
                  </div>

                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-gray-900">
                    {selectedPackage.name}
                  </h3>
                  <div className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${selectedPackage.gradient} bg-clip-text text-transparent mb-4 md:mb-6`}>
                    ₱{selectedPackage.price.toLocaleString()}.00
                  </div>
                  <p className="text-gray-700 mb-6 md:mb-10 leading-relaxed text-base md:text-lg">
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
                        <span className="text-gray-700 text-sm md:text-lg">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedPackage(null);
                      window.location.href = '/booking/new';
                    }}
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
