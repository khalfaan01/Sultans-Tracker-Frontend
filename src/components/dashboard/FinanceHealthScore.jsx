// src/components/dashboard/FinanceHealthScore.jsx
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Target } from 'lucide-react';

/**
 * Comprehensive financial health scoring component with AI-enhanced insights
 * 
 * Features:
 * - Multi-factor financial health assessment (6+ categories)
 * - AI-powered analytics integration when available
 * - Visual score representation with grade classification
 * - Actionable recommendations based on score analysis
 * - Enhanced insights from behavioral and forecast data
 * 
 * Scoring Categories:
 * 1. Spending vs Income Ratio (30pts) - Core financial stability
 * 2. Budget Adherence (25pts) - Financial discipline
 * 3. Emergency Fund (20pts) - Risk preparedness
 * 4. Goal Progress (15pts) - Future planning
 * 5. Spending Diversity (10pts) - Financial behavior patterns
 * 6. Cash Flow Stability (Bonus/Malus) - Enhanced volatility analysis
 * 7. Forecast Confidence (Bonus) - AI prediction reliability
 * 
 * Data Integration:
 * - Priority: Pre-calculated financialHealthScore from dashboard context
 * - Fallback: Calculated score from transactions, budgets, and goals
 * - Enhancement: AI analytics data for deeper insights
 */
const FinanceHealthScore = ({ transactions, budgets, goals, timeframe, enhancedData, financialHealthScore }) => {
  // Helper function for grade classification based on numeric score
  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  /**
   * Calculates comprehensive financial health score with multiple factors
   * Priority: Uses pre-calculated score if provided, otherwise calculates from scratch
   * Enhancement: Integrates AI analytics data for deeper insights when available
   */
  const healthScore = useMemo(() => {
    // Use pre-calculated score from dashboard context if available (most efficient)
    if (financialHealthScore !== undefined) {
      return {
        score: financialHealthScore,
        breakdown: [],
        grade: getGrade(financialHealthScore),
        recommendations: [],
        hasEnhancedData: !!enhancedData,
        enhancedInsights: []
      };
    }

    // Determine data source - prefer enhanced AI data when available
    const useEnhancedData = enhancedData && enhancedData.cashFlowAnalysis;
    
    // Empty state handling - no data available
    if (!transactions.length && !useEnhancedData) return { 
      score: 0, 
      breakdown: [], 
      grade: 'N/A', 
      recommendations: [],
      enhancedInsights: [],
      hasEnhancedData: false
    };

    let totalScore = 100; // Start with perfect score, deduct based on performance
    const breakdown = [];
    const recommendations = [];
    const enhancedInsights = [];

    // 1. SPENDING VS INCOME RATIO (30 points maximum)
    let income, expenses, savingsRate;
    
    if (useEnhancedData) {
      // Use enhanced AI data for more accurate calculations
      const periods = enhancedData.cashFlowAnalysis.periods;
      income = periods.reduce((sum, p) => sum + p.income, 0);
      expenses = periods.reduce((sum, p) => sum + p.expenses, 0);
      savingsRate = income > 0 ? (income - expenses) / income : 0;
      
      // Enhanced insight: Cash flow consistency analysis
      const negativePeriods = periods.filter(p => p.net < 0).length;
      if (negativePeriods > periods.length * 0.3) {
        enhancedInsights.push({
          type: 'cash_flow_consistency',
          message: `${negativePeriods} periods with negative cash flow`,
          impact: 'medium'
        });
      }
    } else {
      // Fallback to transaction-based calculations
      income = transactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      expenses = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      savingsRate = income > 0 ? (income - expenses) / income : 0;
    }
    
    // Tiered scoring based on savings rate
    let spendingScore = 0;
    if (savingsRate >= 0.2) spendingScore = 30;        // Excellent: 20%+ savings
    else if (savingsRate >= 0.1) spendingScore = 25;   // Good: 10-20% savings
    else if (savingsRate >= 0) spendingScore = 20;     // Neutral: 0-10% savings
    else if (savingsRate >= -0.1) spendingScore = 10;  // Poor: Spending within 10% of income
    else spendingScore = 0;                           // Critical: Spending >110% of income
    
    totalScore = totalScore - 30 + spendingScore;
    breakdown.push({
      category: 'Spending vs Income',
      score: spendingScore,
      maxScore: 30,
      description: savingsRate >= 0 ? `${(savingsRate * 100).toFixed(1)}% savings rate` : `${Math.abs(savingsRate * 100).toFixed(1)}% deficit`,
      trend: useEnhancedData ? enhancedData.cashFlowAnalysis.trends?.incomeGrowth - enhancedData.cashFlowAnalysis.trends?.expenseGrowth : 0
    });

    // Recommendation based on spending ratio
    if (savingsRate < 0.1) {
      recommendations.push({
        icon: TrendingUp,
        message: savingsRate < 0 
          ? "You're spending more than you earn. Focus on reducing expenses."
          : "Try to increase your savings rate to at least 10%",
        priority: savingsRate < 0 ? 'high' : 'medium'
      });
    }

    // 2. BUDGET ADHERENCE (25 points maximum)
    let budgetScore = 25;
    if (budgets.length > 0) {
      const budgetPerformance = budgets.map(budget => {
        const spent = transactions
          .filter(tx => tx.type === 'expense' && tx.category === budget.category)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        return spent <= budget.limit ? 1 : 0; // 1 for within budget, 0 for over
      });
      
      const adherenceRate = budgetPerformance.reduce((sum, perf) => sum + perf, 0) / budgets.length;
      budgetScore = Math.round(adherenceRate * 25);
    }
    
    totalScore = totalScore - 25 + budgetScore;
    breakdown.push({
      category: 'Budget Adherence',
      score: budgetScore,
      maxScore: 25,
      description: budgets.length > 0 ? `${Math.round((budgetScore / 25) * 100)}% of budgets followed` : 'No budgets set'
    });

    // Recommendation if no budgets are set
    if (budgets.length === 0) {
      recommendations.push({
        icon: AlertTriangle,
        message: "Set up budgets to better track your spending habits",
        priority: 'medium'
      });
    }

    // 3. EMERGENCY FUND (20 points maximum)
    const totalBalance = income - expenses;
    const monthlyExpenses = expenses / (timeframe === 'monthly' ? 1 : 12);
    const emergencyFundMonths = monthlyExpenses > 0 ? Math.max(0, totalBalance) / monthlyExpenses : 0;
    
    let emergencyScore = 0;
    if (emergencyFundMonths >= 6) emergencyScore = 20;        // Excellent: 6+ months
    else if (emergencyFundMonths >= 3) emergencyScore = 15;  // Good: 3-6 months
    else if (emergencyFundMonths >= 1) emergencyScore = 10;  // Fair: 1-3 months
    else if (emergencyFundMonths > 0) emergencyScore = 5;    // Minimal: <1 month
    
    totalScore = totalScore - 20 + emergencyScore;
    breakdown.push({
      category: 'Emergency Fund',
      score: emergencyScore,
      maxScore: 20,
      description: `${emergencyFundMonths.toFixed(1)} months of expenses covered`
    });

    // Recommendation for emergency fund building
    if (emergencyFundMonths < 3) {
      recommendations.push({
        icon: AlertTriangle,
        message: `Build your emergency fund to cover ${6 - Math.ceil(emergencyFundMonths)} more months of expenses`,
        priority: 'high'
      });
    }

    // 4. GOAL PROGRESS (15 points maximum)
    let goalScore = 15;
    if (goals.length > 0) {
      const activeGoals = goals.filter(goal => goal.isActive && !goal.isCompleted);
      if (activeGoals.length > 0) {
        const goalProgress = activeGoals.map(goal => 
          goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
        );
        const avgProgress = goalProgress.reduce((sum, progress) => sum + progress, 0) / activeGoals.length;
        goalScore = Math.round(avgProgress * 15);
      }
    }
    
    totalScore = totalScore - 15 + goalScore;
    breakdown.push({
      category: 'Goal Progress',
      score: goalScore,
      maxScore: 15,
      description: goals.length > 0 ? `${Math.round((goalScore / 15) * 100)}% average progress` : 'No goals set'
    });

    // Recommendation if no goals are set
    if (goals.length === 0) {
      recommendations.push({
        icon: TrendingUp,
        message: "Set financial goals to stay motivated and track progress",
        priority: 'medium'
      });
    }

    // 5. SPENDING DIVERSITY (10 points maximum)
    const categories = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        categories[tx.category] = (categories[tx.category] || 0) + Math.abs(tx.amount);
      });
    
    const categoryCount = Object.keys(categories).length;
    let diversityScore = Math.min(10, categoryCount * 2); // 2 points per category, max 10
    
    totalScore = totalScore - 10 + diversityScore;
    breakdown.push({
      category: 'Spending Diversity',
      score: diversityScore,
      maxScore: 10,
      description: `${categoryCount} spending categories`
    });

    // Recommendation for spending diversity
    if (categoryCount < 3) {
      recommendations.push({
        icon: TrendingDown,
        message: "Consider diversifying your spending across more categories",
        priority: 'low'
      });
    }

    // 6. CASH FLOW STABILITY (Bonus/Malus - Enhanced scoring only)
    if (useEnhancedData) {
      let stabilityScore = 0;
      const volatility = enhancedData.cashFlowAnalysis.trends?.volatility || 0;
      const netGrowth = enhancedData.cashFlowAnalysis.trends?.netGrowth || 0;
      
      // Bonus for low volatility with positive growth
      if (volatility < 50 && netGrowth > 0) stabilityScore = 5;
      else if (volatility < 100 && netGrowth >= 0) stabilityScore = 2;
      else if (volatility > 200) stabilityScore = -5; // Penalty for high volatility
      
      totalScore += stabilityScore;
      
      if (stabilityScore !== 0) {
        breakdown.push({
          category: 'Cash Flow Stability',
          score: Math.max(0, stabilityScore),
          maxScore: 5,
          description: volatility < 100 ? 'Stable cash flow' : 'High volatility detected',
          isBonus: true
        });
      }
    }

    // 7. FORECAST CONFIDENCE (Bonus - Enhanced scoring only)
    if (enhancedData?.spendingForecast) {
      let forecastBonus = 0;
      if (enhancedData.spendingForecast.confidence === 'high') forecastBonus = 3;
      else if (enhancedData.spendingForecast.confidence === 'medium') forecastBonus = 1;
      
      totalScore += forecastBonus;
      
      if (forecastBonus > 0) {
        breakdown.push({
          category: 'Forecast Reliability',
          score: forecastBonus,
          maxScore: 3,
          description: `${enhancedData.spendingForecast.confidence} confidence forecast`,
          isBonus: true
        });
      }
    }

    // Final score calculation with bounds
    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
    
    // Enhanced insights from AI analytics
    if (useEnhancedData) {
      // Income diversity analysis
      if (enhancedData.incomeBreakdown?.diversityScore < 50) {
        enhancedInsights.push({
          type: 'income_diversity',
          message: `Low income diversity (${enhancedData.incomeBreakdown.diversityScore.toFixed(0)}%)`,
          impact: 'medium'
        });
      }

      // Spending forecast risk analysis
      if (enhancedData.spendingForecast?.riskFactors?.length > 0) {
        enhancedInsights.push({
          type: 'forecast_risk',
          message: `${enhancedData.spendingForecast.riskFactors.length} forecast risk factors`,
          impact: 'medium'
        });
      }
    }

    // Positive reinforcement for excellent scores
    if (finalScore >= 80) {
      recommendations.push({
        icon: CheckCircle,
        message: "Great job! You're maintaining excellent financial health",
        priority: 'info'
      });
    }

    // Sort recommendations by priority and limit to top 3
    const sortedRecommendations = recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1, info: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 3);

    return {
      score: finalScore,
      breakdown,
      grade: getGrade(finalScore),
      recommendations: sortedRecommendations,
      enhancedInsights,
      hasEnhancedData: !!useEnhancedData
    };
  }, [transactions, budgets, goals, timeframe, enhancedData, financialHealthScore]);

  // Color mapping functions for consistent UI theming
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'F': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getScoreRingColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-orange-200 bg-orange-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      case 'info': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Early return for empty state - no data available
  if (!healthScore || healthScore.score === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Finance Health Score</h3>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="mx-auto mb-2 text-gray-400" size={32} />
          <p>Insufficient data to calculate financial health score</p>
          <p className="text-sm mt-1">Add transactions, budgets, or goals to enable scoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" role="region" aria-label="Financial health score assessment">
      {/* Component header with AI enhancement indicator */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Finance Health Score</h3>
        {healthScore.hasEnhancedData && (
          <span className="flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
            <Zap size={12} className="mr-1" aria-hidden="true" />
            AI Enhanced
          </span>
        )}
      </div>
      
      {/* Main visual score display */}
      <div className="text-center mb-6">
        <div className="relative inline-block" aria-label={`Financial health score: ${healthScore.score} out of 100, Grade: ${healthScore.grade}`}>
          <div className="relative">
            {/* Circular progress visualization */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              {/* Background ring */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              {/* Progress ring - dynamically colored based on score */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - healthScore.score}
                className={getScoreRingColor(healthScore.score)}
              />
            </svg>
            
            {/* Score text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(healthScore.score)}`}>
                  {healthScore.score}
                </div>
                <div className="text-sm text-gray-500">out of 100</div>
              </div>
            </div>
          </div>
          
          {/* Grade badge in corner */}
          <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(healthScore.grade)}`}>
            {healthScore.grade}
          </div>
        </div>
      </div>

      {/* Enhanced insights from AI analytics */}
      {healthScore.enhancedInsights && healthScore.enhancedInsights.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Target size={16} className="mr-2" aria-hidden="true" />
            Enhanced Insights
          </h4>
          <div className="space-y-1">
            {healthScore.enhancedInsights.map((insight, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" aria-hidden="true"></span>
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown by category */}
      {healthScore.breakdown && healthScore.breakdown.length > 0 && (
        <div className="space-y-3 mb-6" role="list" aria-label="Score breakdown by category">
          {healthScore.breakdown.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-2 rounded-lg ${
                item.isBonus ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}
              role="listitem"
            >
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">
                    {item.category}
                    {item.isBonus && <span className="ml-1 text-green-600 text-xs">(Bonus)</span>}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.score}/{item.maxScore}
                    {/* Trend indicator when available */}
                    {item.trend !== undefined && (
                      <span className={`ml-2 text-xs ${
                        item.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.trend >= 0 ? '↗' : '↘'} {Math.abs(item.trend).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
                {/* Progress bar visualization */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.isBonus ? 'bg-green-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={item.score}
                    aria-valuemin="0"
                    aria-valuemax={item.maxScore}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Personalized recommendations */}
      {healthScore.recommendations && healthScore.recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Smart Recommendations</h4>
          <div className="space-y-2" role="list" aria-label="Financial improvement recommendations">
            {healthScore.recommendations.map((rec, index) => {
              const IconComponent = rec.icon;
              return (
                <div 
                  key={index} 
                  className={`flex items-start space-x-2 text-sm p-2 rounded-lg border ${getPriorityColor(rec.priority)}`}
                  role="listitem"
                >
                  <IconComponent size={16} className="flex-shrink-0 mt-0.5 text-gray-400" aria-hidden="true" />
                  <span className="text-gray-600">{rec.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score interpretation guide */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between mb-1">
            <span>0-59: Needs Improvement</span>
            <span>90-100: Excellent</span>
          </div>
          {/* Color gradient scale */}
          <div className="w-full bg-gray-200 rounded-full h-1" aria-hidden="true">
            <div 
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1 rounded-full"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>
        {/* AI enhancement indicator */}
        {healthScore.hasEnhancedData && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            • Enhanced with AI-powered analytics •
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceHealthScore;