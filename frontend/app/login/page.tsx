'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = isAdminLogin ? 'Admin Login - LifeLedger' : 'Login - LifeLedger';
    
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('registered') === 'true') {
      setSuccess(true);
      // Clear the query parameter
      router.replace('/login');
    }
    // Check if this is admin login (via query parameter)
    if (params.get('type') === 'admin') {
      setIsAdminLogin(true);
    }
  }, [router, isAdminLogin]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      // Use admin login endpoint if this is admin login
      const endpoint = isAdminLogin ? '/auth/admin/login' : '/auth/login';
      const response = await api.post(endpoint, data);
      const { accessToken, refreshToken, user } = response.data;
      
      // Verify admin role if admin login
      if (isAdminLogin && user.role !== 'ADMIN') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      // If normal user tries to login but is admin, switch to admin mode
      if (!isAdminLogin && user.role === 'ADMIN') {
        setError('Please switch to Admin Login mode to access admin features.');
        setLoading(false);
        setIsAdminLogin(true);
        return;
      }
      
      setAuth(user, accessToken, refreshToken);
      router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || (isAdminLogin ? 'Admin login failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isAdminLogin ? 'from-purple-50 to-purple-100' : 'from-primary-50 to-primary-100'}`}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className={`text-3xl font-bold text-center mb-6 ${isAdminLogin ? 'text-purple-700' : 'text-primary-700'}`}>🧾 LifeLedger</h1>
        <h2 className={`text-xl font-semibold text-center mb-2 ${isAdminLogin ? 'text-purple-600' : ''}`}>
          {isAdminLogin ? 'Admin Login' : 'Login'}
        </h2>
        {isAdminLogin && (
          <p className="text-center text-sm text-gray-600 mb-8">Access the admin dashboard</p>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Registration successful! Please login with your credentials.
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAdminLogin ? 'Admin Email' : 'Email'}
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${isAdminLogin ? 'focus:ring-purple-500' : 'focus:ring-primary-500'} text-gray-900 bg-white`}
              placeholder={isAdminLogin ? 'admin@example.com' : ''}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${isAdminLogin ? 'focus:ring-purple-500' : 'focus:ring-primary-500'} text-gray-900 bg-white`}
              placeholder={isAdminLogin ? 'Enter your password' : ''}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
              isAdminLogin 
                ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
                : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
            }`}
          >
            {loading ? 'Logging in...' : isAdminLogin ? 'Login as Admin' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          {!isAdminLogin ? (
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-primary-600 hover:underline">
                Register
              </a>
            </p>
          ) : (
            <p className="text-center text-sm text-gray-600">
              Need an account?{' '}
              <a href="/register" className="text-purple-600 hover:underline">
                Register
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

