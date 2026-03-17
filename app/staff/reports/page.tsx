'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, PieChart, Target, AlertCircle, Filter, Printer } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StaffSidebar from '@/components/StaffSidebar';

interface BookingDetails {
  id: string; customerName: string; eventType: string; eventDate: any;
  totalPrice: number; status: string; expenses?: number | Array<{ amount: number }>;
  discount?: number; budget?: number;
}

const getExpenseAmount = (expenses: number | Array<{ amount: number }> | undefined): number => {
  if (typeof expenses === 'number') return expenses || 0;
  if (Array.isArray(expenses)) return expenses.reduce((t, i) => t + (i.amount || 0), 0);
  return 0;
};

export default function StaffReportsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeReport, setActiveReport] = useState<'income-expenses' | 'profitability' | 'budget' | 'cashflow'>('income-expenses');
  const [profitabilityViewType, setProfitabilityViewType] = useState<'week' | 'month'>('month');
  const [filters, setFilters] = useState({ status: 'all', eventType: 'all', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' });
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    const staffUser = localStorage.getItem('staffUser');
    if (!staffUser) { router.push('/staff/login'); return; }
    const fetchBookings = async () => {
      try {
        const snap = await getDocs(collection(db, 'bookings'));
        setBookings(snap.docs.map(doc => ({
          id: doc.id, ...doc.data(),
          eventDate: doc.data().eventDate.toDate(),
        })) as BookingDetails[]);
      } catch (e) { console.error(e); } finally { setLoadingData(false); }
    };
    fetchBookings();
  }, [router]);

  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const snap = await getDocs(collection(db, 'transactions'));
        setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error(e); }
    };
    fetchTransactions();
  }, []);

  const getCashflowByMonth = () => {
    const cashflow: Record<string, any> = {};
    transactions.forEach(trans => {
      if (!trans.completedAt) return;
      const transDate = trans.completedAt?.toDate ? trans.completedAt.toDate() : new Date(trans.completedAt);
      const monthKey = format(transDate, 'yyyy-MM');
      if (!cashflow[monthKey]) cashflow[monthKey] = { month: monthKey, income: 0, expenses: 0, profit: 0, transactions: [] };
      cashflow[monthKey].income += trans.amount || 0;
      cashflow[monthKey].expenses += trans.totalExpenses || 0;
      cashflow[monthKey].profit = cashflow[monthKey].income - cashflow[monthKey].expenses;
      cashflow[monthKey].transactions.push(trans);
    });
    return Object.values(cashflow).sort((a, b) => b.month.localeCompare(a.month));
  };

  const cashflowData = getCashflowByMonth();

  const getFilteredBookings = () => {
    let f = bookings;
    if (filters.status !== 'all') f = f.filter(b => b.status === filters.status);
    if (filters.eventType !== 'all') f = f.filter(b => b.eventType === filters.eventType);
    if (filters.dateFrom) f = f.filter(b => new Date(b.eventDate) >= new Date(filters.dateFrom));
    if (filters.dateTo) f = f.filter(b => new Date(b.eventDate) <= new Date(filters.dateTo));
    if (filters.minAmount) f = f.filter(b => b.totalPrice >= parseFloat(filters.minAmount));
    if (filters.maxAmount) f = f.filter(b => b.totalPrice <= parseFloat(filters.maxAmount));
    return f;
  };

  const filteredBookings = getFilteredBookings();
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthlyConfirmedBookings = confirmedBookings.filter(b => isWithinInterval(b.eventDate, { start: monthStart, end: monthEnd }));
  const monthlyRevenue = monthlyConfirmedBookings.reduce((s, b) => s + (b.totalPrice - (b.discount || 0)), 0);
  const monthlyExpenses = monthlyConfirmedBookings.reduce((s, b) => s + getExpenseAmount(b.expenses), 0);
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.totalPrice - (b.discount || 0)), 0);
  const totalExpenses = confirmedBookings.reduce((s, b) => s + getExpenseAmount(b.expenses), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const eventTypeBreakdown = confirmedBookings.reduce((acc, b) => {
    const ex = acc.find(i => i.type === b.eventType);
    const exp = getExpenseAmount(b.expenses);
    if (ex) { ex.count++; ex.revenue += b.totalPrice - (b.discount||0); ex.expenses += exp; }
    else acc.push({ type: b.eventType, count: 1, revenue: b.totalPrice - (b.discount||0), expenses: exp });
    return acc;
  }, [] as Array<{ type: string; count: number; revenue: number; expenses: number }>);

  const topCustomers = confirmedBookings.reduce((acc, b) => {
    const ex = acc.find(i => i.name === b.customerName);
    if (ex) { ex.bookings++; ex.totalSpent += b.totalPrice - (b.discount||0); }
    else acc.push({ name: b.customerName, bookings: 1, totalSpent: b.totalPrice - (b.discount||0) });
    return acc;
  }, [] as Array<{ name: string; bookings: number; totalSpent: number }>).sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 5);

  const getProfitabilityByWeek = () => {
    const wd: Record<string, any> = {};
    confirmedBookings.forEach(b => {
      const ws = startOfWeek(b.eventDate, { weekStartsOn: 1 });
      const key = format(ws, 'yyyy-MM-dd');
      if (!wd[key]) wd[key] = { week: `Week of ${format(ws, 'MMM dd')}`, revenue: 0, expenses: 0, profit: 0, margin: 0, bookings: 0 };
      const rev = b.totalPrice - (b.discount||0); const exp = getExpenseAmount(b.expenses);
      wd[key].revenue += rev; wd[key].expenses += exp; wd[key].profit += rev - exp; wd[key].bookings++;
    });
    Object.values(wd).forEach(w => { w.margin = w.revenue > 0 ? (w.profit / w.revenue) * 100 : 0; });
    return Object.values(wd).sort((a,b) => a.week.localeCompare(b.week));
  };

  const getProfitabilityByMonth = () => {
    const md: Record<string, any> = {};
    confirmedBookings.forEach(b => {
      const key = format(b.eventDate, 'yyyy-MM');
      if (!md[key]) md[key] = { month: format(b.eventDate, 'MMM yyyy'), revenue: 0, expenses: 0, profit: 0, margin: 0, bookings: 0 };
      const rev = b.totalPrice - (b.discount||0); const exp = getExpenseAmount(b.expenses);
      md[key].revenue += rev; md[key].expenses += exp; md[key].profit += rev - exp; md[key].bookings++;
    });
    Object.values(md).forEach(m => { m.margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0; });
    return Object.values(md).sort((a,b) => a.month.localeCompare(b.month));
  };

  const chartData = profitabilityViewType === 'week' ? getProfitabilityByWeek() : getProfitabilityByMonth();
  const uniqueEventTypes = [...new Set(bookings.map(b => b.eventType))];

  const handlePrintReport = () => {
    const pw = window.open('', '', 'height=600,width=900');
    if (!pw) return;
    const title = activeReport === 'income-expenses' ? 'Income vs Expenses' : activeReport === 'profitability' ? 'Profitability Analysis' : 'Budget Analysis';
    pw.document.write(`<html><head><title>${title} Report</title>
    <style>body{font-family:sans-serif;padding:40px}h1{border-bottom:3px solid #F59E0B;padding-bottom:10px}
    .metric{display:inline-block;margin-right:30px;margin-bottom:20px}
    .ml{font-size:12px;color:#6B7280;font-weight:600}.mv{font-size:18px;font-weight:700;margin-top:5px}
    .footer{text-align:center;margin-top:40px;border-top:1px solid #eee;padding-top:20px;font-size:11px;color:#9CA3AF}</style></head>
    <body><h1>${title} Report</h1>
    <p>Month: ${format(selectedMonth,'MMMM yyyy')} &nbsp;|&nbsp; Printed: ${format(new Date(),'MMMM dd, yyyy HH:mm:ss')}</p>
    <div style="margin-top:20px">
      <div class="metric"><div class="ml">Monthly Revenue</div><div class="mv">₱${monthlyRevenue.toLocaleString()}.00</div></div>
      <div class="metric"><div class="ml">Total Expenses</div><div class="mv">₱${monthlyExpenses.toLocaleString()}.00</div></div>
      <div class="metric"><div class="ml">Net Profit</div><div class="mv">₱${monthlyProfit.toLocaleString()}.00</div></div>
      <div class="metric"><div class="ml">Profit Margin</div><div class="mv">${monthlyRevenue > 0 ? (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(1) : 0}%</div></div>
    </div>
    <div class="footer"><p>© Event Cash Management System</p></div></body></html>`);
    pw.document.close(); pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
  };

  const handleExportReportExcel = () => {
    const title = activeReport === 'income-expenses' ? 'Income vs Expenses' : activeReport === 'profitability' ? 'Profitability Analysis' : 'Budget Analysis';
    const rows = [
      [title + ' Report'], ['Month', format(selectedMonth, 'MMMM yyyy')],
      ['Exported on', format(new Date(), 'MMMM dd, yyyy HH:mm:ss')], [],
      ['Monthly Revenue', monthlyRevenue.toLocaleString()],
      ['Total Expenses', monthlyExpenses.toLocaleString()],
      ['Net Profit', monthlyProfit.toLocaleString()],
      ['Profit Margin %', monthlyRevenue > 0 ? (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(2) : 0],
      ['Number of Bookings', monthlyConfirmedBookings.length],
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `${title.toLowerCase().replace(/\s+/g,'_')}_${format(selectedMonth,'yyyy-MM')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (loadingData) return (
    <StaffSidebar>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading reports...</p>
        </div>
      </div>
    </StaffSidebar>
  );

  return (
    <StaffSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-2">Track business performance</p>
              </div>
              <button onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg">
                <Filter size={20} /> Filters & Print
              </button>
            </div>
          </motion.div>

          {/* Filter Modal */}
          {showFilterModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Filters & Actions</h3>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-black">
                      <option value="all">All</option><option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option><option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type</label>
                    <select value={filters.eventType} onChange={e => setFilters({...filters, eventType: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-black">
                      <option value="all">All Types</option>
                      {uniqueEventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">From Date</label>
                      <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">To Date</label>
                      <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-black" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={handlePrintReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    <Printer size={18} /> Print Report
                  </button>
                  <button onClick={handleExportReportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    📊 Export Excel
                  </button>
                  <button onClick={() => setFilters({ status: 'all', eventType: 'all', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                    Reset
                  </button>
                  <button onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Month Selector */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="px-4 py-2 bg-white rounded-lg font-semibold border-2 border-gray-200 hover:border-primary text-black">← Previous</button>
              <span className="text-xl font-bold text-gray-900 min-w-48 text-center">{format(selectedMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="px-4 py-2 bg-white rounded-lg font-semibold border-2 border-gray-200 hover:border-primary text-black">Next →</button>
              <button onClick={() => setSelectedMonth(new Date())}
                className="px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold">Today</button>
            </div>
          </motion.div>

          {/* Report Tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="flex gap-4 border-b-2 border-gray-200 overflow-x-auto">
              {(['income-expenses', 'profitability', 'budget', 'cashflow'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveReport(tab)}
                  className={`px-6 py-3 font-semibold transition-all border-b-4 whitespace-nowrap ${activeReport === tab ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  <TrendingUp size={20} className="inline mr-2" />
                  {tab === 'income-expenses' ? 'Income vs Expenses' : tab === 'profitability' ? 'Profitability Analysis' : tab === 'budget' ? 'Budget Analysis' : 'Cashflow'}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrintReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                <Printer size={20} /> Print Report
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportReportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                📊 Export to Excel
              </motion.button>
            </div>
          </motion.div>

          {/* Income vs Expenses */}
          {activeReport === 'income-expenses' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div><p className="text-gray-600 text-sm font-semibold">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">₱{monthlyRevenue.toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">{monthlyConfirmedBookings.length} bookings</p></div>
                    <TrendingUp size={40} className="text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div><p className="text-gray-600 text-sm font-semibold">Monthly Expenses</p>
                      <p className="text-3xl font-bold text-gray-900">₱{monthlyExpenses.toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Sum of all costs</p></div>
                    <TrendingDown size={40} className="text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div><p className="text-gray-600 text-sm font-semibold">Monthly Profit</p>
                      <p className="text-3xl font-bold text-gray-900">₱{monthlyProfit.toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Revenue - Expenses</p></div>
                    <TrendingUp size={40} className="text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div><p className="text-gray-600 text-sm font-semibold">Profit Margin</p>
                      <p className="text-3xl font-bold text-gray-900">{monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(1) : 0}%</p></div>
                    <PieChart size={40} className="text-purple-500" />
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">All Time Totals</h3>
                  <div className="space-y-3">
                    <div><p className="text-sm text-gray-600">Total Revenue</p><p className="text-2xl font-bold text-blue-600">₱{totalRevenue.toLocaleString()}.00</p></div>
                    <div><p className="text-sm text-gray-600">Total Expenses</p><p className="text-2xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}.00</p></div>
                    <div className="border-t pt-3"><p className="text-sm text-gray-600">Total Profit</p><p className="text-2xl font-bold text-green-600">₱{totalProfit.toLocaleString()}.00</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Comparison</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Revenue</p>
                        <p className="text-sm font-bold text-blue-600">₱{monthlyRevenue.toLocaleString()}.00</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: monthlyRevenue + monthlyExpenses > 0 ? (monthlyRevenue / (monthlyRevenue + monthlyExpenses)) * 100 + '%' : 0 }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Expenses</p>
                        <p className="text-sm font-bold text-red-600">₱{monthlyExpenses.toLocaleString()}.00</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-red-600 h-3 rounded-full" style={{ width: monthlyRevenue + monthlyExpenses > 0 ? (monthlyExpenses / (monthlyRevenue + monthlyExpenses)) * 100 + '%' : 0 }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-yellow-600/10 rounded-xl p-6 shadow-lg border-2 border-primary/20">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-semibold">Confirmed Bookings:</span> {confirmedBookings.length}</p>
                    <p><span className="font-semibold">This Month:</span> {monthlyConfirmedBookings.length}</p>
                    <p><span className="font-semibold">Avg Revenue/Booking:</span> ₱{confirmedBookings.length > 0 ? (totalRevenue / confirmedBookings.length).toFixed(0) : 0}.00</p>
                    <p><span className="font-semibold">Avg Expense/Booking:</span> ₱{confirmedBookings.length > 0 ? (totalExpenses / confirmedBookings.length).toFixed(0) : 0}.00</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gray-50 border-b-2 border-gray-200 p-6"><h3 className="text-lg font-bold text-gray-900">Revenue by Event Type</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event Type</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Count</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Revenue</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
                      </tr></thead>
                      <tbody>
                        {eventTypeBreakdown.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-semibold text-gray-900">{item.type}</td>
                            <td className="px-6 py-4 text-right text-gray-700">{item.count}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600">₱{item.revenue.toLocaleString()}.00</td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">₱{(item.revenue - item.expenses).toLocaleString()}.00</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gray-50 border-b-2 border-gray-200 p-6"><h3 className="text-lg font-bold text-gray-900">Top Customers</h3></div>
                  <div className="p-6 space-y-4">
                    {topCustomers.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div><p className="font-bold text-gray-900">{c.name}</p><p className="text-xs text-gray-600">{c.bookings} booking{c.bookings !== 1 ? 's' : ''}</p></div>
                        <p className="text-lg font-bold text-primary">₱{c.totalSpent.toLocaleString()}.00</p>
                      </div>
                    ))}
                    {topCustomers.length === 0 && <p className="text-center text-gray-600 py-8">No customer data yet</p>}
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Profitability Analysis */}
          {activeReport === 'profitability' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-6 shadow-lg mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Profitability Trend</h3>
                  <div className="flex gap-2">
                    {(['week', 'month'] as const).map(v => (
                      <button key={v} onClick={() => setProfitabilityViewType(v)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${profitabilityViewType === v ? 'bg-primary text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
                        {v === 'week' ? 'Weekly' : 'Monthly'}
                      </button>
                    ))}
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey={profitabilityViewType === 'week' ? 'week' : 'month'} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis label={{ value: 'Amount (₱)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(v: any) => `₱${v.toLocaleString()}`} contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8,8,0,0]} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8,8,0,0]} />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-96 text-gray-600"><p>No profitability data available</p></div>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profitability Score</h3>
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-green-700">{monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">This month's profit margin</p>
                    <p className="text-2xl font-bold text-green-600">₱{monthlyProfit.toLocaleString()}.00</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profitability by Event Type</h3>
                  <div className="space-y-4">
                    {eventTypeBreakdown.map((event, i) => {
                      const profit = event.revenue - event.expenses;
                      const margin = event.revenue > 0 ? ((profit / event.revenue) * 100).toFixed(1) : 0;
                      return (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900">{event.type}</h4>
                            <span className={`text-lg font-bold ${Number(margin) > 0 ? 'text-green-600' : 'text-red-600'}`}>{margin}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Revenue: ₱{event.revenue.toLocaleString()}.00</span>
                            <span>Expenses: ₱{event.expenses.toLocaleString()}.00</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${Number(margin) > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(Number(margin)), 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {eventTypeBreakdown.length === 0 && <p className="text-center text-gray-600 py-8">No profitability data yet</p>}
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6"><h3 className="text-lg font-bold text-gray-900">Profitability by Booking</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Customer / Event</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Date</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Revenue</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Expenses</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Margin %</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                    </tr></thead>
                    <tbody>
                      {confirmedBookings.sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()).map((b, i) => {
                        const rev = b.totalPrice - (b.discount||0); const exp = getExpenseAmount(b.expenses);
                        const profit = rev - exp; const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
                        return (
                          <tr key={i} className={`border-b border-gray-200 hover:bg-gray-50 ${profit < 0 ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4"><p className="font-semibold text-gray-900">{b.customerName}</p><p className="text-xs text-gray-600">{b.eventType}</p></td>
                            <td className="px-6 py-4 text-right text-gray-700 text-sm">{format(b.eventDate, 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-4 text-right font-semibold text-blue-600">₱{rev.toLocaleString()}.00</td>
                            <td className="px-6 py-4 text-right font-semibold text-red-600">₱{exp.toLocaleString()}.00</td>
                            <td className={`px-6 py-4 text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₱{profit.toLocaleString()}.00</td>
                            <td className={`px-6 py-4 text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margin}%</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {profit >= 0 ? '✓ Profitable' : '✗ Loss'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {confirmedBookings.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-600">No bookings data yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* Budget Analysis */}
          {activeReport === 'budget' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Budgeted', value: confirmedBookings.reduce((s,b) => s + (b.budget||0), 0), color: 'border-blue-500', icon: <Target size={40} className="text-blue-500" /> },
                  { label: 'Total Actual Expenses', value: totalExpenses, color: 'border-red-500', icon: <TrendingDown size={40} className="text-red-500" /> },
                  { label: 'Budget Variance', value: confirmedBookings.reduce((s,b) => s + (b.budget||0), 0) - totalExpenses, color: 'border-purple-500', icon: <AlertCircle size={40} className="text-purple-500" /> },
                  { label: 'Events Over Budget', value: confirmedBookings.filter(b => b.budget && getExpenseAmount(b.expenses) > b.budget).length, color: 'border-orange-500', icon: <AlertCircle size={40} className="text-orange-500" /> },
                ].map((m, i) => (
                  <div key={i} className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${m.color}`}>
                    <div className="flex items-center justify-between">
                      <div><p className="text-gray-600 text-sm font-semibold">{m.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{typeof m.value === 'number' && m.label !== 'Events Over Budget' ? `₱${m.value.toLocaleString()}.00` : m.value}</p></div>
                      {m.icon}
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6"><h3 className="text-lg font-bold text-gray-900">Budget Analysis by Event</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event / Customer</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Event Date</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Budget</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Actual Expenses</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Variance</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                    </tr></thead>
                    <tbody>
                      {confirmedBookings.filter(b => b.budget || getExpenseAmount(b.expenses) > 0)
                        .sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                        .map((b, i) => {
                          const budget = b.budget || 0; const exp = getExpenseAmount(b.expenses);
                          const variance = budget - exp; const over = budget > 0 && exp > budget;
                          const pct = budget > 0 ? ((exp / budget) * 100).toFixed(1) : 0;
                          return (
                            <tr key={i} className={`border-b border-gray-200 hover:bg-gray-50 ${over ? 'bg-red-50' : ''}`}>
                              <td className="px-6 py-4"><p className="font-semibold text-gray-900">{b.customerName}</p><p className="text-xs text-gray-600">{b.eventType}</p></td>
                              <td className="px-6 py-4 text-right text-gray-700 text-sm">{format(b.eventDate, 'MMM dd, yyyy')}</td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-900">{budget > 0 ? `₱${budget.toLocaleString()}.00` : '—'}</td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-900">₱{exp.toLocaleString()}.00</td>
                              <td className={`px-6 py-4 text-right font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {budget > 0 ? `${variance >= 0 ? '+' : ''}₱${variance.toLocaleString()}.00 (${pct}%)` : '—'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {budget > 0 ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${over ? 'bg-red-100 text-red-700' : exp > budget * 0.8 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {over ? 'Over' : exp > budget * 0.8 ? 'At Risk' : 'On Track'}
                                  </span>
                                ) : <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">No Budget</span>}
                              </td>
                            </tr>
                          );
                        })}
                      {confirmedBookings.filter(b => b.budget || getExpenseAmount(b.expenses) > 0).length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-600">No events with budget data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* Cashflow Report */}
          {activeReport === 'cashflow' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Income</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">{transactions.length} transactions</p>
                    </div>
                    <TrendingUp size={40} className="text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Expenses</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((s, t) => s + (t.totalExpenses || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">All expense items</p>
                    </div>
                    <TrendingDown size={40} className="text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Net Profit</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((s, t) => s + (t.profit || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
                    </div>
                    <TrendingUp size={40} className="text-blue-500" />
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">Cashflow by Month</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Month</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Income</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Expenses</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Transactions</th>
                    </tr></thead>
                    <tbody>
                      {cashflowData.map((month: any, index: number) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-900">{format(new Date(month.month + '-01'), 'MMMM yyyy')}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">₱{month.income.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">₱{month.expenses.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold" style={{ color: month.profit >= 0 ? '#2563eb' : '#dc2626' }}>₱{month.profit.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right text-gray-700">{month.transactions.length}</td>
                        </tr>
                      ))}
                      {cashflowData.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-600">No transaction data yet. Complete bookings to generate cashflow reports.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">All Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Booking ID</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event Type</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Income</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Expenses</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Date</th>
                    </tr></thead>
                    <tbody>
                      {transactions.map((trans: any, index: number) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono text-sm text-gray-700">{(trans.bookingId || '').slice(0, 8)}...</td>
                          <td className="px-6 py-4 text-gray-900">{trans.customerName}</td>
                          <td className="px-6 py-4 text-gray-700">{trans.eventType}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">₱{(trans.amount || 0).toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">₱{(trans.totalExpenses || 0).toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold" style={{ color: (trans.profit || 0) >= 0 ? '#2563eb' : '#dc2626' }}>₱{(trans.profit || 0).toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {trans.completedAt ? (trans.completedAt?.toDate ? format(trans.completedAt.toDate(), 'MMM dd, yyyy') : format(new Date(trans.completedAt), 'MMM dd, yyyy')) : '—'}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-600">No transactions recorded yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </StaffSidebar>
  );
}
