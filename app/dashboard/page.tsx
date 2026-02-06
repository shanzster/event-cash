'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/CustomerLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Package, 
  Clock, 
  Plus, 
  Eye, 
  Users, 
  Sparkles,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookingDetails } from '@/types/booking';
import { format } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    console.log('📊 DASHBOARD: Checking auth state');
    console.log('📊 Loading:', loading);
    console.log('📊 User:', user?.email || 'null');
    console.log('📊 User UID:', user?.uid || 'null');
    
    if (!loading && !user) {
      console.log('⚠️ DASHBOARD: No user and not loading, redirecting to login');
      router.push('/login');
    } else if (user) {
      console.log('✅ DASHBOARD: User is authenticated, staying on dashboard');
    } else if (loading) {
      console.log('⏳ DASHBOARD: Still loading auth state...');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        console.log('=== FETCHING BOOKINGS ===');
        console.log('Current user UID:', user.uid);
        console.log('Current user email:', user.email);
        
        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('userId', '==', user.uid)
        );
        
        console.log('Executing query...');
        const querySnapshot = await getDocs(q);
        console.log('Query returned', querySnapshot.docs.length, 'bookings');
        
        const bookingsData = querySnapshot.docs.map(doc => {
          console.log('Booking:', doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
            eventDate: doc.data().eventDate.toDate(),
            createdAt: doc.data().createdAt.toDate(),
          };
        }) as BookingDetails[];
        
        // Sort by createdAt in memory (descending - newest first)
        bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        console.log('Processed bookings:', bookingsData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('=== ERROR FETCHING BOOKINGS ===');
        console.error('Error details:', error);
        console.error('Error message:', (error as Error).message);
        console.error('Error code:', (error as any).code);
        
        // Check if it's an index error
        if ((error as any).code === 'failed-precondition') {
          console.error('⚠️ FIRESTORE INDEX REQUIRED!');
          console.error('Click the link in the error message to create the index');
        }
      } finally {
        setLoadingBookings(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const stats = [
    { 
      label: 'Total Bookings', 
      value: bookings.length, 
      icon: Calendar, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100'
    },
    { 
      label: 'Pending', 
      value: bookings.filter(b => b.status === 'pending').length, 
      icon: Clock, 
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-50 to-yellow-100'
    },
    { 
      label: 'Confirmed', 
      value: bookings.filter(b => b.status === 'confirmed').length, 
      icon: CheckCircle, 
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100'
    },
    { 
      label: 'Total Spent', 
      value: `₱${bookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}.00`, 
      icon: TrendingUp, 
      color: 'from-primary to-yellow-600',
      bgColor: 'from-primary/10 to-yellow-600/10'
    },
  ];

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your events
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`bg-gradient-to-br ${stat.bgColor} border-2 border-gray-200 rounded-2xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bookings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
            {bookings.length > 0 && (
              <span className="text-sm text-gray-600 font-medium">
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            )}
          </div>

          {loadingBookings ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-gray-200">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-3xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Package size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No bookings yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start planning your perfect event today! Choose from our premium packages and let us make your event unforgettable.
              </p>
              <Link href="/booking/new">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-xl inline-flex items-center gap-2"
                >
                  <Sparkles size={20} />
                  Create Your First Booking
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                        {booking.packageName}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{booking.eventType}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${getStatusColor(booking.status)} whitespace-nowrap ml-2`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar size={16} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {format(booking.eventDate, 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock size={16} className="text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">{formatTimeTo12Hour(booking.eventTime)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={16} className="text-green-600" />
                      </div>
                      <span className="text-sm font-medium">{booking.guestCount} guests</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-red-600" />
                      </div>
                      <span className="text-sm font-medium line-clamp-2 flex-1">
                        {booking.location.address}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold">Estimated Price</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                        ₱{booking.totalPrice.toLocaleString()}.00
                      </span>
                    </div>
                  </div>

                  {/* View Button */}
                  <Link href={`/booking/${booking.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-shadow"
                    >
                      <Eye size={20} />
                      View Details
                    </motion.button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Floating Action Button */}
        <Link href="/booking/new">
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-16 h-16 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-3xl transition-shadow"
            title="Create New Booking"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </Link>
      </div>
    </CustomerLayout>
  );
}
