'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Package, User } from 'lucide-react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import StaffSidebar from '@/components/StaffSidebar';

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
  guestCount: number;
}

export default function StaffUpcomingEventsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Check if staff user is logged in
    const staffUser = localStorage.getItem('staffUser');
    if (!staffUser) {
      router.push('/staff/login');
      return;
    }
    fetchUpcomingEvents();
  }, [router]);

  const fetchUpcomingEvents = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('status', '==', 'confirmed'),
        orderBy('eventDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingDetails[];
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loadingData) {
    return (
      <StaffSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading upcoming events...</p>
          </div>
        </div>
      </StaffSidebar>
    );
  }

  return (
    <StaffSidebar>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900">Upcoming Events</h1>
          <p className="text-gray-600 mt-2">View confirmed events you'll be working on</p>
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
            <p className="text-gray-600 text-sm font-semibold">This Week</p>
            <p className="text-3xl font-bold text-gray-900">
              {bookings.filter(b => {
                const eventDate = b.eventDate?.toDate?.() || new Date(b.eventDate);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate <= weekFromNow;
              }).length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-semibold">Total Guests</p>
            <p className="text-3xl font-bold text-gray-900">
              {bookings.reduce((sum, b) => sum + (b.guestCount || 0), 0)}
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
            bookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push(`/staff/event/${booking.id}`)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className="p-6">
                  {/* Event Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {booking.customerName}
                    </h3>
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
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-primary" />
                        <span className="text-xs">{booking.location?.address || 'No location'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={16} className="text-primary" />
                        <span className="font-semibold text-black">{booking.guestCount} guests</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Type Badge */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-600">Event Type</span>
                    <span className="font-bold text-gray-900">{booking.eventType}</span>
                  </div>

                  {/* Click to view */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-primary font-semibold">Click to view details →</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </StaffSidebar>
  );
}
