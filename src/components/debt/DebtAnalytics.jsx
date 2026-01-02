import React, { useMemo } from 'react';
import { useDebt } from '../../contexts/DebtContext.jsx';

const DebtAnalytics = () => {
  const { analytics, debts, loading, error } = useDebt();

  // Format currency with error handling
  const formatCurrency = (amount) => {
    try {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount)) {
        console.warn('Invalid amount for currency formatting:', amount);
        return '$0.00';
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericAmount);
    } catch (err) {
      console.error('Error formatting currency:', err);
      return '$0.00';
    }
  };

  // Map debt types to human-readable labels
  const getDebtTypeLabel = (type) => {
    const labels = {
      loan: 'Personal Loan',
      credit_card: 'Credit Card',
      mortgage: 'Mortgage',
      personal: 'Personal Debt',
      auto: 'Auto Loan',
      student: 'Student Loan'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1); // Capitalize unknown types
  };

  // Calculate safe percentage for progress bars
  const calculatePercentage = (amount, total) => {
    try {
      const numAmount = Number(amount) || 0;
      const numTotal = Number(total) || 0;
      
      if (numTotal <= 0 || numAmount <= 0) return 0;
      if (numAmount > numTotal) return 100; // Cap at 100%
      
      return (numAmount / numTotal) * 100;
    } catch (err) {
      console.error('Error calculating percentage:', err);
      return 0;
    }
  };

  // Calculate monthly interest safely
  const calculateMonthlyInterest = (balance, annualRate) => {
    try {
      const numericBalance = Number(balance) || 0;
      const numericRate = Number(annualRate) || 0;
      
      if (numericBalance <= 0 || numericRate <= 0) return 0;
      
      // Monthly interest = balance * (annual rate / 100 / 12)
      return numericBalance * (numericRate / 100 / 12);
    } catch (err) {
      console.error('Error calculating monthly interest:', err);
      return 0;
    }
  };

  // Memoize safe analytics data to prevent unnecessary recalculations
  const safeAnalytics = useMemo(() => {
    if (!analytics || typeof analytics !== 'object') {
      return {
        totalDebt: 0,
        totalMinimumPayments: 0,
        totalMonthlyInterest: 0,
        debtCount: 0,
        debtByType: {},
        snowballOrder: [],
        avalancheOrder: [],
        highestInterestDebt: null
      };
    }

    return {
      totalDebt: Math.max(0, Number(analytics.totalDebt) || 0),
      totalMinimumPayments: Math.max(0, Number(analytics.totalMinimumPayments) || 0),
      totalMonthlyInterest: Math.max(0, Number(analytics.totalMonthlyInterest) || 0),
      debtCount: Math.max(0, Number(analytics.debtCount) || 0),
      debtByType: analytics.debtByType || {},
      snowballOrder: Array.isArray(analytics.snowballOrder) ? analytics.snowballOrder : [],
      avalancheOrder: Array.isArray(analytics.avalancheOrder) ? analytics.avalancheOrder : [],
      highestInterestDebt: analytics.highestInterestDebt || null
    };
  }, [analytics]);

  // Handle loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading debt analytics...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">Error Loading Analytics</div>
        <p className="text-red-700 text-sm">{error.message || 'Failed to load debt analytics'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle empty state
  if (!analytics || safeAnalytics.debtCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Debt Found</h3>
        <p className="text-gray-600">Add your debts to see analytics and payoff strategies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error banner for data inconsistencies */}
      {safeAnalytics.totalDebt <= 0 && safeAnalytics.debtCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-700 text-sm">Debt totals may be inconsistent. Please check your debt entries.</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(safeAnalytics.totalDebt)}
          </div>
          <div className="text-sm text-gray-600">Total Debt</div>
          <div className="text-xs text-gray-500 mt-1">{safeAnalytics.debtCount} {safeAnalytics.debtCount === 1 ? 'debt' : 'debts'}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(safeAnalytics.totalMinimumPayments)}
          </div>
          <div className="text-sm text-gray-600">Monthly Payments</div>
          <div className="text-xs text-gray-500 mt-1">Minimum payments</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(safeAnalytics.totalMonthlyInterest)}
          </div>
          <div className="text-sm text-gray-600">Monthly Interest</div>
          <div className="text-xs text-gray-500 mt-1">Accruing monthly</div>
        </div>
      </div>

      {/* Debt by Type */}
      {Object.keys(safeAnalytics.debtByType).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Debt by Type</h3>
          <div className="space-y-4">
            {Object.entries(safeAnalytics.debtByType).map(([type, amount]) => {
              const percentage = calculatePercentage(amount, safeAnalytics.totalDebt);
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{getDebtTypeLabel(type)}</span>
                    <span className="text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payoff Strategies */}
      {(safeAnalytics.snowballOrder.length > 0 || safeAnalytics.avalancheOrder.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debt Snowball - Smallest balances first */}
          {safeAnalytics.snowballOrder.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Debt Snowball</h3>
              <p className="text-gray-600 text-sm mb-4">Pay off smallest balances first for psychological wins</p>
              <div className="space-y-3">
                {safeAnalytics.snowballOrder.map((debt, index) => (
                  <div key={debt.id || `snowball-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900 truncate">{debt.name || 'Unnamed Debt'}</span>
                    </div>
                    <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">
                      {formatCurrency(debt.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debt Avalanche - Highest interest first */}
          {safeAnalytics.avalancheOrder.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Debt Avalanche</h3>
              <p className="text-gray-600 text-sm mb-4">Pay off highest interest first to save money</p>
              <div className="space-y-3">
                {safeAnalytics.avalancheOrder.map((debt, index) => (
                  <div key={debt.id || `avalanche-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900 truncate">{debt.name || 'Unnamed Debt'}</span>
                    </div>
                    <span className="font-semibold text-red-600 flex-shrink-0 ml-2">
                      {Number(debt.interestRate || 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Highest Interest Debt */}
      {safeAnalytics.highestInterestDebt && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Highest Interest Debt</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h4 className="font-bold text-yellow-900 text-lg">
                  {safeAnalytics.highestInterestDebt.name || 'High Interest Debt'}
                </h4>
                {safeAnalytics.highestInterestDebt.lender && (
                  <p className="text-yellow-700">{safeAnalytics.highestInterestDebt.lender}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-sm text-yellow-600">Interest Rate</div>
                  <div className="text-xl font-bold text-yellow-900">
                    {Number(safeAnalytics.highestInterestDebt.interestRate || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-yellow-600">Balance</div>
                  <div className="text-xl font-bold text-yellow-900">
                    {formatCurrency(safeAnalytics.highestInterestDebt.balance)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-yellow-600">Monthly Interest</div>
                  <div className="text-xl font-bold text-yellow-900">
                    {formatCurrency(
                      calculateMonthlyInterest(
                        safeAnalytics.highestInterestDebt.balance,
                        safeAnalytics.highestInterestDebt.interestRate
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtAnalytics;