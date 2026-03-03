'use client';

import { motion } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';

interface InvoiceReceiptProps {
  booking: {
    id: string;
    bookingDate: Date;
    eventDate: Date;
    customerInfo: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
    };
    eventInfo: {
      type: string;
      date: Date;
      time: string;
      venue: string;
      guests: number;
    };
    pricing: {
      basePackage: number;
      packageName?: string;
      addOns: Array<{
        name: string;
        price: number;
      }>;
      subtotal: number;
      total: number;
    };
  };
  onClose: () => void;
}

export default function InvoiceReceipt({ booking, onClose }: InvoiceReceiptProps) {
  const downpayment = booking.pricing.total * 0.5;
  const remainingBalance = booking.pricing.total * 0.5;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    alert('PDF download functionality to be implemented');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:relative print:inset-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none"
      >
        {/* Header Actions - Hidden on print */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900">Invoice (Downpayment)</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download size={20} className="text-gray-700" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer size={20} className="text-gray-700" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-12">
          {/* Logo and Company Info */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent mb-2">
                EventCash
              </h1>
              <p className="text-gray-600">Catering Services</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <p className="text-gray-600">Booking ID: {booking.id}</p>
              <p className="text-gray-600">Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-gray-900">{booking.customerInfo.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{booking.customerInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">{booking.customerInfo.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold text-gray-900">{booking.customerInfo.address}</p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Event Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Event Type</p>
                <p className="font-semibold text-gray-900">{booking.eventInfo.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Event Date</p>
                <p className="font-semibold text-gray-900">{new Date(booking.eventInfo.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold text-gray-900">{booking.eventInfo.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Venue</p>
                <p className="font-semibold text-gray-900">{booking.eventInfo.venue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Guests</p>
                <p className="font-semibold text-gray-900">{booking.eventInfo.guests}</p>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing Breakdown</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-gray-700">Item</th>
                  <th className="text-right py-3 text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-900">{booking.pricing.packageName || 'Base Package'}</td>
                  <td className="text-right py-3 text-gray-900">₱{booking.pricing.basePackage.toLocaleString()}.00</td>
                </tr>
                {booking.pricing.addOns.map((addon, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 text-gray-900">{addon.name}</td>
                    <td className="text-right py-3 text-gray-900">₱{addon.price.toLocaleString()}.00</td>
                  </tr>
                ))}
                <tr className="border-b-2 border-gray-300">
                  <td className="py-3 font-semibold text-gray-900">Subtotal</td>
                  <td className="text-right py-3 font-semibold text-gray-900">₱{booking.pricing.subtotal.toLocaleString()}.00</td>
                </tr>
                <tr className="border-b border-gray-200 bg-yellow-50">
                  <td className="py-3 font-bold text-gray-900">Downpayment (50%)</td>
                  <td className="text-right py-3 font-bold text-primary">₱{downpayment.toLocaleString()}.00</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 font-semibold text-gray-700">Remaining Balance (50%)</td>
                  <td className="text-right py-3 font-semibold text-gray-700">₱{remainingBalance.toLocaleString()}.00</td>
                </tr>
                <tr className="border-b-2 border-gray-300 bg-gray-100">
                  <td className="py-4 font-bold text-xl text-gray-900">Total Amount</td>
                  <td className="text-right py-4 font-bold text-xl text-gray-900">₱{booking.pricing.total.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Terms and Conditions</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Downpayment of 50% is required to confirm your booking.</li>
              <li>• Remaining balance of 50% is due on or before the event date.</li>
              <li>• Cancellations made 30 days before the event will receive a 50% refund of the downpayment.</li>
              <li>• Cancellations made less than 30 days before the event are non-refundable.</li>
              <li>• Menu changes must be finalized at least 14 days before the event.</li>
              <li>• Final guest count must be confirmed 7 days before the event.</li>
              <li>• Additional charges may apply for last-minute changes or additions.</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm border-t border-gray-200 pt-6">
            <p>Thank you for choosing EventCash Catering!</p>
            <p className="mt-2">For inquiries, please contact us at info@eventcash.com</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
