// DebtForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDebt } from '../../contexts/DebtContext.jsx';

const DebtForm = ({ debt, onClose, onSave }) => {
  const { createDebt, updateDebt } = useDebt();
  const [formData, setFormData] = useState({
    name: '',
    type: 'loan',
    principal: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    termMonths: '',
    lender: '',
    accountNumber: '',
    notes: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Predefined debt types for dropdown
  const debtTypes = [
    { value: 'loan', label: 'Personal Loan' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'personal', label: 'Personal Debt' },
    { value: 'auto', label: 'Auto Loan' },
    { value: 'student', label: 'Student Loan' }
  ];

  // Validate individual field values
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'name':
        return value.trim().length >= 2 ? null : 'Name must be at least 2 characters';
      case 'principal':
      case 'balance':
      case 'minimumPayment':
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return 'Must be a positive number';
        if (num > 1000000000) return 'Amount too large';
        return null;
      case 'interestRate':
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0) return 'Must be a positive number';
        if (rate > 1000) return 'Interest rate too high (max 1000%)';
        return null;
      case 'termMonths':
        if (value && (parseInt(value) < 0 || parseInt(value) > 1200)) {
          return 'Term must be between 0-1200 months';
        }
        return null;
      default:
        return null;
    }
  }, []);

  // Validate entire form before submission
  const validateForm = useCallback(() => {
    const errors = {};
    const requiredFields = ['name', 'principal', 'balance', 'interestRate', 'minimumPayment', 'startDate'];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.toString().trim()) {
        errors[field] = 'This field is required';
      } else {
        const fieldError = validateField(field, formData[field]);
        if (fieldError) errors[field] = fieldError;
      }
    });

    // Validate balance is not greater than principal
    const principal = parseFloat(formData.principal) || 0;
    const balance = parseFloat(formData.balance) || 0;
    if (balance > principal) {
      errors.balance = 'Current balance cannot exceed original amount';
    }

    // Validate dates
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      if (isNaN(startDate.getTime())) {
        errors.startDate = 'Invalid start date';
      } else if (startDate > new Date()) {
        errors.startDate = 'Start date cannot be in the future';
      }
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.dueDate = 'Invalid due date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  // Initialize form data when editing existing debt
  useEffect(() => {
    const initializeFormData = () => {
      if (!debt) return;

      try {
        // Safely format dates
        const formatDate = (date) => {
          if (!date) return '';
          try {
            const dateObj = new Date(date);
            return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
          } catch {
            return '';
          }
        };

        setFormData({
          name: debt.name || '',
          type: debt.type || 'loan',
          principal: debt.principal?.toString() || '',
          balance: debt.balance?.toString() || '',
          interestRate: debt.interestRate?.toString() || '',
          minimumPayment: debt.minimumPayment?.toString() || '',
          startDate: formatDate(debt.startDate) || new Date().toISOString().split('T')[0],
          dueDate: formatDate(debt.dueDate) || '',
          termMonths: debt.termMonths?.toString() || '',
          lender: debt.lender || '',
          accountNumber: debt.accountNumber || '',
          notes: debt.notes || '',
          isActive: debt.isActive !== undefined ? Boolean(debt.isActive) : true
        });
      } catch (err) {
        console.error('Error initializing debt form:', err);
        setError('Failed to load debt data');
      }
    };

    initializeFormData();
  }, [debt]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear validation error for this field as user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Handle form submission with validation
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  if (!validateForm()) {
    setError('Please fix the errors in the form');
    return;
  }

  setLoading(true);

  try {
    // Prepare data with proper types
    const submissionData = {
      ...formData,
      principal: parseFloat(formData.principal),
      balance: parseFloat(formData.balance),
      interestRate: parseFloat(formData.interestRate),
      minimumPayment: parseFloat(formData.minimumPayment),
      termMonths: formData.termMonths ? parseInt(formData.termMonths) : null,
      isActive: Boolean(formData.isActive)
    };

    if (debt && debt.id) {
      // updateDebt returns { success: true, data: updatedDebt } or { success: false, error: message }
      const result = await updateDebt(debt.id, submissionData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update debt');
      }
      // Success - result.data contains the updated debt
    } else {
      // createDebt returns { success: true, data: newDebt } or { success: false, error: message }
      const result = await createDebt(submissionData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create debt');
      }
      // Success - result.data contains the new debt
    }
    
    // Clear any existing errors before calling onSave
    setError('');
    setValidationErrors({});
    
    if (typeof onSave === 'function') {
      onSave();
    }
  } catch (err) {
    console.error('Error saving debt:', err);
    setError(err.message || 'An unexpected error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    if (loading) return; // Prevent closing while saving
    
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [loading, onClose]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) {
        handleCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleCancel, loading]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900">
            {debt ? 'Edit Debt' : 'Add New Debt'}
          </h3>
          <button 
            className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
            onClick={handleCancel}
            disabled={loading}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Name and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Debt Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength="2"
                maxLength="100"
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="e.g., Car Loan"
              />
              {validationErrors.name && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Debt Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {debtTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Amount *
              </label>
              <input
                type="number"
                name="principal"
                value={formData.principal}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                max="1000000000"
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.principal ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="0.00"
              />
              {validationErrors.principal && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.principal}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance *
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                max="1000000000"
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.balance ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="0.00"
              />
              {validationErrors.balance && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.balance}</p>
              )}
            </div>
          </div>

          {/* Interest and Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                max="1000"
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.interestRate ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="0.00"
              />
              {validationErrors.interestRate && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.interestRate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payment *
              </label>
              <input
                type="number"
                name="minimumPayment"
                value={formData.minimumPayment}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                max="1000000"
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.minimumPayment ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="0.00"
              />
              {validationErrors.minimumPayment && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.minimumPayment}</p>
              )}
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
              />
              {validationErrors.startDate && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={formData.startDate}
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.dueDate ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
              />
              {validationErrors.dueDate && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Term and Lender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term (months)
              </label>
              <input
                type="number"
                name="termMonths"
                value={formData.termMonths}
                onChange={handleChange}
                min="0"
                max="1200"
                disabled={loading}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.termMonths ? 'border-red-300' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="Optional"
              />
              {validationErrors.termMonths && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.termMonths}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lender
              </label>
              <input
                type="text"
                name="lender"
                value={formData.lender}
                onChange={handleChange}
                maxLength="100"
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Bank name"
              />
            </div>
          </div>

          {/* Account Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              maxLength="50"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Optional"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              maxLength="500"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
              placeholder="Additional notes about this debt"
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
            />
            <label className="ml-2 text-sm text-gray-700">
              This debt is active
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : (debt ? 'Update Debt' : 'Add Debt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtForm;