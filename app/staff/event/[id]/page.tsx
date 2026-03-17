'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import StaffSidebar from '@/components/StaffSidebar';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  loggedBy: string;
  timestamp: any;
}

interface BookingDetails {
  id: string;
  eventType: string;
  eventDate: any;
  eventTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  location: { address: string };
  guestCount?: number;
  specialRequests?: string;
  totalPrice: number;
  expenses?: Expense[];
}

export default function StaffEventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
  });

  const staffUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('staffUser') || '{}') : {};

  useEffect(() => {
    if (!staffUser.id) {
      router.push('/staff/login');
      return;
    }

    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const docRef = doc(db, 'bookings', eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setBooking({
          id: docSnap.id,
          ...docSnap.data(),
        } as BookingDetails);
      } else {
        alert('Event not found');
        router.push('/staff/dashboard');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.category) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newExpense: Expense = {
        id: Date.now().toString(),
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        loggedBy: staffUser.displayName || 'Unknown Staff',
        timestamp: new Date(),
      };

      const expenses = booking?.expenses || [];
      expenses.push(newExpense);

      const bookingRef = doc(db, 'bookings', eventId);
      await updateDoc(bookingRef, { expenses });

      setBooking({ ...booking!, expenses });
      setExpenseForm({ description: '', amount: '', category: '' });
      setShowExpenseModal(false);
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const expenses = (booking?.expenses || []).filter((e) => e.id !== expenseId);
      const bookingRef = doc(db, 'bookings', eventId);
      await updateDoc(bookingRef, { expenses });

      setBooking({ ...booking!, expenses });
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const handleDownloadInvoice = () => {
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

      // EventCash brand colors
      const primaryOrange = [255, 165, 0];
      const primaryGold = [212, 175, 55];
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

      // Compact Header
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(0, 27, pageWidth, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash', margin, 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Staff Event Report', margin, 22);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT REPORT', pageWidth - margin, 18, { align: 'right' });

      yPosition = 38;

      // Compact Event info section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 18, 'F');
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 2, 18, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Details', margin + 5, yPosition + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`ID: ${booking.id.substring(0, 12).toUpperCase()}`, margin + 5, yPosition + 9);
      doc.text(`Report: ${format(new Date(), 'MMM dd, yyyy')}`, margin + 5, yPosition + 13);
      doc.text(`Event: ${format(booking.eventDate?.toDate?.() || new Date(booking.eventDate), 'MMM dd, yyyy')}`, pageWidth - margin - 45, yPosition + 9);
      doc.text(`Staff: ${staffUser.displayName || 'Unknown'}`, pageWidth - margin - 45, yPosition + 13);

      yPosition += 22;

      // Two-column layout for Customer and Event
      const columnWidth = (contentWidth - 5) / 2;

      // Customer Information
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, columnWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER', margin + 3, yPosition + 4);
      
      yPosition += 8;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', margin + 3, yPosition);
      doc.setFont('helvetica', 'normal');
      const nameText = doc.splitTextToSize(booking.customerName, columnWidth - 18);
      doc.text(nameText, margin + 15, yPosition);
      yPosition += nameText.length * 3.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin + 3, yPosition);
      doc.setFont('helvetica', 'normal');
      const emailText = doc.splitTextToSize(booking.customerEmail, columnWidth - 18);
      doc.text(emailText, margin + 15, yPosition);
      yPosition += emailText.length * 3.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', margin + 3, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.customerPhone, margin + 15, yPosition);

      // Event Details (right column)
      const eventYStart = yPosition - (nameText.length * 3.5) - (emailText.length * 3.5) - 8;
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin + columnWidth + 5, eventYStart, columnWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT INFO', margin + columnWidth + 8, eventYStart + 4);
      
      let eventY = eventYStart + 8;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Type:', margin + columnWidth + 8, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.eventType, margin + columnWidth + 18, eventY);
      eventY += 3.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Time:', margin + columnWidth + 8, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(booking.eventTime, margin + columnWidth + 18, eventY);
      eventY += 3.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Guests:', margin + columnWidth + 8, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(booking.guestCount || 'N/A'), margin + columnWidth + 18, eventY);
      eventY += 3.5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Location:', margin + columnWidth + 8, eventY);
      doc.setFont('helvetica', 'normal');
      const locationText = doc.splitTextToSize(booking.location.address, columnWidth - 15);
      doc.text(locationText, margin + columnWidth + 18, eventY);

      yPosition += 6;

      // Expenses Section
      if (booking.expenses && booking.expenses.length > 0) {
        doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        doc.rect(margin, yPosition, contentWidth, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('EXPENSES', margin + 3, yPosition + 4);
        
        yPosition += 8;
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        
        booking.expenses.forEach((expense, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 2, contentWidth, 4, 'F');
          }
          
          const expenseDesc = doc.splitTextToSize(`${expense.category}: ${expense.description}`, contentWidth - 30);
          doc.text(expenseDesc, margin + 3, yPosition);
          doc.text(`₱${expense.amount.toLocaleString()}`, pageWidth - margin - 3, yPosition, { align: 'right' });
          yPosition += 4;
        });
        
        yPosition += 1;
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(margin, yPosition - 2, contentWidth, 5, 'F');
        doc.text('Total Expenses:', margin + 3, yPosition);
        doc.text(`₱${totalExpenses.toLocaleString()}`, pageWidth - margin - 3, yPosition, { align: 'right' });
        yPosition += 6;
      }

      // Financial Summary
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin, yPosition, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL SUMMARY', margin + 3, yPosition + 4);
      
      yPosition += 8;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Event Price:', margin + 3, yPosition);
      doc.text(`₱${booking.totalPrice.toLocaleString()}`, pageWidth - margin - 3, yPosition, { align: 'right' });
      yPosition += 5;
      
      doc.text('Total Expenses:', margin + 3, yPosition);
      doc.setTextColor(220, 38, 38);
      doc.text(`₱${totalExpenses.toLocaleString()}`, pageWidth - margin - 3, yPosition, { align: 'right' });
      yPosition += 6;
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition - 2, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      const netAmount = booking.totalPrice - totalExpenses;
      doc.text('NET AMOUNT:', margin + 3, yPosition + 2);
      doc.text(`₱${netAmount.toLocaleString()}`, pageWidth - margin - 3, yPosition + 2, { align: 'right' });

      yPosition += 9;

      // Special Requests (compact)
      if (booking.specialRequests) {
        doc.setFillColor(255, 248, 220);
        doc.rect(margin, yPosition, contentWidth, 12, 'F');
        
        doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        doc.rect(margin, yPosition, 2, 12, 'F');
        
        doc.setTextColor(139, 69, 19);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Special Requests:', margin + 5, yPosition + 4);
        doc.setFont('helvetica', 'normal');
        const requestText = doc.splitTextToSize(booking.specialRequests, contentWidth - 10);
        doc.text(requestText.slice(0, 2), margin + 5, yPosition + 7);
      }

      // Compact Footer
      yPosition = pageHeight - 12;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 4, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`info@eventcash.com | (123) 456-7890 | Generated by: ${staffUser.displayName || 'Staff'} on ${format(new Date(), 'MMM dd, yyyy')}`, pageWidth / 2, yPosition + 8, { align: 'center' });

      // Save PDF
      const fileName = `Staff_Report_${booking.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate report PDF');
    }
  };

  const downloadCustomerInvoice = () => {
    if (!booking) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;
      const primaryOrange = [255, 165, 0];
      const primaryGold = [212, 175, 55];
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

      // Header
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(0, 40, pageWidth, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32); doc.setFont('helvetica', 'bold');
      doc.text('EventCash', margin, 25);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text('Premium Catering Services', margin, 33);
      doc.setFontSize(28); doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });

      yPosition = 55;

      // Invoice info section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 25, 'F');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details', margin + 8, yPosition + 7);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(`Invoice #: ${booking.id.substring(0, 12).toUpperCase()}`, margin + 8, yPosition + 13);
      doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 8, yPosition + 18);
      doc.text(`Event Date: ${booking.eventDate?.toDate ? format(booking.eventDate.toDate(), 'MMMM dd, yyyy') : format(new Date(booking.eventDate), 'MMMM dd, yyyy')}`, pageWidth - margin - 60, yPosition + 13);
      const statusColor = (booking as any).status === 'completed' ? [34, 197, 94] : (booking as any).status === 'confirmed' ? [59, 130, 246] : [234, 179, 8];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(pageWidth - margin - 35, yPosition + 16, 35, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(((booking as any).status || 'pending').toUpperCase(), pageWidth - margin - 17.5, yPosition + 20, { align: 'center' });

      yPosition += 35;

      // Two-column layout
      const columnWidth = (contentWidth - 10) / 2;

      // Customer Information
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', margin + 5, yPosition + 5.5);
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setFont('helvetica', 'bold'); doc.text('Name:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal'); doc.text(booking.customerName, margin + 20, yPosition); yPosition += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Email:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal'); doc.text(booking.customerEmail, margin + 20, yPosition); yPosition += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Phone:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal'); doc.text(booking.customerPhone, margin + 20, yPosition);

      // Event Details (right column)
      const eventYStart = yPosition - 22;
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin + columnWidth + 10, eventYStart, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('EVENT DETAILS', margin + columnWidth + 15, eventYStart + 5.5);
      let eventY = eventYStart + 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setFont('helvetica', 'bold'); doc.text('Type:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal'); doc.text(booking.eventType, margin + columnWidth + 30, eventY); eventY += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Package:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const packageText = doc.splitTextToSize((booking as any).packageName || 'N/A', columnWidth - 20);
      doc.text(packageText, margin + columnWidth + 30, eventY); eventY += packageText.length * 5;
      doc.setFont('helvetica', 'bold'); doc.text('Guests:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal'); doc.text(String(booking.guestCount || 'N/A'), margin + columnWidth + 30, eventY); eventY += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Location:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const locationText = doc.splitTextToSize(booking.location.address, columnWidth - 20);
      doc.text(locationText, margin + columnWidth + 30, eventY);

      yPosition += 25;

      // Pricing Section
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('PRICING BREAKDOWN', margin + 5, yPosition + 5.5);
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);

      const pricingRows: { label: string; value: number }[] = [
        { label: 'Base Package Price', value: booking.totalPrice || 0 },
        ...((booking as any).discount ? [{ label: 'Discount', value: -((booking as any).discount) }] : []),
      ];
      if ((booking as any).priceAdjustment && (booking as any).priceAdjustment !== 0) {
        pricingRows.push({
          label: (booking as any).priceAdjustment > 0 ? 'Price Adjustment (Additional)' : 'Price Adjustment (Discount)',
          value: (booking as any).priceAdjustment
        });
      }

      pricingRows.forEach((row, index) => {
        if (index % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, yPosition - 3, contentWidth, 7, 'F'); }
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(row.label, margin + 5, yPosition);
        const valueText = row.value < 0 ? `-Php ${Math.abs(row.value).toLocaleString()}.00` : `Php ${row.value.toLocaleString()}.00`;
        if (row.label.includes('Price Adjustment')) {
          doc.setTextColor(row.value > 0 ? 220 : 34, row.value > 0 ? 38 : 197, row.value > 0 ? 38 : 94);
        } else { doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]); }
        doc.text(valueText, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 7;
      });

      // Total
      yPosition += 3;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition - 3, contentWidth, 12, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
      const finalAmount = (booking as any).finalPrice || booking.totalPrice || 0;
      doc.text('TOTAL AMOUNT:', margin + 5, yPosition + 4);
      doc.text(`Php ${finalAmount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 4, { align: 'right' });
      yPosition += 18;

      // Payment Information
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 20, 'F');
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin, yPosition, 3, 20, 'F');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INFORMATION', margin + 8, yPosition + 7);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const downPayment = (booking as any).downpayment || 0;
      const remainingBalance = finalAmount - downPayment;
      doc.text('Down Payment:', margin + 8, yPosition + 13);
      doc.text(`Php ${downPayment.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 13, { align: 'right' });
      doc.text('Remaining Balance:', margin + 8, yPosition + 17);
      doc.text(`Php ${remainingBalance.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 17, { align: 'right' });
      yPosition += 30;

      // Terms and Conditions
      if (yPosition > pageHeight - 80) { doc.addPage(); yPosition = margin; }
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin + 5, yPosition + 5.5);
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      const termsCustomer = [
        '1. A downpayment of 50% is required to confirm your booking.',
        '2. Remaining balance of 50% is due on or before the event date.',
        '3. Cancellations made 30 days before the event will receive a 50% refund of the downpayment.',
        '4. Cancellations made less than 30 days before the event are non-refundable.'
      ];
      termsCustomer.forEach((term) => {
        const termLines = doc.splitTextToSize(term, contentWidth - 10);
        doc.text(termLines, margin + 5, yPosition);
        yPosition += termLines.length * 5;
      });

      // Footer note
      yPosition += 5;
      doc.setFillColor(255, 248, 220);
      doc.rect(margin, yPosition, contentWidth, 20, 'F');
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 20, 'F');
      doc.setTextColor(139, 69, 19); doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      const noteText = doc.splitTextToSize(
        'Thank you for choosing EventCash Catering Services! This invoice serves as a record of your booking. For any inquiries or modifications, please contact us at info@eventcash.com or call (123) 456-7890.',
        contentWidth - 15
      );
      doc.text(noteText, margin + 8, yPosition + 5);

      // Footer
      yPosition = pageHeight - 20;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 7, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text('info@eventcash.com | (123) 456-7890', pageWidth / 2, yPosition + 12, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPosition + 16, { align: 'center' });

      doc.save(`EventCash_Customer_Invoice_${booking.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate invoice PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Event not found</p>
      </div>
    );
  }

  const totalExpenses = (booking.expenses || []).reduce((sum, e) => sum + e.amount, 0);

  return (
    <StaffSidebar>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/staff/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{booking.eventType}</h1>
              <p className="text-gray-600">{booking.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              <Printer size={20} />
              Print
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInvoiceTypeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              <Download size={20} />
              Download Invoice
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Calendar size={20} />
                <span>{format(booking.eventDate?.toDate?.() || new Date(booking.eventDate), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Clock size={20} />
                <span>{booking.eventTime}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={20} />
                <span>{booking.location.address}</span>
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <User size={20} />
                  <span>{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={20} />
                  <span>{booking.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={20} />
                  <span>{booking.customerPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {booking.guestCount && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
              <strong>Guest Count:</strong> {booking.guestCount}
            </div>
          )}

          {booking.specialRequests && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-900">
              <strong>Special Requests:</strong> {booking.specialRequests}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Expenses Logged</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg"
            >
              <Plus size={20} />
              Add Expense
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 text-sm">Total Price</p>
              <p className="text-2xl font-bold text-blue-900">₱{booking.totalPrice.toLocaleString()}.00</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-gray-600 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">₱{totalExpenses.toLocaleString()}.00</p>
            </div>
          </div>

          {booking.expenses && booking.expenses.length > 0 ? (
            <div className="space-y-3">
              {booking.expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 border-2 border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-600">
                      {expense.category} • Logged by {expense.loggedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-900">₱{expense.amount.toLocaleString()}.00</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No expenses logged yet</p>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Log Expense</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="e.g., Equipment rental"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  >
                    <option value="">Select Category</option>
                    <option value="venue">Venue</option>
                    <option value="equipment">Equipment</option>
                    <option value="supplies">Supplies</option>
                    <option value="transportation">Transportation</option>
                    <option value="food">Food</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddExpense}
                  className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg"
                >
                  Log Expense
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    
    {/* Invoice Type Modal */}
    <AnimatePresence>
      {showInvoiceTypeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInvoiceTypeModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Download Invoice</h3>
            <p className="text-gray-600 mb-6">Choose the type of invoice to download.</p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { downloadCustomerInvoice(); setShowInvoiceTypeModal(false); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-colors text-left"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Customer Invoice</p>
                  <p className="text-sm text-gray-600">Pricing breakdown, payment info, terms & conditions</p>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { handleDownloadInvoice(); setShowInvoiceTypeModal(false); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-colors text-left"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Staff Event Report</p>
                  <p className="text-sm text-gray-600">Expenses breakdown, financial summary, staff details</p>
                </div>
              </motion.button>
            </div>
            <button
              onClick={() => setShowInvoiceTypeModal(false)}
              className="mt-4 w-full py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </StaffSidebar>
  );
}
