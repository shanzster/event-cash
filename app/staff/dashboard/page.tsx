'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import StaffSidebar from '@/components/StaffSidebar';

interface EventAssignment {
  bookingId: string;
  eventType: string;
  eventDate: any;
  eventTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  location: {
    address: string;
  };
  status: string;
  totalPrice: number;
  guestCount?: number;
  specialRequests?: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('staffUser') || '{}');
    if (!user.id) {
      router.push('/staff/login');
      return;
    }

    fetchAssignedEvents(user.id);
  }, []);

  const fetchAssignedEvents = async (staffId: string) => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('assignedStaff', 'array-contains', staffId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const events: EventAssignment[] = [];
        snapshot.forEach((doc) => {
          const booking = doc.data();
          events.push({
            bookingId: doc.id,
            eventType: booking.eventType,
            eventDate: booking.eventDate,
            eventTime: booking.eventTime,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            location: booking.location,
            status: booking.status,
            totalPrice: booking.totalPrice,
            guestCount: booking.guestCount,
            specialRequests: booking.specialRequests,
          });
        });
        setAssignments(events.sort((a, b) => {
          const dateA = a.eventDate?.toDate?.() || new Date(a.eventDate);
          const dateB = b.eventDate?.toDate?.() || new Date(b.eventDate);
          return dateA.getTime() - dateB.getTime();
        }));
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const assignmentDate = assignment.eventDate?.toDate?.() || new Date(assignment.eventDate);
    const today = new Date();
    const isUpcoming = assignmentDate >= today;

    if (filterStatus === 'upcoming') return matchesSearch && isUpcoming;
    if (filterStatus === 'completed') return matchesSearch && !isUpcoming;
    return matchesSearch;
  });

  const handleViewDetails = (bookingId: string) => {
    router.push(`/staff/event/${bookingId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('staffUser');
    router.push('/staff/login');
  };

  if (loading) {
    return (
      <StaffSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading your assignments...</p>
          </div>
        </div>
      </StaffSidebar>
    );
  }

  return (
    <StaffSidebar>
      <div>
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-4 mb-6"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search events or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </motion.div>

        {/* Events Grid */}
        {filteredAssignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-12 text-center"
          >
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">No events assigned yet</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new assignments</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment, idx) => {
              const eventDate = assignment.eventDate?.toDate?.() || new Date(assignment.eventDate);
              const isUpcoming = eventDate >= new Date();

              return (
                <motion.div
                  key={assignment.bookingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Status Bar */}
                  <div className={`h-2 ${isUpcoming ? 'bg-blue-600' : 'bg-green-600'}`} />

                  <div className="p-6 space-y-4">
                    {/* Event Type and Date */}
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{assignment.eventType}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isUpcoming
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Completed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar size={16} />
                        {format(eventDate, 'MMM dd, yyyy')}
                      </div>
                    </div>

                    {/* Time and Location */}
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <span>{assignment.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <span>{assignment.location.address}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={16} className="text-primary" />
                        <span className="font-semibold">{assignment.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} />
                        <span>{assignment.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} />
                        <span>{assignment.customerPhone}</span>
                      </div>
                    </div>

                    {/* Guest Count and Special Requests */}
                    {(assignment.guestCount || assignment.specialRequests) && (
                      <div className="text-sm text-gray-700 space-y-1">
                        {assignment.guestCount && (
                          <p><strong>Guests:</strong> {assignment.guestCount}</p>
                        )}
                        {assignment.specialRequests && (
                          <p><strong>Special Requests:</strong> {assignment.specialRequests}</p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleViewDetails(assignment.bookingId)}
                      className="w-full mt-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      View Details
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </StaffSidebar>
  );
}
