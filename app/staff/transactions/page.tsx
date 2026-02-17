'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, FileText, TrendingUp } from 'lucide-react';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import StaffSidebar from '@/components/StaffSidebar';

interface Transaction {
  id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  eventType: string;
  packageName: string;
  amount: number;
  downpayment: number;
  remainingBalance: number;
  totalExpenses: number;
  profit: number;
  completedAt: any;
  eventDate: any;
  status: string;
}

export default function StaffTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check if staff user is logged in
    const staffUser = localStorage.getItem('staffUser');
    if (!staffUser) {
      router.push('/staff/login');
      return;
    }
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      setLoadingData(true);
      const transactionsRef = collection(db, 'transactions');
      
      const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
        const txns: Transaction[] = [];
        snapshot.forEach((doc) => {
          const transaction = doc.data();
          txns.push({
            id: doc.id,
            bookingId: transaction.bookingId || '',
            customerName: transaction.customerName || 'Unknown',
            customerEmail: transaction.customerEmail || '',
            eventType: transaction.eventType || 'N/A',
            packageName: transaction.packageName || 'N/A',
            amount: transaction.amount || 0,
            downpayment: transaction.downpayment || 0,
            remainingBalance: transaction.remainingBalance || 0,
            totalExpenses: transaction.totalExpenses || 0,
            profit: transaction.profit || 0,
            completedAt: transaction.completedAt,
            eventDate: transaction.eventDate,
            status: transaction.status || 'pending',
          });
        });
        setTransactions(txns.sort((a, b) => {
          const dateA = a.completedAt?.toDate?.() || new Date(a.completedAt);
          const dateB = b.completedAt?.toDate?.() || new Date(b.completedAt);
          return dateB.getTime() - dateA.getTime();
        }));
        setLoadingData(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const filtered = transactions.filter((transaction) =>
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.packageName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm]);

  const totalTransactions = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalProfit = filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);

  if (loadingData) {
    return (
      <StaffSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading transactions...</p>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-gray-600 mt-2">View all completed transactions</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalTransactions}</p>
              </div>
              <FileText size={32} className="text-primary" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ₱{totalAmount.toLocaleString()}.00
                </p>
              </div>
              <TrendingUp size={32} className="text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  ₱{totalExpenses.toLocaleString()}.00
                </p>
              </div>
              <TrendingUp size={32} className="text-red-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Profit</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₱{totalProfit.toLocaleString()}.00
                </p>
              </div>
              <TrendingUp size={32} className="text-green-500" />
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-4 mb-6"
        >
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, event type, package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
            />
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
        >
          {filteredTransactions.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={56} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary via-yellow-600 to-primary text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-sm">Completed Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-sm">Customer</th>
                    <th className="px-6 py-4 text-left font-semibold text-sm">Event Type</th>
                    <th className="px-6 py-4 text-left font-semibold text-sm">Package</th>
                    <th className="px-6 py-4 text-right font-semibold text-sm">Amount</th>
                    <th className="px-6 py-4 text-right font-semibold text-sm">Expenses</th>
                    <th className="px-6 py-4 text-right font-semibold text-sm">Profit</th>
                    <th className="px-6 py-4 text-center font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {format(
                          transaction.completedAt?.toDate?.() || new Date(transaction.completedAt),
                          'MMM dd, yyyy'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{transaction.customerName}</div>
                        <div className="text-xs text-gray-500">{transaction.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{transaction.eventType}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{transaction.packageName}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                        ₱{transaction.amount.toLocaleString()}.00
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                        ₱{transaction.totalExpenses.toLocaleString()}.00
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                        ₱{transaction.profit.toLocaleString()}.00
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </StaffSidebar>
  );
}
