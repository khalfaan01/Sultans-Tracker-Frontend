// src/components/dashboard/TopExpensesChart.jsx
import { useMemo } from 'react';
import { PieChart, DollarSign, TrendingUp } from 'lucide-react';

const TopExpensesChart = ({ categoryBreakdown }) => {
  // Colors for the pie chart segments
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'];
  const circumference = 2 * Math.PI * 40; // Circle radius: 40, for SVG stroke-dash calculations

  // Process category data and generate chart data
  const { topCategories, totalExpenses, chartData } = useMemo(() => {
    try {
      // Validate input data
      if (!categoryBreakdown || typeof categoryBreakdown !== 'object') {
        console.warn('Invalid categoryBreakdown provided');
        return { topCategories: [], totalExpenses: 0, chartData: [] };
      }

      const entries = Object.entries(categoryBreakdown);
      if (entries.length === 0) {
        return { topCategories: [], totalExpenses: 0, chartData: [] };
      }

      // Filter, sort, and limit to top 5 categories
      const categories = entries
        .map(([category, amount]) => ({
          category: category || 'Uncategorized',
          amount: Math.max(0, Number(amount) || 0) // Ensure positive number
        }))
        .filter(item => item.amount > 0) // Remove zero amounts
        .sort((a, b) => b.amount - a.amount) // Descending sort
        .slice(0, 5); // Top 5 only

      if (categories.length === 0) {
        return { topCategories: [], totalExpenses: 0, chartData: [] };
      }

      const total = categories.reduce((sum, item) => sum + item.amount, 0);
      
      // Guard against division by zero
      if (total <= 0) {
        return { topCategories: categories, totalExpenses: 0, chartData: [] };
      }

      // Generate chart data with cumulative angles for pie segments
      const chartData = categories.map((item, index) => {
        const percentage = (item.amount / total) * 100;
        // Calculate starting angle for this segment based on previous segments
        const angle = categories.slice(0, index).reduce((sum, prevItem) => {
          return sum + (prevItem.amount / total) * 360;
        }, 0);

        return {
          ...item,
          percentage,
          color: COLORS[index % COLORS.length],
          angle
        };
      });

      return {
        topCategories: categories,
        totalExpenses: total,
        chartData
      };
    } catch (error) {
      console.error('Error processing category data:', error);
      return { topCategories: [], totalExpenses: 0, chartData: [] };
    }
  }, [categoryBreakdown]);

  // Handle empty state
  if (!topCategories.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PieChart className="mr-2" size={20} />
          Top 5 Expenses
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <DollarSign className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500">No expense data available</p>
            <p className="text-sm text-gray-400 mt-1">Add expenses to see category breakdown</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <PieChart className="mr-2" size={20} />
          Top 5 Expenses
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${Number(totalExpenses).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>

      {/* Main Content: Pie Chart and Legend */}
      <div className="flex items-center">
        {/* Pie Chart Visualization */}
        <div className="relative w-32 h-32 mr-6">
          <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
            {chartData.map((item) => {
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
              
              return (
                <circle
                  key={item.category}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transform: `rotate(${item.angle}deg)`,
                    transformOrigin: '50px 50px',
                    transition: 'stroke-dashoffset 0.5s ease'
                  }}
                />
              );
            })}
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {topCategories.length}
              </div>
              <div className="text-xs text-gray-500">Categories</div>
            </div>
          </div>
        </div>

        {/* Category Legend and Details */}
        <div className="flex-1">
          <div className="space-y-3">
            {chartData.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 capitalize truncate">
                      {item.category.toLowerCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-900">
                    ${Number(item.amount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <TrendingUp className="mr-2" size={16} />
          Spending Insights
        </h4>
        <div className="space-y-2">
          {chartData[0] && (
            <div className="text-sm text-gray-600">
              <span className="font-medium capitalize">{chartData[0].category.toLowerCase()}</span> is your largest expense at {chartData[0].percentage.toFixed(1)}% of total
            </div>
          )}
          {chartData.length >= 3 && (
            <div className="text-sm text-gray-600">
              Top 3 categories make up {chartData.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}% of your spending
            </div>
          )}
          {chartData.length === 5 && chartData[4].percentage < 10 && (
            <div className="text-sm text-gray-600">
              Your smallest expense category is <span className="font-medium capitalize">{chartData[4].category.toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Highest Category</div>
          <div className="font-semibold text-gray-900 capitalize">
            {chartData[0]?.category.toLowerCase() || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            {chartData[0]?.percentage.toFixed(1)}% of total
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600">Categories Tracked</div>
          <div className="font-semibold text-gray-900">
            {topCategories.length}
          </div>
          <div className="text-xs text-gray-500">of 5 shown</div>
        </div>
      </div>
    </div>
  );
};

export default TopExpensesChart;