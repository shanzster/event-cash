'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StaffSidebar from '@/components/StaffSidebar';

interface BookingDetails {
  id: string;
  customerName: string;
  eventType: string;
  eventDate: any;
  totalPrice: number;
  status: string;
  expenses?: number | Array<{ amount: number }>;
}

const getExpenseAmount = (expenses: number | Array<{ amount: number }> | undefined): number => {
  if (typeof expenses === 'number') {
    return expenses || 0;
  } else if (Array.isArray(expenses)) {
    return expenses.reduce((total, item) => total + (item.amount || 0), 0);
  }
  return 0;
};

export default function StaffReportsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
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
      })) as BookingDetails[];

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

  const confirmedBookings = monthlyBookings.filter(b => b.status === 'confirmed');

  const monthlyRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const monthlyExpenses = confirmedBookings.reduce((sum, b) => sum + getExpenseAmount(b.expenses), 0);
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  // Event type breakdown
  const eventTypeBreakdown = confirmedBookings.reduce((acc, b) => {
    const existing = acc.find(item => item.type === b.eventType);
    if (existing) {
      existing.count += 1;
      existing.revenue += b.totalPrice;
    } else {
      acc.push({
        type: b.eventType,
        count: 1,
        revenue: b.totalPrice,
      });
    }
    return acc;
  }, [] as Array<{ type: string; count: number; revenue: number }>);

  if (loadingData) {
    return (
      <StaffSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading reports...</p>
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
          <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">View business performance metrics</p>
        </motion.div>

        {/* Month Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              className="px-4 py-2 bg-white rounded-lg font-semibold border-2 border-gray-200 hover:border-primary transition-colors text-black"
            >
              ← Previous
            </button>
            <span className="text-xl font-bold text-gray-900 min-w-48 text-center">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              className="px-4 py-2 bg-white rounded-lg font-semibold border-2 border-gray-200 hover:border-primary transition-colors text-black"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₱{monthlyRevenue.toLocaleString()}.00</p>
                <p className="text-xs text-gray-500 mt-1">{confirmedBookings.length} bookings</p>
              </div>
              <TrendingUp size={40} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Monthly Expenses</p>
                <p className="text-3xl font-bold text-gray-900">₱{monthlyExpenses.toLocaleString()}.00</p>
                <p className="text-xs text-gray-500 mt-1">Sum of all costs</p>
              </div>
              <TrendingDown size={40} className="text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Monthly Profit</p>
                <p className="text-3xl font-bold text-gray-900">₱{monthlyProfit.toLocaleString()}.00</p>
                <p className="text-xs text-gray-500 mt-1">Revenue - Expenses</p>
              </div>
              <TrendingUp size={40} className="text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Profit Margin</p>
                <p className="text-3xl font-bold text-gray-900">
                  {monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Profitability</p>
              </div>
              <PieChart size={40} className="text-purple-500" />
            </div>
          </div>
        </motion.div>

        {/* Event Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Event Type Breakdown</h3>
          {eventTypeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#F59E0B" name="Number of Events" />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (₱)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available for this month</p>
          )}
        </motion.div>

        {/* Event Type Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary to-yellow-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Event Type</th>
                  <th className="px-6 py-4 text-center font-semibold">Count</th>
                  <th className="px-6 py-4 text-right font-semibold">Revenue</th>
                  <th className="px-6 py-4 text-right font-semibold">Avg per Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eventTypeBreakdown.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.type}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{item.count}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      ₱{item.revenue.toLocaleString()}.00
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      ₱{(item.revenue / item.count).toLocaleString()}.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </StaffSidebar>
  );
}
