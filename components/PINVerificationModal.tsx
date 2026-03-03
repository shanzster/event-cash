'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PINVerificationModalProps {
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  message?: string;
}

export default function PINVerificationModal({ 
  onClose, 
  onVerified,
  title = "PIN Verification Required",
  message = "Please enter your PIN to proceed with this action."
}: PINVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get stored PIN from Firestore
      const settingsRef = doc(db, 'settings', 'security');
      const settingsSnap = await getDoc(settingsRef);

      let storedPin = '1234'; // Default PIN

      if (settingsSnap.exists() && settingsSnap.data().pin) {
        storedPin = settingsSnap.data().pin;
      }
      
      // Verify PIN
      if (pin === storedPin) {
        onVerified();
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Lock size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{message}</p>
          </div>
        </div>

        {/* PIN Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            maxLength={6}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors text-black text-center text-2xl font-bold tracking-widest"
            placeholder="••••"
            autoFocus
          />
          {error && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Default PIN is 1234 if not set. You can change it in settings.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !pin}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify PIN'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
