'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Users, Package } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ManagerTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function ManagerTabs({ activeTab, onTabChange }: ManagerTabsProps) {
  const tabs: Tab[] = [
    { id: 'bookings', label: 'Bookings', icon: Package },
    { id: 'users', label: 'Users & Staff', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 mb-8">
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Icon size={20} />
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
