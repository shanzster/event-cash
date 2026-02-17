'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  Package,
  Plus,
  Trash2,
  TrendingUp,
  ArrowLeft,
  X,
  Download,
  Printer,
  Edit,
  Edit2,
  CalendarClock
} from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { formatCurrency } from '@/lib/currency';

interface Staff {
  id: string;
  displayName: string;
  email: string;
  phone: string;
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
}

interface BookingDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: any;
  eventTime: string;
  eventType: string;
  packageName: string;
  status: string;
  totalPrice: number;
  finalPrice?: number;
  location: {
    address: string;
  };
  expenses?: ExpenseItem[];
  priceNotes?: string;
  guestCount?: number;
  additionalFood?: string[];
  additionalServices?: any[];
  specialRequests?: string;
  dietaryRestrictions?: string;
  assignedStaff?: string[];
  downpayment?: number;
  discount?: number;
  rescheduleFee?: number;
  rescheduleHistory?: any[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { managerUser, loading, isManager } = useManager();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  // Expense form state
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [eventBudget, setEventBudget] = useState<number>(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  
  // Complete event state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalPaymentAmount, setFinalPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'check' | 'bank_transfer'>('cash');

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [rescheduleFee, setRescheduleFee] = useState('500');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Staff assignment state
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  // Invoice type modal state
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/owner/login');
    }

    fetchStaff();
  }, [managerUser, loading, isManager, router]);

  useEffect(() => {
    if (managerUser && eventId) {
      fetchEventDetails();
    }
  }, [managerUser, eventId]);

  const fetchEventDetails = async () => {
    try {
      const bookingRef = doc(db, 'bookings', eventId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        const bookingData = {
          id: bookingSnap.id,
          ...bookingSnap.data()
        } as BookingDetails;
        setBooking(bookingData);
        setEventBudget(bookingData.budget || 0);
      } else {
        alert('Event not found');
        router.push('/owner/upcoming-events');
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      alert('Failed to load event details');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddExpense = async () => {
    if (!booking || !expenseDescription.trim() || !expenseAmount || !expenseCategory) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingExpenseId) {
        // Update existing expense
        const updatedExpenses = (booking.expenses || []).map(exp => 
          exp.id === editingExpenseId 
            ? {
                ...exp,
                description: expenseDescription,
                amount: parseFloat(expenseAmount),
                category: expenseCategory,
              }
            : exp
        );

        const bookingRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingRef, { expenses: updatedExpenses });

        setBooking({ ...booking, expenses: updatedExpenses });
        setEditingExpenseId(null);
      } else {
        // Add new expense
        const newExpense: ExpenseItem = {
          id: `exp_${Date.now()}`,
          description: expenseDescription,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          date: new Date()
        };

        const currentExpenses = booking.expenses || [];
        const updatedExpenses = [...currentExpenses, newExpense];

        const bookingRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingRef, { expenses: updatedExpenses });

        setBooking({ ...booking, expenses: updatedExpenses });
      }

      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseCategory('');
      setShowExpenseModal(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setExpenseDescription(expense.description);
    setExpenseAmount(expense.amount.toString());
    setExpenseCategory(expense.category);
    setEditingExpenseId(expense.id);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!booking || !confirm('Are you sure you want to delete this expense?')) return;

    try {
      const updatedExpenses = (booking.expenses || []).filter(exp => exp.id !== expenseId);
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, { expenses: updatedExpenses });

      setBooking({ ...booking, expenses: updatedExpenses });
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const fetchStaff = async () => {
    try {
      const staffRef = collection(db, 'users');
      const q = query(staffRef, where('role', '==', 'staff'));
      const snapshot = await getDocs(q);
      const staff: Staff[] = [];
      snapshot.forEach((doc) => {
        const staffData = {
          id: doc.id,
          displayName: doc.data().displayName || '',
          email: doc.data().email || '',
          phone: doc.data().phone || '',
        };
        staff.push(staffData);
      });
      setStaffList(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAssignStaff = async () => {
    if (!booking || !selectedStaff) {
      alert('Please select a staff member');
      return;
    }

    try {
      const assignedStaff = booking.assignedStaff || [];
      if (!assignedStaff.includes(selectedStaff)) {
        assignedStaff.push(selectedStaff);
      }

      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, { assignedStaff });

      setBooking({ ...booking, assignedStaff });
      setSelectedStaff('');
      setShowStaffModal(false);
      alert('Staff member assigned successfully!');
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff');
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!booking) return;

    try {
      const assignedStaff = (booking.assignedStaff || []).filter((id: string) => id !== staffId);
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, { assignedStaff });

      setBooking({ ...booking, assignedStaff });
      alert('Staff member removed successfully!');
    } catch (error) {
      console.error('Error removing staff:', error);
      alert('Failed to remove staff');
    }
  };

  const getAssignedStaffDetails = () => {
    return (booking?.assignedStaff || [])
      .map((staffId: string) => staffList.find((s) => s.id === staffId))
      .filter((s) => s !== undefined) as Staff[];
  };

  const handleCompleteEvent = async () => {
    if (!booking) {
      alert('Booking data not found');
      return;
    }

    const initialDownpayment = booking.downpayment || 0;
    const finalPrice = booking.finalPrice || booking.totalPrice || 0;
    const rescheduleFee = booking.rescheduleFee || 0;
    const totalDue = finalPrice + rescheduleFee;
    
    // If no final payment amount is entered, assume it's 0 (already fully paid)
    const finalPayment = finalPaymentAmount ? parseFloat(finalPaymentAmount) : 0;
    const totalPayments = initialDownpayment + finalPayment;

    // Check if already fully paid
    const remainingBalance = totalDue - initialDownpayment;
    
    if (remainingBalance < 0) {
      alert(`Error: Down payment (₱${initialDownpayment.toLocaleString()}.00) exceeds total due (₱${totalDue.toLocaleString()}.00)`);
      return;
    }

    // If there's a remaining balance but no final payment entered
    if (remainingBalance > 0.01 && finalPayment === 0) {
      alert(`Please enter the final payment amount. Remaining balance: ₱${remainingBalance.toLocaleString()}.00`);
      return;
    }

    // Check if payment matches (with small tolerance for floating point)
    if (Math.abs(totalPayments - totalDue) > 0.01) {
      alert(`Payment mismatch!\n\nTotal Due: ₱${totalDue.toLocaleString()}.00\nDown Payment: ₱${initialDownpayment.toLocaleString()}.00\nFinal Payment: ₱${finalPayment.toLocaleString()}.00\nTotal Paid: ₱${totalPayments.toLocaleString()}.00\n\nRemaining: ₱${(totalDue - totalPayments).toLocaleString()}.00`);
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'completed',
        finalPayment: finalPayment,
        totalPaid: totalPayments,
        amountPaid: totalPayments,
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        completedAt: new Date(),
      });

      const totalExpenses = calculateTotalExpenses();
      const profit = totalPayments - totalExpenses;

      const transactionData = {
        bookingId: booking.id,
        managerId: managerUser?.uid,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        eventType: booking.eventType,
        packageName: booking.packageName,
        eventDate: booking.eventDate,
        amount: totalPayments,
        downpayment: booking.downpayment || 0,
        remainingBalance: finalPayment,
        expenses: booking.expenses || [],
        totalExpenses: totalExpenses,
        profit: profit,
        status: 'completed',
        completedAt: new Date(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      setBooking({
        ...booking,
        status: 'completed',
      });

      setShowCompleteModal(false);
      setFinalPaymentAmount('');
      alert('Event marked as complete and transaction recorded!');
      router.push('/owner/upcoming-events');
    } catch (error) {
      console.error('Error completing event:', error);
      alert('Failed to complete event');
    }
  };

  const handleReschedule = async () => {
    if (!booking || !newEventDate || !newEventTime) {
      alert('Please select new event date and time');
      return;
    }

    if (!rescheduleReason.trim()) {
      alert('Please provide a reason for rescheduling');
      return;
    }

    try {
      const fee = parseFloat(rescheduleFee) || 0;
      const currentFinalPrice = booking.finalPrice || booking.totalPrice || 0;
      const newFinalPrice = currentFinalPrice + fee;

      // Create reschedule history entry
      const rescheduleHistory = booking.rescheduleHistory || [];
      rescheduleHistory.push({
        oldDate: booking.eventDate,
        oldTime: booking.eventTime,
        newDate: new Date(newEventDate),
        newTime: newEventTime,
        fee: fee,
        reason: rescheduleReason,
        rescheduledBy: managerUser?.uid,
        rescheduledAt: new Date(),
      });

      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        eventDate: new Date(newEventDate),
        eventTime: newEventTime,
        finalPrice: newFinalPrice,
        rescheduleFee: (booking.rescheduleFee || 0) + fee,
        rescheduleHistory: rescheduleHistory,
        lastRescheduledAt: new Date(),
      });

      setBooking({
        ...booking,
        eventDate: new Date(newEventDate),
        eventTime: newEventTime,
        finalPrice: newFinalPrice,
        rescheduleFee: (booking.rescheduleFee || 0) + fee,
      });

      setShowRescheduleModal(false);
      setNewEventDate('');
      setNewEventTime('');
      setRescheduleFee('500');
      setRescheduleReason('');
      alert('Event rescheduled successfully! Reschedule fee has been added to the final payment.');
    } catch (error) {
      console.error('Error rescheduling event:', error);
      alert('Failed to reschedule event');
    }
  };

  const calculateTotalExpenses = () => {
    if (!booking?.expenses || booking.expenses.length === 0) return 0;
    return booking.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const saveBudget = async () => {
    try {
      const bookingRef = doc(db, 'bookings', eventId);
      await updateDoc(bookingRef, { budget: eventBudget });
      setBooking({ ...booking!, budget: eventBudget });
      setShowBudgetModal(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget');
    }
  };

  const calculateProfit = () => {
    const revenue = booking?.finalPrice || booking?.totalPrice || 0;
    const totalExpenses = calculateTotalExpenses();
    return revenue - totalExpenses;
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadOwnerInvoice = () => {
    if (!booking) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // EventCash brand colors - Orange/Gold gradient
      const primaryOrange = [255, 165, 0]; // Orange
      const primaryGold = [212, 175, 55]; // Gold
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

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

      // Invoice title on the right
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });

      yPosition = 55;

      // Invoice info section with orange accent
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      
      // Orange left border accent
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 25, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details', margin + 8, yPosition + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Invoice #: ${booking.id.substring(0, 12).toUpperCase()}`, margin + 8, yPosition + 13);
      doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 8, yPosition + 18);
      
      doc.text(`Event Date: ${booking.eventDate?.toDate ? format(booking.eventDate.toDate(), 'MMMM dd, yyyy') : format(new Date(booking.eventDate), 'MMMM dd, yyyy')}`, pageWidth - margin - 60, yPosition + 13);
      
      // Status badge
      const statusColor = booking.status === 'completed' ? [34, 197, 94] : booking.status === 'confirmed' ? [59, 130, 246] : [234, 179, 8];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(pageWidth - margin - 35, yPosition + 16, 35, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(booking.status.toUpperCase(), pageWidth - margin - 17.5, yPosition + 20, { align: 'center' });

      yPosition += 35;

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
      doc.text('Location:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const locationText = doc.splitTextToSize(booking.location.address, columnWidth - 20);
      doc.text(locationText, margin + columnWidth + 30, eventY);

      yPosition += 10;

      // Pricing Section
      yPosition += 15;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PRICING BREAKDOWN', margin + 5, yPosition + 5.5);
      
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Pricing rows with alternating background
      const pricingRows = [
        { label: 'Base Package Price', value: booking.totalPrice || 0 },
        ...(booking.discount ? [{ label: 'Discount', value: -(booking.discount) }] : []),
      ];

      pricingRows.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 3, contentWidth, 7, 'F');
        }
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(row.label, margin + 5, yPosition);
        
        const valueText = row.value < 0 ? `-Php ${Math.abs(row.value).toLocaleString()}.00` : `Php ${row.value.toLocaleString()}.00`;
        doc.text(valueText, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 7;
      });

      // Total section with orange background
      yPosition += 3;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition - 3, contentWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      const finalAmount = booking.finalPrice || booking.totalPrice || 0;
      doc.text('TOTAL AMOUNT:', margin + 5, yPosition + 4);
      doc.text(`Php ${finalAmount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 4, { align: 'right' });

      yPosition += 18;

      // Payment Information
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 20, 'F');
      
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin, yPosition, 3, 20, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INFORMATION', margin + 8, yPosition + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const downPayment = booking.downpayment || 0;
      const remainingBalance = finalAmount - downPayment;
      
      doc.text(`Down Payment:`, margin + 8, yPosition + 13);
      doc.text(`Php ${downPayment.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 13, { align: 'right' });
      
      doc.text(`Remaining Balance:`, margin + 8, yPosition + 17);
      doc.text(`Php ${remainingBalance.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 17, { align: 'right' });

      yPosition += 25;

      // Expenses Section (if any)
      if (booking.expenses && booking.expenses.length > 0) {
        doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('EXPENSES BREAKDOWN', margin + 5, yPosition + 5.5);
        
        yPosition += 12;
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        booking.expenses.forEach((expense, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 3, contentWidth, 6, 'F');
          }
          
          doc.text(`${expense.category}: ${expense.description}`, margin + 5, yPosition);
          doc.text(`Php ${expense.amount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition, { align: 'right' });
          yPosition += 6;
        });
        
        yPosition += 3;
        const totalExpenses = calculateTotalExpenses();
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(margin, yPosition - 3, contentWidth, 7, 'F');
        doc.text('Total Expenses:', margin + 5, yPosition);
        doc.text(`Php ${totalExpenses.toLocaleString()}.00`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 10;
      }

      // Terms and Conditions Section
      yPosition += 5;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin + 5, yPosition + 5.5);
      
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const terms = [
        '1. Downpayment of 30% is required to secure the booking.',
        '2. Final payment must be settled before or after the event.',
        '3. No refunds for cancellations less than 7 days before the event.'
      ];
      
      terms.forEach((term, index) => {
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
      
      doc.setTextColor(139, 69, 19);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const noteText = doc.splitTextToSize(
        'Thank you for choosing EventCash Catering Services! This invoice serves as a record of your booking. For any inquiries or modifications, please contact us at info@eventcash.com or call (123) 456-7890.',
        contentWidth - 15
      );
      doc.text(noteText, margin + 8, yPosition + 5);

      // Footer with brand colors
      yPosition = pageHeight - 20;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 7, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('info@eventcash.com | (123) 456-7890', pageWidth / 2, yPosition + 12, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPosition + 16, { align: 'center' });

      // Save PDF
      const fileName = `EventCash_Owner_Invoice_${booking.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate invoice PDF');
    }
  };

  const downloadCustomerInvoice = () => {
    if (!booking) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // EventCash brand colors - Orange/Gold gradient
      const primaryOrange = [255, 165, 0];
      const primaryGold = [212, 175, 55];
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

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

      // Invoice title on the right
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });

      yPosition = 55;

      // Invoice info section with orange accent
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      
      // Orange left border accent
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 25, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details', margin + 8, yPosition + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Invoice #: ${booking.id.substring(0, 12).toUpperCase()}`, margin + 8, yPosition + 13);
      doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 8, yPosition + 18);
      
      doc.text(`Event Date: ${booking.eventDate?.toDate ? format(booking.eventDate.toDate(), 'MMMM dd, yyyy') : format(new Date(booking.eventDate), 'MMMM dd, yyyy')}`, pageWidth - margin - 60, yPosition + 13);
      
      // Status badge
      const statusColor = booking.status === 'completed' ? [34, 197, 94] : booking.status === 'confirmed' ? [59, 130, 246] : [234, 179, 8];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(pageWidth - margin - 35, yPosition + 16, 35, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(booking.status.toUpperCase(), pageWidth - margin - 17.5, yPosition + 20, { align: 'center' });

      yPosition += 35;

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
      doc.text('Location:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const locationText = doc.splitTextToSize(booking.location.address, columnWidth - 20);
      doc.text(locationText, margin + columnWidth + 30, eventY);

      yPosition += 10;

      // Pricing Section
      yPosition += 15;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PRICING BREAKDOWN', margin + 5, yPosition + 5.5);
      
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Pricing rows with alternating background
      const pricingRows = [
        { label: 'Base Package Price', value: booking.totalPrice || 0 },
        ...(booking.discount ? [{ label: 'Discount', value: -(booking.discount) }] : []),
      ];

      pricingRows.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 3, contentWidth, 7, 'F');
        }
        
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(row.label, margin + 5, yPosition);
        
        const valueText = row.value < 0 ? `-Php ${Math.abs(row.value).toLocaleString()}.00` : `Php ${row.value.toLocaleString()}.00`;
        doc.text(valueText, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 7;
      });

      // Total section with orange background
      yPosition += 3;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition - 3, contentWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      const finalAmount = booking.finalPrice || booking.totalPrice || 0;
      doc.text('TOTAL AMOUNT:', margin + 5, yPosition + 4);
      doc.text(`Php ${finalAmount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 4, { align: 'right' });

      yPosition += 18;

      // Payment Information
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 20, 'F');
      
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin, yPosition, 3, 20, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INFORMATION', margin + 8, yPosition + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const downPayment = booking.downpayment || 0;
      const remainingBalance = finalAmount - downPayment;
      
      doc.text(`Down Payment:`, margin + 8, yPosition + 13);
      doc.text(`Php ${downPayment.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 13, { align: 'right' });
      
      doc.text(`Remaining Balance:`, margin + 8, yPosition + 17);
      doc.text(`Php ${remainingBalance.toLocaleString()}.00`, pageWidth - margin - 5, yPosition + 17, { align: 'right' });

      yPosition += 25;

      // Terms and Conditions Section
      yPosition += 5;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin + 5, yPosition + 5.5);
      
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const termsCustomer = [
        '1. Downpayment of 30% is required to secure the booking.',
        '2. Final payment must be settled before or after the event.',
        '3. No refunds for cancellations less than 7 days before the event.'
      ];
      
      termsCustomer.forEach((term, index) => {
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
      
      doc.setTextColor(139, 69, 19);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const noteText = doc.splitTextToSize(
        'Thank you for choosing EventCash Catering Services! This invoice serves as a record of your booking. For any inquiries or modifications, please contact us at info@eventcash.com or call (123) 456-7890.',
        contentWidth - 15
      );
      doc.text(noteText, margin + 8, yPosition + 5);

      // Footer with brand colors
      yPosition = pageHeight - 20;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 7, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('info@eventcash.com | (123) 456-7890', pageWidth / 2, yPosition + 12, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPosition + 16, { align: 'center' });

      // Save PDF
      const fileName = `EventCash_Customer_Invoice_${booking.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate invoice PDF');
    }
  };

  if (loading || loadingData) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading event details...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  if (!booking) {
    return null;
  }

  const totalExpenses = calculateTotalExpenses();
  const revenue = booking.finalPrice || booking.totalPrice || 0;
  const profit = calculateProfit();

  return (
    <ManagerSidebar>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          
          /* Only show the print content */
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          
          /* Hide navigation, buttons, and non-essential elements */
          .no-print,
          nav,
          aside,
          button,
          .sidebar,
          header,
          footer {
            display: none !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 2cm;
          }
          
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Print header */
          .print-header {
            text-align: center;
            border-bottom: 3px solid #F59E0B;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .print-header h1 {
            font-size: 28px;
            font-weight: bold;
            color: #000 !important;
            margin-bottom: 5px;
          }
          
          .print-header p {
            font-size: 12px;
            color: #666 !important;
          }
          
          /* Print sections */
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 25px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
          }
          
          .print-section-title {
            font-size: 16px;
            font-weight: bold;
            color: #000 !important;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #F59E0B;
          }
          
          .print-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          
          .print-row:last-child {
            border-bottom: none;
          }
          
          .print-label {
            font-weight: 600;
            color: #333 !important;
            font-size: 13px;
          }
          
          .print-value {
            color: #000 !important;
            font-size: 13px;
          }
          
          /* Expense table */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .print-table th {
            background-color: #f3f4f6 !important;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            border: 1px solid #ddd;
            color: #000 !important;
          }
          
          .print-table td {
            padding: 8px 10px;
            border: 1px solid #ddd;
            font-size: 12px;
            color: #000 !important;
          }
          
          .print-table tr:nth-child(even) {
            background-color: #f9fafb !important;
          }
          
          /* Summary boxes */
          .print-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
          }
          
          .print-summary-box {
            border: 2px solid #F59E0B;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
          }
          
          .print-summary-label {
            font-size: 11px;
            color: #666 !important;
            margin-bottom: 5px;
          }
          
          .print-summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #000 !important;
          }
          
          /* Footer */
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666 !important;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Print Header - Only visible when printing */}
          <div className="hidden print:block print-header mb-6">
            <h1 className="text-3xl font-bold text-black">Event Expense Report</h1>
            <p className="text-sm text-gray-600 mt-2">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>

          {/* Back Button & Action Buttons */}
          <div className="flex items-center justify-between mb-6 no-print">
            <Link href="/owner/upcoming-events">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-gray-600 hover:text-primary font-semibold transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Upcoming Events
              </motion.button>
            </Link>
            
            <div className="flex items-center gap-3 flex-wrap">
              {booking.status !== 'completed' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRescheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                >
                  <CalendarClock size={20} />
                  Reschedule Event
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (staffList.length === 0) {
                    fetchStaff();
                  }
                  setShowStaffModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                <User size={20} />
                Assign Staff
              </motion.button>
              {booking.status !== 'completed' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCompleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  ✓ Mark as Complete
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInvoiceTypeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Download Invoice
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Printer size={20} />
                Print Report
              </motion.button>
            </div>
          </div>

          {/* Print Content - Structured for printing */}
          <div className="print-content hidden">
            <div className="print-header">
              <h1>Event Booking Report</h1>
              <p>EventCash Catering Services</p>
              <p>Generated on {format(new Date(), 'MMMM dd, yyyy hh:mm a')}</p>
            </div>

            {/* Customer & Event Information */}
            <div className="print-section">
              <div className="print-section-title">Customer & Event Information</div>
              <div className="print-row">
                <span className="print-label">Customer Name:</span>
                <span className="print-value">{booking.customerName}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Email:</span>
                <span className="print-value">{booking.customerEmail}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Phone:</span>
                <span className="print-value">{booking.customerPhone}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Event Type:</span>
                <span className="print-value">{booking.eventType}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Package:</span>
                <span className="print-value">{booking.packageName}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Event Date:</span>
                <span className="print-value">
                  {booking.eventDate?.toDate ? format(booking.eventDate.toDate(), 'MMMM dd, yyyy') : format(new Date(booking.eventDate), 'MMMM dd, yyyy')} at {booking.eventTime}
                </span>
              </div>
              <div className="print-row">
                <span className="print-label">Guest Count:</span>
                <span className="print-value">{booking.guestCount || 'N/A'}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Location:</span>
                <span className="print-value">{booking.location.address}</span>
              </div>
              <div className="print-row">
                <span className="print-label">Status:</span>
                <span className="print-value">{booking.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="print-section">
              <div className="print-section-title">Financial Summary</div>
              <div className="print-row">
                <span className="print-label">Total Price:</span>
                <span className="print-value">₱{(booking.totalPrice || 0).toLocaleString()}.00</span>
              </div>
              {booking.discount > 0 && (
                <div className="print-row">
                  <span className="print-label">Discount:</span>
                  <span className="print-value">-₱{booking.discount.toLocaleString()}.00</span>
                </div>
              )}
              {booking.rescheduleFee && booking.rescheduleFee > 0 && (
                <div className="print-row">
                  <span className="print-label">Reschedule Fee:</span>
                  <span className="print-value">₱{booking.rescheduleFee.toLocaleString()}.00</span>
                </div>
              )}
              <div className="print-row">
                <span className="print-label">Final Amount:</span>
                <span className="print-value"><strong>₱{revenue.toLocaleString()}.00</strong></span>
              </div>
              <div className="print-row">
                <span className="print-label">Down Payment:</span>
                <span className="print-value">₱{(booking.downpayment || 0).toLocaleString()}.00</span>
              </div>
              <div className="print-row">
                <span className="print-label">Remaining Balance:</span>
                <span className="print-value">₱{Math.max(0, revenue - (booking.downpayment || 0)).toLocaleString()}.00</span>
              </div>
            </div>

            {/* Expenses */}
            {booking.expenses && booking.expenses.length > 0 && (
              <div className="print-section">
                <div className="print-section-title">Expenses Breakdown</div>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.expenses.map((expense, index) => (
                      <tr key={index}>
                        <td>{expense.category}</td>
                        <td>{expense.description}</td>
                        <td style={{ textAlign: 'right' }}>₱{expense.amount.toLocaleString()}.00</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                      <td colSpan={2}>Total Expenses</td>
                      <td style={{ textAlign: 'right' }}>₱{totalExpenses.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Assigned Staff */}
            {booking.assignedStaff && booking.assignedStaff.length > 0 && (
              <div className="print-section">
                <div className="print-section-title">Assigned Staff</div>
                {getAssignedStaffDetails().map((staff, index) => (
                  <div key={index} className="print-row">
                    <span className="print-label">{staff.displayName}</span>
                    <span className="print-value">{staff.email}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Profit Summary */}
            <div className="print-summary">
              <div className="print-summary-box">
                <div className="print-summary-label">Revenue</div>
                <div className="print-summary-value" style={{ color: '#10b981' }}>₱{revenue.toLocaleString()}.00</div>
              </div>
              <div className="print-summary-box">
                <div className="print-summary-label">Expenses</div>
                <div className="print-summary-value" style={{ color: '#ef4444' }}>₱{totalExpenses.toLocaleString()}.00</div>
              </div>
              <div className="print-summary-box">
                <div className="print-summary-label">Net Profit</div>
                <div className="print-summary-value" style={{ color: profit >= 0 ? '#3b82f6' : '#ef4444' }}>
                  ₱{profit.toLocaleString()}.00
                </div>
              </div>
            </div>

            <div className="print-footer">
              <p>EventCash Catering Services | info@eventcash.com | (123) 456-7890</p>
              <p>This is a confidential business report</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900">{booking.customerName}</h1>
            <p className="text-gray-600 mt-2">{booking.packageName}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-semibold">Revenue</p>
              <p className="text-3xl font-bold text-green-600">₱{revenue.toLocaleString()}.00</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
              <p className="text-gray-600 text-sm font-semibold">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}.00</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-semibold">Profit</p>
              <p className={`text-3xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₱{profit.toLocaleString()}.00
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-primary" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold text-black">{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-primary" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-black">{booking.customerEmail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-primary" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold text-black">{booking.customerPhone}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-primary" />
                  <span className="text-gray-600">Package:</span>
                  <span className="font-semibold text-black">{booking.packageName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-primary" />
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold text-black">
                    {booking.eventDate?.toDate && format(booking.eventDate.toDate(), 'MMMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-primary" />
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold text-black">{booking.eventTime}</span>
                </div>
                {booking.rescheduleFee && booking.rescheduleFee > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      ⚠️ Event Rescheduled
                    </p>
                    <p className="text-sm text-amber-700">
                      Reschedule Fee: ₱{booking.rescheduleFee.toLocaleString()}.00
                    </p>
                    {booking.rescheduleHistory && booking.rescheduleHistory.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Rescheduled {booking.rescheduleHistory.length} time(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Budget Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mt-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget</h2>
                <p className="text-sm text-gray-600">Set a budget for this event and track spending</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                <Edit2 size={20} />
                {eventBudget > 0 ? 'Update Budget' : 'Set Budget'}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Budget Amount */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Budget Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {eventBudget > 0 ? `₱${eventBudget.toLocaleString()}.00` : '—'}
                </p>
              </div>

              {/* Total Expenses */}
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₱{calculateTotalExpenses().toLocaleString()}.00</p>
              </div>

              {/* Budget Remaining */}
              <div className={`rounded-lg p-4 border-2 ${
                eventBudget > 0 
                  ? eventBudget - calculateTotalExpenses() >= 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-sm text-gray-600 mb-1">Budget Remaining</p>
                <p className={`text-2xl font-bold ${
                  eventBudget > 0
                    ? eventBudget - calculateTotalExpenses() >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {eventBudget > 0 
                    ? `₱${Math.abs(eventBudget - calculateTotalExpenses()).toLocaleString()}.00`
                    : '—'
                  }
                </p>
                {eventBudget > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {eventBudget - calculateTotalExpenses() >= 0 ? 'Under budget' : 'Over budget'}
                  </p>
                )}
              </div>
            </div>

            {/* Budget Status Bar */}
            {eventBudget > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Budget Usage</span>
                  <span className="text-sm font-bold text-gray-900">
                    {((calculateTotalExpenses() / eventBudget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      calculateTotalExpenses() > eventBudget ? 'bg-red-500' :
                      calculateTotalExpenses() > eventBudget * 0.8 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((calculateTotalExpenses() / eventBudget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Expenses Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mt-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                <Plus size={20} />
                Add Expense
              </motion.button>
            </div>

            {!booking.expenses || booking.expenses.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No expenses recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {booking.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-black">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">₱{expense.amount.toLocaleString()}.00</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditExpense(expense)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit expense"
                      >
                        <Edit size={20} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete expense"
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button 
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpenseId(null);
                  setExpenseDescription('');
                  setExpenseAmount('');
                  setExpenseCategory('');
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="e.g., Equipment rental"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
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
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpenseId(null);
                  setExpenseDescription('');
                  setExpenseAmount('');
                  setExpenseCategory('');
                }}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddExpense}
                className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                {editingExpenseId ? 'Update Expense' : 'Add Expense'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Assign Staff</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Staff Member</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                >
                  <option value="">Choose a staff member</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.displayName} - {staff.email}
                    </option>
                  ))}
                </select>
              </div>
              
              {getAssignedStaffDetails().length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currently Assigned</label>
                  <div className="space-y-2">
                    {getAssignedStaffDetails().map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-black">{staff.displayName}</span>
                        <button
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStaffModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAssignStaff}
                className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                Assign
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Event Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Complete Event</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Final Payment Amount</label>
                <input
                  type="number"
                  value={finalPaymentAmount}
                  onChange={(e) => setFinalPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Downpayment: ₱{(booking.downpayment || 0).toLocaleString()}.00
                </p>
                {booking.rescheduleFee && booking.rescheduleFee > 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    Reschedule Fee: ₱{booking.rescheduleFee.toLocaleString()}.00
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Total: ₱{(booking.finalPrice || booking.totalPrice || 0).toLocaleString()}.00
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'check' | 'bank_transfer')}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black font-semibold"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select how the payment was received</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCompleteEvent}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold"
              >
                Complete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {eventBudget > 0 ? 'Update Budget' : 'Set Event Budget'}
              </h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Amount (₱)</label>
                <input
                  type="number"
                  value={eventBudget}
                  onChange={(e) => setEventBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black font-semibold"
                  placeholder="Enter budget amount"
                  min="0"
                  step="100"
                />
                <p className="text-xs text-gray-500 mt-2">Set the maximum budget for expenses on this event</p>
              </div>

              {eventBudget > 0 && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Budget Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Budget:</span>
                      <span className="font-bold text-blue-900">₱{eventBudget.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Current Expenses:</span>
                      <span className="font-bold text-blue-900">₱{calculateTotalExpenses().toLocaleString()}.00</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-blue-900">Remaining:</span>
                      <span className={`font-bold ${
                        eventBudget - calculateTotalExpenses() >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₱{Math.abs(eventBudget - calculateTotalExpenses()).toLocaleString()}.00
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveBudget}
                className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                Save Budget
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reschedule Event Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Reschedule Event</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Current Event Date:</strong> {booking.eventDate?.toDate ? format(booking.eventDate.toDate(), 'MMMM dd, yyyy') : format(new Date(booking.eventDate), 'MMMM dd, yyyy')} at {booking.eventTime}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Event Date</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Event Time</label>
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reschedule Fee (₱)</label>
                <input
                  type="number"
                  value={rescheduleFee}
                  onChange={(e) => setRescheduleFee(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="500"
                />
                <p className="text-xs text-gray-500 mt-1">This fee will be added to the final payment</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Rescheduling</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  placeholder="e.g., Bad weather, client request, emergency..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>New Total:</strong> ₱{((booking.finalPrice || booking.totalPrice || 0) + parseFloat(rescheduleFee || '0')).toLocaleString()}.00
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReschedule}
                className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-semibold"
              >
                Reschedule Event
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Download Invoice</h3>
              <button onClick={() => setShowInvoiceTypeModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Choose which type of invoice you want to download:</p>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  downloadCustomerInvoice();
                  setShowInvoiceTypeModal(false);
                }}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-lg font-bold">Customer Invoice</p>
                    <p className="text-sm text-blue-100">Clean invoice without expenses or budget details</p>
                  </div>
                  <Download size={24} />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  downloadOwnerInvoice();
                  setShowInvoiceTypeModal(false);
                }}
                className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-lg font-bold">Owner Invoice</p>
                    <p className="text-sm text-green-100">Detailed invoice with expenses, budget, and profit</p>
                  </div>
                  <Download size={24} />
                </div>
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInvoiceTypeModal(false)}
              className="w-full mt-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
          </motion.div>
        </div>
      )}
    </ManagerSidebar>
  );
}
