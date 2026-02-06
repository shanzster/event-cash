'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react';
import { useManager } from '@/contexts/ManagerContext';

/**
 * Manager Login Page
 * Separate login for managers/admins
 */
export default function ManagerLogin() {
  const router = useRouter();
  const { managerLogin, loading, isManager } = useManager();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in as manager
  useEffect(() => {
    if (!loading && isManager) {
      router.push('/manager/dashboard');
    }
  }, [loading, isManager, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      await managerLogin(email, password);
      router.push('/manager/dashboard');
    } catch (err: any) {
      console.error('Manager login error:', err);

      if (err.code === 'auth/user-not-found') {
        setError('Manager account not found');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.message.includes('not authorized as a manager')) {
        setError('This account is not authorized as a manager');
      } else {
        setError('Failed to log in. Please try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="relative z-10 min-h-screen flex items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-12">
            {/* Manager Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Shield className="text-white" size={32} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">Manager Portal</h1>
              <p className="text-gray-600">
                Access your management dashboard
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="email" className="block text-sm font-bold mb-2 text-gray-900">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    required
                    placeholder="manager@eventcash.com"
                    className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="password" className="block text-sm font-bold mb-2 text-gray-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 backdrop-blur-xl bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Login
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t border-primary/20">
              <p className="text-center text-sm text-gray-600">
                Not a manager?{' '}
                <a href="/login" className="text-primary font-semibold hover:underline">
                  Customer Login
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
