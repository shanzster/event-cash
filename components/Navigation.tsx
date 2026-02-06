'use client';

import Link from 'next/link';
import { Menu, X, User, LogOut, Calendar } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Navigation Component
 * Responsive navigation bar with glassmorphism design
 * Features: Mobile hamburger menu, smooth transitions, active link highlighting
 */
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navLinks = user ? [
    // Customer-only navigation
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/booking/new', label: 'New Booking' },
    { href: '/my-bookings', label: 'My Bookings' },
  ] : [
    // Public navigation
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
    { href: '/location', label: 'Location' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4">
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto backdrop-blur-2xl bg-white/60 border-2 border-primary/30 shadow-2xl rounded-full"
        style={{
          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
            >
              <img src="/event_cash_logo.png" alt="EventCash Logo" className="w-full h-full object-contain" />
            </motion.div>
            <span className="font-bold text-sm sm:text-lg bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent hidden sm:inline tracking-tight">
              EventCash
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Link
                  href={link.href}
                  className="text-gray-900 hover:text-primary font-medium text-sm transition-all duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-yellow-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Auth Links and Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex gap-2 lg:gap-3 items-center">
              {user ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-900 hover:text-red-600 font-medium text-sm transition-all duration-300 flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/login"
                      className="px-4 py-2 text-gray-900 hover:text-primary font-medium text-sm transition-all duration-300 relative group"
                    >
                      Login
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-yellow-600 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/register"
                      className="px-5 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold text-sm shadow-lg"
                    >
                      Register
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-900 hover:text-primary transition-colors p-1"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu - Separate floating pill */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-2 max-w-6xl mx-auto backdrop-blur-2xl bg-white/70 border-2 border-primary/30 shadow-2xl rounded-3xl overflow-hidden"
            style={{
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="block px-4 py-2.5 text-gray-900 hover:text-primary hover:bg-primary/10 rounded-2xl font-medium text-sm transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="border-t-2 border-primary/20 pt-3 mt-3 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block py-2.5 text-gray-900 hover:text-primary font-medium text-sm transition-colors text-center rounded-2xl hover:bg-primary/10 flex items-center justify-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <User size={18} />
                      Dashboard
                    </Link>
                    <Link
                      href="/my-bookings"
                      className="block py-2.5 text-gray-900 hover:text-primary font-medium text-sm transition-colors text-center rounded-2xl hover:bg-primary/10 flex items-center justify-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Calendar size={18} />
                      My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full py-2.5 text-red-600 hover:text-red-700 font-medium text-sm transition-colors text-center rounded-2xl hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block py-2.5 text-gray-900 hover:text-primary font-medium text-sm transition-colors text-center rounded-2xl hover:bg-primary/10"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block py-2.5 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-2xl text-center font-semibold text-sm shadow-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
