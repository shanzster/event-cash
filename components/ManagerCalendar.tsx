'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, X, Ban, Plus, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Booking {
  id: string;
  customerName: string;
  eventDate: any;
  eventTime: string;
  status: string;
  packageName: string;
  location: {
    address: string;
  };
}

interface ClosedDay {
  id: string;
  date: string; // YYYY-MM-DD format
  reason: string;
  createdAt: any;
}

interface ManagerCalendarProps {
  bookings: Booking[];
}

export default function ManagerCalendar({ bookings }: ManagerCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [showClosedDayModal, setShowClosedDayModal] = useState(false);
  const [closedDayReason, setClosedDayReason] = useState('');
  const [selectedDateForClosure, setSelectedDateForClosure] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClosedDays();
  }, []);

  const fetchClosedDays = async () => {
    try {
      const closedDaysRef = collection(db, 'closedDays');
      const snapshot = await getDocs(closedDaysRef);
      
      const closedDaysData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClosedDay[];
      
      setClosedDays(closedDaysData);
    } catch (error) {
      console.error('Error fetching closed days:', error);
    }
  };

  const isClosedDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return closedDays.some(cd => cd.date === dateStr);
  };

  const getClosedDayInfo = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return closedDays.find(cd => cd.date === dateStr);
  };

  const handleAddClosedDay = async () => {
    if (!selectedDateForClosure || !closedDayReason.trim()) {
      alert('Please provide a reason for closing this day');
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDateForClosure, 'yyyy-MM-dd');
      
      // Check if already closed
      if (isClosedDay(selectedDateForClosure)) {
        alert('This day is already marked as closed');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'closedDays'), {
        date: dateStr,
        reason: closedDayReason.trim(),
        createdAt: new Date(),
      });

      alert('Day marked as closed successfully');
      setShowClosedDayModal(false);
      setClosedDayReason('');
      setSelectedDateForClosure(null);
      fetchClosedDays();
    } catch (error) {
      console.error('Error adding closed day:', error);
      alert('Failed to mark day as closed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClosedDay = async (closedDayId: string) => {
    if (!confirm('Are you sure you want to remove this closed day?')) return;

    try {
      await deleteDoc(doc(db, 'closedDays', closedDayId));
      alert('Closed day removed successfully');
      fetchClosedDays();
    } catch (error) {
      console.error('Error removing closed day:', error);
      alert('Failed to remove closed day');
    }
  };

  const openClosedDayModal = (day: Date) => {
    setSelectedDateForClosure(day);
    setShowClosedDayModal(true);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      if (!booking.eventDate) return false;
      
      let bookingDate: Date;
      if (booking.eventDate.toDate) {
        bookingDate = booking.eventDate.toDate();
      } else if (typeof booking.eventDate === 'string') {
        bookingDate = parseISO(booking.eventDate);
      } else {
        bookingDate = new Date(booking.eventDate);
      }
      
      return isSameDay(bookingDate, day);
    });
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDay(null);
  };

  // Calculate starting day of week (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();
  
  // Get days from previous month to fill the grid
  const daysFromPrevMonth = firstDayOfWeek > 0
    ? eachDayOfInterval({
        start: subMonths(monthStart, 1).getDate() - firstDayOfWeek + 1,
        end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 0).getDate(),
      }).map(day => new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, day))
    : [];
  
  // Get all days in current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate how many days from next month we need to fill the grid
  const totalCells = 42; // 6 rows x 7 days
  const daysNeeded = totalCells - (daysFromPrevMonth.length + daysInMonth.length);
  const daysFromNextMonth = Array.from({ length: daysNeeded }, (_, i) =>
    new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, i + 1)
  );
  
  const allDays = [...daysFromPrevMonth, ...daysInMonth, ...daysFromNextMonth];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Navigation */}
      <div className="flex gap-4 items-start">
        {/* Navigation Buttons - Left */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={previousMonth}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-2"
          title="Previous Month"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </motion.button>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {/* All days (previous month, current month, next month) */}
          {allDays.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasPending = dayBookings.some(b => b.status === 'pending');
          const hasConfirmed = dayBookings.some(b => b.status === 'confirmed');
          const isClosed = isClosedDay(day);
          const closedInfo = getClosedDayInfo(day);

          return (
            <motion.div
              key={day.toString()}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                if (isClosed) {
                  setSelectedDay(day);
                } else if (dayBookings.length > 0) {
                  setSelectedDay(day);
                }
              }}
              onContextMenu={(e) => {
                if (isCurrentMonth) {
                  e.preventDefault();
                  openClosedDayModal(day);
                }
              }}
              className={`
                aspect-square p-2 rounded-lg border-2 cursor-pointer transition-all relative
                ${isToday ? 'border-primary bg-primary/5' : isCurrentMonth ? 'border-gray-200 hover:border-primary/50' : 'border-gray-100 hover:border-gray-300'}
                ${isClosed ? 'bg-red-50 border-red-300' : dayBookings.length > 0 ? 'bg-blue-50' : isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${!isCurrentMonth ? 'opacity-40' : ''}
              `}
              title={isCurrentMonth ? 'Right-click to mark as closed' : ''}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : isCurrentMonth ? 'text-gray-900' : 'text-gray-500'}`}>
                  {format(day, 'd')}
                </div>
                
                {/* Closed day indicator */}
                {isClosed && (
                  <div className="flex items-center gap-1 mb-1">
                    <Ban size={12} className="text-red-600" />
                    <span className="text-[10px] text-red-600 font-semibold">CLOSED</span>
                  </div>
                )}

                {/* Booking indicators */}
                {!isClosed && (
                  <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                    {dayBookings.slice(0, 2).map((booking, index) => (
                      <div
                        key={booking.id}
                        className={`
                          text-[10px] px-1 py-0.5 rounded truncate
                          ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                          ${booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                        `}
                        title={`${booking.customerName} - ${booking.packageName}`}
                      >
                        {booking.eventTime}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[10px] text-gray-600 font-semibold">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Status dots */}
                {!isClosed && dayBookings.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                    {hasConfirmed && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        </div>

        {/* Navigation Buttons - Right */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextMonth}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-2"
          title="Next Month"
        >
          <ChevronRight size={24} className="text-gray-600" />
        </motion.button>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Ban size={14} className="text-red-600" />
            <span className="text-gray-600">Closed Day</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Right-click on any day to mark it as closed/unavailable for bookings
        </p>
      </div>

      {/* Closed Day Modal */}
      <AnimatePresence>
        {showClosedDayModal && selectedDateForClosure && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowClosedDayModal(false);
                setClosedDayReason('');
                setSelectedDateForClosure(null);
              }}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full z-50"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Mark Day as Closed
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowClosedDayModal(false);
                    setClosedDayReason('');
                    setSelectedDateForClosure(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </motion.button>
              </div>

              {/* Date Display */}
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Ban size={24} className="text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Closing Date</p>
                    <p className="text-lg font-bold text-gray-900">
                      {format(selectedDateForClosure, 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Check if already closed */}
              {isClosedDay(selectedDateForClosure) ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">
                      This day is already marked as closed
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Reason:</span> {getClosedDayInfo(selectedDateForClosure)?.reason}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const closedInfo = getClosedDayInfo(selectedDateForClosure);
                      if (closedInfo) {
                        handleRemoveClosedDay(closedInfo.id);
                        setShowClosedDayModal(false);
                        setSelectedDateForClosure(null);
                      }
                    }}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    Remove Closed Day
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Reason Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Closure <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={closedDayReason}
                      onChange={(e) => setClosedDayReason(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary text-black resize-none"
                      placeholder="e.g., Holiday, Maintenance, Staff unavailable..."
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowClosedDayModal(false);
                        setClosedDayReason('');
                        setSelectedDateForClosure(null);
                      }}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddClosedDay}
                      disabled={loading || !closedDayReason.trim()}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Ban size={20} />
                          Mark as Closed
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bookings Modal */}
      <AnimatePresence>
        {selectedDay && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto z-50"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {format(selectedDay, 'EEEE, MMMM dd, yyyy')}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </motion.button>
              </div>

              {/* Closed Day Warning */}
              {isClosedDay(selectedDay) && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Ban size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-900 mb-1">This day is closed</p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Reason:</span> {getClosedDayInfo(selectedDay)?.reason}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const closedInfo = getClosedDayInfo(selectedDay);
                          if (closedInfo) {
                            handleRemoveClosedDay(closedInfo.id);
                            setSelectedDay(null);
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Remove Closed Day
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings List */}
              <div className="space-y-3">
                {getBookingsForDay(selectedDay).length === 0 && !isClosedDay(selectedDay) ? (
                  <p className="text-center text-gray-500 py-8">No bookings for this day</p>
                ) : (
                  getBookingsForDay(selectedDay).map((booking) => (
                    <motion.div
                      key={booking.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        router.push(`/owner/upcoming-events/${booking.id}`);
                        setSelectedDay(null);
                      }}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                    >
                      <div className="space-y-3">
                        {/* Customer Info */}
                        <div className="flex items-center gap-3">
                          <User size={18} className="text-primary" />
                          <div>
                            <p className="font-semibold text-gray-900">{booking.customerName}</p>
                            <p className="text-sm text-gray-600">{booking.packageName}</p>
                          </div>
                        </div>

                        {/* Time and Location */}
                        <div className="flex items-start gap-6">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock size={16} className="text-primary flex-shrink-0" />
                            <span className="text-sm font-medium">{booking.eventTime}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-700">
                            <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{booking.location.address}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-semibold
                            ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                            ${booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                          `}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-600">Click to view details →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
