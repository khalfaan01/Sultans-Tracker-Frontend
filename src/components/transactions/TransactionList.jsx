// TransactionList.jsx
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTransactions } from '../../contexts/TransactionsContext';
import TransactionMoodTracker from '../dashboard/TransactionMoodTracker';
import { useNavigate } from 'react-router-dom'; 
import { ArrowLeft } from 'lucide-react';

export default function TransactionList() {
  const { transactions = [], loading, error: contextError } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  // Clear errors when component unmounts or transactions update
  useEffect(() => {
    setLocalError('');
  }, [transactions]);

  // Validate transaction data
  const isValidTransaction = useCallback((tx) => {
    if (!tx || typeof tx !== 'object') return false;
    
    const hasValidAmount = typeof tx.amount === 'number' && !isNaN(tx.amount);
    const hasValidDate = tx.date && !isNaN(new Date(tx.date).getTime());
    
    return hasValidAmount && hasValidDate;
  }, []);

  // Filter and sort transactions with error handling
  const filteredAndSortedTransactions = useMemo(() => {
    try {
      // Validate transactions array
      if (!Array.isArray(transactions)) {
        console.error('Invalid transactions data:', transactions);
        setLocalError('Invalid transaction data format');
        return [];
      }

      const searchLower = searchTerm.toLowerCase().trim();
      
      // Filter with validation
      const filtered = transactions.filter(tx => {
        if (!isValidTransaction(tx)) {
          console.warn('Invalid transaction skipped:', tx);
          return false;
        }

        const description = tx.description || '';
        const category = tx.category || '';
        
        return searchTerm === '' || 
               description.toLowerCase().includes(searchLower) ||
               category.toLowerCase().includes(searchLower);
      });

      // Sort with error handling
      return filtered.sort((a, b) => {
        try {
          let aValue, bValue;
          
          switch (sortBy) {
            case 'amount':
              aValue = Math.abs(Number(a.amount) || 0);
              bValue = Math.abs(Number(b.amount) || 0);
              break;
            case 'date':
              aValue = new Date(a.date || 0).getTime();
              bValue = new Date(b.date || 0).getTime();
              break;
            case 'category':
              aValue = (a.category || '').toLowerCase();
              bValue = (b.category || '').toLowerCase();
              break;
            default:
              aValue = a[sortBy] || '';
              bValue = b[sortBy] || '';
          }

          // Handle comparison safely
          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        } catch (sortErr) {
          console.error('Error sorting transactions:', sortErr);
          return 0; // Keep original order on error
        }
      });
    } catch (filterErr) {
      console.error('Error filtering transactions:', filterErr);
      setLocalError('Failed to filter and sort transactions');
      return [];
    }
  }, [transactions, searchTerm, sortBy, sortOrder, isValidTransaction]);

  // Handle sort with validation
  const handleSort = useCallback((field) => {
    if (!['date', 'amount', 'category'].includes(field)) {
      console.warn('Invalid sort field:', field);
      return;
    }
    
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setLocalError('');
  }, [sortBy, sortOrder]);

  // Handle search input
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value.slice(0, 100)); // Limit search term length
    setLocalError('');
  }, []);

  // Format amount safely
  const formatAmount = useCallback((amount) => {
    try {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount)) return '$0.00';
      
      const isPositive = numericAmount >= 0;
      const sign = isPositive ? '+' : '';
      const absoluteAmount = Math.abs(numericAmount);
      
      return `${sign}$${absoluteAmount.toFixed(2)}`;
    } catch {
      return '$0.00';
    }
  }, []);

  // Format date safely
  const formatDate = useCallback((dateString) => {
    try {
      if (!dateString) return 'Invalid date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  // Error state
  const displayError = contextError || localError;
  if (displayError && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{displayError}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">{displayError}</span>
            </div>
            <button 
              onClick={() => setLocalError('')}
              className="text-red-700 hover:text-red-900 text-lg"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}
            <button
              onClick={() => navigate('/dashboard/transactions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Transactions
            </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">All Transactions</h2>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions by description or category..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50"
            maxLength={100}
            aria-label="Search transactions"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          disabled={loading || transactions.length === 0}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 min-w-[150px]"
          aria-label="Sort transactions"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="category">Sort by Category</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-700">Description</th>
                <th className="text-left p-4 font-medium text-gray-700">Category</th>
                <th className="text-left p-4 font-medium text-gray-700">Date</th>
                <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                <th className="text-left p-4 font-medium text-gray-700">Mood</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    {searchTerm 
                      ? 'No transactions found matching your search.' 
                      : 'No transactions found.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedTransactions.map((transaction, index) => {
                  const isValidTx = isValidTransaction(transaction);
                  if (!isValidTx) return null;
                  
                  return (
                    <motion.tr
                      key={transaction.id || `tx-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.description || 'No description'}
                          </div>
                          {transaction.flagged && (
                            <span className="inline-block mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                              Flagged
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-800">
                          {transaction.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-4">
                        <TransactionMoodTracker 
                          transaction={transaction}
                          onMoodAdded={() => {
                            // Optional: Add toast notification or state update
                          }}
                        />
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Footer */}
      {filteredAndSortedTransactions.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}