// index.jsx
import React from 'react';
import { AuthProvider } from './AuthContext';
import { SocketProvider } from './SocketContext';
import { TransactionsProvider } from './TransactionsContext';
import { AccountsProvider } from './AccountsContext';
import { BudgetsProvider } from './BudgetsContext';
import { GoalsProvider } from './GoalsContext';
import { DebtProvider } from './DebtContext';
import { TransactionMoodProvider } from './TransactionMoodContext';
import { DashboardProvider } from './DashboardContext';

/**
 * Main provider component that wraps all application context providers
 * Providers are nested in a specific order based on dependencies:
 * 1. AuthProvider - Required by most other providers for authentication checks
 * 2. SocketProvider - Depends on authentication for WebSocket connections
 * 3. Data providers (Transactions, Accounts, Budgets, Goals, Debt) - Independent of each other
 * 4. TransactionMoodProvider - Depends on TransactionContext for mood analysis
 * 5. DashboardProvider - Depends on ALL data providers for aggregated analytics
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Wrapped application with all providers
 */
export function AllProviders({ children }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <TransactionsProvider>
          <AccountsProvider>
            <BudgetsProvider>
              <GoalsProvider>
                <DebtProvider>
                  <TransactionMoodProvider>
                    <DashboardProvider>
                      {children}
                    </DashboardProvider>
                  </TransactionMoodProvider>
                </DebtProvider>
              </GoalsProvider>
            </BudgetsProvider>
          </AccountsProvider>
        </TransactionsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

// Re-export all context hooks for centralized imports
export { useAuth } from './AuthContext';
export { useSocket } from './SocketContext';
export { useTransactions } from './TransactionsContext';
export { useAccounts } from './AccountsContext';
export { useBudgets } from './BudgetsContext';
export { useGoals } from './GoalsContext';
export { useDebt } from './DebtContext';
export { useTransactionMood } from './TransactionMoodContext';
export { useDashboard } from './DashboardContext';