'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart3, TrendingUp, LogOut, Users, Calendar as CalendarIcon, Package } from 'lucide-react';
import { useManager } from '@/contexts/ManagerContext';
import { useRouter } from 'next/navigation';

export default function ManagerNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { managerLogout, managerData } = useManager();

  const navItems = [
    {
      href: '/owner/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/owner/bookings',
      label: 'Bookings',
      icon: Package,
    },
    {
      href: '/owner/upcoming-events',
      label: 'Upcoming Events',
      icon: CalendarIcon,
    },
    {
      href: '/owner/users',
      label: 'Users',
      icon: Users,
    },
    {
      href: '/owner/calendar',
      label: 'Calendar',
      icon: CalendarIcon,
    },
    {
      href: '/owner/reports',
      label: 'Reports',
      icon: BarChart3,
    },
    {
      href: '/owner/accounting',
      label: 'Accounting',
      icon: TrendingUp,
    },
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

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Owner Portal</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">{managerData?.displayName || 'Owner'}</p>
              <p className="text-xs text-gray-600">Owner Account</p>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-all duration-300"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary to-yellow-600 text-white' 
                      : 'text-gray-700 bg-gray-100'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
