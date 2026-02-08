'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  History,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'New Booking', path: '/booking/new' },
    { icon: History, label: 'My Bookings', path: '/my-bookings' },
    { icon: User, label: 'My Profile', path: '/profile' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white/80 backdrop-blur-xl overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                  EventCash
                </h1>
                <p className="text-xs text-gray-600">Customer Portal</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-yellow-600/10 rounded-xl transition-all group"
              >
                <item.icon size={22} className="text-gray-600 group-hover:text-primary transition-colors" />
                <span className="font-semibold group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="font-semibold">Logout</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Desktop Header */}
      <div className="hidden lg:block lg:pl-72">
        <header className="sticky top-0 z-40 flex h-20 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            </div>
            
            {/* Profile Dropdown */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-600">Customer</p>
                  </div>
                  <ChevronDown size={18} className={`text-gray-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-primary/5 to-yellow-600/5">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            router.push('/profile');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <User size={18} />
                          <span className="font-medium">My Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <LogOut size={18} />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8 px-8">
          {children}
        </main>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-xl px-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
              EventCash
            </h1>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center"
          >
            <User size={20} className="text-white" />
          </motion.button>

          {/* Mobile Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-4 top-20 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-primary/5 to-yellow-600/5">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <User size={18} />
                    <span className="font-medium">My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Mobile Content */}
        <main className="pb-24 px-4 py-6">
          {children}
        </main>

        {/* Bottom Navigation Bar (Mobile/Tablet) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl">
          <div className="flex items-center justify-around px-4 py-3">
            {menuItems.map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigation(item.path)}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-primary transition-colors group"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-yellow-600/10 transition-all">
                  <item.icon size={24} className="group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs font-medium group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
