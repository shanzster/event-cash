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

    const printed = format(new Date(), 'MMMM dd, yyyy HH:mm:ss');
    const monthLabel = format(selectedMonth, 'MMMM yyyy');

    let html = '';

    if (activeReport === 'income-expenses') {
      const profitMargin = monthlyRevenue > 0 ? (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(1) : '0.0';
      html = `<html><head><title>Income vs Expenses Report</title>
      <style>body{font-family:sans-serif;padding:40px}h1{border-bottom:3px solid #F59E0B;padding-bottom:10px}
      .kpi{display:inline-block;margin-right:24px;margin-bottom:16px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;min-width:140px}
      .kl{font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase}.kv{font-size:20px;font-weight:700;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#F59E0B;color:white;padding:10px;text-align:left}
      td{padding:10px;border-bottom:1px solid #eee}
      .footer{text-align:center;margin-top:40px;border-top:1px solid #eee;padding-top:20px;font-size:11px;color:#9CA3AF}</style></head>
      <body><h1>Income vs Expenses Report</h1>
      <p>Month: ${monthLabel} &nbsp;|&nbsp; Printed: ${printed}</p>
      <div style="margin-top:20px">
        <div class="kpi"><div class="kl">Monthly Revenue</div><div class="kv" style="color:#2563eb">₱${monthlyRevenue.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Monthly Expenses</div><div class="kv" style="color:#dc2626">₱${monthlyExpenses.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Net Profit</div><div class="kv" style="color:#16a34a">₱${monthlyProfit.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Profit Margin</div><div class="kv" style="color:#7c3aed">${profitMargin}%</div></div>
      </div>
      <h3 style="margin-top:24px">Revenue by Event Type</h3>
      <table><thead><tr><th>Event Type</th><th>Count</th><th>Revenue</th><th>Net Profit</th></tr></thead><tbody>
      ${eventTypeBreakdown.map(i => `<tr><td>${i.type}</td><td>${i.count}</td><td style="color:#2563eb">₱${i.revenue.toLocaleString()}.00</td><td style="color:#16a34a">₱${(i.revenue-i.expenses).toLocaleString()}.00</td></tr>`).join('')}
      </tbody></table>
      <h3 style="margin-top:24px">Top Customers</h3>
      <table><thead><tr><th>Customer</th><th>Bookings</th><th>Total Spent</th></tr></thead><tbody>
      ${topCustomers.map(c => `<tr><td>${c.name}</td><td>${c.bookings}</td><td style="color:#d97706">₱${c.totalSpent.toLocaleString()}.00</td></tr>`).join('')}
      </tbody></table>
      <div class="footer"><p>© Event Cash Management System</p></div></body></html>`;

    } else if (activeReport === 'profitability') {
      html = `<html><head><title>Profitability Analysis Report</title>
      <style>body{font-family:sans-serif;padding:40px}h1{border-bottom:3px solid #F59E0B;padding-bottom:10px}
      .kpi{display:inline-block;margin-right:24px;margin-bottom:16px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;min-width:140px}
      .kl{font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase}.kv{font-size:20px;font-weight:700;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#F59E0B;color:white;padding:10px;text-align:left}
      td{padding:10px;border-bottom:1px solid #eee}
      .footer{text-align:center;margin-top:40px;border-top:1px solid #eee;padding-top:20px;font-size:11px;color:#9CA3AF}</style></head>
      <body><h1>Profitability Analysis Report</h1>
      <p>Month: ${monthLabel} &nbsp;|&nbsp; Printed: ${printed}</p>
      <div style="margin-top:20px">
        <div class="kpi"><div class="kl">Profit Margin</div><div class="kv" style="color:#16a34a">${monthlyRevenue > 0 ? ((monthlyProfit/monthlyRevenue)*100).toFixed(1) : 0}%</div></div>
        <div class="kpi"><div class="kl">Monthly Profit</div><div class="kv" style="color:#16a34a">₱${monthlyProfit.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Total Revenue</div><div class="kv" style="color:#2563eb">₱${totalRevenue.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Total Expenses</div><div class="kv" style="color:#dc2626">₱${totalExpenses.toLocaleString()}.00</div></div>
      </div>
      <h3 style="margin-top:24px">Profitability by Booking</h3>
      <table><thead><tr><th>Customer</th><th>Event Type</th><th>Date</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th><th>Margin</th></tr></thead><tbody>
      ${confirmedBookings.sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map(b=>{
        const rev=b.totalPrice-(b.discount||0);const exp=getExpenseAmount(b.expenses);const profit=rev-exp;
        const margin=rev>0?((profit/rev)*100).toFixed(1):0;
        return `<tr><td>${b.customerName}</td><td>${b.eventType}</td><td>${format(b.eventDate,'MMM dd, yyyy')}</td><td style="color:#2563eb">₱${rev.toLocaleString()}.00</td><td style="color:#dc2626">₱${exp.toLocaleString()}.00</td><td style="color:${profit>=0?'#16a34a':'#dc2626'}">₱${profit.toLocaleString()}.00</td><td style="color:${profit>=0?'#16a34a':'#dc2626'}">${margin}%</td></tr>`;
      }).join('')}
      </tbody></table>
      <div class="footer"><p>© Event Cash Management System</p></div></body></html>`;

    } else if (activeReport === 'budget') {
      const totalBudgeted = confirmedBookings.reduce((s,b)=>s+(b.budget||0),0);
      const variance = totalBudgeted - totalExpenses;
      html = `<html><head><title>Budget Analysis Report</title>
      <style>body{font-family:sans-serif;padding:40px}h1{border-bottom:3px solid #F59E0B;padding-bottom:10px}
      .kpi{display:inline-block;margin-right:24px;margin-bottom:16px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;min-width:140px}
      .kl{font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase}.kv{font-size:20px;font-weight:700;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#F59E0B;color:white;padding:10px;text-align:left}
      td{padding:10px;border-bottom:1px solid #eee}
      .footer{text-align:center;margin-top:40px;border-top:1px solid #eee;padding-top:20px;font-size:11px;color:#9CA3AF}</style></head>
      <body><h1>Budget Analysis Report</h1>
      <p>Month: ${monthLabel} &nbsp;|&nbsp; Printed: ${printed}</p>
      <div style="margin-top:20px">
        <div class="kpi"><div class="kl">Total Budgeted</div><div class="kv" style="color:#2563eb">₱${totalBudgeted.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Actual Expenses</div><div class="kv" style="color:#dc2626">₱${totalExpenses.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Variance</div><div class="kv" style="color:${variance>=0?'#16a34a':'#dc2626'}">${variance>=0?'+':''}₱${variance.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Over Budget</div><div class="kv" style="color:#ea580c">${confirmedBookings.filter(b=>b.budget&&getExpenseAmount(b.expenses)>b.budget).length}</div></div>
      </div>
      <h3 style="margin-top:24px">Budget Analysis by Event</h3>
      <table><thead><tr><th>Customer</th><th>Event Type</th><th>Date</th><th>Budget</th><th>Actual</th><th>Variance</th><th>Status</th></tr></thead><tbody>
      ${confirmedBookings.filter(b=>b.budget||getExpenseAmount(b.expenses)>0).sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map(b=>{
        const budget=b.budget||0;const exp=getExpenseAmount(b.expenses);const v=budget-exp;const over=budget>0&&exp>budget;
        return `<tr><td>${b.customerName}</td><td>${b.eventType}</td><td>${format(b.eventDate,'MMM dd, yyyy')}</td><td>${budget>0?'₱'+budget.toLocaleString()+'.00':'—'}</td><td>₱${exp.toLocaleString()}.00</td><td style="color:${v>=0?'#16a34a':'#dc2626'};white-space:nowrap">${budget>0?(v>=0?'+':'-')+'₱'+Math.abs(v).toLocaleString()+'.00':'—'}</td><td><span style="padding:2px 8px;border-radius:4px;font-size:11px;background:${over?'#fee2e2':exp>budget*0.8?'#fef9c3':'#dcfce7'};color:${over?'#991b1b':exp>budget*0.8?'#854d0e':'#166534'}">${budget>0?(over?'Over':exp>budget*0.8?'At Risk':'On Track'):'No Budget'}</span></td></tr>`;
      }).join('')}
      </tbody></table>
      <div class="footer"><p>© Event Cash Management System</p></div></body></html>`;

    } else if (activeReport === 'cashflow') {
      const totalInflow = transactions.reduce((s,t)=>s+(t.amount||0),0);
      const totalOutflow = transactions.reduce((s,t)=>s+(t.totalExpenses||0),0);
      const netCashflow = transactions.reduce((s,t)=>s+(t.profit||0),0);
      html = `<html><head><title>Cashflow Report</title>
      <style>body{font-family:sans-serif;padding:40px}h1{border-bottom:3px solid #F59E0B;padding-bottom:10px}
      .kpi{display:inline-block;margin-right:24px;margin-bottom:16px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;min-width:140px}
      .kl{font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase}.kv{font-size:20px;font-weight:700;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#F59E0B;color:white;padding:10px;text-align:left}
      td{padding:10px;border-bottom:1px solid #eee}
      .footer{text-align:center;margin-top:40px;border-top:1px solid #eee;padding-top:20px;font-size:11px;color:#9CA3AF}</style></head>
      <body><h1>Cashflow Report</h1>
      <p>Printed: ${printed}</p>
      <div style="margin-top:20px">
        <div class="kpi"><div class="kl">Total Inflow</div><div class="kv" style="color:#16a34a">₱${totalInflow.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Total Outflow</div><div class="kv" style="color:#dc2626">₱${totalOutflow.toLocaleString()}.00</div></div>
        <div class="kpi"><div class="kl">Net Cashflow</div><div class="kv" style="color:#2563eb">₱${netCashflow.toLocaleString()}.00</div></div>
      </div>
      <h3 style="margin-top:24px">Cashflow by Month</h3>
      <table><thead><tr><th>Month</th><th>Inflow</th><th>Outflow</th><th>Net Cashflow</th><th>Transactions</th></tr></thead><tbody>
      ${cashflowData.map((m:any)=>`<tr><td>${format(new Date(m.month+'-01'),'MMMM yyyy')}</td><td style="color:#16a34a">₱${m.income.toLocaleString()}.00</td><td style="color:#dc2626">₱${m.expenses.toLocaleString()}.00</td><td style="color:${m.profit>=0?'#2563eb':'#dc2626'}">₱${m.profit.toLocaleString()}.00</td><td>${m.transactions.length}</td></tr>`).join('')}
      ${cashflowData.length===0?'<tr><td colspan="5" style="text-align:center;color:#9ca3af">No transaction data yet</td></tr>':''}
      </tbody></table>
      <h3 style="margin-top:24px">All Transactions</h3>
      <table><thead><tr><th>Customer</th><th>Event Type</th><th>Inflow</th><th>Outflow</th><th>Net Cashflow</th><th>Date</th></tr></thead><tbody>
      ${transactions.map((t:any)=>`<tr><td>${t.customerName||'—'}</td><td>${t.eventType||'—'}</td><td style="color:#16a34a">₱${(t.amount||0).toLocaleString()}.00</td><td style="color:#dc2626">₱${(t.totalExpenses||0).toLocaleString()}.00</td><td style="color:${(t.profit||0)>=0?'#2563eb':'#dc2626'}">₱${(t.profit||0).toLocaleString()}.00</td><td>${t.completedAt?(t.completedAt?.toDate?format(t.completedAt.toDate(),'MMM dd, yyyy'):format(new Date(t.completedAt),'MMM dd, yyyy')):'—'}</td></tr>`).join('')}
      ${transactions.length===0?'<tr><td colspan="6" style="text-align:center;color:#9ca3af">No transactions yet</td></tr>':''}
      </tbody></table>
      <div class="footer"><p>© Event Cash Management System</p></div></body></html>`;
    }

    pw.document.write(html);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
  };

  const handleExportReportExcel = () => {
    const monthLabel = format(selectedMonth, 'MMMM yyyy');
    const printed = format(new Date(), 'MMMM dd, yyyy HH:mm:ss');
    let rows: string[][] = [];
    let filename = '';

    if (activeReport === 'income-expenses') {
      filename = `income_vs_expenses_${format(selectedMonth,'yyyy-MM')}.csv`;
      rows = [
        ['Income vs Expenses Report'], ['Month', monthLabel], ['Exported on', printed], [],
        ['Monthly Revenue', `₱${monthlyRevenue.toLocaleString()}.00`],
        ['Monthly Expenses', `₱${monthlyExpenses.toLocaleString()}.00`],
        ['Net Profit', `₱${monthlyProfit.toLocaleString()}.00`],
        ['Profit Margin %', monthlyRevenue > 0 ? `${(((monthlyRevenue-monthlyExpenses)/monthlyRevenue)*100).toFixed(2)}%` : '0%'],
        ['Bookings This Month', String(monthlyConfirmedBookings.length)], [],
        ['Event Type', 'Count', 'Revenue', 'Net Profit'],
        ...eventTypeBreakdown.map(i => [i.type, String(i.count), `₱${i.revenue.toLocaleString()}.00`, `₱${(i.revenue-i.expenses).toLocaleString()}.00`]),
      ];
    } else if (activeReport === 'profitability') {
      filename = `profitability_${format(selectedMonth,'yyyy-MM')}.csv`;
      rows = [
        ['Profitability Analysis Report'], ['Month', monthLabel], ['Exported on', printed], [],
        ['Profit Margin', monthlyRevenue > 0 ? `${((monthlyProfit/monthlyRevenue)*100).toFixed(2)}%` : '0%'],
        ['Monthly Profit', `₱${monthlyProfit.toLocaleString()}.00`],
        ['Total Revenue (All Time)', `₱${totalRevenue.toLocaleString()}.00`],
        ['Total Expenses (All Time)', `₱${totalExpenses.toLocaleString()}.00`],
        ['Net Profit (All Time)', `₱${totalProfit.toLocaleString()}.00`], [],
        ['Customer', 'Event Type', 'Date', 'Revenue', 'Expenses', 'Net Profit', 'Margin %'],
        ...confirmedBookings.sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map(b => {
          const rev=b.totalPrice-(b.discount||0);const exp=getExpenseAmount(b.expenses);const profit=rev-exp;
          return [b.customerName, b.eventType, format(b.eventDate,'MMM dd, yyyy'), `₱${rev.toLocaleString()}.00`, `₱${exp.toLocaleString()}.00`, `₱${profit.toLocaleString()}.00`, rev>0?`${((profit/rev)*100).toFixed(1)}%`:'0%'];
        }),
      ];
    } else if (activeReport === 'budget') {
      filename = `budget_analysis_${format(selectedMonth,'yyyy-MM')}.csv`;
      const totalBudgeted = confirmedBookings.reduce((s,b)=>s+(b.budget||0),0);
      rows = [
        ['Budget Analysis Report'], ['Month', monthLabel], ['Exported on', printed], [],
        ['Total Budgeted', `₱${totalBudgeted.toLocaleString()}.00`],
        ['Total Actual Expenses', `₱${totalExpenses.toLocaleString()}.00`],
        ['Variance', `₱${(totalBudgeted-totalExpenses).toLocaleString()}.00`],
        ['Events Over Budget', String(confirmedBookings.filter(b=>b.budget&&getExpenseAmount(b.expenses)>b.budget).length)], [],
        ['Customer', 'Event Type', 'Date', 'Budget', 'Actual Expenses', 'Variance', 'Status'],
        ...confirmedBookings.filter(b=>b.budget||getExpenseAmount(b.expenses)>0).sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map(b => {
          const budget=b.budget||0;const exp=getExpenseAmount(b.expenses);const v=budget-exp;const over=budget>0&&exp>budget;
          return [b.customerName, b.eventType, format(b.eventDate,'MMM dd, yyyy'), budget>0?`₱${budget.toLocaleString()}.00`:'—', `₱${exp.toLocaleString()}.00`, budget>0?`₱${v.toLocaleString()}.00`:'—', budget>0?(over?'Over':exp>budget*0.8?'At Risk':'On Track'):'No Budget'];
        }),
      ];
    } else if (activeReport === 'cashflow') {
      filename = `cashflow_${format(selectedMonth,'yyyy-MM')}.csv`;
      const totalInflow = transactions.reduce((s:number,t:any)=>s+(t.amount||0),0);
      const totalOutflow = transactions.reduce((s:number,t:any)=>s+(t.totalExpenses||0),0);
      const netCashflow = transactions.reduce((s:number,t:any)=>s+(t.profit||0),0);
      rows = [
        ['Cashflow Report'], ['Exported on', printed], [],
        ['Total Inflow', `₱${totalInflow.toLocaleString()}.00`],
        ['Total Outflow', `₱${totalOutflow.toLocaleString()}.00`],
        ['Net Cashflow', `₱${netCashflow.toLocaleString()}.00`], [],
        ['Month', 'Inflow', 'Outflow', 'Net Cashflow', 'Transactions'],
        ...cashflowData.map((m:any) => [format(new Date(m.month+'-01'),'MMMM yyyy'), `₱${m.income.toLocaleString()}.00`, `₱${m.expenses.toLocaleString()}.00`, `₱${m.profit.toLocaleString()}.00`, String(m.transactions.length)]),
        [],
        ['Customer', 'Event Type', 'Inflow', 'Outflow', 'Net Cashflow', 'Date'],
        ...transactions.map((t:any) => [t.customerName||'—', t.eventType||'—', `₱${(t.amount||0).toLocaleString()}.00`, `₱${(t.totalExpenses||0).toLocaleString()}.00`, `₱${(t.profit||0).toLocaleString()}.00`, t.completedAt?(t.completedAt?.toDate?format(t.completedAt.toDate(),'MMM dd, yyyy'):format(new Date(t.completedAt),'MMM dd, yyyy')):'—']),
      ];
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
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
                    <div><p className="text-gray-600 text-sm font-semibold">Net Profit</p>
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
                    <div className="border-t pt-3"><p className="text-sm text-gray-600">Net Profit</p><p className="text-2xl font-bold text-green-600">₱{totalProfit.toLocaleString()}.00</p></div>
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
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
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
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outflow</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
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
                      <p className="text-gray-600 text-sm font-semibold">Total Inflow</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">{transactions.length} transactions</p>
                    </div>
                    <TrendingUp size={40} className="text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Outflow</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((s, t) => s + (t.totalExpenses || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">All expense items</p>
                    </div>
                    <TrendingDown size={40} className="text-red-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Net Cashflow</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((s, t) => s + (t.profit || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Inflow - Outflow</p>
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
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Inflow</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outflow</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
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
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Inflow</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outflow</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
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
