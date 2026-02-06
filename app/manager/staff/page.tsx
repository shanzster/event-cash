'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Plus,
  Filter,
  Search,
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';

interface Staff {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
}

interface EventAssignment {
  staffId: string;
  eventId: string;
  eventName: string;
  eventDate: any;
  eventTime: string;
  status: 'assigned' | 'completed' | 'cancelled';
}

export default function StaffPage() {
  const router = useRouter();
  const { managerUser, isManager } = useManager();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'weekly' | 'assignments'>('weekly');
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date()));
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');

  useEffect(() => {
    if (!isManager || !managerUser) {
      router.push('/manager/login');
      return;
    }

    fetchStaff();
    fetchAssignments();
  }, [isManager, managerUser]);

  const fetchStaff = async () => {
    try {
      const staffRef = collection(db, 'users');
      const q = query(staffRef, where('role', '==', 'staff'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const staff: Staff[] = [];
        snapshot.forEach((doc) => {
          staff.push({
            id: doc.id,
            ...doc.data(),
          } as Staff);
        });
        setStaffList(staff);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching staff:', error);
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('status', '==', 'confirmed'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allAssignments: EventAssignment[] = [];
        snapshot.forEach((doc) => {
          const booking = doc.data();
          if (booking.assignedStaff && Array.isArray(booking.assignedStaff)) {
            booking.assignedStaff.forEach((staffId: string) => {
              allAssignments.push({
                staffId,
                eventId: doc.id,
                eventName: booking.eventType,
                eventDate: booking.eventDate,
                eventTime: booking.eventTime,
                status: 'assigned',
              });
            });
          }
        });
        setAssignments(allAssignments);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    }
  };

  const getStaffAssignmentsForWeek = (staffId: string) => {
    const weekEnd = addDays(selectedWeekStart, 6);
    return assignments.filter((assignment) => {
      const assignmentDate = assignment.eventDate?.toDate?.() || new Date(assignment.eventDate);
      return (
        assignment.staffId === staffId &&
        assignmentDate >= selectedWeekStart &&
        assignmentDate <= weekEnd
      );
    });
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(selectedWeekStart, i));
    }
    return days;
  };

  const getAssignmentsForDay = (staffId: string, day: Date) => {
    return getStaffAssignmentsForWeek(staffId).filter((assignment) => {
      const assignmentDate = assignment.eventDate?.toDate?.() || new Date(assignment.eventDate);
      return isSameDay(assignmentDate, day);
    });
  };

  const getUnassignedStaff = () => {
    return staffList.filter((staff) => {
      const hasAssignment = assignments.some((a) => a.staffId === staff.id);
      return !hasAssignment;
    });
  };

  const getAssignedStaff = () => {
    return staffList.filter((staff) => {
      const hasAssignment = assignments.some((a) => a.staffId === staff.id);
      return hasAssignment;
    });
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = staff.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'assigned') {
      return matchesSearch && getAssignedStaff().includes(staff);
    } else if (filterStatus === 'unassigned') {
      return matchesSearch && getUnassignedStaff().includes(staff);
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading staff data...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  if (!isManager) {
    return null;
  }

  const weekDays = getWeekDays();

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent mb-2">
              Staff Management
            </h1>
            <p className="text-gray-600">Manage staff assignments and weekly shifts</p>
          </motion.div>

          {/* View Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex gap-4 bg-white rounded-xl shadow-lg p-2"
          >
            <button
              onClick={() => setViewType('weekly')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                viewType === 'weekly'
                  ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar size={20} className="inline mr-2" />
              Weekly Shifts
            </button>
            <button
              onClick={() => setViewType('assignments')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                viewType === 'assignments'
                  ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users size={20} className="inline mr-2" />
              Staff Status
            </button>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-4 mb-6"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                />
              </div>
              {viewType === 'assignments' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                >
                  <option value="all">All Staff</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              )}
            </div>
          </motion.div>

          {/* Weekly Shifts View */}
          {viewType === 'weekly' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Week Navigation */}
              <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  ← Previous Week
                </motion.button>
                <span className="text-lg font-bold text-gray-900">
                  {format(selectedWeekStart, 'MMM dd')} - {format(addDays(selectedWeekStart, 6), 'MMM dd, yyyy')}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Next Week →
                </motion.button>
              </div>

              {/* Weekly Schedule */}
              <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <div className="min-w-full">
                  {/* Header */}
                  <div className="grid grid-cols-8 gap-2 p-4 border-b-2 border-gray-200 bg-gradient-to-r from-primary/5 to-yellow-600/5">
                    <div className="font-bold text-gray-900">Staff</div>
                    {weekDays.map((day, idx) => (
                      <div key={idx} className="text-center font-bold">
                        <p className="text-sm text-gray-600">{format(day, 'EEE')}</p>
                        <p className="text-lg text-gray-900">{format(day, 'dd')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Staff Rows */}
                  {filteredStaff.map((staff) => (
                    <motion.div
                      key={staff.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-8 gap-2 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 truncate">
                        {staff.displayName}
                      </div>
                      {weekDays.map((day, idx) => {
                        const dayAssignments = getAssignmentsForDay(staff.id, day);
                        return (
                          <div
                            key={idx}
                            className="text-center min-h-24 flex flex-col gap-1"
                          >
                            {dayAssignments.length > 0 ? (
                              dayAssignments.map((assignment, i) => (
                                <div
                                  key={i}
                                  className="bg-green-100 border-l-4 border-green-600 p-2 rounded text-xs"
                                >
                                  <p className="font-semibold text-green-900">
                                    {assignment.eventName.substring(0, 3)}
                                  </p>
                                  <p className="text-green-800">{assignment.eventTime}</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-400 text-xs py-8">-</div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Staff Status View */}
          {viewType === 'assignments' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Assigned Staff */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={24} className="text-green-600" />
                  Assigned Staff ({getAssignedStaff().length})
                </h3>
                <div className="space-y-3">
                  {filteredStaff
                    .filter((staff) => getAssignedStaff().includes(staff))
                    .map((staff) => {
                      const staffAssignments = assignments.filter((a) => a.staffId === staff.id);
                      return (
                        <motion.div
                          key={staff.id}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 rounded-lg"
                        >
                          <p className="font-bold text-gray-900">{staff.displayName}</p>
                          <p className="text-sm text-gray-600">{staff.email}</p>
                          <p className="text-xs text-green-700 mt-2">
                            {staffAssignments.length} event{staffAssignments.length !== 1 ? 's' : ''} assigned
                          </p>
                          {staffAssignments.length > 0 && (
                            <div className="mt-3 space-y-1 text-xs">
                              {staffAssignments.slice(0, 3).map((assignment, idx) => (
                                <p key={idx} className="text-gray-700">
                                  • {assignment.eventName} - {format(assignment.eventDate?.toDate?.() || new Date(assignment.eventDate), 'MMM dd')}
                                </p>
                              ))}
                              {staffAssignments.length > 3 && (
                                <p className="text-gray-600">+ {staffAssignments.length - 3} more</p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  {getAssignedStaff().length === 0 && (
                    <p className="text-center text-gray-500 py-8">No assigned staff</p>
                  )}
                </div>
              </div>

              {/* Unassigned Staff */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={24} className="text-orange-600" />
                  Available Staff ({getUnassignedStaff().length})
                </h3>
                <div className="space-y-3">
                  {filteredStaff
                    .filter((staff) => getUnassignedStaff().includes(staff))
                    .map((staff) => (
                      <motion.div
                        key={staff.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-600 rounded-lg"
                      >
                        <p className="font-bold text-gray-900">{staff.displayName}</p>
                        <p className="text-sm text-gray-600">{staff.email}</p>
                        <p className="text-sm text-gray-600">{staff.phone}</p>
                        <p className="text-xs text-orange-700 mt-2 font-semibold">
                          Available for assignments
                        </p>
                      </motion.div>
                    ))}
                  {getUnassignedStaff().length === 0 && (
                    <p className="text-center text-gray-500 py-8">All staff are assigned</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ManagerSidebar>
  );
}
