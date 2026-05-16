import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthlyOverviewChart = ({ data = [], timeframe }) => {
  const { chartData, insights } = useMemo(() => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { chartData: null, insights: null };
      }

      // Use all available months for yearly view, last 6 for monthly
      const displayData = timeframe === 'yearly' ? data : data.slice(-6);

      if (displayData.length === 0) {
        return { chartData: null, insights: null };
      }

      // Calculate insights
      const totalIncome = displayData.reduce((sum, m) => sum + (m.income || 0), 0);
      const totalExpenses = displayData.reduce((sum, m) => sum + (m.expenses || 0), 0);
      const netTotal = totalIncome - totalExpenses;
      
      const insights = {
        totalIncome,
        totalExpenses,
        netTotal,
        avgIncome: totalIncome / displayData.length,
        avgExpenses: totalExpenses / displayData.length,
        bestMonth: displayData.reduce((best, m) => (m.net || 0) > (best.net || 0) ? m : best, displayData[0]),
        worstMonth: displayData.reduce((worst, m) => (m.net || 0) < (worst.net || 0) ? m : worst, displayData[0]),
        positiveMonths: displayData.filter(m => (m.net || 0) >= 0).length,
        totalMonths: displayData.length
      };

      const chartData = {
        labels: displayData.map(m => {
          const parts = m.month?.split(' ') || [];
          return parts.length >= 2 ? parts.slice(0, 2).join(' ') : m.month;
        }),
        datasets: [
          {
            label: 'Income',
            data: displayData.map(m => m.income || 0),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Expenses',
            data: displayData.map(m => m.expenses || 0),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#EF4444',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
      };

      return { chartData, insights };
    } catch (error) {
      console.error('Error processing monthly overview data:', error);
      return { chartData: null, insights: null };
    }
  }, [data, timeframe]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45 }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (!chartData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Monthly Overview
        </h3>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <DollarSign className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500">No monthly data available</p>
            <p className="text-sm text-gray-400 mt-1">Add transactions to see monthly trends</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Monthly Overview
        </h3>
        <div className="text-sm text-gray-500">
          {timeframe === 'yearly' ? 'Last 12 months' : 'Last 6 months'}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Insights Row */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Income</div>
            <div className="text-lg font-bold text-green-600">
              ${insights.totalIncome.toFixed(0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-lg font-bold text-red-600">
              ${insights.totalExpenses.toFixed(0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Net Flow</div>
            <div className={`text-lg font-bold ${insights.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${insights.netTotal.toFixed(0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Positive Months</div>
            <div className="text-lg font-bold text-gray-900">
              {insights.positiveMonths}/{insights.totalMonths}
            </div>
          </div>
        </div>
      )}

      {/* Best/Worst Month */}
      {insights && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">Best Month</div>
            <div className="text-sm font-semibold text-gray-900">
              {insights.bestMonth?.month}
            </div>
            <div className="text-xs text-green-600">
              +${insights.bestMonth?.net?.toFixed(2)}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-xs text-red-600 font-medium">Most Challenging</div>
            <div className="text-sm font-semibold text-gray-900">
              {insights.worstMonth?.month}
            </div>
            <div className="text-xs text-red-600">
              ${insights.worstMonth?.net?.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyOverviewChart;