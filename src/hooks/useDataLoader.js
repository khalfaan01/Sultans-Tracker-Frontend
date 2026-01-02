// useDataLoader.js
import { useState, useCallback } from 'react';

/**
 * Standardized loading state management hook
 * Provides consistent loading, error, and async operation patterns for data contexts
 * 
 * @param {Object} initialState - Initial state values to merge with defaults
 * @returns {Object} Loading state management utilities including:
 *   - loading: Current loading state
 *   - error: Current error message or null
 *   - setLoading: Function to update loading state
 *   - setError: Function to set error state and clear loading
 *   - clearError: Function to clear error state
 *   - executeAsync: Wrapper for async operations with built-in state management
 * 
 * @example
 * // In a data context:
 * const { loading, error, executeAsync } = useDataLoader();
 * const loadData = () => executeAsync(fetchData, { showLoading: true });
 */
export const useDataLoader = (initialState = {}) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    ...initialState
  });

  /**
   * Updates loading state and conditionally clears error
   * When setting loading to true, automatically clears any existing error
   * @param {boolean} loading - New loading state value
   */
  const setLoading = useCallback((loading) => {
    setState(prev => ({ 
      ...prev, 
      loading, 
      error: loading ? null : prev.error 
    }));
  }, []);

  /**
   * Sets error state and ensures loading is false
   * @param {string|null} error - Error message or null to clear
   */
  const setError = useCallback((error) => {
    setState(prev => ({ 
      ...prev, 
      error, 
      loading: false 
    }));
  }, []);

  /**
   * Clears any existing error without affecting other state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      error: null 
    }));
  }, []);

  /**
   * Executes async function with standardized loading and error handling
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Execution options
   * @param {boolean} options.showLoading - Whether to show loading state (default: true)
   * @param {boolean} options.clearErrorFirst - Whether to clear errors before execution (default: true)
   * @returns {Promise<Object>} Result object with success flag and data or error
   */
  const executeAsync = useCallback(async (asyncFn, options = {}) => {
    const { showLoading = true, clearErrorFirst = true } = options;
    
    try {
      if (showLoading) setLoading(true);
      if (clearErrorFirst) clearError();
      
      const result = await asyncFn();
      setLoading(false);
      return { success: true, data: result };
    } catch (error) {
      // Extract user-friendly error message with fallbacks
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        originalError: error 
      };
    }
  }, [setLoading, setError, clearError]);

  return {
    ...state,
    setLoading,
    setError,
    clearError,
    executeAsync
  };
};