'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';
import { initializeAuth } from '@/lib/auth-init';
import Cookies from 'js-cookie';
import { formatCurrency } from '@/lib/currency';

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [lendings, setLendings] = useState<any[]>([]);

  useEffect(() => {
    initializeAuth();
    
    const fetchData = async () => {
      try {
        const token = useAuthStore.getState().accessToken || Cookies.get('accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const endDate = new Date();
        const startDate = subDays(endDate, 30);

        const [analyticsRes, expensesRes, incomesRes, investmentsRes, lendingsRes] = await Promise.all([
          api.get(`/finance/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/income?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/investments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          api.get(`/finance/lendings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        ]);

        setAnalytics(analyticsRes.data);
        setExpenses(expensesRes.data || []);
        setIncomes(incomesRes.data || []);
        setInvestments(investmentsRes.data || []);
        setLendings(lendingsRes.data || []);
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

  // Calculate totals - all amounts are in NPR
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue || inv.amount || 0), 0);
  const investmentProfit = totalInvestmentValue - totalInvestments;
  
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

  return (
    <Layout>
      <div>
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💰</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Total Income</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(analytics?.totalIncome || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💸</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Total Expenses</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(analytics?.totalExpenses || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📈</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Savings</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(analytics?.savings || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💼</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Total Investments</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(totalInvestments)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📊</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Investment Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(totalInvestmentValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📤</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Money to Receive</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(lendings.filter(l => l.type === 'lend').reduce((sum, l) => sum + parseFloat(l.amount || 0) - parseFloat(l.paidAmount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📥</span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Money to Pay</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(lendings.filter(l => l.type === 'borrow').reduce((sum, l) => sum + parseFloat(l.amount || 0) - parseFloat(l.paidAmount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6 mb-8">
          {/* Income vs Expenses Comparison */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Income vs Expenses (Last 7 Days)</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[500px]">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={incomeExpenseComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      stroke="#9ca3af"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      stroke="#9ca3af"
                      tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}k`}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                    />
                    <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(incomeExpenseComparison.reduce((sum, d) => sum + d.income, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(incomeExpenseComparison.reduce((sum, d) => sum + d.expenses, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Savings</p>
                <p className={`text-lg font-bold ${
                  incomeExpenseComparison.reduce((sum, d) => sum + d.savings, 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(incomeExpenseComparison.reduce((sum, d) => sum + d.savings, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income & Expense Trends */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Income & Expense Trends</h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="min-w-[400px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={incomeExpenseComparison}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
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
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconType="square"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorIncome)" 
                        name="Income"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#ef4444" 
                        fillOpacity={1} 
                        fill="url(#colorExpenses)" 
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Investment Performance */}
            {investments.length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Investment Performance</h2>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="min-w-[400px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={investmentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
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
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="invested" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          name="Amount Invested"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          name="Current Value"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories */}
            {categoryData.length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Expense by Category</h2>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="min-w-[280px] sm:min-w-[350px] mx-auto">
                    <ResponsiveContainer width="100%" height={280}>
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
                          {categoryData.map((entry: any, index: number) => (
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
                      <div key={index} className="flex items-center justify-between text-sm">
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

            {/* Investment Types */}
            {investmentTypeData.length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Investments by Type</h2>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="min-w-[280px] sm:min-w-[350px] mx-auto">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={investmentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {investmentTypeData.map((entry: any, index: number) => (
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
                  {investmentTypeData.map((item: any, index: number) => {
                    const percent = ((item.value / investmentTypeData.reduce((sum: number, d: any) => sum + d.value, 0)) * 100).toFixed(0);
                    return (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="text-gray-700 truncate">{item.name}</span>
                          <span className="text-gray-500 ml-2 flex-shrink-0">({item.count})</span>
                          <span className="text-gray-500 ml-2 flex-shrink-0">{percent}%</span>
                        </div>
                        <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{formatCurrency(item.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses yet</p>
            ) : (
              <div className="space-y-2">
                {expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="flex justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{exp.category?.name || 'Uncategorized'}</p>
                      <p className="text-xs text-gray-500">{format(new Date(exp.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <p className="font-bold text-red-600">{formatCurrency(parseFloat(exp.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Income</h2>
            {incomes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No income yet</p>
            ) : (
              <div className="space-y-2">
                {incomes.slice(0, 5).map((inc) => (
                  <div key={inc.id} className="flex justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{inc.source || 'Income'}</p>
                      <p className="text-xs text-gray-500">{format(new Date(inc.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(parseFloat(inc.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Investment Summary */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Investment Summary</h2>
          {investments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No investments yet</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInvestments)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Current Value</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalInvestmentValue)}</p>
                </div>
                <div className={`p-4 rounded ${investmentProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${investmentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(investmentProfit)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Investments by Type</h3>
                <div className="space-y-2">
                  {Object.entries(investmentsByType).map(([type, data]: [string, any]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm capitalize">{type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{data.count} investment(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(data.totalAmount)}</p>
                        {data.totalValue !== data.totalAmount && (
                          <p className={`text-xs ${data.totalValue >= data.totalAmount ? 'text-green-600' : 'text-red-600'}`}>
                            Value: {formatCurrency(data.totalValue)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Investments</h3>
                <div className="space-y-2">
                  {investments.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{inv.name || inv.type}</p>
                        <p className="text-xs text-gray-500">{format(new Date(inv.date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(parseFloat(inv.amount))}</p>
                        {inv.currentValue && (
                          <p className={`text-xs ${parseFloat(inv.currentValue) >= parseFloat(inv.amount) ? 'text-green-600' : 'text-red-600'}`}>
                            Value: {formatCurrency(parseFloat(inv.currentValue))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lending & Borrowing Summary */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Lending & Borrowing Summary</h2>
          {lendings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No lending/borrowing records yet</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-2">Money to Receive (Lent)</p>
                  <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalLent)}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Paid: {formatCurrency(totalLentPaid)}</p>
                    <p className="font-semibold">Pending: {formatCurrency(totalLentPending)}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-2">Money to Pay (Borrowed)</p>
                  <p className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(totalBorrowed)}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Paid: {formatCurrency(totalBorrowedPaid)}</p>
                    <p className="font-semibold">Pending: {formatCurrency(totalBorrowedPending)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Pending Records</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingLendings.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Completed Records</p>
                  <p className="text-2xl font-bold text-green-600">{completedLendings.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-600">{lendings.length}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Lending & Borrowing</h3>
                <div className="space-y-2">
                  {lendings.slice(0, 5).map((lend) => {
                    const pending = parseFloat(lend.amount) - parseFloat(lend.paidAmount || 0);
                    return (
                      <div key={lend.id} className="flex justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">
                            {lend.type === 'lend' ? '📤' : '📥'} {lend.personName}
                          </p>
                          <p className="text-xs text-gray-500">{format(new Date(lend.date), 'MMM dd, yyyy')}</p>
                          {lend.description && (
                            <p className="text-xs text-gray-400 mt-1">{lend.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(parseFloat(lend.amount))}</p>
                          <p className={`text-xs font-semibold ${pending > 0 ? (lend.type === 'lend' ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                            Pending: {formatCurrency(pending)}
                          </p>
                          <p className="text-xs text-gray-500">Status: {lend.status?.replace('_', ' ').toUpperCase() || 'PENDING'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
