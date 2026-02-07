import { Loader2, Calendar } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-white/5 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <Calendar className="h-16 w-16 text-[#D4AF37] animate-pulse" />
            <div className="absolute inset-0 blur-xl opacity-50">
              <Calendar className="h-16 w-16 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Loading Your Bookings</h3>
            <p className="text-gray-400">Fetching your event details...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
