import { Loader2, Calendar } from 'lucide-react';

export default function NewBookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <div className="h-10 w-64 bg-white/10 rounded-lg animate-pulse mx-auto mb-4"></div>
          <div className="h-4 w-96 bg-white/5 rounded animate-pulse mx-auto"></div>
        </div>

        {/* Progress Steps Skeleton */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>
                {step < 3 && (
                  <div className="flex-1 h-1 bg-white/10 mx-2 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-12 w-full bg-white/5 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Loading State */}
            <div className="flex flex-col items-center justify-center py-8 mt-8 border-t border-white/10">
              <div className="relative mb-4">
                <Calendar className="h-12 w-12 text-[#D4AF37] animate-pulse" />
                <div className="absolute inset-0 blur-xl opacity-50">
                  <Calendar className="h-12 w-12 text-[#D4AF37]" />
                </div>
              </div>
              <p className="text-gray-400">Preparing booking form...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
