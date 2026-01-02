// src/components/debt/PaymentModal.jsx 
import React, { useState, useEffect, useCallback } from 'react';
import { useDebt } from '../../contexts/DebtContext';
import { accountsAPI } from '../../services/api';

const PaymentModal = ({ debt, onClose, onSuccess }) => {
  const { makePayment } = useDebt();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Load accounts on component mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await accountsAPI.getAll();
        if (!Array.isArray(accountsData)) {
          throw new Error('Invalid accounts data received');
        }
        
        const validAccounts = accountsData.filter(account => 
          account && 
          typeof account === 'object' && 
          account.id && 
          account.name && 
          typeof account.balance === 'number'
        );
        
        setAccounts(validAccounts);
        if (validAccounts.length > 0) {
          setAccountId(validAccounts[0].id);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        setApiError('Failed to load accounts. Please try again.');
      }
    };
    
    loadAccounts();
  }, []);

  // Initialize description with debt name
  useEffect(() => {
    if (debt?.name) {
      setDescription(`Payment for ${debt.name}`);
    }
  }, [debt]);

  // Validate payment amount
  const validateAmount = useCallback((value) => {
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue <= 0) {
      return 'Please enter a valid amount greater than 0';
    }
    
    if (debt?.balance && numericValue > debt.balance) {
      return `Amount cannot exceed current balance of $${debt.balance.toFixed(2)}`;
    }
    
    // Validate max payment amount (prevent unreasonably large payments)
    if (numericValue > 1000000) {
      return 'Payment amount is too large';
    }
    
    return null;
  }, [debt?.balance]);

  // Validate form before submission
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Validate amount
    const amountError = validateAmount(amount);
    if (amountError) newErrors.amount = amountError;
    
    // Validate account
    if (!accountId || !accounts.find(acc => acc.id.toString() === accountId)) {
      newErrors.accountId = 'Please select a valid account';
    }
    
    // Validate selected account has sufficient balance
    const selectedAccount = accounts.find(acc => acc.id.toString() === accountId);
    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      newErrors.amount = `Insufficient funds. Account balance: $${selectedAccount.balance.toFixed(2)}`;
    }
    
    // Validate payment date
    if (paymentDate) {
      const selectedDate = new Date(paymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(selectedDate.getTime())) {
        newErrors.paymentDate = 'Invalid date selected';
      } else if (selectedDate < today) {
        newErrors.paymentDate = 'Payment date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, accountId, accounts, paymentDate, validateAmount]);

  // Handle form submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Validate required debt data
    if (!debt || !debt.id) {
      setApiError('Invalid debt information');
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        amount: parseFloat(amount),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        description: description.trim() || `Payment for ${debt.name || 'debt'}`,
        accountId: parseInt(accountId)
      };

      const result = await makePayment(debt.id, paymentData);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Payment processing failed');
      }
      
      // Clear errors and close modal on success
      setErrors({});
      setApiError('');
      
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setApiError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Clear amount error when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: null }));
    }
  };

  // Handle account selection
  const handleAccountChange = (e) => {
    const value = e.target.value;
    setAccountId(value);
    
    // Clear account error when user selects
    if (errors.accountId) {
      setErrors(prev => ({ ...prev, accountId: null }));
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    const value = e.target.value;
    setPaymentDate(value);
    
    // Clear date error when user changes
    if (errors.paymentDate) {
      setErrors(prev => ({ ...prev, paymentDate: null }));
    }
  };

  // Format currency safely
  const formatCurrency = useCallback((value) => {
    try {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return '$0.00';
    }
  }, []);

  // Get current debt balance safely
  const getDebtBalance = useCallback(() => {
    return debt?.balance ? formatCurrency(debt.balance) : '$0.00';
  }, [debt?.balance, formatCurrency]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!loading && typeof onClose === 'function') {
      onClose();
    }
  }, [loading, onClose]);

  // Close modal on escape key press
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [loading, handleClose]);

  // Validate debt prop
  if (!debt || typeof debt !== 'object') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <div className="text-red-600 text-center p-4">
            Invalid debt information provided
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-gray-300 py-2 rounded mt-4"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Make Payment - {debt.name || 'Unnamed Debt'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl disabled:opacity-50"
            disabled={loading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        {/* Error Display */}
        {apiError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">{apiError}</span>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              } disabled:opacity-50`}
              step="0.01"
              min="0.01"
              max={debt.balance || 1000000}
              required
              disabled={loading}
              placeholder="0.00"
              aria-describedby="amount-error balance-info"
            />
            <div className="flex justify-between mt-1">
              {errors.amount ? (
                <p id="amount-error" className="text-red-600 text-xs">{errors.amount}</p>
              ) : (
                <p id="balance-info" className="text-xs text-gray-500">
                  Current balance: {getDebtBalance()}
                </p>
              )}
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Account *
            </label>
            <select
              value={accountId}
              onChange={handleAccountChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.accountId ? 'border-red-300' : 'border-gray-300'
              } disabled:opacity-50`}
              required
              disabled={loading || accounts.length === 0}
              aria-describedby="account-error"
            >
              <option value="">Select an account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatCurrency(account.balance)})
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p id="account-error" className="text-red-600 text-xs mt-1">{errors.accountId}</p>
            )}
            {accounts.length === 0 && !loading && (
              <p className="text-yellow-600 text-xs mt-1">No accounts available</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={handleDateChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentDate ? 'border-red-300' : 'border-gray-300'
              } disabled:opacity-50`}
              max={new Date().toISOString().split('T')[0]}
              disabled={loading}
              aria-describedby="date-error"
            />
            {errors.paymentDate && (
              <p id="date-error" className="text-red-600 text-xs mt-1">{errors.paymentDate}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              maxLength="200"
              disabled={loading}
              placeholder="Payment description"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {description.length}/200 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || accounts.length === 0}
              className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Make Payment'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;