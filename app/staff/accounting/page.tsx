'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { CreditCard, TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import StaffSidebar from '@/components/StaffSidebar';

interface BookingWithPayment {
  id: string;
  customerName: string;
  eventType: string;
  eventDate: any;
  totalPrice: number;
  discount: number;
  expenses: number | Array<{ amount: number }>;
  status: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  amountPaid: number;
}

const getExpenseAmount = (expenses: number | Array<{ amount: number }> | undefined): number => {
  if (typeof expenses === 'number') {
    return expenses || 0;
  } else if (Array.isArray(expenses)) {
    return expenses.reduce((total, item) => total + (item.amount || 0), 0);
  }
  return 0;
};

export default function StaffAccountingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    const staffUser = localStorage.getItem('staffUser');
    if (!staffUser) {
      router.push('/staff/login');
      return;
    }
    fetchBookings();
  }, [router]);

  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const querySnapshot = await getDocs(bookingsRef);
      
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        eventDate: doc.data().eventDate.toDate(),
        paymentStatus: doc.data().paymentStatus || 'pending',
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

  if (loadingData) {
    return (
      <StaffSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading accounting data...</p>
          </div>
        </div>
      </StaffSidebar>
    );
  }

  return (
    <StaffSidebar>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900">Accounting & Payments</h1>
          <p className="text-gray-600 mt-2">View financial tracking information</p>
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
              <TrendingUp size={32} className="text-green-500" />
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

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
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
                <span className="font-semibold text-gray-700">Net Profit:</span>
                <span className="text-xl font-bold text-purple-600">₱{monthlyProfit.toLocaleString()}.00</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Status Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700">Fully Paid:</span>
                <span className="text-lg font-bold text-green-600">
                  {monthlyBookings.filter(b => b.paymentStatus === 'paid').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-semibold text-gray-700">Partial Payment:</span>
                <span className="text-lg font-bold text-yellow-600">
                  {monthlyBookings.filter(b => b.paymentStatus === 'partial').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-semibold text-gray-700">Pending Payment:</span>
                <span className="text-lg font-bold text-red-600">
                  {monthlyBookings.filter(b => b.paymentStatus === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Total Bookings:</span>
                <span className="text-lg font-bold text-gray-900">
                  {monthlyBookings.length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </StaffSidebar>
  );
}
