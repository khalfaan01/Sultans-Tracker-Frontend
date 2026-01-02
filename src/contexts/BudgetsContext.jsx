// BudgetsContext.jsx
import { createContext, useContext, useState } from 'react';
import { budgetsAPI } from '../services/api';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useDataLoader } from '../hooks/useDataLoader';

const BudgetsContext = createContext();

/**
 * Custom hook to access the budgets context
 * @returns {Object} Budgets context value
 * @throws {Error} If used outside of BudgetsProvider
 */
export const useBudgets = () => {
  const context = useContext(BudgetsContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetsProvider');
  }
  return context;
};

/**
 * Provider component that manages budgets state and operations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Budgets context provider
 */
export const BudgetsProvider = ({ children }) => {
  const { requireAuthSilent } = useAuthCheck();
  const { executeAsync, loading, error, clearError } = useDataLoader({ budgets: [] });
  const [budgets, setBudgets] = useState([]);

  /**
   * Loads all budgets from the API
   * @returns {Promise<Array>} Array of budget objects
   */
  const loadBudgets = async () => {
    if (!requireAuthSilent()) return;
    
    const result = await executeAsync(async () => {
      const data = await budgetsAPI.getAll();
      setBudgets(data);
      return data;
    });
    
    return result;
  };

  /**
   * Creates a new budget
   * @param {Object} budgetData - Budget creation data
   * @returns {Promise<Object>} Newly created budget
   */
  const createBudget = async (budgetData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const newBudget = await budgetsAPI.create(budgetData);
      setBudgets(prev => [...prev, newBudget]);
      return newBudget;
    });
    
    return result;
  };

  /**
   * Updates an existing budget
   * @param {string} id - Budget ID
   * @param {Object} budgetData - Updated budget data
   * @returns {Promise<Object>} Updated budget object
   */
  const updateBudget = async (id, budgetData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const updatedBudget = await budgetsAPI.update(id, budgetData);
      setBudgets(prev => prev.map(budget => budget.id === id ? updatedBudget : budget));
      return updatedBudget;
    });
    
    return result;
  };

  /**
   * Deletes a budget by ID
   * @param {string} id - Budget ID to delete
   * @returns {Promise<Object>} Deletion result with ID
   */
  const deleteBudget = async (id) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      await budgetsAPI.delete(id);
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      return { id };
    });
    
    return result;
  };

  /**
   * Calculates rollover amount for a budget
   * @param {string} id - Budget ID
   * @returns {Promise<Object>} Rollover calculation result
   */
  const calculateRollover = async (id) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      return await budgetsAPI.calculateRollover(id);
    });
    
    return result;
  };

  /**
   * Retrieves a budget by category from local state
   * @param {string} category - Budget category
   * @returns {Object|undefined} Budget object or undefined if not found
   */
  const getBudgetByCategory = (category) => {
    return budgets.find(budget => budget.category === category);
  };

  /**
   * Calculates progress and remaining amount for all budgets
   * @returns {Array} Array of budget objects with progress data
   */
  const getBudgetProgress = () => {
    return budgets.map(budget => ({
      ...budget,
      progress: budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0,
      remaining: Math.max(0, budget.limit - budget.spent)
    }));
  };

  const value = {
    budgets,
    loading,
    error,
    clearError,
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    calculateRollover,
    getBudgetByCategory,
    getBudgetProgress
  };

  return (
    <BudgetsContext.Provider value={value}>
      {children}
    </BudgetsContext.Provider>
  );
};