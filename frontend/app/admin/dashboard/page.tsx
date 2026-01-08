'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { initializeAuth } from '@/lib/auth-init';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Admin Dashboard - LifeLedger';
    
    initializeAuth();
    setTimeout(() => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated();
      const isAdmin = useAuthStore.getState().isAdmin();
      
      if (!isAuthenticated || !isAdmin) {
        router.push('/login');
        return;
      }

      const fetchData = async () => {
        try {
          const response = await api.get('/admin/analytics');
          setAnalytics(response.data);
        } catch (error) {
          console.error('Error fetching analytics:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, 100);
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and user analytics</p>
        </div>

        {/* User Statistics KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Users</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.users?.total || 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.users?.active || 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Daily</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Daily Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.users?.dailyActiveUsers || 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">New</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">New Signups</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.users?.newSignups || 0}
              </p>
            </div>
          </div>
        </div>

        {/* User Statistics Details */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">User Statistics</h2>
            <p className="text-sm text-gray-500">Detailed user metrics</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">New Signups</p>
              <p className="text-2xl font-bold text-blue-900">{analytics?.users?.newSignups || 0}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-600 font-medium mb-1">Active Rate</p>
              <p className="text-2xl font-bold text-green-900">
                {analytics?.users?.total > 0 
                  ? ((analytics.users.active / analytics.users.total) * 100).toFixed(1) 
                  : '0'}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-1">Engagement</p>
              <p className="text-2xl font-bold text-purple-900">
                {analytics?.users?.dailyActiveUsers || 0} / {analytics?.users?.active || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

