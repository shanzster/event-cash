'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Package, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';

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
  location: {
    address: string;
  };
  expenses?: number | Array<{ amount: number; [key: string]: any }>;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { managerUser, managerData, loading, isManager } = useManager();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/manager/login');
    }
  }, [managerUser, loading, isManager, router]);

  useEffect(() => {
    if (managerUser) {
      fetchData();
    }
  }, [managerUser]);

  const fetchData = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingDetails[];
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate stats
  const now = new Date();
  const next7Days = addDays(now, 7);
  const next30Days = addDays(now, 30);

  const upcomingBookings = bookings.filter(b => {
    if (!b.eventDate) return false;
    const eventDate = b.eventDate.toDate ? b.eventDate.toDate() : new Date(b.eventDate);
    return isAfter(eventDate, now) && b.status !== 'cancelled';
  }).sort((a, b) => {
    const dateA = a.eventDate.toDate ? a.eventDate.toDate() : new Date(a.eventDate);
    const dateB = b.eventDate.toDate ? b.eventDate.toDate() : new Date(b.eventDate);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingThisWeek = upcomingBookings.filter(b => {
    const eventDate = b.eventDate.toDate ? b.eventDate.toDate() : new Date(b.eventDate);
    return isBefore(eventDate, next7Days);
  });

  const upcomingThisMonth = upcomingBookings.filter(b => {
    const eventDate = b.eventDate.toDate ? b.eventDate.toDate() : new Date(b.eventDate);
    return isBefore(eventDate, next30Days);
  });

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const expectedRevenue = upcomingBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const upcomingExpenses = upcomingBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => {
      // Handle both number and array cases for expenses
      const expense = b.expenses;
      if (typeof expense === 'number') {
        return sum + expense;
      } else if (Array.isArray(expense)) {
        return sum + expense.reduce((total, item) => total + (item.amount || 0), 0);
      }
      return sum;
    }, 0);

  if (loading || loadingData) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading dashboard...</p>
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
            <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-2">Welcome back, {managerData?.displayName}</p>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                </div>
                <Clock size={40} className="text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Confirmed</p>
                  <p className="text-3xl font-bold text-gray-900">{confirmedCount}</p>
                </div>
                <CheckCircle size={40} className="text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{completedCount}</p>
                </div>
                <Package size={40} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}.00</p>
                </div>
                <TrendingUp size={40} className="text-purple-500" />
              </div>
            </div>
          </motion.div>

          {/* Upcoming Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Upcoming This Week */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">This Week</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {upcomingThisWeek.length} events
                </span>
              </div>

              {upcomingThisWeek.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No events scheduled this week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingThisWeek.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.packageName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {booking.eventDate?.toDate && format(booking.eventDate.toDate(), 'EEE, MMM dd')} at {booking.eventTime}
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {upcomingThisWeek.length > 5 && (
                <Link href="/manager/bookings">
                  <button className="w-full mt-4 py-2 text-primary hover:text-yellow-600 font-semibold text-sm transition-colors">
                    View all {upcomingThisWeek.length} events →
                  </button>
                </Link>
              )}
            </motion.div>

            {/* Upcoming This Month */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">This Month</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  {upcomingThisMonth.length} events
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-gray-600 mb-1">Expected Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₱{expectedRevenue.toLocaleString()}.00</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-l-4 border-red-500">
                  <p className="text-sm text-gray-600 mb-1">Upcoming Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₱{upcomingExpenses.toLocaleString()}.00</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 mb-1">Expected Profit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{(expectedRevenue - upcomingExpenses).toLocaleString()}.00
                  </p>
                </div>
              </div>

              <Link href="/manager/calendar">
                <button className="w-full mt-4 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                  View Full Calendar →
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Approvals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  {pendingCount} pending
                </span>
              </div>

              {pendingCount === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>All caught up! No pending bookings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings
                    .filter(b => b.status === 'pending')
                    .slice(0, 5)
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{booking.customerName}</p>
                          <p className="text-sm text-gray-600">{booking.packageName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {booking.eventDate?.toDate && format(booking.eventDate.toDate(), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Link href="/manager/bookings">
                          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                            Review
                          </button>
                        </Link>
                      </div>
                    ))}
                </div>
              )}

              {pendingCount > 5 && (
                <Link href="/manager/bookings">
                  <button className="w-full mt-4 py-2 text-yellow-600 hover:text-yellow-700 font-semibold text-sm transition-colors">
                    View all {pendingCount} pending →
                  </button>
                </Link>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="flex flex-col gap-3">
                <Link href="/manager/bookings">
                  <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-between">
                    <span>Manage Bookings</span>
                    <Package size={20} />
                  </button>
                </Link>

                <Link href="/manager/calendar">
                  <button className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-between">
                    <span>View Calendar</span>
                    <Calendar size={20} />
                  </button>
                </Link>

                <Link href="/manager/reports">
                  <button className="w-full p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-between">
                    <span>View Reports</span>
                    <TrendingUp size={20} />
                  </button>
                </Link>

                <Link href="/manager/users">
                  <button className="w-full p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-between">
                    <span>Manage Users</span>
                    <Users size={20} />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ManagerSidebar>
  );
}
