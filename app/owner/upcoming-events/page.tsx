'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Package,
  X
} from 'lucide-react';
import { collection, query, getDocs, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isAfter } from 'date-fns';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
}

interface BookingDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  eventDate: any;
  eventTime: string;
  eventType: string;
  packageName: string;
  status: string;
  totalPrice: number;
  finalPrice?: number;
  location: {
    address: string;
  };
  expenses?: ExpenseItem[];
  priceNotes?: string;
}

export default function UpcomingEventsPage() {
  const router = useRouter();
  const { managerUser, loading, isManager } = useManager();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingDetails | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/owner/login');
    }
  }, [managerUser, loading, isManager, router]);

  useEffect(() => {
    if (managerUser) {
      fetchUpcomingEvents();
    }
  }, [managerUser]);

  const fetchUpcomingEvents = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('status', '==', 'confirmed'),
        orderBy('eventDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const bookingsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookingDetails[];
      
      console.log('All confirmed bookings:', bookingsData.length);
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const calculateTotalExpenses = (expenses?: ExpenseItem[]) => {
    if (!expenses || expenses.length === 0) return 0;
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const calculateProfit = (booking: BookingDetails) => {
    const revenue = booking.finalPrice || booking.totalPrice || 0;
    const totalExpenses = calculateTotalExpenses(booking.expenses);
    return revenue - totalExpenses;
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingToCancel.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: cancelReason.trim(),
        cancelledBy: managerUser?.uid,
      });

      // Remove from list
      setBookings(bookings.filter(b => b.id !== bookingToCancel.id));
      
      setShowCancelModal(false);
      setBookingToCancel(null);
      setCancelReason('');
      
      alert('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const openCancelModal = (booking: BookingDetails, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  if (loading || loadingData) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading upcoming events...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900">Upcoming Events</h1>
            <p className="text-gray-600 mt-2">Track expenses and manage cash flow for confirmed events</p>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-semibold">Total Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-semibold">Expected Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                ₱{bookings.reduce((sum, b) => sum + (b.finalPrice || b.totalPrice || 0), 0).toLocaleString()}.00
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
              <p className="text-gray-600 text-sm font-semibold">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">
                ₱{bookings.reduce((sum, b) => sum + calculateTotalExpenses(b.expenses), 0).toLocaleString()}.00
              </p>
            </div>
          </motion.div>

          {/* Events Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No upcoming confirmed events</p>
              </div>
            ) : (
              bookings.map((booking) => {
                const totalExpenses = calculateTotalExpenses(booking.expenses);
                const revenue = booking.finalPrice || booking.totalPrice || 0;
                const profit = calculateProfit(booking);
                const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
                  >
                    <div className="p-6">
                      {/* Event Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            onClick={() => router.push(`/owner/upcoming-events/${booking.id}`)}
                            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary"
                          >
                            {booking.customerName}
                          </h3>
                          <button
                            onClick={(e) => openCancelModal(booking, e)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Booking"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{booking.packageName}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} className="text-primary" />
                            <span className="font-semibold text-black">
                              {booking.eventDate?.toDate && format(booking.eventDate.toDate(), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={16} className="text-primary" />
                            <span className="font-semibold text-black">{booking.eventTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Revenue</span>
                          <span className="font-bold text-green-600">₱{revenue.toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Expenses</span>
                          <span className="font-bold text-red-600">₱{totalExpenses.toLocaleString()}.00</span>
                        </div>
                        <div className="pt-3 border-t-2 border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Profit</span>
                            <span className={`text-xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              ₱{profit.toLocaleString()}.00
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            Margin: {profitMargin}%
                          </p>
                        </div>
                      </div>

                      {/* Expenses Count */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="text-sm text-gray-600">Expenses Recorded</span>
                        <span className="font-bold text-gray-900">{booking.expenses?.length || 0}</span>
                      </div>

                      {/* Click to view */}
                      <div 
                        onClick={() => router.push(`/owner/upcoming-events/${booking.id}`)}
                        className="mt-4 text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2 transition-colors"
                      >
                        <p className="text-sm text-primary font-semibold">Click to view details →</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && bookingToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Cancel Booking</h3>
              <button 
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                  setCancelReason('');
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-2">
                <strong>Warning:</strong> You are about to cancel this booking:
              </p>
              <p className="text-sm font-semibold text-gray-900">{bookingToCancel.customerName}</p>
              <p className="text-xs text-gray-600">{bookingToCancel.packageName}</p>
              <p className="text-xs text-gray-600">
                {bookingToCancel.eventDate?.toDate && format(bookingToCancel.eventDate.toDate(), 'MMMM dd, yyyy')} at {bookingToCancel.eventTime}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 text-black"
                  placeholder="e.g., Customer request, venue unavailable, emergency..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                  setCancelReason('');
                }}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancelBooking}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-colors"
              >
                Cancel Booking
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </ManagerSidebar>
  );
}
