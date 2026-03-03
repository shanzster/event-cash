'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PINVerificationModal from './PINVerificationModal';

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
  const [showPIN, setShowPIN] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Log the deletion
      await addDoc(collection(db, 'deletionLogs'), {
        bookingId,
        customerName: bookingDetails.customerName,
        eventType: bookingDetails.eventType,
        eventDate: bookingDetails.eventDate,
        deletedAt: new Date(),
        deletedBy: 'owner', // You can pass actual user ID
      });

      // Delete the booking
      await deleteDoc(doc(db, 'bookings', bookingId));

      alert('Booking deleted successfully');
      onDeleted();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
      setShowPIN(false);
    }
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

      {/* Confirmation Modal */}
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
                This action cannot be undone. The booking will be permanently removed from the system, 
                but a deletion log will be kept for record-keeping purposes.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setShowPIN(true);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN Verification Modal */}
      <AnimatePresence>
        {showPIN && (
          <PINVerificationModal
            onClose={() => setShowPIN(false)}
            onVerified={handleDelete}
            title="Verify PIN to Delete"
            message="This is a destructive action. Please enter your PIN to confirm deletion of this booking."
          />
        )}
      </AnimatePresence>
    </>
  );
}
