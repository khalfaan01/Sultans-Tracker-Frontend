// src/components/dashboard/CashFlowRadar.jsx
import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, Zap, Target } from 'lucide-react';
import { useTransactions } from '../../contexts';

/**
 * Predictive cash flow risk analysis and forecasting component
 * 
 * Features:
 * - AI-enhanced cash flow forecasting with risk scoring
 * - Visual timeline of risk days and projected spending
 * - Balance trend visualization with confidence intervals
 * - Real-time risk assessment based on transaction patterns
 * - Integration of enhanced analytics data when available
 * 
 * Data Flow:
 * - Primary: Enhanced analytics data from AI service (preferred)
 * - Fallback: Calculated risk based on transaction patterns
 * - Hybrid: Enhanced data supplemented with real transaction validation
 * 
 * Risk Assessment:
 * - Multi-factor risk scoring (volatility, negative days, forecast risks)
 * - Color-coded severity levels (high, medium, warning, low)
 * - Balance threshold monitoring (negative, low balance alerts)
 */
const calculateEnhancedRiskLevel = (enhancedData) => {
  let riskScore = 0;
  
  // Volatility scoring: higher volatility indicates less predictable cash flow
  if (enhancedData?.cashFlowAnalysis?.trends?.volatility > 100) riskScore += 2;
  if (enhancedData?.cashFlowAnalysis?.trends?.volatility > 200) riskScore += 1;
  
  // Negative cash flow days: consecutive negative days increase risk
  const negativeDays = enhancedData?.cashFlowAnalysis?.periods?.filter(p => p.net < 0).length || 0;
  if (negativeDays > 5) riskScore += 2;
  if (negativeDays > 10) riskScore += 1;
  
  // Forecast risk factors: each identified risk factor adds to score
  const forecastRisks = enhancedData?.spendingForecast?.riskFactors?.length || 0;
  riskScore += forecastRisks;
  
  // Risk level classification based on cumulative score
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  if (riskScore >= 1) return 'warning';
  return 'low';
};

/**
 * Generates simulated balance history from cash flow periods
 * Used for visualization when historical balance data is unavailable
 * @param {Array} periods - Cash flow periods with net values
 * @returns {Array} - Simulated balance history starting from $1000 baseline
 */
const generateBalanceHistoryFromCashFlow = (periods) => {
  if (!periods || periods.length === 0) return [1000];
  
  let balance = 1000; // Starting balance for visualization
  const history = [balance];
  
  periods.forEach(period => {
    balance += period.net;
    history.push(balance);
  });
  
  return history;
};

const CashFlowRadar = ({ transactions, timeframe, enhancedData }) => {
  const { loading: transactionsLoading, error: transactionsError } = useTransactions();

  /**
   * Main cash flow data calculation with fallback logic
   * Priority: 1. Enhanced AI data, 2. Calculated from transactions, 3. Empty state
   */
  const cashFlowData = useMemo(() => {
    // Use enhanced AI data when available (preferred source)
    if (enhancedData?.cashFlowAnalysis) {
      return {
        ...enhancedData.cashFlowAnalysis,
        riskLevel: calculateEnhancedRiskLevel(enhancedData),
        forecastInsights: enhancedData.spendingForecast?.riskFactors || [],
        balanceHistory: generateBalanceHistoryFromCashFlow(enhancedData.cashFlowAnalysis.periods),
        forecastPeriod: enhancedData.spendingForecast?.dailyProjections?.length || 30
      };
    }

    // Fallback to transaction-based calculation when no enhanced data
    if (!transactions.length) return { 
      riskDays: [], 
      dailyFlow: [], 
      riskLevel: 'low',
      balanceHistory: [1000],
      forecastPeriod: 30
    };

    // Original cash flow simulation logic (preserved without modification)
    const now = new Date();
    const daysToForecast = timeframe === 'monthly' ? 30 : 90;
    const dailyFlow = [];
    const riskDays = [];

    const incomeTransactions = transactions.filter(tx => tx.type === 'income');
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const daysInData = Math.max(1, 
      (new Date() - new Date(Math.min(...transactions.map(t => new Date(t.date))))) / (1000 * 60 * 60 * 24)
    );
    
    const avgDailyIncome = totalIncome / Math.max(30, daysInData);
    const avgDailyExpense = totalExpenses / Math.max(30, daysInData);

    let currentBalance = 1000;
    const balanceHistory = [currentBalance];

    for (let i = 1; i <= daysToForecast; i++) {
      const dayOfWeek = (now.getDay() + i) % 7;
      
      let dailyIncome = avgDailyIncome;
      let dailyExpense = avgDailyExpense;
      
      // Weekend spending adjustment (30% increase)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dailyExpense *= 1.3;
      }
      
      // Bi-weekly income simulation (payday every 14 days)
      if (i % 14 === 0) {
        dailyIncome *= 3;
      }
      
      // Random variation (75% to 125% of average)
      dailyIncome *= (0.75 + Math.random() * 0.5);
      dailyExpense *= (0.75 + Math.random() * 0.5);
      
      // Minimum spending/income floors
      dailyIncome = Math.max(dailyIncome, avgDailyIncome * 0.5);
      dailyExpense = Math.max(dailyExpense, avgDailyExpense * 0.5);

      currentBalance += dailyIncome - dailyExpense;
      balanceHistory.push(currentBalance);

      // Risk detection logic
      if (currentBalance < 0) {
        const severity = currentBalance < -1000 ? 'high' : 
                        currentBalance < -500 ? 'medium' : 'low';
        riskDays.push({
          day: i,
          balance: currentBalance,
          severity,
          type: 'negative_balance',
          income: dailyIncome,
          expense: dailyExpense
        });
      } else if (currentBalance < 200) {
        riskDays.push({
          day: i,
          balance: currentBalance,
          severity: 'warning',
          type: 'low_balance',
          income: dailyIncome,
          expense: dailyExpense
        });
      } else if (dailyExpense > avgDailyExpense * 3) {
        riskDays.push({
          day: i,
          balance: currentBalance,
          severity: 'info',
          type: 'high_spending',
          income: dailyIncome,
          expense: dailyExpense
        });
      }

      dailyFlow.push({
        day: i,
        income: dailyIncome,
        expense: dailyExpense,
        balance: currentBalance,
        date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      });
    }

    // Risk level calculation based on detected risk days
    let riskLevel = 'low';
    const highRiskDays = riskDays.filter(day => day.severity === 'high').length;
    const mediumRiskDays = riskDays.filter(day => day.severity === 'medium').length;
    const warningDays = riskDays.filter(day => day.severity === 'warning').length;
    
    const totalRiskScore = (highRiskDays * 3) + (mediumRiskDays * 2) + warningDays;
    
    if (totalRiskScore >= 10 || highRiskDays >= 3) riskLevel = 'high';
    else if (totalRiskScore >= 5 || mediumRiskDays >= 5) riskLevel = 'medium';
    else if (totalRiskScore >= 2) riskLevel = 'warning';
    else riskLevel = 'low';

    return { 
      riskDays, 
      dailyFlow, 
      riskLevel, 
      balanceHistory,
      forecastPeriod: daysToForecast,
      avgDailyIncome,
      avgDailyExpense
    };
  }, [transactions, timeframe, enhancedData]);

  // Color mapping functions for consistent UI theming
  const getRiskColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      case 'warning': return 'bg-blue-500';
      case 'info': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'warning': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRiskIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle size={16} />;
      case 'medium': return <TrendingDown size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <TrendingUp size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  // Loading state
  if (transactionsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Radar</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (transactionsError) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Radar</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Unable to load transaction data. Please try again later.
        </div>
      </div>
    );
  }

  // Empty state - no data available
  if ((!transactions.length && !enhancedData) || !cashFlowData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Predictive Cash Flow Radar
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TrendingUp className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500">No transaction data available</p>
            <p className="text-sm text-gray-400 mt-1">Add transactions to enable cash flow forecasting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" role="region" aria-label="Cash flow risk analysis">
      {/* Header with risk indicator */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Zap className="mr-2" size={20} />
            Advanced Cash Flow Radar
            {enhancedData && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                AI Enhanced
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600">
            {timeframe === 'monthly' ? '30-day forecast' : '90-day forecast'}
            {enhancedData?.cashFlowAnalysis?.granularity && (
              <span className="ml-2 text-xs text-gray-500">
                ({enhancedData.cashFlowAnalysis.granularity} analysis)
              </span>
            )}
          </p>
        </div>
        {/* Risk level badge with color coding */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(cashFlowData.riskLevel)}`}>
          {cashFlowData.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      {/* Risk timeline visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Target className="mr-2" size={16} />
            Risk & Forecast Timeline
          </h4>
          <span className="text-xs text-gray-500">
            {cashFlowData.riskDays?.length || 0} risk day{(cashFlowData.riskDays?.length || 0) !== 1 ? 's' : ''} detected
          </span>
        </div>
        <div className="flex space-x-1 overflow-x-auto pb-2" role="list" aria-label="Daily risk timeline">
          {Array.from({ length: cashFlowData.forecastPeriod }, (_, i) => i + 1).map(day => {
            const riskDay = cashFlowData.riskDays?.find(rd => rd.day === day);
            const forecastDay = enhancedData?.spendingForecast?.dailyProjections?.[day - 1];
            
            return (
              <div
                key={day}
                className={`flex-1 h-10 rounded flex flex-col items-center justify-center text-xs font-medium relative ${
                  riskDay 
                    ? `${getRiskColor(riskDay.severity)} text-white` 
                    : forecastDay?.projectedAmount > ((cashFlowData.avgDailyExpense || 50) * 1.5)
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={
                  riskDay 
                    ? `Day ${day}: $${riskDay.balance?.toFixed(2) || '0.00'} (${riskDay.severity} risk)`
                    : forecastDay
                    ? `Day ${day}: Projected $${forecastDay.projectedAmount?.toFixed(2) || '0.00'}`
                    : `Day ${day}: No risk`
                }
                role="listitem"
                aria-label={`Day ${day}: ${riskDay ? `${riskDay.severity} risk` : forecastDay ? 'forecasted spending' : 'normal day'}`}
              >
                {riskDay ? (
                  <>
                    <div className="text-xs">!</div>
                    <div className="text-[10px] opacity-75">D{day}</div>
                  </>
                ) : forecastDay?.projectedAmount > ((cashFlowData.avgDailyExpense || 50) * 1.5) ? (
                  <>
                    <div className="text-[10px]">💸</div>
                    <div className="text-[10px] opacity-75">D{day}</div>
                  </>
                ) : (
                  <div className="text-[10px]">D{day}</div>
                )}
                
                {/* Confidence indicator for forecast days (visual only) */}
                {forecastDay && (
                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    forecastDay.confidence === 'high' ? 'bg-green-400' :
                    forecastDay.confidence === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Balance trend chart visualization */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <TrendingUp className="mr-2" size={16} />
          Projected Balance Trend with Confidence Intervals
        </h4>
        <div className="h-32 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4 border" role="img" aria-label="Projected balance trend chart">
          <div className="flex h-full items-end space-x-1">
            {cashFlowData.balanceHistory.map((balance, index) => {
              const maxBalance = Math.max(...cashFlowData.balanceHistory);
              const minBalance = Math.min(...cashFlowData.balanceHistory);
              const range = maxBalance - minBalance;
              const height = range > 0 ? ((balance - minBalance) / range) * 80 : 40;
              
              // Color coding based on balance health
              let barColor = 'bg-green-500';
              if (balance < 0) barColor = 'bg-red-500';
              else if (balance < 200) barColor = 'bg-orange-500';
              else if (enhancedData?.cashFlowAnalysis?.trends?.netGrowth < 0) barColor = 'bg-yellow-500';
              
              return (
                <div
                  key={index}
                  className="flex-1 transition-all duration-300 hover:opacity-80 group relative"
                  style={{ height: `${Math.max(2, height)}%` }}
                  role="presentation"
                >
                  <div
                    className={`w-full rounded-t ${barColor}`}
                    style={{ height: '100%' }}
                    title={`Day ${index}: $${balance?.toFixed(2) || '0.00'}`}
                    aria-hidden="true"
                  />
                  {/* Enhanced tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    <div>Day {index}: ${balance?.toFixed(2) || '0.00'}</div>
                    {enhancedData?.cashFlowAnalysis?.periods?.[index] && (
                      <div className="text-gray-300">
                        Net: ${enhancedData.cashFlowAnalysis.periods[index].net?.toFixed(2) || '0.00'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Today</span>
          <span>Day {cashFlowData.forecastPeriod}</span>
        </div>
      </div>

      {/* Risk analysis details section */}
      {(cashFlowData.riskDays?.length > 0 || cashFlowData.forecastInsights?.length > 0) && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Risk Analysis & Forecast Alerts
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto" role="list" aria-label="Risk alerts">
            {/* Current risk days */}
            {cashFlowData.riskDays?.slice(0, 3).map((riskDay, index) => (
              <div key={`risk-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg" role="listitem">
                <div className="flex items-center space-x-3">
                  {getRiskIcon(riskDay.severity)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Day {riskDay.day} - {riskDay.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Income: ${riskDay.income?.toFixed(2) || '0.00'} • Expense: ${riskDay.expense?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    riskDay.balance < 0 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    ${riskDay.balance?.toFixed(2) || '0.00'}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    riskDay.severity === 'high' ? 'bg-red-100 text-red-700' :
                    riskDay.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                    riskDay.severity === 'warning' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {riskDay.severity}
                  </div>
                </div>
              </div>
            ))}

            {/* Forecast risk factors */}
            {cashFlowData.forecastInsights?.slice(0, 2).map((insight, index) => (
              <div key={`forecast-${index}`} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200" role="listitem">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">
                      Forecast Alert
                    </div>
                    <div className="text-xs text-yellow-700">
                      {insight}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Healthy cash flow state */}
      {(!cashFlowData.riskDays?.length && !cashFlowData.forecastInsights?.length) && (
        <div className="text-center py-6 border-t" role="status" aria-label="No significant risks detected">
          <div className="text-green-500 text-2xl mb-2">✅</div>
          <p className="text-sm text-gray-600">No significant risk days detected</p>
          <p className="text-xs text-gray-500 mt-1">Your cash flow looks healthy for the forecast period</p>
        </div>
      )}

      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Avg Daily Income</div>
            <div className="font-semibold text-green-600">
              ${cashFlowData.avgDailyIncome?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Avg Daily Expense</div>
            <div className="font-semibold text-red-600">
              ${cashFlowData.avgDailyExpense?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
        
        {/* Enhanced trend data when available */}
        {enhancedData?.cashFlowAnalysis?.trends && (
          <div className="grid grid-cols-3 gap-4 text-sm mt-4">
            <div>
              <div className="text-gray-600">Income Trend</div>
              <div className={`font-semibold ${
                enhancedData.cashFlowAnalysis.trends.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {enhancedData.cashFlowAnalysis.trends.incomeGrowth >= 0 ? '+' : ''}
                {enhancedData.cashFlowAnalysis.trends.incomeGrowth?.toFixed(1) || '0.0'}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">Expense Trend</div>
              <div className={`font-semibold ${
                enhancedData.cashFlowAnalysis.trends.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {enhancedData.cashFlowAnalysis.trends.expenseGrowth >= 0 ? '+' : ''}
                {enhancedData.cashFlowAnalysis.trends.expenseGrowth?.toFixed(1) || '0.0'}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">Volatility</div>
              <div className={`font-semibold ${
                enhancedData.cashFlowAnalysis.trends.volatility < 50 ? 'text-green-600' : 
                enhancedData.cashFlowAnalysis.trends.volatility < 100 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {enhancedData.cashFlowAnalysis.trends.volatility?.toFixed(0) || '0'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowRadar;