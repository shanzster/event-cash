'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import ManagerCalendar from '@/components/ManagerCalendar';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    city?: string;
  };
  guestCount?: number;
  createdAt: any;
}

export default function ManagerCalendarPage() {
  const router = useRouter();
  const { managerUser, loading, isManager } = useManager();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/manager/login');
    }
  }, [managerUser, loading, isManager, router]);

  useEffect(() => {
    if (managerUser) {
      fetchBookings();
    }
  }, [managerUser]);

  const fetchBookings = async () => {
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
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  if (loading || loadingBookings) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading calendar...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Calendar View</h1>
            <p className="text-gray-600 mt-2">Visual overview of all bookings</p>
          </div>
          
          <ManagerCalendar bookings={bookings} />
        </div>
      </div>
    </ManagerSidebar>
  );
}
