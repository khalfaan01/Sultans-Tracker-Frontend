// recurringService.js Frontend
import { api } from './api';

/**
 * Service for managing recurring transactions including CRUD operations,
 * pattern detection, and automated processing.
 * @class
 */
class RecurringService {
  /**
   * Retrieves all recurring transactions for the authenticated user
   * @returns {Promise<Array>} Array of recurring transaction objects
   * @throws {Error} If API request fails
   */
  async getRecurringTransactions() {
    try {
      const response = await api.get('/recurring-transactions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recurring transactions', error);
      
      // Fallback to mock data for development
      if (error.response?.status === 404) {
        return this.getMockRecurringTransactions();
      }
      
      throw error;
    }
  }

  /**
   * Creates a new recurring transaction record
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} Created recurring transaction
   * @throws {Error} If API request fails
   */
  async createRecurringTransaction(data) {
    let backendData;
    try {

      // Get token from localStorage
      const token = localStorage.getItem('token');

      // Calculate dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow

      const nextRunDate = this.calculateNextRunDate(data.frequency);

      const backendData = {
        
        accountId: parseInt(data.accountId) || 1,
        amount: parseFloat(data.amount),
        type: data.type,
        category: data.category || 'Uncategorized',
        description: data.description,
        frequency: data.frequency,
        interval: 1,
        startDate: startDate.toISOString(),  
        nextRunDate: nextRunDate.toISOString(),
        isActive: data.isActive !== undefined ? data.isActive : true,
        autoApprove: data.autoApprove || false
      };

       console.log('Sending recurring transaction data:', backendData); // Debug log

    const response = await api.post('/recurring-transactions', backendData);
    return response.data;
  } catch (error) {
    console.error('Failed to create recurring transaction', error);
  
    if (error.response) {
      console.error('Response error:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    // For debugging
    console.error('Request data that failed:', backendData || data);
    
    if (error.response?.status === 404) {
      return {
        id: Date.now(),
        ...data,
        nextRunDate: this.calculateNextRunDate(data.frequency).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    throw error;
  }
}

  /**
   * Updates an existing recurring transaction
   * @param {string|number} id - Transaction ID
   * @param {Object} data - Updated transaction data
   * @returns {Promise<Object>} Updated transaction
   * @throws {Error} If API request fails
   */
  async updateRecurringTransaction(id, data) {
    try {
      const backendData = {
        ...data,
        accountId: data.accountId ? parseInt(data.accountId) : undefined,
        amount: data.amount ? parseFloat(data.amount) : undefined
      };

      const response = await api.put(`/recurring-transactions/${id}`, backendData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update recurring transaction ${id}`, error);
      
      if (error.response?.status === 404) {
        return {
          id: parseInt(id),
          ...data,
          updatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }

  /**
   * Deletes a recurring transaction
   * @param {string|number} id - Transaction ID
   * @throws {Error} If API request fails
   */
  async deleteRecurringTransaction(id) {
    try {
      await api.delete(`/recurring-transactions/${id}`);
    } catch (error) {
      console.error(`Failed to delete recurring transaction ${id}`, error);
      
      if (error.response?.status === 404) {
        return;
      }
      
      throw error;
    }
  }

  /**
   * Toggles the active status of a recurring transaction
   * @param {string|number} id - Transaction ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} Updated transaction
   * @throws {Error} If API request fails
   */
  async toggleRecurringTransaction(id, isActive) {
    try {
      const response = await api.patch(`/recurring-transactions/${id}/toggle`, { isActive });
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle recurring transaction ${id}`, error);
      
      if (error.response?.status === 404) {
        return this.updateRecurringTransaction(id, { isActive });
      }
      
      throw error;
    }
  }

  /**
   * Processes all due recurring transactions
   * @returns {Promise<Object>} Processing results
   * @throws {Error} If API request fails
   */
  async processDueTransactions() {
    try {
      const response = await api.post('/recurring-transactions/process-due');
      return response.data;
    } catch (error) {
      console.error('Failed to process due transactions', error);
      throw error;
    }
  }

  /**
   * Analyzes transaction history to detect recurring patterns
   * @param {Array} transactions - Array of transaction objects
   * @returns {Array} Detected recurring patterns
   */
  detectRecurringTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const recurringPatterns = [];
    const groupedTransactions = this.groupTransactions(transactions);

    // Analyze each transaction group for recurrence patterns
    Object.values(groupedTransactions).forEach(group => {
      const pattern = this.analyzePattern(group);
      if (pattern.confidence > 0.7) {
        recurringPatterns.push(pattern);
      }
    });

    return recurringPatterns;
  }

  /**
   * Groups transactions by description and amount for pattern analysis
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Grouped transactions
   * @private
   */
  groupTransactions(transactions) {
    const groups = {};

    transactions.forEach(transaction => {
      const key = this.getTransactionKey(transaction);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });

    return groups;
  }

  /**
   * Creates a unique key for transaction grouping
   * @param {Object} transaction - Transaction object
   * @returns {string} Grouping key
   * @private
   */
  getTransactionKey(transaction) {
    const amount = Math.abs(transaction.amount).toFixed(2);
    const description = transaction.description?.toLowerCase().trim() || 'unknown';
    return `${description}_${amount}`;
  }

  /**
   * Analyzes a transaction group for recurring patterns
   * @param {Array} transactions - Grouped transaction array
   * @returns {Object} Pattern analysis result
   * @private
   */
  analyzePattern(transactions) {
    if (transactions.length < 2) {
      return { confidence: 0 };
    }

    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const intervals = this.calculateIntervals(sortedTransactions);
    const frequency = this.detectFrequency(intervals);
    const confidence = this.calculateConfidence(intervals, frequency);

    const latestTransaction = sortedTransactions[sortedTransactions.length - 1];
    const nextBillingDate = this.predictNextDate(latestTransaction.date, frequency);

    return {
      id: `detected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateSubscriptionName(latestTransaction.description),
      amount: Math.abs(latestTransaction.amount),
      frequency: frequency.type,
      category: latestTransaction.category,
      description: latestTransaction.description,
      lastTransaction: latestTransaction.date,
      nextBillingDate: nextBillingDate.toISOString(),
      transactionCount: transactions.length,
      confidence: confidence,
      status: 'detected',
      isActive: true,
      autoApprove: false
    };
  }

  /**
   * Calculates time intervals between sequential transactions
   * @param {Array} transactions - Chronologically sorted transactions
   * @returns {Array} Array of day intervals
   * @private
   */
  calculateIntervals(transactions) {
    const intervals = [];
    
    for (let i = 1; i < transactions.length; i++) {
      const prevDate = new Date(transactions[i - 1].date);
      const currentDate = new Date(transactions[i].date);
      const diffTime = Math.abs(currentDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    return intervals;
  }

  /**
   * Detects frequency pattern from interval data
   * @param {Array} intervals - Array of day intervals
   * @returns {Object} Frequency type and average interval
   * @private
   */
  detectFrequency(intervals) {
    if (intervals.length === 0) return { type: 'monthly', interval: 30 };
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Match interval ranges to common frequencies
    if (avgInterval >= 28 && avgInterval <= 31) {
      return { type: 'monthly', interval: avgInterval };
    } else if (avgInterval >= 84 && avgInterval <= 93) {
      return { type: 'quarterly', interval: avgInterval };
    } else if (avgInterval >= 350 && avgInterval <= 370) {
      return { type: 'yearly', interval: avgInterval };
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      return { type: 'weekly', interval: avgInterval };
    } else if (avgInterval >= 1 && avgInterval <= 2) {
      return { type: 'daily', interval: avgInterval };
    } else {
      return { type: 'custom', interval: avgInterval };
    }
  }

  /**
   * Calculates confidence score (0-1) for detected pattern
   * @param {Array} intervals - Time intervals between transactions
   * @param {Object} frequency - Detected frequency pattern
   * @returns {number} Confidence score
   * @private
   */
  calculateConfidence(intervals, frequency) {
    if (intervals.length < 2) return 0;

    const variance = intervals.reduce((acc, interval) => {
      return acc + Math.pow(interval - frequency.interval, 2);
    }, 0) / intervals.length;

    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (stdDev / frequency.interval));
    const countFactor = Math.min(1, intervals.length / 6);

    return (consistency * 0.7) + (countFactor * 0.3);
  }

  /**
   * Predicts the next occurrence date based on frequency
   * @param {string} lastDate - ISO string of last occurrence
   * @param {Object} frequency - Frequency pattern object
   * @returns {Date} Predicted next date
   * @private
   */
  predictNextDate(lastDate, frequency) {
    const date = new Date(lastDate);
    
    switch (frequency.type) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setDate(date.getDate() + Math.round(frequency.interval));
    }

    return date;
  }

  /**
   * Calculates next run date for new recurring transaction
   * @param {string} frequency - Frequency string (daily, weekly, monthly, etc.)
   * @returns {Date} Next run date
   * @private
   */
  calculateNextRunDate(frequency) {
    const nextDate = new Date();
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }

  /**
   * Generates user-friendly subscription name from description
   * @param {string} description - Original transaction description
   * @returns {string} Formatted subscription name
   * @private
   */
  generateSubscriptionName(description) {
    if (!description) return 'Unknown Subscription';
    
    const commonServices = {
      'netflix': 'Netflix',
      'spotify': 'Spotify',
      'amazon prime': 'Amazon Prime',
      'youtube premium': 'YouTube Premium',
      'microsoft': 'Microsoft 365',
      'adobe': 'Adobe Creative Cloud',
      'apple': 'Apple Services',
      'google': 'Google Services',
      'disney': 'Disney+',
      'hbo': 'HBO Max',
      'hulu': 'Hulu',
      'electric': 'Electricity Bill',
      'water': 'Water Bill',
      'gas': 'Gas Bill',
      'internet': 'Internet Bill',
      'phone': 'Phone Bill',
      'rent': 'Rent',
      'mortgage': 'Mortgage',
      'insurance': 'Insurance',
      'gym': 'Gym Membership'
    };

    const lowerDesc = description.toLowerCase();
    
    for (const [key, value] of Object.entries(commonServices)) {
      if (lowerDesc.includes(key)) {
        return value;
      }
    }

    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Analyzes transactions and saves detected recurring patterns
   * @param {Array} transactions - Transaction history
   * @returns {Promise<Array>} Successfully saved patterns
   * @throws {Error} If analysis or save fails
   */
  async analyzeAndSaveRecurring(transactions) {
    try {
      const detected = this.detectRecurringTransactions(transactions);
      const saved = [];

      for (const pattern of detected) {
        if (pattern.confidence > 0.7) {
          try {
            const savedPattern = await this.createRecurringTransaction(pattern);
            saved.push(savedPattern);
          } catch (error) {
            console.error('Failed to save detected pattern', error);
          }
        }
      }

      return saved;
    } catch (error) {
      console.error('Failed to analyze and save recurring transactions', error);
      throw error;
    }
  }

  /**
   * Provides mock data for development when backend is unavailable
   * @returns {Array} Mock recurring transactions
   * @private
   */
  getMockRecurringTransactions() {
    return [
      {
        id: 1,
        description: 'Netflix Subscription',
        amount: 15.99,
        type: 'expense',
        category: 'Entertainment',
        frequency: 'monthly',
        nextRunDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        autoApprove: true,
        accountId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        description: 'Monthly Salary',
        amount: 3000,
        type: 'income',
        category: 'Salary',
        frequency: 'monthly',
        nextRunDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        autoApprove: true,
        accountId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        description: 'Gym Membership',
        amount: 29.99,
        type: 'expense',
        category: 'Health & Fitness',
        frequency: 'monthly',
        nextRunDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        autoApprove: false,
        accountId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export const recurringService = new RecurringService();
export default recurringService;