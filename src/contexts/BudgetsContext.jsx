// BudgetsContext.jsx
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { budgetsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Changed to useAuth directly
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { executeAsync, loading, error, clearError } = useDataLoader({ budgets: [] });
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const budgetCheckCache = useRef({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Wait for auth to finish loading before checking
  const isReady = !authLoading && isAuthenticated;

  // Load budgets only when auth is ready
  useEffect(() => {
    if (isReady && !isInitialized) {
      const initializeData = async () => {
        try {
          await loadBudgets();
          await loadBudgetSummary();
          await loadRecommendations();
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize budget data:', error);
        }
      };
      initializeData();
    } else if (!isAuthenticated && !authLoading) {
      // Clear data when user logs out
      setBudgets([]);
      setSummary(null);
      setRecommendations([]);
      setIsInitialized(false);
    }
  }, [isReady, isInitialized, isAuthenticated, authLoading]);

  /**
   * Loads all budgets from the API
   */
  const loadBudgets = async () => {
    if (!isAuthenticated || authLoading) {
      console.log('BudgetsContext: Auth not ready, skipping load');
      return [];
    }
    
    const result = await executeAsync(async () => {
      const data = await budgetsAPI.getAll();
      setBudgets(data);
      return data;
    });
    
    return result;
  };

  /**
   * Loads budget summary
   */
  const loadBudgetSummary = async () => {
    if (!isAuthenticated || authLoading) {
      console.warn('BudgetsContext: User not authenticated, skipping budget summary load');
      setSummary(null);
      return null;
    }

    try {
      const data = await budgetsAPI.getSummary();
      setSummary(data);
      return data;
    } catch (err) {
      console.warn('Failed to load budget summary', err);
      setSummary(null);
      return null;
    }
  };

  /**
   * Loads smart recommendations
   */
  const loadRecommendations = async () => {
    if (!isAuthenticated || authLoading) {
      console.warn('BudgetsContext: User not authenticated, skipping recommendations load');
      setRecommendations([]);
      return { recommendations: [] };
    }

    try {
      const data = await budgetsAPI.getRecommendations();
      setRecommendations(data.recommendations || []);
      return data;
    } catch (err) {
      console.warn('Failed to load budget recommendations', err);
      setRecommendations([]);
      return { recommendations: [] };
    }
  };

  /**
   * Creates a new budget
   * @param {Object} budgetData - Budget creation data
   * @returns {Promise<Object>} Newly created budget
   */
  const createBudget = async (budgetData) => {
    if (!isAuthenticated || authLoading) {
      throw new Error('User must be authenticated to create a budget');
    }
    
    const result = await executeAsync(async () => {
      const newBudget = await budgetsAPI.create(budgetData);
      setBudgets(prev => [...prev, newBudget]);
      // Reload summary after creation
      await loadBudgetSummary();
      // Reload recommendations as new budget may affect them
      await loadRecommendations();
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
    if (!isAuthenticated || authLoading) {
      throw new Error('User must be authenticated to update a budget');
    }
    
    const result = await executeAsync(async () => {
      const updatedBudget = await budgetsAPI.update(id, budgetData);
      setBudgets(prev => prev.map(budget => budget.id === id ? updatedBudget : budget));
      // Reload summary after update
      await loadBudgetSummary();
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
    if (!isAuthenticated || authLoading) {
      throw new Error('User must be authenticated to delete a budget');
    }
    
    const result = await executeAsync(async () => {
      await budgetsAPI.delete(id);
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      // Reload summary after deletion
      await loadBudgetSummary();
      // Reload recommendations
      await loadRecommendations();
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
    if (!isAuthenticated || authLoading) {
      throw new Error('User must be authenticated to calculate rollover');
    }
    
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
  const getBudgetByCategory = useCallback((category) => {
    return budgets.find(budget => budget.category === category);
  }, [budgets]);

  /**
   * Checks if transaction would exceed budget limit
   */
  const checkBudgetLimit = async (category, amount) => {
    if (!isAuthenticated || authLoading) {
      console.warn('Budget limit check: User not authenticated');
      return { 
        allowed: true, 
        budget: null,
        warning: 'Authentication required for budget check'
      };
    }
  
    // Create cache key
    const cacheKey = `${category}-${amount}`;
    
    // Check cache (5 second cache)
    const cached = budgetCheckCache.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < 5000) {
      return cached.result;
    }
    
    try {
      const result = await budgetsAPI.checkLimit(category, amount);
      
      // Ensure consistent response structure
      const normalizedResult = {
        allowed: result.allowed !== false, // Default to true if not specified
        budget: result.budget || null,
        warning: result.warning,
        error: result.error,
        currentSpent: result.currentSpent,
        wouldBeTotal: result.wouldBeTotal,
        overspendAmount: result.overspendAmount,
        suggestion: result.suggestion,
        details: result.details || {
          budgetCategory: result.budget?.category || category,
          budgetLimit: result.budget?.limit,
          transactionAmount: Math.abs(amount)
        }
      };
      
      // If budget exists but allowExceed is undefined, default to false
      if (normalizedResult.budget && normalizedResult.budget.allowExceed === undefined) {
        normalizedResult.budget.allowExceed = false;
      }
      
      // Cache the result
      budgetCheckCache.current[cacheKey] = {
        result: normalizedResult,
        timestamp: Date.now()
      };
      
      return normalizedResult;
    } catch (err) {
      console.warn('Budget limit check failed', err);
      // Return safe default
      return { 
        allowed: true, 
        budget: null,
        warning: 'Budget check temporarily unavailable'
      };
    }
  };

  /**
   * Calculates progress and remaining amount for all budgets
   * @returns {Array} Array of budget objects with progress data
   */
  const getBudgetProgress = useCallback(() => {
    return budgets.map(budget => ({
      ...budget,
      progress: budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0,
      remaining: Math.max(0, budget.limit - budget.spent),
      status: budget.spent > budget.limit ? 'over' : 
              budget.spent > budget.limit * 0.8 ? 'warning' : 'good'
    }));
  }, [budgets]);

  /**
   * Applies a budget recommendation
   */
  const applyRecommendation = async (recommendation) => {
    if (!isAuthenticated || authLoading) {
      throw new Error('User must be authenticated to apply recommendation');
    }
    
    const result = await executeAsync(async () => {
      const budgetData = {
        category: recommendation.category,
        limit: recommendation.recommendedLimit,
        period: 'monthly',
        rolloverType: 'none',
        allowExceed: false
      };
      
      const newBudget = await budgetsAPI.create(budgetData);
      setBudgets(prev => [...prev, newBudget]);
      // Remove this recommendation from the list
      setRecommendations(prev => prev.filter(rec => rec.category !== recommendation.category));
      await loadBudgetSummary();
      return newBudget;
    });
    
    return result;
  };

  /**
   * Sync budgets with transaction data
   */
  const syncBudgets = async () => {
    if (!isAuthenticated || authLoading) {
      throw new Error('User must be authenticated to sync budgets');
    }

    try {
      // Call sync endpoint if it exists, otherwise just reload data
      if (budgetsAPI.sync) {
        const result = await budgetsAPI.sync();
        // Reload all data after sync
        await loadBudgets();
        await loadBudgetSummary();
        return result;
      } else {
        // Fallback: just reload data
        await loadBudgets();
        await loadBudgetSummary();
        return { message: 'Budgets reloaded' };
      }
    } catch (error) {
      console.error('Failed to sync budgets:', error);
      throw error;
    }
  };

  const value = {
    // Data
    budgets,
    summary,
    recommendations,
    
    // State
    loading: loading || authLoading,
    error,
    clearError,
    
    // Actions
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    calculateRollover,
    checkBudgetLimit,
    applyRecommendation,
    syncBudgets,
    
    // Getters
    getBudgetByCategory,
    getBudgetProgress,
    
    // Loaders
    loadBudgetSummary,
    loadRecommendations
  };

  return (
    <BudgetsContext.Provider value={value}>
      {children}
    </BudgetsContext.Provider>
  );
};