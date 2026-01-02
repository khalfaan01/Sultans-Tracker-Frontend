// DebtContext.jsx
import { createContext, useContext, useState } from 'react';
import { debtAPI } from '../services/api';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useDataLoader } from '../hooks/useDataLoader';

const DebtContext = createContext();

/**
 * Custom hook to access the debt management context
 * @returns {Object} Debt context value
 * @throws {Error} If used outside of DebtProvider
 */
export const useDebt = () => {
  const context = useContext(DebtContext);
  if (!context) {
    throw new Error('useDebt must be used within a DebtProvider');
  }
  return context;
};

/**
 * Provider component that manages debt state, operations, and analytics
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Debt context provider
 */
export const DebtProvider = ({ children }) => {
  const { requireAuthSilent } = useAuthCheck();
  const { executeAsync, loading, error, clearError } = useDataLoader({
    debts: [],
    analytics: null
  });

  const [debts, setDebts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  /**
   * Loads all debts from the API
   * @returns {Promise<Array>} Array of debt objects
   */
  const loadDebts = async () => {
    if (!requireAuthSilent()) return;
    
    const result = await executeAsync(async () => {
      const data = await debtAPI.getAll();
      setDebts(data);
      return data;
    });
    
    return result;
  };

  /**
   * Loads debt analytics data from the API
   * @returns {Promise<Object>} Analytics data object
   */
  const loadAnalytics = async () => {
    if (!requireAuthSilent()) return;
    
    const result = await executeAsync(async () => {
      const data = await debtAPI.getAnalytics();
      setAnalytics(data);
      return data;
    }, { showLoading: false });
    
    return result;
  };

  /**
   * Creates a new debt record
   * @param {Object} debtData - Debt creation data
   * @returns {Promise<Object>} Newly created debt object
   */
  const createDebt = async (debtData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const newDebt = await debtAPI.create(debtData);
      setDebts(prev => [...prev, newDebt]);
      await loadAnalytics();
      return newDebt;
    });
    
    return result;
  };

  /**
   * Updates an existing debt record
   * @param {string} id - Debt ID
   * @param {Object} debtData - Updated debt data
   * @returns {Promise<Object>} Updated debt object
   */
  const updateDebt = async (id, debtData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const updatedDebt = await debtAPI.update(id, debtData);
      setDebts(prev => prev.map(debt => debt.id === id ? updatedDebt : debt));
      await loadAnalytics();
      return updatedDebt;
    });
    
    return result;
  };

  /**
   * Deletes a debt record by ID
   * @param {string} id - Debt ID to delete
   * @returns {Promise<Object>} Deletion result with ID
   */
  const deleteDebt = async (id) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      await debtAPI.delete(id);
      setDebts(prev => prev.filter(debt => debt.id !== id));
      await loadAnalytics();
      return { id };
    });
    
    return result;
  };

  /**
   * Makes a payment towards a specific debt
   * @param {string} id - Debt ID
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment result with updated debt
   */
  const makePayment = async (id, paymentData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const paymentResult = await debtAPI.makePayment(id, paymentData);
      
      // Update local debt state if API returns updated debt
      if (paymentResult.updatedDebt) {
        setDebts(prev => prev.map(debt => 
          debt.id === id ? paymentResult.updatedDebt : debt
        ));
      }
      
      await loadAnalytics();
      return paymentResult;
    });
    
    return result;
  };

  /**
   * Applies the debt snowball repayment method (smallest balances first)
   * @returns {Promise<Object>} Snowball repayment plan
   */
  const applySnowballMethod = async () => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const plan = await debtAPI.applySnowballMethod();
      await loadDebts();
      await loadAnalytics();
      return plan;
    });
    
    return result;
  };

  /**
   * Applies the debt avalanche repayment method (highest interest first)
   * @returns {Promise<Object>} Avalanche repayment plan
   */
  const applyAvalancheMethod = async () => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const plan = await debtAPI.applyAvalancheMethod();
      await loadDebts();
      await loadAnalytics();
      return plan;
    });
    
    return result;
  };

  /**
   * Retrieves a debt by ID from local state
   * @param {string} id - Debt ID
   * @returns {Object|undefined} Debt object or undefined if not found
   */
  const getDebtById = (id) => {
    return debts.find(debt => debt.id === id);
  };

  /**
   * Filters and returns only active debts
   * @returns {Array} Active debt objects
   */
  const getActiveDebts = () => {
    return debts.filter(debt => debt.isActive);
  };

  /**
   * Calculates a payment plan for a specific debt
   * @param {string} debtId - Debt ID
   * @param {number} extraPayment - Additional monthly payment amount
   * @returns {Object|null} Payment plan details or null if debt not found
   */
  const getDebtPaymentPlan = (debtId, extraPayment = 0) => {
    const debt = getDebtById(debtId);
    if (!debt) return null;

    const monthlyRate = debt.interestRate / 12 / 100;
    const totalPayment = debt.minimumPayment + extraPayment;
    
    // Handle zero or negative interest rate scenario
    if (monthlyRate <= 0) {
      const months = Math.ceil(debt.balance / totalPayment);
      return {
        months,
        totalInterest: 0,
        payoffDate: new Date(new Date().setMonth(new Date().getMonth() + months))
      };
    }

    // Use amortization formula to calculate months to payoff
    const months = Math.ceil(
      Math.log(totalPayment / (totalPayment - debt.balance * monthlyRate)) / 
      Math.log(1 + monthlyRate)
    );

    // Calculate total interest using amortization simulation
    let remaining = debt.balance;
    let totalInterest = 0;
    
    for (let i = 0; i < months; i++) {
      const interest = remaining * monthlyRate;
      totalInterest += interest;
      const principalPayment = totalPayment - interest;
      remaining -= principalPayment;
      if (remaining <= 0) break;
    }

    return {
      months,
      totalInterest,
      payoffDate: new Date(new Date().setMonth(new Date().getMonth() + months))
    };
  };

  const value = {
    // Data
    debts,
    analytics,
    
    // State
    loading,
    error,
    clearError,
    
    // Operations
    loadDebts,
    loadAnalytics,
    createDebt,
    updateDebt,
    deleteDebt,
    makePayment,
    applySnowballMethod,
    applyAvalancheMethod,
    
    // Queries
    getDebtById,
    getActiveDebts,
    getDebtPaymentPlan
  };

  return (
    <DebtContext.Provider value={value}>
      {children}
    </DebtContext.Provider>
  );
};