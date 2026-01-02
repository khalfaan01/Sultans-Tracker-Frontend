// src/components/dashboard/AnalyticsPage.jsx
import { motion } from 'framer-motion';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  LineElement,
  PointElement,
  Title, 
  Filler
} from 'chart.js';
import { useState, useEffect } from 'react';
import { useDashboard, useTransactions, useBudgets, useGoals } from '../../contexts';
import IncomeExpenseChart from './IncomeExpenseChart';
import CashFlowRadar from './CashFlowRadar';
import FinanceHealthScore from './FinanceHealthScore';
import SmartSuggestions from './SmartSuggestions';
import { analyticsService } from '../../services/analyticsService';

// Register ChartJS components globally
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
  BarElement, LineElement, PointElement, Title, Filler
);

/**
 * Comprehensive financial analytics dashboard with multiple visualization views
 * Integrates real-time data, AI-powered insights, and timeframe-based filtering
 * 
 * @param {Object} filters - External filter parameters for data segmentation
 * @returns {JSX.Element} Analytics dashboard interface
 */
export default function AnalyticsPage({ filters }) {
  // Context hooks for centralized state management
  const { 
    financialSummary, 
    budgetProgress, 
    goalProgress, 
    categoryBreakdown,
    monthlyTrends,
    financialHealthScore,
    loading: dashboardLoading 
  } = useDashboard();
  
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useGoals();
  
  // State for enhanced analytics and UI controls
  const [enhancedAnalytics, setEnhancedAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  /**
   * Fetches enhanced analytics data with error handling
   * Runs when timeframe changes or new transactions are available
   */
  useEffect(() => {
    const loadEnhancedAnalytics = async () => {
      // Skip if no transaction data
      if (transactions.length === 0) {
        setEnhancedAnalytics(null);
        return;
      }

      try {
        setAnalyticsLoading(true);
        setError(null);
        const analytics = await analyticsService.getEnhancedAnalytics(timeframe);
        
        if (!analytics) {
          throw new Error('No analytics data returned from service');
        }
        
        setEnhancedAnalytics(analytics);
      } catch (err) {
        console.error(' Failed to load enhanced analytics:', err);
        setError('Unable to load analytics data. Please try again later.');
        setEnhancedAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadEnhancedAnalytics();
  }, [timeframe, transactions.length]);

  /**
   * Dashboard statistics cards data
   * Combines basic financial data with enhanced analytics insights
   */
  const financialStats = [
    { 
      title: 'Total Balance', 
      value: `$${financialSummary?.balance?.toFixed(2) || '0.00'}`,
      trend: enhancedAnalytics?.cashFlowAnalysis?.trends?.netGrowth || 0,
      isLoading: dashboardLoading
    },
    { 
      title: 'Projected 30-day', 
      value: enhancedAnalytics 
        ? `$${enhancedAnalytics.spendingForecast?.dailyProjections?.reduce((sum, day) => sum + day.projectedAmount, 0).toFixed(2) || '0.00'}`
        : 'Calculating...',
      subtitle: 'Spending Forecast',
      isLoading: analyticsLoading
    },
    { 
      title: 'Income Diversity', 
      value: enhancedAnalytics 
        ? `${enhancedAnalytics.incomeBreakdown?.diversityScore?.toFixed(0) || 0}%`
        : 'N/A',
      subtitle: 'Stream Variety',
      isLoading: analyticsLoading
    },
  ];

  // Show loading state during data fetch
  if (dashboardLoading || analyticsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // Show error state if analytics failed to load
  if (error && !enhancedAnalytics) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 font-medium">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="ml-auto text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
        {/* Fallback to basic analytics without enhanced features */}
        <BasicAnalyticsView 
          financialSummary={financialSummary}
          monthlyTrends={monthlyTrends}
          categoryBreakdown={categoryBreakdown}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with timeframe controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        
        {/* Timeframe selector for data aggregation period */}
        <div className="flex space-x-2">
          {['weekly', 'monthly', 'yearly'].map((frame) => (
            <button
              key={frame}
              onClick={() => setTimeframe(frame)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === frame
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main navigation tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'cashflow', label: 'Cash Flow' },
          { id: 'income', label: 'Income Streams' },
          { id: 'forecast', label: 'Forecast' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Financial summary cards with animated transitions */}
      <div className="grid md:grid-cols-3 gap-6">
        {financialStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            {stat.subtitle && (
              <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
            )}
            {/* Display trend indicator if available */}
            {stat.trend !== undefined && (
              <p className={`text-sm mt-1 ${
                stat.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend >= 0 ? '↗' : '↘'} {Math.abs(stat.trend).toFixed(1)}%
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Dynamic tab content rendering */}
      {activeTab === 'overview' && (
        <OverviewTab 
          monthlyTrends={monthlyTrends}
          categoryBreakdown={categoryBreakdown}
          transactions={transactions}
          budgets={budgets}
          goals={goals}
          financialHealthScore={financialHealthScore}
          enhancedAnalytics={enhancedAnalytics}
          timeframe={timeframe}
        />
      )}

      {activeTab === 'cashflow' && (
        <CashFlowTab 
          transactions={transactions}
          enhancedAnalytics={enhancedAnalytics}
          timeframe={timeframe}
        />
      )}

      {activeTab === 'income' && (
        <IncomeTab 
          enhancedAnalytics={enhancedAnalytics}
        />
      )}

      {activeTab === 'forecast' && (
        <ForecastTab 
          enhancedAnalytics={enhancedAnalytics}
        />
      )}
    </div>
  );
}

/**
 * Fallback basic analytics view when enhanced analytics fail
 */
function BasicAnalyticsView({ financialSummary, monthlyTrends, categoryBreakdown }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          {monthlyTrends.length > 0 ? (
            <Bar 
              data={{
                labels: monthlyTrends.map(data => data.month),
                datasets: [
                  {
                    label: 'Income',
                    data: monthlyTrends.map(data => data.income),
                    backgroundColor: '#4BC0C0',
                  },
                  {
                    label: 'Expenses',
                    data: monthlyTrends.map(data => data.expenses),
                    backgroundColor: '#FF6384',
                  },
                ],
              }} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }} 
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No transaction data available
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Current Balance</h3>
          <div className="text-4xl font-bold text-center py-12">
            ${financialSummary?.balance?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

/**
 * Overview tab with comprehensive financial dashboard
 */
const OverviewTab = ({ monthlyTrends, categoryBreakdown, transactions, budgets, goals, financialHealthScore, enhancedAnalytics, timeframe }) => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <IncomeExpenseChart 
        data={monthlyTrends} 
        timeframe={timeframe}
        enhancedData={enhancedAnalytics}
      />
    </motion.div>

    {/* Dual-column visualization section */}
    <div className="grid md:grid-cols-2 gap-6">
      {/* Pie chart for category breakdown */}
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
        <div className="h-64">
          {Object.keys(categoryBreakdown).length > 0 ? (
            <Pie 
              data={{
                labels: Object.keys(categoryBreakdown),
                datasets: [{
                  data: Object.values(categoryBreakdown),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                }],
              }} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No spending data available
            </div>
          )}
        </div>
      </motion.div>

      {/* Bar chart for income vs expenses */}
      <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Income vs Expenses Trend</h3>
        <div className="h-64">
          {monthlyTrends.length > 0 ? (
            <Bar 
              data={{
                labels: monthlyTrends.map(data => data.month),
                datasets: [
                  {
                    label: 'Income',
                    data: monthlyTrends.map(data => data.income),
                    backgroundColor: '#4BC0C0',
                  },
                  {
                    label: 'Expenses',
                    data: monthlyTrends.map(data => data.expenses),
                    backgroundColor: '#FF6384',
                  },
                ],
              }} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true }
                }
              }} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No transaction data available
            </div>
          )}
        </div>
      </motion.div>
    </div>

    {/* Health score and recommendations section */}
    <div className="grid md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <FinanceHealthScore 
          financialHealthScore={financialHealthScore}
          budgets={budgets}
          goals={goals}
          timeframe={timeframe}
          enhancedData={enhancedAnalytics}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SmartSuggestions 
          transactions={transactions}
          budgets={budgets}
          categoryBreakdown={categoryBreakdown}
          timeframe={timeframe}
          enhancedData={enhancedAnalytics}
        />
      </motion.div>
    </div>
  </div>
);

/**
 * Cash flow analysis tab with radar and line charts
 */
const CashFlowTab = ({ transactions, enhancedAnalytics, timeframe }) => {
  // Validate enhanced analytics data exists
  if (!enhancedAnalytics?.cashFlowAnalysis) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-yellow-700">
          <div className="font-medium">Cash flow analysis unavailable</div>
          <div className="text-sm mt-1">Insufficient transaction data for the selected timeframe.</div>
        </div>
      </div>
    );
  }

  const { periods, insights } = enhancedAnalytics.cashFlowAnalysis;
  
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <CashFlowRadar 
          transactions={transactions}
          timeframe={timeframe}
          enhancedData={enhancedAnalytics}
        />
      </motion.div>

      {/* Multi-line chart for detailed cash flow analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Detailed Cash Flow Analysis ({timeframe})</h3>
        <div className="h-80">
          <Line
            data={{
              labels: periods.map(p => 
                timeframe === 'daily' 
                  ? p.date.split('-').slice(1).join('/') 
                  : p.period
              ),
              datasets: [
                {
                  label: 'Income',
                  data: periods.map(p => p.income),
                  borderColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: true,
                  tension: 0.4
                },
                {
                  label: 'Expenses',
                  data: periods.map(p => p.expenses),
                  borderColor: '#EF4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fill: true,
                  tension: 0.4
                },
                {
                  label: 'Net Cash Flow',
                  data: periods.map(p => p.net),
                  borderColor: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                }
              ]
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
        
        {/* Insights panel for actionable recommendations */}
        {insights.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Cash Flow Insights</h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-yellow-700">
                  <span>•</span>
                  <span>{insight.message} - {insight.recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

/**
 * Income analysis tab with stream breakdown
 */
const IncomeTab = ({ enhancedAnalytics }) => {
  // Validate income data exists
  if (!enhancedAnalytics?.incomeBreakdown) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-yellow-700">
          <div className="font-medium">Income analysis unavailable</div>
          <div className="text-sm mt-1">No income data available for analysis.</div>
        </div>
      </div>
    );
  }

  const { streams, totalIncome, streamCount, primaryStream, diversityScore } = enhancedAnalytics.incomeBreakdown;
  const streamEntries = Object.entries(streams);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Income Stream Breakdown</h3>
        <div className="h-64">
          <Pie
            data={{
              labels: streamEntries.map(([name]) => name),
              datasets: [{
                data: streamEntries.map(([, data]) => data.percentage),
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const stream = streamEntries[context.dataIndex][1];
                      return `${context.label}: ${stream.percentage.toFixed(1)}% ($${stream.total.toFixed(2)})`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </motion.div>

      {/* Income metrics summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Income Stream Analysis</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              ${totalIncome.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Income</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {streamCount}
            </div>
            <div className="text-sm text-gray-600">Income Streams</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {primaryStream}
            </div>
            <div className="text-sm text-gray-600">Primary Source</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {diversityScore.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Diversity Score</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Forecast tab with spending predictions and recommendations
 */
const ForecastTab = ({ enhancedAnalytics }) => {
  // Validate forecast data exists
  if (!enhancedAnalytics?.spendingForecast) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-yellow-700">
          <div className="font-medium">Forecast unavailable</div>
          <div className="text-sm mt-1">Insufficient historical data for accurate forecasting.</div>
        </div>
      </div>
    );
  }

  const { dailyProjections, riskFactors, recommendations } = enhancedAnalytics.spendingForecast;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">30-Day Spending Forecast</h3>
        <div className="h-80">
          <Line
            data={{
              labels: dailyProjections.map(p => new Date(p.date).getDate()),
              datasets: [{
                label: 'Projected Daily Spending',
                data: dailyProjections.map(p => p.projectedAmount),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4
              }]
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              scales: {
                x: { 
                  title: { 
                    display: true, 
                    text: 'Day of Month' 
                  }, 
                  grid: { display: false } 
                },
                y: { 
                  title: { 
                    display: true, 
                    text: 'Amount ($)' 
                  }, 
                  beginAtZero: true 
                }
              }
            }}
          />
        </div>
      </motion.div>

      {/* Risk and recommendation panels */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk factors panel */}
        {riskFactors.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Risk Factors</h3>
            <div className="space-y-3">
              {riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-red-700">
                  <span className="text-red-500">⚠</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations panel */}
        {recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                  <span className="text-blue-500">💡</span>
                  <div>
                    <div className="font-medium">{rec.message}</div>
                    <div className="text-blue-600 mt-1">Action: {rec.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};