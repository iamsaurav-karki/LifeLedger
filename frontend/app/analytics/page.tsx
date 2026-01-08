'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { initializeAuth } from '@/lib/auth-init';
import Cookies from 'js-cookie';

import { formatCurrency } from '@/lib/currency';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [analytics, setAnalytics] = useState<any>(null);
  const [foodAnalytics, setFoodAnalytics] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [lendings, setLendings] = useState<any[]>([]);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | '3months' | 'year'>('month');

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
  }, [router, dateRange]);

  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;
    switch (dateRange) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subDays(endDate, 30);
        break;
      case '3months':
        startDate = subMonths(endDate, 3);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    return { startDate, endDate };
  };

  const fetchData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const [analyticsRes, expensesRes, incomesRes, investmentsRes, lendingsRes, foodRes, foodAnalyticsRes] = await Promise.all([
        api.get(`/finance/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/finance/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/finance/income?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/finance/investments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/finance/lendings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/food/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        api.get(`/food/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
      ]);
      setAnalytics(analyticsRes.data);
      setExpenses(expensesRes.data || []);
      setIncomes(incomesRes.data || []);
      setInvestments(investmentsRes.data || []);
      setLendings(lendingsRes.data || []);
      setFoodLogs(foodRes.data || []);
      setFoodAnalytics(foodAnalyticsRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Group data by date for better visualization
  const expenseByDate = expenses.reduce((acc: any, exp: any) => {
    const date = format(new Date(exp.date), 'MMM dd');
    if (!acc[date]) acc[date] = 0;
    acc[date] += parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const incomeByDate = incomes.reduce((acc: any, inc: any) => {
    const date = format(new Date(inc.date), 'MMM dd');
    if (!acc[date]) acc[date] = 0;
    acc[date] += parseFloat(inc.amount || 0);
    return acc;
  }, {});

  const foodByDate = foodLogs.reduce((acc: any, log: any) => {
    const date = format(new Date(log.date), 'MMM dd');
    if (!acc[date]) acc[date] = 0;
    acc[date] += parseFloat(log.cost || 0);
    return acc;
  }, {});

  // Combine all dates and sort
  const allDates = Array.from(new Set([
    ...Object.keys(expenseByDate),
    ...Object.keys(incomeByDate),
    ...Object.keys(foodByDate)
  ])).sort((a, b) => {
    return new Date(a + ' 2024').getTime() - new Date(b + ' 2024').getTime();
  });

  // Financial comparison data
  const financialComparison = allDates.slice(-14).map(date => ({
    date,
    income: incomeByDate[date] || 0,
    expenses: expenseByDate[date] || 0,
    food: foodByDate[date] || 0,
    savings: (incomeByDate[date] || 0) - (expenseByDate[date] || 0) - (foodByDate[date] || 0),
  }));

  // Expense by category
  const expenseByCategory = expenses.reduce((acc: any, exp: any) => {
    const cat = exp.category?.name || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(expenseByCategory)
    .map(([name, amount]: [string, any]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value: amount,
      fullName: name,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Income by source
  const incomeBySource = incomes.reduce((acc: any, inc: any) => {
    const source = inc.source || 'Other';
    acc[source] = (acc[source] || 0) + parseFloat(inc.amount || 0);
    return acc;
  }, {});

  const sourceData = Object.entries(incomeBySource)
    .map(([name, amount]: [string, any]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value: amount,
      fullName: name,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Investment data
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue || inv.amount || 0), 0);
  const investmentProfit = totalInvestmentValue - totalInvestments;

  const investmentsByType = investments.reduce((acc: any, inv: any) => {
    const type = inv.type || 'other';
    if (!acc[type]) {
      acc[type] = { count: 0, totalAmount: 0, totalValue: 0 };
    }
    acc[type].count += 1;
    acc[type].totalAmount += parseFloat(inv.amount || 0);
    acc[type].totalValue += parseFloat(inv.currentValue || inv.amount || 0);
    return acc;
  }, {});

  const investmentTypeData = Object.entries(investmentsByType)
    .map(([type, data]: [string, any]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      invested: data.totalAmount,
      value: data.totalValue,
      profit: data.totalValue - data.totalAmount,
      count: data.count,
    }))
    .sort((a, b) => b.invested - a.invested);

  // Lending data
  const totalLent = lendings.filter(l => l.type === 'lend').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const totalLentPaid = lendings.filter(l => l.type === 'lend').reduce((sum, l) => sum + parseFloat(l.paidAmount || 0), 0);
  const totalLentPending = totalLent - totalLentPaid;
  
  const totalBorrowed = lendings.filter(l => l.type === 'borrow').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const totalBorrowedPaid = lendings.filter(l => l.type === 'borrow').reduce((sum, l) => sum + parseFloat(l.paidAmount || 0), 0);
  const totalBorrowedPending = totalBorrowed - totalBorrowedPaid;

  const lendingStatusData = [
    { name: 'Pending', value: lendings.filter(l => l.status === 'pending').length },
    { name: 'Partially Paid', value: lendings.filter(l => l.status === 'partially_paid').length },
    { name: 'Paid', value: lendings.filter(l => l.status === 'paid').length },
    { name: 'Cancelled', value: lendings.filter(l => l.status === 'cancelled').length },
  ].filter(item => item.value > 0);

  // Food analytics
  const foodByMealType = foodLogs.reduce((acc: any, log: any) => {
    const mealType = log.mealType || 'Other';
    if (!acc[mealType]) {
      acc[mealType] = { count: 0, cost: 0, calories: 0 };
    }
    acc[mealType].count += 1;
    acc[mealType].cost += parseFloat(log.cost || 0);
    acc[mealType].calories += parseInt(log.calories || 0);
    return acc;
  }, {});

  const mealTypeData = Object.entries(foodByMealType)
    .map(([type, data]: [string, any]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      cost: data.cost,
      calories: data.calories,
      count: data.count,
    }))
    .sort((a, b) => b.cost - a.cost);

  const foodByCategory = foodLogs.reduce((acc: any, log: any) => {
    const cat = log.category?.name || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + parseFloat(log.cost || 0);
    return acc;
  }, {});

  const foodCategoryData = Object.entries(foodByCategory)
    .map(([name, value]: [string, any]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value: value,
      fullName: name,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Colors
  const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Comprehensive financial insights and trends</p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | '3months')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Income</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics?.totalIncome || 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Expenses</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics?.totalExpenses || 0)}
              </p>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${(analytics?.savings || 0) >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-xl flex items-center justify-center`}>
                  <span className="text-2xl">📈</span>
                </div>
                <span className={`text-xs font-semibold ${(analytics?.savings || 0) >= 0 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'} px-2 py-1 rounded-full`}>Savings</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Net Savings</p>
              <p className={`text-2xl font-bold ${(analytics?.savings || 0) >= 0 ? 'text-gray-900' : 'text-orange-600'}`}>
                {formatCurrency(analytics?.savings || 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Invest</span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Investments</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalInvestments)}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🍔</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Food Cost</p>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {formatCurrency(foodAnalytics?.totalCost || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {foodLogs.length} meals logged
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📤</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Money to Receive</p>
              <p className="text-xl font-bold text-green-600 mb-2">
                {formatCurrency(totalLentPending)}
              </p>
              <p className="text-xs text-gray-500">
                {lendings.filter(l => l.type === 'lend').length} records
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📥</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Money to Pay</p>
              <p className="text-xl font-bold text-red-600 mb-2">
                {formatCurrency(totalBorrowedPending)}
              </p>
              <p className="text-xs text-gray-500">
                {lendings.filter(l => l.type === 'borrow').length} records
              </p>
            </div>
          </div>
        </div>

        {/* Comprehensive Financial Overview */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Financial Overview</h2>
            <p className="text-sm text-gray-500">Complete financial breakdown</p>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[600px]">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={financialComparison}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 11 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 11 }}
                stroke="#9ca3af"
                tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                fill="url(#colorIncome)" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Income"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                fill="url(#colorExpenses)" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Expenses"
              />
              <Area 
                type="monotone" 
                dataKey="food" 
                fill="url(#colorFood)" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Food Cost"
              />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                name="Net Savings"
              />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Categories */}
          {categoryData.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Expenses by Category</h2>
                <p className="text-sm text-gray-500">Spending breakdown</p>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="min-w-[280px] sm:min-w-[350px] mx-auto">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((item: any, index: number) => {
                  const percent = ((item.value / categoryData.reduce((sum: number, d: any) => sum + d.value, 0)) * 100).toFixed(0);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center min-w-0 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-gray-700 truncate">{item.fullName}</span>
                        <span className="text-gray-500 ml-2 flex-shrink-0">({percent}%)</span>
                      </div>
                      <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{formatCurrency(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Income Sources */}
          {sourceData.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Income by Source</h2>
                <p className="text-sm text-gray-500">Earnings breakdown</p>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="min-w-[280px] sm:min-w-[350px] mx-auto">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {sourceData.map((item: any, index: number) => {
                  const percent = ((item.value / sourceData.reduce((sum: number, d: any) => sum + d.value, 0)) * 100).toFixed(0);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center min-w-0 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-gray-700 truncate">{item.fullName}</span>
                        <span className="text-gray-500 ml-2 flex-shrink-0">({percent}%)</span>
                      </div>
                      <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{formatCurrency(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Investment Analytics */}
        {investments.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-8">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Investment Analytics</h2>
              <p className="text-sm text-gray-500">Portfolio performance insights</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">Total Invested</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(totalInvestments)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">Current Value</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(totalInvestmentValue)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${
                investmentProfit >= 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-medium mb-1 ${investmentProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  Profit/Loss
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${investmentProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatCurrency(investmentProfit)}
                </p>
              </div>
            </div>
            {investmentTypeData.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-900">Investments by Type</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="min-w-[500px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={investmentTypeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          stroke="#9ca3af"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          stroke="#9ca3af"
                          tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}k`}
                          width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="invested" fill="#3b82f6" name="Amount Invested" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="value" fill="#10b981" name="Current Value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lending & Borrowing Analytics */}
        {lendings.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Lending & Borrowing Analytics</h2>
              <p className="text-sm text-gray-500">Money flow tracking</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-2">Money to Receive</p>
                <p className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(totalLentPending)}</p>
                <div className="text-xs text-green-600 space-y-1">
                  <p>Total: {formatCurrency(totalLent)}</p>
                  <p>Paid: {formatCurrency(totalLentPaid)}</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-2">Money to Pay</p>
                <p className="text-2xl font-bold text-red-900 mb-1">{formatCurrency(totalBorrowedPending)}</p>
                <div className="text-xs text-red-600 space-y-1">
                  <p>Total: {formatCurrency(totalBorrowed)}</p>
                  <p>Paid: {formatCurrency(totalBorrowedPaid)}</p>
                </div>
              </div>
            </div>
            {lendingStatusData.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-900">Lending Status Distribution</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="min-w-[280px] sm:min-w-[350px] mx-auto">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={lendingStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {lendingStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Food Analytics */}
        {foodLogs.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Food Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 font-medium">Total Food Cost</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(foodAnalytics?.totalCost || 0)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Avg Cost per Meal</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(foodAnalytics?.avgCostPerMeal || 0)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Total Calories</p>
                <p className="text-2xl font-bold text-green-900">{foodAnalytics?.totalCalories || 0}</p>
              </div>
            </div>
            {mealTypeData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Food Cost by Meal Type</h3>
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <div className="min-w-[400px]">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mealTypeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            stroke="#9ca3af"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            stroke="#9ca3af"
                            tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}k`}
                            width={60}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="cost" fill="#f97316" name="Cost" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                {foodCategoryData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Food Cost by Category</h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <div className="min-w-[280px] sm:min-w-[350px] mx-auto">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={foodCategoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius="70%"
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {foodCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

