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
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);

  const formatTimeTo12Hour = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const downloadInvoice = (invoiceType?: 'initial' | 'final') => {
    if (!booking) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // EventCash brand colors - Orange/Gold gradient
      const primaryOrange = [255, 165, 0];
      const primaryGold = [212, 175, 55];
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

      // Determine document type
      const isCompleted = booking.status === 'completed';
      const showFinalInvoice = invoiceType === 'final' || (isCompleted && !invoiceType);
      const documentTitle = showFinalInvoice ? 'OFFICIAL RECEIPT' : 'INVOICE';

      // Header with gradient effect (orange to gold)
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Add a gold accent bar
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(0, 40, pageWidth, 5, 'F');

      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash', margin, 25);
      
      // Subtitle
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Premium Catering Services', margin, 33);

      // Document title on the right (Invoice or Official Receipt)
      doc.setFontSize(isCompleted ? 20 : 28);
      doc.setFont('helvetica', 'bold');
      doc.text(documentTitle, pageWidth - margin, 25, { align: 'right' });

      yPosition = 55;

      // Invoice/Receipt info section with orange accent
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      
      // Orange left border accent
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 25, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(isCompleted ? 'Receipt Details' : 'Invoice Details', margin + 8, yPosition + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${isCompleted ? 'Receipt' : 'Invoice'} #: ${booking.id.substring(0, 12).toUpperCase()}`, margin + 8, yPosition + 13);
      doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 8, yPosition + 18);
      
      doc.text(`Event Date: ${format(booking.eventDate, 'MMMM dd, yyyy')}`, pageWidth - margin - 60, yPosition + 13);
      
      // Status badge
      const statusColor = booking.status === 'completed' ? [34, 197, 94] : booking.status === 'confirmed' ? [59, 130, 246] : [234, 179, 8];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(pageWidth - margin - 35, yPosition + 16, 35, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(booking.status.toUpperCase(), pageWidth - margin - 17.5, yPosition + 20, { align: 'center' });

      // Add "PAID IN FULL" stamp for completed bookings
      if (isCompleted) {
        yPosition += 30;
        doc.setFillColor(34, 197, 94); // Green
        doc.setDrawColor(22, 163, 74);
        doc.setLineWidth(2);
        doc.roundedRect(pageWidth - margin - 50, yPosition - 5, 50, 15, 3, 3, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PAID IN FULL', pageWidth - margin - 25, yPosition + 4, { align: 'center' });
        yPosition += 5;
      }

      yPosition += 30;

      // Two-column layout for Customer and Event info
      const columnWidth = (contentWidth - 10) / 2;

      // Customer Information
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', margin + 5, yPosition + 5.5);
      
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.customerName, margin + 20, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.customerEmail, margin + 20, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.customerPhone, margin + 20, yPosition);

      // Event Details (right column)
      const eventYStart = yPosition - 22;
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin + columnWidth + 10, eventYStart, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT DETAILS', margin + columnWidth + 15, eventYStart + 5.5);
      
      let eventY = eventYStart + 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Type:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.eventType, margin + columnWidth + 30, eventY);
      eventY += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Package:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const packageText = doc.splitTextToSize(booking.packageName, columnWidth - 20);
      doc.text(packageText, margin + columnWidth + 30, eventY);
      eventY += packageText.length * 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Guests:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(booking.guestCount || 'N/A'), margin + columnWidth + 30, eventY);
      eventY += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Time:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatTimeTo12Hour(booking.eventTime), margin + columnWidth + 30, eventY);

      yPosition += 10;

      // Pricing Section - Compact version
      yPosition += 10;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PRICING BREAKDOWN', margin + 5, yPosition + 4.5);
      
      yPosition += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Pricing rows with alternating background
      const pricingRows = [
        { label: 'Base Package Price', value: booking.basePrice || 0 },
        { label: 'Food Add-ons', value: booking.foodAddonsPrice || 0 },
        { label: 'Service Add-ons', value: booking.servicesAddonsPrice || 0 },
      ];

      // Add price adjustment if it exists
      if (booking.priceAdjustment && booking.priceAdjustment !== 0) {
        pricingRows.push({
          label: booking.priceAdjustment > 0 ? 'Price Adjustment (Additional)' : 'Price Adjustment (Discount)',
          value: booking.priceAdjustment
        });
      }

      pricingRows.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 2, contentWidth, 6, 'F');
        }
        
        // Reset to default color for label
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(row.label, margin + 5, yPosition);
        
        const valueText = row.value < 0 
          ? `-Php ${Math.abs(row.value).toLocaleString()}.00` 
          : `Php ${row.value.toLocaleString()}.00`;
        
        // Color code adjustments
        if (row.label.includes('Price Adjustment')) {
          if (row.value > 0) {
            doc.setTextColor(220, 38, 38); // Red for additional
          } else {
            doc.setTextColor(34, 197, 94); // Green for discount
          }
        } else {
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]); // Reset to default
        }
        
        doc.text(valueText, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 6;
      });

      // Total section with orange background
      yPosition += 2;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition - 2, contentWidth, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      const finalAmount = booking.finalPrice || booking.totalPrice || 0;
      doc.text('TOTAL AMOUNT:', margin + 5, yPosition + 3);
      doc.text(`Php ${finalAmount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 3, { align: 'right' });

      yPosition += 14;

      // Payment Information
      if (showFinalInvoice) {
        // For completed bookings, show payment history with PAID stamp
        doc.setFillColor(34, 197, 94); // Green background
        doc.rect(margin, yPosition, contentWidth, 28, 'F');
        
        // PAID IN FULL stamp
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ PAID IN FULL', pageWidth / 2, yPosition + 8, { align: 'center' });
        
        yPosition += 14;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const downPayment = booking.downpayment || 0;
        const finalPayment = booking.finalPayment || 0;
        const totalPaid = downPayment + finalPayment;
        
        doc.text(`Down Payment: Php ${downPayment.toLocaleString()}.00`, margin + 8, yPosition);
        doc.text(`Final Payment: Php ${finalPayment.toLocaleString()}.00`, pageWidth - margin - 8, yPosition, { align: 'right' });
        
        yPosition += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Total Paid: Php ${totalPaid.toLocaleString()}.00`, pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 18;
      } else {
        // For pending/confirmed bookings, show payment info with remaining balance
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(margin, yPosition, contentWidth, 20, 'F');
        
        doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
        doc.rect(margin, yPosition, 3, 20, 'F');
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT INFORMATION', margin + 8, yPosition + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const downPayment = booking.downpayment || 0;
        const remainingBalance = finalAmount - downPayment;
        
        doc.text(`Down Payment:`, margin + 8, yPosition + 11);
        doc.text(`Php ${downPayment.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 11, { align: 'right' });
        
        doc.text(`Remaining Balance:`, margin + 8, yPosition + 16);
        doc.setTextColor(220, 38, 38); // Red for remaining balance
        doc.text(`Php ${remainingBalance.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 16, { align: 'right' });

        yPosition += 24;
      }

      // Terms and Conditions Section - Compact
      yPosition += 3;
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin + 5, yPosition + 4.5);
      
      yPosition += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Different terms for completed vs pending/confirmed bookings
      const termsCustomer = showFinalInvoice ? [
        '1. Payment has been received in full for this event.',
        '2. This official receipt serves as proof of complete payment.',
        '3. Thank you for choosing EventCash Catering Services.'
      ] : [
        '1. A downpayment of 50% is required to confirm your booking.',
        '2. Remaining balance of 50% is due on or before the event date.',
        '3. Cancellations made 30 days before the event will receive a 50% refund of the downpayment.',
        '4. Cancellations made less than 30 days before the event are non-refundable.'
      ];
      
      termsCustomer.forEach((term, index) => {
        const termLines = doc.splitTextToSize(term, contentWidth - 10);
        doc.text(termLines, margin + 5, yPosition);
        yPosition += termLines.length * 4;
      });

      // Footer note - Compact
      yPosition += 3;
      doc.setFillColor(255, 248, 220);
      doc.rect(margin, yPosition, contentWidth, 15, 'F');
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 15, 'F');
      
      doc.setTextColor(139, 69, 19);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      const noteText = doc.splitTextToSize(
        showFinalInvoice 
          ? `Thank you for choosing EventCash Catering Services! This official receipt confirms your payment has been received in full. For any inquiries, please contact us at info@eventcash.com or call (123) 456-7890.`
          : `Thank you for choosing EventCash Catering Services! This invoice serves as a record of your booking. For any inquiries or modifications, please contact us at info@eventcash.com or call (123) 456-7890.`,
        contentWidth - 15
      );
      doc.text(noteText, margin + 8, yPosition + 4);

      // Footer with brand colors
      yPosition = pageHeight - 15;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('info@eventcash.com | (123) 456-7890', pageWidth / 2, yPosition + 9, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPosition + 12, { align: 'center' });

      // Save PDF with appropriate filename
      const docType = showFinalInvoice ? 'Official_Receipt' : 'Invoice';
      const fileName = `EventCash_${docType}_${booking.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Booking data:', booking);
      alert('Failed to generate invoice PDF. Check console for details.');
    }
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
                      <p className="text-sm text-gray-600 mb-1">
                        {booking.status === 'confirmed' && booking.finalPrice ? 'Final Price' : 'Estimated Price'}
                      </p>
                      <div className="space-y-1">
                        {booking.status === 'confirmed' && booking.finalPrice ? (
                          <>
                            {booking.finalPrice !== booking.totalPrice && (
                              <p className="text-sm text-gray-500 line-through">
                                ₱{booking.totalPrice.toLocaleString()}.00
                              </p>
                            )}
                            <p className="text-2xl font-bold text-primary flex items-center gap-1">
                              <Check size={24} />
                              ₱{booking.finalPrice.toLocaleString()}.00
                            </p>
                            {booking.priceAdjustment && booking.priceAdjustment !== 0 && (
                              <p className={`text-xs font-semibold ${booking.priceAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {booking.priceAdjustment > 0 ? '+' : ''}₱{booking.priceAdjustment.toLocaleString()}.00 adjustment
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-primary flex items-center gap-1">
                            <Check size={24} />
                            ₱{booking.totalPrice.toLocaleString()}.00
                          </p>
                        )}
                      </div>
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
                {booking.status === 'completed' ? (
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => downloadInvoice('final')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Download Official Receipt (Paid)
                    </motion.button>
                    <motion.button
                      onClick={() => downloadInvoice('initial')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Download Initial Invoice
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => downloadInvoice('initial')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download Invoice
                  </motion.button>
                )}
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
