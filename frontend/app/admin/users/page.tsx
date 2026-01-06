'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import ConfirmModal from '@/components/ConfirmModal';
import { initializeAuth } from '@/lib/auth-init';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE',
  });
  const [editData, setEditData] = useState({
    name: '',
    role: '',
    status: '',
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  useEffect(() => {
    // Set page title
    document.title = 'User Management - LifeLedger';
    
    initializeAuth();
    setTimeout(() => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated();
      const isAdmin = useAuthStore.getState().isAdmin();
      
      if (!isAuthenticated || !isAdmin) {
        router.push('/login');
        return;
      }

      fetchUsers();
    }, 100);
  }, [router, search, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMetrics = async (userId: string) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setUserMetrics(response.data);
    } catch (error: any) {
      console.error('Error fetching user metrics:', error);
      setError(error.response?.data?.message || 'Failed to fetch user metrics');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use the admin endpoint to create a user with role and status
      await api.post('/admin/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status,
      });
      
      setSuccess('User created successfully!');
      setShowAddForm(false);
      setFormData({ name: '', email: '', password: '', role: 'USER', status: 'ACTIVE' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditData({
      name: user.name,
      role: user.role,
      status: user.status,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUserId) return;
    try {
      await api.patch(`/admin/users/${editingUserId}`, editData);
      setSuccess('User updated successfully!');
      setEditingUserId(null);
      setEditData({ name: '', role: '', status: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditData({ name: '', role: '', status: '' });
  };

  const handleViewActivity = async (userId: string) => {
    setViewingUserId(userId);
    await fetchUserMetrics(userId);
  };

  const handleResetPassword = (userId: string, userName: string) => {
    setResettingPasswordUserId(userId);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePassword = async () => {
    if (!resettingPasswordUserId) return;

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      await api.post(`/admin/users/${resettingPasswordUserId}/reset-password`, {
        newPassword: newPassword,
      });
      setSuccess('Password reset successfully!');
      setResettingPasswordUserId(null);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancelPasswordReset = () => {
    setResettingPasswordUserId(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, { status });
      setSuccess('User status updated successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user status');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Check if user is admin
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'ADMIN') {
      setError('Cannot delete admin users');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${userName}"? This action cannot be undone and will permanently remove the user account.`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          setSuccess('User deleted successfully!');
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError(error.response?.data?.message || 'Failed to delete user');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add User'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-red-700">×</span>
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{success}</span>
            <button
              onClick={() => setSuccess('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-green-700">×</span>
            </button>
          </div>
        )}

        {/* Add User Form */}
        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', email: '', password: '', role: 'USER', status: 'ACTIVE' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {users.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        ) : (
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {editingUserId === user.id ? (
                            <>
                              <button
                                onClick={handleSaveUser}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900 font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-primary-600 hover:text-primary-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleViewActivity(user.id)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Activity
                              </button>
                              <button
                                onClick={() => handleResetPassword(user.id, user.name)}
                                className="text-orange-600 hover:text-orange-900 font-medium"
                              >
                                Reset Password
                              </button>
                              {user.role !== 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Activity Modal */}
        {viewingUserId && userMetrics && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Activity - {userMetrics.user.name}</h3>
                <button
                  onClick={() => {
                    setViewingUserId(null);
                    setUserMetrics(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Email: {userMetrics.user.email}</p>
                  <p className="text-sm text-gray-600">Role: {userMetrics.user.role}</p>
                  <p className="text-sm text-gray-600">Status: {userMetrics.user.status}</p>
                  <p className="text-sm text-gray-600">
                    Last Login: {userMetrics.user.lastLogin ? format(new Date(userMetrics.user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Account Created: {format(new Date(userMetrics.user.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Usage Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
                      <p className="text-lg font-bold text-blue-900">{userMetrics.metrics.totalExpenses || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-green-600 font-medium">Total Income</p>
                      <p className="text-lg font-bold text-green-900">{userMetrics.metrics.totalIncome || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-purple-600 font-medium">Total Investments</p>
                      <p className="text-lg font-bold text-purple-900">{userMetrics.metrics.totalInvestments || 0}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-sm text-orange-600 font-medium">Food Logs</p>
                      <p className="text-lg font-bold text-orange-900">{userMetrics.metrics.foodLogsCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          variant={confirmModal.variant || 'danger'}
        />
      </div>
    </Layout>
  );
}
