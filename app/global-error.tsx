'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

// Global error boundary - catches errors in root layout
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error boundary caught:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* Error Icon */}
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
                Critical Error
              </h1>
              <p className="text-lg text-gray-300 max-w-md mx-auto">
                A critical error occurred while loading the application. Please try refreshing the page.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-left max-w-xl mx-auto">
                <h3 className="text-red-400 font-semibold mb-2">
                  Error Details (Development Only)
                </h3>
                <p className="text-sm text-gray-300 font-mono break-all mb-2">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-400">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Button */}
            <div>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <RefreshCcw className="h-5 w-5" />
                Try Again
              </button>
            </div>

            {/* Help Text */}
            <div className="pt-4 text-sm text-gray-400">
              <p>If this problem persists, please contact support.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
