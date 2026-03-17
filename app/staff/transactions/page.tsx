'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, Printer, Filter, Search, ChevronDown, FileText, TrendingUp, Receipt } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StaffSidebar from '@/components/StaffSidebar';
import { format } from 'date-fns';

interface Transaction {
  id: string; bookingId: string; customerName: string; customerEmail: string;
  eventType: string; packageName: string; amount: number; downpayment: number;
  remainingBalance: number; totalExpenses: number; profit: number;
  completedAt: any; createdAt: any; eventDate: any; status: string;
}

export default function StaffTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', dateFrom: '', dateTo: '' });

  useEffect(() => {
    const staffUser = localStorage.getItem('staffUser');
    if (!staffUser) { router.push('/staff/login'); return; }
    const unsub = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const txns: Transaction[] = snapshot.docs.map((doc) => {
        const t = doc.data();
        return { id: doc.id, bookingId: t.bookingId || '', customerName: t.customerName || 'Unknown',
          customerEmail: t.customerEmail || '', eventType: t.eventType || 'N/A', packageName: t.packageName || 'N/A',
          amount: t.amount || 0, downpayment: t.downpayment || 0, remainingBalance: t.remainingBalance || 0,
          totalExpenses: t.totalExpenses || 0, profit: t.profit || 0, completedAt: t.completedAt,
          createdAt: t.createdAt, eventDate: t.eventDate, status: t.status || 'pending' };
      }).sort((a, b) => {
        const dA = a.completedAt?.toDate?.() || new Date(a.completedAt);
        const dB = b.completedAt?.toDate?.() || new Date(b.completedAt);
        return dB.getTime() - dA.getTime();
      });
      setTransactions(txns);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    setFilteredTransactions(transactions.filter((t) => {
      const matchSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.packageName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filters.status === 'all' || t.status === filters.status;
      let matchDate = true;
      if (filters.dateFrom || filters.dateTo) {
        const d = t.completedAt?.toDate?.() || new Date(t.completedAt);
        if (filters.dateFrom) matchDate = matchDate && d >= new Date(filters.dateFrom);
        if (filters.dateTo) matchDate = matchDate && d <= new Date(filters.dateTo);
      }
      return matchSearch && matchStatus && matchDate;
    }));
  }, [transactions, searchTerm, filters]);

  const totalAmount = filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0);
  const totalDownpayments = filteredTransactions.reduce((s, t) => s + (t.downpayment || 0), 0);
  const totalRemaining = filteredTransactions.reduce((s, t) => s + (t.remainingBalance || 0), 0);
  const totalExpenses = filteredTransactions.reduce((s, t) => s + (t.totalExpenses || 0), 0);
  const totalProfit = filteredTransactions.reduce((s, t) => s + (t.profit || 0), 0);

  const handlePrint = () => {
    const pw = window.open('', '', 'height=600,width=900');
    if (!pw) return;
    pw.document.write(`<html><head><title>Transactions Report</title>
    <style>body{font-family:sans-serif;padding:40px}table{width:100%;border-collapse:collapse}
    th{background:#F59E0B;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #eee}
    .summary{margin-top:30px;padding:20px;background:#f3f4f6;border-left:4px solid #F59E0B}
    .sr{display:flex;justify-content:space-between;margin-bottom:8px}</style></head><body>
    <h1 style="border-bottom:3px solid #F59E0B;padding-bottom:10px">Transactions Report</h1>
    <p>Printed: ${format(new Date(), 'MMMM dd, yyyy HH:mm')} &nbsp;|&nbsp; Records: ${filteredTransactions.length}</p>
    <table><thead><tr><th>Completed</th><th>Customer</th><th>Event</th><th>Event Date</th><th>Package</th>
    <th>Amount</th><th>Down Payment</th><th>Remaining</th><th>Expenses</th><th>Profit</th><th>Status</th></tr></thead>
    <tbody>${filteredTransactions.map(t => `<tr>
      <td>${format(t.completedAt?.toDate?.() || new Date(t.completedAt), 'MMM dd, yyyy')}</td>
      <td>${t.customerName}</td><td>${t.eventType}</td>
      <td>${format(t.eventDate?.toDate?.() || new Date(t.eventDate), 'MMM dd, yyyy')}</td>
      <td>${t.packageName}</td><td>₱${(t.amount||0).toLocaleString()}.00</td>
      <td>₱${(t.downpayment||0).toLocaleString()}.00</td><td>₱${(t.remainingBalance||0).toLocaleString()}.00</td>
      <td>₱${(t.totalExpenses||0).toLocaleString()}.00</td><td>₱${(t.profit||0).toLocaleString()}.00</td>
      <td>${t.status}</td></tr>`).join('')}</tbody></table>
    <div class="summary">
      <div class="sr"><span>Total Revenue:</span><span>₱${totalAmount.toLocaleString()}.00</span></div>
      <div class="sr"><span>Down Payments:</span><span>₱${totalDownpayments.toLocaleString()}.00</span></div>
      <div class="sr"><span>Remaining:</span><span>₱${totalRemaining.toLocaleString()}.00</span></div>
      <div class="sr"><span>Expenses:</span><span>₱${totalExpenses.toLocaleString()}.00</span></div>
      <div class="sr" style="border-top:2px solid #ccc;padding-top:8px;font-weight:bold">
        <span>Net Profit:</span><span>₱${totalProfit.toLocaleString()}.00</span></div>
    </div></body></html>`);
    pw.document.close(); pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
  };

  const handleExport = () => {
    const rows = [
      ['Completed Date','Customer','Email','Event Type','Event Date','Package','Amount','Down Payment','Remaining','Expenses','Profit','Status'],
      ...filteredTransactions.map(t => [
        format(t.completedAt?.toDate?.() || new Date(t.completedAt), 'MMM dd, yyyy'),
        t.customerName, t.customerEmail, t.eventType,
        format(t.eventDate?.toDate?.() || new Date(t.eventDate), 'MMM dd, yyyy'),
        t.packageName, t.amount, t.downpayment||0, t.remainingBalance||0, t.totalExpenses||0, t.profit||0, t.status,
      ]),
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadCustomerReceipt = (transaction: Transaction) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;
      const primaryOrange = [255, 165, 0];
      const primaryGold = [212, 175, 55];
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

      // Header
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(0, 40, pageWidth, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32); doc.setFont('helvetica', 'bold');
      doc.text('EventCash', margin, 25);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text('Premium Catering Services', margin, 33);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL RECEIPT', pageWidth - margin, 25, { align: 'right' });

      yPosition = 55;

      // Receipt info section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 25, 'F');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Receipt Details', margin + 8, yPosition + 7);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(`Receipt #: ${transaction.bookingId.substring(0, 12).toUpperCase()}`, margin + 8, yPosition + 13);
      doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 8, yPosition + 18);
      doc.text(`Event Date: ${format(transaction.eventDate?.toDate?.() || new Date(transaction.eventDate), 'MMMM dd, yyyy')}`, pageWidth - margin - 60, yPosition + 13);
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(pageWidth - margin - 35, yPosition + 16, 35, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text('PAID', pageWidth - margin - 17.5, yPosition + 20, { align: 'center' });

      yPosition += 30;

      // Customer Information + Event Details (two columns)
      const columnWidth = (contentWidth - 10) / 2;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', margin + 5, yPosition + 5.5);
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setFont('helvetica', 'bold'); doc.text('Name:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal'); doc.text(transaction.customerName, margin + 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Email:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal'); doc.text(transaction.customerEmail, margin + 20, yPosition);

      const eventYStart = yPosition - 17;
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin + columnWidth + 10, eventYStart, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('EVENT DETAILS', margin + columnWidth + 15, eventYStart + 5.5);
      let eventY = eventYStart + 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setFont('helvetica', 'bold'); doc.text('Type:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal'); doc.text(transaction.eventType, margin + columnWidth + 30, eventY);
      eventY += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Package:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const packageText = doc.splitTextToSize(transaction.packageName, columnWidth - 20);
      doc.text(packageText, margin + columnWidth + 30, eventY);

      yPosition += 20;

      // Payment Summary
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT SUMMARY', margin + 5, yPosition + 4.5);
      yPosition += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 2, contentWidth, 6, 'F');
      doc.text('Total Amount', margin + 5, yPosition);
      doc.text(`Php ${transaction.amount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition, { align: 'right' });
      yPosition += 8;
      doc.setFillColor(34, 197, 94);
      doc.rect(margin, yPosition, contentWidth, 28, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('✓ PAID IN FULL', pageWidth / 2, yPosition + 8, { align: 'center' });
      yPosition += 14;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Down Payment: Php ${transaction.downpayment.toLocaleString()}.00`, margin + 8, yPosition);
      doc.text(`Final Payment: Php ${transaction.remainingBalance.toLocaleString()}.00`, pageWidth - margin - 8, yPosition, { align: 'right' });
      yPosition += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(`Total Paid: Php ${transaction.amount.toLocaleString()}.00`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 18;

      // Terms and Conditions
      yPosition += 3;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin + 5, yPosition + 4.5);
      yPosition += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      const terms = [
        '1. Payment has been received in full for this event.',
        '2. This official receipt serves as proof of complete payment.',
        '3. Thank you for choosing EventCash Catering Services.'
      ];
      terms.forEach((term) => {
        const termLines = doc.splitTextToSize(term, contentWidth - 10);
        doc.text(termLines, margin + 5, yPosition);
        yPosition += termLines.length * 4;
      });

      // Footer note
      yPosition += 3;
      doc.setFillColor(255, 248, 220);
      doc.rect(margin, yPosition, contentWidth, 15, 'F');
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 15, 'F');
      doc.setTextColor(139, 69, 19); doc.setFontSize(7); doc.setFont('helvetica', 'italic');
      const noteText = doc.splitTextToSize(
        'Thank you for choosing EventCash Catering Services! This official receipt confirms your payment has been received in full. For any inquiries, please contact us at info@eventcash.com or call (123) 456-7890.',
        contentWidth - 15
      );
      doc.text(noteText, margin + 8, yPosition + 4);

      // Footer
      yPosition = pageHeight - 15;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text('info@eventcash.com | (123) 456-7890', pageWidth / 2, yPosition + 9, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPosition + 12, { align: 'center' });

      const fileName = `EventCash_Official_Receipt_${transaction.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt PDF. Please try again.');
    }
  };

  if (loading) return (
    <StaffSidebar>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading transactions...</p>
        </div>
      </div>
    </StaffSidebar>
  );

  return (
    <StaffSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">Transactions</h1>
                <p className="text-gray-600 mt-2">View all paid bookings and payments</p>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                  <Download size={20} /> Export CSV
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                  <Printer size={20} /> Print
                </motion.button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Transactions', value: filteredTransactions.length, color: 'text-gray-900', icon: <FileText size={32} className="text-primary" /> },
                { label: 'Total Revenue', value: `₱${totalAmount.toLocaleString()}.00`, color: 'text-blue-600', icon: <TrendingUp size={32} className="text-blue-500" /> },
                { label: 'Total Expenses', value: `₱${totalExpenses.toLocaleString()}.00`, color: 'text-red-600', icon: <TrendingUp size={32} className="text-red-500" /> },
                { label: 'Total Profit', value: `₱${totalProfit.toLocaleString()}.00`, color: 'text-green-600', icon: <TrendingUp size={32} className="text-green-500" /> },
              ].map((m, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">{m.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                    </div>
                    {m.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input type="text" placeholder="Search customer, event type, package..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold">
                <Filter size={20} /> Filters
                <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>
            {filterOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black">
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                    <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                    <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '' })}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                      Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
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
                      <th className="px-6 py-4 text-left font-semibold text-sm">Event Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm">Package</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm">Amount</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm">Down Payment</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm">Remaining</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm">Expenses</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm">Profit</th>
                      <th className="px-6 py-4 text-center font-semibold text-sm">Status</th>
                      <th className="px-3 py-4 text-center font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((t, i) => (
                      <motion.tr key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {t.completedAt ? format(t.completedAt?.toDate?.() || new Date(t.completedAt), 'MMM dd, yyyy') : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{t.customerName}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{t.eventType}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {t.eventDate ? format(t.eventDate?.toDate?.() || new Date(t.eventDate), 'MMM dd, yyyy') : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{t.packageName}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-primary">₱{t.amount.toLocaleString()}.00</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600">₱{(t.downpayment||0).toLocaleString()}.00</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-orange-600">₱{(t.remainingBalance||0).toLocaleString()}.00</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600">₱{(t.totalExpenses||0).toLocaleString()}.00</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">₱{(t.profit||0).toLocaleString()}.00</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {t.status === 'completed' && '✓ '}{t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => downloadCustomerReceipt(t)}
                            title="Print Official Receipt"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-semibold shadow hover:shadow-lg whitespace-nowrap">
                            <Receipt size={14} /> Official Receipt
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredTransactions.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-t border-gray-200">
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: 'Total Revenue', value: totalAmount, color: 'text-primary' },
                    { label: 'Down Payments', value: totalDownpayments, color: 'text-green-600' },
                    { label: 'Remaining', value: totalRemaining, color: 'text-orange-600' },
                    { label: 'Total Expenses', value: totalExpenses, color: 'text-red-600' },
                    { label: 'Net Profit', value: totalProfit, color: 'text-blue-600' },
                  ].map((s, i) => (
                    <div key={i} className={`text-center ${i > 0 ? 'border-l border-gray-300' : ''}`}>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>₱{s.value.toLocaleString()}.00</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </StaffSidebar>
  );
}
