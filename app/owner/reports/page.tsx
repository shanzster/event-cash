'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, isWithinInterval, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, PieChart, LogOut, Target, AlertCircle, X, Filter, Printer } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ManagerSidebar from '@/components/ManagerSidebar';

interface BookingDetails {
  id: string;
  customerName: string;
  eventType: string;
  eventDate: any;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'declined';
  createdAt: any;
  expenses?: number | Array<{ amount: number; [key: string]: any }>;
  discount?: number;
  budget?: number;
}

const getExpenseAmount = (expenses: number | Array<{ amount: number; [key: string]: any }> | undefined): number => {
  if (typeof expenses === 'number') {
    return expenses || 0;
  } else if (Array.isArray(expenses)) {
    return expenses.reduce((total, item) => total + (item.amount || 0), 0);
  }
  return 0;
};

export default function ManagerReports() {
  const router = useRouter();
  const { managerUser, loading, isManager, managerLogout } = useManager();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeReport, setActiveReport] = useState<'income-expenses' | 'profitability' | 'budget' | 'cashflow'>('income-expenses');
  const [monthlyBudget, setMonthlyBudget] = useState(10000); // Default budget
  const [profitabilityViewType, setProfitabilityViewType] = useState<'week' | 'month'>('month');
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    eventType: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });

  // Redirect if not manager
  useEffect(() => {
    if (!loading && !isManager) {
      router.push('/owner/login');
    }
  }, [loading, isManager, router]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const querySnapshot = await getDocs(bookingsRef);
        
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventDate: doc.data().eventDate.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as BookingDetails[];

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

  // Apply filters to bookings
  const getFilteredBookings = () => {
    let filtered = bookings;

    if (filters.status !== 'all') {
      filtered = filtered.filter(b => b.status === filters.status);
    }

    if (filters.eventType !== 'all') {
      filtered = filtered.filter(b => b.eventType === filters.eventType);
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      filtered = filtered.filter(b => new Date(b.eventDate) >= from);
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      filtered = filtered.filter(b => new Date(b.eventDate) <= to);
    }

    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      filtered = filtered.filter(b => b.totalPrice >= min);
    }

    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(b => b.totalPrice <= max);
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Fetch transactions for cashflow
  const [transactions, setTransactions] = useState([]);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isManager) return;
      try {
        const transactionsRef = collection(db, 'transactions');
        const snapshot = await getDocs(transactionsRef);
        const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(transData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    fetchTransactions();
  }, [isManager, managerUser?.uid]);

  // Calculate cashflow data by month
  const getCashflowByMonth = () => {
    const cashflow = {};
    
    transactions.forEach(trans => {
      if (!trans.completedAt) return;
      
      const transDate = trans.completedAt?.toDate ? trans.completedAt.toDate() : new Date(trans.completedAt);
      const monthKey = format(transDate, 'yyyy-MM');
      
      if (!cashflow[monthKey]) {
        cashflow[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
          profit: 0,
          transactions: []
        };
      }
      
      cashflow[monthKey].income += trans.amount || 0;
      cashflow[monthKey].expenses += trans.totalExpenses || 0;
      cashflow[monthKey].profit = cashflow[monthKey].income - cashflow[monthKey].expenses;
      cashflow[monthKey].transactions.push(trans);
    });
    
    return Object.values(cashflow).sort((a, b) => b.month.localeCompare(a.month));
  };

  const cashflowData = getCashflowByMonth();

  // Calculate metrics — include both confirmed and completed bookings for financial reporting
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');

  // Calculate profitability by week
  const getProfitabilityByWeek = () => {
    const weekData: { [key: string]: { week: string; revenue: number; expenses: number; profit: number; margin: number; bookings: number } } = {};
    
    confirmedBookings.forEach(booking => {
      const weekStart = startOfWeek(booking.eventDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const weekLabel = `Week of ${format(weekStart, 'MMM dd')}`;
      
      if (!weekData[weekKey]) {
        weekData[weekKey] = {
          week: weekLabel,
          revenue: 0,
          expenses: 0,
          profit: 0,
          margin: 0,
          bookings: 0,
        };
      }
      
      const revenue = booking.totalPrice - (booking.discount || 0);
      const expenses = getExpenseAmount(booking.expenses);
      
      weekData[weekKey].revenue += revenue;
      weekData[weekKey].expenses += expenses;
      weekData[weekKey].profit += revenue - expenses;
      weekData[weekKey].bookings += 1;
    });
    
    // Calculate margins
    Object.values(weekData).forEach(week => {
      week.margin = week.revenue > 0 ? (week.profit / week.revenue) * 100 : 0;
    });
    
    return Object.values(weekData).sort((a, b) => a.week.localeCompare(b.week));
  };

  // Calculate profitability by month
  const getProfitabilityByMonth = () => {
    const monthData: { [key: string]: { month: string; revenue: number; expenses: number; profit: number; margin: number; bookings: number } } = {};
    
    confirmedBookings.forEach(booking => {
      const monthKey = format(booking.eventDate, 'yyyy-MM');
      const monthLabel = format(booking.eventDate, 'MMM yyyy');
      
      if (!monthData[monthKey]) {
        monthData[monthKey] = {
          month: monthLabel,
          revenue: 0,
          expenses: 0,
          profit: 0,
          margin: 0,
          bookings: 0,
        };
      }
      
      const revenue = booking.totalPrice - (booking.discount || 0);
      const expenses = getExpenseAmount(booking.expenses);
      
      monthData[monthKey].revenue += revenue;
      monthData[monthKey].expenses += expenses;
      monthData[monthKey].profit += revenue - expenses;
      monthData[monthKey].bookings += 1;
    });
    
    // Calculate margins
    Object.values(monthData).forEach(month => {
      month.margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0;
    });
    
    return Object.values(monthData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const profitabilityByWeek = getProfitabilityByWeek();
  const profitabilityByMonth = getProfitabilityByMonth();
  const chartData = profitabilityViewType === 'week' ? profitabilityByWeek : profitabilityByMonth;
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const monthlyConfirmedBookings = confirmedBookings.filter(b =>
    isWithinInterval(b.eventDate, { start: monthStart, end: monthEnd })
  );

  const monthlyRevenue = monthlyConfirmedBookings.reduce((sum, b) => 
    sum + (b.totalPrice - (b.discount || 0)), 0
  );

  const monthlyExpenses = monthlyConfirmedBookings.reduce((sum, b) => 
    sum + getExpenseAmount(b.expenses), 0
  );

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const totalRevenue = confirmedBookings.reduce((sum, b) => 
    sum + (b.totalPrice - (b.discount || 0)), 0
  );

  const totalExpenses = confirmedBookings.reduce((sum, b) => 
    sum + getExpenseAmount(b.expenses), 0
  );

  const totalProfit = totalRevenue - totalExpenses;

  // Group by event type (scoped to selected month)
  const eventTypeBreakdown = monthlyConfirmedBookings.reduce((acc, b) => {
    const existing = acc.find(item => item.type === b.eventType);
    const expenseAmount = getExpenseAmount(b.expenses);
    if (existing) {
      existing.count += 1;
      existing.revenue += b.totalPrice - (b.discount || 0);
      existing.expenses += expenseAmount;
    } else {
      acc.push({
        type: b.eventType,
        count: 1,
        revenue: b.totalPrice - (b.discount || 0),
        expenses: expenseAmount,
      });
    }
    return acc;
  }, [] as Array<{ type: string; count: number; revenue: number; expenses: number }>);

  // Top customers (scoped to selected month)
  const topCustomers = monthlyConfirmedBookings
    .reduce((acc, b) => {
      const existing = acc.find(item => item.name === b.customerName);
      if (existing) {
        existing.bookings += 1;
        existing.totalSpent += b.totalPrice - (b.discount || 0);
      } else {
        acc.push({
          name: b.customerName,
          bookings: 1,
          totalSpent: b.totalPrice - (b.discount || 0),
        });
      }
      return acc;
    }, [] as Array<{ name: string; bookings: number; totalSpent: number }>)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Print Report — tab-aware
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const printed = format(new Date(), 'MMMM dd, yyyy hh:mm a');
    const monthLabel = format(selectedMonth, 'MMMM yyyy');
    const style = `<style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;background:#fff;color:#111;padding:32px;font-size:13px}
      h1{font-size:22px;font-weight:800;margin-bottom:4px}
      .sub{font-size:12px;color:#6b7280;margin-bottom:24px}
      .kpi-row{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .kpi{flex:1;min-width:130px;padding:14px 16px;border-radius:8px;border-left:4px solid}
      .kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:6px}
      .kpi-value{font-size:20px;font-weight:800}
      table{width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:24px}
      thead tr{background:#f59e0b}
      th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase}
      td{padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px}
      h3{font-size:14px;font-weight:700;margin-top:20px;margin-bottom:8px;color:#374151;border-bottom:2px solid #f59e0b;padding-bottom:6px}
      .footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af}
      @media print{@page{size:A4;margin:.5in}}
    </style>`;

    let body = '';

    if (activeReport === 'income-expenses') {
      const profitMargin = monthlyRevenue > 0 ? (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(1) : '0.0';
      body = `
        <h1>Income vs Expenses Report</h1>
        <div class="sub">Month: ${monthLabel} &nbsp;·&nbsp; Printed: ${printed} &nbsp;·&nbsp; ${monthlyConfirmedBookings.length} booking(s)</div>
        <div class="kpi-row">
          <div class="kpi" style="border-color:#2563eb;background:#eff6ff"><div class="kpi-label">Monthly Revenue</div><div class="kpi-value" style="color:#2563eb">₱${monthlyRevenue.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#dc2626;background:#fef2f2"><div class="kpi-label">Monthly Expenses</div><div class="kpi-value" style="color:#dc2626">₱${monthlyExpenses.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#16a34a;background:#f0fdf4"><div class="kpi-label">Net Profit</div><div class="kpi-value" style="color:#16a34a">₱${monthlyProfit.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#7c3aed;background:#faf5ff"><div class="kpi-label">Profit Margin</div><div class="kpi-value" style="color:#7c3aed">${profitMargin}%</div></div>
        </div>
        <h3>Revenue by Event Type</h3>
        <table><thead><tr><th>Event Type</th><th>Bookings</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th></tr></thead><tbody>
        ${eventTypeBreakdown.map((i,idx)=>`<tr style="background:${idx%2===0?'#fff':'#fafafa'}"><td>${i.type}</td><td>${i.count}</td><td style="color:#2563eb">₱${i.revenue.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:#dc2626">₱${i.expenses.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:${(i.revenue-i.expenses)>=0?'#16a34a':'#dc2626'}">₱${(i.revenue-i.expenses).toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr>`).join('')}
        ${eventTypeBreakdown.length===0?'<tr><td colspan="5" style="text-align:center;color:#9ca3af">No data for this period</td></tr>':''}
        </tbody></table>
        <h3>Top Customers</h3>
        <table><thead><tr><th>Customer</th><th>Bookings</th><th>Total Spent</th></tr></thead><tbody>
        ${topCustomers.map((c,i)=>`<tr style="background:${i%2===0?'#fff':'#fafafa'}"><td>${c.name}</td><td>${c.bookings}</td><td style="color:#d97706">₱${c.totalSpent.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr>`).join('')}
        ${topCustomers.length===0?'<tr><td colspan="3" style="text-align:center;color:#9ca3af">No customer data</td></tr>':''}
        </tbody></table>`;

    } else if (activeReport === 'profitability') {
      body = `
        <h1>Profitability Analysis Report</h1>
        <div class="sub">Month: ${monthLabel} &nbsp;·&nbsp; Printed: ${printed}</div>
        <div class="kpi-row">
          <div class="kpi" style="border-color:#16a34a;background:#f0fdf4"><div class="kpi-label">Profit Margin</div><div class="kpi-value" style="color:#16a34a">${monthlyRevenue>0?((monthlyProfit/monthlyRevenue)*100).toFixed(1):0}%</div></div>
          <div class="kpi" style="border-color:#16a34a;background:#f0fdf4"><div class="kpi-label">Monthly Profit</div><div class="kpi-value" style="color:#16a34a">₱${monthlyProfit.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#2563eb;background:#eff6ff"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="color:#2563eb">₱${totalRevenue.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#dc2626;background:#fef2f2"><div class="kpi-label">Total Expenses</div><div class="kpi-value" style="color:#dc2626">₱${totalExpenses.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
        </div>
        <h3>Profitability by Booking</h3>
        <table><thead><tr><th>Customer</th><th>Event Type</th><th>Date</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th><th>Margin</th><th>Status</th></tr></thead><tbody>
        ${confirmedBookings.sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map((b,idx)=>{
          const rev=b.totalPrice-(b.discount||0);const exp=getExpenseAmount(b.expenses);const profit=rev-exp;
          const margin=rev>0?((profit/rev)*100).toFixed(1):0;
          return `<tr style="background:${idx%2===0?'#fff':'#fafafa'}"><td>${b.customerName}</td><td>${b.eventType}</td><td>${format(b.eventDate,'MMM dd, yyyy')}</td><td style="color:#2563eb">₱${rev.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:#dc2626">₱${exp.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:${profit>=0?'#16a34a':'#dc2626'}">₱${profit.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:${profit>=0?'#16a34a':'#dc2626'}">${margin}%</td><td><span style="padding:2px 8px;border-radius:4px;font-size:10px;background:${profit>=0?'#dcfce7':'#fee2e2'};color:${profit>=0?'#166534':'#991b1b'}">${profit>=0?'✓ Profitable':'✗ Loss'}</span></td></tr>`;
        }).join('')}
        ${confirmedBookings.length===0?'<tr><td colspan="8" style="text-align:center;color:#9ca3af">No bookings data yet</td></tr>':''}
        </tbody></table>`;

    } else if (activeReport === 'budget') {
      const totalBudgeted = confirmedBookings.reduce((s,b)=>s+(b.budget||0),0);
      const variance = totalBudgeted - totalExpenses;
      body = `
        <h1>Budget Analysis Report</h1>
        <div class="sub">Month: ${monthLabel} &nbsp;·&nbsp; Printed: ${printed}</div>
        <div class="kpi-row">
          <div class="kpi" style="border-color:#2563eb;background:#eff6ff"><div class="kpi-label">Total Budgeted</div><div class="kpi-value" style="color:#2563eb">₱${totalBudgeted.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#dc2626;background:#fef2f2"><div class="kpi-label">Actual Expenses</div><div class="kpi-value" style="color:#dc2626">₱${totalExpenses.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:${variance>=0?'#16a34a':'#dc2626'};background:${variance>=0?'#f0fdf4':'#fef2f2'}"><div class="kpi-label">Variance</div><div class="kpi-value" style="color:${variance>=0?'#16a34a':'#dc2626'}">${variance>=0?'+':''}₱${variance.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#ea580c;background:#fff7ed"><div class="kpi-label">Over Budget</div><div class="kpi-value" style="color:#ea580c">${confirmedBookings.filter(b=>b.budget&&getExpenseAmount(b.expenses)>b.budget).length}</div></div>
        </div>
        <h3>Budget Analysis by Event</h3>
        <table><thead><tr><th>Customer</th><th>Event Type</th><th>Date</th><th>Budget</th><th>Actual</th><th>Variance</th><th>Status</th></tr></thead><tbody>
        ${confirmedBookings.filter(b=>b.budget||getExpenseAmount(b.expenses)>0).sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map((b,idx)=>{
          const budget=b.budget||0;const exp=getExpenseAmount(b.expenses);const v=budget-exp;const over=budget>0&&exp>budget;
          return `<tr style="background:${idx%2===0?'#fff':'#fafafa'}"><td>${b.customerName}</td><td>${b.eventType}</td><td>${format(b.eventDate,'MMM dd, yyyy')}</td><td>${budget>0?'₱'+budget.toLocaleString('en-PH',{minimumFractionDigits:2}):'—'}</td><td>₱${exp.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:${v>=0?'#16a34a':'#dc2626'};white-space:nowrap">${budget>0?(v>=0?'+':'-')+'₱'+Math.abs(v).toLocaleString('en-PH',{minimumFractionDigits:2}):'—'}</td><td><span style="padding:2px 8px;border-radius:4px;font-size:10px;background:${over?'#fee2e2':exp>budget*0.8?'#fef9c3':'#dcfce7'};color:${over?'#991b1b':exp>budget*0.8?'#854d0e':'#166534'}">${budget>0?(over?'Over':exp>budget*0.8?'At Risk':'On Track'):'No Budget'}</span></td></tr>`;
        }).join('')}
        ${confirmedBookings.filter(b=>b.budget||getExpenseAmount(b.expenses)>0).length===0?'<tr><td colspan="7" style="text-align:center;color:#9ca3af">No events with budget data yet</td></tr>':''}
        </tbody></table>`;

    } else if (activeReport === 'cashflow') {
      const totalInflow = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalOutflow = transactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);
      const netCashflow = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
      body = `
        <h1>Cashflow Report</h1>
        <div class="sub">Printed: ${printed}</div>
        <div class="kpi-row">
          <div class="kpi" style="border-color:#16a34a;background:#f0fdf4"><div class="kpi-label">Total Inflow</div><div class="kpi-value" style="color:#16a34a">₱${totalInflow.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#dc2626;background:#fef2f2"><div class="kpi-label">Total Outflow</div><div class="kpi-value" style="color:#dc2626">₱${totalOutflow.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
          <div class="kpi" style="border-color:#2563eb;background:#eff6ff"><div class="kpi-label">Net Cashflow</div><div class="kpi-value" style="color:#2563eb">₱${netCashflow.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
        </div>
        <h3>Cashflow by Month</h3>
        <table><thead><tr><th>Month</th><th>Inflow</th><th>Outflow</th><th>Net Cashflow</th><th>Transactions</th></tr></thead><tbody>
        ${cashflowData.map((m:any,idx:number)=>`<tr style="background:${idx%2===0?'#fff':'#fafafa'}"><td>${format(new Date(m.month+'-01'),'MMMM yyyy')}</td><td style="color:#16a34a">₱${m.income.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:#dc2626">₱${m.expenses.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:${m.profit>=0?'#2563eb':'#dc2626'}">₱${m.profit.toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td>${m.transactions.length}</td></tr>`).join('')}
        ${cashflowData.length===0?'<tr><td colspan="5" style="text-align:center;color:#9ca3af">No transaction data yet</td></tr>':''}
        </tbody></table>
        <h3>All Transactions</h3>
        <table><thead><tr><th>Customer</th><th>Event Type</th><th>Inflow</th><th>Outflow</th><th>Net Cashflow</th><th>Date</th></tr></thead><tbody>
        ${transactions.map((t:any,idx:number)=>`<tr style="background:${idx%2===0?'#fff':'#fafafa'}"><td>${t.customerName||'—'}</td><td>${t.eventType||'—'}</td><td style="color:#16a34a">₱${(t.amount||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:#dc2626">₱${(t.totalExpenses||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="color:${(t.profit||0)>=0?'#2563eb':'#dc2626'}">₱${(t.profit||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td>${t.completedAt?(t.completedAt?.toDate?format(t.completedAt.toDate(),'MMM dd, yyyy'):format(new Date(t.completedAt),'MMM dd, yyyy')):'—'}</td></tr>`).join('')}
        ${transactions.length===0?'<tr><td colspan="6" style="text-align:center;color:#9ca3af">No transactions yet</td></tr>':''}
        </tbody></table>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>${style}</head><body>${body}<div class="footer"><strong>Event Cash Management System</strong> &nbsp;·&nbsp; Confidential Financial Report &nbsp;·&nbsp; ${printed}</div><script>window.onload=()=>{window.print();}<\/script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Export Report — tab-aware CSV
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
        ['Event Type', 'Count', 'Revenue', 'Expenses', 'Net Profit'],
        ...eventTypeBreakdown.map(i => [i.type, String(i.count), `₱${i.revenue.toLocaleString()}.00`, `₱${i.expenses.toLocaleString()}.00`, `₱${(i.revenue-i.expenses).toLocaleString()}.00`]),
        [], ['Top Customers'], ['Customer', 'Bookings', 'Total Spent'],
        ...topCustomers.map(c => [c.name, String(c.bookings), `₱${c.totalSpent.toLocaleString()}.00`]),
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
        ['Customer', 'Event Type', 'Date', 'Revenue', 'Expenses', 'Net Profit', 'Margin %', 'Status'],
        ...confirmedBookings.sort((a,b)=>new Date(b.eventDate).getTime()-new Date(a.eventDate).getTime()).map(b => {
          const rev=b.totalPrice-(b.discount||0);const exp=getExpenseAmount(b.expenses);const profit=rev-exp;
          return [b.customerName, b.eventType, format(b.eventDate,'MMM dd, yyyy'), `₱${rev.toLocaleString()}.00`, `₱${exp.toLocaleString()}.00`, `₱${profit.toLocaleString()}.00`, rev>0?`${((profit/rev)*100).toFixed(1)}%`:'0%', profit>=0?'Profitable':'Loss'];
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
      const totalInflow = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalOutflow = transactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);
      const netCashflow = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
      rows = [
        ['Cashflow Report'], ['Exported on', printed], [],
        ['Total Inflow', `₱${totalInflow.toLocaleString()}.00`],
        ['Total Outflow', `₱${totalOutflow.toLocaleString()}.00`],
        ['Net Cashflow', `₱${netCashflow.toLocaleString()}.00`], [],
        ['Month', 'Inflow', 'Outflow', 'Net Cashflow', 'Transactions'],
        ...cashflowData.map((m: any) => [format(new Date(m.month+'-01'),'MMMM yyyy'), `₱${m.income.toLocaleString()}.00`, `₱${m.expenses.toLocaleString()}.00`, `₱${m.profit.toLocaleString()}.00`, String(m.transactions.length)]),
        [],
        ['Customer', 'Event Type', 'Inflow', 'Outflow', 'Net Cashflow', 'Date'],
        ...transactions.map((t: any) => [t.customerName||'—', t.eventType||'—', `₱${(t.amount||0).toLocaleString()}.00`, `₱${(t.totalExpenses||0).toLocaleString()}.00`, `₱${(t.profit||0).toLocaleString()}.00`, t.completedAt?(t.completedAt?.toDate?format(t.completedAt.toDate(),'MMM dd, yyyy'):format(new Date(t.completedAt),'MMM dd, yyyy')):'—']),
      ];
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = filename;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading || loadingData) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading reports...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  if (!isManager) {
    return null;
  }

  return (
    <>
      <style>{`
        @media print {
          /* Hide navigation and UI elements */
          [class*="sidebar"],
          [class*="navigation"],
          button,
          .no-print {
            display: none !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 0.5in;
            orphans: 3;
            widows: 3;
          }

          body {
            margin: 0;
            padding: 0.5in;
            background: white;
            color: #000;
          }

          /* Force all text to black */
          * {
            color: #000 !important;
            background: white !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }

          /* Typography */
          h1, h2, h3, h4, h5, h6 {
            color: #000 !important;
            page-break-after: avoid;
            font-weight: bold;
          }

          h1 { font-size: 24pt; }
          h2 { font-size: 18pt; }
          h3 { font-size: 14pt; }
          
          p { font-size: 11pt; line-height: 1.5; }

          /* Table styling */
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
            margin: 12pt 0;
          }

          th, td {
            border: 1px solid #000 !important;
            padding: 8pt !important;
            text-align: left;
            color: #000 !important;
            background: white !important;
          }

          th {
            background: #f5f5f5 !important;
            font-weight: bold;
          }

          tr {
            page-break-inside: avoid;
          }

          /* Remove all gradients and background images */
          [class*="bg-gradient"],
          [class*="from-"],
          [class*="to-"] {
            background: white !important;
          }

          /* Card styling */
          [class*="rounded-xl"],
          [class*="rounded-lg"] {
            page-break-inside: avoid;
            border: 1px solid #000 !important;
            background: white !important;
            box-shadow: none !important;
          }

          /* Remove padding for compact printing */
          .p-6 { padding: 0.3in !important; }
          .mb-8 { margin-bottom: 0.2in !important; }
          .mb-4 { margin-bottom: 0.1in !important; }
          .gap-6 { gap: 0.2in !important; }

          /* Progress bars */
          [class*="bg-gray-200"] {
            border: 1px solid #000 !important;
          }

          /* Links */
          a {
            color: #000 !important;
            text-decoration: underline;
          }

          /* Remove shadows */
          [class*="shadow"] {
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }

          /* Ensure visibility of all text colors */
          [class*="text-"] {
            color: #000 !important;
          }

          /* Grid for better page breaks */
          .grid {
            page-break-inside: avoid;
          }

          /* Specific sections */
          .print-page-break {
            page-break-after: always;
          }
        }
      `}</style>
      <ManagerSidebar>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 print:bg-white print:py-0 print:p-0">
          <div className="max-w-7xl mx-auto px-4 print:px-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-2">Track your business performance</p>
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Filter size={20} />
                <span>Filters & Print</span>
              </button>
            </div>
          </motion.div>

          {/* Month Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  className="px-4 py-2 bg-white rounded-lg font-semibold border-2 border-gray-200 hover:border-primary transition-colors"
                >
                  <span className="text-black">← Previous</span>
                </button>
                <span className="text-xl font-bold text-gray-900 min-w-48 text-center">
                  {format(selectedMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  className="px-4 py-2 bg-white rounded-lg font-semibold border-2 border-gray-200 hover:border-primary transition-colors"
                >
                  <span className="text-black">Next →</span>
                </button>
                <button
                  onClick={() => setSelectedMonth(new Date())}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
                >
                  <span className="text-black">Today</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Report Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="flex gap-4 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveReport('income-expenses')}
                className={`px-6 py-3 font-semibold transition-all border-b-4 ${
                  activeReport === 'income-expenses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp size={20} className="inline mr-2" />
                Income vs Expenses
              </button>
              <button
                onClick={() => setActiveReport('profitability')}
                className={`px-6 py-3 font-semibold transition-all border-b-4 ${
                  activeReport === 'profitability'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp size={20} className="inline mr-2" />
                Profitability Analysis
              </button>
              <button
                onClick={() => setActiveReport('budget')}
                className={`px-6 py-3 font-semibold transition-all border-b-4 ${
                  activeReport === 'budget'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target size={20} className="inline mr-2" />
                Budget Analysis
              </button>
              <button
                onClick={() => setActiveReport('cashflow')}
                className={`px-6 py-3 font-semibold transition-all border-b-4 ${
                  activeReport === 'cashflow'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp size={20} className="inline mr-2" />
                Cashflow
              </button>
            </div>

            {/* Export and Print Buttons */}
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrintReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Printer size={20} />
                Print Report
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportReportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                📊 Export to Excel
              </motion.button>
            </div>
          </motion.div>

          {/* Income vs Expenses Report */}
          {activeReport === 'income-expenses' && (
            <>
              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
            {/* Monthly Revenue */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₱{monthlyRevenue.toLocaleString()}.00</p>
                  <p className="text-xs text-gray-500 mt-1">{monthlyConfirmedBookings.length} bookings</p>
                </div>
                <TrendingUp size={40} className="text-blue-500" />
              </div>
            </div>

            {/* Monthly Expenses */}
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

            {/* Net Profit */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Net Profit</p>
                  <p className="text-3xl font-bold text-gray-900">₱{monthlyProfit.toLocaleString()}.00</p>
                  <p className="text-xs text-gray-500 mt-1">Revenue - Expenses</p>
                </div>
                <TrendingUp size={40} className="text-green-500" />
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Profit Margin</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <PieChart size={40} className="text-purple-500" />
              </div>
            </div>
          </motion.div>

          {/* All Time Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">All Time Totals</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">₱{totalRevenue.toLocaleString()}.00</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}.00</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-green-600">₱{totalProfit.toLocaleString()}.00</p>
                </div>
              </div>
            </div>

            {/* Income vs Expenses Comparison */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Revenue</p>
                    <p className="text-sm font-bold text-blue-600">₱{monthlyRevenue.toLocaleString()}.00</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{
                        width: monthlyRevenue + monthlyExpenses > 0
                          ? (monthlyRevenue / (monthlyRevenue + monthlyExpenses)) * 100 + '%'
                          : 0,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Expenses</p>
                    <p className="text-sm font-bold text-red-600">₱{monthlyExpenses.toLocaleString()}.00</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-600 h-3 rounded-full"
                      style={{
                        width: monthlyRevenue + monthlyExpenses > 0
                          ? (monthlyExpenses / (monthlyRevenue + monthlyExpenses)) * 100 + '%'
                          : 0,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-primary/10 to-yellow-600/10 rounded-xl p-6 shadow-lg border-2 border-primary/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-3 text-sm text-black">
                <p><span className="font-semibold">Confirmed Bookings:</span> {monthlyConfirmedBookings.length}</p>
                <p><span className="font-semibold">This Month:</span> {monthlyConfirmedBookings.length}</p>
                <p><span className="font-semibold">Avg Revenue/Booking:</span> ₱{monthlyConfirmedBookings.length > 0 ? (monthlyRevenue / monthlyConfirmedBookings.length).toFixed(0) : 0}.00</p>
                <p><span className="font-semibold">Avg Expense/Booking:</span> ₱{monthlyConfirmedBookings.length > 0 ? (monthlyExpenses / monthlyConfirmedBookings.length).toFixed(0) : 0}.00</p>
              </div>
            </div>
          </motion.div>

          {/* Event Type Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Event Type Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900">Revenue by Event Type</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event Type</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Count</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Revenue</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventTypeBreakdown.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{item.type}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{item.count}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">₱{item.revenue.toLocaleString()}.00</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          ₱{(item.revenue - item.expenses).toLocaleString()}.00
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900">Top Customers</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-bold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-600">{customer.bookings} booking{customer.bookings !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="text-lg font-bold text-primary">₱{customer.totalSpent.toLocaleString()}.00</p>
                    </div>
                  ))}
                  {topCustomers.length === 0 && (
                    <p className="text-center text-gray-600 py-8">No customer data yet</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
            </>
          )}

          {/* Profitability Analysis Report */}
          {activeReport === 'profitability' && (
            <>
              {/* Profitability Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Profitability Trend</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProfitabilityViewType('week')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        profitabilityViewType === 'week'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setProfitabilityViewType('month')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        profitabilityViewType === 'month'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey={profitabilityViewType === 'week' ? 'week' : 'month'} 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis label={{ value: 'Amount (₱)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: any) => `₱${value.toLocaleString()}`}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-600">
                    <p>No profitability data available</p>
                  </div>
                )}
              </motion.div>

              {/* Profitability Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
              >
                {/* Profitability Score */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profitability Score</h3>
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-green-700">
                        {monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">This month's profit margin</p>
                    <p className="text-2xl font-bold text-green-600">₱{monthlyProfit.toLocaleString()}.00</p>
                  </div>
                </div>

                {/* Event Type Profitability */}
                <div className="bg-white rounded-xl p-6 shadow-lg lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profitability by Event Type</h3>
                  <div className="space-y-4">
                    {eventTypeBreakdown.map((event, index) => {
                      const eventProfit = event.revenue - event.expenses;
                      const eventMargin = event.revenue > 0 ? ((eventProfit / event.revenue) * 100).toFixed(1) : 0;
                      return (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900">{event.type}</h4>
                            <span className={`text-lg font-bold ${eventMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {eventMargin}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Revenue: ₱{event.revenue.toLocaleString()}.00</span>
                            <span>Expenses: ₱{event.expenses.toLocaleString()}.00</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${eventMargin > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(Math.abs(eventMargin), 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {eventTypeBreakdown.length === 0 && (
                      <p className="text-center text-gray-600 py-8">No profitability data yet</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Per-Booking Profitability Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
              >
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">Profitability by Booking</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Customer / Event</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Date</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Revenue</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Margin %</th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedBookings
                        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                        .map((booking, index) => {
                          const revenue = booking.totalPrice - (booking.discount || 0);
                          const expenses = getExpenseAmount(booking.expenses);
                          const profit = revenue - expenses;
                          const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
                          const isProfitable = profit > 0;
                          
                          return (
                            <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${!isProfitable ? 'bg-red-50' : ''}`}>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-semibold text-gray-900">{booking.customerName}</p>
                                  <p className="text-xs text-gray-600">{booking.eventType}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-700 text-sm">
                                {format(booking.eventDate, 'MMM dd, yyyy')}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-blue-600">
                                ₱{revenue.toLocaleString()}.00
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-red-600">
                                ₱{expenses.toLocaleString()}.00
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                ₱{profit.toLocaleString()}.00
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                {margin}%
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isProfitable
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {isProfitable ? '✓ Profitable' : '✗ Loss'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {confirmedBookings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                            No bookings data yet. Create bookings to see profitability analysis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Profit Analysis Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profit Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-blue-600">₱{totalRevenue.toLocaleString()}.00</p>
                    <p className="text-xs text-gray-600 mt-2">{confirmedBookings.length} events</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}.00</p>
                    <p className="text-xs text-gray-600 mt-2">{totalExpenses > 0 && totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}% of revenue</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Net Profit</p>
                    <p className="text-3xl font-bold text-green-600">₱{totalProfit.toLocaleString()}.00</p>
                    <p className="text-xs text-gray-600 mt-2">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% margin</p>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Budget Analysis Report */}
          {activeReport === 'budget' && (
            <>
              {/* Budget Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
                {/* Total Budgeted */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Budgeted</p>
                      <p className="text-3xl font-bold text-gray-900">
                        ₱{confirmedBookings.reduce((sum, b) => sum + (b.budget || 0), 0).toLocaleString()}.00
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{confirmedBookings.filter(b => b.budget).length} events with budget</p>
                    </div>
                    <Target size={40} className="text-blue-500" />
                  </div>
                </div>

                {/* Total Actual Expenses */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Actual Expenses</p>
                      <p className="text-3xl font-bold text-gray-900">₱{totalExpenses.toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Across all events</p>
                    </div>
                    <TrendingDown size={40} className="text-red-500" />
                  </div>
                </div>

                {/* Budget Variance */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Budget Variance</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {confirmedBookings.reduce((sum, b) => sum + (b.budget || 0), 0) - totalExpenses >= 0 ? '+' : ''}₱{(confirmedBookings.reduce((sum, b) => sum + (b.budget || 0), 0) - totalExpenses).toLocaleString()}.00
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Over/Under Budget</p>
                    </div>
                    <AlertCircle size={40} className={confirmedBookings.reduce((sum, b) => sum + (b.budget || 0), 0) - totalExpenses >= 0 ? 'text-green-500' : 'text-red-500'} />
                  </div>
                </div>

                {/* Events Over Budget */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Events Over Budget</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {confirmedBookings.filter(b => b.budget && getExpenseAmount(b.expenses) > b.budget).length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Exceeded their budget</p>
                    </div>
                    <AlertCircle size={40} className="text-orange-500" />
                  </div>
                </div>
              </motion.div>

              {/* Per-Event Budget Analysis Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">Budget Analysis by Event</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event / Customer</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Event Date</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Budget</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Actual Expenses</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Variance</th>
                        <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedBookings
                        .filter(b => b.budget || getExpenseAmount(b.expenses) > 0)
                        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                        .map((booking, index) => {
                          const budget = booking.budget || 0;
                          const expenses = getExpenseAmount(booking.expenses);
                          const variance = budget - expenses;
                          const isOverBudget = budget > 0 && expenses > budget;
                          const percentageUsed = budget > 0 ? ((expenses / budget) * 100).toFixed(1) : 0;
                          
                          return (
                            <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${isOverBudget ? 'bg-red-50' : ''}`}>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-semibold text-gray-900">{booking.customerName}</p>
                                  <p className="text-xs text-gray-600">{booking.eventType}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-700 text-sm">
                                {format(booking.eventDate, 'MMM dd, yyyy')}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                {budget > 0 ? `₱${budget.toLocaleString()}.00` : '—'}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                ₱{expenses.toLocaleString()}.00
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {budget > 0 ? `${variance >= 0 ? '+' : ''}₱${variance.toLocaleString()}.00 (${percentageUsed}%)` : '—'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {budget > 0 ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    isOverBudget
                                      ? 'bg-red-100 text-red-700'
                                      : expenses > budget * 0.8
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {isOverBudget ? 'Over' : expenses > budget * 0.8 ? 'At Risk' : 'On Track'}
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">No Budget</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {confirmedBookings.filter(b => b.budget || getExpenseAmount(b.expenses) > 0).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                            No events with budget data yet. Add budgets to your events to see the analysis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Budget Health Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
              >
                {/* On Track */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">On Track</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    {confirmedBookings.filter(b => b.budget && getExpenseAmount(b.expenses) <= b.budget * 0.8).length}
                  </p>
                  <p className="text-sm text-gray-600">Events within 80% of budget</p>
                </div>

                {/* At Risk */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">At Risk</h3>
                  <p className="text-3xl font-bold text-yellow-600 mb-2">
                    {confirmedBookings.filter(b => b.budget && getExpenseAmount(b.expenses) > b.budget * 0.8 && getExpenseAmount(b.expenses) <= b.budget).length}
                  </p>
                  <p className="text-sm text-gray-600">Events 80-100% of budget</p>
                </div>

                {/* Over Budget */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Over Budget</h3>
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    {confirmedBookings.filter(b => b.budget && getExpenseAmount(b.expenses) > b.budget).length}
                  </p>
                  <p className="text-sm text-gray-600">Events exceeding budget</p>
                </div>
              </motion.div>
            </>
          )}

          {/* Cashflow Report */}
          {activeReport === 'cashflow' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                {/* Total Inflow */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Inflow</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">{transactions.length} transactions</p>
                    </div>
                    <TrendingUp size={40} className="text-green-500" />
                  </div>
                </div>

                {/* Total Outflow */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Outflow</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">All expense items</p>
                    </div>
                    <TrendingDown size={40} className="text-red-500" />
                  </div>
                </div>

                {/* Net Cashflow */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Net Cashflow</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((sum, t) => sum + (t.profit || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Inflow - Outflow</p>
                    </div>
                    <TrendingUp size={40} className="text-blue-500" />
                  </div>
                </div>
              </motion.div>

              {/* Cashflow by Month Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">Cashflow by Month</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Month</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Inflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashflowData.map((month, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-900">{format(new Date(month.month + '-01'), 'MMMM yyyy')}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">₱{month.income.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">₱{month.expenses.toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold" style={{ color: month.profit >= 0 ? '#2563eb' : '#dc2626' }}>
                            ₱{month.profit.toLocaleString()}.00
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">{month.transactions.length}</td>
                        </tr>
                      ))}
                      {cashflowData.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                            No transaction data yet. Complete bookings to generate cashflow reports.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Detailed Transactions View */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">All Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Booking ID</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Customer</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Event Type</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Inflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Outflow</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Net Cashflow</th>
                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((trans, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono text-sm text-gray-700">{trans.bookingId.slice(0, 8)}...</td>
                          <td className="px-6 py-4 text-gray-900">{trans.customerName}</td>
                          <td className="px-6 py-4 text-gray-700">{trans.eventType}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">₱{(trans.amount || 0).toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">₱{(trans.totalExpenses || 0).toLocaleString()}.00</td>
                          <td className="px-6 py-4 text-right font-bold" style={{ color: (trans.profit || 0) >= 0 ? '#2563eb' : '#dc2626' }}>
                            ₱{(trans.profit || 0).toLocaleString()}.00
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {trans.completedAt?.toDate ? format(trans.completedAt.toDate(), 'MMM dd, yyyy') : format(new Date(trans.completedAt), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                            No transactions recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* Filter Modal */}
          {showFilterModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-primary to-yellow-600 text-white p-6 flex items-center justify-between sticky top-0">
                  <h2 className="text-2xl font-bold">Report Filters</h2>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  {/* Event Type Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
                    <select
                      value={filters.eventType}
                      onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    >
                      <option value="all">All Event Types</option>
                      {[...new Set(bookings.map(b => b.eventType))].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date From</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date To</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                  </div>

                  {/* Price Range Filters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Min Amount (₱)</label>
                      <input
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Max Amount (₱)</label>
                      <input
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                        placeholder="999999"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                      />
                    </div>
                  </div>

                  {/* Filter Summary */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Active Filters:</span> {filteredBookings.length} of {bookings.length} bookings shown
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 p-6 flex gap-4 border-t-2 border-gray-200 sticky bottom-0">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ status: 'all', eventType: 'all', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' });
                    }}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => {
                      setShowFilterModal(false);
                      handlePrintReport();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={20} />
                    Print Report
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </ManagerSidebar>
    </>
  );
}
