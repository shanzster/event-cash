'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Users, 
  Heart, 
  Briefcase, 
  Utensils, 
  Gift,
  Leaf,
  Clock,
  MapPin
} from 'lucide-react';

const services = [
  {
    icon: Heart,
    title: 'Wedding Catering',
    description: 'Create the perfect culinary backdrop for your special day with our elegant, customized wedding menus.',
    features: ['Custom Menus', 'Professional Staff', 'Elegant Presentation'],
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Briefcase,
    title: 'Corporate Events',
    description: 'From intimate business lunches to large conferences, we provide professional catering solutions.',
    features: ['Flexible Timing', 'Dietary Options', 'Professional Service'],
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Users,
    title: 'Private Parties',
    description: 'Celebrate birthdays, anniversaries, and milestones with memorable cuisine and exceptional service.',
    features: ['Customizable', 'Themed Menus', 'Full Setup & Cleanup'],
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: Utensils,
    title: 'Fine Dining Events',
    description: 'Experience gourmet cuisine prepared by award-winning chefs for your upscale gatherings.',
    features: ['Gourmet Menu', 'Wine Pairing', 'Chef Presentation'],
    gradient: 'from-primary to-yellow-600',
  },
  {
    icon: Gift,
    title: 'Special Occasions',
    description: 'Anniversaries, graduations, and other celebrations deserve special attention and exceptional food.',
    features: ['Flexible Packages', 'Personal Touch', 'Custom Décor Options'],
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Leaf,
    title: 'Dietary Specializations',
    description: 'We accommodate all dietary preferences including vegetarian, vegan, gluten-free, and allergy-friendly options.',
    features: ['All Diets Welcome', 'Safe Preparation', 'Detailed Labeling'],
    gradient: 'from-green-500 to-emerald-600',
  },
];

export default function Services() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Removed auto-redirect to dashboard - users can view public pages even when logged in

  return (
    <>
      <Navigation />
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80"
              alt="Services background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl"
            >
              Our Services
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
            >
              Comprehensive catering solutions tailored to your event's unique needs and vision
            </motion.p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl p-6 sm:p-8 overflow-hidden group cursor-pointer"
                    style={{
                      boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                      style={{ backgroundSize: '200% 200%' }}
                    />

                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${service.gradient} opacity-20 rounded-bl-full`} />

                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                      <IconComponent size={28} className="text-white relative z-10 sm:hidden" />
                      <IconComponent size={32} className="text-white relative z-10 hidden sm:block" />
                    </motion.div>

                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors relative z-10">
                      {service.title}
                    </h3>

                    <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed relative z-10">
                      {service.description}
                    </p>

                    <ul className="space-y-2 relative z-10">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                          <span className={`w-2 h-2 bg-gradient-to-r ${service.gradient} rounded-full flex-shrink-0`}></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <motion.div
                      className={`mt-6 h-1 bg-gradient-to-r ${service.gradient} rounded-full`}
                      initial={{ width: 0 }}
                      whileInView={{ width: '60%' }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Stand Out Section */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white via-primary/5 to-white">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent"
            >
              Why Our Services Stand Out
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  icon: Clock,
                  title: 'Flexible Scheduling',
                  description: 'We work around your timeline and event requirements, from morning brunches to late-night receptions.',
                },
                {
                  icon: Leaf,
                  title: 'Fresh Ingredients',
                  description: 'We source premium, locally-sourced ingredients whenever possible for the best quality and sustainability.',
                },
                {
                  icon: MapPin,
                  title: 'Any Location',
                  description: 'We cater events anywhere—venues, homes, outdoor spaces—and handle all setup and logistics.',
                },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                    whileHover={{ y: -10, scale: 1.05 }}
                    className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-6 sm:p-8 text-center shadow-lg"
                  >
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl"
                    >
                      <IconComponent size={24} className="text-white sm:hidden" />
                      <IconComponent size={28} className="text-white hidden sm:block" />
                    </motion.div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(212, 175, 55, 0.15) 100%)' }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
              Ready to Book Your Event?
            </h2>
            <p className="text-base sm:text-lg text-gray-700 mb-8 leading-relaxed">
              Contact us today to discuss your catering needs and get a personalized quote.
            </p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-semibold shadow-xl text-sm sm:text-base"
            >
              Request a Consultation
            </motion.a>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
