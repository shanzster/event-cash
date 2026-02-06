'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Forgot Password Page
 * Allows users to reset their password via email
 */
export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later');
      } else {
        setError('Failed to send password reset email. Please try again');
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
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-12">
            {/* Back to Login Link */}
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 font-semibold"
            >
              <ArrowLeft size={20} />
              <span>Back to Login</span>
            </Link>

            {!emailSent ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                  >
                    <Mail className="text-white" size={32} />
                  </motion.div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 text-center">Forgot Password?</h1>
                  <p className="text-gray-600 text-center">
                    No worries! Enter your email address and we'll send you a reset link.
                  </p>
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
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/70 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                      />
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

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </motion.button>
                </form>
              </>
            ) : (
              <>
                {/* Success Message */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <CheckCircle className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-gray-900">Check Your Email</h2>
                  <p className="text-gray-600 mb-6">
                    We've sent a password reset link to:
                  </p>
                  <p className="text-primary font-bold text-lg mb-6">{email}</p>
                  <p className="text-gray-600 text-sm mb-8">
                    Click the link in the email to reset your password. If you don't see the email, check your spam folder.
                  </p>
                  
                  <div className="space-y-3">
                    <Link href="/login">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-bold shadow-xl"
                      >
                        Back to Login
                      </motion.button>
                    </Link>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="w-full px-4 py-3 backdrop-blur-xl bg-white/70 border-2 border-primary/20 rounded-xl font-semibold text-gray-900 transition-colors hover:border-primary/40"
                    >
                      Send Again
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
