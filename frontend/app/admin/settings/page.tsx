'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { initializeAuth } from '@/lib/auth-init';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editUserData, setEditUserData] = useState({ name: '', role: '', status: '' });
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
    document.title = 'System Settings - LifeLedger';
    
    const init = async () => {
      await initializeAuth();
      setTimeout(() => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated();
      const isAdmin = useAuthStore.getState().isAdmin();
      
      if (!isAuthenticated || !isAdmin) {
        router.push('/login');
        return;
      }

        fetchSettings();
        fetchUsers();
      }, 100);
    };
    init();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setError(error.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = async (key: string) => {
    try {
      await api.patch(`/admin/settings/${key}`, { value: editValue });
      setSuccess('Setting updated successfully!');
      setEditingKey(null);
      fetchSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update setting');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditUserData({
      name: user.name || '',
      role: user.role || '',
      status: user.status || '',
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, editUserData);
      setSuccess('User updated successfully!');
      setEditingUserId(null);
      setEditUserData({ name: '', role: '', status: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setEditUserData({ name: '', role: '', status: '' });
  };

  const handleResetPassword = (userId: string) => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">System Settings</h1>

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

        {/* User Management Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="mt-1 text-sm text-gray-600">Manage user details, roles, and status</p>
          </div>
          {users.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-600">No users found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user: any) => (
                <li key={user.id}>
                  <div className="px-4 py-4 sm:px-6">
                    {editingUserId === user.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editUserData.name}
                            onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={editUserData.role}
                            onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={editUserData.status}
                            onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveUser(user.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelUserEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-700">{user.email}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : user.status === 'INACTIVE'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
                          >
                            Reset Password
                          </button>
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* System Settings Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
            <p className="mt-1 text-sm text-gray-600">Configure system-wide settings</p>
          </div>
          {settings.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-600">No settings found. Settings will appear here once created.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {settings.map((setting: any) => (
                <li key={setting.key}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{setting.key}</p>
                        {editingKey === setting.key ? (
                          <div className="mt-2 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            />
                            <button
                              onClick={() => handleSave(setting.key)}
                              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-700">{setting.value}</p>
                        )}
                      </div>
                      {editingKey !== setting.key && (
                        <button
                          onClick={() => handleEdit(setting.key, setting.value)}
                          className="ml-4 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reset Password Modal */}
        {resettingPasswordUserId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                <button
                  onClick={handleCancelPasswordReset}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={handleCancelPasswordReset}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePassword}
                    disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset Password
                  </button>
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

