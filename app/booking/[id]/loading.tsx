import { Loader2 } from 'lucide-react';

export default function BookingDetailsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4"></div>
          <div className="h-4 w-32 bg-white/5 rounded animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <div className="space-y-6">
            {/* Customer Info Skeleton */}
            <div>
              <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Event Details Skeleton */}
            <div>
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Map Skeleton */}
            <div>
              <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="h-64 w-full bg-white/5 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="flex items-center justify-center mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
              <span>Loading booking details...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
