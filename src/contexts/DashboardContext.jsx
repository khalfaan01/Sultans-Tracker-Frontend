// DashboardContext.jsx
import { createContext, useContext, useMemo } from 'react';
import { useTransactions } from './TransactionsContext';
import { useAccounts } from './AccountsContext';
import { useBudgets } from './BudgetsContext';
import { useGoals } from './GoalsContext';
import { useDebt } from './DebtContext';
import { useTransactionMood } from './TransactionMoodContext';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

/**
 * Custom hook to access the dashboard context
 * @returns {Object} Dashboard context value
 * @throws {Error} If used outside of DashboardProvider
 */
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

/**
 * Provider component that aggregates and processes data from multiple contexts
 * to provide comprehensive dashboard analytics and summaries
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Dashboard context provider
 */
export const DashboardProvider = ({ children }) => {
  const { transactions, loadTransactions } = useTransactions();
  const { accounts, loadAccounts } = useAccounts();
  const { budgets, loadBudgets } = useBudgets();
  const { goals, loadGoals } = useGoals();
  const { debts, loadDebts } = useDebt();
  const { analysis: moodAnalysis, loadAnalysis } = useTransactionMood();
  const { isAuthenticated } = useAuth();

  /**
   * Loads all dashboard data when user authenticates
   */
  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        loadTransactions?.(),
        loadAccounts?.(),
        loadBudgets?.(),
        loadGoals?.(),
        loadDebts?.(),
        loadAnalysis?.() 
      ].filter(Boolean))
      .then(() => {
        console.log('All dashboard data loaded successfully');
      })
      .catch(error => {
        console.error('Failed to load dashboard data:', error);
      });
    }
  }, [isAuthenticated]);

  /**
   * Calculates high-level financial metrics
   * @type {Object}
   */
  const financialSummary = useMemo(() => {
    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expenses = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const balance = income - expenses;
    const totalAccounts = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return {
      balance,
      income,
      expenses,
      totalAccounts,
      savingsRate,
      transactionCount: transactions.length
    };
  }, [transactions, accounts]);

  /**
   * Calculates spending progress against budget limits
   * @type {Array}
   */
  const budgetProgress = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(tx => tx.type === 'expense' && tx.category === budget.category)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      return {
        ...budget,
        spent,
        progress: budget.limit > 0 ? (spent / budget.limit) * 100 : 0,
        remaining: Math.max(0, budget.limit - spent),
        status: spent > budget.limit ? 'over' : spent > budget.limit * 0.8 ? 'warning' : 'good'
      };
    });
  }, [budgets, transactions]);

  /**
   * Calculates progress towards financial goals
   * @type {Array}
   */
  const goalProgress = useMemo(() => {
    return goals.map(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        ...goal,
        progress,
        daysLeft,
        status: progress >= 100 ? 'completed' : daysLeft <= 30 ? 'urgent' : 'active'
      };
    });
  }, [goals]);

  /**
   * Summarizes debt information and progress
   * @type {Object}
   */
  const debtSummary = useMemo(() => {
    const activeDebts = debts.filter(debt => debt.isActive);
    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.balance, 0);
    const totalMonthlyPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.principal - debt.balance), 0);
    const totalPrincipal = debts.reduce((sum, debt) => sum + debt.principal, 0);
    const overallProgress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;

    return {
      totalDebt,
      totalMonthlyPayments,
      activeDebts: activeDebts.length,
      overallProgress,
      debtFreeDate: calculateDebtFreeDate(activeDebts)
    };
  }, [debts]);

  /**
   * Breaks down expenses by category with percentages
   * @type {Array}
   */
  const categoryBreakdown = useMemo(() => {
    const breakdown = transactions.reduce((acc, tx) => {
      if (tx.type === 'expense') {
        const amount = Math.abs(tx.amount);
        acc[tx.category] = (acc[tx.category] || 0) + amount;
      }
      return acc;
    }, {});

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  /**
   * Calculates monthly income, expense, and net trends
   * @type {Array}
   */
  const monthlyTrends = useMemo(() => {
    const trends = transactions.reduce((acc, tx) => {
      const month = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        acc[month].income += tx.amount;
      } else {
        acc[month].expenses += Math.abs(tx.amount);
      }
      return acc;
    }, {});

    return Object.entries(trends)
      .map(([month, data]) => ({
        month,
        ...data,
        net: data.income - data.expenses
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6);
  }, [transactions]);

  /**
   * Generates insights based on transaction mood analysis
   * @type {Array}
   */
  const moodInsights = useMemo(() => {
    if (!moodAnalysis) return [];
    
    const insights = [];
    const { emotionalSpending = 0, plannedSpending = 0 } = moodAnalysis;
    
    if (emotionalSpending > plannedSpending * 1.5) {
      insights.push({
        type: 'emotional_spending',
        severity: 'medium',
        message: 'Emotional spending is higher than planned spending'
      });
    }

    const moodSpending = Object.entries(moodAnalysis.correlation || {});
    if (moodSpending.length > 0) {
      const highestMood = moodSpending.reduce((max, [mood, data]) => 
        data.average > max.average ? { mood, ...data } : max, 
        { mood: '', average: 0 }
      );
      
      if (highestMood.mood) {
        insights.push({
          type: 'highest_spending_mood',
          mood: highestMood.mood,
          average: highestMood.average,
          message: `Highest spending when feeling ${highestMood.mood}`
        });
      }
    }

    return insights;
  }, [moodAnalysis]);

  /**
   * Calculates estimated debt-free date based on current repayment rates
   * @param {Array} debts - Array of debt objects
   * @returns {Date|null} Estimated debt-free date or null if no active debts
   */
  function calculateDebtFreeDate(debts) {
    const activeDebts = debts.filter(debt => debt.isActive);
    if (activeDebts.length === 0) return null;
    
    const maxPayoff = Math.max(...activeDebts.map(debt => debt.estimatedPayoffMonths || 0));
    if (maxPayoff > 0) {
      const date = new Date();
      date.setMonth(date.getMonth() + maxPayoff);
      return date;
    }
    return null;
  }

  /**
   * Calculates a composite financial health score (0-100)
   * @type {number}
   */
  const financialHealthScore = useMemo(() => {
    let score = 50;
    
    // Savings rate contribution
    const savingsRate = financialSummary.savingsRate;
    score += Math.min(25, savingsRate / 2);
    
    // Debt-to-income ratio contribution
    const debtToIncome = debtSummary.totalDebt / (financialSummary.income || 1);
    if (debtToIncome < 0.3) score += 25;
    else if (debtToIncome < 0.5) score += 15;
    else if (debtToIncome < 0.7) score += 5;
    else score -= 10;
    
    // Budget adherence penalty
    const overBudgetCount = budgetProgress.filter(b => b.status === 'over').length;
    score -= overBudgetCount * 5;
    
    // Goal progress contribution
    const goalProgressAvg = goalProgress.length > 0 
      ? goalProgress.reduce((sum, g) => sum + g.progress, 0) / goalProgress.length
      : 0;
    score += Math.min(15, goalProgressAvg / 6.67);
    
    // Cash flow consistency penalty
    const negativeMonths = monthlyTrends.filter(m => m.net < 0).length;
    score -= negativeMonths * 3;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [financialSummary, debtSummary, budgetProgress, goalProgress, monthlyTrends]);

  /**
   * Gets summary data for a specific account
   * @param {string} accountId - Account ID
   * @returns {Object|null} Account summary or null if not found
   */
  const getAccountSummary = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return null;
    
    const accountTransactions = transactions.filter(tx => tx.accountId === accountId);
    const income = accountTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = accountTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    return {
      account,
      income,
      expenses,
      net: income - expenses,
      transactionCount: accountTransactions.length
    };
  };

  /**
   * Calculates debt-to-income ratio
   * @returns {number} Debt-to-income ratio
   */
  const getDebtToIncomeRatio = () => {
    return debtSummary.totalDebt / (financialSummary.income || 1);
  };

  /**
   * Gets top spending categories
   * @param {number} limit - Maximum number of categories to return
   * @returns {Array} Top categories by spending amount
   */
  const getTopCategories = (limit = 5) => {
    return categoryBreakdown.slice(0, limit);
  };

  const value = {
    // Summaries
    financialSummary,
    debtSummary,
    
    // Progress
    budgetProgress,
    goalProgress,
    
    // Analytics
    categoryBreakdown,
    monthlyTrends,
    moodInsights,
    
    // Scores
    financialHealthScore,
    
    // Helper functions
    getAccountSummary,
    getDebtToIncomeRatio,
    getTopCategories
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};