// TransactionHeatmap.jsx
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback } from 'react';
import { useTransactions } from '../../contexts/TransactionsContext';
import { ArrowLeft, AlertTriangle } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom'; 

export default function TransactionHeatmap() {
  const { transactions = [] } = useTransactions();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  // Validate transactions data
  const isValidTransaction = useCallback((tx) => {
    return tx && 
           typeof tx === 'object' && 
           tx.date && 
           typeof tx.amount === 'number' &&
           !isNaN(new Date(tx.date).getTime());
  }, []);

  // Get transactions for selected year with error handling
  const yearlyTransactions = useMemo(() => {
    try {
      if (!Array.isArray(transactions)) {
        throw new Error('Invalid transactions data');
      }

      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      
      // Filter and validate transactions
      const filtered = transactions.filter(tx => {
        if (!isValidTransaction(tx)) {
          console.warn('Invalid transaction skipped:', tx);
          return false;
        }

        try {
          const txDate = new Date(tx.date);
          return txDate >= startDate && txDate <= endDate;
        } catch (dateErr) {
          console.warn('Invalid date in transaction:', tx.date);
          return false;
        }
      });

      return filtered;
    } catch (err) {
      console.error('Error filtering yearly transactions:', err);
      setError('Failed to process transaction data');
      return [];
    }
  }, [transactions, selectedYear, isValidTransaction]);

  // Check if year is a leap year
  const isLeapYear = useCallback((year) => {
    try {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    } catch {
      return false;
    }
  }, []);

  // Get days in month for a specific year
  const getDaysInMonth = useCallback((year, month) => {
    try {
      const baseDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (isLeapYear(year)) {
        baseDays[1] = 29;
      }
      return baseDays[month] || 31;
    } catch {
      return 31; // Safe fallback
    }
  }, [isLeapYear]);

  // Generate heatmap data with error handling
  const heatmapData = useMemo(() => {
    try {
      const data = {};
      
      // Initialize data structure for all months
      for (let month = 0; month < 12; month++) {
        data[month] = {};
        const daysInMonth = getDaysInMonth(selectedYear, month);
        
        for (let day = 1; day <= daysInMonth; day++) {
          try {
            // Create date string with validation
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) {
              console.warn('Invalid date created:', dateStr);
              continue;
            }
            
            data[month][day] = {
              date,
              amount: 0,
              count: 0
            };
          } catch (dateErr) {
            console.warn('Error creating date for heatmap:', month, day, selectedYear);
          }
        }
      }

      // Populate with transaction data
      yearlyTransactions.forEach(tx => {
        try {
          const txDate = new Date(tx.date);
          if (isNaN(txDate.getTime())) {
            console.warn('Invalid transaction date:', tx.date);
            return;
          }

          const month = txDate.getMonth();
          const day = txDate.getDate();
          
          // Validate month and day are within bounds
          if (month >= 0 && month < 12 && 
              data[month] && 
              day >= 1 && day <= getDaysInMonth(selectedYear, month)) {
            
            const dayData = data[month][day];
            if (dayData) {
              const amount = Math.abs(Number(tx.amount) || 0);
              dayData.amount += amount;
              dayData.count += 1;
            }
          }
        } catch (txErr) {
          console.warn('Error processing transaction for heatmap:', tx, txErr);
        }
      });

      return data;
    } catch (err) {
      console.error('Error generating heatmap data:', err);
      setError('Failed to generate heatmap visualization');
      return {};
    }
  }, [yearlyTransactions, selectedYear, getDaysInMonth]);

  // Get intensity color based on spending with safe defaults
  const getIntensityColor = useCallback((amount, monthData) => {
    try {
      if (!amount || amount <= 0) return 'bg-gray-100';
      
      // Find max amount for scaling
      const allAmounts = Object.values(monthData || {}).flatMap(month => 
        Object.values(month || {}).map(day => day?.amount || 0)
      );
      
      // Filter out invalid amounts
      const validAmounts = allAmounts.filter(a => !isNaN(a) && isFinite(a));
      if (validAmounts.length === 0) return 'bg-gray-100';
      
      const maxAmount = Math.max(...validAmounts);
      if (maxAmount <= 0) return 'bg-gray-100';
      
      const intensity = Math.min(1, Math.max(0, amount / maxAmount));
      
      if (intensity < 0.2) return 'bg-green-100';
      if (intensity < 0.4) return 'bg-green-200';
      if (intensity < 0.6) return 'bg-green-300';
      if (intensity < 0.8) return 'bg-green-400';
      return 'bg-green-500';
    } catch {
      return 'bg-gray-100'; // Fallback color
    }
  }, []);

  // Calculate yearly totals safely
  const yearlyTotals = useMemo(() => {
    try {
      let totalIncome = 0;
      let totalExpenses = 0;
      
      yearlyTransactions.forEach(tx => {
        const amount = Number(tx.amount) || 0;
        const txType = tx.type || 'expense'; // Default to expense if type not specified
        
        if (txType === 'income' && amount > 0) {
          totalIncome += amount;
        } else if (amount < 0) {
          totalExpenses += Math.abs(amount);
        }
      });

      return {
        totalIncome: Math.max(0, totalIncome),
        totalExpenses: Math.max(0, totalExpenses),
        totalTransactions: yearlyTransactions.length
      };
    } catch (err) {
      console.error('Error calculating yearly totals:', err);
      return { totalIncome: 0, totalExpenses: 0, totalTransactions: 0 };
    }
  }, [yearlyTransactions]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Handle year change
  const handleYearChange = useCallback((e) => {
    try {
      const year = parseInt(e.target.value);
      if (!isNaN(year) && year >= 2000 && year <= currentYear) {
        setSelectedYear(year);
        setError(''); // Clear errors on successful year change
      }
    } catch (err) {
      console.error('Error changing year:', err);
      setError('Invalid year selected');
    }
  }, [currentYear]);

  // Navigate back safely
  const handleBackClick = useCallback(() => {
    try {
      navigate('/dashboard/transactions');
    } catch (err) {
      console.error('Error navigating back:', err);
      setError('Navigation error occurred');
    }
  }, [navigate]);

  // Format tooltip content
  const formatTooltip = useCallback((date, amount, count) => {
    try {
      const formattedDate = date?.toLocaleDateString() || 'Invalid date';
      const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : '0.00';
      const transactionCount = typeof count === 'number' ? count : 0;
      
      return `${formattedDate}: $${formattedAmount} (${transactionCount} transaction${transactionCount !== 1 ? 's' : ''})`;
    } catch {
      return 'Data unavailable';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={handleBackClick}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        aria-label="Back to transactions"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900">Spending Heatmap</h2>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-w-[120px]"
            aria-label="Select year"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Heatmap Visualization */}
        <div className="overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {monthNames.map((monthName, monthIndex) => {
              const monthData = heatmapData[monthIndex];
              
              return (
                <div key={monthIndex} className="flex flex-col items-center space-y-1">
                  <div className="text-xs font-medium text-gray-600 mb-2">{monthName}</div>
                  <div className="grid grid-rows-7 gap-1">
                    {monthData && Object.entries(monthData).map(([day, dayData]) => {
                      if (!dayData || typeof dayData !== 'object') return null;
                      
                      const date = dayData.date;
                      const amount = dayData.amount || 0;
                      const count = dayData.count || 0;
                      
                      return (
                        <motion.div
                          key={`${monthIndex}-${day}`}
                          whileHover={{ scale: 1.2 }}
                          className={`w-4 h-4 rounded-sm border ${getIntensityColor(amount, heatmapData)} ${
                            count > 0 ? 'cursor-pointer hover:shadow-md' : ''
                          }`}
                          title={formatTooltip(date, amount, count)}
                          aria-label={`${monthName} ${day}: ${count} transaction${count !== 1 ? 's' : ''}, $${amount.toFixed(2)} spent`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm border"></div>
            <span>No spending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 rounded-sm border"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-300 rounded-sm border"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm border"></div>
            <span>High</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${yearlyTotals.totalIncome.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Income</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              ${yearlyTotals.totalExpenses.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {yearlyTotals.totalTransactions}
            </div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {yearlyTransactions.length === 0 && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No transactions for {selectedYear}
          </h3>
          <p className="text-gray-600">
            There are no transactions recorded for the selected year.
          </p>
        </div>
      )}
    </div>
  );
}