// src/components/dashboard/TransactionsPage.jsx
import { motion } from 'framer-motion';
import { 
  Plus, Search, Trash2, AlertTriangle, Calendar, BarChart3  
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useTransactions } from '../../contexts';

// Components
import TransactionMoodTracker from './TransactionMoodTracker';
import CalendarView from './CalendarView';
import MultiFilter from '../ui/MultiFilter';

/**
 * Main Transactions Page Component
 * 
 * Features:
 * - Transaction list with filtering
 * - Mood tracking integration
 * - Calendar view toggle
 * - Real-time updates
 */
export default function TransactionsPage({ filters = {} }) {
  const { 
    transactions = [], 
    loading, 
    error, 
    deleteTransaction, 
    createTransaction, 
    defaultTransaction = {
      type: 'expense',
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      description: ''
    },
    clearError 
  } = useTransactions();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState(defaultTransaction);
  const [activeView, setActiveView] = useState('list');
  const [localFilters, setLocalFilters] = useState({
    dateRange: null,
    amountRange: null,
    categories: [],
    type: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionError, setSubmissionError] = useState(null);

  // Create safe filters with default values
  const safeFilters = useCallback(() => {
    try {
      return {
        categories: Array.isArray(filters?.categories) ? filters.categories : [],
        type: ['income', 'expense', 'all'].includes(filters?.type) ? filters.type : 'all',
        dateRange: filters?.dateRange || null,
        amountRange: filters?.amountRange || null
      };
    } catch (err) {
      console.error('Error processing filters:', err);
      return {
        categories: [],
        type: 'all',
        dateRange: null,
        amountRange: null
      };
    }
  }, [filters]);

  // Handle adding new transaction with validation
  const handleAddTransaction = useCallback(async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    // Validate transaction data
    if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
      setSubmissionError('Please enter a valid amount greater than 0');
      return;
    }

    if (!newTransaction.date) {
      setSubmissionError('Please select a date');
      return;
    }

    // Prevent future dates
    const selectedDate = new Date(newTransaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      setSubmissionError('Future dates are not allowed. Please select today or a past date.');
      return;
    }

    try {
      const result = await createTransaction(newTransaction);
      
      if (result?.success) {
        setShowAddForm(false);
        setNewTransaction(defaultTransaction);
        
        if (result.warning) {
          // Show fraud warning as non-blocking alert
          console.warn('Fraud Detection Alert:', result.warning);
          alert(`⚠️ Fraud Detection Alert: ${result.warning}`);
        }
      } else {
        // Handle budget exceeded errors with detailed messages
        if (result?.error?.includes('exceed budget')) {
          const budgetError = `\n\nBUDGET LIMIT EXCEEDED\n\nCategory: ${result.budgetCategory}\nCurrent Spent: $${result.currentSpent?.toFixed(2) || '0.00'}\nBudget Limit: $${result.budgetLimit?.toFixed(2) || '0.00'}\nThis Transaction: $${result.transactionAmount?.toFixed(2) || '0.00'}\nWould Be Total: $${result.wouldBeTotal?.toFixed(2) || '0.00'}\n\n${result.suggestion ? `Suggestion: ${result.suggestion}` : 'Please reduce the amount or choose a different category.'}`;
          setSubmissionError(budgetError);
        } else {
          setSubmissionError(result?.error || 'Failed to add transaction');
        }
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      setSubmissionError('An unexpected error occurred while adding the transaction');
    }
  }, [newTransaction, createTransaction, defaultTransaction]);

  // Handle transaction deletion with confirmation
  const handleDelete = useCallback(async (id) => {
    if (!id) {
      console.error('Invalid transaction ID for deletion');
      return;
    }

    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const result = await deleteTransaction(id);
        if (!result?.success) {
          alert(`Error: ${result?.error || 'Failed to delete transaction'}`);
        }
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('An unexpected error occurred while deleting the transaction');
      }
    }
  }, [deleteTransaction]);

  // Filter transactions based on filters and search query
  const filteredTransactions = useCallback(() => {
    try {
      const filters = safeFilters();
      
      return transactions.filter(tx => {
        if (!tx || typeof tx !== 'object') return false;

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesDescription = tx.description?.toLowerCase().includes(query);
          const matchesCategory = tx.category?.toLowerCase().includes(query);
          const matchesAmount = tx.amount?.toString().includes(query);
          if (!matchesDescription && !matchesCategory && !matchesAmount) {
            return false;
          }
        }

        // Category filter
        if (filters.categories.length > 0 && !filters.categories.includes(tx.category)) {
          return false;
        }
        
        // Type filter
        if (filters.type !== 'all' && tx.type !== filters.type) {
          return false;
        }
        
        // Date range filter
        if (filters.dateRange) {
          const txDate = new Date(tx.date);
          
          if (filters.dateRange.start) {
            const startDate = new Date(filters.dateRange.start);
            if (txDate < startDate) return false;
          }
          
          if (filters.dateRange.end) {
            const endDate = new Date(filters.dateRange.end);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (txDate > endDate) return false;
          }
        }
        
        // Amount range filter
        if (filters.amountRange) {
          const txAmount = Math.abs(tx.amount);
          
          if (filters.amountRange.min && txAmount < parseFloat(filters.amountRange.min)) {
            return false;
          }
          
          if (filters.amountRange.max && txAmount > parseFloat(filters.amountRange.max)) {
            return false;
          }
        }
        
        return true;
      });
    } catch (err) {
      console.error('Error filtering transactions:', err);
      return []; // Return empty array on error
    }
  }, [transactions, safeFilters, searchQuery]);

  // Reset form when closed
  const resetForm = useCallback(() => {
    setShowAddForm(false);
    setNewTransaction(defaultTransaction);
    setSubmissionError(null);
  }, [defaultTransaction]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    };
  }, [clearError]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {(error || submissionError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              <span>{error || submissionError}</span>
            </div>
            {clearError && (
              <button
                onClick={clearError}
                className="text-red-700 hover:text-red-900"
                aria-label="Dismiss error"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="flex items-center space-x-3">
          {/* View Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('list')}
              disabled={loading}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50 ${
                activeView === 'list' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 size={16} className="inline mr-1" />
              List
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              disabled={loading}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50 ${
                activeView === 'calendar' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={16} className="inline mr-1" />
              Calendar
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            disabled={loading}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Plus size={20} />
            <span>Add Transaction</span>
          </motion.button>
        </div>
      </div>


      {/* MultiFilter Component */}
      <MultiFilter 
        filters={localFilters}
        onFiltersChange={setLocalFilters}
        activeTab="Transactions"
      />
      {/* Add Transaction Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Transaction</h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close form"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select today or a past date (future dates not allowed)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="Transaction description"
                maxLength={200}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                disabled={loading}
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Conditional Rendering based on Active View */}
      {activeView === 'calendar' ? (
        <CalendarView />
      ) : (
        /* Transactions List View */
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions by description, category, or amount..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="divide-y">
            {filteredTransactions().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? 'No transactions match your search.' : 'No transactions found. Add your first transaction to get started.'}
              </div>
            ) : (
              filteredTransactions().map((transaction, index) => (
                <motion.div
                  key={transaction.id || `transaction-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex justify-between items-start hover:bg-gray-50 group"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{transaction.description || 'No description'}</h3>
                            {transaction.flagged && (
                              <AlertTriangle size={16} className="text-red-500" title="Flagged for review" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {transaction.category || 'Uncategorized'} • {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'No date'}
                            {transaction.fraudReason && (
                              <span className="text-red-500 ml-2">⚠️ Suspicious</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`text-lg font-semibold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount || 0).toFixed(2)}
                        </div>
                        
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                          title="Delete transaction"
                          disabled={loading}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Mood Tracker */}
                    <div className="mt-2">
                      <TransactionMoodTracker 
                        transaction={transaction}
                        onMoodAdded={(mood) => {
                          console.log('Mood added:', mood);
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}