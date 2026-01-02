'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { useForm } from 'react-hook-form';
import { initializeAuth } from '@/lib/auth-init';
import Cookies from 'js-cookie';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, subDays } from 'date-fns';
import ConfirmModal from '@/components/ConfirmModal';
import Pagination from '@/components/Pagination';

interface FoodLogForm {
  cost: string;
  foodName: string;
  mealType: string;
  calories: string;
  date: string;
  description: string;
  categoryId?: string;
}

type FilterPeriod = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export default function FoodPage() {
  const router = useRouter();
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('thisWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
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

  const { 
    register, 
    handleSubmit, 
    reset,
    setValue,
    formState: { errors } 
  } = useForm<FoodLogForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    initializeAuth();
    setTimeout(() => {
      const token = useAuthStore.getState().accessToken || Cookies.get('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      fetchData();
    }, 100);
  }, [router, filterPeriod, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    switch (filterPeriod) {
      case 'today':
        return {
          startDate: startOfDay(now).toISOString().split('T')[0],
          endDate: endOfDay(now).toISOString().split('T')[0],
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          startDate: startOfDay(yesterday).toISOString().split('T')[0],
          endDate: endOfDay(yesterday).toISOString().split('T')[0],
        };
      case 'thisWeek':
        return {
          startDate: startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0], // Monday
          endDate: endOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0], // Sunday
        };
      case 'lastWeek':
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        return {
          startDate: lastWeekStart.toISOString().split('T')[0],
          endDate: lastWeekEnd.toISOString().split('T')[0],
        };
      case 'thisMonth':
        return {
          startDate: startOfMonth(now).toISOString().split('T')[0],
          endDate: endOfMonth(now).toISOString().split('T')[0],
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth).toISOString().split('T')[0],
          endDate: endOfMonth(lastMonth).toISOString().split('T')[0],
        };
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const fetchData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [logsRes, categoriesRes] = await Promise.all([
        api.get('/food/logs', { params }),
        api.get('/food/categories'),
      ]);
      setFoodLogs(logsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FoodLogForm) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        ...data,
      };

      // Cost is optional - only include if provided and valid
      if (data.cost && data.cost.trim() !== '') {
        const costNum = parseFloat(data.cost);
        if (!isNaN(costNum) && costNum >= 0) {
          payload.cost = costNum;
        } else if (costNum < 0) {
          setError('Cost cannot be negative');
          setSubmitting(false);
          return;
        }
        // If cost is invalid but provided, don't include it (optional field)
      }

      if (data.calories && data.calories.trim() !== '') {
        const caloriesNum = parseFloat(data.calories);
        if (isNaN(caloriesNum) || caloriesNum < 0) {
          setError('Calories must be a valid positive number');
          setSubmitting(false);
          return;
        }
        payload.calories = caloriesNum;
      } else {
        delete payload.calories;
      }

      if (!payload.categoryId || payload.categoryId === '') {
        delete payload.categoryId;
      }

      if (editingLog) {
        await api.patch(`/food/logs/${editingLog.id}`, payload);
        setSuccess('Food log updated successfully!');
        setEditingLog(null);
      } else {
        await api.post('/food/logs', payload);
        setSuccess('Food log added successfully!');
      }
      
      setShowForm(false);
      reset();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving food log:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save food log';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLog = (log: any) => {
    setEditingLog(log);
    setValue('cost', log.cost?.toString() || '');
    setValue('foodName', log.foodName || '');
    setValue('mealType', log.mealType || '');
    setValue('calories', log.calories?.toString() || '');
    setValue('date', log.date);
    setValue('description', log.description || '');
    setValue('categoryId', log.categoryId || '');
    setShowForm(true);
  };

  const handleDeleteLog = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Food Log',
      message: 'Are you sure you want to delete this food log? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/food/logs/${id}`);
          setSuccess('Food log deleted successfully!');
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError(error.response?.data?.message || 'Failed to delete food log');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

  const handleBulkDelete = async () => {
    if (selectedLogs.size === 0) {
      setError('Please select items to delete');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedLogs.size} Food Log(s)`,
      message: `Are you sure you want to delete ${selectedLogs.size} selected food log(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(
            Array.from(selectedLogs).map(id => api.delete(`/food/logs/${id}`))
          );
          setSuccess(`${selectedLogs.size} food log(s) deleted successfully!`);
          setSelectedLogs(new Set());
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError('Failed to delete items');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    try {
      await api.post('/food/categories', {
        name: newCategoryName.trim(),
      });
      setSuccess('Category created successfully!');
      setNewCategoryName('');
      setShowCategoryForm(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create category');
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredLogs = foodLogs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.foodName?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.mealType?.toLowerCase().includes(query) ||
      log.cost?.toString().includes(query) ||
      log.calories?.toString().includes(query)
    );
  });

  // Calculate food statistics (after filteredLogs is defined)
  const totalCost = filteredLogs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);
  const totalCalories = filteredLogs.reduce((sum, log) => sum + (parseInt(log.calories) || 0), 0);
  const mealCount = filteredLogs.length;
  // Calculate average cost only for meals that have a cost
  const mealsWithCost = filteredLogs.filter(log => log.cost != null && log.cost !== undefined && parseFloat(log.cost || 0) > 0);
  const avgCostPerMeal = mealsWithCost.length > 0 ? totalCost / mealsWithCost.length : 0;
  
  const mealTypeBreakdown = filteredLogs.reduce((acc: any, log: any) => {
    const mealType = log.mealType || 'Other';
    if (!acc[mealType]) {
      acc[mealType] = { count: 0, cost: 0 };
    }
    acc[mealType].count += 1;
    acc[mealType].cost += parseFloat(log.cost || 0);
    return acc;
  }, {});

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod, customStartDate, customEndDate, searchQuery]);

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Tracking</h1>
            <p className="text-gray-500 mt-1">Track your meals, costs, and nutrition</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingLog(null);
              setError('');
              setSuccess('');
              reset();
            }}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            {showForm ? 'Cancel' : '+ Add Food Log'}
          </button>
        </div>

        {/* Food Statistics Cards */}
        {filteredLogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-lg shadow-md border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Total Cost</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {mealsWithCost.length > 0 ? formatCurrency(totalCost) : <span className="text-gray-400">N/A</span>}
                  </p>
                </div>
                <span className="text-3xl">🍽️</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg shadow-md border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Calories</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{totalCalories.toLocaleString()} cal</p>
                </div>
                <span className="text-3xl">🔥</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg shadow-md border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Meals Logged</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{mealCount}</p>
                </div>
                <span className="text-3xl">📊</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg shadow-md border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Avg Cost/Meal</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {mealsWithCost.length > 0 ? formatCurrency(avgCostPerMeal) : <span className="text-gray-400">N/A</span>}
                  </p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Period</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              >
                <optgroup label="Day">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                </optgroup>
                <optgroup label="Week">
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                </optgroup>
                <optgroup label="Month">
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </optgroup>
              </select>
            </div>
            {filterPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              />
            </div>
          </div>
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

        {/* Food Log Form */}
        {showForm && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{editingLog ? 'Edit Food Log' : 'Add Food Log'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                  <input
                    type="text"
                    {...register('foodName')}
                    placeholder="e.g., Pizza"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('cost', { 
                      validate: (value) => {
                        if (!value || value.trim() === '') return true; // Optional field
                        const num = parseFloat(value);
                        return (!isNaN(num) && num >= 0) || 'Cost must be a valid positive number or zero';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      errors.cost ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00 (optional)"
                  />
                  {errors.cost && (
                    <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Leave empty if no cost (e.g., home-cooked meals)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                  <select
                    {...register('mealType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    <option value="">Select meal type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                  <input
                    type="number"
                    min="0"
                    {...register('calories', {
                      validate: (value) => {
                        if (!value || value.trim() === '') return true;
                        const num = parseFloat(value);
                        return !isNaN(num) && num >= 0 || 'Calories must be a valid positive number';
                      }
                    })}
                    placeholder="Optional"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      errors.calories ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {errors.calories && (
                    <p className="text-red-500 text-sm mt-1">{errors.calories.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date', { required: 'Date is required' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="flex gap-2">
                    <select
                      {...register('categoryId')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    >
                      <option value="">Select category (optional)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryForm(true);
                        setNewCategoryName('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
                      title="Add new category"
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                {submitting ? 'Saving...' : editingLog ? 'Update Food Log' : 'Save Food Log'}
              </button>
            </form>
          </div>
        )}

        {/* Category Creation Form */}
        {showCategoryForm && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Category</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
              <button
                onClick={handleCreateCategory}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCategoryForm(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Meal Type Breakdown */}
        {Object.keys(mealTypeBreakdown).length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Meal Type Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(mealTypeBreakdown).map(([mealType, data]: [string, any]) => (
                <div key={mealType} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 capitalize">{mealType}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{data.count} meals</p>
                  <p className="text-sm text-gray-500 mt-1">{formatCurrency(data.cost)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Logs Table */}
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Food Logs</h2>
            {selectedLogs.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Delete Selected ({selectedLogs.size})
              </button>
            )}
          </div>
          {filteredLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No food logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={paginatedLogs.length > 0 && paginatedLogs.every(log => selectedLogs.has(log.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedLogs);
                            paginatedLogs.forEach(log => newSet.add(log.id));
                            setSelectedLogs(newSet);
                          } else {
                            const newSet = new Set(selectedLogs);
                            paginatedLogs.forEach(log => newSet.delete(log.id));
                            setSelectedLogs(newSet);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Food Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meal Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calories</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedLogs);
                            if (e.target.checked) {
                              newSet.add(log.id);
                            } else {
                              newSet.delete(log.id);
                            }
                            setSelectedLogs(newSet);
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">🍽️</span>
                          <span className="text-sm font-medium text-gray-900">
                            {log.foodName || 'Food Item'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {log.mealType ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium capitalize">
                            {log.mealType}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {log.calories ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {log.calories} cal
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {log.category?.name ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {log.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-orange-600 text-right">
                        {log.cost != null && log.cost !== undefined ? formatCurrency(parseFloat(log.cost)) : <span className="text-gray-400">N/A</span>}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditLog(log)}
                          className="text-blue-600 hover:text-blue-800 mr-3 font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-red-600 hover:text-red-800 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredLogs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredLogs.length}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </div>

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
