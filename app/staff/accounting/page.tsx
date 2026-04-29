'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { CreditCard, TrendingUp, TrendingDown, Wallet, FileText, PieChart, Plus, Trash2, ArrowUp, ArrowDown, Printer, Download } from 'lucide-react';
import StaffSidebar from '@/components/StaffSidebar';

interface BookingWithPayment {
  id: string; customerName: string; eventType: string; eventDate: any;
  totalPrice: number; discount: number; expenses: number | Array<{ amount: number }>;
  status: string; paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: string; amountPaid: number; packageName?: string;
}

interface CashFlowEntry {
  id: string; type: 'income' | 'expense'; amount: number;
  description: string; category: string; date: any; notes?: string;
}

const getExpenseAmount = (expenses: number | Array<{ amount: number }> | undefined): number => {
  if (typeof expenses === 'number') return expenses || 0;
  if (Array.isArray(expenses)) return expenses.reduce((t, i) => t + (i.amount || 0), 0);
  return 0;
};

export default function StaffAccountingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'expenses' | 'cashflow'>('overview');
  const [cashFlowEntries, setCashFlowEntries] = useState<CashFlowEntry[]>([]);
  const [showAddCashFlow, setShowAddCashFlow] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'expense' as 'income' | 'expense', amount: '', description: '', category: '', notes: '' });
  const [reportFilters, setReportFilters] = useState({ type: 'all', dateFrom: '', dateTo: '' });
  const [staffData, setStaffData] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('staffUser');
    if (!raw) { router.push('/staff/login'); return; }
    const staff = JSON.parse(raw);
    setStaffData(staff);

    const fetchBookings = async () => {
      try {
        const snap = await getDocs(collection(db, 'bookings'));
        setBookings(snap.docs.map(doc => ({
          id: doc.id, ...doc.data(),
          eventDate: doc.data().eventDate.toDate(),
          paymentStatus: doc.data().paymentStatus || 'pending',
          paymentMethod: doc.data().paymentMethod || 'cash',
          amountPaid: doc.data().amountPaid || 0,
          discount: doc.data().discount || 0,
          expenses: doc.data().expenses || 0,
        })) as BookingWithPayment[]);
      } catch (e) { console.error(e); } finally { setLoadingData(false); }
    };
    fetchBookings();

    // Listen to cashflow entries for this staff's manager
    const cashFlowRef = collection(db, 'cashFlow');
    const unsub = onSnapshot(cashFlowRef, (snapshot) => {
      const entries: CashFlowEntry[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashFlowEntry));
      setCashFlowEntries(entries.sort((a, b) => {
        const dA = a.date?.toDate?.() || new Date(a.date);
        const dB = b.date?.toDate?.() || new Date(b.date);
        return dB.getTime() - dA.getTime();
      }));
    });
    return () => unsub();
  }, [router]);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthlyBookings = bookings.filter(b => isWithinInterval(b.eventDate, { start: monthStart, end: monthEnd }));
  const monthlyRevenue = monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + (b.totalPrice - b.discount), 0);
  const monthlyExpenses = monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + getExpenseAmount(b.expenses), 0);
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const monthlyPaidAmount = monthlyBookings.filter(b => ['paid','partial'].includes(b.paymentStatus)).reduce((s,b) => s + b.amountPaid, 0);
  const monthlyOutstanding = monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + Math.max(0, (b.totalPrice - b.discount) - b.amountPaid), 0);

  const paymentMethodBreakdown = monthlyBookings
    .filter(b => ['paid','partial'].includes(b.paymentStatus) && ['confirmed','completed'].includes(b.status) && b.amountPaid > 0)
    .reduce((acc, b) => {
      const method = b.paymentMethod || 'cash';
      const ex = acc.find(i => i.method === method);
      if (ex) { ex.amount += b.amountPaid; ex.count++; }
      else acc.push({ method, amount: b.amountPaid, count: 1 });
      return acc;
    }, [] as Array<{ method: string; amount: number; count: number }>);

  const monthlyCashFlowEntries = cashFlowEntries.filter(e => {
    try {
      const d = e.date?.toDate?.() || new Date(e.date);
      if (isNaN(d.getTime())) return false;
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    } catch {
      return false;
    }
  });

  const monthlyTransactionIncome = monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + (b.totalPrice - b.discount), 0);
  const monthlyBookingExpenses = monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).reduce((s,b) => s + getExpenseAmount(b.expenses), 0);
  const monthlyCashIncome = monthlyCashFlowEntries.filter(e => e.type === 'income').reduce((s,e) => s + e.amount, 0) + monthlyTransactionIncome;
  const monthlyCashExpense = monthlyCashFlowEntries.filter(e => e.type === 'expense').reduce((s,e) => s + e.amount, 0) + monthlyBookingExpenses;

  const generateCashFlowEntries = () => {
    const entries: any[] = [];
    monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).forEach(b => {
      try {
        const d = b.eventDate?.toDate?.() || new Date(b.eventDate);
        if (!isNaN(d.getTime())) {
          entries.push({ id: `income-${b.id}`, type: 'income', amount: b.totalPrice - b.discount, description: `${b.customerName} - ${b.eventType}`, category: 'booking_income', date: d, notes: `Package: ${b.packageName || 'N/A'}`, source: 'booking' });
        }
      } catch (e) {
        console.error('Error processing booking date:', e);
      }
    });
    monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status) && getExpenseAmount(b.expenses) > 0).forEach(b => {
      try {
        const d = b.eventDate?.toDate?.() || new Date(b.eventDate);
        if (!isNaN(d.getTime())) {
          entries.push({ id: `expense-${b.id}`, type: 'expense', amount: getExpenseAmount(b.expenses), description: `Expenses - ${b.customerName} (${b.eventType})`, category: 'booking_expense', date: d, notes: `Event expenses`, source: 'booking' });
        }
      } catch (e) {
        console.error('Error processing booking expense date:', e);
      }
    });
    monthlyCashFlowEntries.forEach(e => entries.push({ ...e, source: 'manual' }));
    return entries.sort((a, b) => {
      try {
        const dA = a.date?.toDate?.() || a.date?.getTime?.() || new Date(a.date).getTime();
        const dB = b.date?.toDate?.() || b.date?.getTime?.() || new Date(b.date).getTime();
        return dB - dA;
      } catch {
        return 0;
      }
    });
  };

  const automaticCashFlowEntries = generateCashFlowEntries();

  const getFilteredCashflowEntries = () => {
    let f = automaticCashFlowEntries;
    if (reportFilters.type !== 'all') f = f.filter(e => e.type === reportFilters.type);
    if (reportFilters.dateFrom) {
      const fromDate = new Date(reportFilters.dateFrom);
      f = f.filter(e => {
        try {
          const d = e.date?.toDate?.() || new Date(e.date);
          return !isNaN(d.getTime()) && d >= fromDate;
        } catch {
          return false;
        }
      });
    }
    if (reportFilters.dateTo) {
      const toDate = new Date(reportFilters.dateTo);
      f = f.filter(e => {
        try {
          const d = e.date?.toDate?.() || new Date(e.date);
          return !isNaN(d.getTime()) && d <= toDate;
        } catch {
          return false;
        }
      });
    }
    return f;
  };

  const filteredCashflowForReport = getFilteredCashflowEntries();

  const handlePrintCashflowReport = () => {
    const pw = window.open('', '', 'height=600,width=900');
    if (!pw) return;
    const totalIncome = filteredCashflowForReport.filter(e => e.type === 'income').reduce((s,e) => s + e.amount, 0);
    const totalExpense = filteredCashflowForReport.filter(e => e.type === 'expense').reduce((s,e) => s + e.amount, 0);
    pw.document.write(`<html><head><title>Cashflow Report</title>
    <style>body{font-family:sans-serif;padding:40px}table{width:100%;border-collapse:collapse}
    th{background:#F59E0B;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #eee}
    .summary{margin-top:30px;padding:20px;background:#f3f4f6;border-left:4px solid #F59E0B}
    .sr{display:flex;justify-content:space-between;margin-bottom:8px}
    .income{background:#DCFCE7;color:#166534;padding:4px 8px;border-radius:4px;font-size:11px}
    .expense{background:#FEE2E2;color:#991B1B;padding:4px 8px;border-radius:4px;font-size:11px}</style></head>
    <body><h1 style="border-bottom:3px solid #F59E0B;padding-bottom:10px">Cashflow Report</h1>
    <p>Printed: ${format(new Date(),'MMMM dd, yyyy HH:mm')} | Records: ${filteredCashflowForReport.length}</p>
    <table><thead><tr><th>Date</th><th>Description</th><th>Notes</th><th>Amount</th><th>Type</th></tr></thead>
    <tbody>${filteredCashflowForReport.map(e => {
      try {
        const d = e.date?.toDate?.() || new Date(e.date);
        const dateStr = isNaN(d.getTime()) ? 'Invalid Date' : format(d,'MMM dd, yyyy');
        return `<tr>
          <td>${dateStr}</td><td>${e.description}</td><td>${e.notes||''}</td>
          <td style="color:${e.type==='income'?'#16A34A':'#DC2626'}">${e.type==='income'?'+':'-'}₱${e.amount.toLocaleString()}.00</td>
          <td><span class="${e.type}">${e.type==='income'?'Inflow':'Outflow'}</span></td>
        </tr>`;
      } catch {
        return `<tr><td>Invalid Date</td><td>${e.description}</td><td>${e.notes||''}</td><td>₱${e.amount.toLocaleString()}.00</td><td>${e.type}</td></tr>`;
      }
    }).join('')}</tbody></table>
    <div class="summary">
      <div class="sr"><span>Total Inflow:</span><span style="color:#16A34A">₱${totalIncome.toLocaleString()}.00</span></div>
      <div class="sr"><span>Total Outflow:</span><span style="color:#DC2626">₱${totalExpense.toLocaleString()}.00</span></div>
      <div class="sr" style="border-top:2px solid #ccc;padding-top:8px;font-weight:bold">
        <span>Net Cashflow:</span><span>₱${(totalIncome-totalExpense).toLocaleString()}.00</span></div>
    </div></body></html>`);
    pw.document.close(); pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
  };

  const handleExportCashflowExcel = () => {
    const rows = [
      ['Date','Description','Notes','Amount','Type'],
      ...filteredCashflowForReport.map(e => {
        try {
          const d = e.date?.toDate?.() || new Date(e.date);
          const dateStr = isNaN(d.getTime()) ? 'Invalid Date' : format(d,'MMM dd, yyyy');
          return [
            dateStr, e.description, e.notes||'',
            `₱${e.amount.toLocaleString()}.00`, e.type==='income'?'Inflow':'Outflow',
          ];
        } catch {
          return ['Invalid Date', e.description, e.notes||'', `₱${e.amount.toLocaleString()}.00`, e.type];
        }
      }),
      [],
      [], ['Total Inflow','','',`₱${filteredCashflowForReport.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0).toLocaleString()}.00`,''],
      ['Total Outflow','','',`₱${filteredCashflowForReport.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0).toLocaleString()}.00`,''],
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `cashflow_report_${format(new Date(),'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleAddCashFlow = async () => {
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) { alert('Please enter a valid amount'); return; }
    if (!newEntry.description.trim()) { alert('Please enter a description'); return; }
    if (!newEntry.category) { alert('Please select a category'); return; }
    try {
      await addDoc(collection(db, 'cashFlow'), {
        type: newEntry.type, amount: parseFloat(newEntry.amount),
        description: newEntry.description.trim(), category: newEntry.category,
        notes: newEntry.notes.trim(), date: new Date(), createdAt: new Date(),
      });
      setNewEntry({ type: 'expense', amount: '', description: '', category: '', notes: '' });
      setShowAddCashFlow(false);
      alert('Cash flow entry added successfully!');
    } catch (e) { alert('Failed to add cash flow entry.'); }
  };

  const handleDeleteCashFlow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try { await deleteDoc(doc(db, 'cashFlow', id)); alert('Entry deleted successfully!'); }
    catch (e) { alert('Failed to delete entry.'); }
  };

  if (loadingData) return (
    <StaffSidebar>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading accounting data...</p>
        </div>
      </div>
    </StaffSidebar>
  );

  return (
    <StaffSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Accounting & Payments</h1>
            <p className="text-gray-600 mt-2">Comprehensive financial tracking</p>
          </motion.div>

          {/* Month Selector */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800">← Previous</button>
              <span className="text-xl font-bold text-gray-900 min-w-48 text-center">{format(selectedMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800">Next →</button>
              <button onClick={() => setSelectedMonth(new Date())}
                className="px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold">Today</button>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Monthly Revenue', value: monthlyRevenue, color: 'border-blue-500', icon: <CreditCard size={32} className="text-blue-500" /> },
              { label: 'Monthly Paid', value: monthlyPaidAmount, color: 'border-green-500', icon: <TrendingUp size={32} className="text-green-500" /> },
              { label: 'Outstanding', value: monthlyOutstanding, color: 'border-yellow-500', icon: <Wallet size={32} className="text-yellow-500" /> },
              { label: 'Expenses', value: monthlyExpenses, color: 'border-red-500', icon: <TrendingDown size={32} className="text-red-500" /> },
              { label: 'Profit', value: monthlyProfit, color: 'border-purple-500', icon: <PieChart size={32} className="text-purple-500" /> },
            ].map((m, i) => (
              <div key={i} className={`bg-white rounded-xl p-4 shadow-lg border-l-4 ${m.color}`}>
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-600 text-xs font-semibold">{m.label}</p>
                    <p className="text-2xl font-bold text-gray-900">₱{m.value.toLocaleString()}.00</p></div>
                  {m.icon}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex gap-2 bg-white rounded-xl p-2 shadow-lg overflow-x-auto">
            {(['overview', 'payments', 'expenses', 'cashflow'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-50'}`}>
                {tab === 'cashflow' ? 'Cash Flow' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </motion.div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">This Month Summary</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Revenue:', value: monthlyRevenue, bg: 'bg-blue-50', color: 'text-blue-600' },
                    { label: 'Total Collected:', value: monthlyPaidAmount, bg: 'bg-green-50', color: 'text-green-600' },
                    { label: 'Total Outstanding:', value: monthlyOutstanding, bg: 'bg-yellow-50', color: 'text-yellow-600' },
                    { label: 'Total Expenses:', value: monthlyExpenses, bg: 'bg-red-50', color: 'text-red-600' },
                  ].map((r, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 ${r.bg} rounded-lg`}>
                      <span className="font-semibold text-gray-700">{r.label}</span>
                      <span className={`text-lg font-bold ${r.color}`}>₱{r.value.toLocaleString()}.00</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <span className="font-bold text-gray-900">Net Profit:</span>
                    <span className="text-xl font-bold text-purple-600">₱{monthlyProfit.toLocaleString()}.00</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Collection Metrics (This Month)</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Collection Rate</span>
                      <span className="text-lg font-bold text-blue-600">{monthlyRevenue > 0 ? ((monthlyPaidAmount / monthlyRevenue) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full" style={{ width: monthlyRevenue > 0 ? ((monthlyPaidAmount / monthlyRevenue) * 100) + '%' : 0 }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Outstanding Rate</span>
                      <span className="text-lg font-bold text-yellow-600">{monthlyRevenue > 0 ? ((monthlyOutstanding / monthlyRevenue) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-yellow-500 h-4 rounded-full" style={{ width: monthlyRevenue > 0 ? ((monthlyOutstanding / monthlyRevenue) * 100) + '%' : 0 }} />
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3 font-semibold">Key Metrics:</p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Confirmed Bookings:</span> {monthlyBookings.filter(b => ['confirmed','completed'].includes(b.status)).length}</p>
                      <p><span className="font-semibold">Fully Paid:</span> {monthlyBookings.filter(b => b.paymentStatus === 'paid').length}</p>
                      <p><span className="font-semibold">Partial Payment:</span> {monthlyBookings.filter(b => b.paymentStatus === 'partial').length}</p>
                      <p><span className="font-semibold">Pending Payment:</span> {monthlyBookings.filter(b => b.paymentStatus === 'pending').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method Breakdown (This Month)</h3>
                {paymentMethodBreakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Payment Method</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Count</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Amount</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Percentage</th>
                      </tr></thead>
                      <tbody>
                        {paymentMethodBreakdown.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-semibold text-gray-900">{item.method.replace(/_/g,' ').toUpperCase()}</td>
                            <td className="px-6 py-4 text-right text-gray-700">{item.count}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600">₱{item.amount.toLocaleString()}.00</td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-700">{monthlyPaidAmount > 0 ? ((item.amount / monthlyPaidAmount) * 100).toFixed(1) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No payments recorded this month</p>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">All Bookings This Month</h3>
                {monthlyBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Customer</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event Type</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Payment Status</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Total Price</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Amount Paid</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outstanding</th>
                      </tr></thead>
                      <tbody>
                        {monthlyBookings.map((b) => {
                          const outstanding = (b.totalPrice - (b.discount||0)) - (b.amountPaid||0);
                          return (
                            <tr key={b.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-6 py-4 font-semibold text-gray-900">{b.customerName}</td>
                              <td className="px-6 py-4 text-gray-700">{b.eventType}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.status==='confirmed'?'bg-green-100 text-green-800':b.status==='pending'?'bg-yellow-100 text-yellow-800':b.status==='completed'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-800'}`}>
                                  {b.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.paymentStatus==='paid'?'bg-green-100 text-green-800':b.paymentStatus==='partial'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>
                                  {(b.paymentStatus||'pending').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-900">₱{(b.totalPrice-(b.discount||0)).toLocaleString()}.00</td>
                              <td className="px-6 py-4 text-right font-bold text-green-600">₱{(b.amountPaid||0).toLocaleString()}.00</td>
                              <td className="px-6 py-4 text-right font-bold text-red-600">₱{Math.max(0,outstanding).toLocaleString()}.00</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="text-center py-12"><FileText size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-600 text-lg font-medium">No bookings this month</p></div>}
              </div>
            </motion.div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-lg p-6">
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
                      ₱{monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length > 0 ? (monthlyExpenses / monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length).toFixed(0) : 0}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Expense Ratio</p>
                    <p className="text-2xl font-bold text-purple-600">{monthlyRevenue > 0 ? ((monthlyExpenses / monthlyRevenue) * 100).toFixed(1) : 0}%</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                    <p className="text-2xl font-bold text-green-600">₱{monthlyProfit.toLocaleString()}.00</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-3">Bookings with Expenses</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).length > 0 ? (
                      monthlyBookings.filter(b => getExpenseAmount(b.expenses) > 0).map(b => (
                        <div key={b.id} className="flex justify-between items-center p-2 hover:bg-white rounded">
                          <div><p className="font-semibold text-gray-900">{b.customerName}</p><p className="text-xs text-gray-600">{b.eventType}</p></div>
                          <p className="font-bold text-red-600">₱{getExpenseAmount(b.expenses).toLocaleString()}.00</p>
                        </div>
                      ))
                    ) : <p className="text-center text-gray-500 py-4">No bookings with expenses this month</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Cashflow Tab */}
          {activeTab === 'cashflow' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Inflow', value: monthlyCashIncome, color: 'border-green-500', textColor: 'text-green-600' },
                  { label: 'Total Outflow', value: monthlyCashExpense, color: 'border-red-500', textColor: 'text-red-600' },
                  { label: 'Net Cashflow', value: monthlyCashIncome - monthlyCashExpense, color: 'border-blue-500', textColor: monthlyCashIncome - monthlyCashExpense >= 0 ? 'text-blue-600' : 'text-red-600' },
                ].map((m, i) => (
                  <div key={i} className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${m.color}`}>
                    <p className="text-gray-600 text-sm font-semibold mb-2">{m.label}</p>
                    <p className={`text-3xl font-bold ${m.textColor}`}>₱{m.value.toLocaleString()}.00</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-blue-900 font-semibold">Cash Flow Management</p>
                    <p className="text-blue-700 text-sm mt-1">Track all income and expenses. Booking transactions are automatic, but you can also add manual entries.</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddCashFlow(!showAddCashFlow)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold whitespace-nowrap">
                  <Plus size={20} /> Add Entry
                </motion.button>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Entry Type</label>
                    <select value={reportFilters.type} onChange={e => setReportFilters({...reportFilters, type: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black">
                      <option value="all">All Types</option><option value="income">Inflow Only</option><option value="expense">Outflow Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                    <input type="date" value={reportFilters.dateFrom} onChange={e => setReportFilters({...reportFilters, dateFrom: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                    <input type="date" value={reportFilters.dateTo} onChange={e => setReportFilters({...reportFilters, dateTo: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" />
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrintCashflowReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    <Printer size={20} /> Print Report
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportCashflowExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    <Download size={20} /> Export to Excel
                  </motion.button>
                </div>
              </div>

              {showAddCashFlow && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                      <select value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value as 'income'|'expense'})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black">
                        <option value="income">Inflow</option><option value="expense">Outflow</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                      <input type="number" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <input type="text" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" placeholder="e.g., Venue Rental" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <select value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black">
                        <option value="">Select Category</option>
                        {['venue','catering','decoration','transportation','equipment','staff','supplies','other'].map(c => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                      <textarea value={newEntry.notes} onChange={e => setNewEntry({...newEntry, notes: e.target.value})} rows={2}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" placeholder="Additional notes..." />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddCashFlow}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Entry</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddCashFlow(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400">Cancel</motion.button>
                  </div>
                </motion.div>
              )}

              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Cash Flow Entries</h3>
                  <p className="text-sm text-gray-600 mt-1">Showing {filteredCashflowForReport.length} entries for {format(selectedMonth,'MMMM yyyy')}</p>
                </div>
                {filteredCashflowForReport.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Description</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Notes</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Amount</th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Type</th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Actions</th>
                      </tr></thead>
                      <tbody>
                        {filteredCashflowForReport.map((entry, i) => {
                          const entryDate = (() => {
                            try {
                              const d = entry.date?.toDate?.() || new Date(entry.date);
                              return isNaN(d.getTime()) ? null : d;
                            } catch {
                              return null;
                            }
                          })();
                          return (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-700">{entryDate ? format(entryDate,'MMM dd, yyyy') : 'Invalid Date'}</td>
                            <td className="px-6 py-4 font-semibold text-gray-900">{entry.description}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{entry.notes}</td>
                            <td className={`px-6 py-4 text-right font-bold ${entry.type==='income'?'text-green-600':'text-red-600'}`}>
                              {entry.type==='income'?'+':'-'}₱{entry.amount.toLocaleString()}.00
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 justify-center w-fit mx-auto ${entry.type==='income'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>
                                {entry.type==='income'?<ArrowUp size={12}/>:<ArrowDown size={12}/>}
                                {entry.type==='income'?'Inflow':'Outflow'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {entry.source === 'manual' && (
                                <button onClick={() => handleDeleteCashFlow(entry.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              )}
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
                    <p className="text-gray-600 text-lg font-medium">No cash flow entries for this period</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </StaffSidebar>
  );
}
