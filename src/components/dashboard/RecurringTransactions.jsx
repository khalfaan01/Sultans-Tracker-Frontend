// src/components/dashboard/RecurringTransactions.jsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Calendar, Repeat, Trash2, Edit, Play, Pause, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recurringService } from '../../services/recurringService';
import { accountsAPI } from '../../services/api';

/**
 * Recurring transaction management interface for automated financial operations
 * 
 * Features:
 * - Creation and management of scheduled financial transactions
 * - Flexible frequency options (daily, weekly, monthly, yearly)
 * - Active/inactive status control with immediate visual feedback
 * - Auto-approval configuration for hands-free operation
 * - Real-time synchronization with financial accounts
 * 
 * Transaction Lifecycle:
 * 1. Creation: Define amount, frequency, category, and account association
 * 2. Scheduling: Automatic execution based on configured frequency
 * 3. Management: Toggle active status, edit parameters, or delete
 * 4. Execution: Automatic creation of actual transactions per schedule
 * 
 * Data Integration:
 * - Centralized recurring service for transaction lifecycle management
 * - Account API for financial account selection and validation
 * - Real-time updates with optimistic UI responses
 * 
 * Error Handling:
 * - Service-level error capture with user-friendly feedback
 * - Form validation with required field enforcement
 * - Account validation to ensure proper financial integration
 */
export default function RecurringTransactions() {
  // Component state management
  const [showForm, setShowForm] = useState(false);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const navigate = useNavigate();

  /**
   * Loads recurring transactions from the centralized service
   * Handles loading states and error conditions with user feedback
   */
  const loadRecurringTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const transactions = await recurringService.getRecurringTransactions();
      setRecurringTransactions(transactions);
    } catch (err) {
      console.error('Error loading recurring transactions:', err);
      setError('Unable to load recurring transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load on component mount
  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  /**
   * Deletes a recurring transaction with user confirmation
   * @param {string} id - Transaction identifier
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await recurringService.deleteRecurringTransaction(id);
        await loadRecurringTransactions(); // Refresh list
      } catch (err) {
        console.error('Error deleting recurring transaction:', err);
        alert('Failed to delete recurring transaction');
      }
    }
  };

  /**
   * Toggles active/inactive status of a recurring transaction
   * Provides immediate visual feedback and persists state change
   * @param {Object} transaction - Transaction object to toggle
   */
  const toggleActive = async (transaction) => {
    try {
      await recurringService.updateRecurringTransaction(transaction.id, {
        ...transaction,
        isActive: !transaction.isActive
      });
      await loadRecurringTransactions(); // Refresh list
    } catch (err) {
      console.error('Error updating recurring transaction:', err);
      alert('Failed to update recurring transaction');
    }
  };

  /**
   * Initiates edit mode for an existing transaction
   * @param {Object} transaction - Transaction to edit
   */
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  // Loading state with spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // Error state with recovery option
  if (error && recurringTransactions.length === 0) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/dashboard/transactions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Transactions
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={loadRecurringTransactions}
            className="ml-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation back to transactions */}
      <button
        onClick={() => navigate('/dashboard/transactions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>

      {/* Header with add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recurring Transactions</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingTransaction(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg"
          aria-label="Add new recurring transaction"
        >
          <Plus size={20} />
          <span>Add Recurring</span>
        </motion.button>
      </div>

      {/* Error display (non-blocking) */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Recurring transactions list */}
      <div className="grid gap-4">
        {recurringTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-lg shadow-sm border"
            role="article"
            aria-label={`${transaction.type} transaction: ${transaction.description}`}
          >
            <div className="flex items-center justify-between">
              {/* Transaction details */}
              <div className="flex items-center space-x-4">
                {/* Type indicator icon */}
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Repeat className={
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  } size={20} />
                </div>
                
                {/* Transaction metadata */}
                <div>
                  <h3 className="font-semibold">{transaction.description}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {transaction.type}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Repeat size={14} aria-hidden="true" />
                      <span>Every {transaction.frequency}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} aria-hidden="true" />
                      <span>Next: {new Date(transaction.nextRunDate).toLocaleDateString()}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {transaction.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action controls */}
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
                
                {/* Active/inactive toggle */}
                <button 
                  onClick={() => toggleActive(transaction)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
                  aria-label={transaction.isActive ? 'Pause transaction' : 'Activate transaction'}
                  title={transaction.isActive ? 'Pause' : 'Activate'}
                >
                  {transaction.isActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
                {/* Edit button */}
                <button 
                  onClick={() => handleEdit(transaction)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
                  aria-label={`Edit ${transaction.description}`}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                {/* Delete button */}
                <button 
                  onClick={() => handleDelete(transaction.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  aria-label={`Delete ${transaction.description}`}
                  title="Delete"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {recurringTransactions.length === 0 && !error && (
        <div className="text-center py-12" role="status" aria-label="No recurring transactions">
          <Repeat size={48} className="mx-auto text-gray-400 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recurring Transactions</h3>
          <p className="text-gray-500">Set up recurring transactions to automate your finances.</p>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <RecurringTransactionForm
          transaction={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSave={loadRecurringTransactions}
        />
      )}
    </div>
  );
}

/**
 * Form component for creating and editing recurring transactions
 * Handles validation, account selection, and form submission
 */
function RecurringTransactionForm({ transaction, onClose, onSave }) {
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    type: transaction?.type || 'expense',
    category: transaction?.category || 'Utilities',
    frequency: transaction?.frequency || 'monthly',
    accountId: transaction?.accountId?.toString() || '',
    isActive: transaction?.isActive ?? true,
    autoApprove: transaction?.autoApprove || false
  });

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);

  // Load available accounts for transaction association
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await accountsAPI.getAll();
        setAccounts(accountsData);
        setAccountsError(null);
        // Auto-select first account if none selected
        if (accountsData.length > 0 && !formData.accountId) {
          setFormData(prev => ({ ...prev, accountId: accountsData[0].id }));
        }
      } catch (err) {
        console.error('Error loading accounts:', err);
        setAccountsError('Unable to load accounts. Please try again.');
      }
    };
    loadAccounts();
  }, []);

  /**
   * Handles form submission with validation
   * Creates or updates recurring transaction based on context
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate amount is a valid number
  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive amount');
    return;
  }
  
  // Prepare data with proper number conversion
  const submissionData = {
    ...formData,
    amount: amount,
    accountId: parseInt(formData.accountId) || null
  };
    
    // Basic form validation
    if (!formData.description || !formData.amount || !formData.accountId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (transaction) {
        await recurringService.updateRecurringTransaction(transaction.id, formData);
      } else {
        await recurringService.createRecurringTransaction(formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving recurring transaction:', err);
      alert('Failed to save recurring transaction: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Transaction category options
  const categories = [
    'Utilities', 'Entertainment', 'Food & Dining', 'Shopping', 
    'Healthcare', 'Transportation', 'Education', 'Salary', 
    'Investment', 'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto" role="dialog" aria-label="Recurring transaction form">
        <h3 className="text-lg font-semibold mb-4">
          {transaction ? 'Edit' : 'Add'} Recurring Transaction
        </h3>
        
        {accountsError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded mb-4 text-sm">
            {accountsError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              placeholder="e.g., Netflix Subscription"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
              const value = e.target.value;
              setFormData({...formData, amount: value === '' ? '' : parseFloat(value)})
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent"
              step="0.01"
              min="0.01"
              required
              aria-required="true"
            />
          </div>

          {/* Transaction type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent"
              required
              aria-required="true"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent"
              required
              aria-required="true"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Frequency selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent"
              required
              aria-required="true"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Account selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({...formData, accountId: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent"
              required
              aria-required="true"
              disabled={accounts.length === 0}
            >
              <option value="">Select an account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {accounts.length === 0 && !accountsError && (
              <p className="text-sm text-gray-500 mt-1">Loading accounts...</p>
            )}
          </div>

          {/* Auto-approve toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoApprove"
              checked={formData.autoApprove}
              onChange={(e) => setFormData({...formData, autoApprove: e.target.checked})}
              className="rounded focus:ring-2 focus:ring-black"
              aria-label="Auto-approve transactions"
            />
            <label htmlFor="autoApprove" className="text-sm text-gray-700">
              Auto-approve transactions
            </label>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="rounded focus:ring-2 focus:ring-black"
              aria-label="Active status"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          {/* Form actions */}
          <div className="flex gap-2 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-black text-white py-2 rounded disabled:bg-gray-400 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              aria-label={loading ? 'Saving transaction...' : transaction ? 'Update transaction' : 'Create transaction'}
            >
              {loading ? 'Saving...' : (transaction ? 'Update' : 'Create')}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Cancel form"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}