'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Number with Glow Effect */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFD700] leading-none">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-50">
            <h1 className="text-[150px] md:text-[200px] font-bold text-[#D4AF37] leading-none">
              404
            </h1>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            Oops! The page you're looking for seems to have been moved, deleted, or doesn't exist.
          </p>
        </div>

        {/* Suggested Actions */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            What can you do?
          </h3>
          <ul className="text-left space-y-3 text-gray-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Check the URL for typos or mistakes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Return to the homepage and navigate from there</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Use the search function to find what you need</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Contact us if you believe this is an error</span>
            </li>
          </ul>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#C49F2F] text-black font-semibold"
              >
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-4">
          <p className="text-sm text-gray-400 mb-4">Quick Links:</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/services" 
              className="text-[#D4AF37] hover:text-[#FFD700] transition-colors text-sm"
            >
              Services
            </Link>
            <Link 
              href="/booking/new" 
              className="text-[#D4AF37] hover:text-[#FFD700] transition-colors text-sm"
            >
              Book Event
            </Link>
            <Link 
              href="/about" 
              className="text-[#D4AF37] hover:text-[#FFD700] transition-colors text-sm"
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="text-[#D4AF37] hover:text-[#FFD700] transition-colors text-sm"
            >
              <Phone className="inline h-3 w-3 mr-1" />
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
