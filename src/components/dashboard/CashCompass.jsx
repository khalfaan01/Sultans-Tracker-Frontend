// src/components/dashboard/CashCompass.jsx
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, 
  Target, Zap, Brain, Heart, Calendar, Loader2 
} from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions, useBudgets, useTransactionMood } from '../../contexts';

/**
 * Cash Compass: AI-powered financial behavior analysis tool
 * 
 * Purpose:
 * - Analyzes spending patterns correlated with emotional states
 * - Provides personalized financial recommendations based on behavior
 * - Visualizes mood-spending relationships for self-awareness
 * - Offers actionable insights to improve financial habits
 * 
 * Key Features:
 * - Emotional spending detection and categorization
 * - Budget adherence monitoring with proactive alerts
 * - Savings rate analysis with benchmark comparisons
 * - Mood-spending correlation heatmaps
 * - Personalized action recommendations
 * 
 * Data Integration:
 * - Transactions: Raw spending and income data
 * - Budgets: Financial targets and limits per category  
 * - Moods: Emotional states associated with transactions
 * - Analysis: Pre-computed mood-spending correlations
 */
export default function CashCompass() {
  // Centralized data contexts for consistent state management
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions();
  const { budgets, loading: budgetsLoading, error: budgetsError } = useBudgets();
  const { moods, analysis, loading: moodsLoading, error: moodsError, } = useTransactionMood();
  
  const [timeRange, setTimeRange] = useState('month');
  const navigate = useNavigate();

  const isLoading = transactionsLoading || budgetsLoading || moodsLoading;
  const hasError = transactionsError || budgetsError || moodsError;

  /**
   * Analyzes spending patterns based on emotional states
   * Categorizes transactions into emotional, planned, and impulsive spending
   * Tracks weekly patterns and monthly trends for behavior analysis
   */
  const spendingPatterns = useMemo(() => {

    // Check if we have valid mood data
    if (!moods || !Array.isArray(moods) || moods.length === 0) {
      return {
        emotionalSpending: 0,
        plannedSpending: 0,
        impulsiveSpending: 0,
        weeklyPatterns: {},
        monthlyTrends: {}
      };
    }

    // Initialize pattern tracking structure
    const patterns = {
      emotionalSpending: 0,   // Spending during stressed/bored/anxious states
      plannedSpending: 0,     // Intentional, pre-planned purchases
      impulsiveSpending: 0,   // Unplanned, spur-of-moment purchases
      weeklyPatterns: {},     // Spending by day of week (0=Sunday, 6=Saturday)
      monthlyTrends: {}       // Monthly spending trends (not implemented in original)
    };

     // Use a Map for faster transaction lookups
    const transactionMap = new Map();
    transactions.forEach(tx => transactionMap.set(tx.id, tx));

    // Process each mood-tagged transaction
    moods.forEach(mood => {
      const transaction = transactionMap.get(mood.transactionId);
      if (!transaction || transaction.type !== 'expense') return;

      const amount = Math.abs(transaction.amount);
      
      // Categorize spending based on emotional state
      if (['stressed', 'bored', 'anxious'].includes(mood.mood)) {
        patterns.emotionalSpending += amount;
      } else if (mood.mood === 'planned') {
        patterns.plannedSpending += amount;
      } else if (mood.mood === 'impulsive') {
        patterns.impulsiveSpending += amount;
      }

      // Track weekly spending patterns (0 = Sunday, 6 = Saturday)
      const dayOfWeek = new Date(transaction.date).getDay();
      patterns.weeklyPatterns[dayOfWeek] = (patterns.weeklyPatterns[dayOfWeek] || 0) + amount;
    });

    return patterns;
  }, [moods, transactions]); // Only depend on moods and transactions

  /**
   * Generates personalized financial recommendations
   * Analyzes emotional spending patterns, budget adherence, and savings rates
   * Returns actionable insights with specific improvement suggestions
   */
  const recommendations = useMemo(() => {
    const recs = [];
    
    // Check if we have valid data
    if (!moods || moods.length === 0) {
      return recs;
    }

    // Emotional spending analysis - flag when emotional spending exceeds planned
    if (spendingPatterns.emotionalSpending > spendingPatterns.plannedSpending && spendingPatterns.emotionalSpending > 0) {
      recs.push({
        type: 'behavioral',
        icon: Brain,
        title: 'Emotional Spending Detected',
        message: `You spend $${spendingPatterns.emotionalSpending.toFixed(2)} when feeling emotional vs $${spendingPatterns.plannedSpending.toFixed(2)} on planned purchases.`,
        action: 'Try the 24-hour rule: Wait a day before making emotional purchases'
      });
    }
    // Budget adherence analysis - warn when approaching or exceeding limits
    budgets.forEach(budget => {
      // Calculate spent amount for this budget category
      const spent = transactions
        .filter(tx => tx.type === 'expense' && tx.category === budget.category)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Alert when reaching 80% of budget (industry standard warning threshold)
      if (spent > budget.limit * 0.8) {
        recs.push({
          type: 'budget',
          icon: Target,
          title: `${budget.category} Budget Alert`,
          message: `You've used ${((spent / budget.limit) * 100).toFixed(1)}% of your ${budget.category} budget.`,
          action: `Consider reducing ${budget.category} spending for the rest of the period`
        });
      }
    });

    // Savings rate analysis - compare against recommended 20% benchmark
    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalExpenses = Math.abs(transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0));
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    // Recommend savings improvement when below 20% benchmark
    if (savingsRate < 20 && totalIncome > 0) {
      recs.push({
        type: 'savings',
        icon: TrendingUp,
        title: 'Savings Opportunity',
        message: `Your current savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% for healthy finances.`,
        action: 'Consider automating savings transfers each pay period'
      });
    }

    return recs;
  }, [transactions, budgets, spendingPatterns, moods]
);

   // Enhanced loading state
  if (isLoading) {
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard/transactions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>
      
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">Loading your financial behavior analysis...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment as we analyze your mood data</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced error state
if (hasError) {
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard/transactions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>
      
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <AlertTriangle className="inline mr-2" size={20} />
        Unable to load financial behavior data. 
        <button 
          onClick={() => window.location.reload()}
          className="ml-2 text-red-800 underline hover:text-red-900"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Check if we have mood data 
const hasMoodData = moods && Array.isArray(moods) && moods.length > 0;

if (!hasMoodData) {
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard/transactions')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>
      
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Lightbulb className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-bold mb-2">Start Tracking Your Spending Moods</h3>
        <p className="text-gray-600 mb-4">
          The Cash Compass analyzes how your emotions affect your spending habits. 
          Track your mood on at least 5 transactions to unlock personalized insights.
        </p>
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Moods tracked:</span>
            <span className="font-bold">0</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <button
            onClick={() => navigate('/dashboard/transactions')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full mt-4"
          >
            Go to Transactions & Start Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

// Use analysis data 
const moodAnalysisData = analysis || {
  totalTracked: moods.length,
  averageSpendingByMood: {}
};

return (
  <div className="space-y-6">
    <button
      onClick={() => navigate('/dashboard/transactions')}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft size={16} />
      Back to Transactions
    </button>

    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Cash Compass</h2>
        <p className="text-gray-600">
          Analyzing {moods.length} mood-tagged transactions
          {moodAnalysisData.totalTracked > 0 && ` • ${moodAnalysisData.totalTracked} analyzed`}
        </p>
      </div>
      
      <select
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
      >
        <option value="week">Last Week</option>
        <option value="month">Last Month</option>
        <option value="year">Last Year</option>
      </select>
    </div>

    {/* Spending pattern cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <Brain className="text-purple-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Emotional Spending</p>
            <p className="text-xl font-bold text-purple-600">
              ${spendingPatterns.emotionalSpending.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {moods.filter(m => ['stressed', 'bored', 'anxious'].includes(m.mood)).length} transactions
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <Calendar className="text-green-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Planned Spending</p>
            <p className="text-xl font-bold text-green-600">
              ${spendingPatterns.plannedSpending.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {moods.filter(m => m.mood === 'planned').length} transactions
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <Zap className="text-orange-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Impulsive Spending</p>
            <p className="text-xl font-bold text-orange-600">
              ${spendingPatterns.impulsiveSpending.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {moods.filter(m => m.mood === 'impulsive').length} transactions
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <Lightbulb className="text-blue-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Smart Suggestions</p>
            <p className="text-xl font-bold text-blue-600">
              {recommendations.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on your behavior
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Recommendations */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Personalized Guidance</h3>
      
      {recommendations.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <Lightbulb className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-600">Great job! Your financial habits are on track.</p>
          <p className="text-sm text-gray-500 mt-2">
            Continue tracking moods to get more personalized insights.
          </p>
        </div>
      ) : (
        recommendations.map((rec, index) => {
          const Icon = rec.icon;
          
          const getBorderColor = (type) => {
            switch (type) {
              case 'behavioral': return 'border-purple-200 bg-purple-50';
              case 'budget': return 'border-red-200 bg-red-50';
              case 'savings': return 'border-green-200 bg-green-50';
              default: return 'border-blue-200 bg-blue-50';
            }
          };

          const getIconColor = (type) => {
            switch (type) {
              case 'behavioral': return 'text-purple-600';
              case 'budget': return 'text-red-600';
              case 'savings': return 'text-green-600';
              default: return 'text-blue-600';
            }
          };

          return (
            <motion.div
              layoutEffect={false}
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-l-4 ${getBorderColor(rec.type)}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`mt-1 ${getIconColor(rec.type)}`} size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                  <p className="text-gray-600 mt-1">{rec.message}</p>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-gray-700">💡 Suggested Action:</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.action}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>

    {/* Mood analysis section */}
    {moodAnalysisData.totalTracked > 0 && (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Spending Psychology Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Mood vs Spending</h4>
            <div className="space-y-3">
              {Object.entries(moodAnalysisData.averageSpendingByMood || {}).length > 0 ? (
                Object.entries(moodAnalysisData.averageSpendingByMood).map(([mood, data]) => (
                  <div key={mood} className="flex items-center justify-between">
                    <span className="capitalize text-sm min-w-20">{mood}</span>
                    <div className="flex items-center space-x-2 flex-1 max-w-48">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((data.average / 100) * 100, 100)}%`,
                            backgroundColor: mood === 'stressed' ? '#ef4444' : 
                                           mood === 'happy' ? '#10b981' :
                                           mood === 'bored' ? '#f59e0b' :
                                           mood === 'planned' ? '#3b82f6' : '#8b5cf6'
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium w-12 text-right">${data.average.toFixed(0)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Analyzing your mood-spending patterns...</p>
                  <p className="text-sm mt-1">This data updates as you track more moods</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Behavioral Patterns</h4>
            <div className="space-y-3">
              {/* Emotional vs Planned Ratio */}
              <div className="flex justify-between items-center">
                <span className="text-sm">Emotional vs Planned Ratio</span>
                <span className="text-sm font-medium">
                  {spendingPatterns.plannedSpending > 0 
                    ? `${((spendingPatterns.emotionalSpending / spendingPatterns.plannedSpending) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              
              {/* Highest Spending Day */}
              <div className="flex justify-between items-center">
                <span className="text-sm">Highest Spending Day</span>
                <span className="text-sm font-medium">
                  {(() => {
                    if (Object.keys(spendingPatterns.weeklyPatterns).length === 0) return 'No data';
                    
                    try {
                      // Find day with maximum spending
                      const highestDay = Object.entries(spendingPatterns.weeklyPatterns)
                        .reduce((max, [day, amount]) => amount > max.amount ? { day, amount } : max, { day: 0, amount: 0 });
                      
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return dayNames[parseInt(highestDay.day)] || 'Unknown';
                    } catch (error) {
                      console.error('Error calculating highest spending day:', error);
                      return 'Error';
                    }
                  })()}
                </span>
              </div>
              
              {/* Transactions Analyzed */}
              <div className="flex justify-between items-center">
                <span className="text-sm">Transactions Analyzed</span>
                <span className="text-sm font-medium">{moods.length}</span>
              </div>
              
              {/* Average Transaction Value by Mood (Bonus Insight) */}
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Transaction Value</span>
                <span className="text-sm font-medium">
                  {(() => {
                    if (moods.length === 0) return '$0';
                    
                    try {
                      let totalAmount = 0;
                      let moodCount = 0;
                      
                      moods.forEach(mood => {
                        const transaction = transactions.find(t => t.id === mood.transactionId);
                        if (transaction && transaction.type === 'expense') {
                          totalAmount += Math.abs(transaction.amount);
                          moodCount++;
                        }
                      });
                      
                      return moodCount > 0 ? `$${(totalAmount / moodCount).toFixed(0)}` : '$0';
                    } catch (error) {
                      console.error('Error calculating average transaction value:', error);
                      return 'Error';
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}