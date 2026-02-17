'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useManager } from '@/contexts/ManagerContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Package,
  AlertCircle,
  Settings,
  Lock,
  BookOpen,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { useState as useStateFirebase } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ManagerSidebarProps {
  children?: React.ReactNode;
}

export default function ManagerSidebar({ children }: ManagerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { managerUser, managerData, managerLogout } = useManager();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: managerData?.displayName || '',
    phone: managerData?.phone || '',
    address: managerData?.address || '',
    city: managerData?.city || '',
    state: managerData?.state || '',
    zipCode: managerData?.zipCode || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/owner/dashboard' },
    { icon: Package, label: 'Bookings', path: '/owner/bookings' },
    { icon: Calendar, label: 'Upcoming Events', path: '/owner/upcoming-events' },
    { icon: Users, label: 'Clients', path: '/owner/users' },
    { icon: Briefcase, label: 'Financial Staff', path: '/owner/staff' },
    { icon: Sparkles, label: 'Packages', path: '/owner/packages' },
    { icon: Calendar, label: 'Calendar', path: '/owner/calendar' },
    { icon: BarChart3, label: 'Reports', path: '/owner/reports' },
    { icon: TrendingUp, label: 'Transactions', path: '/owner/transactions' },
    { icon: BookOpen, label: 'Accounting', path: '/owner/accounting' },
    { icon: Settings, label: 'Website CMS', path: '/owner/cms' },
  ];

  const handleLogout = async () => {
    try {
      await managerLogout();
      // Redirect to owner login page instead of homepage
      router.push('/owner/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleUpdateProfile = async () => {
    if (!managerUser) return;

    try {
      const managerRef = doc(db, 'managers', managerUser.uid);
      await updateDoc(managerRef, {
        displayName: profileForm.displayName,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        zipCode: profileForm.zipCode,
      });

      setShowProfileModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      if (!managerUser) return;
      const managerRef = doc(db, 'managers', managerUser.uid);
      await updateDoc(managerRef, {
        password: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordModal(false);
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  const isActive = (path: string) => {
    // Exact match for most routes
    if (pathname === path) return true;
    
    // Handle nested routes - if current path starts with the menu path (and has more segments)
    // This handles cases like /owner/upcoming-events/[id], /owner/bookings/[id], etc.
    if (pathname.startsWith(path + '/')) {
      return true;
    }
    
    return false;
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
              onClick={() => router.push('/owner/dashboard')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                  EventCash
                </h1>
                <p className="text-xs text-gray-600">Owner Portal</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative ${
                    active
                      ? 'bg-gradient-to-r from-primary to-yellow-600 shadow-lg shadow-primary/30'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-primary/10 hover:to-yellow-600/10'
                  }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={`${
                      active
                        ? 'text-white'
                        : 'text-gray-600 group-hover:text-primary'
                    } transition-colors`}
                  />
                  <span
                    className={`font-semibold ${
                      active
                        ? 'text-white'
                        : 'text-gray-700 group-hover:text-primary'
                    } transition-colors`}
                  >
                    {item.label}
                  </span>
                  {/* Active glow effect */}
                  {active && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-yellow-600/20 rounded-xl blur-xl -z-10"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {managerData?.displayName || 'Owner'}
                </p>
                <p className="text-xs text-gray-600 truncate">{managerData?.email || 'owner@eventcash.com'}</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Owner Dashboard</h2>
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
                      {managerData?.displayName || 'Owner'}
                    </p>
                    <p className="text-xs text-gray-600">Owner</p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-600 transition-transform ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
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
                          {managerData?.displayName || 'Owner'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{managerData?.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <Settings size={18} />
                          <span className="font-medium">Profile Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            setShowPasswordModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <Lock size={18} />
                          <span className="font-medium">Change Password</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            router.push('/owner/dashboard');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <LayoutDashboard size={18} />
                          <span className="font-medium">Dashboard</span>
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
            onClick={() => router.push('/owner/dashboard')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
              EventCash
            </h1>
          </motion.div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-600 rounded-full flex items-center justify-center"
            >
              <User size={20} className="text-white" />
            </motion.button>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-4 right-4 top-20 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <motion.button
                        key={item.path}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                          active
                            ? 'bg-gradient-to-r from-primary to-yellow-600 shadow-lg shadow-primary/20'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {/* Active indicator */}
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                        )}
                        <Icon
                          size={20}
                          className={active ? 'text-white' : 'text-gray-600'}
                        />
                        <span
                          className={`font-medium ${
                            active ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-4 top-20 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-primary/5 to-yellow-600/5">
                  <p className="text-sm font-semibold text-gray-900">
                    {managerData?.displayName || 'Owner'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{managerData?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/owner/dashboard');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <User size={18} />
                    <span className="font-medium">Dashboard</span>
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
          <div className="flex items-center justify-around px-4 py-3 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNavigation(item.path)}
                  className="flex flex-col items-center gap-1 px-2 py-2 transition-colors group relative"
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeMobileTab"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-yellow-600 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative ${
                      active
                        ? 'bg-gradient-to-br from-primary to-yellow-600 text-white shadow-lg shadow-primary/30'
                        : 'text-gray-600 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-yellow-600/10 group-hover:text-primary'
                    }`}
                  >
                    <Icon size={22} />
                    {/* Active pulse effect */}
                    {active && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-br from-primary to-yellow-600 rounded-xl"
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      active ? 'text-primary font-bold' : 'text-gray-600 group-hover:text-primary'
                    } transition-colors`}
                  >
                    {item.label.split(' ')[0]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Profile Settings Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Cannot change)</label>
                  <input
                    type="email"
                    value={managerData?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                  <input
                    type="text"
                    value={profileForm.zipCode}
                    onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdateProfile}
                  className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                  <p className="text-xs text-gray-600 mt-1">At least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-black"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdatePassword}
                  className="flex-1 py-2 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg"
                >
                  Update Password
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
