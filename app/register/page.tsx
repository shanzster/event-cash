'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Register Page
 * User registration form with email, password, and confirm password fields
 */
export default function Register() {
  const router = useRouter();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/[0-9]/.test(password)) score++; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score++; // special characters

    // Determine strength
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 5) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isLoading) return;
    
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData.email, formData.password, formData.fullName, formData.phoneNumber);
      setIsSuccess(true);
      setFormData({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });

      // Redirect after 1.5 seconds (faster feedback)
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', err);
      }
      
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already registered' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email address' });
      } else if (err.code === 'auth/weak-password') {
        setErrors({ password: 'Password should be at least 6 characters' });
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrors({ email: 'Email/password accounts are not enabled. Please contact support.' });
      } else if (err.code === 'auth/network-request-failed') {
        setErrors({ email: 'Network error. Please check your internet connection.' });
      } else {
        setErrors({ email: `Failed to create account: ${err.message || 'Please try again'}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Navigation />
        <main className="relative z-10 min-h-screen flex items-center justify-center py-24 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md text-center backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl p-12 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="mb-6 flex justify-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center shadow-xl">
                <CheckCircle2 size={40} className="text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Registration Successful!</h1>
            <p className="text-gray-700 mb-8 font-medium">
              Your account has been created. Redirecting to login page...
            </p>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="relative z-10 min-h-screen flex items-center justify-center py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-6xl"
        >
          <div className="backdrop-blur-xl bg-white/95 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Image */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative hidden lg:block"
              >
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
                  alt="Register"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-yellow-600/40" />
                <div
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20 opacity-30"
                />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden p-3"
                    >
                      <img src="/event_cash_logo.png" alt="EventCash Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Join EventCash!</h2>
                    <p className="text-white/90 text-lg drop-shadow">Create an account and start planning your perfect event</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Side - Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="p-8 sm:p-12"
              >
                {/* Header */}
                <div className="mb-8">
                  <Link href="/" className="inline-flex items-center gap-2 mb-6 group lg:hidden">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xl overflow-hidden hover:scale-105 transition-transform">
                      <img src="/event_cash_logo.png" alt="EventCash Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">EventCash</span>
                  </Link>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">Create Account</h1>
                  <p className="text-gray-600">Fill in your details to get started</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* General Error Display */}
                  {Object.keys(errors).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="p-4 bg-red-50 border-2 border-red-300 rounded-xl"
                    >
                      <p className="text-red-800 font-bold mb-2">Please fix the following errors:</p>
                      <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                        {Object.entries(errors).map(([field, message]) => (
                          <li key={field}>{message}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* 2x2 Grid for Name, Email, and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name Field */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-bold mb-2 text-gray-900">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-500" size={20} />
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                          className={`w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/70 border-2 rounded-xl transition-colors focus:outline-none text-gray-900 placeholder:text-gray-500 ${
                            errors.fullName
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-primary/20 focus:border-primary'
                          }`}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-red-600 text-sm mt-1 font-medium">{errors.fullName}</p>
                      )}
                    </div>

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
                          className={`w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/70 border-2 rounded-xl transition-colors focus:outline-none text-gray-900 placeholder:text-gray-500 ${
                            errors.email
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-primary/20 focus:border-primary'
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-600 text-sm mt-1 font-medium">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone Number Field */}
                    <div className="sm:col-span-2">
                      <label htmlFor="phoneNumber" className="block text-sm font-bold mb-2 text-gray-900">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-gray-500" size={20} />
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="+1 (555) 123-4567"
                          className={`w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/70 border-2 rounded-xl transition-colors focus:outline-none text-gray-900 placeholder:text-gray-500 ${
                            errors.phoneNumber
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-primary/20 focus:border-primary'
                          }`}
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-red-600 text-sm mt-1 font-medium">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* 2x2 Grid for Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          className={`w-full pl-10 pr-12 py-3 backdrop-blur-xl bg-white/70 border-2 rounded-xl transition-colors focus:outline-none text-gray-900 placeholder:text-gray-500 ${
                            errors.password
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-primary/20 focus:border-primary'
                          }`}
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
                      {errors.password && (
                        <p className="text-red-600 text-sm mt-1 font-medium">{errors.password}</p>
                      )}
                      
                      {/* Password Strength Indicator */}
                      {formData.password && !errors.password && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.1 }}
                          className="mt-2"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                transition={{ duration: 0.15 }}
                                className={`h-full ${passwordStrength.color} transition-colors`}
                              />
                            </div>
                            <span className={`text-xs font-bold ${
                              passwordStrength.label === 'Weak' ? 'text-red-600' :
                              passwordStrength.label === 'Fair' ? 'text-yellow-600' :
                              passwordStrength.label === 'Good' ? 'text-blue-600' :
                              'text-green-600'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Use 8+ characters with mix of letters, numbers & symbols
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2 text-gray-900">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="••••••••"
                          className={`w-full pl-10 pr-12 py-3 backdrop-blur-xl bg-white/70 border-2 rounded-xl transition-colors focus:outline-none text-gray-900 placeholder:text-gray-500 ${
                            errors.confirmPassword
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-primary/20 focus:border-primary'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-900 transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-600 text-sm mt-1 font-medium">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required className="w-4 h-4 rounded mt-1 accent-primary" />
                    <span className="text-sm text-gray-900 font-medium">
                      I agree to the{' '}
                      <a href="#" className="text-primary hover:underline font-bold">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-primary hover:underline font-bold">
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl active:scale-95 transition-all"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-gray-700 font-medium">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-bold">
                    Sign in
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
