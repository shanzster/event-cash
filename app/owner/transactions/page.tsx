'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Download,
  Printer,
  Filter,
  Search,
  Calendar,
  User,
  Package,
  ChevronDown,
  X,
  FileText,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

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
  createdAt: any;
  eventDate: any;
  status: string;
  managerId: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { managerUser, isManager } = useManager();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!isManager || !managerUser) {
      router.push('/owner/login');
      return;
    }

    fetchTransactions();
  }, [isManager, managerUser]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('managerId', '==', managerUser?.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
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
            createdAt: transaction.createdAt,
            eventDate: transaction.eventDate,
            status: transaction.status || 'pending',
            managerId: transaction.managerId || '',
          });
        });
        setTransactions(txns.sort((a, b) => {
          const dateA = a.completedAt?.toDate?.() || new Date(a.completedAt);
          const dateB = b.completedAt?.toDate?.() || new Date(b.completedAt);
          return dateB.getTime() - dateA.getTime();
        }));
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.packageName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filters.status === 'all' || transaction.status === filters.status;

      const matchesPaymentMethod =
        filters.paymentMethod === 'all' ||
        transaction.status === filters.paymentMethod;

      let matchesDateRange = true;
      if (filters.dateFrom || filters.dateTo) {
        const txnDate = transaction.completedAt?.toDate?.() || new Date(transaction.completedAt);
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          matchesDateRange = matchesDateRange && txnDate >= fromDate;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          matchesDateRange = matchesDateRange && txnDate <= toDate;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentMethod &&
        matchesDateRange
      );
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filters]);

  const totalTransactions = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDownpayments = filteredTransactions.reduce(
    (sum, t) => sum + (t.downpayment || 0),
    0
  );
  const totalRemaining = filteredTransactions.reduce(
    (sum, t) => sum + (t.remainingBalance || 0),
    0
  );
  const totalProfit = filteredTransactions.reduce(
    (sum, t) => sum + (t.profit || 0),
    0
  );
  const totalExpenses = filteredTransactions.reduce(
    (sum, t) => sum + (t.totalExpenses || 0),
    0
  );

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=900');
    
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDownpayment = filteredTransactions.reduce((sum, t) => sum + (t.downpayment || 0), 0);
    const totalRemaining = filteredTransactions.reduce((sum, t) => sum + (t.remainingBalance || 0), 0);
    const totalExpenses = filteredTransactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);
    const totalProfit = filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    
    const tableHtml = `
      <html>
        <head>
          <title>Transactions Report</title>
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
            .status-cell {
              padding: 8px 12px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 11px;
              display: inline-block;
            }
            .status-completed {
              background-color: #DCFCE7;
              color: #166534;
            }
            .status-pending {
              background-color: #FEF3C7;
              color: #92400E;
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
            <h1>Transactions Report</h1>
            <p>Event Cash Management System</p>
          </div>
          
          <div class="info-bar">
            <div>Printed: <span>${format(new Date(), 'MMMM dd, yyyy')}</span></div>
            <div>Time: <span>${format(new Date(), 'HH:mm:ss')}</span></div>
            <div>Total Records: <span>${filteredTransactions.length}</span></div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Completed Date</th>
                <th>Customer</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Package</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Down Payment</th>
                <th class="text-right">Remaining</th>
                <th class="text-right">Expenses</th>
                <th class="text-right">Profit</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${format(t.completedAt?.toDate?.() || new Date(t.completedAt), 'MMM dd, yyyy')}</td>
                  <td><strong>${t.customerName}</strong></td>
                  <td>${t.eventType}</td>
                  <td>${format(t.eventDate?.toDate?.() || new Date(t.eventDate), 'MMM dd, yyyy')}</td>
                  <td>${t.packageName}</td>
                  <td class="text-right amount-cell">₱${(t.amount || 0).toLocaleString()}.00</td>
                  <td class="text-right amount-cell" style="color: #16A34A;">₱${(t.downpayment || 0).toLocaleString()}.00</td>
                  <td class="text-right amount-cell" style="color: #D97706;">₱${(t.remainingBalance || 0).toLocaleString()}.00</td>
                  <td class="text-right amount-cell" style="color: #DC2626;">₱${(t.totalExpenses || 0).toLocaleString()}.00</td>
                  <td class="text-right amount-cell" style="color: #0891B2;">₱${(t.profit || 0).toLocaleString()}.00</td>
                  <td class="text-center">
                    <span class="status-cell ${t.status === 'completed' ? 'status-completed' : 'status-pending'}">
                      ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Total Revenue:</span>
              <span class="summary-value">₱${totalAmount.toLocaleString()}.00</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Down Payments Received:</span>
              <span class="summary-value">₱${totalDownpayment.toLocaleString()}.00</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Remaining Balance:</span>
              <span class="summary-value">₱${totalRemaining.toLocaleString()}.00</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Expenses:</span>
              <span class="summary-value">₱${totalExpenses.toLocaleString()}.00</span>
            </div>
            <div class="summary-row summary-total">
              <span class="summary-label">Net Profit:</span>
              <span class="summary-value">₱${totalProfit.toLocaleString()}.00</span>
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

  const downloadCustomerReceipt = (transaction: Transaction) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // EventCash brand colors
      const primaryOrange = [255, 165, 0];
      const primaryGold = [212, 175, 55];
      const darkGray = [51, 51, 51];
      const lightGray = [245, 245, 245];

      // Header with gradient effect
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(0, 40, pageWidth, 5, 'F');

      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash', margin, 25);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Premium Catering Services', margin, 33);

      // Document title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL RECEIPT', pageWidth - margin, 25, { align: 'right' });

      yPosition = 55;

      // Receipt info section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, 3, 25, 'F');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Receipt Details', margin + 8, yPosition + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Receipt #: ${transaction.bookingId.substring(0, 12).toUpperCase()}`, margin + 8, yPosition + 13);
      doc.text(`Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 8, yPosition + 18);
      
      doc.text(`Event Date: ${format(transaction.eventDate?.toDate?.() || new Date(transaction.eventDate), 'MMMM dd, yyyy')}`, pageWidth - margin - 60, yPosition + 13);
      
      // PAID IN FULL stamp
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(pageWidth - margin - 35, yPosition + 16, 35, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID', pageWidth - margin - 17.5, yPosition + 20, { align: 'center' });

      yPosition += 30;

      // Customer Information
      const columnWidth = (contentWidth - 10) / 2;
      
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', margin + 5, yPosition + 5.5);
      
      yPosition += 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(transaction.customerName, margin + 20, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(transaction.customerEmail, margin + 20, yPosition);

      // Event Details (right column)
      const eventYStart = yPosition - 17;
      doc.setFillColor(primaryGold[0], primaryGold[1], primaryGold[2]);
      doc.rect(margin + columnWidth + 10, eventYStart, columnWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT DETAILS', margin + columnWidth + 15, eventYStart + 5.5);
      
      let eventY = eventYStart + 12;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Type:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      doc.text(transaction.eventType, margin + columnWidth + 30, eventY);
      eventY += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Package:', margin + columnWidth + 15, eventY);
      doc.setFont('helvetica', 'normal');
      const packageText = doc.splitTextToSize(transaction.packageName, columnWidth - 20);
      doc.text(packageText, margin + columnWidth + 30, eventY);

      yPosition += 10;

      // Pricing Section
      yPosition += 10;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT SUMMARY', margin + 5, yPosition + 4.5);
      
      yPosition += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Total Amount
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 2, contentWidth, 6, 'F');
      doc.text('Total Amount', margin + 5, yPosition);
      doc.text(`Php ${transaction.amount.toLocaleString()}.00`, pageWidth - margin - 5, yPosition, { align: 'right' });
      yPosition += 6;

      // Payment section with green background
      yPosition += 2;
      doc.setFillColor(34, 197, 94);
      doc.rect(margin, yPosition, contentWidth, 28, 'F');
      
      // PAID IN FULL stamp
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ PAID IN FULL', pageWidth / 2, yPosition + 8, { align: 'center' });
      
      yPosition += 14;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Down Payment: Php ${transaction.downpayment.toLocaleString()}.00`, margin + 8, yPosition);
      doc.text(`Final Payment: Php ${transaction.remainingBalance.toLocaleString()}.00`, pageWidth - margin - 8, yPosition, { align: 'right' });
      
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Total Paid: Php ${transaction.amount.toLocaleString()}.00`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 18;

      // Terms and Conditions
      yPosition += 3;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin + 5, yPosition + 4.5);
      
      yPosition += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
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
      
      doc.setTextColor(139, 69, 19);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      const noteText = doc.splitTextToSize(
        'Thank you for choosing EventCash Catering Services! This official receipt confirms your payment has been received in full. For any inquiries, please contact us at info@eventcash.com or call (123) 456-7890.',
        contentWidth - 15
      );
      doc.text(noteText, margin + 8, yPosition + 4);

      // Footer
      yPosition = pageHeight - 15;
      doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.rect(0, yPosition, pageWidth, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('EventCash Catering Services', pageWidth / 2, yPosition + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('info@eventcash.com | (123) 456-7890', pageWidth / 2, yPosition + 9, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, pageWidth / 2, yPosition + 12, { align: 'center' });

      // Save PDF
      const fileName = `EventCash_Official_Receipt_${transaction.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt PDF. Please try again.');
    }
  };

  const handleExport = () => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDownpayment = filteredTransactions.reduce((sum, t) => sum + (t.downpayment || 0), 0);
    const totalRemaining = filteredTransactions.reduce((sum, t) => sum + (t.remainingBalance || 0), 0);
    const totalExpenses = filteredTransactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);
    const totalProfit = filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);

    const csvContent = [
      ['Transactions Report'],
      ['Exported on', format(new Date(), 'MMMM dd, yyyy HH:mm:ss')],
      [],
      ['Completed Date', 'Customer', 'Email', 'Event Type', 'Event Date', 'Package', 'Amount', 'Down Payment', 'Remaining', 'Expenses', 'Profit', 'Status'],
      ...filteredTransactions.map((t) => [
        format(t.completedAt?.toDate?.() || new Date(t.completedAt), 'MMM dd, yyyy'),
        t.customerName,
        t.customerEmail,
        t.eventType,
        format(t.eventDate?.toDate?.() || new Date(t.eventDate), 'MMM dd, yyyy'),
        t.packageName,
        t.amount.toLocaleString(),
        (t.downpayment || 0).toLocaleString(),
        (t.remainingBalance || 0).toLocaleString(),
        (t.totalExpenses || 0).toLocaleString(),
        (t.profit || 0).toLocaleString(),
        t.status,
      ]),
      [],
      ['Summary', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total Revenue', '', '', '', '', '', totalAmount.toLocaleString(), '', '', '', '', ''],
      ['Total Down Payments', '', '', '', '', '', totalDownpayment.toLocaleString(), '', '', '', '', ''],
      ['Total Remaining', '', '', '', '', '', totalRemaining.toLocaleString(), '', '', '', '', ''],
      ['Total Expenses', '', '', '', '', '', totalExpenses.toLocaleString(), '', '', '', '', ''],
      ['Total Profit', '', '', '', '', '', totalProfit.toLocaleString(), '', '', '', '', ''],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const element = document.createElement('a');
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    element.href = URL.createObjectURL(file);
    element.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading transactions...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  if (!isManager) {
    return null;
  }

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                  Transactions
                </h1>
                <p className="text-gray-600 mt-2">View all paid bookings and payments</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <Download size={20} />
                  Export CSV
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Printer size={20} />
                  Print
                </motion.button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-4 mb-6"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer, event type, package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold"
              >
                <Filter size={20} />
                Filters
                <ChevronDown
                  size={16}
                  className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                />
              </motion.button>
            </div>

            {/* Filter Panel */}
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>

                  <div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() =>
                        setFilters({
                          status: 'all',
                          paymentMethod: 'all',
                          dateFrom: '',
                          dateTo: '',
                        })
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Reset Filters
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Transactions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none border border-gray-100"
          >
            {filteredTransactions.length === 0 ? (
              <div className="p-16 text-center">
                <FileText size={56} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No transactions found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary via-yellow-600 to-primary text-white print:bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-sm tracking-wider">Completed Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm tracking-wider">Event Type</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm tracking-wider">Event Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-sm tracking-wider">Package</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm tracking-wider">Down Payment</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm tracking-wider">Remaining</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm tracking-wider">Expenses</th>
                      <th className="px-6 py-4 text-right font-semibold text-sm tracking-wider">Profit</th>
                      <th className="px-6 py-4 text-center font-semibold text-sm tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center font-semibold text-sm tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        className="hover:bg-gray-50 transition-colors duration-200 print:hover:bg-white"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {format(
                            transaction.completedAt?.toDate?.() ||
                              new Date(transaction.completedAt),
                            'MMM dd, yyyy'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                          {transaction.customerName}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {transaction.eventType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {format(
                            transaction.eventDate?.toDate?.() ||
                              new Date(transaction.eventDate),
                            'MMM dd, yyyy'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                          {transaction.packageName}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="font-bold text-primary">₱{transaction.amount.toLocaleString()}.00</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="font-bold text-green-600">₱{(transaction.downpayment || 0).toLocaleString()}.00</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="font-bold text-orange-600">₱{(transaction.remainingBalance || 0).toLocaleString()}.00</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="font-bold text-red-600">₱{(transaction.totalExpenses || 0).toLocaleString()}.00</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="font-bold text-blue-600">₱{(transaction.profit || 0).toLocaleString()}.00</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold transition-all ${
                              transaction.status === 'completed'
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm'
                                : transaction.status === 'pending'
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 shadow-sm'
                                : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 shadow-sm'
                            }`}
                          >
                            {transaction.status === 'completed' && '✓ '}
                            {transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {transaction.status === 'completed' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => downloadCustomerReceipt(transaction)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                              title="Download Official Receipt"
                            >
                              <Receipt size={16} />
                              Receipt
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Footer */}
            {filteredTransactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-t border-gray-200 print:hidden"
              >
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
                    <p className="text-xl font-bold text-primary">
                      ₱{filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}.00
                    </p>
                  </div>
                  <div className="text-center border-l border-gray-300">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Down Payments</p>
                    <p className="text-xl font-bold text-green-600">
                      ₱{filteredTransactions.reduce((sum, t) => sum + (t.downpayment || 0), 0).toLocaleString()}.00
                    </p>
                  </div>
                  <div className="text-center border-l border-gray-300">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Remaining</p>
                    <p className="text-xl font-bold text-orange-600">
                      ₱{filteredTransactions.reduce((sum, t) => sum + (t.remainingBalance || 0), 0).toLocaleString()}.00
                    </p>
                  </div>
                  <div className="text-center border-l border-gray-300">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">
                      ₱{filteredTransactions.reduce((sum, t) => sum + (t.totalExpenses || 0), 0).toLocaleString()}.00
                    </p>
                  </div>
                  <div className="text-center border-l border-gray-300 pl-4">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Net Profit</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₱{filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0).toLocaleString()}.00
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Print Footer */}
          <div className="print-only mt-8 pt-4 border-t border-gray-400 text-xs text-gray-700">
            <p>
              Printed on: {format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}
            </p>
          </div>
        </div>
      </div>
    </ManagerSidebar>
  );
}
