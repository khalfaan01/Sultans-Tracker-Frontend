//calendarUtils.js
import { 
  getStartOfMonth, 
  getEndOfMonth, 
  getDaysInMonth, 
  addMonths,
  getMonthName,
  getShortMonthName,
  getWeekdayName,
  getShortWeekdayName,
  generateDateRange
} from './dateUtils';

/**
 * Generates a calendar month structure with days from previous, current, and next months
 * @param {number} year - The year for the calendar
 * @param {number} month - The month index (0-11)
 * @returns {Object} Calendar object with month info, days, and weeks
 * @throws {Error} If year or month is invalid
 */
export const generateCalendarMonth = (year, month) => {
  // Validate inputs
  if (typeof year !== 'number' || year < 0 || year > 9999) {
    throw new Error('Invalid year parameter');
  }
  if (typeof month !== 'number' || month < 0 || month > 11) {
    throw new Error('Invalid month parameter (must be 0-11)');
  }

  try {
    const startOfMonth = getStartOfMonth(new Date(year, month));
    const endOfMonth = getEndOfMonth(new Date(year, month));
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const daysFromPrevMonth = firstDayOfMonth;
    const totalCells = 42; // 6 weeks * 7 days
    const daysFromNextMonth = totalCells - daysInMonth - daysFromPrevMonth;

    const calendar = {
      year,
      month,
      monthName: getMonthName(month),
      shortMonthName: getShortMonthName(month),
      weeks: [],
      days: []
    };

    // Previous month days (trailing days from previous month)
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      calendar.days.push({
        date: new Date(prevMonthYear, prevMonth, day),
        isCurrentMonth: false,
        isPreviousMonth: true,
        isNextMonth: false,
        dayNumber: day
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendar.days.push({
        date,
        isCurrentMonth: true,
        isPreviousMonth: false,
        isNextMonth: false,
        dayNumber: day,
        isToday: new Date().toDateString() === date.toDateString()
      });
    }

    // Next month days (leading days for next month)
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= daysFromNextMonth; day++) {
      calendar.days.push({
        date: new Date(nextMonthYear, nextMonth, day),
        isCurrentMonth: false,
        isPreviousMonth: false,
        isNextMonth: true,
        dayNumber: day
      });
    }

    // Group days into weeks (7 days per week)
    for (let i = 0; i < calendar.days.length; i += 7) {
      calendar.weeks.push(calendar.days.slice(i, i + 7));
    }

    return calendar;
  } catch (error) {
    console.error('Error generating calendar month:', error);
    throw new Error(`Failed to generate calendar: ${error.message}`);
  }
};

/**
 * Calculates ISO week numbers for a calendar month
 * @param {number} year - The year
 * @param {number} month - The month index (0-11)
 * @returns {number[]} Array of week numbers for the 6 weeks in calendar view
 */
export const getWeekNumbers = (year, month) => {
  try {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstWeekNumber = getWeekNumber(firstDayOfMonth);
    const weeks = [];
    
    for (let i = 0; i < 6; i++) {
      weeks.push(firstWeekNumber + i);
    }
    
    return weeks;
  } catch (error) {
    console.error('Error calculating week numbers:', error);
    return Array(6).fill(1); // Fallback to week 1
  }
};

/**
 * Calculates ISO 8601 week number for a given date
 * @param {Date} date - The date to calculate week number for
 * @returns {number} ISO week number (1-53)
 */
export const getWeekNumber = (date) => {
  try {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Adjust to Thursday in week 1 according to ISO 8601
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  } catch (error) {
    console.error('Error calculating week number:', error);
    return 1;
  }
};

/**
 * Generates heatmap data for calendar visualization based on transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {number} year - Year for heatmap
 * @param {number} month - Month for heatmap (0-11)
 * @returns {Object} Heatmap data keyed by date string
 */
export const getCalendarHeatmapData = (transactions, year, month) => {
  if (!Array.isArray(transactions)) {
    throw new Error('Transactions must be an array');
  }

  try {
    const calendar = generateCalendarMonth(year, month);
    const heatmapData = {};

    // Initialize all days with zero values
    calendar.days.forEach(day => {
      const dateKey = day.date.toISOString().split('T')[0];
      heatmapData[dateKey] = {
        date: day.date,
        transactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        transactionCount: 0,
        intensity: 0 // 0-100 scale for visualization
      };
    });

    // Process transactions and accumulate amounts
    transactions.forEach(transaction => {
      try {
        const transactionDate = new Date(transaction.date);
        const dateKey = transactionDate.toISOString().split('T')[0];
        
        if (heatmapData[dateKey]) {
          heatmapData[dateKey].transactions.push(transaction);
          heatmapData[dateKey].transactionCount++;
          
          if (transaction.amount > 0) {
            heatmapData[dateKey].totalIncome += transaction.amount;
          } else {
            heatmapData[dateKey].totalExpenses += Math.abs(transaction.amount);
          }
          
          heatmapData[dateKey].netAmount += transaction.amount;
        }
      } catch (error) {
        console.warn('Skipping invalid transaction:', transaction, error);
      }
    });

    // Calculate intensity for heatmap visualization
    const expenseValues = Object.values(heatmapData).map(day => day.totalExpenses);
    const maxExpense = Math.max(...expenseValues, 0); // Handle case with no expenses
    
    Object.values(heatmapData).forEach(day => {
      day.intensity = maxExpense > 0 
        ? Math.min(100, (day.totalExpenses / maxExpense) * 100)
        : 0;
    });

    return heatmapData;
  } catch (error) {
    console.error('Error generating heatmap data:', error);
    throw new Error(`Failed to generate heatmap: ${error.message}`);
  }
};

/**
 * Provides navigation information for moving between months
 * @param {number} currentYear - Current year
 * @param {number} currentMonth - Current month index (0-11)
 * @returns {Object} Navigation info for previous, current, and next months
 */
export const getMonthNavigation = (currentYear, currentMonth) => {
  try {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    return {
      previous: {
        year: prevYear,
        month: prevMonth,
        name: getMonthName(prevMonth)
      },
      current: {
        year: currentYear,
        month: currentMonth,
        name: getMonthName(currentMonth)
      },
      next: {
        year: nextYear,
        month: nextMonth,
        name: getMonthName(nextMonth)
      }
    };
  } catch (error) {
    console.error('Error generating month navigation:', error);
    throw new Error(`Failed to generate navigation: ${error.message}`);
  }
};

/**
 * Returns weekday headers for calendar display
 * @param {string} format - 'short' for abbreviated names, otherwise full names
 * @returns {string[]} Array of weekday names
 */
export const getWeekdayHeaders = (format = 'short') => {
  try {
    const weekdays = [];
    const getWeekdayFn = format === 'short' ? getShortWeekdayName : getWeekdayName;
    
    for (let i = 0; i < 7; i++) {
      weekdays.push(getWeekdayFn(i));
    }
    
    return weekdays;
  } catch (error) {
    console.error('Error getting weekday headers:', error);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Fallback
  }
};

/**
 * Generates financial periods (weeks, months, quarters) between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string} periodType - 'week', 'month', or 'quarter'
 * @returns {Array} Array of period objects with start, end, label, and key
 */
export const getFinancialPeriods = (startDate, endDate, periodType = 'month') => {
  try {
    const validPeriodTypes = ['week', 'month', 'quarter'];
    if (!validPeriodTypes.includes(periodType)) {
      throw new Error(`Invalid period type. Must be one of: ${validPeriodTypes.join(', ')}`);
    }

    const periods = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    if (current > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    while (current <= end) {
      let periodEnd;
      
      switch (periodType) {
        case 'week':
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 6);
          break;
        case 'month':
          periodEnd = getEndOfMonth(current);
          break;
        case 'quarter':
          periodEnd = new Date(current);
          periodEnd.setMonth(periodEnd.getMonth() + 3);
          periodEnd.setDate(0); // Last day of previous month
          break;
      }

      periods.push({
        start: new Date(current),
        end: periodEnd,
        label: getPeriodLabel(current, periodType),
        key: `${periodType}_${current.getFullYear()}_${current.getMonth()}`
      });

      // Move to next period start
      switch (periodType) {
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          current.setDate(1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          current.setDate(1);
          break;
      }
    }

    return periods;
  } catch (error) {
    console.error('Error generating financial periods:', error);
    throw new Error(`Failed to generate periods: ${error.message}`);
  }
};

/**
 * Helper function to generate period labels
 * @param {Date} date - The date
 * @param {string} periodType - Type of period
 * @returns {string} Formatted period label
 */
const getPeriodLabel = (date, periodType) => {
  try {
    switch (periodType) {
      case 'week':
        return `Week ${getWeekNumber(date)}`;
      case 'month':
        return getMonthName(date.getMonth());
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      default:
        return getMonthName(date.getMonth());
    }
  } catch (error) {
    console.error('Error generating period label:', error);
    return 'Unknown Period';
  }
};

/**
 * Calculates number of business days (Monday-Friday) between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Count of business days
 */
export const getBusinessDays = (startDate, endDate) => {
  try {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    if (current > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    while (current <= end) {
      const day = current.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  } catch (error) {
    console.error('Error calculating business days:', error);
    throw new Error(`Failed to calculate business days: ${error.message}`);
  }
};