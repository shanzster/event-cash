'use client';

import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Hero Component
 * Main landing page hero section with CTA buttons
 * Features: Gradient text, glassmorphic elements, responsive design
 */
export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-4 md:px-6 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1555244162-803834f70033?w=1920&q=80"
          alt="Catering background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        {/* Gold shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center w-full relative z-10">
        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight text-balance text-white drop-shadow-2xl"
        >
          <motion.span 
            className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent inline-block"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          >
            EventCash
          </motion.span>
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow-lg"
        >
          Elevate your events with exquisite catering from EventCash Catering. 
          Premium culinary excellence for every occasion.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-row gap-4 justify-center mb-20 items-center"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/contact"
              className="inline-flex px-8 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-semibold shadow-xl items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ChefHat size={18} />
              Book Now
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/services"
              className="inline-flex px-8 py-4 backdrop-blur-xl bg-white/70 border-2 border-primary/30 rounded-xl font-semibold shadow-lg text-sm sm:text-base text-gray-900 items-center justify-center"
            >
              Explore Services
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
