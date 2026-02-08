'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { LogOut, CreditCard, TrendingUp, TrendingDown, Wallet, FileText, PieChart, Plus, Trash2, ArrowUp, ArrowDown, Printer, Download } from 'lucide-react';
import ManagerSidebar from '@/components/ManagerSidebar';

interface BookingWithPayment {
  id: string;
  customerName: string;
  eventType: string;
  eventDate: any;
  totalPrice: number;
  discount: number;
  expenses: number | Array<{ amount: number; [key: string]: any }>;
  status: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'check' | 'bank_transfer';
  paymentDate?: any;
  amountPaid: number;
  paymentNotes?: string;
}

interface CashFlowEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: any;
  notes?: string;
  relatedBookingId?: string;
}

const getExpenseAmount = (expenses: number | Array<{ amount: number; [key: string]: any }> | undefined): number => {
  if (typeof expenses === 'number') {
    return expenses || 0;
  } else if (Array.isArray(expenses)) {
    return expenses.reduce((total, item) => total + (item.amount || 0), 0);
  }
  return 0;
};

export default function ManagerAccounting() {
  const router = useRouter();
  const { managerUser, loading, isManager, managerLogout } = useManager();
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'expenses' | 'cashflow'>('overview');
  const [cashFlowEntries, setCashFlowEntries] = useState<CashFlowEntry[]>([]);
  const [showAddCashFlow, setShowAddCashFlow] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    notes: '',
  });
  
  const [reportFilters, setReportFilters] = useState({
    type: 'all',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!loading && !isManager) {
      router.push('/manager/login');
    }
  }, [loading, isManager, router]);

  useEffect(() => {
    if (!managerUser) return;

    const cashFlowRef = collection(db, 'cashFlow');
    const q = query(cashFlowRef, where('managerId', '==', managerUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: CashFlowEntry[] = [];
      snapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data(),
        } as CashFlowEntry);
      });
      setCashFlowEntries(entries.sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(a.date);
        const dateB = b.date?.toDate?.() || new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      }));
    });

    return () => unsubscribe();
  }, [managerUser]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const querySnapshot = await getDocs(bookingsRef);
        
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventDate: doc.data().eventDate.toDate(),
          paymentStatus: doc.data().paymentStatus || 'pending',
          paymentMethod: doc.data().paymentMethod || 'cash',
          amountPaid: doc.data().amountPaid || 0,
          discount: doc.data().discount || 0,
          expenses: doc.data().expenses || 0,
        })) as BookingWithPayment[];

        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (isManager) {
      fetchBookings();
    }
  }, [isManager]);

  // Calculate metrics
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const monthlyBookings = bookings.filter(b =>
    isWithinInterval(b.eventDate, { start: monthStart, end: monthEnd })
  );

  const monthlyRevenue = monthlyBookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.totalPrice - b.discount), 0);

  const monthlyExpenses = monthlyBookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + getExpenseAmount(b.expenses), 0);

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const monthlyPaidAmount = monthlyBookings
    .filter(b => ['paid', 'partial'].includes(b.paymentStatus))
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const monthlyOutstanding = monthlyBookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => {
      const outstanding = (b.totalPrice - b.discount) - b.amountPaid;
      return sum + Math.max(0, outstanding);
    }, 0);

  // Payment breakdown - MONTHLY
  const paymentMethodBreakdown = monthlyBookings
    .filter(b => ['paid', 'partial'].includes(b.paymentStatus) && ['confirmed', 'completed'].includes(b.status) && b.amountPaid > 0)
    .reduce((acc, b) => {
      const method = b.paymentMethod || 'cash';
      const existing = acc.find(item => item.method === method);
      if (existing) {
        existing.amount += b.amountPaid;
        existing.count += 1;
      } else {
        acc.push({
          method,
          amount: b.amountPaid,
          count: 1,
        });
      }
      return acc;
    }, [] as Array<{ method: string; amount: number; count: number }>);

  // Expense breakdown by category
  const expenseBreakdown = monthlyBookings
    .filter(b => b.expenses > 0)
    .reduce((acc, b) => {
      return acc + b.expenses;
    }, 0);

  if (loading || loadingData) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading accounting data...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  if (!isManager) {
    return null;
  }

  const allTimeRevenue = bookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.totalPrice - b.discount), 0);

  const allTimeExpenses = bookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + getExpenseAmount(b.expenses), 0);

  const allTimeProfit = allTimeRevenue - allTimeExpenses;

  const allTimePaid = bookings
    .filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed')
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const allTimeOutstanding = bookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => {
      const outstanding = (b.totalPrice - b.discount) - b.amountPaid;
      return sum + Math.max(0, outstanding);
    }, 0);

  // Cash Flow calculations - including bookings expenses and transactions
  const monthlyCashFlowEntries = cashFlowEntries.filter(entry => {
    const entryDate = entry.date?.toDate?.() || new Date(entry.date);
    return isWithinInterval(entryDate, { start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) });
  });

  // Get booking expenses for the month
  const monthlyBookingExpenses = monthlyBookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + getExpenseAmount(b.expenses), 0);

  // Get transaction income for the month (from transactions collection)
  const monthlyTransactionIncome = monthlyBookings
    .filter(b => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + (b.totalPrice - b.discount), 0);

  const monthlyCashIncome = monthlyCashFlowEntries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0) + monthlyTransactionIncome;

  const monthlyCashExpense = monthlyCashFlowEntries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0) + monthlyBookingExpenses;

  // Generate combined cashflow entries from bookings and manual entries
  const generateCashFlowEntries = () => {
    const entries = [];

    // Income entries from confirmed and completed bookings
    monthlyBookings
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .forEach(booking => {
        const eventDate = booking.eventDate?.toDate?.() || new Date(booking.eventDate);
        entries.push({
          id: `income-${booking.id}`,
          type: 'income',
          amount: booking.totalPrice - booking.discount,
          description: `${booking.customerName} - ${booking.eventType}`,
          category: 'booking_income',
          date: eventDate,
          bookingId: booking.id,
          notes: `Package: ${booking.packageName || 'N/A'}`,
          source: 'booking',
        });
      });

    // Expense entries from confirmed and completed bookings
    monthlyBookings
      .filter(b => ['confirmed', 'completed'].includes(b.status) && getExpenseAmount(b.expenses) > 0)
      .forEach(booking => {
        const eventDate = booking.eventDate?.toDate?.() || new Date(booking.eventDate);
        entries.push({
          id: `expense-${booking.id}`,
          type: 'expense',
          amount: getExpenseAmount(booking.expenses),
          description: `Expenses - ${booking.customerName} (${booking.eventType})`,
          category: 'booking_expense',
          date: eventDate,
          bookingId: booking.id,
          notes: `Event expenses for ${booking.packageName || 'N/A'}`,
          source: 'booking',
        });
      });

    // Add manual cash flow entries for the month
    monthlyCashFlowEntries.forEach(entry => {
      entries.push({
        ...entry,
        source: 'manual',
      });
    });

    return entries.sort((a, b) => {
      const dateA = a.date?.toDate?.() || a.date?.getTime?.() || new Date(a.date).getTime();
      const dateB = b.date?.toDate?.() || b.date?.getTime?.() || new Date(b.date).getTime();
      return dateB - dateA;
    });
  };

  const automaticCashFlowEntries = generateCashFlowEntries();

  // Filter cashflow entries based on report filters
  const getFilteredCashflowEntries = () => {
    let filtered = automaticCashFlowEntries;

    // Filter by type
    if (reportFilters.type !== 'all') {
      filtered = filtered.filter(e => e.type === reportFilters.type);
    }

    // Filter by date range
    if (reportFilters.dateFrom) {
      const fromDate = new Date(reportFilters.dateFrom);
      filtered = filtered.filter(e => new Date(e.date) >= fromDate);
    }
    if (reportFilters.dateTo) {
      const toDate = new Date(reportFilters.dateTo);
      filtered = filtered.filter(e => new Date(e.date) <= toDate);
    }

    return filtered;
  };

  const filteredCashflowForReport = getFilteredCashflowEntries();

  // Print Cashflow Report
  const handlePrintCashflowReport = () => {
    const printWindow = window.open('', '', 'height=600,width=900');
    
    const totalIncome = filteredCashflowForReport.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = filteredCashflowForReport.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    
    const tableHtml = `
      <html>
        <head>
          <title>Cashflow Report</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Poppins', sans-serif;
              background-color: #ffffff;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #F59E0B;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              color: #1F2937;
              margin-bottom: 8px;
            }
            .header p {
              font-size: 13px;
              color: #6B7280;
              font-weight: 500;
              letter-spacing: 0.5px;
            }
            .info-bar {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 15px 20px;
              background-color: #F3F4F6;
              border-radius: 8px;
              font-size: 12px;
              color: #6B7280;
            }
            .info-bar span {
              font-weight: 600;
              color: #1F2937;
            }
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            thead {
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            }
            th { 
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              letter-spacing: 0.3px;
              border: none;
            }
            td { 
              padding: 14px 12px;
              border: none;
              border-bottom: 1px solid #E5E7EB;
              font-size: 12px;
            }
            tbody tr:last-child td {
              border-bottom: 2px solid #F59E0B;
            }
            tbody tr:hover {
              background-color: #FFFBEB;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .amount-cell {
              font-weight: 600;
              color: #1F2937;
            }
            .income-badge {
              background-color: #DCFCE7;
              color: #166534;
              padding: 6px 12px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 11px;
              display: inline-block;
            }
            .expense-badge {
              background-color: #FEE2E2;
              color: #991B1B;
              padding: 6px 12px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 11px;
              display: inline-block;
            }
            .summary {
              margin-top: 40px;
              padding: 25px;
              background: linear-gradient(135deg, #F3F4F6 0%, #F9FAFB 100%);
              border-radius: 10px;
              border-left: 4px solid #F59E0B;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 13px;
            }
            .summary-label {
              font-weight: 600;
              color: #6B7280;
            }
            .summary-value {
              font-weight: 700;
              color: #1F2937;
              min-width: 150px;
              text-align: right;
            }
            .summary-total {
              border-top: 2px solid #D1D5DB;
              padding-top: 12px;
              margin-top: 12px;
            }
            .summary-total .summary-value {
              color: #F59E0B;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              font-size: 11px;
              color: #9CA3AF;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cashflow Report</h1>
            <p>Event Cash Management System</p>
          </div>
          
          <div class="info-bar">
            <div>Printed: <span>${format(new Date(), 'MMMM dd, yyyy')}</span></div>
            <div>Time: <span>${format(new Date(), 'HH:mm:ss')}</span></div>
            <div>Total Records: <span>${filteredCashflowForReport.length}</span></div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Notes</th>
                <th class="text-right">Amount</th>
                <th class="text-center">Type</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCashflowForReport.map(e => `
                <tr>
                  <td>${format(new Date(e.date), 'MMM dd, yyyy')}</td>
                  <td><strong>${e.description}</strong></td>
                  <td>${e.notes}</td>
                  <td class="text-right amount-cell" style="color: ${e.type === 'income' ? '#16A34A' : '#DC2626'};">
                    ${e.type === 'income' ? '+' : '-'}₱${e.amount.toLocaleString()}.00
                  </td>
                  <td class="text-center">
                    <span class="${e.type === 'income' ? 'income-badge' : 'expense-badge'}">
                      ${e.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Total Income:</span>
              <span class="summary-value" style="color: #16A34A;">₱${totalIncome.toLocaleString()}.00</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Expenses:</span>
              <span class="summary-value" style="color: #DC2626;">₱${totalExpense.toLocaleString()}.00</span>
            </div>
            <div class="summary-row summary-total">
              <span class="summary-label">Net Cashflow:</span>
              <span class="summary-value">₱${(totalIncome - totalExpense).toLocaleString()}.00</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a confidential financial report. © Event Cash Management System</p>
          </div>
        </body>
      </html>
    `;
    
    if (printWindow) {
      printWindow.document.write(tableHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Export Cashflow to Excel
  const handleExportCashflowExcel = () => {
    const csvContent = [
      ['Date', 'Description', 'Notes', 'Amount', 'Type'],
      ...filteredCashflowForReport.map((e) => [
        format(new Date(e.date), 'MMM dd, yyyy'),
        e.description,
        e.notes,
        `₱${e.amount.toLocaleString()}.00`,
        e.type === 'income' ? 'Income' : 'Expense',
      ]),
      [],
      ['Summary', '', '', '', ''],
      ['Total Income', '', '', `₱${filteredCashflowForReport.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}.00`, ''],
      ['Total Expenses', '', '', `₱${filteredCashflowForReport.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}.00`, ''],
      ['Net Cashflow', '', '', `₱${(filteredCashflowForReport.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0) - filteredCashflowForReport.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}.00`, ''],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const element = document.createElement('a');
    const file = new Blob([csvContent], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = `cashflow_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle Add Cash Flow Entry
  const handleAddCashFlow = async () => {
    if (!managerUser) return;
    
    // Validation
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!newEntry.description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!newEntry.category) {
      alert('Please select a category');
      return;
    }

    try {
      await addDoc(collection(db, 'cashFlow'), {
        type: newEntry.type,
        amount: parseFloat(newEntry.amount),
        description: newEntry.description.trim(),
        category: newEntry.category,
        notes: newEntry.notes.trim(),
        date: new Date(),
        managerId: managerUser.uid,
        createdAt: new Date(),
      });

      // Reset form
      setNewEntry({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        notes: '',
      });
      setShowAddCashFlow(false);
      
      alert('Cash flow entry added successfully!');
    } catch (error) {
      console.error('Error adding cash flow entry:', error);
      alert('Failed to add cash flow entry. Please try again.');
    }
  };

  // Handle Delete Cash Flow Entry
  const handleDeleteCashFlow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteDoc(doc(db, 'cashFlow', id));
      alert('Cash flow entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting cash flow entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

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
            <h1 className="text-4xl font-bold text-gray-900">Accounting & Payments</h1>
            <p className="text-gray-600 mt-2">Comprehensive financial tracking</p>
          </motion.div>

          {/* Month Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xl font-bold text-gray-900 min-w-48 text-center">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Next →
              </button>
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                Today
              </button>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            {/* Monthly Revenue */}
            <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₱{monthlyRevenue.toLocaleString()}.00</p>
                </div>
                <CreditCard size={32} className="text-blue-500" />
              </div>
            </div>

            {/* Monthly Paid */}
            <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Monthly Paid</p>
                  <p className="text-2xl font-bold text-gray-900">₱{monthlyPaidAmount.toLocaleString()}.00</p>
                </div>
                <TrendingUp size={32} className="text-green-500" />\ 
              </div>
            </div>

            {/* Monthly Outstanding */}
            <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900">₱{monthlyOutstanding.toLocaleString()}.00</p>
                </div>
                <Wallet size={32} className="text-yellow-500" />
              </div>
            </div>

            {/* Monthly Expenses */}
            <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₱{monthlyExpenses.toLocaleString()}.00</p>
                </div>
                <TrendingDown size={32} className="text-red-500" />
              </div>
            </div>

            {/* Monthly Profit */}
            <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold">Profit</p>
                  <p className="text-2xl font-bold text-gray-900">₱{monthlyProfit.toLocaleString()}.00</p>
                </div>
                <PieChart size={32} className="text-purple-500" />
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex gap-2 bg-white rounded-xl p-2 shadow-lg overflow-x-auto"
          >
            {['overview', 'payments', 'expenses', 'cashflow'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab === 'cashflow' ? 'Cash Flow' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </motion.div>

          {/* Content by Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Monthly Summary */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">This Month Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Total Revenue:</span>
                    <span className="text-lg font-bold text-blue-600">₱{monthlyRevenue.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Total Collected:</span>
                    <span className="text-lg font-bold text-green-600">₱{monthlyPaidAmount.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Total Outstanding:</span>
                    <span className="text-lg font-bold text-yellow-600">₱{monthlyOutstanding.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Total Expenses:</span>
                    <span className="text-lg font-bold text-red-600">₱{monthlyExpenses.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <span className="font-bold text-gray-900">NET PROFIT:</span>
                    <span className="text-xl font-bold text-purple-600">₱{monthlyProfit.toLocaleString()}.00</span>
                  </div>
                </div>
              </div>

              {/* Collection Rate */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Collection Metrics (This Month)</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Collection Rate</span>
                      <span className="text-lg font-bold text-blue-600">
                        {monthlyRevenue > 0 ? ((monthlyPaidAmount / monthlyRevenue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full"
                        style={{
                          width: monthlyRevenue > 0 ? ((monthlyPaidAmount / monthlyRevenue) * 100) + '%' : 0,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Outstanding Rate</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {monthlyRevenue > 0 ? ((monthlyOutstanding / monthlyRevenue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-yellow-500 h-4 rounded-full"
                        style={{
                          width: monthlyRevenue > 0 ? ((monthlyOutstanding / monthlyRevenue) * 100) + '%' : 0,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3 font-semibold">Key Metrics:</p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Confirmed Bookings:</span> {monthlyBookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length}</p>
                      <p><span className="font-semibold">Fully Paid:</span> {monthlyBookings.filter(b => b.paymentStatus === 'paid').length}</p>
                      <p><span className="font-semibold">Partial Payment:</span> {monthlyBookings.filter(b => b.paymentStatus === 'partial').length}</p>
                      <p><span className="font-semibold">Pending Payment:</span> {monthlyBookings.filter(b => b.paymentStatus === 'pending').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Payment Method Breakdown */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method Breakdown (This Month)</h3>
                {paymentMethodBreakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Payment Method</th>
                          <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Count</th>
                          <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Amount</th>
                          <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentMethodBreakdown.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {item.method.replace(/_/g, ' ').toUpperCase()}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-700">{item.count}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600">₱{item.amount.toLocaleString()}.00</td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-700">
                              {monthlyPaidAmount > 0 ? ((item.amount / monthlyPaidAmount) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No payments recorded this month</p>
                    <p className="text-gray-500 text-sm mt-2">Payments will appear here once bookings are marked as paid or partially paid</p>
                  </div>
                )}
              </div>

              {/* All Monthly Bookings with Payment Status */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">All Bookings This Month</h3>
                {monthlyBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Customer</th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event Type</th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Status</th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Payment Status</th>
                          <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Total Price</th>
                          <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Amount Paid</th>
                          <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyBookings.map((booking) => {
                          const outstanding = (booking.totalPrice - (booking.discount || 0)) - (booking.amountPaid || 0);
                          return (
                            <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-6 py-4 font-semibold text-gray-900">{booking.customerName}</td>
                              <td className="px-6 py-4 text-gray-700">{booking.eventType}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {(booking.paymentStatus || 'pending').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-900">
                                ₱{(booking.totalPrice - (booking.discount || 0)).toLocaleString()}.00
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-green-600">
                                ₱{(booking.amountPaid || 0).toLocaleString()}.00
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-red-600">
                                ₱{Math.max(0, outstanding).toLocaleString()}.00
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No bookings this month</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Expense Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Total Monthly Expenses</p>
                  <p className="text-3xl font-bold text-red-600">₱{monthlyExpenses.toLocaleString()}.00</p>
                  <p className="text-xs text-gray-600 mt-2">{monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length} bookings with expenses</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Expense per Booking</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₱{monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length > 0 
                        ? (monthlyExpenses / monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length).toFixed(0)
                        : 0
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Expense Ratio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {monthlyRevenue > 0 ? ((monthlyExpenses / monthlyRevenue) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Monthly Profit After Exp.</p>
                    <p className="text-2xl font-bold text-green-600">₱{monthlyProfit.toLocaleString()}.00</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-3">Bookings with Expenses</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length > 0 ? (
                      monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).map(b => (
                        <div key={b.id} className="flex justify-between items-center p-2 hover:bg-white rounded">
                          <div>
                            <p className="font-semibold text-gray-900">{b.customerName}</p>
                            <p className="text-xs text-gray-600">{b.eventType}</p>
                          </div>
                          <p className="font-bold text-red-600">₱{getExpenseAmount(b.expenses).toLocaleString()}.00</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No bookings with expenses this month</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Financial Ledger</h3>
                <p className="text-sm text-gray-600 mt-1">All confirmed bookings with revenue, expenses, and profit</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900">Event</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">Discount</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">Expenses</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">Profit</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBookings.filter(b => ['confirmed', 'completed'].includes(b.status)).map(b => {
                      const netRevenue = b.totalPrice - b.discount;
                      const expenseAmount = getExpenseAmount(b.expenses);
                      const profit = netRevenue - expenseAmount;
                      return (
                        <tr key={b.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{b.customerName}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{b.eventType}</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">₱{netRevenue.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-orange-600">₱{b.discount.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">₱{expenseAmount.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-green-600">₱{profit.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              b.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                              b.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {b.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 font-bold text-gray-900">TOTALS</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">₱{monthlyRevenue.toLocaleString()}.00</td>
                      <td className="px-6 py-4 text-right font-bold text-orange-600">
                        ₱{monthlyBookings.filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((sum, b) => sum + b.discount, 0).toLocaleString()}.00
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">₱{monthlyExpenses.toLocaleString()}.00</td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-green-600">₱{monthlyProfit.toLocaleString()}.00</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'cashflow' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Cash Flow Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm font-semibold mb-2">Total Income</p>
                  <p className="text-3xl font-bold text-green-600">₱{monthlyCashIncome.toLocaleString()}.00</p>
                  <p className="text-xs text-gray-600 mt-2">
                    {monthlyCashFlowEntries.filter(e => e.type === 'income').length + monthlyBookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length} entries
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <p className="text-gray-600 text-sm font-semibold mb-2">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600">₱{monthlyCashExpense.toLocaleString()}.00</p>
                  <p className="text-xs text-gray-600 mt-2">
                    {monthlyCashFlowEntries.filter(e => e.type === 'expense').length + monthlyBookings.filter(b => b.status === 'confirmed' && getExpenseAmount(b.expenses) > 0).length} entries
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm font-semibold mb-2">Net Cash Flow</p>
                  <p className={`text-3xl font-bold ${monthlyCashIncome - monthlyCashExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ₱{(monthlyCashIncome - monthlyCashExpense).toLocaleString()}.00
                  </p>
                  <p className="text-xs text-gray-600 mt-2">This month</p>
                </div>
              </div>

              {/* Add Manual Entry Button */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-blue-900 font-semibold">Cash Flow Management</p>
                    <p className="text-blue-700 text-sm mt-1">Track all income and expenses. Booking transactions are automatic, but you can also add manual entries for other business expenses.</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddCashFlow(!showAddCashFlow)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add Entry
                </motion.button>
              </div>

              {/* Filters and Actions */}
              <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Entry Type</label>
                    <select
                      value={reportFilters.type}
                      onChange={(e) => setReportFilters({ ...reportFilters, type: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income Only</option>
                      <option value="expense">Expense Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={reportFilters.dateFrom}
                      onChange={(e) => setReportFilters({ ...reportFilters, dateFrom: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={reportFilters.dateTo}
                      onChange={(e) => setReportFilters({ ...reportFilters, dateTo: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrintCashflowReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Printer size={20} />
                    Print Report
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportCashflowExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    <Download size={20} />
                    Export to Excel
                  </motion.button>
                </div>
              </div>

              {/* Cashflow Entries */}
              {showAddCashFlow && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                      <select
                        value={newEntry.type}
                        onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'income' | 'expense' })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        value={newEntry.amount}
                        onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={newEntry.description}
                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        placeholder="e.g., Venue Rental"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <select
                        value={newEntry.category}
                        onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      >
                        <option value="">Select Category</option>
                        <option value="venue">Venue</option>
                        <option value="catering">Catering</option>
                        <option value="decoration">Decoration</option>
                        <option value="transportation">Transportation</option>
                        <option value="equipment">Equipment</option>
                        <option value="staff">Staff</option>
                        <option value="supplies">Supplies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                      <textarea
                        value={newEntry.notes}
                        onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddCashFlow}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Save Entry
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddCashFlow(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Cashflow Entries List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {automaticCashFlowEntries.length} transactions • 
                    {automaticCashFlowEntries.filter(e => e.source === 'booking').length} from bookings • 
                    {automaticCashFlowEntries.filter(e => e.source === 'manual').length} manual entries
                  </p>
                </div>
                {automaticCashFlowEntries.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No transactions this month</p>
                    <p className="text-gray-400 text-sm mt-2">Confirmed bookings and manual entries will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {automaticCashFlowEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${entry.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {entry.type === 'income' ? (
                                <TrendingUp size={20} className="text-green-600" />
                              ) : (
                                <TrendingDown size={20} className="text-red-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900">{entry.description}</p>
                                {entry.source === 'manual' && (
                                  <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                                    Manual
                                  </span>
                                )}
                                {entry.source === 'booking' && (
                                  <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700">
                                    Auto
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">{entry.notes} • {format(entry.date?.toDate?.() || new Date(entry.date), 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-gray-500 capitalize mt-1">{entry.category.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.type === 'income' ? '+' : '-'}₱{entry.amount.toLocaleString()}.00
                            </p>
                            <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${entry.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {entry.type === 'income' ? 'Income' : 'Expense'}
                            </span>
                          </div>
                          {entry.source === 'manual' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteCashFlow(entry.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ManagerSidebar>
  );
}
