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
      
      console.log(`Booking ${bookingId} updated to ${newStatus}`);
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
          />
        </div>
      </div>
    </ManagerSidebar>
  );
}
