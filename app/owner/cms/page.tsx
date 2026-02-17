'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Eye, Edit3, X } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';

export default function CMSPage() {
  const router = useRouter();
  const { managerUser, isManager } = useManager();
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<'home' | 'about' | 'services' | 'contact' | 'location'>('home');

  useEffect(() => {
    if (!isManager || !managerUser) {
      router.push('/owner/login');
      return;
    }
    setLoading(false);
  }, [isManager, managerUser]);

  if (loading) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading CMS...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  const pages = [
    { id: 'home', label: 'Home Page', path: '/' },
    { id: 'about', label: 'About Page', path: '/about' },
    { id: 'services', label: 'Services Page', path: '/services' },
    { id: 'contact', label: 'Contact Page', path: '/contact' },
    { id: 'location', label: 'Location Page', path: '/location' },
  ];

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent mb-2">
              Website Content Editor
            </h1>
            <p className="text-gray-600">Click on any text in the preview to edit it directly</p>
          </motion.div>

          {/* Page Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-white rounded-xl shadow-lg p-4"
          >
            <div className="flex gap-2 flex-wrap">
              {pages.map((page) => (
                <motion.button
                  key={page.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPage(page.id as any)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedPage === page.id
                      ? 'bg-gradient-to-r from-primary to-yellow-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Editor Frame */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary to-yellow-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 size={24} className="text-white" />
                <span className="text-white font-semibold">
                  Editing: {pages.find(p => p.id === selectedPage)?.label}
                </span>
              </div>
              <a
                href={pages.find(p => p.id === selectedPage)?.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Eye size={20} />
                View Live
              </a>
            </div>
            
            {/* Preview Frame */}
            <div className="relative" style={{ height: 'calc(100vh - 300px)' }}>
              <iframe
                src={`${pages.find(p => p.id === selectedPage)?.path}?cms=true`}
                className="w-full h-full border-0"
                title="Page Preview"
              />
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-blue-900 mb-2">How to use the Content Editor:</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Select a page from the tabs above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Click on any text in the preview to edit it</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Changes are saved automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Click "View Live" to see your changes on the actual website</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </ManagerSidebar>
  );
}
