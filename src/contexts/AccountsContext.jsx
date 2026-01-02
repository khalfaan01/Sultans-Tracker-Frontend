// AccountsContext.jsx
import { createContext, useContext, useState } from 'react';
import { accountsAPI } from '../services/api';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useDataLoader } from '../hooks/useDataLoader';
import { useErrorHandler } from '../hooks/useErrorHandler';

const AccountsContext = createContext();

/**
 * Custom hook to access the accounts context
 * @returns {Object} Accounts context value
 * @throws {Error} If used outside of AccountsProvider
 */
export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};

/**
 * Provider component that manages accounts state and operations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Accounts context provider
 */
export const AccountsProvider = ({ children }) => {
  const { requireAuthSilent } = useAuthCheck();
  const { executeAsync, loading, error, clearError } = useDataLoader({ accounts: [] });
  const { handleError } = useErrorHandler();
  const [accounts, setAccounts] = useState([]);

  /**
   * Loads all accounts from the API
   * @returns {Promise<Array>} Array of account objects
   */
  const loadAccounts = async () => {
    if (!requireAuthSilent()) return;
    
    const result = await executeAsync(async () => {
      const data = await accountsAPI.getAll();
      setAccounts(data);
      return data;
    });
    
    return result;
  };

  /**
   * Creates a new account
   * @param {Object} accountData - Account creation data
   * @returns {Promise<Object>} Newly created account
   */
  const createAccount = async (accountData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const newAccount = await accountsAPI.create(accountData);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    });
    
    return result;
  };

  /**
   * Updates an existing account
   * @param {string} id - Account ID
   * @param {Object} accountData - Updated account data
   * @returns {Promise<Object>} Updated account object
   */
  const updateAccount = async (id, accountData) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      const updatedAccount = await accountsAPI.update(id, accountData);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      return updatedAccount;
    });
    
    return result;
  };

  /**
   * Deletes an account by ID
   * @param {string} id - Account ID to delete
   * @returns {Promise<Object>} Deletion result with ID
   */
  const deleteAccount = async (id) => {
    requireAuthSilent();
    
    const result = await executeAsync(async () => {
      await accountsAPI.delete(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      return { id };
    });
    
    return result;
  };

  /**
   * Retrieves an account by ID from local state
   * @param {string} id - Account ID
   * @returns {Object|undefined} Account object or undefined if not found
   */
  const getAccountById = (id) => {
    return accounts.find(acc => acc.id === id);
  };

  /**
   * Gets the balance for a specific account
   * @param {string} accountId - Account ID
   * @returns {number} Account balance or 0 if account not found
   */
  const getAccountBalance = (accountId) => {
    const account = getAccountById(accountId);
    return account ? account.balance : 0;
  };

  const value = {
    accounts,
    loading,
    error,
    clearError,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    getAccountBalance
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
};