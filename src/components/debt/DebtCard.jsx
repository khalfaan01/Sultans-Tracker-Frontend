// src/components/debt/DebtCard.jsx - FIXED NUMBER DISPLAY
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDebt } from '../../contexts/DebtContext.jsx';
import PaymentModal from './PaymentModal.jsx';

const DebtCard = ({ debt, onEdit }) => {
  const { deleteDebt } = useDebt();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const actionsRef = useRef(null);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle debt deletion with error handling
  const handleDelete = useCallback(async () => {
    if (!debt?.id) {
      setError('Invalid debt ID');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${debt.name || 'this debt'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      
      const result = await deleteDebt(debt.id);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to delete debt');
      }
    } catch (err) {
      console.error('Error deleting debt:', err);
      setError(err.message || 'Failed to delete debt');
    } finally {
      setIsDeleting(false);
    }
  }, [debt?.id, debt?.name, deleteDebt]);

  // Get icon for debt type with fallback
  const getDebtTypeIcon = useCallback((type) => {
    const icons = {
      loan: '💵',
      credit_card: '💳',
      mortgage: '🏠',
      personal: '🤝',
      auto: '🚗',
      student: '🎓'
    };
    return icons[type] || '💰'; // Default icon
  }, []);

  // Format currency with robust error handling
  const formatCurrency = useCallback((amount) => {
    try {
      // Convert to number safely
      const numericAmount = typeof amount === 'string' 
        ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
        : Number(amount);
      
      if (isNaN(numericAmount) || !isFinite(numericAmount)) {
        console.warn('Invalid amount for formatting:', amount);
        return '$0.00';
      }
      
      // Handle negative amounts (debt)
      const absoluteAmount = Math.abs(numericAmount);
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(absoluteAmount);
    } catch (err) {
      console.error('Error formatting currency:', err, amount);
      return '$0.00';
    }
  }, []);

  // Format percentage with validation
  const formatPercentage = useCallback((rate) => {
    try {
      const numericRate = typeof rate === 'string' 
        ? parseFloat(rate.replace(/[^0-9.-]+/g, ''))
        : Number(rate);
      
      if (isNaN(numericRate) || !isFinite(numericRate)) {
        console.warn('Invalid interest rate:', rate);
        return '0.00%';
      }
      
      // Clamp rate to reasonable bounds (0-1000%)
      const clampedRate = Math.max(0, Math.min(1000, numericRate));
      
      return `${clampedRate.toFixed(2)}%`;
    } catch (err) {
      console.error('Error formatting percentage:', err, rate);
      return '0.00%';
    }
  }, []);

  // Format date safely
  const formatDate = useCallback((date) => {
    try {
      if (!date) return 'No date';
      
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return 'Invalid date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err, date);
      return 'Date error';
    }
  }, []);

  // Calculate progress percentage safely
  const getProgressPercentage = useCallback(() => {
    try {
      if (!debt?.progressPercentage && debt?.progressPercentage !== 0) {
        return 0;
      }
      
      const percentage = Number(debt.progressPercentage);
      if (isNaN(percentage) || !isFinite(percentage)) {
        return 0;
      }
      
      // Clamp between 0-100
      return Math.max(0, Math.min(100, percentage));
    } catch (err) {
      console.error('Error calculating progress:', err);
      return 0;
    }
  }, [debt?.progressPercentage]);

  // Safely get estimated payoff months
  const getEstimatedPayoffMonths = useCallback(() => {
    try {
      if (!debt?.estimatedPayoffMonths) return null;
      
      const months = Number(debt.estimatedPayoffMonths);
      if (isNaN(months) || !isFinite(months) || months <= 0) {
        return null;
      }
      
      return Math.round(months);
    } catch (err) {
      console.error('Error parsing payoff months:', err);
      return null;
    }
  }, [debt?.estimatedPayoffMonths]);

  // Validate debt object
  if (!debt || typeof debt !== 'object') {
    console.error('Invalid debt object provided to DebtCard');
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="text-red-600 font-medium">Invalid Debt Data</div>
        <p className="text-red-700 text-sm mt-1">Unable to display debt information</p>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const estimatedPayoffMonths = getEstimatedPayoffMonths();
  const isActive = Boolean(debt.isActive);

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${
        !isActive ? 'bg-green-50 border-green-200' : 'border-gray-200'
      }`}>
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-700 text-sm">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 text-lg"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-2xl mt-1 flex-shrink-0" role="img" aria-label={debt.type || 'debt type'}>
              {getDebtTypeIcon(debt.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {debt.name || 'Unnamed Debt'}
              </h3>
              {debt.lender && (
                <p className="text-sm text-gray-600 mt-1 truncate">{debt.lender}</p>
              )}
            </div>
          </div>
          
          {/* Actions Dropdown */}
          <div className="relative" ref={actionsRef}>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50"
              onClick={() => setShowActions(!showActions)}
              disabled={isDeleting}
              aria-label="Debt actions menu"
              aria-expanded={showActions}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            </button>
            
            {showActions && (
              <div 
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[120px]"
                role="menu"
              >
                <button 
                  onClick={() => {
                    if (onEdit && typeof onEdit === 'function') {
                      onEdit(debt);
                    }
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  role="menuitem"
                  disabled={isDeleting}
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    setShowPaymentModal(true);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  role="menuitem"
                  disabled={isDeleting || !isActive}
                >
                  Make Payment
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  role="menuitem"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="debt-stat-item">
            <div className="debt-stat-label">Balance</div>
            <div className="debt-stat-value text-gray-900">
              {formatCurrency(debt.balance)}
            </div>
          </div>
          <div className="debt-stat-item">
            <div className="debt-stat-label">Interest</div>
            <div className="debt-stat-value text-gray-900">
              {formatPercentage(debt.interestRate)}
            </div>
          </div>
          <div className="debt-stat-item">
            <div className="debt-stat-label">Min Payment</div>
            <div className="debt-stat-value text-gray-900">
              {formatCurrency(debt.minimumPayment)}
            </div>
          </div>
        </div>

        {/* Due Date */}
        {debt.dueDate && (
          <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
            <span>Due: {formatDate(debt.dueDate)}</span>
          </div>
        )}

        {/* Progress Bar */}
        {isActive && progressPercentage > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}% Paid</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        )}

        {/* Payoff Estimate */}
        {isActive && estimatedPayoffMonths && (
          <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
            </svg>
            <span>Payoff: ~{estimatedPayoffMonths} month{estimatedPayoffMonths !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Paid Off Badge */}
        {!isActive && (
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium text-center mb-4" role="status">
            🎉 Paid Off!
          </div>
        )}

        {/* Make Payment Button */}
        {isActive && (
          <button 
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowPaymentModal(true)}
            disabled={isDeleting}
            aria-label={`Make payment on ${debt.name || 'debt'}`}
          >
            Make Payment
          </button>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          debt={debt}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            setError(null); // Clear any previous errors
          }}
        />
      )}
    </>
  );
};

export default DebtCard;