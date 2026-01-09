'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { initializeAuth } from '@/lib/auth-init';
import Cookies from 'js-cookie';
import { formatCurrency } from '@/lib/currency';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [analytics, setAnalytics] = useState<any>(null);
  const [prevMonthAnalytics, setPrevMonthAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [lendings, setLendings] = useState<any[]>([]);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [foodAnalytics, setFoodAnalytics] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
    };
    init();
    
    const fetchData = async () => {
      try {
        const token = useAuthStore.getState().accessToken || Cookies.get('accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const endDate = new Date();
        const startDate = subDays(endDate, 30);
        const prevMonthStart = subMonths(endDate, 1);
        const prevMonthEnd = subDays(prevMonthStart, 1);

        const [analyticsRes, prevAnalyticsRes, expensesRes, incomesRes, investmentsRes, lendingsRes, foodRes, foodAnalyticsRes] = await Promise.all([
          api.get(`/finance/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/analytics?startDate=${prevMonthStart.toISOString()}&endDate=${prevMonthEnd.toISOString()}`),
          api.get(`/finance/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/income?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/investments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/lendings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/food/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/food/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        ]);

        setAnalytics(analyticsRes.data);
        setPrevMonthAnalytics(prevAnalyticsRes.data);
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

    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Calculate totals - all amounts are in NPR (must be calculated first)
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue || inv.amount || 0), 0);
  const investmentProfit = totalInvestmentValue - totalInvestments;

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? 12.5 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculatePercentageChange(analytics?.totalIncome || 0, prevMonthAnalytics?.totalIncome || 0);
  const expenseChange = calculatePercentageChange(analytics?.totalExpenses || 0, prevMonthAnalytics?.totalExpenses || 0);
  const savingsChange = calculatePercentageChange(analytics?.savings || 0, prevMonthAnalytics?.savings || 0);
  const investmentROI = totalInvestments > 0 ? ((totalInvestmentValue - totalInvestments) / totalInvestments) * 100 : 0;
  
  // Calculate savings rate
  const savingsRate = analytics?.totalIncome > 0 ? ((analytics?.savings || 0) / analytics.totalIncome) * 100 : 0;
  
  // Investment breakdown by type
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

  // Lending calculations
  const totalLent = lendings.filter(l => l.type === 'lend').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const totalLentPaid = lendings.filter(l => l.type === 'lend').reduce((sum, l) => sum + parseFloat(l.paidAmount || 0), 0);
  const totalLentPending = totalLent - totalLentPaid;
  
  const totalBorrowed = lendings.filter(l => l.type === 'borrow').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const totalBorrowedPaid = lendings.filter(l => l.type === 'borrow').reduce((sum, l) => sum + parseFloat(l.paidAmount || 0), 0);
  const totalBorrowedPending = totalBorrowed - totalBorrowedPaid;
  
  const pendingLendings = lendings.filter(l => l.status === 'pending' || l.status === 'partially_paid');
  const completedLendings = lendings.filter(l => l.status === 'paid');

  // Group expenses and income by date for better visualization
  const expenseByDate = expenses.reduce((acc: any, exp: any) => {
    const date = format(new Date(exp.date), 'MMM dd');
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const incomeByDate = incomes.reduce((acc: any, inc: any) => {
    const date = format(new Date(inc.date), 'MMM dd');
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(inc.amount || 0);
    return acc;
  }, {});

  // Combine dates and create comparison data
  const allDates = Array.from(new Set([
    ...Object.keys(expenseByDate),
    ...Object.keys(incomeByDate)
  ])).sort((a, b) => {
    return new Date(a + ' 2024').getTime() - new Date(b + ' 2024').getTime();
  });

  const incomeExpenseComparison = allDates.slice(-7).map(date => ({
    date,
    income: incomeByDate[date] || 0,
    expenses: expenseByDate[date] || 0,
    savings: (incomeByDate[date] || 0) - (expenseByDate[date] || 0),
  }));

  // Expense trend data
  const expenseTrendData = allDates.slice(-7).map(date => ({
    date,
    amount: expenseByDate[date] || 0,
  }));

  // Income trend data
  const incomeTrendData = allDates.slice(-7).map(date => ({
    date,
    amount: incomeByDate[date] || 0,
  }));

  // Investment performance over time
  const investmentData = investments
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map((inv) => ({
      date: format(new Date(inv.date), 'MMM dd'),
      invested: parseFloat(inv.amount || 0),
      value: parseFloat(inv.currentValue || inv.amount || 0),
    }));

  // Expense categories breakdown
  const expenseCategories = expenses.reduce((acc: any, exp: any) => {
    const catName = exp.category?.name || 'Uncategorized';
    if (!acc[catName]) {
      acc[catName] = 0;
    }
    acc[catName] += parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(expenseCategories)
    .map(([name, value]: [string, any]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value: parseFloat(value),
      fullName: name,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Investment type breakdown
  const investmentTypeData = Object.entries(investmentsByType)
    .map(([type, data]: [string, any]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: parseFloat(data.totalAmount),
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Colors for charts
  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
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

  // Generate monthly data for chart
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthIncome = index === currentMonth ? (analytics?.totalIncome || 0) / 30 * 30 : (analytics?.totalIncome || 0) * 0.8;
      const monthExpense = index === currentMonth ? (analytics?.totalExpenses || 0) / 30 * 30 : (analytics?.totalExpenses || 0) * 0.7;
      return {
        month,
        income: monthIncome,
        expenses: monthExpense,
      };
    });
  })();

  // Get today's food logs
  const todayFoodLogs = foodLogs.filter(log => {
    const logDate = new Date(log.date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });
  const todayCalories = todayFoodLogs.reduce((sum, log) => sum + parseInt(log.calories || 0), 0);
  const todayFoodCost = todayFoodLogs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);

  // Recent transactions (combined expenses and income)
  const recentTransactions = [
    ...expenses.slice(0, 4).map(exp => ({ ...exp, type: 'expense' })),
    ...incomes.slice(0, 2).map(inc => ({ ...inc, type: 'income' })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <Layout>
      <div>
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your finances today.</p>
        </div>

        {/* Financial Summary Cards - Colored Backgrounds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          {/* Total Balance / Net Savings */}
          <div className="bg-blue-600 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden text-white">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full text-white">
                  {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm font-medium text-white/90 mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency(analytics?.savings || 0)}
              </p>
            </div>
          </div>

          {/* Total Income */}
          <div className="bg-green-600 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden text-white">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full text-white">
                  {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm font-medium text-white/90 mb-1">Total Income</p>
              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency(analytics?.totalIncome || 0)}
              </p>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-red-600 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden text-white">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📉</span>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full text-white">
                  {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm font-medium text-white/90 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency(analytics?.totalExpenses || 0)}
              </p>
            </div>
          </div>

          {/* Investments */}
          <div className="bg-purple-600 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden text-white">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full text-white">
                  {investmentROI >= 0 ? '+' : ''}{investmentROI.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm font-medium text-white/90 mb-1">Investments</p>
              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency(totalInvestmentValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Spending Overview & Expense Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spending Overview - Line Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Spending Overview</h2>
                <p className="text-sm text-gray-500">Monthly expense trends</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    timeframe === 'month'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    timeframe === 'week'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeframe('day')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    timeframe === 'day'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[400px]">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeframe === 'month' ? monthlyData : incomeExpenseComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey={timeframe === 'month' ? 'month' : 'date'} 
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      stroke="#9ca3af"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      width={50}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="This Month"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#9ca3af" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#9ca3af', r: 3 }}
                      name="Last Month"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Expense Categories - List Format with Progress Bars */}
          {categoryData.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Expense Categories</h2>
                <Link href="/analytics" className="text-sm text-primary-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {categoryData.map((item: any, index: number) => {
                  const totalExpenses = categoryData.reduce((sum: number, d: any) => sum + d.value, 0);
                  const percent = ((item.value / totalExpenses) * 100).toFixed(0);
                  const categoryIcons: any = {
                    'Food & Dining': '🍴',
                    'Transportation': '🚗',
                    'Shopping': '🛍️',
                    'Entertainment': '🎮',
                    'Bills': '📄',
                    'Healthcare': '🏥',
                  };
                  const categoryColors: any = {
                    'Food & Dining': 'bg-blue-500',
                    'Transportation': 'bg-green-500',
                    'Shopping': 'bg-purple-500',
                    'Entertainment': 'bg-orange-500',
                    'Bills': 'bg-pink-500',
                    'Healthcare': 'bg-red-500',
                  };
                  const icon = categoryIcons[item.fullName] || '💰';
                  const color = categoryColors[item.fullName] || PIE_COLORS[index % PIE_COLORS.length];
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{icon}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.fullName}</p>
                            <p className="text-xs text-gray-500">{percent}% of expenses</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${typeof color === 'string' && color.startsWith('bg-') ? color : ''}`}
                          style={{ 
                            width: `${percent}%`, 
                            backgroundColor: typeof color === 'string' && !color.startsWith('bg-') ? color : undefined 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Investment Portfolio & Lending & Borrowing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Investment Portfolio */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Investment Portfolio</h2>
              <Link href="/finance?tab=investments" className="text-sm text-primary-600 hover:underline">Manage</Link>
            </div>
            {investments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No investments yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(investmentsByType).slice(0, 3).map(([type, data]: [string, any]) => {
                  const typeNames: any = {
                    'fixed_deposit': { name: 'Fixed Deposits', icon: '🏦', color: 'bg-blue-100', textColor: 'text-blue-700' },
                    'sip': { name: 'SIP Investments', icon: '📈', color: 'bg-purple-100', textColor: 'text-purple-700' },
                    'stocks': { name: 'Stocks', icon: '📊', color: 'bg-green-100', textColor: 'text-green-700' },
                  };
                  const typeInfo = typeNames[type] || { name: type.replace('_', ' ').toUpperCase(), icon: '💼', color: 'bg-gray-100', textColor: 'text-gray-700' };
                  const returnPercent = data.totalAmount > 0 ? (((data.totalValue - data.totalAmount) / data.totalAmount) * 100) : 0;
                  return (
                    <div key={type} className={`${typeInfo.color} p-4 rounded-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{typeInfo.icon}</span>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{typeInfo.name}</p>
                            <p className="text-xs text-gray-600">{data.count} {data.count === 1 ? 'active' : 'active'} {type === 'fixed_deposit' ? 'deposits' : type === 'sip' ? 'SIPs' : 'holdings'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(data.totalAmount)}</p>
                        <span className={`text-sm font-semibold ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}% {type === 'fixed_deposit' ? 'interest' : 'returns'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lending & Borrowing */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Lending & Borrowing</h2>
              <Link href="/finance?tab=lendings" className="text-sm text-primary-600 hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Money to Receive</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(totalLentPending)}</p>
                <p className="text-xs text-gray-500 mt-1">From {lendings.filter(l => l.type === 'lend').length} {lendings.filter(l => l.type === 'lend').length === 1 ? 'person' : 'people'}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Money to Pay</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(totalBorrowedPending)}</p>
                <p className="text-xs text-gray-500 mt-1">To {lendings.filter(l => l.type === 'borrow').length} {lendings.filter(l => l.type === 'borrow').length === 1 ? 'person' : 'people'}</p>
              </div>
            </div>
            {lendings.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No lending/borrowing records</p>
            ) : (
              <div className="space-y-2">
                {lendings.filter(l => l.status === 'pending' || l.status === 'partially_paid').slice(0, 2).map((lend) => {
                  const pending = parseFloat(lend.amount) - parseFloat(lend.paidAmount || 0);
                  return (
                    <div key={lend.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-700">
                            {lend.personName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lend.personName}</p>
                          <p className="text-xs text-gray-500">Due: {format(new Date(lend.dueDate || lend.date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${lend.type === 'lend' ? 'text-green-600' : 'text-red-600'}`}>
                          {lend.type === 'lend' ? '+' : '-'}{formatCurrency(pending)}
                        </p>
                        <p className="text-xs text-gray-500">{lend.type === 'lend' ? 'To Receive' : 'To Pay'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Food Tracking & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Food Tracking */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Food Tracking</h2>
              <Link href="/food" className="text-sm text-primary-600 hover:underline">Details</Link>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(todayFoodCost)}</p>
                  <p className="text-xs text-gray-500 mt-1">{todayFoodLogs.length} {todayFoodLogs.length === 1 ? 'meal' : 'meals'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">Calories</p>
                  <p className="text-lg font-bold text-gray-900">{todayCalories}</p>
                  <p className="text-xs text-gray-500 mt-1">Goal: 2,000 cal</p>
                </div>
              </div>
            </div>
            {todayFoodLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No meals logged today</p>
            ) : (
              <div className="space-y-2">
                {todayFoodLogs.slice(0, 3).map((log) => {
                  const mealIcons: any = {
                    'breakfast': '☀️',
                    'lunch': '🍔',
                    'dinner': '🍽️',
                    'snacks': '🍎',
                  };
                  return (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{mealIcons[log.mealType?.toLowerCase()] || '🍴'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{log.mealType || 'Meal'}</p>
                          <p className="text-xs text-gray-500">{format(new Date(log.date), 'h:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(parseFloat(log.cost || 0))}</p>
                        <p className="text-xs text-gray-500">{log.calories || 0} cal</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Transactions</h2>
              <Link href="/finance" className="text-sm text-primary-600 hover:underline">View All</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No recent transactions</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((trans) => {
                  const isExpense = trans.type === 'expense';
                  const icons: any = {
                    'expense': { 'Food & Dining': '🍴', 'Transportation': '🚗', 'Shopping': '🛍️', 'default': '💸' },
                    'income': { 'Salary': '💼', 'default': '💰' },
                  };
                  const categoryName = isExpense ? (trans.category?.name || 'Expense') : (trans.source || 'Income');
                  const icon = icons[trans.type]?.[categoryName] || icons[trans.type]?.default || '💰';
                  return (
                    <div key={trans.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{isExpense ? categoryName : categoryName}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(trans.date), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                          {isExpense ? '-' : '+'}{formatCurrency(parseFloat(trans.amount || 0))}
                        </p>
                        <p className="text-xs text-gray-500">{isExpense ? 'Expense' : 'Income'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


      </div>
    </Layout>
  );
}
