// GoalsContext.jsx
import { createContext, useContext, useState } from 'react';
import { goalsAPI } from '../services/api';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useDataLoader } from '../hooks/useDataLoader';

const GoalsContext = createContext();

/**
 * Custom hook to access the financial goals context
 * @returns {Object} Goals context value
 * @throws {Error} If used outside of GoalsProvider
 */
export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};

/**
 * Provider component that manages financial goals state and operations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Goals context provider
 */
export const GoalsProvider = ({ children }) => {
  const { requireAuthSilent } = useAuthCheck();
  const { executeAsync, loading, error, clearError } = useDataLoader({ goals: [] });
  const [goals, setGoals] = useState([]);

  /**
   * Loads all financial goals from the API
   * @returns {Promise<Array>} Array of goal objects
   */
  const loadGoals = async () => {
    if (!requireAuthSilent()) return;
    
    const result = await executeAsync(async () => {
      const data = await goalsAPI.getAll();
      setGoals(data);
      return data;
    });
    
    return result;
  };

  /**
   * Creates a new financial goal
   * @param {Object} goalData - Goal creation data
   * @returns {Promise<Object>} Newly created goal object
   */
  const createGoal = async (goalData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const newGoal = await goalsAPI.create(goalData);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    });
    
    return result;
  };

  /**
   * Updates an existing financial goal
   * @param {string} id - Goal ID
   * @param {Object} goalData - Updated goal data
   * @returns {Promise<Object>} Updated goal object
   */
  const updateGoal = async (id, goalData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const updatedGoal = await goalsAPI.update(id, goalData);
      setGoals(prev => prev.map(goal => goal.id === id ? updatedGoal : goal));
      return updatedGoal;
    });
    
    return result;
  };

  /**
   * Deletes a financial goal by ID
   * @param {string} id - Goal ID to delete
   * @returns {Promise<Object>} Deletion result with ID
   */
  const deleteGoal = async (id) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      await goalsAPI.delete(id);
      setGoals(prev => prev.filter(goal => goal.id !== id));
      return { id };
    });
    
    return result;
  };

  /**
   * Makes a contribution towards a specific goal
   * @param {string} id - Goal ID
   * @param {Object} contributionData - Contribution information
   * @returns {Promise<Object>} Contribution result with updated goal
   */
  const contributeToGoal = async (id, contributionData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const result = await goalsAPI.contribute(id, contributionData);
      setGoals(prev => prev.map(goal => 
        goal.id === id ? { 
          ...goal, 
          currentAmount: result.goal.currentAmount, 
          isCompleted: result.goal.isCompleted 
        } : goal
      ));
      return result;
    });
    
    return result;
  };

  /**
   * Automatically allocates income towards goals based on priority and allocation rules
   * @param {Object} allocationData - Allocation rules and amounts
   * @returns {Promise<Object>} Auto-allocation result
   */
  const autoAllocateIncome = async (allocationData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const result = await goalsAPI.autoAllocate(allocationData);
      await loadGoals(); // Reload goals to get updated amounts
      return result;
    });
    
    return result;
  };

  /**
   * Retrieves a goal by ID from local state
   * @param {string} id - Goal ID
   * @returns {Object|undefined} Goal object or undefined if not found
   */
  const getGoalById = (id) => {
    return goals.find(goal => goal.id === id);
  };

  /**
   * Calculates progress metrics for all goals
   * @returns {Array} Array of goal objects with progress data
   */
  const getGoalProgress = () => {
    return goals.map(goal => ({
      ...goal,
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      daysLeft: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    }));
  };

  const value = {
    goals,
    loading,
    error,
    clearError,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    autoAllocateIncome,
    getGoalById,
    getGoalProgress
  };

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
};