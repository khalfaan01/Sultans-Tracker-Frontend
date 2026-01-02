// useCalendarData.js
import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';

/**
 * Custom hook for processing transaction data into calendar-based structures
 * Provides utilities for date-based transaction analysis and visualization
 * 
 * @returns {Object} Calendar data utilities including:
 *   - calendarData: Processed transactions organized by date
 *   - selectedDate: Currently selected date for detail view
 *   - setSelectedDate: Function to update selected date
 *   - loading: Data processing state
 *   - getDateData: Get transactions for specific date
 *   - getMonthlySummary: Aggregate data for specific month
 *   - getDateRangeData: Data and summary for date range
 *   - getHeatmapData: Calendar view data for month
 *   - getTopSpendingDays: Top spending days by expense amount
 *   - refreshData: Force recalculation of calendar data
 * 
 * @example
 * const { getMonthlySummary, loading } = useCalendarData();
 * const marchData = getMonthlySummary(2024, 3);
 */
export const useCalendarData = () => {
  const { transactions } = useTransactions();
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Processes raw transactions into calendar-optimized format
   * Groups transactions by date and calculates daily aggregates
   * @private
   */
  const processCalendarData = useCallback(() => {
    setLoading(true);
    
    try {
      const data = transactions.reduce((acc, transaction) => {
        // Normalize date to YYYY-MM-DD format
        const date = new Date(transaction.date).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            transactions: [],
            totalIncome: 0,
            totalExpenses: 0,
            netAmount: 0
          };
        }

        acc[date].transactions.push(transaction);
        
        // Categorize as income or expense based on amount sign
        if (transaction.amount > 0) {
          acc[date].totalIncome += transaction.amount;
        } else {
          acc[date].totalExpenses += Math.abs(transaction.amount);
        }
        
        acc[date].netAmount += transaction.amount;
        
        return acc;
      }, {});

      setCalendarData(data);
    } catch (error) {
      console.error('Error processing calendar data:', error);
      setCalendarData({});
    } finally {
      setLoading(false);
    }
  }, [transactions]);

  /**
   * Retrieves processed data for a specific date
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {Object} Date-specific transaction data or empty structure
   */
  const getDateData = useCallback((dateString) => {
    return calendarData[dateString] || {
      transactions: [],
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0
    };
  }, [calendarData]);

  /**
   * Calculates aggregate statistics for a specific month
   * @param {number} year - Year (e.g., 2024)
   * @param {number} month - Month (1-12)
   * @returns {Object} Monthly summary with totals and counts
   */
  const getMonthlySummary = useCallback((year, month) => {
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    
    const monthlyData = Object.entries(calendarData)
      .filter(([date]) => date.startsWith(prefix))
      .reduce((acc, [, data]) => {
        acc.totalIncome += data.totalIncome;
        acc.totalExpenses += data.totalExpenses;
        acc.netAmount += data.netAmount;
        acc.transactionCount += data.transactions.length;
        return acc;
      }, {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        transactionCount: 0
      });

    return monthlyData;
  }, [calendarData]);

  /**
   * Analyzes transaction data within a specific date range
   * @param {string|Date} startDate - Range start date
   * @param {string|Date} endDate - Range end date
   * @returns {Object} Contains individual date data and aggregated summary
   */
  const getDateRangeData = useCallback((startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const rangeData = Object.entries(calendarData)
        .filter(([date]) => {
          const currentDate = new Date(date);
          return currentDate >= start && currentDate <= end;
        })
        .reduce((acc, [date, data]) => {
          acc.dates[date] = data;
          acc.summary.totalIncome += data.totalIncome;
          acc.summary.totalExpenses += data.totalExpenses;
          acc.summary.netAmount += data.netAmount;
          acc.summary.transactionCount += data.transactions.length;
          return acc;
        }, {
          dates: {},
          summary: {
            totalIncome: 0,
            totalExpenses: 0,
            netAmount: 0,
            transactionCount: 0
          }
        });

      return rangeData;
    } catch (error) {
      console.error('Error getting date range data:', error);
      return {
        dates: {},
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          netAmount: 0,
          transactionCount: 0
        }
      };
    }
  }, [calendarData]);

  /**
   * Generates heatmap-compatible data structure for calendar visualization
   * Initializes all days in month with corresponding data
   * @param {number} year - Year for heatmap
   * @param {number} month - Month for heatmap (1-12)
   * @returns {Object} Date-keyed data for all days in specified month
   */
  const getHeatmapData = useCallback((year, month) => {
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    
    const heatmapData = {};
    
    // Create entries for all days in month, even those without transactions
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${prefix}-${day.toString().padStart(2, '0')}`;
      heatmapData[dateStr] = getDateData(dateStr);
    }

    return heatmapData;
  }, [getDateData]);

  /**
   * Identifies days with highest expense amounts
   * @param {number} limit - Maximum number of days to return
   * @returns {Array} Sorted array of top spending days with metadata
   */
  const getTopSpendingDays = useCallback((limit = 5) => {
    return Object.entries(calendarData)
      .filter(([, data]) => data.totalExpenses > 0)
      .sort(([,a], [,b]) => b.totalExpenses - a.totalExpenses)
      .slice(0, limit)
      .map(([date, data]) => ({
        date,
        amount: data.totalExpenses,
        transactionCount: data.transactions.length
      }));
  }, [calendarData]);

  /**
   * Triggers reprocessing of calendar data
   * Useful when transactions change externally
   */
  const refreshData = useCallback(() => {
    processCalendarData();
  }, [processCalendarData]);

  // Process data on initial load and when transactions change
  useEffect(() => {
    processCalendarData();
  }, [processCalendarData]);

  return {
    calendarData,
    selectedDate,
    setSelectedDate,
    loading,
    getDateData,
    getMonthlySummary,
    getDateRangeData,
    getHeatmapData,
    getTopSpendingDays,
    refreshData
  };
};

export default useCalendarData;