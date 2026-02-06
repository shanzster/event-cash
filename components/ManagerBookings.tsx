'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Check, X, Clock, Calendar, MapPin, User, Package, Printer, FileSpreadsheet, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import BookForClientModal from './BookForClientModal';
import { formatCurrency } from '@/lib/currency';

interface Booking {
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

interface ManagerBookingsProps {
  bookings: Booking[];
  onUpdateStatus: (bookingId: string, newStatus: string) => void;
  managerId?: string;
  onBookingCreated?: () => void;
}

export default function ManagerBookings({ bookings, onUpdateStatus, managerId = '', onBookingCreated }: ManagerBookingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBookForClientModal, setShowBookForClientModal] = useState(false);
  
  // Confirmation modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Price adjustment state
  const [adjustedPrice, setAdjustedPrice] = useState('');
  const [downpayment, setDownpayment] = useState('');
  const [expenses, setExpenses] = useState('');
  const [discount, setDiscount] = useState('');
  const [priceNotes, setPriceNotes] = useState('');
  
  // Rejection reason
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Count bookings by status
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Helper function to calculate expense amount
  const getExpenseAmount = (expenses: any): number => {
    if (typeof expenses === 'number') {
      return expenses || 0;
    } else if (Array.isArray(expenses)) {
      return expenses.reduce((total, item) => total + (item.amount || 0), 0);
    }
    return 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Create CSV content
    const headers = ['Customer Name', 'Email', 'Package', 'Event Date', 'Event Time', 'Status', 'Total Price', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(booking => {
        const eventDate = booking.eventDate?.toDate 
          ? format(booking.eventDate.toDate(), 'MMM dd, yyyy')
          : booking.eventDate || 'N/A';
        
        return [
          booking.customerName,
          booking.customerEmail,
          booking.packageName,
          eventDate,
          booking.eventTime,
          booking.status,
          booking.totalPrice,
          `"${booking.location?.address || 'N/A'}"`
        ].join(',');
      })
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenConfirmModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setAdjustedPrice(booking.totalPrice?.toString() || '0');
    setExpenses('0');
    setDiscount('0');
    setPriceNotes('');
    setShowConfirmModal(true);
  };

  const handleOpenRejectModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedBooking) return;
    
    // Validate downpayment
    const finalPrice = parseFloat(adjustedPrice);
    const downpaymentAmount = parseFloat(downpayment);
    
    if (downpaymentAmount > finalPrice) {
      alert('Down payment cannot exceed final price');
      return;
    }
    
    // Update booking with final price and downpayment
    onUpdateStatus(selectedBooking.id, 'confirmed', {
      finalPrice: finalPrice,
      downpayment: downpaymentAmount,
      remainingBalance: finalPrice - downpaymentAmount,
      priceNotes,
    });
    
    setShowConfirmModal(false);
    setSelectedBooking(null);
    setAdjustedPrice('');
    setDownpayment('');
    setPriceNotes('');
  };

  const handleRejectBooking = () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    // Update booking with rejection reason
    onUpdateStatus(selectedBooking.id, 'cancelled', {
      rejectionReason,
    });
    
    setShowRejectModal(false);
    setSelectedBooking(null);
    setRejectionReason('');
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };


  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the bookings list */
          body * {
            visibility: hidden;
          }
          
          .print-area, .print-area * {
            visibility: visible;
          }
          
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
          
          /* Print-specific styling */
          @page {
            size: A4;
            margin: 2cm;
          }
          
          .print-booking-card {
            page-break-inside: avoid;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
        }
      `}</style>

    <div className="space-y-6">
      {/* Stats Cards - Hide on Print */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500 cursor-pointer"
          onClick={() => setStatusFilter('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</p>
            </div>
            <Clock size={40} className="text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500 cursor-pointer"
          onClick={() => setStatusFilter('confirmed')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Confirmed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{confirmedCount}</p>
            </div>
            <Check size={40} className="text-green-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500 cursor-pointer"
          onClick={() => setStatusFilter('completed')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{completedCount}</p>
            </div>
            <Package size={40} className="text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500 cursor-pointer"
          onClick={() => setStatusFilter('cancelled')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Cancelled</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{cancelledCount}</p>
            </div>
            <X size={40} className="text-red-500" />
          </div>
        </motion.div>
      </div>

      {/* Search and Action Buttons - Hide on Print */}
      <div className="bg-white rounded-xl shadow-lg p-6 no-print">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search bookings by customer name, email, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors text-black"
            />
          </div>

          {/* Action Buttons - 3 columns on mobile, 1 row on desktop */}
          <div className="grid grid-cols-3 lg:flex gap-2">
            {/* Filter Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Filter size={20} />
              <span className="hidden sm:inline">Filter</span>
            </motion.button>

            {/* Print Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              <span className="hidden sm:inline">Print</span>
            </motion.button>

            {/* Export to Excel Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportExcel}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={20} />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bookings List - Print Area */}
      <div className="print-area">
        {/* Print Header - Only visible when printing */}
        <div className="print-header hidden print:block">
          <h1 className="text-2xl font-bold">Bookings Report</h1>
          <p className="text-sm text-gray-600">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
          <p className="text-sm text-gray-600">Total Bookings: {filteredBookings.length}</p>
        </div>

        <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No bookings found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow print-booking-card"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{booking.customerName}</h3>
                        <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                          <User size={14} />
                          {booking.customerEmail}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package size={16} className="text-primary" />
                        <span className="text-sm font-medium">{booking.packageName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-primary" />
                        <span className="text-sm">
                          {(() => {
                            if (!booking.eventDate) return 'N/A';
                            try {
                              let date: Date;
                              if (booking.eventDate.toDate) {
                                date = booking.eventDate.toDate();
                              } else if (typeof booking.eventDate === 'string') {
                                date = new Date(booking.eventDate);
                              } else {
                                date = new Date(booking.eventDate);
                              }
                              return format(date, 'MMM dd, yyyy');
                            } catch (error) {
                              return 'Invalid Date';
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} className="text-primary" />
                        <span className="text-sm">{booking.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp size={16} className="text-primary" />
                        <span className="text-sm font-semibold">
                          {formatCurrency(booking.totalPrice || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin size={16} className="text-primary mt-0.5" />
                      <span className="text-sm">
                        {booking.location?.address}
                        {booking.location?.city && `, ${booking.location.city}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Hide on Print */}
                  <div className="flex lg:flex-col gap-2 no-print">
                    {booking.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenConfirmModal(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          <Check size={18} />
                          Confirm
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenRejectModal(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                          <X size={18} />
                          Reject
                        </motion.button>
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewBooking(booking)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={18} />
                      View
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        </div>
      </div>

      {/* Confirm Booking Modal */}
      {showConfirmModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Booking</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-900 mb-2">{selectedBooking.customerName}</p>
              <p className="text-sm text-gray-600">{selectedBooking.packageName}</p>
              <p className="text-sm text-gray-600">
                {selectedBooking.eventDate?.toDate && format(selectedBooking.eventDate.toDate(), 'MMM dd, yyyy')} at {selectedBooking.eventTime}
              </p>
            </div>

            {/* Price Adjustment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Final Price
                </label>
                <input
                  type="number"
                  value={adjustedPrice}
                  onChange={(e) => setAdjustedPrice(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors text-black font-semibold"
                  placeholder="Enter final price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original price: {formatCurrency(selectedBooking?.totalPrice || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Down Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-semibold">₱</span>
                  <input
                    type="number"
                    value={downpayment}
                    onChange={(e) => setDownpayment(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors text-black font-semibold"
                    placeholder="Enter down payment amount"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>Final Price: ₱{parseFloat(adjustedPrice || '0').toLocaleString()}.00</p>
                  <p>Down Payment: {formatCurrency(parseFloat(downpayment || '0'))}</p>
                  <p className="font-semibold text-gray-700">Remaining Balance: ₱{(parseFloat(adjustedPrice || '0') - parseFloat(downpayment || '0')).toLocaleString()}.00</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={priceNotes}
                  onChange={(e) => setPriceNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors text-black"
                  placeholder="Add notes about price adjustments..."
                />
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-500 space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Final Price</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ₱{parseFloat(adjustedPrice || '0').toLocaleString()}.00
                  </p>
                </div>
                <div className="border-t border-blue-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Down Payment (Paid Today):</span>
                    <span className="font-bold text-green-600">₱{parseFloat(downpayment || '0').toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Remaining Balance:</span>
                    <span className="font-bold text-orange-600">₱{(parseFloat(adjustedPrice || '0') - parseFloat(downpayment || '0')).toLocaleString()}.00</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Booking Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Reject Booking</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-500">
              <p className="font-semibold text-gray-900 mb-2">{selectedBooking.customerName}</p>
              <p className="text-sm text-gray-600">{selectedBooking.packageName}</p>
              <p className="text-sm text-gray-600">
                {selectedBooking.eventDate?.toDate && format(selectedBooking.eventDate.toDate(), 'MMM dd, yyyy')} at {selectedBooking.eventTime}
              </p>
            </div>

            {/* Rejection Reason */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors text-black"
                placeholder="Please provide a reason for rejecting this booking. This will be visible to the customer."
              />
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ The customer will see this reason
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectBooking}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Reject Booking
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Booking Modal */}
      {showViewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(selectedBooking.status)}`}>
                {selectedBooking.status.toUpperCase()}
              </span>
            </div>

            {/* Customer Information */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User size={20} />
                Customer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Name</p>
                  <p className="font-semibold text-black">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-semibold text-black">{selectedBooking.customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6 border-l-4 border-purple-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={20} />
                Event Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Package</p>
                  <p className="font-semibold text-black">{selectedBooking.packageName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Event Type</p>
                  <p className="font-semibold text-black">{selectedBooking.eventType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Date</p>
                  <p className="font-semibold text-black">
                    {(() => {
                      if (!selectedBooking.eventDate) return 'N/A';
                      try {
                        let date: Date;
                        if (selectedBooking.eventDate.toDate) {
                          date = selectedBooking.eventDate.toDate();
                        } else if (typeof selectedBooking.eventDate === 'string') {
                          date = new Date(selectedBooking.eventDate);
                        } else {
                          date = new Date(selectedBooking.eventDate);
                        }
                        return format(date, 'MMMM dd, yyyy (EEEE)');
                      } catch (error) {
                        return 'Invalid Date';
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Time</p>
                  <p className="font-semibold text-black">{selectedBooking.eventTime}</p>
                </div>
                {selectedBooking.guestCount && (
                  <div>
                    <p className="text-xs text-gray-600">Number of Guests</p>
                    <p className="font-semibold text-black">{selectedBooking.guestCount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-green-50 rounded-lg p-4 mb-6 border-l-4 border-green-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={20} />
                Location
              </h4>
              <p className="text-black font-semibold">{selectedBooking.location?.address}</p>
              {selectedBooking.location?.city && (
                <p className="text-black text-sm mt-1">{selectedBooking.location.city}</p>
              )}
            </div>

            {/* Financial Details */}
            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border-l-4 border-yellow-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp size={20} />
                Financial Details
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Original Price:</span>
                  <span className="font-semibold text-black">₱{selectedBooking.totalPrice?.toLocaleString() || '0'}.00</span>
                </div>
                {(selectedBooking as any).adjustedPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adjusted Price:</span>
                    <span className="font-semibold text-black">₱{((selectedBooking as any).adjustedPrice).toLocaleString()}.00</span>
                  </div>
                )}
                {(selectedBooking as any).discount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-semibold text-black">-₱{((selectedBooking as any).discount).toLocaleString()}.00</span>
                  </div>
                )}
                {(selectedBooking as any).expenses && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-semibold text-black">₱{getExpenseAmount((selectedBooking as any).expenses).toLocaleString()}.00</span>
                  </div>
                )}
                <div className="border-t-2 border-yellow-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Final Amount:</span>
                    <span className="font-bold text-xl text-black">
                      ${(() => {
                        const adjusted = (selectedBooking as any).adjustedPrice || selectedBooking.totalPrice || 0;
                        const discount = (selectedBooking as any).discount || 0;
                        return (adjusted - discount).toLocaleString();
                      })()}
                    </span>
                  </div>
                </div>
                {(selectedBooking as any).expenses && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Net Profit:</span>
                    <span className="font-semibold text-black">
                      ${(() => {
                        const adjusted = (selectedBooking as any).adjustedPrice || selectedBooking.totalPrice || 0;
                        const discount = (selectedBooking as any).discount || 0;
                        const expenses = getExpenseAmount((selectedBooking as any).expenses);
                        return (adjusted - discount - expenses).toLocaleString();
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Notes */}
            {(selectedBooking as any).priceNotes && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-gray-900 mb-2">Price Notes</h4>
                <p className="text-black">{(selectedBooking as any).priceNotes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {selectedBooking.status === 'cancelled' && (selectedBooking as any).rejectionReason && (
              <div className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">Rejection Reason</h4>
                <p className="text-black">{(selectedBooking as any).rejectionReason}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Created:</span>
                  <span className="text-black font-semibold">
                    {selectedBooking.createdAt
                      ? (selectedBooking.createdAt.toDate 
                        ? format(selectedBooking.createdAt.toDate(), 'MMM dd, yyyy hh:mm a')
                        : format(new Date(selectedBooking.createdAt), 'MMM dd, yyyy hh:mm a'))
                      : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed:</span>
                  <span className={`font-semibold ${(selectedBooking as any).confirmedAt ? 'text-green-600' : 'text-gray-600'}`}>
                    {(selectedBooking as any).confirmedAt
                      ? ((selectedBooking as any).confirmedAt.toDate 
                        ? format((selectedBooking as any).confirmedAt.toDate(), 'MMM dd, yyyy hh:mm a')
                        : format(new Date((selectedBooking as any).confirmedAt), 'MMM dd, yyyy hh:mm a'))
                      : 'Pending'}
                  </span>
                </div>
                {(selectedBooking as any).cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancelled:</span>
                    <span className="text-red-600 font-semibold">
                      {(selectedBooking as any).cancelledAt.toDate 
                        ? format((selectedBooking as any).cancelledAt.toDate(), 'MMM dd, yyyy hh:mm a')
                        : format(new Date((selectedBooking as any).cancelledAt), 'MMM dd, yyyy hh:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-black">Filter Bookings</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors text-black"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Apply Filter
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FAB Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowBookForClientModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
        title="Book for Client"
      >
        <Plus size={28} />
      </motion.button>

      {/* Book for Client Modal */}
      <BookForClientModal
        isOpen={showBookForClientModal}
        onClose={() => setShowBookForClientModal(false)}
        managerId={managerId}
        onBookingCreated={() => {
          setShowBookForClientModal(false);
          onBookingCreated?.();
        }}
      />
    </div>
    </>
  );
}
