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

  // Print Report — Income vs Expenses (tab-aware, rich layout)
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const profitMargin = monthlyRevenue > 0
      ? (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(1)
      : '0.0';

    const activeFilters = [
      filters.status !== 'all' ? `Status: ${filters.status}` : null,
      filters.eventType !== 'all' ? `Event Type: ${filters.eventType}` : null,
      filters.dateFrom ? `From: ${filters.dateFrom}` : null,
      filters.dateTo ? `To: ${filters.dateTo}` : null,
      filters.minAmount ? `Min: ₱${filters.minAmount}` : null,
      filters.maxAmount ? `Max: ₱${filters.maxAmount}` : null,
    ].filter(Boolean);

    const eventTypeRows = eventTypeBreakdown.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
        <td style="padding:10px 14px;font-weight:600;color:#111">${item.type}</td>
        <td style="padding:10px 14px;text-align:center;color:#374151">${item.count}</td>
        <td style="padding:10px 14px;text-align:right;color:#2563eb;font-weight:700">₱${item.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td style="padding:10px 14px;text-align:right;color:#dc2626;font-weight:700">₱${item.expenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td style="padding:10px 14px;text-align:right;font-weight:700;color:${(item.revenue - item.expenses) >= 0 ? '#16a34a' : '#dc2626'}">₱${(item.revenue - item.expenses).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const topCustomerRows = topCustomers.map((c, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
        <td style="padding:10px 14px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:28px;height:28px;border-radius:50%;background:#f59e0b;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center">${i + 1}</div>
            <span style="font-weight:600;color:#111">${c.name}</span>
          </div>
        </td>
        <td style="padding:10px 14px;text-align:center;color:#374151">${c.bookings}</td>
        <td style="padding:10px 14px;text-align:right;color:#d97706;font-weight:700">₱${c.totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const revenueBarWidth = monthlyRevenue + monthlyExpenses > 0
      ? ((monthlyRevenue / (monthlyRevenue + monthlyExpenses)) * 100).toFixed(1)
      : '0';
    const expenseBarWidth = monthlyRevenue + monthlyExpenses > 0
      ? ((monthlyExpenses / (monthlyRevenue + monthlyExpenses)) * 100).toFixed(1)
      : '0';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Income vs Expenses — ${format(selectedMonth, 'MMMM yyyy')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#fff;color:#111;font-size:13px;padding:0}
    @page{size:A4;margin:0}
    @media print{body{padding:0}}

    /* ── Header ── */
    .header{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;padding:28px 36px 22px;display:flex;justify-content:space-between;align-items:flex-start}
    .header-left h1{font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px}
    .header-left p{font-size:12px;opacity:.85}
    .header-right{text-align:right}
    .header-right .month-badge{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;margin-bottom:6px;display:inline-block}
    .header-right .meta{font-size:10px;opacity:.8}

    /* ── Filter bar ── */
    .filter-bar{background:#fef3c7;border-bottom:2px solid #f59e0b;padding:8px 36px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;color:#92400e}
    .filter-bar strong{font-weight:700}
    .filter-tag{background:#f59e0b;color:#fff;border-radius:10px;padding:2px 10px;font-weight:600;font-size:10px}

    /* ── Body ── */
    .body{padding:24px 36px}

    /* ── KPI cards ── */
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
    .kpi{border-radius:10px;padding:16px;border-left:4px solid}
    .kpi.blue{background:#eff6ff;border-color:#2563eb}
    .kpi.red{background:#fef2f2;border-color:#dc2626}
    .kpi.green{background:#f0fdf4;border-color:#16a34a}
    .kpi.purple{background:#faf5ff;border-color:#7c3aed}
    .kpi-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:6px}
    .kpi-value{font-size:20px;font-weight:800;color:#111;line-height:1}
    .kpi-sub{font-size:10px;color:#9ca3af;margin-top:4px}

    /* ── Comparison bar ── */
    .comparison{background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e7eb}
    .comparison h3{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#374151;margin-bottom:14px}
    .bar-row{margin-bottom:12px}
    .bar-label{display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;font-weight:600;color:#374151}
    .bar-track{background:#e5e7eb;border-radius:99px;height:10px;overflow:hidden}
    .bar-fill{height:100%;border-radius:99px}

    /* ── Section header ── */
    .section-header{display:flex;align-items:center;gap:8px;margin-bottom:12px;margin-top:22px}
    .section-header h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#374151}
    .section-header .line{flex:1;height:1px;background:#e5e7eb}

    /* ── Tables ── */
    table{width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb}
    thead tr{background:#f59e0b}
    thead th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px}
    thead th.right{text-align:right}
    thead th.center{text-align:center}
    tbody tr{border-bottom:1px solid #f3f4f6}
    tbody tr:last-child{border-bottom:none}
    .no-data{text-align:center;padding:20px;color:#9ca3af;font-style:italic}

    /* ── Summary box ── */
    .summary-box{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;border-radius:10px;padding:16px 20px;margin-top:22px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .summary-item{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #fcd34d}
    .summary-item:last-child{border-bottom:none}
    .summary-item span:first-child{font-size:11px;font-weight:600;color:#92400e}
    .summary-item span:last-child{font-size:13px;font-weight:800;color:#111}

    /* ── Footer ── */
    .footer{background:#1f2937;color:#9ca3af;padding:14px 36px;display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-top:24px}
    .footer strong{color:#f59e0b}
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>Income vs Expenses Report</h1>
      <p>Event Cash Management System &nbsp;·&nbsp; Financial Overview</p>
    </div>
    <div class="header-right">
      <div class="month-badge">${format(selectedMonth, 'MMMM yyyy')}</div>
      <div class="meta">Printed: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}</div>
    </div>
  </div>

  <!-- Filter bar -->
  ${activeFilters.length > 0 ? `
  <div class="filter-bar">
    <strong>Active Filters:</strong>
    ${activeFilters.map(f => `<span class="filter-tag">${f}</span>`).join('')}
    <span style="margin-left:auto;color:#78350f">${monthlyConfirmedBookings.length} booking(s) in view</span>
  </div>` : `
  <div class="filter-bar">
    <strong>Filters:</strong> <span>No filters applied</span>
    <span style="margin-left:auto;color:#78350f">${monthlyConfirmedBookings.length} booking(s) in view</span>
  </div>`}

  <div class="body">

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi blue">
        <div class="kpi-label">Monthly Revenue</div>
        <div class="kpi-value">₱${monthlyRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
        <div class="kpi-sub">${monthlyConfirmedBookings.length} booking(s)</div>
      </div>
      <div class="kpi red">
        <div class="kpi-label">Monthly Expenses</div>
        <div class="kpi-value">₱${monthlyExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
        <div class="kpi-sub">Sum of all costs</div>
      </div>
      <div class="kpi green">
        <div class="kpi-label">Net Profit</div>
        <div class="kpi-value">₱${monthlyProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
        <div class="kpi-sub">Revenue − Expenses</div>
      </div>
      <div class="kpi purple">
        <div class="kpi-label">Profit Margin</div>
        <div class="kpi-value">${profitMargin}%</div>
        <div class="kpi-sub">This month</div>
      </div>
    </div>

    <!-- Revenue vs Expense Bar -->
    <div class="comparison">
      <h3>Revenue vs Expense Comparison</h3>
      <div class="bar-row">
        <div class="bar-label"><span>Revenue</span><span style="color:#2563eb">₱${monthlyRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${revenueBarWidth}%;background:#2563eb"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label"><span>Expenses</span><span style="color:#dc2626">₱${monthlyExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${expenseBarWidth}%;background:#dc2626"></div></div>
      </div>
    </div>

    <!-- Revenue by Event Type -->
    <div class="section-header"><h2>Revenue by Event Type</h2><div class="line"></div></div>
    <table>
      <thead>
        <tr>
          <th>Event Type</th>
          <th class="center">Bookings</th>
          <th class="right">Revenue</th>
          <th class="right">Expenses</th>
          <th class="right">Profit</th>
        </tr>
      </thead>
      <tbody>
        ${eventTypeRows || `<tr><td colspan="5" class="no-data">No data for this period</td></tr>`}
      </tbody>
    </table>

    <!-- Top Customers -->
    <div class="section-header"><h2>Top Customers</h2><div class="line"></div></div>
    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th class="center">Bookings</th>
          <th class="right">Total Spent</th>
        </tr>
      </thead>
      <tbody>
        ${topCustomerRows || `<tr><td colspan="3" class="no-data">No customer data for this period</td></tr>`}
      </tbody>
    </table>

    <!-- Summary Box -->
    <div class="summary-box">
      <div class="summary-item"><span>Confirmed Bookings</span><span>${monthlyConfirmedBookings.length}</span></div>
      <div class="summary-item"><span>Avg Revenue / Booking</span><span>₱${monthlyConfirmedBookings.length > 0 ? (monthlyRevenue / monthlyConfirmedBookings.length).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}</span></div>
      <div class="summary-item"><span>Total Revenue (All Time)</span><span>₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
      <div class="summary-item"><span>Avg Expense / Booking</span><span>₱${monthlyConfirmedBookings.length > 0 ? (monthlyExpenses / monthlyConfirmedBookings.length).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}</span></div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div><strong>Event Cash Management System</strong> &nbsp;·&nbsp; Confidential Financial Report</div>
    <div>Generated: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}</div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Export Report to Excel using ExcelJS
  const handleExportReportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Event Cash Management System';
    wb.created = new Date();

    const monthLabel = format(selectedMonth, 'MMMM yyyy');
    const profitMargin = monthlyRevenue > 0
      ? (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(2)
      : '0.00';

    // ── Colour palette ──────────────────────────────────────────────────────
    const AMBER   = 'FFF59E0B';
    const AMBER_L = 'FFFFF8E1';
    const BLUE    = 'FF2563EB';
    const BLUE_L  = 'FFEFF6FF';
    const RED     = 'FFDC2626';
    const RED_L   = 'FFFEF2F2';
    const GREEN   = 'FF16A34A';
    const GREEN_L = 'FFF0FDF4';
    const PURPLE  = 'FF7C3AED';
    const PURPLE_L= 'FFFAF5FF';
    const GRAY_H  = 'FFF3F4F6';
    const GRAY_B  = 'FFE5E7EB';
    const WHITE   = 'FFFFFFFF';
    const DARK    = 'FF111827';

    const border = (color = 'FFD1D5DB'): Partial<ExcelJS.Borders> => ({
      top:    { style: 'thin', color: { argb: color } },
      bottom: { style: 'thin', color: { argb: color } },
      left:   { style: 'thin', color: { argb: color } },
      right:  { style: 'thin', color: { argb: color } },
    });

    const headerFont = (color = WHITE, size = 11): Partial<ExcelJS.Font> =>
      ({ name: 'Calibri', bold: true, color: { argb: color }, size });

    const bodyFont = (bold = false, color = DARK, size = 10): Partial<ExcelJS.Font> =>
      ({ name: 'Calibri', bold, color: { argb: color }, size });

    const php = (v: number) =>
      `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 1 — Income vs Expenses
    // ════════════════════════════════════════════════════════════════════════
    const ws = wb.addWorksheet('Income vs Expenses', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
    });

    ws.columns = [
      { key: 'a', width: 32 },
      { key: 'b', width: 22 },
      { key: 'c', width: 22 },
      { key: 'd', width: 22 },
      { key: 'e', width: 22 },
    ];

    // ── Title block ─────────────────────────────────────────────────────────
    ws.mergeCells('A1:E1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'INCOME VS EXPENSES REPORT';
    titleCell.font = headerFont(WHITE, 16);
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = border(AMBER);
    ws.getRow(1).height = 36;

    ws.mergeCells('A2:E2');
    const subCell = ws.getCell('A2');
    subCell.value = `${monthLabel}  ·  Event Cash Management System  ·  Exported: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`;
    subCell.font = bodyFont(false, 'FF92400E', 9);
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subCell.border = border('FFFCD34D');
    ws.getRow(2).height = 18;

    ws.addRow([]); // spacer

    // ── KPI Section header ──────────────────────────────────────────────────
    ws.mergeCells('A4:E4');
    const kpiHeader = ws.getCell('A4');
    kpiHeader.value = 'KEY FINANCIAL METRICS';
    kpiHeader.font = headerFont(WHITE, 11);
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
    kpiHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    kpiHeader.border = border(AMBER);
    ws.getRow(4).height = 22;

    // KPI rows
    const kpis = [
      { label: 'Monthly Revenue',  value: php(monthlyRevenue),  note: `${monthlyConfirmedBookings.length} booking(s)`, bg: BLUE_L,   accent: BLUE   },
      { label: 'Monthly Expenses', value: php(monthlyExpenses), note: 'Sum of all costs',                              bg: RED_L,    accent: RED    },
      { label: 'Net Profit',       value: php(monthlyProfit),   note: 'Revenue − Expenses',                            bg: GREEN_L,  accent: GREEN  },
      { label: 'Profit Margin',    value: `${profitMargin}%`,   note: 'This month',                                    bg: PURPLE_L, accent: PURPLE },
    ];

    kpis.forEach(({ label, value, note, bg, accent }) => {
      const r = ws.addRow([label, value, note, '', '']);
      r.height = 24;
      ['A','B','C','D','E'].forEach(col => {
        const c = ws.getCell(`${col}${r.number}`);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.border = border(accent);
      });
      ws.getCell(`A${r.number}`).font = bodyFont(true, accent, 11);
      ws.getCell(`A${r.number}`).alignment = { vertical: 'middle', indent: 1 };
      ws.getCell(`B${r.number}`).font = bodyFont(true, DARK, 13);
      ws.getCell(`B${r.number}`).alignment = { horizontal: 'right', vertical: 'middle' };
      ws.getCell(`C${r.number}`).font = bodyFont(false, 'FF6B7280', 9);
      ws.getCell(`C${r.number}`).alignment = { vertical: 'middle' };
    });

    ws.addRow([]); // spacer

    // ── Event Type Breakdown ────────────────────────────────────────────────
    ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
    const etHeader = ws.getCell(`A${ws.rowCount}`);
    etHeader.value = 'REVENUE BY EVENT TYPE';
    etHeader.font = headerFont(WHITE, 11);
    etHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
    etHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    etHeader.border = border(AMBER);
    ws.getRow(ws.rowCount).height = 22;

    const etColHeaders = ws.addRow(['Event Type', 'Bookings', 'Revenue', 'Expenses', 'Profit']);
    etColHeaders.height = 20;
    ['A','B','C','D','E'].forEach((col, i) => {
      const c = ws.getCell(`${col}${etColHeaders.number}`);
      c.font = headerFont('FF374151', 10);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_H } };
      c.border = border(GRAY_B);
      c.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle', indent: i === 0 ? 1 : 0 };
    });

    if (eventTypeBreakdown.length === 0) {
      const noData = ws.addRow(['No data for this period', '', '', '', '']);
      ws.mergeCells(`A${noData.number}:E${noData.number}`);
      ws.getCell(`A${noData.number}`).font = bodyFont(false, 'FF9CA3AF', 10);
      ws.getCell(`A${noData.number}`).alignment = { horizontal: 'center' };
    } else {
      eventTypeBreakdown.forEach((item, i) => {
        const profit = item.revenue - item.expenses;
        const r = ws.addRow([item.type, item.count, item.revenue, item.expenses, profit]);
        r.height = 20;
        const bg = i % 2 === 0 ? WHITE : GRAY_H;
        ['A','B','C','D','E'].forEach(col => {
          const c = ws.getCell(`${col}${r.number}`);
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          c.border = border(GRAY_B);
        });
        ws.getCell(`A${r.number}`).font = bodyFont(true, DARK, 10);
        ws.getCell(`A${r.number}`).alignment = { indent: 1 };
        ws.getCell(`B${r.number}`).alignment = { horizontal: 'right' };
        ws.getCell(`C${r.number}`).numFmt = '₱#,##0.00';
        ws.getCell(`C${r.number}`).font = bodyFont(true, BLUE, 10);
        ws.getCell(`C${r.number}`).alignment = { horizontal: 'right' };
        ws.getCell(`D${r.number}`).numFmt = '₱#,##0.00';
        ws.getCell(`D${r.number}`).font = bodyFont(true, RED, 10);
        ws.getCell(`D${r.number}`).alignment = { horizontal: 'right' };
        ws.getCell(`E${r.number}`).numFmt = '₱#,##0.00';
        ws.getCell(`E${r.number}`).font = bodyFont(true, profit >= 0 ? GREEN : RED, 10);
        ws.getCell(`E${r.number}`).alignment = { horizontal: 'right' };
      });
    }

    ws.addRow([]); // spacer

    // ── Top Customers ───────────────────────────────────────────────────────
    ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
    const tcHeader = ws.getCell(`A${ws.rowCount}`);
    tcHeader.value = 'TOP CUSTOMERS';
    tcHeader.font = headerFont(WHITE, 11);
    tcHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
    tcHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    tcHeader.border = border(AMBER);
    ws.getRow(ws.rowCount).height = 22;

    const tcColHeaders = ws.addRow(['#', 'Customer Name', 'Bookings', 'Total Spent', '']);
    tcColHeaders.height = 20;
    ['A','B','C','D','E'].forEach((col, i) => {
      const c = ws.getCell(`${col}${tcColHeaders.number}`);
      c.font = headerFont('FF374151', 10);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_H } };
      c.border = border(GRAY_B);
      c.alignment = { horizontal: i <= 1 ? 'left' : 'right', vertical: 'middle', indent: i === 0 ? 1 : 0 };
    });

    if (topCustomers.length === 0) {
      const noData = ws.addRow(['No customer data for this period', '', '', '', '']);
      ws.mergeCells(`A${noData.number}:E${noData.number}`);
      ws.getCell(`A${noData.number}`).font = bodyFont(false, 'FF9CA3AF', 10);
      ws.getCell(`A${noData.number}`).alignment = { horizontal: 'center' };
    } else {
      topCustomers.forEach((c, i) => {
        const r = ws.addRow([i + 1, c.name, c.bookings, c.totalSpent, '']);
        r.height = 20;
        const bg = i % 2 === 0 ? WHITE : GRAY_H;
        ['A','B','C','D','E'].forEach(col => {
          const cell = ws.getCell(`${col}${r.number}`);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.border = border(GRAY_B);
        });
        ws.getCell(`A${r.number}`).font = bodyFont(true, AMBER, 10);
        ws.getCell(`A${r.number}`).alignment = { horizontal: 'center' };
        ws.getCell(`B${r.number}`).font = bodyFont(true, DARK, 10);
        ws.getCell(`B${r.number}`).alignment = { indent: 1 };
        ws.getCell(`C${r.number}`).alignment = { horizontal: 'right' };
        ws.getCell(`D${r.number}`).numFmt = '₱#,##0.00';
        ws.getCell(`D${r.number}`).font = bodyFont(true, AMBER, 10);
        ws.getCell(`D${r.number}`).alignment = { horizontal: 'right' };
      });
    }

    ws.addRow([]); // spacer

    // ── Summary ─────────────────────────────────────────────────────────────
    ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
    const sumHeader = ws.getCell(`A${ws.rowCount}`);
    sumHeader.value = 'SUMMARY';
    sumHeader.font = headerFont(WHITE, 11);
    sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER } };
    sumHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sumHeader.border = border(AMBER);
    ws.getRow(ws.rowCount).height = 22;

    const summaryRows = [
      ['Confirmed/Completed Bookings (Month)', monthlyConfirmedBookings.length],
      ['Pending Bookings (Month)', filteredBookings.filter(b => b.status === 'pending' && isWithinInterval(b.eventDate, { start: monthStart, end: monthEnd })).length],
      ['Cancelled Bookings (Month)', filteredBookings.filter(b => b.status === 'cancelled' && isWithinInterval(b.eventDate, { start: monthStart, end: monthEnd })).length],
      ['Avg Revenue / Booking', monthlyConfirmedBookings.length > 0 ? monthlyRevenue / monthlyConfirmedBookings.length : 0],
      ['Avg Expense / Booking', monthlyConfirmedBookings.length > 0 ? monthlyExpenses / monthlyConfirmedBookings.length : 0],
      ['All-Time Total Revenue', totalRevenue],
      ['All-Time Total Expenses', totalExpenses],
      ['All-Time Net Profit', totalProfit],
    ];

    summaryRows.forEach(([label, value], i) => {
      const r = ws.addRow([label, value, '', '', '']);
      r.height = 20;
      ws.mergeCells(`B${r.number}:E${r.number}`);
      const bg = i % 2 === 0 ? AMBER_L : WHITE;
      ['A','B','C','D','E'].forEach(col => {
        const c = ws.getCell(`${col}${r.number}`);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.border = border('FFFCD34D');
      });
      ws.getCell(`A${r.number}`).font = bodyFont(true, 'FF92400E', 10);
      ws.getCell(`A${r.number}`).alignment = { indent: 1, vertical: 'middle' };
      const valCell = ws.getCell(`B${r.number}`);
      valCell.font = bodyFont(true, DARK, 11);
      valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (typeof value === 'number' && (label as string).includes('Revenue') || (label as string).includes('Expense') || (label as string).includes('Profit') || (label as string).includes('Avg')) {
        valCell.numFmt = '₱#,##0.00';
      }
    });

    // ── Footer row ───────────────────────────────────────────────────────────
    ws.addRow([]);
    const footerRowNum = ws.rowCount + 1;
    ws.mergeCells(`A${footerRowNum}:E${footerRowNum}`);
    const footerCell = ws.getCell(`A${footerRowNum}`);
    footerCell.value = `Event Cash Management System  ·  Confidential Financial Report  ·  ${format(new Date(), 'MMMM dd, yyyy')}`;
    footerCell.font = bodyFont(false, 'FF9CA3AF', 9);
    footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    footerCell.font = { ...footerCell.font, color: { argb: 'FF9CA3AF' } };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(footerRowNum).height = 18;

    // ── Download ─────────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Income_vs_Expenses_${format(selectedMonth, 'yyyy-MM')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

            {/* Monthly Profit */}
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
                  <p className="text-sm text-gray-600">Total Profit</p>
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
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
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
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Expenses</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
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
                    <p className="text-gray-600 text-sm mb-2">Total Profit</p>
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
                {/* Total Income */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Income</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">{transactions.length} transactions</p>
                    </div>
                    <TrendingUp size={40} className="text-green-500" />
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Total Expenses</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">All expense items</p>
                    </div>
                    <TrendingDown size={40} className="text-red-500" />
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Net Profit</p>
                      <p className="text-3xl font-bold text-gray-900">₱{transactions.reduce((sum, t) => sum + (t.profit || 0), 0).toLocaleString()}.00</p>
                      <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
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
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Income</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Expenses</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
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
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Income</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Expenses</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Profit</th>
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
