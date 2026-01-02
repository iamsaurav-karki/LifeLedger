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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* User Statistics KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow rounded-lg border border-blue-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-700 truncate">Total Users</dt>
                    <dd className="text-2xl font-bold text-blue-900">
                      {analytics?.users?.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow rounded-lg border border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-700 truncate">Active Users</dt>
                    <dd className="text-2xl font-bold text-green-900">
                      {analytics?.users?.active || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden shadow rounded-lg border border-purple-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📊</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-700 truncate">Daily Active</dt>
                    <dd className="text-2xl font-bold text-purple-900">
                      {analytics?.users?.dailyActiveUsers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 overflow-hidden shadow rounded-lg border border-yellow-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📈</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-yellow-700 truncate">New Signups</dt>
                    <dd className="text-2xl font-bold text-yellow-900">
                      {analytics?.users?.newSignups || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics Details */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">New Signups</p>
              <p className="text-2xl font-bold text-blue-900">{analytics?.users?.newSignups || 0}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Active Rate</p>
              <p className="text-2xl font-bold text-green-900">
                {analytics?.users?.total > 0 
                  ? ((analytics.users.active / analytics.users.total) * 100).toFixed(1) 
                  : '0'}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Engagement</p>
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

