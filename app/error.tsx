'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }
    
    // TODO: Log error to error reporting service (e.g., Sentry, LogRocket)
    // logErrorToService(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon with Animation */}
        <div className="relative inline-block">
          <div className="relative z-10">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-16 w-16 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 blur-3xl opacity-50">
            <div className="w-32 h-32 mx-auto bg-red-500 rounded-full"></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            Oops! Something went wrong
          </h1>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            We're sorry, but something unexpected happened. Don't worry, our team has been notified.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-left">
            <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Details (Development Only)
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-300 font-mono break-all">
                <strong>Message:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="text-sm text-gray-300 font-mono">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {error.stack && (
                <details className="mt-4">
                  <summary className="text-sm text-red-400 cursor-pointer hover:text-red-300">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-48 bg-black/30 p-4 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            What can you do?
          </h3>
          <ul className="text-left space-y-3 text-gray-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Try refreshing the page or clicking "Try Again" below</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Return to the homepage and start fresh</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>Clear your browser cache and cookies</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span>If the problem persists, please contact our support team</span>
            </li>
          </ul>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={reset}
              className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#C49F2F] text-black font-semibold"
            >
              <RefreshCcw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            <Link href="/">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
              >
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>

        {/* Support Contact */}
        <div className="pt-4">
          <p className="text-sm text-gray-400 mb-3">Need immediate assistance?</p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#FFD700] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </Link>
        </div>

        {/* Error ID for Reference */}
        {error.digest && (
          <div className="pt-2">
            <p className="text-xs text-gray-500">
              Error ID: <code className="bg-white/5 px-2 py-1 rounded">{error.digest}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
