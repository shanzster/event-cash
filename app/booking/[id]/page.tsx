'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CustomerLayout from '@/components/CustomerLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Mail,
  Phone,
  Package as PackageIcon,
  ArrowLeft,
  Check,
  Download,
  X
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookingDetails } from '@/types/booking';
import { format } from 'date-fns';
import Link from 'next/link';
import jsPDF from 'jspdf';

export default function BookingDetail() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);

  const formatTimeTo12Hour = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const downloadInvoice = () => {
    if (!booking) return;

    const doc = new jsPDF();
    const primaryColor = [255, 165, 0];
    const darkColor = [51, 51, 51];
    const lightGray = [240, 240, 240];
    
    let yPos = 20;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.text('EventCash Catering', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('CUSTOMER COPY - UNOFFICIAL RECEIPT', 105, 28, { align: 'center' });
    doc.text('info@eventcash.com | (123) 456-7890', 105, 35, { align: 'center' });

    yPos = 50;

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPos, 180, 20, 'F');
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('BOOKING DETAILS', 20, yPos + 7);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(`Booking ID: ${booking.id}`, 20, yPos + 13);
    doc.text(`Date Booked: ${format(booking.createdAt, 'MMMM dd, yyyy')}`, 20, yPos + 17);
    doc.text(`Status: ${booking.status.toUpperCase()}`, 130, yPos + 13);

    yPos += 30;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('CUSTOMER INFORMATION', 20, yPos + 5.5);
    
    yPos += 12;
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${booking.customerName}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${booking.customerEmail}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${booking.customerPhone}`, 20, yPos);

    yPos += 12;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('EVENT INFORMATION', 20, yPos + 5.5);
    
    yPos += 12;
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Event Type: ${booking.eventType}`, 20, yPos);
    yPos += 6;
    doc.text(`Event Date: ${format(booking.eventDate, 'MMMM dd, yyyy')}`, 20, yPos);
    yPos += 6;
    doc.text(`Event Time: ${formatTimeTo12Hour(booking.eventTime)}`, 20, yPos);
    yPos += 6;
    doc.text(`Number of Guests: ${booking.guestCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Package: ${booking.packageName}`, 20, yPos);

    yPos += 10;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('PRICING BREAKDOWN', 20, yPos + 5.5);
    
    yPos += 12;
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    
    doc.text('Base Package Price:', 20, yPos);
    doc.text(`Php ${booking.basePrice.toLocaleString()}.00`, 170, yPos, { align: 'right' });
    yPos += 6;
    doc.text('Food Add-ons:', 20, yPos);
    doc.text(`Php ${booking.foodAddonsPrice.toLocaleString()}.00`, 170, yPos, { align: 'right' });
    yPos += 6;
    doc.text('Service Add-ons:', 20, yPos);
    doc.text(`Php ${booking.servicesAddonsPrice.toLocaleString()}.00`, 170, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 7;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ESTIMATED TOTAL:', 20, yPos);
    doc.text(`Php ${booking.totalPrice.toLocaleString()}.00`, 170, yPos, { align: 'right' });

    const eventDateFormatted = format(booking.eventDate, 'MMMM_dd_yyyy');
    const packageNameFormatted = booking.packageName.replace(/\s+/g, '');
    const filename = `${eventDateFormatted}_Booking_${packageNameFormatted}.pdf`;

    doc.save(filename);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !params.id) return;

      try {
        const bookingDoc = await getDoc(doc(db, 'bookings', params.id as string));
        if (bookingDoc.exists()) {
          const data = bookingDoc.data();
          setBooking({
            id: bookingDoc.id,
            ...data,
            eventDate: data.eventDate.toDate(),
            createdAt: data.createdAt.toDate(),
          } as BookingDetails);
        } else {
          alert('Booking not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoadingBooking(false);
      }
    };

    if (user) {
      fetchBooking();
    }
  }, [user, params.id, router]);

  if (loading || !user || loadingBooking) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!booking) {
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

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-6 px-4 py-2 bg-gray-200 text-gray-900 rounded-xl font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </motion.button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
                  Booking Details
                </h1>
                <p className="text-gray-600">Booking ID: {booking.id}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(booking.status)}`}>
                {booking.status.toUpperCase()}
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                  <PackageIcon size={28} className="text-primary" />
                  Package Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Package</p>
                    <p className="text-xl font-bold text-gray-900">{booking.packageName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event Type</p>
                    <p className="text-lg font-semibold text-gray-900">{booking.eventType}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Number of Guests</p>
                      <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        {booking.guestCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estimated Price</p>
                      <p className="text-2xl font-bold text-primary flex items-center gap-1">
                        <Check size={24} />
                        ₱{booking.totalPrice.toLocaleString()}.00
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                  <Calendar size={28} className="text-primary" />
                  Event Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {format(booking.eventDate, 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Time</p>
                      <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Clock size={20} className="text-primary" />
                        {formatTimeTo12Hour(booking.eventTime)}
                      </p>
                    </div>
                  </div>
                  {booking.dietaryRestrictions && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Dietary Restrictions</p>
                      <p className="text-gray-900">{booking.dietaryRestrictions}</p>
                    </div>
                  )}
                  {booking.specialRequests && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Special Requests</p>
                      <p className="text-gray-900">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                  <MapPin size={28} className="text-primary" />
                  Event Location
                </h2>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold mb-2">{booking.location.address}</p>
                      <div className="flex gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-900">Booking Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Booked On</p>
                    <p className="text-gray-900 font-medium">
                      {format(booking.createdAt, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <motion.button
                  onClick={downloadInvoice}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Invoice
                </motion.button>
              </motion.div>

              {booking.status === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-3xl p-6 shadow-lg"
                >
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Need Changes?</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Contact us to modify or cancel your booking.
                  </p>
                  <motion.button
                    onClick={() => setShowContactModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold shadow-lg"
                  >
                    Contact Us
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary to-yellow-600 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Contact Information</h2>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-white/90 mt-2">EventCash Catering Services</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <a 
                      href="mailto:info@eventcash.com" 
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      info@eventcash.com
                    </a>
                    <p className="text-xs text-gray-500 mt-1">We typically respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <a 
                      href="tel:+1234567890" 
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      (123) 456-7890
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Monday - Friday: 9AM - 6PM</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-bold">Your Booking ID:</span>
                  </p>
                  <p className="text-lg font-bold text-gray-900">{booking?.id}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Please reference this ID when contacting us about your booking.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
                <motion.a
                  href="mailto:info@eventcash.com"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Send Email
                </motion.a>
                <motion.a
                  href="tel:+1234567890"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Call Now
                </motion.a>
              </div>
            </motion.div>
          </div>
        )}
      </CustomerLayout>
    );
  }
