// useAuthCheck.js
import { useAuth } from '../contexts/AuthContext';

/**
 * Centralized authentication verification hook
 * Provides authentication state and guard functions for protected operations
 * 
 * @returns {Object} Authentication utilities including:
 *   - isAuthenticated: Current authentication state
 *   - authLoading: Loading state from auth context
 *   - requireAuth: Throws error if user is not authenticated
 *   - requireAuthSilent: Returns boolean without throwing
 * 
 * @example
 * // In data context hooks:
 * const { requireAuth } = useAuthCheck();
 * requireAuth(); // Will throw if not authenticated
 */
export const useAuthCheck = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  /**
   * Enforces authentication by throwing error if user is not authenticated
   * @throws {Error} When user is not authenticated
   */
  const requireAuth = () => {
    if (authLoading) {
      throw new Error('Authentication is still loading');
    }
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to perform this action');
    }
  };

  /**
   * Silent authentication check that returns boolean without throwing
   * @returns {boolean} True if authenticated, false otherwise
   */
  const requireAuthSilent = () => {
    if (authLoading) {
      console.log('AuthCheck - Authentication is still loading');
      return false;
    }
    if (!isAuthenticated) {
      console.log('AuthCheck - User not authenticated');
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    authLoading,
    requireAuth,
    requireAuthSilent
  };
};