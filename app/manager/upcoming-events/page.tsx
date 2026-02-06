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

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/manager/login');
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
        where('status', '==', 'confirmed')
      );
      const snapshot = await getDocs(q);
      
      const now = new Date();
      const bookingsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookingDetails[];
      
      console.log('All confirmed bookings:', bookingsData.length);
      
      // Filter only upcoming events
      const upcomingBookings = bookingsData.filter(booking => {
        if (!booking.eventDate) return false;
        const eventDate = booking.eventDate.toDate ? booking.eventDate.toDate() : new Date(booking.eventDate);
        const isUpcoming = isAfter(eventDate, now);
        console.log(`Booking ${booking.customerName}: ${eventDate.toLocaleDateString()} - Upcoming: ${isUpcoming}`);
        return isUpcoming;
      }).sort((a, b) => {
        // Sort by event date ascending
        const dateA = a.eventDate.toDate ? a.eventDate.toDate() : new Date(a.eventDate);
        const dateB = b.eventDate.toDate ? b.eventDate.toDate() : new Date(b.eventDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('Upcoming bookings:', upcomingBookings.length);
      setBookings(upcomingBookings);
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
                    onClick={() => router.push(`/manager/upcoming-events/${booking.id}`)}
                    className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all"
                  >
                    <div className="p-6">
                      {/* Event Header */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.customerName}</h3>
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
                      <div className="mt-4 text-center">
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
    </ManagerSidebar>
  );
}
