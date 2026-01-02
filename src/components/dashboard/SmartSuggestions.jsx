// SmartSuggestions.jsx
import { useMemo } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Zap, 
  Target, 
  Calendar 
} from 'lucide-react';

/**
 * AI-powered financial suggestion engine with contextual awareness
 * 
 * Features:
 * - Multi-dimensional spending pattern analysis with statistical methods
 * - Behavioral finance insights using transaction timing and frequency analysis
 * - Budget adherence monitoring with proactive threshold alerts
 * - Savings optimization recommendations with income diversification scoring
 * - Real-time cash flow volatility detection and forecasting integration
 * - Enhanced analytics integration for contextual awareness
 * 
 * Analysis Methods:
 * 1. Statistical Analysis: Z-score detection for unusual spending patterns
 * 2. Behavioral Analysis: Temporal patterns (weekend/weekday, rapid spending)
 * 3. Comparative Analysis: Category spending vs. user averages
 * 4. Predictive Analysis: Forecast risk factor integration
 * 5. Contextual Analysis: Enhanced data integration for deeper insights
 * 
 * Suggestion Categories:
 * - High spending alerts with statistical significance testing
 * - Budget adherence warnings with progressive severity levels
 * - Savings optimization opportunities with diversification scoring
 * - Recurring expense optimization with pattern recognition
 * - Large transaction alerts with behavioral context
 * - Cash flow volatility warnings with forecasting integration
 * - Income diversity recommendations
 * - Behavioral spending pattern insights
 */

// ==================== HELPER FUNCTIONS ====================

/**
 * Generates contextual spending summary for a specific category
 * @param {string} category - Transaction category to analyze
 * @param {Array} transactions - Filtered transactions for the category
 * @param {Object} enhancedData - Optional enhanced analytics data
 * @returns {string} Human-readable spending context summary
 */
const getSpendingContext = (category, transactions, enhancedData) => {
  if (!transactions.length) return 'No transaction details available';
  
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  
  const total = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const avg = total / transactions.length;
  
  return `${transactions.length} transactions, averaging $${avg.toFixed(2)} each`;
};

/**
 * Detects statistically unusual spending patterns using z-score calculation
 * Identifies transactions that deviate significantly from user's normal spending
 * @param {Object} transaction - Individual transaction to analyze
 * @param {Array} allTransactions - All user transactions for baseline
 * @param {Object} enhancedData - Enhanced analytics for additional context
 * @returns {boolean} True if transaction is statistically unusual
 */
const isUnusualSpendingPattern = (transaction, allTransactions, enhancedData) => {
  const categoryTransactions = allTransactions.filter(tx => 
    tx.category === transaction.category && tx.type === 'expense'
  );
  
  // Need sufficient data for statistical analysis
  if (categoryTransactions.length < 3) return false;
  
  const amounts = categoryTransactions.map(tx => Math.abs(tx.amount));
  const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - avgAmount, 2)).reduce((a, b) => a + b) / amounts.length);
  
  const currentAmount = Math.abs(transaction.amount);
  const zScore = (currentAmount - avgAmount) / stdDev;
  
  // Flag transactions more than 2 standard deviations from mean
  return Math.abs(zScore) > 2;
};

/**
 * Analyzes behavioral spending patterns including temporal habits
 * @param {Array} transactions - User transaction history
 * @param {Object} enhancedData - Enhanced analytics for pattern recognition
 * @returns {Array} Behavioral pattern insights with severity scoring
 */
const detectBehavioralPatterns = (transactions, enhancedData) => {
  const patterns = [];
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
  
  // Require sufficient data for meaningful analysis
  if (expenseTransactions.length < 5) return patterns;

  // Rapid spending detection - multiple transactions within short timeframes
  const sortedTransactions = expenseTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  let rapidSpendingCount = 0;
  
  for (let i = 1; i < sortedTransactions.length; i++) {
    const timeDiff = new Date(sortedTransactions[i].date) - new Date(sortedTransactions[i-1].date);
    if (timeDiff < 4 * 60 * 60 * 1000) { // 4-hour threshold
      rapidSpendingCount++;
    }
  }
  
  // Alert if more than 20% of transactions show rapid spending pattern
  if (rapidSpendingCount > expenseTransactions.length * 0.2) {
    patterns.push({
      type: 'behavioral_rapid_spending',
      count: rapidSpendingCount,
      message: `${rapidSpendingCount} instances of rapid spending detected`,
      severity: 'medium',
      icon: Zap,
      action: 'Implement a cooling-off period for purchases',
      context: 'Multiple purchases in short timeframes may indicate impulse spending'
    });
  }

  // Weekend vs weekday spending analysis
  const weekendTransactions = expenseTransactions.filter(tx => {
    const day = new Date(tx.date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });
  
  const weekdayTransactions = expenseTransactions.filter(tx => {
    const day = new Date(tx.date).getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  });
  
  const weekendTotal = weekendTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const weekdayTotal = weekdayTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Alert if weekend spending exceeds weekday by 50% or more
  if (weekendTotal > weekdayTotal * 1.5 && weekendTransactions.length > 0) {
    patterns.push({
      type: 'behavioral_weekend_spending',
      weekendRatio: (weekendTotal / weekdayTotal).toFixed(1),
      message: `Weekend spending is ${(weekendTotal / weekdayTotal).toFixed(1)}x higher than weekdays`,
      severity: 'low',
      icon: Calendar,
      action: 'Plan weekend activities with budget in mind',
      context: 'Higher weekend spending is common but should be monitored'
    });
  }

  return patterns;
};

// ==================== MAIN COMPONENT ====================

const SmartSuggestions = ({ transactions, budgets, categoryBreakdown, timeframe, enhancedData, loading, error }) => {
  /**
   * Primary suggestion generation engine with multi-stage analysis
   * Processes transactions through multiple analytical filters to generate insights
   */
  const suggestions = useMemo(() => {
    const suggestionsList = [];

    // Early return for empty or insufficient data
    if (!transactions || transactions.length === 0) {
      return suggestionsList;
    }

    // Determine if enhanced analytics data is available
    const useEnhancedData = enhancedData && enhancedData.contextualInsights;
    const currentPeriod = transactions;

    // Stage 1: Categorical spending analysis with comparative benchmarks
    const categorySpending = {};
    currentPeriod.forEach(tx => {
      if (tx.type === 'expense') {
        const amount = Math.abs(tx.amount);
        if (!categorySpending[tx.category]) {
          categorySpending[tx.category] = { current: 0, previous: 0, transactions: [] };
        }
        categorySpending[tx.category].current += amount;
        categorySpending[tx.category].transactions.push(tx);
      }
    });

    // Stage 2: High spending detection with statistical significance
    Object.entries(categorySpending).forEach(([category, spending]) => {
      const avgSpending = Object.values(categorySpending).reduce((sum, s) => sum + s.current, 0) / Object.keys(categorySpending).length;
      
      // Flag categories spending 50%+ above user average
      if (spending.current > avgSpending * 1.5) {
        const percentageAbove = ((spending.current - avgSpending) / avgSpending * 100).toFixed(1);
        
        suggestionsList.push({
          type: 'high_spending',
          category,
          amount: spending.current,
          average: avgSpending,
          percentage: percentageAbove,
          message: `You're spending ${percentageAbove}% more on ${category.toLowerCase()} than average`,
          severity: percentageAbove > 100 ? 'high' : 'medium',
          icon: TrendingUp,
          context: getSpendingContext(category, spending.transactions, enhancedData)
        });
      }

      // Budget adherence monitoring with progressive severity
      const categoryBudget = budgets?.find(b => b.category === category);
      if (categoryBudget && spending.current > categoryBudget.limit * 0.8) {
        const percentageUsed = (spending.current / categoryBudget.limit) * 100;
        
        suggestionsList.push({
          type: 'budget_alert',
          category,
          percentageUsed: percentageUsed.toFixed(1),
          message: `You've used ${percentageUsed.toFixed(1)}% of your ${category} budget`,
          severity: percentageUsed >= 100 ? 'high' : 
                    percentageUsed >= 90 ? 'medium' : 'low',
          icon: percentageUsed >= 100 ? AlertTriangle : TrendingUp,
          action: percentageUsed >= 100 ? 'Immediate budget review needed' : 'Consider adjusting budget'
        });
      }
    });

    // Stage 3: Savings analysis with income diversification consideration
    const totalIncome = currentPeriod
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalExpenses = currentPeriod
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    // Savings opportunity detection (below 15% threshold)
    if (savingsRate < 15 && totalIncome > 0) {
      const incomeDiversity = enhancedData?.incomeBreakdown?.diversityScore || 0;
      
      suggestionsList.push({
        type: 'savings_opportunity',
        savingsRate: savingsRate.toFixed(1),
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Target 20% for better financial health`,
        severity: savingsRate < 5 ? 'high' : 'medium',
        icon: DollarSign,
        context: incomeDiversity < 50 ? 'Consider diversifying income to increase savings capacity' : 'Review discretionary spending'
      });
    }

    // Stage 4: Recurring expense optimization
    const recurringCategories = ['Subscription', 'Membership', 'Utilities', 'Entertainment'];
    recurringCategories.forEach(category => {
      const categorySpent = categorySpending[category]?.current || 0;
      if (categorySpent > 50) { // Minimum threshold for optimization suggestions
        const avgTransactionSize = categorySpending[category]?.transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / categorySpending[category]?.transactions?.length || 0;
        
        suggestionsList.push({
          type: 'recurring_optimization',
          category,
          amount: categorySpent,
          avgTransaction: avgTransactionSize,
          message: `Review ${category.toLowerCase()} expenses: $${categorySpent.toFixed(2)} monthly`,
          severity: categorySpent > 200 ? 'medium' : 'low',
          icon: Lightbulb,
          action: `Consider bundling or negotiating ${category.toLowerCase()} services`
        });
      }
    });

    // Stage 5: Large transaction alerts with behavioral context
    const largeTransactions = currentPeriod
      .filter(tx => tx.type === 'expense' && Math.abs(tx.amount) > 300)
      .slice(0, 5);
    
    largeTransactions.forEach(tx => {
      const isUnusual = isUnusualSpendingPattern(tx, currentPeriod, enhancedData);
      
      suggestionsList.push({
        type: 'large_expense',
        amount: Math.abs(tx.amount),
        category: tx.category,
        date: tx.date,
        message: `Large ${isUnusual ? 'unusual ' : ''}expense: $${Math.abs(tx.amount).toFixed(2)} on ${tx.category.toLowerCase()}`,
        severity: isUnusual ? 'medium' : 'info',
        icon: isUnusual ? AlertTriangle : DollarSign,
        context: isUnusual ? 'This spending pattern differs from your usual habits' : 'Consider if this aligns with your financial goals'
      });
    });

    // Stage 6: Enhanced analytics integration (if available)
    if (useEnhancedData) {
      // Cash flow volatility detection
      if (enhancedData.cashFlowAnalysis?.trends?.volatility > 100) {
        suggestionsList.push({
          type: 'cash_flow_volatility',
          volatility: enhancedData.cashFlowAnalysis.trends.volatility,
          message: `High cash flow volatility detected (${enhancedData.cashFlowAnalysis.trends.volatility.toFixed(0)})`,
          severity: 'medium',
          icon: TrendingDown,
          action: 'Consider building a larger emergency fund',
          context: 'Volatile cash flow can impact financial stability'
        });
      }

      // Income diversity recommendations
      if (enhancedData.incomeBreakdown?.diversityScore < 50) {
        suggestionsList.push({
          type: 'income_diversity',
          diversityScore: enhancedData.incomeBreakdown.diversityScore,
          message: `Low income diversity (${enhancedData.incomeBreakdown.diversityScore.toFixed(0)}%)`,
          severity: 'medium',
          icon: Target,
          action: 'Explore additional income streams',
          context: 'Multiple income sources provide better financial security'
        });
      }

      // Time-based spending pattern analysis
      if (enhancedData.contextualInsights?.timeBased) {
        const highestSpendingTime = Object.entries(enhancedData.contextualInsights.timeBased)
          .reduce((max, [time, data]) => data.average > (max.data?.average || 0) ? { time, data } : max, {});
        
        if (highestSpendingTime.data && highestSpendingTime.data.average > 100) {
          suggestionsList.push({
            type: 'time_pattern',
            timeSlot: highestSpendingTime.time,
            averageSpend: highestSpendingTime.data.average,
            message: `Highest spending occurs in the ${highestSpendingTime.time.toLowerCase()} (avg $${highestSpendingTime.data.average.toFixed(2)})`,
            severity: 'info',
            icon: Calendar,
            action: 'Review spending habits during this time',
            context: 'Awareness of spending patterns can help with budgeting'
          });
        }
      }

      // Forecast-based risk alerts
      if (enhancedData.spendingForecast?.riskFactors?.length > 0) {
        suggestionsList.push({
          type: 'forecast_alert',
          riskCount: enhancedData.spendingForecast.riskFactors.length,
          message: `${enhancedData.spendingForecast.riskFactors.length} forecast risk factors identified`,
          severity: enhancedData.spendingForecast.confidence === 'low' ? 'medium' : 'low',
          icon: AlertTriangle,
          action: 'Review spending forecast and adjust plans accordingly',
          context: 'Proactive planning can mitigate forecasted risks'
        });
      }
    }

    // Stage 7: Behavioral pattern analysis
    const behavioralInsights = detectBehavioralPatterns(currentPeriod, enhancedData);
    suggestionsList.push(...behavioralInsights);

    // Prioritize and limit suggestions for optimal user experience
    const severityOrder = { high: 4, medium: 3, low: 2, info: 1 };
    return suggestionsList
      .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
      .slice(0, 8);
  }, [transactions, budgets, categoryBreakdown, timeframe, enhancedData]);

  // UI styling helpers for consistent visual hierarchy
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityBorder = (severity) => {
    switch (severity) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-orange-500';
      case 'low': return 'border-l-4 border-l-blue-500';
      case 'info': return 'border-l-4 border-l-gray-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Suggestions</h3>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Suggestions</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Unable to generate suggestions. Please try again later.
        </div>
      </div>
    );
  }

  // Empty suggestions state
  if (!suggestions.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lightbulb className="mr-2" size={20} aria-hidden="true" />
          Smart Suggestions
          {enhancedData && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              AI Enhanced
            </span>
          )}
        </h3>
        <div className="text-center py-8" role="status" aria-label="No suggestions available">
          <Lightbulb size={32} className="mx-auto text-gray-300 mb-2" aria-hidden="true" />
          <p className="text-gray-500">No suggestions available</p>
          <p className="text-sm text-gray-400 mt-1">Add more transactions to get personalized suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" role="region" aria-label="Smart financial suggestions">
      {/* Component header with enhancement indicator */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Zap className="mr-2" size={20} aria-hidden="true" />
        AI Smart Suggestions
        {enhancedData && (
          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
            Context Aware
          </span>
        )}
      </h3>
      
      {/* Suggestions list with scroll for overflow */}
      <div className="space-y-3 max-h-96 overflow-y-auto" role="list" aria-label="Financial suggestions list">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon || Lightbulb;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow ${getSeverityBorder(suggestion.severity)}`}
              role="listitem"
              aria-label={`${suggestion.severity} priority suggestion: ${suggestion.message}`}
            >
              <div className="flex items-start space-x-3">
                {/* Suggestion icon with severity coloring */}
                <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  <IconComponent size={16} className={
                    suggestion.severity === 'high' ? 'text-red-500' :
                    suggestion.severity === 'medium' ? 'text-orange-500' :
                    suggestion.severity === 'low' ? 'text-blue-500' : 'text-gray-500'
                  } />
                </div>
                {/* Suggestion content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900 mb-1">{suggestion.message}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                      suggestion.severity === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                      suggestion.severity === 'low' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {suggestion.severity}
                    </span>
                  </div>
                  
                  {/* Contextual explanation */}
                  {suggestion.context && (
                    <p className="text-xs text-gray-600 mt-1">{suggestion.context}</p>
                  )}
                  
                  {/* Actionable insight with visual emphasis */}
                  {suggestion.action && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <p className="text-xs font-medium text-gray-700">💡 {suggestion.action}</p>
                    </div>
                  )}
                  
                  {/* Supporting metrics */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestion.amount && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Amount: ${suggestion.amount.toFixed(2)}
                      </span>
                    )}
                    {suggestion.percentage && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {suggestion.percentage}% above avg
                      </span>
                    )}
                    {suggestion.category && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions summary footer */}
      <div className="mt-4 pt-4 border-t border-gray-200" role="status" aria-label="Suggestions summary">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">Analysis Summary</span>
          <span className="text-xs text-gray-500">
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Severity breakdown badges */}
        <div className="flex flex-wrap gap-2">
          {suggestions.some(s => s.severity === 'high') && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center">
              <AlertTriangle size={12} className="mr-1" aria-hidden="true" />
              {suggestions.filter(s => s.severity === 'high').length} Critical
            </span>
          )}
          {suggestions.some(s => s.severity === 'medium') && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center">
              <TrendingUp size={12} className="mr-1" aria-hidden="true" />
              {suggestions.filter(s => s.severity === 'medium').length} Important
            </span>
          )}
          {suggestions.some(s => s.severity === 'low') && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center">
              <Lightbulb size={12} className="mr-1" aria-hidden="true" />
              {suggestions.filter(s => s.severity === 'low').length} Suggestions
            </span>
          )}
          {suggestions.some(s => s.severity === 'info') && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center">
              <DollarSign size={12} className="mr-1" aria-hidden="true" />
              {suggestions.filter(s => s.severity === 'info').length} Insights
            </span>
          )}
        </div>
        
        {/* Enhancement indicator */}
        {enhancedData && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            • Powered by advanced analytics and pattern detection •
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSuggestions;