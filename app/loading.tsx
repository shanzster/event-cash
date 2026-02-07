import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Animated Loader */}
        <div className="relative">
          <Loader2 className="h-16 w-16 text-[#D4AF37] animate-spin mx-auto" />
          <div className="absolute inset-0 blur-xl opacity-50">
            <Loader2 className="h-16 w-16 text-[#D4AF37] animate-spin mx-auto" />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Loading</h2>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    </div>
  );
}
