// src/components/dashboard/IncomeExpenseChart.jsx
import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Dual-bar chart component for visualizing income vs expenses over time
 * 
 * Features:
 * - Side-by-side comparison of income and expenses per time period
 * - Dynamic scaling based on data range
 * - Interactive tooltips on hover for exact values
 * - Net cash flow indicators for each period
 * - Growth rate calculation and visualization
 * 
 * Data Processing:
 * - Sorts chronological data by date for accurate time series display
 * - Formats labels based on selected timeframe (monthly/yearly)
 * - Calculates aggregate statistics for header display
 * - Normalizes bar heights for consistent visualization
 * 
 * Chart Elements:
 * - Green bars: Income amounts (positive cash flow)
 * - Red bars: Expense amounts (negative cash flow)
 * - Up/down arrows: Net cash flow direction per period
 * - Tooltips: Exact values on hover
 * - Legend: Color coding reference
 */
const IncomeExpenseChart = ({ data, timeframe, loading, error }) => {
  /**
   * Processes raw data into chart-ready format with sorting and labeling
   * Handles empty data states with fallback structure
   */
  const chartData = useMemo(() => {
    // Return empty structure if no data provided
    if (!data || data.length === 0) {
      return { 
        labels: [], 
        income: [], 
        expenses: [],
        net: [] 
      };
    }

    // Sort data chronologically for accurate time series
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA - dateB;
    });

    return {
      labels: sortedData.map(item => {
        const date = new Date(item.month);
        // Format labels based on selected timeframe
        return timeframe === 'monthly' 
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      income: sortedData.map(item => item.income),
      expenses: sortedData.map(item => item.expenses),
      net: sortedData.map(item => item.income - item.expenses)
    };
  }, [data, timeframe]);

  /**
   * Calculates aggregate financial statistics from chart data
   * Includes totals, net cash flow, and growth rate calculations
   */
  const stats = useMemo(() => {
    const totalIncome = chartData.income.reduce((sum, income) => sum + income, 0);
    const totalExpenses = chartData.expenses.reduce((sum, expense) => sum + expense, 0);
    const netCashFlow = totalIncome - totalExpenses;
    
    // Calculate percentage growth from first to last period
    const growthRate = chartData.income.length > 1 
      ? ((chartData.income[chartData.income.length - 1] - chartData.income[0]) / chartData.income[0] * 100) 
      : 0;

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      growthRate
    };
  }, [chartData]);

  /**
   * Determines maximum value for consistent bar height scaling
   * Ensures minimum scale for better visualization of small values
   */
  const maxValue = useMemo(() => {
    const allValues = [...chartData.income, ...chartData.expenses];
    const max = Math.max(...allValues, 100); // Minimum max of 100 for visibility
    return max === 0 ? 100 : max; // Prevent division by zero for empty datasets
  }, [chartData]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Unable to load chart data. Please try again later.
        </div>
      </div>
    );
  }

  // Empty state - no data available
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
          <div className="text-sm text-gray-500">No data available</div>
        </div>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="mx-auto text-gray-300 mb-2" size={32} aria-hidden="true" />
            <p className="text-gray-500">No transaction data available</p>
            <p className="text-sm text-gray-400 mt-1">Add income and expenses to see charts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" role="region" aria-label="Income versus expenses chart">
      {/* Header with financial summary */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
          <p className="text-sm text-gray-600">
            {timeframe === 'monthly' ? 'Last 30 days' : 'Last 12 months'}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-4 text-sm" role="list" aria-label="Financial summary">
            {/* Income total */}
            <div role="listitem">
              <div className="text-green-600 font-semibold">+${stats.totalIncome.toFixed(2)}</div>
              <div className="text-gray-500">Income</div>
            </div>
            {/* Expenses total */}
            <div role="listitem">
              <div className="text-red-600 font-semibold">-${stats.totalExpenses.toFixed(2)}</div>
              <div className="text-gray-500">Expenses</div>
            </div>
            {/* Net cash flow */}
            <div role="listitem">
              <div className={`font-semibold ${
                stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.netCashFlow >= 0 ? '+' : ''}${stats.netCashFlow.toFixed(2)}
              </div>
              <div className="text-gray-500">Net</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="h-64" role="img" aria-label={`Chart showing income and expenses for ${chartData.labels.length} periods`}>
        <div className="flex h-full items-end space-x-1">
          {chartData.labels.map((label, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2 group relative">
              {/* Dual-bar container */}
              <div className="flex space-x-1 w-full justify-center" style={{ height: '180px' }}>
                {/* Income bar */}
                <div className="flex flex-col items-center justify-end" aria-label={`Income for ${label}: $${chartData.income[index].toFixed(2)}`}>
                  <div
                    className="bg-green-500 rounded-t w-4 transition-all duration-300 hover:bg-green-600 cursor-pointer group relative"
                    style={{ 
                      height: `${(chartData.income[index] / maxValue) * 160}px`,
                      minHeight: chartData.income[index] > 0 ? '4px' : '0px'
                    }}
                    role="presentation"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      Income: ${chartData.income[index].toFixed(2)}
                    </div>
                  </div>
                  {/* Value label - abbreviated for large numbers */}
                  <span className="text-xs text-gray-500 mt-1">
                    ${chartData.income[index] > 1000 
                      ? `${(chartData.income[index] / 1000).toFixed(1)}k`
                      : chartData.income[index].toFixed(0)
                    }
                  </span>
                </div>
                
                {/* Expense bar */}
                <div className="flex flex-col items-center justify-end" aria-label={`Expenses for ${label}: $${chartData.expenses[index].toFixed(2)}`}>
                  <div
                    className="bg-red-500 rounded-t w-4 transition-all duration-300 hover:bg-red-600 cursor-pointer group relative"
                    style={{ 
                      height: `${(chartData.expenses[index] / maxValue) * 160}px`,
                      minHeight: chartData.expenses[index] > 0 ? '4px' : '0px'
                    }}
                    role="presentation"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      Expenses: ${chartData.expenses[index].toFixed(2)}
                    </div>
                  </div>
                  {/* Value label - abbreviated for large numbers */}
                  <span className="text-xs text-gray-500 mt-1">
                    ${chartData.expenses[index] > 1000 
                      ? `${(chartData.expenses[index] / 1000).toFixed(1)}k`
                      : chartData.expenses[index].toFixed(0)
                    }
                  </span>
                </div>
              </div>
              
              {/* Net cash flow indicator arrow */}
              {chartData.net[index] !== 0 && (
                <div className={`absolute -bottom-2 text-xs ${
                  chartData.net[index] >= 0 ? 'text-green-600' : 'text-red-600'
                }`} aria-hidden="true">
                  {chartData.net[index] >= 0 ? '↑' : '↓'}
                </div>
              )}
              
              {/* Time period label */}
              <span className="text-xs text-gray-600 truncate w-full text-center">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chart legend and summary footer */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
        {/* Color legend */}
        <div className="flex space-x-6" role="list" aria-label="Chart legend">
          <div className="flex items-center space-x-2" role="listitem">
            <div className="w-3 h-3 bg-green-500 rounded" aria-hidden="true"></div>
            <span className="text-sm text-gray-600">Income</span>
          </div>
          <div className="flex items-center space-x-2" role="listitem">
            <div className="w-3 h-3 bg-red-500 rounded" aria-hidden="true"></div>
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
        </div>
        
        {/* Growth rate indicator */}
        <div className="text-right">
          <div className="flex items-center space-x-2 text-sm" aria-label={`Growth rate: ${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`}>
            {stats.growthRate !== 0 && (
              <>
                {/* Trend icon */}
                {stats.growthRate >= 0 ? (
                  <TrendingUp size={16} className="text-green-500" aria-hidden="true" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" aria-hidden="true" />
                )}
                {/* Growth rate percentage */}
                <span className={stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                </span>
                <span className="text-gray-500">from start</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;