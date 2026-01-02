import { useState, useEffect, useMemo } from 'react';
import { useTransactions, useDashboard, useBudgets, useGoals } from '../contexts';
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart';
import TopExpensesChart from '../components/dashboard/TopExpensesChart';
import CashFlowRadar from '../components/dashboard/CashFlowRadar';
import FinanceHealthScore from '../components/dashboard/FinanceHealthScore';
import SmartSuggestions from '../components/dashboard/SmartSuggestions';
import NotificationsSummary from '../components/dashboard/NotificationsSummary';

const HomePage = () => {
  // Context data with loading states
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { goals, loading: goalsLoading } = useGoals();
  const { 
    financialSummary, 
    budgetProgress, 
    goalProgress, 
    categoryBreakdown,
    monthlyTrends,
    financialHealthScore,
    loading: dashboardLoading 
  } = useDashboard();

  const [timeframe, setTimeframe] = useState('monthly'); // 'monthly' or 'yearly'
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Process dashboard data when context data changes
  useEffect(() => {
    try {
      if (!dashboardLoading && financialSummary) {
        setDashboardData({
          balance: financialSummary.balance || 0,
          income: financialSummary.income || 0,
          expenses: financialSummary.expenses || 0,
          categoryBreakdown: categoryBreakdown || {},
          monthlyData: monthlyTrends || [],
          budgetProgress: budgetProgress || [],
          goalProgress: goalProgress || []
        });
      } else {
        // Initialize with empty structure during loading or if no data
        setDashboardData({
          balance: 0,
          income: 0,
          expenses: 0,
          categoryBreakdown: {},
          monthlyData: [],
          budgetProgress: [],
          goalProgress: []
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error processing dashboard data:', err);
      setError('Failed to process dashboard data');
    }
  }, [dashboardLoading, financialSummary, categoryBreakdown, monthlyTrends, budgetProgress, goalProgress]);

  // Filter transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    try {
      if (!transactions?.length) return [];
      
      const now = new Date();
      const filterDate = new Date();
      
      if (timeframe === 'monthly') {
        filterDate.setMonth(now.getMonth() - 1);
      } else { // yearly
        filterDate.setFullYear(now.getFullYear() - 1);
      }
      
      return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= filterDate && txDate <= now;
      });
    } catch (err) {
      console.error('Error filtering transactions:', err);
      return [];
    }
  }, [transactions, timeframe]);

  const isLoading = transactionsLoading || budgetsLoading || goalsLoading || dashboardLoading;

  // Error state display
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Error loading dashboard</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state display
  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with timeframe controls */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeframe === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeframe('yearly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeframe === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            {timeframe === 'monthly' ? 'Last 30 days overview' : 'Last 12 months overview'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardData.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Income</p>
                <p className="text-2xl font-bold text-green-600">
                  +${dashboardData.income.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  -${dashboardData.expenses.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Income vs Expenses Chart - Takes 2/3 width on large screens */}
          <div className="lg:col-span-1 xl:col-span-2">
            <IncomeExpenseChart 
              data={dashboardData.monthlyData} 
              timeframe={timeframe}
            />
          </div>

          {/* Finance Health Score */}
          <div className="lg:col-span-1">
            <FinanceHealthScore 
              transactions={filteredTransactions}
              budgets={budgets}
              goals={goals}
              financialHealthScore={financialHealthScore}
              timeframe={timeframe}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Top 5 Expenses */}
          <div className="lg:col-span-1">
            <TopExpensesChart 
              categoryBreakdown={dashboardData.categoryBreakdown}
            />
          </div>

          {/* Cash Flow Radar - Takes 2/3 width on extra large screens */}
          <div className="lg:col-span-1 xl:col-span-2">
            <CashFlowRadar 
              transactions={filteredTransactions}
              timeframe={timeframe}
            />
          </div>
        </div>

        {/* Third Row - Equal width columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <SmartSuggestions 
              transactions={filteredTransactions}
              budgets={budgets}
              categoryBreakdown={dashboardData.categoryBreakdown}
              timeframe={timeframe}
            />
          </div>

          <div className="lg:col-span-1">
            <NotificationsSummary 
              transactions={transactions}
              budgets={budgets}
              goals={goals}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;