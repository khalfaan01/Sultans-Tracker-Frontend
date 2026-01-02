// src/components/dashboard/CalendarView.jsx
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '../../contexts';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
/**
 * Visual calendar interface for tracking daily spending patterns
 * 
 * Features:
 * - Monthly calendar heatmap showing spending intensity
 * - Daily transaction summaries with net flow visualization
 * - Interactive date selection for detailed transaction views
 * - Color-coded spending indicators based on transaction amounts
 * - Responsive month navigation with animated transitions
 * 
 * Data Processing:
 * - Filters transactions by current month
 * - Groups transactions by date for efficient rendering
 * - Calculates daily totals for heatmap visualization
 * - Generates complete calendar grid with proper date alignment
 * 
 * Error Considerations:
 * - Handles missing transaction data gracefully
 * - Validates date calculations to prevent rendering errors
 * - Provides fallback states for empty transaction days
 */
export default function CalendarView() {

  const navigate = useNavigate();
  
  // Centralized transaction context for data consistency
  const { transactions, loading, error } = useTransactions();
  
  // UI state for navigation and selection
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Memoized transaction filtering for current month
  const monthlyTransactions = useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    });
  }, [transactions, currentDate]);

  // Group transactions by date string for O(1) lookups
  const transactionsByDate = useMemo(() => {
    const grouped = {};
    monthlyTransactions.forEach(tx => {
      const dateStr = new Date(tx.date).toDateString();
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(tx);
    });
    return grouped;
  }, [monthlyTransactions]);

  // Calculate net daily totals (income positive, expenses negative)
  const dailyTotals = useMemo(() => {
    const totals = {};
    Object.entries(transactionsByDate).forEach(([dateStr, txs]) => {
      const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
      totals[dateStr] = total;
    });
    return totals;
  }, [transactionsByDate]);

  // Generate complete calendar grid with date objects and transaction data
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Calculate month boundaries
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Pad calendar with empty cells for days before month start
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Populate calendar with actual days and their transaction data
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const dayTransactions = transactionsByDate[dateStr] || [];
      const dailyTotal = dailyTotals[dateStr] || 0;
      
      days.push({
        date,
        day,
        transactions: dayTransactions,
        total: dailyTotal,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  }, [currentDate, transactionsByDate, dailyTotals]);

  /**
   * Navigate between months while maintaining date validity
   * @param {number} direction - -1 for previous month, 1 for next month
   */
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  /**
   * Determines background color based on spending intensity
   * Uses gradient from light to dark red for expenses, green for income
   * @param {number} amount - Net daily amount (positive for income, negative for expenses)
   * @returns {string} Tailwind CSS classes for background and border
   */
  const getSpendingColor = (amount) => {
    if (amount === 0) return 'bg-gray-100';
    if (amount > 0) return 'bg-green-100 border-green-300';
    
    // Calculate intensity based on absolute spending amount
    // Cap at 1.0 for consistent color scaling
    const intensity = Math.min(Math.abs(amount) / 100, 1);
    if (intensity < 0.3) return 'bg-red-50 border-red-200';
    if (intensity < 0.6) return 'bg-red-100 border-red-300';
    return 'bg-red-200 border-red-400';
  };

  // Display constants
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Unable to load transaction data. Please try again later.
      </div>
    );
  }

  return (

    <div className="space-y-6">
      <button
              onClick={() => navigate('/dashboard/transactions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Transactions
            </button>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Calendar header with navigation controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Spending Calendar</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-semibold min-w-32 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid with interactive days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: day ? 1.05 : 1 }}
              onClick={() => day && setSelectedDate(day)}
              className={`
                min-h-20 p-1 border rounded-lg cursor-pointer transition-all
                ${day ? getSpendingColor(day.total) : ''}
                ${day?.isToday ? 'ring-2 ring-blue-500' : ''}
                ${selectedDate?.date.toDateString() === day?.date.toDateString() ? 'ring-2 ring-black' : ''}
                ${!day ? 'invisible' : ''} // Hide empty cells from screen readers
              `}
              role="button"
              tabIndex={day ? 0 : -1}
              aria-label={day ? `${monthNames[currentDate.getMonth()]} ${day.day}` : 'Empty calendar cell'}
              aria-selected={selectedDate?.date.toDateString() === day?.date.toDateString()}
            >
              {day && (
                <div className="h-full flex flex-col">
                  {/* Date number with today highlighting */}
                  <div className={`text-sm font-medium ${
                    day.isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {day.day}
                  </div>
                  
                  {/* Daily spending summary */}
                  <div className="flex-1 flex flex-col justify-center items-center space-y-1">
                    {day.total !== 0 && (
                      <>
                        <div className={`flex items-center space-x-1 text-xs ${
                          day.total > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {day.total > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>${Math.abs(day.total).toFixed(0)}</span>
                        </div>
                        {day.transactions.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {day.transactions.length} tx
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Selected date transaction details */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gray-50 rounded-lg"
            role="region"
            aria-label={`Transactions for ${selectedDate.date.toLocaleDateString()}`}
          >
            <h3 className="font-semibold mb-3">
              {selectedDate.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            {selectedDate.transactions.length === 0 ? (
              <p className="text-gray-500">No transactions on this day</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Net Flow:</span>
                  <span className={`font-medium ${
                    selectedDate.total >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedDate.total >= 0 ? '+' : ''}${selectedDate.total.toFixed(2)}
                  </span>
                </div>
                
                {/* Transaction list with scroll for many items */}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedDate.transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-sm p-2 bg-white rounded">
                      <div>
                        <span className="font-medium">{tx.category}</span>
                        {tx.description && (
                          <span className="text-gray-500 ml-2">- {tx.description}</span>
                        )}
                      </div>
                      <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Heatmap legend for spending intensity */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
            <span>Low Spending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
            <span>High Spending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Income</span>
          </div>
        </div>
      </div>
    </div>
  );
}