// useErrorHandler.js
import { useState, useCallback } from 'react';

/**
 * Centralized error handling hook for consistent error management across contexts
 * Provides standardized error extraction, logging, and state management
 * 
 * @returns {Object} Error handling utilities including:
 *   - error: Current error message or null
 *   - handleError: Processes errors and extracts user-friendly messages
 *   - clearError: Resets error state
 * 
 * @example
 * // In any component or hook:
 * const { error, handleError, clearError } = useErrorHandler();
 * 
 * try {
 *   await someOperation();
 * } catch (err) {
 *   handleError(err, 'OperationName');
 * }
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);

  /**
   * Processes errors consistently with context-aware logging and message extraction
   * Prioritizes API error messages, falls back to generic messages
   * 
   * @param {Error|any} error - The caught error object
   * @param {string} context - Descriptive context for error logging (e.g., 'UserLogin', 'DataFetch')
   * @returns {string} Extracted user-friendly error message
   */
  const handleError = useCallback((error, context = '') => {
    const logPrefix = context ? `${context} - ` : '';
    console.error(`${logPrefix}Error:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    
    // Prioritize API response messages, then standard error messages
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    return errorMessage;
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
};