'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import PackagesSection from '@/components/PackagesSection';
import EventTypesSection from '@/components/EventTypesSection';
import ProcessSection from '@/components/ProcessSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import StatsSection from '@/components/StatsSection';
import { Award, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Home Page - Landing Page
 * Showcases the company's main offering and value proposition
 * Redirects logged-in users to dashboard
 */
export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <>
      <Navigation />
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero />

        {/* Stats Section */}
        <StatsSection />

        {/* Packages Section */}
        <PackagesSection />

        {/* Event Types Section */}
        <EventTypesSection />

        {/* Process Section */}
        <ProcessSection />

        {/* Why Choose Us Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 relative">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent text-balance"
            >
              Why Choose EventCash?
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <motion.div
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                }}
                className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl p-8 group cursor-pointer overflow-hidden"
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-primary via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                    <Award size={26} className="text-white relative z-10" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">Excellence & Quality</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Award-winning chefs and premium ingredients for exceptional cuisine.
                  </p>
                  
                  {/* Decorative bottom line */}
                  <motion.div 
                    className="mt-6 h-1 bg-gradient-to-r from-primary to-yellow-600 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                custom={1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                }}
                className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-yellow-600/10 border-2 border-primary/30 rounded-3xl p-8 group cursor-pointer overflow-hidden"
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-600/20 to-transparent rounded-bl-full" />
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-yellow-600 via-yellow-500 to-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                    <Users size={26} className="text-white relative z-10" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">Professional Team</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Expert staff for seamless execution and impeccable service.
                  </p>
                  
                  {/* Decorative bottom line */}
                  <motion.div 
                    className="mt-6 h-1 bg-gradient-to-r from-yellow-600 to-primary rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  />
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                custom={2}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                }}
                className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl p-8 group cursor-pointer overflow-hidden"
                style={{ 
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-gradient-to-br from-primary via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                    <Heart size={26} className="text-white relative z-10" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">Personalized Touch</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Custom menus tailored to your preferences and dietary needs.
                  </p>
                  
                  {/* Decorative bottom line */}
                  <motion.div 
                    className="mt-6 h-1 bg-gradient-to-r from-primary to-yellow-600 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(212, 175, 55, 0.15) 100%)' }}
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent text-balance"
            >
              Ready to Plan Your Event?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm sm:text-base md:text-lg text-gray-700 mb-8 leading-relaxed"
            >
              Let's create a memorable culinary experience for your special occasion.
            </motion.p>
            <motion.a
              href="/contact"
              whileHover={{ 
                scale: 1.1,
                boxShadow: '0 20px 40px rgba(212, 175, 55, 0.4)',
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-semibold shadow-xl text-sm sm:text-base"
            >
              Get in Touch
            </motion.a>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
