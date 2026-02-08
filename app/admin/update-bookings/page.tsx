'use client';

import { useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function UpdateBookings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchBookings = async () => {
    setLoading(true);
    setMessage('Fetching bookings...');
    
    try {
      const bookingsRef = collection(db, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setBookings(bookingsData);
      setMessage(`Found ${bookingsData.length} bookings`);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setMessage('Error fetching bookings: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingsWithUserId = async () => {
    if (!user) {
      setMessage('You must be logged in to update bookings');
      return;
    }

    setLoading(true);
    setMessage('Updating bookings...');
    
    try {
      const bookingsRef = collection(db, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      
      let updated = 0;
      let skipped = 0;
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Only update if userId is missing
        if (!data.userId) {
          await updateDoc(doc(db, 'bookings', docSnapshot.id), {
            userId: user.uid
          });
          updated++;
        } else {
          skipped++;
        }
      }
      
      setMessage(`✅ Updated ${updated} bookings, skipped ${skipped} (already had userId)`);
      await fetchBookings();
    } catch (error) {
      console.error('Error updating bookings:', error);
      setMessage('❌ Error updating bookings: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingsWithPaymentMethod = async () => {
    setLoading(true);
    setMessage('Updating bookings with payment method...');
    
    try {
      const bookingsRef = collection(db, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      
      let updated = 0;
      let skipped = 0;
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Only update if paymentMethod is missing and booking has payments
        if (!data.paymentMethod && (data.paymentStatus === 'paid' || data.paymentStatus === 'partial' || data.status === 'completed')) {
          await updateDoc(doc(db, 'bookings', docSnapshot.id), {
            paymentMethod: 'cash' // Default to cash for existing bookings
          });
          updated++;
        } else {
          skipped++;
        }
      }
      
      setMessage(`✅ Updated ${updated} bookings with payment method, skipped ${skipped} (already had paymentMethod or no payments)`);
      await fetchBookings();
    } catch (error) {
      console.error('Error updating bookings:', error);
      setMessage('❌ Error updating bookings: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllBookings = async () => {
    if (!confirm('Are you sure you want to DELETE ALL bookings? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setMessage('Deleting all bookings...');
    
    try {
      const bookingsRef = collection(db, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, 'bookings', docSnapshot.id));
      }
      
      setMessage(`✅ Deleted ${snapshot.docs.length} bookings`);
      setBookings([]);
    } catch (error) {
      console.error('Error deleting bookings:', error);
      setMessage('❌ Error deleting bookings: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin: Update Bookings</h1>
            <p className="text-gray-600">Utility to fix bookings missing userId field</p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2">⚠️ Admin Tool - Use with Caution</h3>
                <p className="text-yellow-800 text-sm">
                  This tool is for development/testing only. It will update or delete bookings in your Firestore database.
                  Make sure you're logged in as the correct user before updating bookings.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-blue-900 mb-2">Current User</h3>
              <p className="text-blue-800 text-sm">
                <strong>UID:</strong> {user.uid}
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-blue-800 text-sm mt-2">
                Bookings without userId will be assigned to this user.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchBookings}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <RefreshCw size={20} />
              Fetch All Bookings
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={updateBookingsWithUserId}
              disabled={loading || !user}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <CheckCircle size={20} />
              Add userId to Bookings Without It
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={updateBookingsWithPaymentMethod}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <CheckCircle size={20} />
              Add Payment Method to Paid Bookings
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={deleteAllBookings}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Trash2 size={20} />
              Delete All Bookings (Dangerous!)
            </motion.button>
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 mb-8"
            >
              <p className="text-gray-900 font-medium">{message}</p>
            </motion.div>
          )}

          {/* Bookings List */}
          {bookings.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Bookings ({bookings.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-xl border-2 ${
                      booking.userId
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{booking.packageName || 'Unknown Package'}</p>
                        <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {booking.id}</p>
                      </div>
                      <div className="text-right">
                        {booking.userId ? (
                          <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
                            ✓ Has userId
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                            ✗ Missing userId
                          </span>
                        )}
                        {booking.userId && (
                          <p className="text-xs text-gray-600 mt-2">
                            {booking.userId.substring(0, 8)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Make sure you're logged in as the correct user</li>
              <li>Click "Fetch All Bookings" to see current bookings</li>
              <li>Red bookings are missing userId field</li>
              <li>Click "Add userId to Bookings" to fix them</li>
              <li>Click "Add Payment Method to Paid Bookings" to set default payment method (cash) for completed bookings</li>
              <li>Or click "Delete All Bookings" to start fresh (testing only)</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
