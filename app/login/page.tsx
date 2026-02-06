'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Login Page
 * User authentication form with email and password
 */
export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard'); // Redirect to dashboard after successful login
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else {
        setError('Failed to sign in. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="relative z-10 min-h-screen flex items-center justify-center py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl"
        >
          <div className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Image */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <img
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=80"
                  alt="Login"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-yellow-600/40" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden p-3"
                    >
                      <img src="/event_cash_logo.png" alt="EventCash Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Welcome Back!</h2>
                    <p className="text-white/90 text-lg drop-shadow">Sign in to continue your culinary journey</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Side - Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="p-8 sm:p-12"
              >
                {/* Header */}
                <div className="mb-8">
                  <Link href="/" className="inline-flex items-center gap-2 mb-6 group lg:hidden">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xl overflow-hidden"
                    >
                      <img src="/event_cash_logo.png" alt="EventCash Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    <span className="font-bold text-xl bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">EventCash</span>
                  </Link>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">Sign In</h1>
                  <p className="text-gray-600">Enter your credentials to access your account</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold mb-2 text-gray-900">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-bold mb-2 text-gray-900">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 backdrop-blur-xl bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-900 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    
                  </div>

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

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                      <input type="checkbox" className="w-4 h-4 rounded accent-primary" />
                      <span>Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-primary hover:underline font-semibold">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Login Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </motion.button>
                </form>

                {/* Sign Up Link */}
                <p className="text-center text-gray-700 font-medium">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-primary hover:underline font-bold">
                    Sign up
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
