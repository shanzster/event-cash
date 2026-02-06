'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/CustomerLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Eye, Package as PackageIcon } from 'lucide-react';

interface BookingDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: Date;
  eventTime: string;
  guestCount: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  packageName: string;
  serviceTypeName: string;
  totalPrice: number;
  status: string;
  createdAt: Date;
}

export default function MyBookings() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

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
    const fetchBookings = async () => {
      if (!user) return;

      try {
        console.log('=== FETCHING ALL BOOKINGS ===');
        console.log('Current user UID:', user.uid);
        
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
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status.toLowerCase() === filter);

  if (loading || loadingBookings) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading your bookings...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">My Bookings</h1>
            <p className="text-lg text-gray-600">View and manage all your event bookings</p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-wrap gap-3"
          >
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'bg-white/70 text-gray-700 border-2 border-primary/20 hover:border-primary/40'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'all' && ` (${bookings.length})`}
                {status !== 'all' && ` (${bookings.filter(b => b.status.toLowerCase() === status).length})`}
              </button>
            ))}
          </motion.div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-12 text-center"
            >
              <PackageIcon size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? "You haven't made any bookings yet." 
                  : `You don't have any ${filter} bookings.`}
              </p>
              <button
                onClick={() => router.push('/booking/new')}
                className="px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
              >
                Make a Booking
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                  className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Event Info */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{booking.eventType}</h3>
                          <p className="text-sm text-gray-600">Booking ID: {booking.id}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Booked on {format(booking.createdAt, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${getStatusColor(booking.status)}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Event Date</p>
                            <p className="text-sm font-bold">{format(booking.eventDate, 'MMM dd, yyyy')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock size={20} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Time</p>
                            <p className="text-sm font-bold">{formatTimeTo12Hour(booking.eventTime)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users size={20} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Guests</p>
                            <p className="text-sm font-bold">{booking.guestCount} people</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <PackageIcon size={20} className="text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Package</p>
                            <p className="text-sm font-bold">{booking.packageName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-gray-700">
                        <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                        <p className="text-sm">{booking.location.address}</p>
                      </div>
                    </div>

                    {/* Right Column - Price & Actions */}
                    <div className="flex flex-col justify-between">
                      <div className="bg-gradient-to-br from-primary/10 to-yellow-600/10 rounded-2xl p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-1">Estimated Price</p>
                        <p className="text-3xl font-bold text-primary">₱{booking.totalPrice.toLocaleString()}.00</p>
                      </div>

                      <button
                        onClick={() => router.push(`/booking/${booking.id}`)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                      >
                        <Eye size={20} />
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
