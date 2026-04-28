'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface DeleteBookingButtonProps {
  bookingId: string;
  bookingDetails: {
    customerName: string;
    eventType: string;
    eventDate: any;
  };
  onDeleted: () => void;
}

export default function DeleteBookingButton({ bookingId, bookingDetails, onDeleted }: DeleteBookingButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      // Re-authenticate with current user's credentials
      const user = auth.currentUser;
      if (!user || !user.email) {
        setError('No authenticated user found. Please log in again.');
        setDeleting(false);
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Password verified — proceed with deletion
      await addDoc(collection(db, 'deletionLogs'), {
        bookingId,
        customerName: bookingDetails.customerName,
        eventType: bookingDetails.eventType,
        eventDate: bookingDetails.eventDate,
        deletedAt: new Date(),
        deletedBy: user.email,
      });

      await deleteDoc(doc(db, 'bookings', bookingId));

      alert('Booking deleted successfully');
      setShowPasswordModal(false);
      setPassword('');
      onDeleted();
    } catch (err: any) {
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to verify password. Please try again.');
        console.error('Delete error:', err);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleDelete();
  };

  const openPasswordModal = () => {
    setShowConfirm(false);
    setPassword('');
    setError('');
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
      >
        <Trash2 size={18} />
        Delete
      </motion.button>

      {/* Step 1 — Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Delete Booking?</h3>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  You are about to permanently delete this booking:
                </p>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">{bookingDetails.customerName}</p>
                  <p className="text-gray-700">{bookingDetails.eventType}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. You will be asked to enter your account password to confirm.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={openPasswordModal}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 2 — Password Verification Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Lock size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm with Password</h3>
                  <p className="text-sm text-gray-500">Enter your account password to proceed</p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800">
                    This will permanently delete the booking for <span className="font-semibold">{bookingDetails.customerName}</span>. This cannot be undone.
                  </p>
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors text-black font-medium"
                    placeholder="Enter your password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {error}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPasswordModal(false); setPassword(''); setError(''); }}
                  disabled={deleting}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || !password}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Verifying...' : 'Delete Booking'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
