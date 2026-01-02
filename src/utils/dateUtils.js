//dateUtils.js
// Date formatting and manipulation utilities

/**
 * Formats a date according to the specified format
 * @param {Date|string} date - The date to format
 * @param {string} format - Format type: 'short', 'long', 'month-year', 'iso', 'standard'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'standard') => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'month-year':
        return dateObj.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      case 'iso':
        return dateObj.toISOString().split('T')[0];
      case 'standard':
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a currency amount with proper localization
 * @param {number} amount - The amount to format
 * @param {string} currency - ISO currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Invalid amount provided');
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0.00';
  }
};

/**
 * Converts a date to a human-readable relative time string
 * @param {Date|string} date - The date to compare
 * @returns {string} Relative time description
 */
export const getRelativeTime = (date) => {
  try {
    const now = new Date();
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    const diffTime = now - targetDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return 'Unknown time';
  }
};

/**
 * Checks if two dates fall on the same calendar day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    console.error('Error checking same day:', error);
    return false;
  }
};

/**
 * Checks if a date is today
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Checks if a date is yesterday
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date, yesterday);
  } catch (error) {
    console.error('Error checking yesterday:', error);
    return false;
  }
};

/**
 * Gets the start of the month for a given date
 * @param {Date} [date=new Date()] - The reference date
 * @returns {Date} Start of month (1st day, 00:00:00)
 */
export const getStartOfMonth = (date = new Date()) => {
  try {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  } catch (error) {
    console.error('Error getting start of month:', error);
    return new Date();
  }
};

/**
 * Gets the end of the month for a given date
 * @param {Date} [date=new Date()] - The reference date
 * @returns {Date} End of month (last day, 23:59:59.999)
 */
export const getEndOfMonth = (date = new Date()) => {
  try {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1);
    result.setDate(0); // Setting to 0 gives last day of previous month
    result.setHours(23, 59, 59, 999);
    return result;
  } catch (error) {
    console.error('Error getting end of month:', error);
    return new Date();
  }
};

/**
 * Calculates number of days in a given month
 * @param {number} year - The year
 * @param {number} month - Month index (0-11)
 * @returns {number} Number of days in month
 */
export const getDaysInMonth = (year, month) => {
  try {
    if (typeof year !== 'number' || typeof month !== 'number' || month < 0 || month > 11) {
      throw new Error('Invalid year or month parameters');
    }
    // Create date for 0th day of next month, which gives last day of current month
    return new Date(year, month + 1, 0).getDate();
  } catch (error) {
    console.error('Error getting days in month:', error);
    return 30; // Safe default
  }
};

/**
 * Adds specified number of days to a date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date with days added
 */
export const addDays = (date, days) => {
  try {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  } catch (error) {
    console.error('Error adding days:', error);
    return new Date(date);
  }
};

/**
 * Adds specified number of months to a date
 * @param {Date} date - Base date
 * @param {number} months - Number of months to add (can be negative)
 * @returns {Date} New date with months added
 */
export const addMonths = (date, months) => {
  try {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  } catch (error) {
    console.error('Error adding months:', error);
    return new Date(date);
  }
};

/**
 * Gets full month name from month index
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Full month name
 */
export const getMonthName = (monthIndex) => {
  try {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error('Month index must be between 0 and 11');
    }
    return months[monthIndex];
  } catch (error) {
    console.error('Error getting month name:', error);
    return 'Unknown';
  }
};

/**
 * Gets abbreviated month name from month index
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Short month name (3 letters)
 */
export const getShortMonthName = (monthIndex) => {
  try {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error('Month index must be between 0 and 11');
    }
    return months[monthIndex];
  } catch (error) {
    console.error('Error getting short month name:', error);
    return 'N/A';
  }
};

/**
 * Gets full weekday name from day index
 * @param {number} dayIndex - Day index (0-6, Sunday=0)
 * @returns {string} Full weekday name
 */
export const getWeekdayName = (dayIndex) => {
  try {
    const weekdays = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    if (dayIndex < 0 || dayIndex > 6) {
      throw new Error('Day index must be between 0 and 6');
    }
    return weekdays[dayIndex];
  } catch (error) {
    console.error('Error getting weekday name:', error);
    return 'Unknown';
  }
};

/**
 * Gets abbreviated weekday name from day index
 * @param {number} dayIndex - Day index (0-6, Sunday=0)
 * @returns {string} Short weekday name (3 letters)
 */
export const getShortWeekdayName = (dayIndex) => {
  try {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (dayIndex < 0 || dayIndex > 6) {
      throw new Error('Day index must be between 0 and 6');
    }
    return weekdays[dayIndex];
  } catch (error) {
    console.error('Error getting short weekday name:', error);
    return 'N/A';
  }
};

/**
 * Calculates difference between two dates in specified units
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @param {string} unit - Time unit: 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks'
 * @returns {number} Difference in specified units
 */
export const dateDiff = (date1, date2, unit = 'days') => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    const diffTime = Math.abs(d2 - d1);

    switch (unit) {
      case 'milliseconds':
        return diffTime;
      case 'seconds':
        return Math.floor(diffTime / 1000);
      case 'minutes':
        return Math.floor(diffTime / (1000 * 60));
      case 'hours':
        return Math.floor(diffTime / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      default:
        return diffTime;
    }
  } catch (error) {
    console.error('Error calculating date difference:', error);
    return 0;
  }
};

/**
 * Checks if a date falls within a specified range (inclusive)
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Range start
 * @param {Date|string} endDate - Range end
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
  try {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    return d >= start && d <= end;
  } catch (error) {
    console.error('Error checking date range:', error);
    return false;
  }
};

/**
 * Generates an array of dates between start and end dates (inclusive)
 * @param {Date|string} startDate - Range start date
 * @param {Date|string} endDate - Range end date
 * @returns {Date[]} Array of dates in range
 */
export const generateDateRange = (startDate, endDate) => {
  try {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(current.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    if (current > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  } catch (error) {
    console.error('Error generating date range:', error);
    return [];
  }
};