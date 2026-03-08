'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  LogOut, 
  Check, 
  X, 
  Edit2, 
  BarChart3,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Package as PackageIcon,
  UserPlus,
  Eye,
  Trash2
} from 'lucide-react';
import ManagerSidebar from '@/components/ManagerSidebar';
import ManagerBookings from '@/components/ManagerBookings';

interface BookingDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: any;
  eventTime: string;
  guestCount: number;
  packageName: string;
  serviceTypeName: string;
  basePrice: number;
  foodAddonsPrice: number;
  servicesAddonsPrice: number;
  servicePrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'declined';
  createdAt: any;
  expenses?: number;
  discount?: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { managerUser, managerData, loading, managerLogout, isManager } = useManager();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Handle updating booking status
  const handleUpdateStatus = async (bookingId: string, newStatus: string, additionalData?: any) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const updateData: any = { status: newStatus };
      
      // Add additional data if provided
      if (additionalData) {
        if (newStatus === 'confirmed') {
          updateData.finalPrice = additionalData.finalPrice;
          updateData.originalPrice = additionalData.originalPrice;
          updateData.priceAdjustment = additionalData.priceAdjustment;
          updateData.downpayment = additionalData.downpayment || 0;
          updateData.remainingBalance = additionalData.remainingBalance || (additionalData.finalPrice - (additionalData.downpayment || 0));
          updateData.priceNotes = additionalData.priceNotes;
          updateData.confirmedAt = new Date();
        } else if (newStatus === 'cancelled') {
          updateData.rejectionReason = additionalData.rejectionReason;
          updateData.cancelledAt = new Date();
        }
      }
      
      await updateDoc(bookingRef, updateData);
      
      // Update local state
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, ...updateData } : b
      ));
      
      console.log(`Booking ${bookingId} updated to ${newStatus}`, updateData);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  // Redirect if not manager
  useEffect(() => {
    if (!loading && !isManager) {
      router.push('/owner/login');
    }
  }, [loading, isManager, router]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const querySnapshot = await getDocs(bookingsRef);
        
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventDate: doc.data().eventDate.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as BookingDetails[];

        bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    if (isManager) {
      fetchBookings();
    }
  }, [isManager]);

  if (loading || loadingBookings) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading owner dashboard...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  if (!isManager) {
    return null;
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalPrice - (b.discount || 0)), 0);
  const totalExpenses = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.expenses || 0), 0);

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
            <h1 className="text-4xl font-bold text-gray-900">Bookings Management</h1>
            <p className="text-gray-600 mt-2">Welcome, {managerData?.displayName}</p>
          </motion.div>

          {/* Upcoming Events Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings
                .filter(b => b.status === 'confirmed' && new Date(b.eventDate) >= new Date())
                .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                .slice(0, 6)
                .map((booking) => (
                  <motion.div
                    key={booking.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/owner/upcoming-events/${booking.id}`)}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{booking.customerName}</h3>
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                        {format(new Date(booking.eventDate), 'MMM dd')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <Calendar size={14} className="text-green-600" />
                        {format(new Date(booking.eventDate), 'MMMM dd, yyyy')}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock size={14} className="text-green-600" />
                        {booking.eventTime}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users size={14} className="text-green-600" />
                        {booking.guestCount} guests
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700 font-semibold">Click to view full details →</p>
                    </div>
                  </motion.div>
                ))}
              {bookings.filter(b => b.status === 'confirmed' && new Date(b.eventDate) >= new Date()).length === 0 && (
                <div className="col-span-full bg-white rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                  <Calendar size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">No upcoming events</p>
                  <p className="text-gray-500 text-sm mt-1">Confirmed bookings will appear here</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Bookings Management */}
          <ManagerBookings 
            bookings={bookings} 
            onUpdateStatus={handleUpdateStatus}
            managerId={managerUser?.uid || ''}
            onBookingCreated={() => {
              // Refresh bookings
              const fetchBookings = async () => {
                try {
                  const bookingsRef = collection(db, 'bookings');
                  const querySnapshot = await getDocs(bookingsRef);
                  
                  const bookingsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    eventDate: doc.data().eventDate.toDate(),
                    createdAt: doc.data().createdAt.toDate(),
                  })) as BookingDetails[];

                  bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                  setBookings(bookingsData);
                } catch (error) {
                  console.error('Error fetching bookings:', error);
                }
              };
              fetchBookings();
            }}
            onDeleteBooking={(bookingId) => {
              setBookings(bookings.filter(b => b.id !== bookingId));
            }}
          />
        </div>
      </div>
    </ManagerSidebar>
  );
}
