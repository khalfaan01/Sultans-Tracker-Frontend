// TransactionsContext.jsx
import { createContext, useContext, useState } from 'react';
import { transactionsAPI } from '../services/api';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useDataLoader } from '../hooks/useDataLoader';
import { useSocket } from './SocketContext';

const TransactionsContext = createContext();

/**
 * Custom hook to access the transactions context
 * @returns {Object} Transactions context value
 * @throws {Error} If used outside of TransactionsProvider
 */
export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};

/**
 * Provider component that manages transactions state and operations with real-time monitoring
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Transactions context provider
 */
export const TransactionsProvider = ({ children }) => {
  const { requireAuthSilent } = useAuthCheck();
  const { executeAsync, loading, error, clearError } = useDataLoader({
    transactions: []
  });
  const { socket, isConnected } = useSocket();

  const [transactions, setTransactions] = useState([]);

  /**
   * Default transaction object template for form initialization
   * @type {Object}
   */
  const defaultTransaction = {
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: ''
  };

  /**
   * Loads all transactions from the API
   * @returns {Promise<Array>} Array of transaction objects
   */
  const loadTransactions = async () => {
    if (!requireAuthSilent()) return;
    
    const result = await executeAsync(async () => {
      const data = await transactionsAPI.getAll();
      setTransactions(data);
      return data;
    });
    
    return result;
  };

  /**
   * Creates a new transaction with optional real-time monitoring
   * @param {Object} transactionData - Transaction creation data
   * @returns {Promise<Object>} Creation result with success status, data, and warnings
   */
  const createTransaction = async (transactionData) => {
    requireAuthSilent();
    
    // Send transaction for real-time security monitoring via WebSocket
    if (isConnected && socket) {
    socket.emit('monitor_transaction', {
      ...transactionData,
      timestamp: new Date()
    });
  }
  
  const result = await executeAsync(async () => {
    try {
      const response = await transactionsAPI.create(transactionData);
      
      // Refresh the entire transactions list to maintain data consistency
      await loadTransactions();
      
      return {
        success: true,
        data: response,
        warning: response.warning
      };
    } catch (error) {
      // Handle budget errors from backend
      if (error.response?.status === 400 || error.response?.status === 403) {
        const errorData = error.response?.data;
        
        // Check if it's a budget limit exceeded error
        if (errorData?.error?.includes('exceed') || 
            errorData?.error?.includes('budget') ||
            errorData?.details?.budgetCategory) {
          
          return {
            success: false,
            error: errorData.error || 'Budget limit exceeded',
            budgetCategory: errorData.details?.budgetCategory,
            budgetLimit: errorData.details?.budgetLimit,
            currentSpent: errorData.details?.currentSpent,
            transactionAmount: errorData.details?.transactionAmount,
            wouldBeTotal: errorData.details?.wouldBeTotal,
            overspendAmount: errorData.details?.overspendAmount,
            suggestion: errorData.details?.suggestion
          };
        }
      }
      
      // Re-throw other errors for the executeAsync to handle
      throw error;
    }
  });
  
  return result;
};

  /**
   * Updates an existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} transactionData - Updated transaction data
   * @returns {Promise<Object>} Updated transaction object
   */
  const updateTransaction = async (id, transactionData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const updatedTransaction = await transactionsAPI.update(id, transactionData);
      setTransactions(prev => 
        prev.map(tx => tx.id === id ? updatedTransaction : tx)
      );
      return updatedTransaction;
    });
    
    return result;
  };

  /**
   * Deletes a transaction by ID
   * @param {string} id - Transaction ID to delete
   * @returns {Promise<Object>} Deletion result with ID
   */
  const deleteTransaction = async (id) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      await transactionsAPI.delete(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      return { id };
    });
    
    return result;
  };

  /**
   * Retrieves a transaction by ID from local state
   * @param {string} id - Transaction ID
   * @returns {Object|undefined} Transaction object or undefined if not found
   */
  const getTransactionById = (id) => {
    return transactions.find(tx => tx.id === id);
  };

  /**
   * Filters transactions by category
   * @param {string} category - Transaction category
   * @returns {Array} Array of transactions in the specified category
   */
  const getTransactionsByCategory = (category) => {
    return transactions.filter(tx => tx.category === category);
  };

  /**
   * Gets the most recent transactions sorted by date
   * @param {number} limit - Maximum number of transactions to return
   * @returns {Array} Array of recent transactions
   */
  const getRecentTransactions = (limit = 10) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  const value = {
    // Data
    transactions,
    defaultTransaction,
    
    // State
    loading,
    error,
    clearError,
    
    // Operations
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Queries
    getTransactionById,
    getTransactionsByCategory,
    getRecentTransactions
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};