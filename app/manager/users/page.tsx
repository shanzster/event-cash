'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import ManagerUsers from '@/components/ManagerUsers';

export default function ManagerUsersPage() {
  const router = useRouter();
  const { managerUser, loading, isManager } = useManager();

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/manager/login');
    }
  }, [managerUser, loading, isManager, router]);

  if (loading) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading...</p>
          </div>
        </div>
      </ManagerSidebar>
    );
  }

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Users & Staff Management</h1>
            <p className="text-gray-600 mt-2">Manage customer accounts and staff members</p>
          </div>
          
          <ManagerUsers />
        </div>
      </div>
    </ManagerSidebar>
  );
}
