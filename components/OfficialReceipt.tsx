'use client';

import { motion } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';

interface OfficialReceiptProps {
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
    payment: {
      downpayment: {
        amount: number;
        paidDate: Date;
      };
      remainingBalance: {
        amount: number;
        paidDate: Date;
        paymentMethod: string;
      };
    };
  };
  onClose: () => void;
}

export default function OfficialReceipt({ booking, onClose }: OfficialReceiptProps) {
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
          <h2 className="text-2xl font-bold text-gray-900">Official Receipt</h2>
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

        {/* Receipt Content */}
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
              <h2 className="text-3xl font-bold text-green-600 mb-2">OFFICIAL RECEIPT</h2>
              <p className="text-gray-600">Booking ID: {booking.id}</p>
              <p className="text-gray-600">Date: {new Date(booking.payment.remainingBalance.paidDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Paid Stamp */}
          <div className="flex justify-center mb-6">
            <div className="inline-block px-8 py-3 border-4 border-green-600 rounded-lg transform -rotate-12">
              <p className="text-4xl font-bold text-green-600">PAID IN FULL</p>
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
                <tr className="border-b border-gray-200 bg-green-50">
                  <td className="py-3 text-gray-700">
                    Downpayment Paid
                    <span className="block text-xs text-gray-500">
                      {new Date(booking.payment.downpayment.paidDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="text-right py-3 text-green-600 font-semibold">₱{booking.payment.downpayment.amount.toLocaleString()}.00</td>
                </tr>
                <tr className="border-b border-gray-200 bg-green-50">
                  <td className="py-3 text-gray-700">
                    Remaining Balance Paid
                    <span className="block text-xs text-gray-500">
                      {new Date(booking.payment.remainingBalance.paidDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="text-right py-3 text-green-600 font-semibold">₱{booking.payment.remainingBalance.amount.toLocaleString()}.00</td>
                </tr>
                <tr className="border-b-2 border-gray-300 bg-green-100">
                  <td className="py-4 font-bold text-xl text-gray-900">Total Amount Paid</td>
                  <td className="text-right py-4 font-bold text-xl text-green-600">₱{booking.pricing.total.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Method */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Method</h3>
            <p className="text-gray-700 font-semibold">{booking.payment.remainingBalance.paymentMethod}</p>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Terms and Conditions</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• A downpayment of 50% was required to confirm this booking.</li>
              <li>• The remaining balance of 50% has been paid in full.</li>
              <li>• This receipt serves as proof of full payment for the catering services.</li>
              <li>• All services and items listed have been agreed upon and confirmed.</li>
              <li>• Any additional services or changes requested on the event day may incur extra charges.</li>
              <li>• EventCash Catering is not liable for circumstances beyond our control (force majeure).</li>
              <li>• This receipt is valid for tax and accounting purposes.</li>
            </ul>
          </div>

          {/* Thank You Note */}
          <div className="mb-8 p-8 bg-gradient-to-br from-primary/10 to-yellow-600/10 rounded-lg border-2 border-primary/30 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h3>
            <p className="text-gray-700 leading-relaxed">
              Thank you for your trust and support! We're delighted to have partnered with you on this event, 
              and we're grateful for the opportunity to contribute to its success.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm border-t border-gray-200 pt-6">
            <p>EventCash Catering Services</p>
            <p className="mt-2">For inquiries, please contact us at info@eventcash.com</p>
            <p className="mt-1 text-xs">This is an official receipt for your records.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
