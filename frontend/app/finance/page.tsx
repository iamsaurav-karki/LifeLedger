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
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import ConfirmModal from '@/components/ConfirmModal';
import Pagination from '@/components/Pagination';

interface ExpenseForm {
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  paymentMethod?: string;
  tags?: string;
}

interface IncomeForm {
  amount: string;
  source: string;
  description: string;
  date: string;
  paymentMethod?: string;
  tags?: string;
}

interface InvestmentForm {
  type: string;
  amount: string;
  currentValue?: string;
  name: string;
  description?: string;
  date: string;
  categoryId?: string;
  customType?: string;
}

interface LendingForm {
  type: 'lend' | 'borrow';
  amount: string;
  personName: string;
  description?: string;
  workDescription?: string;
  date: string;
  dueDate?: string;
  status?: 'pending' | 'partially_paid' | 'paid';
  paidAmount?: string;
}

type FilterPeriod = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
type FinanceTab = 'expenses' | 'income' | 'investments' | 'lendings';

export default function FinancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FinanceTab>('expenses');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [lendings, setLendings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [investmentCategories, setInvestmentCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showLendingForm, setShowLendingForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [editingLending, setEditingLending] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'expense' | 'investment'>('expense');
  const [showCustomInvestmentType, setShowCustomInvestmentType] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [selectedIncomes, setSelectedIncomes] = useState<Set<string>>(new Set());
  const [selectedInvestments, setSelectedInvestments] = useState<Set<string>>(new Set());
  const [selectedLendings, setSelectedLendings] = useState<Set<string>>(new Set());
  const [expensesPage, setExpensesPage] = useState(1);
  const [incomesPage, setIncomesPage] = useState(1);
  const [investmentsPage, setInvestmentsPage] = useState(1);
  const [lendingsPage, setLendingsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    register: registerExpense, 
    handleSubmit: handleExpenseSubmit, 
    reset: resetExpense,
    setValue: setExpenseValue,
    formState: { errors: expenseErrors } 
  } = useForm<ExpenseForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });

  const { 
    register: registerIncome, 
    handleSubmit: handleIncomeSubmit, 
    reset: resetIncome,
    setValue: setIncomeValue,
    formState: { errors: incomeErrors } 
  } = useForm<IncomeForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });

  const { 
    register: registerInvestment, 
    handleSubmit: handleInvestmentSubmit, 
    reset: resetInvestment,
    setValue: setInvestmentValue,
    formState: { errors: investmentErrors } 
  } = useForm<InvestmentForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'sip',
      name: '',
    }
  });

  const { 
    register: registerLending, 
    handleSubmit: handleLendingSubmit, 
    reset: resetLending,
    setValue: setLendingValue,
    watch: watchLending,
    formState: { errors: lendingErrors } 
  } = useForm<LendingForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'lend',
      status: 'pending',
      paidAmount: '0',
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
      case 'thisYear':
        return {
          startDate: startOfYear(now).toISOString().split('T')[0],
          endDate: endOfYear(now).toISOString().split('T')[0],
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

      const [expensesRes, incomesRes, investmentsRes, lendingsRes, categoriesRes, investmentCategoriesRes] = await Promise.all([
        api.get('/finance/expenses', { params }),
        api.get('/finance/income', { params }),
        api.get('/finance/investments', { params }),
        api.get('/finance/lendings', { params }),
        api.get('/finance/categories/expense'),
        api.get('/finance/categories/investment'),
      ]);
      setExpenses(expensesRes.data || []);
      setIncomes(incomesRes.data || []);
      setInvestments(investmentsRes.data || []);
      setLendings(lendingsRes.data || []);
      setCategories(categoriesRes.data || []);
      setInvestmentCategories(investmentCategoriesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const onExpenseSubmit = async (data: ExpenseForm) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        ...data,
        amount: parseFloat(data.amount),
      };

      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
      }

      if (isNaN(payload.amount) || payload.amount <= 0) {
        setError('Amount must be a positive number');
        setSubmitting(false);
        return;
      }

      if (editingExpense) {
        await api.patch(`/finance/expenses/${editingExpense.id}`, payload);
        setSuccess('Expense updated successfully!');
        setEditingExpense(null);
      } else {
        await api.post('/finance/expenses', payload);
        setSuccess('Expense added successfully!');
      }
      
      setShowExpenseForm(false);
      resetExpense();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving expense:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save expense';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const onIncomeSubmit = async (data: IncomeForm) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        ...data,
        amount: parseFloat(data.amount),
      };

      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
      }

      if (isNaN(payload.amount) || payload.amount <= 0) {
        setError('Amount must be a positive number');
        setSubmitting(false);
        return;
      }

      if (editingIncome) {
        await api.patch(`/finance/income/${editingIncome.id}`, payload);
        setSuccess('Income updated successfully!');
        setEditingIncome(null);
      } else {
        await api.post('/finance/income', payload);
        setSuccess('Income added successfully!');
      }
      
      setShowIncomeForm(false);
      resetIncome();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving income:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save income';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setExpenseValue('amount', expense.amount.toString());
    setExpenseValue('description', expense.description || '');
    setExpenseValue('date', expense.date);
    setExpenseValue('categoryId', expense.categoryId);
    setExpenseValue('paymentMethod', expense.paymentMethod || '');
    setExpenseValue('tags', expense.tags?.join(', ') || '');
    setShowExpenseForm(true);
    setShowIncomeForm(false);
  };

  const handleEditIncome = (income: any) => {
    setEditingIncome(income);
    setIncomeValue('amount', income.amount.toString());
    setIncomeValue('source', income.source || '');
    setIncomeValue('description', income.description || '');
    setIncomeValue('date', income.date);
    setIncomeValue('paymentMethod', income.paymentMethod || '');
    setIncomeValue('tags', income.tags?.join(', ') || '');
    setShowIncomeForm(true);
    setShowExpenseForm(false);
  };

  const handleDeleteExpense = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/finance/expenses/${id}`);
          setSuccess('Expense deleted successfully!');
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError(error.response?.data?.message || 'Failed to delete expense');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

  const handleDeleteIncome = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Income',
      message: 'Are you sure you want to delete this income? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/finance/income/${id}`);
          setSuccess('Income deleted successfully!');
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError(error.response?.data?.message || 'Failed to delete income');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

  const onInvestmentSubmit = async (data: InvestmentForm) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        type: data.type === 'custom' ? 'other' : data.type,
        amount: parseFloat(data.amount),
        name: data.name.trim(),
        date: data.date,
      };

      if (data.currentValue) {
        payload.currentValue = parseFloat(data.currentValue);
      }

      if (data.description) {
        payload.description = data.description.trim();
      }

      if (data.categoryId) {
        payload.categoryId = data.categoryId;
      }

      // If custom type, store it in the name or description
      if (data.type === 'custom' && data.customType) {
        payload.name = data.customType.trim() + (data.name ? ` - ${data.name}` : '');
      }

      if (isNaN(payload.amount) || payload.amount <= 0) {
        setError('Amount must be a positive number');
        setSubmitting(false);
        return;
      }

      if (!payload.name || payload.name.trim() === '') {
        setError('Investment name is required');
        setSubmitting(false);
        return;
      }

      if (editingInvestment) {
        await api.patch(`/finance/investments/${editingInvestment.id}`, payload);
        setSuccess('Investment updated successfully!');
        setEditingInvestment(null);
      } else {
        await api.post('/finance/investments', payload);
        setSuccess('Investment added successfully!');
      }
      
      setShowInvestmentForm(false);
      setShowCustomInvestmentType(false);
      resetInvestment();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving investment:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save investment';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const onLendingSubmit = async (data: LendingForm) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        type: data.type,
        amount: parseFloat(data.amount),
        personName: data.personName.trim(),
        date: data.date, // Already in YYYY-MM-DD format from date input
      };

      if (data.description && data.description.trim()) {
        payload.description = data.description.trim();
      }

      if (data.workDescription && data.workDescription.trim()) {
        payload.workDescription = data.workDescription.trim();
      }

      // Only include dueDate if it's provided, not empty, and is a valid date
      if (data.dueDate && data.dueDate.trim() && data.dueDate !== '') {
        // Date input already provides YYYY-MM-DD format (ISO 8601)
        // Validate it's a proper date string
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(data.dueDate)) {
          payload.dueDate = data.dueDate;
        }
        // If it's not in the right format, don't include it (optional field)
      }

      if (data.status) {
        payload.status = data.status;
      }

      if (isNaN(payload.amount) || payload.amount <= 0) {
        setError('Amount must be a positive number');
        setSubmitting(false);
        return;
      }

      if (!payload.personName || payload.personName.trim() === '') {
        setError('Person name is required');
        setSubmitting(false);
        return;
      }

      // Include paidAmount for updates (backend supports it via UpdateLendingDto)
      if (editingLending) {
        if (data.paidAmount !== undefined && data.paidAmount !== '') {
          const paidAmount = parseFloat(data.paidAmount);
          if (!isNaN(paidAmount) && paidAmount >= 0) {
            payload.paidAmount = paidAmount;
          }
        }
        await api.patch(`/finance/lendings/${editingLending.id}`, payload);
        setSuccess('Lending record updated successfully!');
        setEditingLending(null);
      } else {
        // For create, don't send paidAmount - backend sets it to 0 by default
        await api.post('/finance/lendings', payload);
        setSuccess('Lending record added successfully!');
      }
      
      setShowLendingForm(false);
      resetLending();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving lending:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save lending record';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInvestment = (investment: any) => {
    setEditingInvestment(investment);
    const investmentType = investment.type === 'other' ? 'custom' : investment.type;
    setInvestmentValue('type', investmentType);
    setInvestmentValue('amount', investment.amount.toString());
    setInvestmentValue('currentValue', investment.currentValue?.toString() || '');
    setInvestmentValue('name', investment.name || '');
    setInvestmentValue('description', investment.description || '');
    setInvestmentValue('date', investment.date);
    setInvestmentValue('categoryId', investment.categoryId || '');
    setShowCustomInvestmentType(investmentType === 'custom');
    if (investmentType === 'custom') {
      // Extract custom type name if it's stored in the name field
      setInvestmentValue('customType', investment.name || '');
    }
    setShowInvestmentForm(true);
    setShowLendingForm(false);
  };

  const handleEditLending = (lending: any) => {
    setEditingLending(lending);
    setLendingValue('type', lending.type);
    setLendingValue('amount', lending.amount.toString());
    setLendingValue('personName', lending.personName);
    setLendingValue('description', lending.description || '');
    setLendingValue('workDescription', lending.workDescription || '');
    setLendingValue('date', lending.date);
    setLendingValue('dueDate', lending.dueDate || '');
    setLendingValue('status', lending.status || 'pending');
    setLendingValue('paidAmount', lending.paidAmount?.toString() || '0');
    setShowLendingForm(true);
    setShowInvestmentForm(false);
  };

  const handleDeleteInvestment = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Investment',
      message: 'Are you sure you want to delete this investment? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/finance/investments/${id}`);
          setSuccess('Investment deleted successfully!');
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError(error.response?.data?.message || 'Failed to delete investment');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

  const handleDeleteLending = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Lending Record',
      message: 'Are you sure you want to delete this lending record? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/finance/lendings/${id}`);
          setSuccess('Lending record deleted successfully!');
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
          setError(error.response?.data?.message || 'Failed to delete lending record');
          setConfirmModal({ ...confirmModal, isOpen: false });
          setTimeout(() => setError(''), 5000);
        }
      },
      variant: 'danger',
    });
  };

  const handleBulkDelete = async (type: 'expense' | 'income' | 'investment' | 'lending') => {
    let selected: Set<string>;
    let endpoint: string;
    let name: string;
    
    if (type === 'expense') {
      selected = selectedExpenses;
      endpoint = 'expenses';
      name = 'Expense';
    } else if (type === 'income') {
      selected = selectedIncomes;
      endpoint = 'income';
      name = 'Income';
    } else if (type === 'investment') {
      selected = selectedInvestments;
      endpoint = 'investments';
      name = 'Investment';
    } else {
      selected = selectedLendings;
      endpoint = 'lendings';
      name = 'Lending';
    }
    
    if (selected.size === 0) {
      setError('Please select items to delete');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: `Delete ${selected.size} ${name}(s)`,
      message: `Are you sure you want to delete ${selected.size} selected ${name}(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(
            Array.from(selected).map(id => 
              api.delete(`/finance/${endpoint}/${id}`)
            )
          );
          setSuccess(`${selected.size} ${name}(s) deleted successfully!`);
          if (type === 'expense') setSelectedExpenses(new Set());
          else if (type === 'income') setSelectedIncomes(new Set());
          else if (type === 'investment') setSelectedInvestments(new Set());
          else setSelectedLendings(new Set());
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
      await api.post('/finance/categories', {
        type: categoryType,
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

  const filteredExpenses = expenses.filter(exp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exp.category?.name?.toLowerCase().includes(query) ||
      exp.description?.toLowerCase().includes(query) ||
      exp.amount?.toString().includes(query) ||
      exp.paymentMethod?.toLowerCase().includes(query) ||
      exp.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  });

  const filteredInvestments = investments.filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.name?.toLowerCase().includes(query) ||
      inv.description?.toLowerCase().includes(query) ||
      inv.type?.toLowerCase().includes(query) ||
      inv.amount?.toString().includes(query)
    );
  });

  const filteredLendings = lendings.filter(lend => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lend.personName?.toLowerCase().includes(query) ||
      lend.description?.toLowerCase().includes(query) ||
      lend.workDescription?.toLowerCase().includes(query) ||
      lend.amount?.toString().includes(query)
    );
  });

  const filteredIncomes = incomes.filter(inc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inc.source?.toLowerCase().includes(query) ||
      inc.description?.toLowerCase().includes(query) ||
      inc.amount?.toString().includes(query) ||
      inc.paymentMethod?.toLowerCase().includes(query) ||
      inc.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  });

  // Pagination logic for each section (after all filtered data is defined)
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const paginatedExpenses = getPaginatedData(filteredExpenses, expensesPage);
  const paginatedIncomes = getPaginatedData(filteredIncomes, incomesPage);
  const paginatedInvestments = getPaginatedData(filteredInvestments, investmentsPage);
  const paginatedLendings = getPaginatedData(filteredLendings, lendingsPage);

  const expensesTotalPages = getTotalPages(filteredExpenses);
  const incomesTotalPages = getTotalPages(filteredIncomes);
  const investmentsTotalPages = getTotalPages(filteredInvestments);
  const lendingsTotalPages = getTotalPages(filteredLendings);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setExpensesPage(1);
    setIncomesPage(1);
    setInvestmentsPage(1);
    setLendingsPage(1);
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
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <div className="space-x-2">
            {activeTab === 'expenses' && (
              <button
                onClick={() => {
                  setShowExpenseForm(!showExpenseForm);
                  setShowIncomeForm(false);
                  setShowInvestmentForm(false);
                  setShowLendingForm(false);
                  setEditingExpense(null);
                  setError('');
                  setSuccess('');
                  resetExpense();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                {showExpenseForm ? 'Cancel' : 'Add Expense'}
              </button>
            )}
            {activeTab === 'income' && (
              <button
                onClick={() => {
                  setShowIncomeForm(!showIncomeForm);
                  setShowExpenseForm(false);
                  setShowInvestmentForm(false);
                  setShowLendingForm(false);
                  setEditingIncome(null);
                  setError('');
                  setSuccess('');
                  resetIncome();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                {showIncomeForm ? 'Cancel' : 'Add Income'}
              </button>
            )}
            {activeTab === 'investments' && (
              <button
                onClick={() => {
                  setShowInvestmentForm(!showInvestmentForm);
                  setShowExpenseForm(false);
                  setShowIncomeForm(false);
                  setShowLendingForm(false);
                  setEditingInvestment(null);
                  setError('');
                  setSuccess('');
                  resetInvestment();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showInvestmentForm ? 'Cancel' : 'Add Investment'}
              </button>
            )}
            {activeTab === 'lendings' && (
              <button
                onClick={() => {
                  setShowLendingForm(!showLendingForm);
                  setShowExpenseForm(false);
                  setShowIncomeForm(false);
                  setShowInvestmentForm(false);
                  setEditingLending(null);
                  setError('');
                  setSuccess('');
                  resetLending();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                {showLendingForm ? 'Cancel' : 'Add Lending'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(['expenses', 'income', 'investments', 'lendings'] as FinanceTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setShowExpenseForm(false);
                  setShowIncomeForm(false);
                  setShowInvestmentForm(false);
                  setShowLendingForm(false);
                  setEditingExpense(null);
                  setEditingIncome(null);
                  setEditingInvestment(null);
                  setEditingLending(null);
                }}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Period</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              >
                <option value="all">All Time</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
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
                placeholder="Search transactions..."
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

        {/* Category Creation Form */}
        {showCategoryForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value as 'expense' | 'investment')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                >
                  <option value="expense">Expense</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  placeholder="Enter category name"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleCreateCategory}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleExpenseSubmit(onExpenseSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...registerExpense('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                      validate: (value) => {
                        const num = parseFloat(value);
                        return !isNaN(num) && num > 0 || 'Amount must be a valid positive number';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      expenseErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00"
                  />
                  {expenseErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{expenseErrors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerExpense('date', { required: 'Date is required' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      expenseErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {expenseErrors.date && (
                    <p className="text-red-500 text-sm mt-1">{expenseErrors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      {...registerExpense('categoryId', { required: 'Category is required' })}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                        expenseErrors.categoryId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryType('expense');
                        setShowCategoryForm(true);
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                      title="Add new category"
                    >
                      + Add
                    </button>
                  </div>
                  {expenseErrors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{expenseErrors.categoryId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    {...registerExpense('paymentMethod')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    {...registerExpense('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    {...registerExpense('tags')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="e.g., urgent, business, personal"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
              </button>
            </form>
          </div>
        )}

        {/* Income Form */}
        {showIncomeForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{editingIncome ? 'Edit Income' : 'Add Income'}</h2>
            <form onSubmit={handleIncomeSubmit(onIncomeSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...registerIncome('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                      validate: (value) => {
                        const num = parseFloat(value);
                        return !isNaN(num) && num > 0 || 'Amount must be a valid positive number';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      incomeErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00"
                  />
                  {incomeErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{incomeErrors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerIncome('date', { required: 'Date is required' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      incomeErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {incomeErrors.date && (
                    <p className="text-red-500 text-sm mt-1">{incomeErrors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    {...registerIncome('source')}
                    placeholder="e.g., Salary, Freelance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    {...registerIncome('paymentMethod')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    {...registerIncome('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    {...registerIncome('tags')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="e.g., salary, bonus, freelance"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingIncome ? 'Update Income' : 'Save Income'}
              </button>
            </form>
          </div>
        )}

        {/* Investment Form */}
        {showInvestmentForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{editingInvestment ? 'Edit Investment' : 'Add Investment'}</h2>
            <form onSubmit={handleInvestmentSubmit(onInvestmentSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerInvestment('type', { required: 'Investment type is required' })}
                    onChange={(e) => {
                      setInvestmentValue('type', e.target.value);
                      setShowCustomInvestmentType(e.target.value === 'custom');
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      investmentErrors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  >
                    <option value="sip">SIP</option>
                    <option value="fixed_deposit">FD (Fixed Deposit)</option>
                    <option value="stock">Stocks</option>
                    <option value="mutual_fund">Mutual Fund</option>
                    <option value="bond">Bond</option>
                    <option value="cid">CID</option>
                    <option value="ssf">SSF</option>
                    <option value="crypto">Crypto</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="custom">Other (Custom)</option>
                  </select>
                  {investmentErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{investmentErrors.type.message}</p>
                  )}
                </div>
                {showCustomInvestmentType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Type Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...registerInvestment('customType', { 
                        required: showCustomInvestmentType ? 'Custom type name is required' : false 
                      })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                        investmentErrors.customType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder="e.g., Gold, Property, etc."
                    />
                    {investmentErrors.customType && (
                      <p className="text-red-500 text-sm mt-1">{investmentErrors.customType.message}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerInvestment('name', { 
                      required: 'Investment name is required',
                      minLength: { value: 1, message: 'Investment name cannot be empty' }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      investmentErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="e.g., HDFC SIP, Reliance Stocks"
                  />
                  {investmentErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{investmentErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount Invested <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...registerInvestment('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                      validate: (value) => {
                        const num = parseFloat(value);
                        return !isNaN(num) && num > 0 || 'Amount must be a valid positive number';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      investmentErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00"
                  />
                  {investmentErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{investmentErrors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...registerInvestment('currentValue', {
                      validate: (value) => {
                        if (!value) return true;
                        const num = parseFloat(value);
                        return !isNaN(num) && num >= 0 || 'Current value must be a valid number';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      investmentErrors.currentValue ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00"
                  />
                  {investmentErrors.currentValue && (
                    <p className="text-red-500 text-sm mt-1">{investmentErrors.currentValue.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerInvestment('date', { required: 'Date is required' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      investmentErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {investmentErrors.date && (
                    <p className="text-red-500 text-sm mt-1">{investmentErrors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...registerInvestment('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingInvestment ? 'Update Investment' : 'Save Investment'}
              </button>
            </form>
          </div>
        )}

        {/* Lending Form */}
        {showLendingForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{editingLending ? 'Edit Lending Record' : 'Add Lending Record'}</h2>
            <form onSubmit={handleLendingSubmit(onLendingSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerLending('type', { required: 'Type is required' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      lendingErrors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  >
                    <option value="lend">Money to Receive (Lent)</option>
                    <option value="borrow">Money to Pay (Borrowed)</option>
                  </select>
                  {lendingErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{lendingErrors.type.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...registerLending('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                      validate: (value) => {
                        const num = parseFloat(value);
                        return !isNaN(num) && num > 0 || 'Amount must be a valid positive number';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      lendingErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00"
                  />
                  {lendingErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{lendingErrors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerLending('personName', { 
                      required: 'Person name is required',
                      minLength: { value: 1, message: 'Person name cannot be empty' }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      lendingErrors.personName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="Name of person"
                  />
                  {lendingErrors.personName && (
                    <p className="text-red-500 text-sm mt-1">{lendingErrors.personName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerLending('date', { required: 'Date is required' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      lendingErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  />
                  {lendingErrors.date && (
                    <p className="text-red-500 text-sm mt-1">{lendingErrors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason/Description</label>
                  <textarea
                    {...registerLending('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Reason for lending/borrowing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work/Service Description</label>
                  <textarea
                    {...registerLending('workDescription')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Description of work or service (if applicable)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    {...registerLending('dueDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    {...registerLending('status')}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'pending' | 'partially_paid' | 'paid';
                      setLendingValue('status', newStatus);
                      
                      // Auto-set paidAmount based on status
                      const currentAmount = parseFloat(watchLending('amount') || '0');
                      if (newStatus === 'paid') {
                        // When status is "paid", set paidAmount to full amount
                        setLendingValue('paidAmount', currentAmount.toString());
                      } else if (newStatus === 'pending') {
                        // When status is "pending", reset paidAmount to 0
                        setLendingValue('paidAmount', '0');
                      }
                      // For "partially_paid", keep the current paidAmount value
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...registerLending('paidAmount', {
                      validate: (value) => {
                        if (!value) return true;
                        const num = parseFloat(value);
                        return !isNaN(num) && num >= 0 || 'Paid amount must be a valid number';
                      }
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                      lendingErrors.paidAmount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="0.00"
                  />
                  {lendingErrors.paidAmount && (
                    <p className="text-red-500 text-sm mt-1">{lendingErrors.paidAmount.message}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingLending ? 'Update Lending Record' : 'Save Lending Record'}
              </button>
            </form>
          </div>
        )}

        {/* Expenses Table */}
        {activeTab === 'expenses' && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expenses</h2>
            {selectedExpenses.size > 0 && (
              <button
                onClick={() => handleBulkDelete('expense')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
              >
                Delete Selected ({selectedExpenses.size})
              </button>
            )}
          </div>
          {filteredExpenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={paginatedExpenses.length > 0 && paginatedExpenses.every(exp => selectedExpenses.has(exp.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedExpenses);
                            paginatedExpenses.forEach(exp => newSet.add(exp.id));
                            setSelectedExpenses(newSet);
                          } else {
                            const newSet = new Set(selectedExpenses);
                            paginatedExpenses.forEach(exp => newSet.delete(exp.id));
                            setSelectedExpenses(newSet);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.has(expense.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedExpenses);
                            if (e.target.checked) {
                              newSet.add(expense.id);
                            } else {
                              newSet.delete(expense.id);
                            }
                            setSelectedExpenses(newSet);
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {expense.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {expense.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {expense.paymentMethod ? expense.paymentMethod.replace('_', ' ') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {expense.tags && expense.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {expense.tags.map((tag: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                        {formatCurrency(parseFloat(expense.amount))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900"
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
          {filteredExpenses.length > 0 && (
            <Pagination
              currentPage={expensesPage}
              totalPages={expensesTotalPages}
              onPageChange={setExpensesPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredExpenses.length}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
          </div>
        )}

        {/* Incomes Table */}
        {activeTab === 'income' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Income</h2>
            {selectedIncomes.size > 0 && (
              <button
                onClick={() => handleBulkDelete('income')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
              >
                Delete Selected ({selectedIncomes.size})
              </button>
            )}
          </div>
          {filteredIncomes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No income records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={paginatedIncomes.length > 0 && paginatedIncomes.every(inc => selectedIncomes.has(inc.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedIncomes);
                            paginatedIncomes.forEach(inc => newSet.add(inc.id));
                            setSelectedIncomes(newSet);
                          } else {
                            const newSet = new Set(selectedIncomes);
                            paginatedIncomes.forEach(inc => newSet.delete(inc.id));
                            setSelectedIncomes(newSet);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedIncomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIncomes.has(income.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIncomes);
                            if (e.target.checked) {
                              newSet.add(income.id);
                            } else {
                              newSet.delete(income.id);
                            }
                            setSelectedIncomes(newSet);
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(income.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {income.source || 'Income'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {income.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {income.paymentMethod ? income.paymentMethod.replace('_', ' ') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {income.tags && income.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {income.tags.map((tag: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                        {formatCurrency(parseFloat(income.amount))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditIncome(income)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(income.id)}
                          className="text-red-600 hover:text-red-900"
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
          {filteredIncomes.length > 0 && (
            <Pagination
              currentPage={incomesPage}
              totalPages={incomesTotalPages}
              onPageChange={setIncomesPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredIncomes.length}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
          </div>
        )}

        {/* Investments Table */}
        {activeTab === 'investments' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Investments</h2>
              {selectedInvestments.size > 0 && (
                <button
                  onClick={() => handleBulkDelete('investment')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  Delete Selected ({selectedInvestments.size})
                </button>
              )}
            </div>
            {filteredInvestments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No investments found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedInvestments.length > 0 && paginatedInvestments.every(inv => selectedInvestments.has(inv.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSet = new Set(selectedInvestments);
                              paginatedInvestments.forEach(inv => newSet.add(inv.id));
                              setSelectedInvestments(newSet);
                            } else {
                              const newSet = new Set(selectedInvestments);
                              paginatedInvestments.forEach(inv => newSet.delete(inv.id));
                              setSelectedInvestments(newSet);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Invested</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedInvestments.map((investment) => (
                      <tr key={investment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedInvestments.has(investment.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedInvestments);
                              if (e.target.checked) {
                                newSet.add(investment.id);
                              } else {
                                newSet.delete(investment.id);
                              }
                              setSelectedInvestments(newSet);
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(investment.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {investment.type?.toUpperCase().replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {investment.name || 'Unnamed Investment'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {investment.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right">
                          {formatCurrency(parseFloat(investment.amount))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {investment.currentValue ? (
                            <span className={parseFloat(investment.currentValue) >= parseFloat(investment.amount) ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                              {formatCurrency(parseFloat(investment.currentValue))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditInvestment(investment)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInvestment(investment.id)}
                            className="text-red-600 hover:text-red-900"
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
          {filteredInvestments.length > 0 && (
            <Pagination
              currentPage={investmentsPage}
              totalPages={investmentsTotalPages}
              onPageChange={setInvestmentsPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredInvestments.length}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
          </div>
        )}

        {/* Lendings Table */}
        {activeTab === 'lendings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Lendings & Borrowings</h2>
              {selectedLendings.size > 0 && (
                <button
                  onClick={() => handleBulkDelete('lending')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  Delete Selected ({selectedLendings.size})
                </button>
              )}
            </div>
            {filteredLendings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No lending/borrowing records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedLendings.length > 0 && paginatedLendings.every(lend => selectedLendings.has(lend.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSet = new Set(selectedLendings);
                              paginatedLendings.forEach(lend => newSet.add(lend.id));
                              setSelectedLendings(newSet);
                            } else {
                              const newSet = new Set(selectedLendings);
                              paginatedLendings.forEach(lend => newSet.delete(lend.id));
                              setSelectedLendings(newSet);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work/Service</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLendings.map((lending) => {
                      const pendingAmount = parseFloat(lending.amount) - parseFloat(lending.paidAmount || 0);
                      return (
                        <tr key={lending.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLendings.has(lending.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLendings);
                                if (e.target.checked) {
                                  newSet.add(lending.id);
                                } else {
                                  newSet.delete(lending.id);
                                }
                                setSelectedLendings(newSet);
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {format(new Date(lending.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded ${
                              lending.type === 'lend' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {lending.type === 'lend' ? '📤 To Receive' : '📥 To Pay'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {lending.personName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {lending.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {lending.workDescription || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right">
                            {formatCurrency(parseFloat(lending.amount))}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">
                            {formatCurrency(parseFloat(lending.paidAmount || 0))}
                          </td>
                          <td className={`px-4 py-3 text-sm font-bold text-right ${
                            pendingAmount > 0 ? (lending.type === 'lend' ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
                          }`}>
                            {formatCurrency(pendingAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded ${
                              lending.status === 'paid' ? 'bg-green-100 text-green-800' :
                              lending.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {lending.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditLending(lending)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLending(lending.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
              </table>
            </div>
          )}
          {filteredLendings.length > 0 && (
            <Pagination
              currentPage={lendingsPage}
              totalPages={lendingsTotalPages}
              onPageChange={setLendingsPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredLendings.length}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
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
