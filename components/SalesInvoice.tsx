'use client';

import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';

export type InvoiceType = 'downpayment' | 'final_payment' | 'full_payment';

export interface SalesInvoiceData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: Date;
  eventTime: string;
  packageName: string;
  guestCount?: number;
  location?: string;
  basePrice: number;
  foodAddonsPrice?: number;
  servicesAddonsPrice?: number;
  servicePrice?: number;
  priceAdjustment?: number;
  subtotal: number;
  tax?: number;
  otherCharges?: number;
  total: number;
  downpayment?: number;
  remainingBalance?: number;
  finalPayment?: number;
  status: string;
}

interface BusinessInfo {
  businessName: string;
  address: string;
  tinNumber: string;
  email?: string;
  phone?: string;
}

async function getNextInvoiceNumber(): Promise<string> {
  try {
    const counterRef = doc(db, 'settings', 'invoiceCounter');
    const counterSnap = await getDoc(counterRef);

    let nextNum = 1;
    if (counterSnap.exists()) {
      nextNum = (counterSnap.data().count || 0) + 1;
      await updateDoc(counterRef, { count: increment(1) });
    } else {
      await setDoc(counterRef, { count: 1 });
    }

    const dateStr = format(new Date(), 'yyyyMMdd');
    return `SI-${dateStr}-${String(nextNum).padStart(4, '0')}`;
  } catch {
    const dateStr = format(new Date(), 'yyyyMMdd');
    return `SI-${dateStr}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
  }
}

async function getBusinessInfo(): Promise<BusinessInfo> {
  try {
    const bizRef = doc(db, 'settings', 'business');
    const bizSnap = await getDoc(bizRef);
    if (bizSnap.exists()) {
      return bizSnap.data() as BusinessInfo;
    }
  } catch {}
  return {
    businessName: 'EventCash Catering Services',
    address: '123 Main Street, City, State 00000',
    tinNumber: '000-000-000-000',
    email: 'info@eventcash.com',
    phone: '(123) 456-7890',
  };
}

export async function generateSalesInvoice(
  invoiceType: InvoiceType,
  data: SalesInvoiceData
): Promise<void> {
  const invoiceNumber = await getNextInvoiceNumber();
  const bizInfo = await getBusinessInfo();

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const cw = pageWidth - 2 * margin;
  let y = margin;

  const orange: [number, number, number] = [255, 140, 0];
  const gold: [number, number, number] = [212, 175, 55];
  const dark: [number, number, number] = [40, 40, 40];
  const light: [number, number, number] = [248, 248, 248];
  const white: [number, number, number] = [255, 255, 255];

  const invoiceDescriptions: Record<InvoiceType, string> = {
    downpayment: 'PARTIAL PAYMENT / DOWNPAYMENT',
    final_payment: 'FINAL PAYMENT / SETTLEMENT OF BALANCE',
    full_payment: 'FULL PAYMENT',
  };

  const paymentStatuses: Record<InvoiceType, string> = {
    downpayment: 'DOWNPAYMENT',
    final_payment: 'FINAL PAYMENT',
    full_payment: 'PAID IN FULL',
  };

  // ── Header ──────────────────────────────────────────────────────────────
  pdf.setFillColor(...orange);
  pdf.rect(0, 0, pageWidth, 42, 'F');
  pdf.setFillColor(...gold);
  pdf.rect(0, 39, pageWidth, 3, 'F');

  pdf.setTextColor(...white);
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text(bizInfo.businessName, margin, 18);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(bizInfo.address, margin, 25);
  pdf.text(`TIN: ${bizInfo.tinNumber}`, margin, 30);
  if (bizInfo.phone) pdf.text(`Tel: ${bizInfo.phone}`, margin, 35);

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SALES INVOICE', pageWidth - margin, 18, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoiceDescriptions[invoiceType], pageWidth - margin, 26, { align: 'right' });

  y = 50;

  // ── Invoice Meta ─────────────────────────────────────────────────────────
  pdf.setFillColor(...light);
  pdf.rect(margin, y, cw, 20, 'F');
  pdf.setFillColor(...orange);
  pdf.rect(margin, y, 3, 20, 'F');

  pdf.setTextColor(...dark);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Invoice No: ${invoiceNumber}`, margin + 6, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date of Transaction: ${format(new Date(), 'MMMM dd, yyyy')}`, margin + 6, y + 11);
  pdf.text(`Event Date: ${format(data.eventDate, 'MMMM dd, yyyy')}`, margin + 6, y + 16);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Booking ID: ${data.bookingId.substring(0, 14).toUpperCase()}`, pageWidth - margin - 5, y + 6, { align: 'right' });

  // Payment status badge
  const statusColors: Record<InvoiceType, [number, number, number]> = {
    downpayment: [234, 179, 8],
    final_payment: [59, 130, 246],
    full_payment: [34, 197, 94],
  };
  pdf.setFillColor(...statusColors[invoiceType]);
  pdf.roundedRect(pageWidth - margin - 38, y + 10, 38, 7, 2, 2, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text(paymentStatuses[invoiceType], pageWidth - margin - 19, y + 15, { align: 'center' });

  y += 26;

  // ── Customer Info ─────────────────────────────────────────────────────────
  pdf.setFillColor(...orange);
  pdf.rect(margin, y, cw, 7, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CUSTOMER INFORMATION', margin + 4, y + 5);

  y += 10;
  pdf.setTextColor(...dark);
  pdf.setFontSize(8);

  const custRows = [
    ['Name:', data.customerName],
    ['Email:', data.customerEmail],
    ['Phone:', data.customerPhone],
  ];
  custRows.forEach(([label, val]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin + 4, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(val, margin + 22, y);
    y += 5;
  });

  y += 4;

  // ── Booking Details ───────────────────────────────────────────────────────
  pdf.setFillColor(...orange);
  pdf.rect(margin, y, cw, 7, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BOOKING DETAILS', margin + 4, y + 5);

  y += 10;
  pdf.setTextColor(...dark);
  pdf.setFontSize(8);

  const bookingRows = [
    ['Event Type:', data.eventType],
    ['Package:', data.packageName],
    ['Guests:', String(data.guestCount || 'N/A')],
    ['Time:', data.eventTime],
    ...(data.location ? [['Venue:', data.location]] : []),
  ];
  bookingRows.forEach(([label, val]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin + 4, y);
    pdf.setFont('helvetica', 'normal');
    const wrapped = pdf.splitTextToSize(val, cw - 30);
    pdf.text(wrapped, margin + 30, y);
    y += wrapped.length * 4.5;
  });

  y += 4;

  // ── Pricing Breakdown ─────────────────────────────────────────────────────
  pdf.setFillColor(...orange);
  pdf.rect(margin, y, cw, 7, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRICING BREAKDOWN', margin + 4, y + 5);

  y += 10;
  pdf.setTextColor(...dark);
  pdf.setFontSize(8);

  const priceRows: [string, number][] = [
    ['Base Package', data.basePrice],
  ];
  if (data.foodAddonsPrice) priceRows.push(['Food Add-ons', data.foodAddonsPrice]);
  if (data.servicesAddonsPrice) priceRows.push(['Service Add-ons', data.servicesAddonsPrice]);
  if (data.servicePrice) priceRows.push(['Service Fee', data.servicePrice]);
  if (data.priceAdjustment && data.priceAdjustment !== 0) {
    priceRows.push([data.priceAdjustment > 0 ? 'Additional Charges' : 'Discount', data.priceAdjustment]);
  }

  priceRows.forEach(([label, val], i) => {
    if (i % 2 === 0) { pdf.setFillColor(...light); pdf.rect(margin, y - 2, cw, 5.5, 'F'); }
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...dark);
    pdf.text(label, margin + 4, y);
    if (val < 0) pdf.setTextColor(34, 197, 94);
    pdf.text(`Php ${Math.abs(val).toLocaleString()}.00${val < 0 ? ' (-)' : ''}`, pageWidth - margin - 3, y, { align: 'right' });
    pdf.setTextColor(...dark);
    y += 5.5;
  });

  // Subtotal
  y += 1;
  pdf.setFillColor(230, 230, 230);
  pdf.rect(margin, y - 2, cw, 6, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Subtotal', margin + 4, y + 2);
  pdf.text(`Php ${data.subtotal.toLocaleString()}.00`, pageWidth - margin - 3, y + 2, { align: 'right' });
  y += 8;

  if (data.tax) {
    pdf.setFont('helvetica', 'normal');
    pdf.text('Tax (VAT 12%)', margin + 4, y);
    pdf.text(`Php ${data.tax.toLocaleString()}.00`, pageWidth - margin - 3, y, { align: 'right' });
    y += 5.5;
  }
  if (data.otherCharges) {
    pdf.setFont('helvetica', 'normal');
    pdf.text('Other Charges', margin + 4, y);
    pdf.text(`Php ${data.otherCharges.toLocaleString()}.00`, pageWidth - margin - 3, y, { align: 'right' });
    y += 5.5;
  }

  // Total
  y += 1;
  pdf.setFillColor(...orange);
  pdf.rect(margin, y - 2, cw, 9, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', margin + 4, y + 4);
  pdf.text(`Php ${data.total.toLocaleString()}.00`, pageWidth - margin - 3, y + 4, { align: 'right' });
  pdf.setTextColor(...dark);
  pdf.setFontSize(8);
  y += 13;

  // ── Payment Status Section ────────────────────────────────────────────────
  pdf.setFillColor(...gold);
  pdf.rect(margin, y, cw, 7, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT STATUS', margin + 4, y + 5);
  y += 10;

  pdf.setTextColor(...dark);
  pdf.setFontSize(8);

  if (invoiceType === 'downpayment') {
    const dp = data.downpayment || 0;
    const rb = data.total - dp;
    pdf.setFillColor(...light);
    pdf.rect(margin, y - 2, cw, 14, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Downpayment (Paid):', margin + 4, y + 2);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`Php ${dp.toLocaleString()}.00`, pageWidth - margin - 3, y + 2, { align: 'right' });
    pdf.setTextColor(...dark);
    pdf.text('Remaining Balance:', margin + 4, y + 8);
    pdf.setTextColor(220, 38, 38);
    pdf.text(`Php ${rb.toLocaleString()}.00`, pageWidth - margin - 3, y + 8, { align: 'right' });
    pdf.setTextColor(...dark);
    y += 18;
  } else if (invoiceType === 'final_payment') {
    const dp = data.downpayment || 0;
    const fp = data.finalPayment || data.remainingBalance || 0;
    pdf.setFillColor(...light);
    pdf.rect(margin, y - 2, cw, 14, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Downpayment (Previously Paid):', margin + 4, y + 2);
    pdf.text(`Php ${dp.toLocaleString()}.00`, pageWidth - margin - 3, y + 2, { align: 'right' });
    pdf.text('Remaining Balance Paid:', margin + 4, y + 8);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`Php ${fp.toLocaleString()}.00`, pageWidth - margin - 3, y + 8, { align: 'right' });
    pdf.setTextColor(...dark);
    y += 18;
  } else {
    // full payment
    pdf.setFillColor(34, 197, 94);
    pdf.rect(margin, y - 2, cw, 9, 'F');
    pdf.setTextColor(...white);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('✓  PAID IN FULL', pageWidth / 2, y + 4, { align: 'center' });
    pdf.setTextColor(...dark);
    pdf.setFontSize(8);
    y += 13;
  }

  // ── Terms & Conditions ────────────────────────────────────────────────────
  if (y > pageHeight - 70) { pdf.addPage(); y = margin; }

  pdf.setFillColor(...orange);
  pdf.rect(margin, y, cw, 7, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TERMS AND CONDITIONS', margin + 4, y + 5);
  y += 10;

  pdf.setTextColor(...dark);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');

  const terms = [
    '1. A downpayment of 50% is required to confirm your booking.',
    '2. Remaining balance of 50% is due on or before the event date.',
    '3. Cancellations made 30+ days before the event receive a 50% refund of the downpayment.',
    '4. Cancellations made less than 30 days before the event are non-refundable.',
    '5. Menu changes must be finalized at least 14 days before the event.',
    '6. Final guest count must be confirmed 7 days before the event.',
    '7. This Sales Invoice is issued in compliance with BIR regulations.',
  ];
  terms.forEach((t) => {
    const lines = pdf.splitTextToSize(t, cw - 8);
    pdf.text(lines, margin + 4, y);
    y += lines.length * 4.5;
  });

  // ── Thank You (final/full payment only) ──────────────────────────────────
  if (invoiceType !== 'downpayment') {
    y += 4;
    pdf.setFillColor(255, 248, 220);
    pdf.rect(margin, y, cw, 18, 'F');
    pdf.setFillColor(...orange);
    pdf.rect(margin, y, 3, 18, 'F');
    pdf.setTextColor(139, 69, 19);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Thank You!', margin + 6, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    const thankYou = pdf.splitTextToSize(
      'Thank you for choosing our catering services! We are grateful for the opportunity to be part of your special event. We hope to serve you again in the future.',
      cw - 12
    );
    pdf.text(thankYou, margin + 6, y + 11);
    y += 22;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 14;
  pdf.setFillColor(...orange);
  pdf.rect(0, footerY, pageWidth, 14, 'F');
  pdf.setTextColor(...white);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(bizInfo.businessName, pageWidth / 2, footerY + 5, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(
    `${bizInfo.email || ''} | ${bizInfo.phone || ''} | Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`,
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );

  const typeLabel = invoiceType === 'downpayment' ? 'Downpayment' : invoiceType === 'final_payment' ? 'FinalPayment' : 'FullPayment';
  pdf.save(`SalesInvoice_${typeLabel}_${data.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
