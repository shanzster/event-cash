import { Loader2, LayoutDashboard } from 'lucide-react';

export default function ManagerLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Animated Icon */}
        <div className="relative">
          <LayoutDashboard className="h-16 w-16 text-[#D4AF37] animate-pulse mx-auto" />
          <div className="absolute inset-0 blur-xl opacity-50">
            <LayoutDashboard className="h-16 w-16 text-[#D4AF37] mx-auto" />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Loading Manager Dashboard</h2>
          <p className="text-gray-400">Please wait...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Authenticating...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
