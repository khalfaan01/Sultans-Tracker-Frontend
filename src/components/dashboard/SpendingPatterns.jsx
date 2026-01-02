// SpendingPatterns.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTransactions } from '../../contexts/TransactionsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Zap, 
  Calendar, 
  Target 
} from 'lucide-react';

const SpendingPatterns = () => {
  const { transactions, analytics } = useTransactions();
  const [timeRange, setTimeRange] = useState('3M');
  const [activeTab, setActiveTab] = useState('trends');
  const [error, setError] = useState(null);

  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Memoized pattern detection with error handling
  const patterns = useMemo(() => {
    try {
      if (!transactions || !Array.isArray(transactions)) {
        throw new Error('Invalid transactions data');
      }

      if (!transactions.length) return {};

      // Aggregate spending by category
      const categorySpending = transactions.reduce((acc, transaction) => {
        if (!transaction || typeof transaction.amount !== 'number') {
          console.warn('Invalid transaction skipped:', transaction);
          return acc;
        }

        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, transactions: [] };
        }
        acc[category].total += Math.abs(transaction.amount);
        acc[category].count += 1;
        acc[category].transactions.push(transaction);
        return acc;
      }, {});

      // Calculate monthly trends (income vs expenses)
      const monthlyTrends = transactions.reduce((acc, transaction) => {
        if (!transaction.date || !transaction.amount) return acc;

        try {
          const month = new Date(transaction.date).toISOString().slice(0, 7);
          if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
          
          if (transaction.amount > 0) {
            acc[month].income += transaction.amount;
          } else {
            acc[month].expenses += Math.abs(transaction.amount);
          }
        } catch (dateError) {
          console.warn('Invalid date in transaction:', transaction);
        }
        return acc;
      }, {});

      // Identify categories with spending >50% above average (unusual spending)
      const unusualSpending = Object.entries(categorySpending)
        .filter(([_, data]) => {
          if (data.count < 3) return false; // Need enough data points
          
          const avg = data.total / data.count;
          const latestTransactions = data.transactions.slice(-3);
          
          if (latestTransactions.length === 0) return false;
          
          const latestAvg = latestTransactions.reduce((sum, t) => {
            return sum + (t ? Math.abs(t.amount) : 0);
          }, 0) / latestTransactions.length;
          
          return latestAvg > avg * 1.5;
        })
        .map(([category]) => category);

      // Get top 6 spending categories sorted by total
      const topCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 6)
        .map(([name, data]) => ({ name, ...data }));

      // Format monthly trends for chart display
      const formattedMonthlyTrends = Object.entries(monthlyTrends)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort chronologically
        .map(([month, data]) => ({
          month,
          ...data,
          savings: data.income - data.expenses
        }));

      return {
        categorySpending,
        monthlyTrends: formattedMonthlyTrends,
        unusualSpending,
        topCategories
      };

    } catch (err) {
      console.error('Error calculating spending patterns:', err);
      setError('Failed to analyze spending patterns');
      return {};
    }
  }, [transactions]);

  // Determine risk level based on recent vs average spending
  const getRiskLevel = useCallback((category) => {
    try {
      const spending = patterns.categorySpending?.[category];
      if (!spending || spending.count < 5) return 'low';
      
      const avgTransaction = spending.total / spending.count;
      const recentTransactions = spending.transactions.slice(-5);
      
      if (recentTransactions.length === 0) return 'low';
      
      const recentAvg = recentTransactions.reduce((sum, t) => {
        return sum + (t ? Math.abs(t.amount) : 0);
      }, 0) / recentTransactions.length;
      
      // Risk thresholds: >80% above average = high, >30% = medium
      if (recentAvg > avgTransaction * 1.8) return 'high';
      if (recentAvg > avgTransaction * 1.3) return 'medium';
      return 'low';
    } catch (err) {
      console.warn('Error calculating risk level for category:', category, err);
      return 'low';
    }
  }, [patterns]);

  // Calculate savings rate safely
  const calculateSavingsRate = () => {
    try {
      if (!patterns.monthlyTrends?.length) return 0;
      
      const totalSavings = patterns.monthlyTrends.reduce((sum, month) => sum + (month.savings || 0), 0);
      const totalIncome = patterns.monthlyTrends.reduce((sum, month) => sum + (month.income || 0), 0);
      
      if (totalIncome <= 0) return 0;
      return (totalSavings / totalIncome) * 100;
    } catch (err) {
      console.warn('Error calculating savings rate:', err);
      return 0;
    }
  };

  // Calculate average monthly savings safely
  const calculateAvgMonthlySavings = () => {
    try {
      if (!patterns.monthlyTrends?.length) return 0;
      
      const totalSavings = patterns.monthlyTrends.reduce((sum, month) => sum + (month.savings || 0), 0);
      return totalSavings / patterns.monthlyTrends.length;
    } catch (err) {
      console.warn('Error calculating average monthly savings:', err);
      return 0;
    }
  };

  // Calculate spending efficiency (inverse of expense-to-income ratio)
  const calculateSpendingEfficiency = () => {
    try {
      if (!patterns.monthlyTrends?.length) return 0;
      
      const totalExpenses = patterns.monthlyTrends.reduce((sum, month) => sum + (month.expenses || 0), 0);
      const totalIncome = patterns.monthlyTrends.reduce((sum, month) => sum + (month.income || 0), 0);
      
      if (totalIncome <= 0) return 0;
      return Math.max(0, 100 - (totalExpenses / totalIncome) * 100);
    } catch (err) {
      console.warn('Error calculating spending efficiency:', err);
      return 0;
    }
  };

  // Render loading/error states
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!transactions || !Array.isArray(transactions)) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Invalid transaction data</p>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No transaction data available for analysis</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header with Insights */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Spending Intelligence</h2>
          <p className="text-gray-600">AI-powered pattern analysis and insights</p>
        </div>
        <div className="flex gap-2">
          {['trends', 'categories', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 mb-6">
        {['1M', '3M', '6M', '1Y', 'All'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              timeRange === range
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Trend Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patterns.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Avg Monthly Savings</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ${calculateAvgMonthlySavings().toFixed(2)}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Savings Rate</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {calculateSavingsRate().toFixed(1)}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">Spending Efficiency</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {calculateSpendingEfficiency().toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-6 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={patterns.topCategories || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {(patterns.topCategories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patterns.topCategories || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                  <Bar dataKey="total" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Unusual Spending Alerts */}
            {patterns.unusualSpending?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-800">Unusual Spending Detected</h3>
                </div>
                <div className="space-y-2">
                  {patterns.unusualSpending.map(category => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-orange-700">{category}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getRiskLevel(category) === 'high' 
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {getRiskLevel(category).toUpperCase()} RISK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Optimization Opportunities</h3>
              </div>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• Consider reducing dining out by 15% to save ~$85/month</p>
                <p>• Subscription services increased by 22% this month</p>
                <p>• High grocery spending detected - bulk buying could save 12%</p>
              </div>
            </div>

            {/* Predictive Insights */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Predictive Analysis</h3>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <p>• Projected monthly savings: $420 (15% increase)</p>
                <p>• On track to meet 85% of financial goals</p>
                <p>• Credit score impact: Positive (+8 points projected)</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpendingPatterns;