// api.js
import axios from 'axios';

/** Base URL for the API */
const API_BASE_URL = 'http://localhost:5000/api';

/** 
 * Axios instance with base configuration
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Token refresh state management */
let isRefreshing = false;
/** Queue for failed requests during token refresh */
let failedQueue = [];

/**
 * Processes the queue of failed requests after token refresh
 * @param {Error|null} error - Error if refresh failed, null if successful
 * @param {string|null} token - New access token if refresh successful
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (403 with specific error)
    if (error.response?.status === 403 && 
        error.response?.data?.error === 'Token expired' && 
        !originalRequest._retry) {
      
      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt token refresh
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const newAccessToken = response.data.accessToken;
        
        // Update stored token and axios defaults
        localStorage.setItem('token', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Process queued requests with new token
        processQueue(null, newAccessToken);
        
        // Retry original request
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Authentication API methods
 * @namespace
 */
export const authAPI = {
  /**
   * Authenticates user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication response data
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },

  /**
   * Registers a new user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Registration response data
   */
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  },
};

/**
 * Transactions API methods
 * @namespace
 */
export const transactionsAPI = {
  /**
   * Retrieves all transactions
   * @returns {Promise<Array>} Array of transactions
   */
  getAll: async () => {
    try {
      const response = await api.get('/transactions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      throw error;
    }
  },

  /**
   * Creates a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  create: async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create transaction', error);
      throw error;
    }
  },

  /**
   * Updates an existing transaction
   * @param {string|number} id - Transaction ID
   * @param {Object} transactionData - Updated transaction data
   * @returns {Promise<Object>} Updated transaction
   */
  update: async (id, transactionData) => {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update transaction ${id}`, error);
      throw error;
    }
  },

  /**
   * Deletes a transaction
   * @param {string|number} id - Transaction ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete transaction ${id}`, error);
      throw error;
    }
  },
};

/**
 * Accounts API methods
 * @namespace
 */
export const accountsAPI = {
  /**
   * Retrieves all accounts
   * @returns {Promise<Array>} Array of accounts
   */
  getAll: async () => {
    try {
      const response = await api.get('/accounts');
      return response.data;
    } catch (error) {
      // Fallback for missing endpoint
      if (error.response?.status === 404) {
        return [{ id: 1, name: "Main Account", balance: 0 }];
      }
      console.error('Failed to fetch accounts', error);
      throw error;
    }
  },

  /**
   * Creates a new account
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created account
   */
  create: async (accountData) => {
    try {
      const response = await api.post('/accounts', accountData);
      return response.data;
    } catch (error) {
      // Fallback for missing endpoint
      if (error.response?.status === 404) {
        return { id: 1, ...accountData };
      }
      console.error('Failed to create account', error);
      throw error;
    }
  },
};

/**
 * Budgets API methods
 * @namespace
 */
export const budgetsAPI = {
  /**
   * Retrieves all budgets
   * @returns {Promise<Array>} Array of budgets
   */
  getAll: async () => {
    try {
      const response = await api.get('/budgets');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch budgets', error);
      throw error;
    }
  },

  /**
   * Creates a new budget
   * @param {Object} budgetData - Budget data
   * @returns {Promise<Object>} Created budget
   */
  create: async (budgetData) => {
    try {
      const response = await api.post('/budgets', budgetData);
      return response.data;
    } catch (error) {
      console.error('Failed to create budget', error);
      throw error;
    }
  },

  /**
   * Updates an existing budget
   * @param {string|number} id - Budget ID
   * @param {Object} budgetData - Updated budget data
   * @returns {Promise<Object>} Updated budget
   */
  update: async (id, budgetData) => {
    try {
      const response = await api.put(`/budgets/${id}`, budgetData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update budget ${id}`, error);
      throw error;
    }
  },

  /**
   * Deletes a budget
   * @param {string|number} id - Budget ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete budget ${id}`, error);
      throw error;
    }
  },

  /**
   * Calculates rollover for a budget
   * @param {string|number} id - Budget ID
   * @returns {Promise<Object>} Rollover calculation result
   */
  calculateRollover: async (id) => {
    try {
      const response = await api.post(`/budgets/${id}/calculate-rollover`);
      return response.data;
    } catch (error) {
      console.error(`Failed to calculate rollover for budget ${id}`, error);
      throw error;
    }
  },
};

/**
 * Goals API methods
 * @namespace
 */
export const goalsAPI = {
  /**
   * Retrieves all goals
   * @returns {Promise<Array>} Array of goals
   */
  getAll: async () => {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch goals', error);
      throw error;
    }
  },

  /**
   * Creates a new goal
   * @param {Object} goalData - Goal data
   * @returns {Promise<Object>} Created goal
   */
  create: async (goalData) => {
    try {
      const response = await api.post('/goals', goalData);
      return response.data;
    } catch (error) {
      console.error('Failed to create goal', error);
      throw error;
    }
  },

  /**
   * Updates an existing goal
   * @param {string|number} id - Goal ID
   * @param {Object} goalData - Updated goal data
   * @returns {Promise<Object>} Updated goal
   */
  update: async (id, goalData) => {
    try {
      const response = await api.put(`/goals/${id}`, goalData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update goal ${id}`, error);
      throw error;
    }
  },

  /**
   * Deletes a goal
   * @param {string|number} id - Goal ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/goals/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete goal ${id}`, error);
      throw error;
    }
  },

  /**
   * Makes a contribution to a goal
   * @param {string|number} id - Goal ID
   * @param {Object} contributionData - Contribution data
   * @returns {Promise<Object>} Contribution result
   */
  contribute: async (id, contributionData) => {
    try {
      const response = await api.post(`/goals/${id}/contribute`, contributionData);
      return response.data;
    } catch (error) {
      console.error(`Failed to contribute to goal ${id}`, error);
      throw error;
    }
  },

  /**
   * Automatically allocates funds to goals
   * @param {Object} allocationData - Allocation data
   * @returns {Promise<Object>} Allocation result
   */
  autoAllocate: async (allocationData) => {
    try {
      const response = await api.post('/goals/auto-allocate', allocationData);
      return response.data;
    } catch (error) {
      console.error('Failed to auto-allocate goals', error);
      throw error;
    }
  },
};

/**
 * Security API methods
 * @namespace
 */
export const securityAPI = {
  /**
   * Retrieves security overview
   * @returns {Promise<Object>} Security overview data
   */
  getSecurityOverview: async () => {
    try {
      const response = await api.get('/security/overview');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security overview', error);
      throw error;
    }
  },

  /**
   * Retrieves login attempts
   * @param {number} days - Number of days to include
   * @returns {Promise<Array>} Login attempts data
   */
  getLoginAttempts: async (days = 30) => {
    try {
      const response = await api.get(`/security/login-attempts?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch login attempts', error);
      throw error;
    }
  },

  /**
   * Retrieves suspicious transactions
   * @returns {Promise<Array>} Suspicious transactions
   */
  getSuspiciousTransactions: async () => {
    try {
      const response = await api.get('/security/suspicious-transactions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch suspicious transactions', error);
      throw error;
    }
  },

  /**
   * Updates alert preferences
   * @param {Object} preferences - Alert preference settings
   * @returns {Promise<Object>} Update confirmation
   */
  updateAlertPreferences: async (preferences) => {
    try {
      const response = await api.post('/security/alert-preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update alert preferences', error);
      throw error;
    }
  },

  /**
   * Retrieves security logs
   * @returns {Promise<Array>} Security logs
   */
  getSecurityLogs: async () => {
    try {
      const response = await api.get('/security/logs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch security logs', error);
      throw error;
    }
  },

  /**
   * Monitors a transaction for suspicious activity
   * @param {Object} transactionData - Transaction data to monitor
   * @returns {Promise<Object>} Monitoring result
   */
  monitorTransaction: async (transactionData) => {
    try {
      const response = await api.post('/security/monitor-transaction', transactionData);
      return response.data;
    } catch (error) {
      console.error('Failed to monitor transaction', error);
      throw error;
    }
  }
};

/**
 * Transaction Moods API methods
 * @namespace
 */
export const transactionMoodsAPI = {
  /**
   * Adds a mood to a transaction
   * @param {Object} moodData - Mood data including transactionId, mood, intensity, notes
   * @returns {Promise<Object>} Created mood
   */
  addMood: async (moodData) => {
    try {
      const response = await api.post('/transaction-mood', moodData);
      return response.data;
    } catch (error) {
      console.error('Failed to add transaction mood', error);
      throw error;
    }
  },

  /**
   * Updates an existing mood
   * @param {string|number} id - Mood ID
   * @param {Object} moodData - Updated mood data
   * @returns {Promise<Object>} Updated mood
   */
  updateMood: async (id, moodData) => {
    try {
      const response = await api.put(`/transaction-mood/${id}`, moodData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update mood ${id}`, error);
      throw error;
    }
  },

  /**
   * Retrieves all moods for the current user
   * @returns {Promise<Array>} Array of mood objects
   */
  getAllMoods: async () => {
    try {
      const response = await api.get('/transaction-mood');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all moods', error);
      throw error;
    }
  },

  /**
   * Retrieves mood analysis
   * @returns {Promise<Object>} Mood analysis data
   */
  getMoodAnalysis: async () => {
    try {
      const response = await api.get('/transaction-mood/analysis');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch mood analysis', error);
      throw error;
    }
  },

  /**
   * Retrieves mood for a specific transaction
   * @param {string|number} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction mood data
   */
  getMoodByTransaction: async (transactionId) => {
    try {
      const response = await api.get(`/transaction-mood/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      // Return null instead of throwing for 404 errors
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Failed to fetch mood for transaction ${transactionId}`, error);
      throw error;
    }
  },

  /**
   * Deletes a mood record
   * @param {string|number} moodId - Mood record ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteMood: async (moodId) => {
    try {
      const response = await api.delete(`/transaction-mood/${moodId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete mood', error);
      throw error;
    }
  }
};

/**
 * Recurring Transactions API methods
 * @namespace
 */
export const recurringTransactionsAPI = {
  /**
   * Retrieves all recurring transactions
   * @returns {Promise<Array>} Array of recurring transactions
   */
  getAll: async () => {
    try {
      const response = await api.get('/recurring-transactions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recurring transactions', error);
      throw error;
    }
  },

  /**
   * Creates a new recurring transaction
   * @param {Object} recurringData - Recurring transaction data
   * @returns {Promise<Object>} Created recurring transaction
   */
  create: async (recurringData) => {
    try {
      const response = await api.post('/recurring-transactions', recurringData);
      return response.data;
    } catch (error) {
      console.error('Failed to create recurring transaction', error);
      throw error;
    }
  },

  /**
   * Processes due recurring transactions
   * @returns {Promise<Object>} Processing result
   */
  processDue: async () => {
    try {
      const response = await api.post('/recurring-transactions/process-due');
      return response.data;
    } catch (error) {
      console.error('Failed to process due transactions', error);
      throw error;
    }
  }
};

/**
 * Analytics API methods
 * @namespace
 */
export const analyticsAPI = {
  /**
   * Retrieves analytics overview
   * @returns {Promise<Object>} Analytics overview data
   */
  getOverview: async () => {
    try {
      const response = await api.get('/analytics/overview');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics overview', error);
      throw error;
    }
  },
  
  /**
   * Retrieves enhanced analytics
   * @param {string} timeframe - Timeframe for analytics
   * @returns {Promise<Object>} Enhanced analytics data
   */
  getEnhanced: async (timeframe = 'monthly') => {
    try {
      const response = await api.get(`/analytics/enhanced?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch enhanced analytics', error);
      throw error;
    }
  },
  
  /**
   * Retrieves cash flow analysis
   * @param {string} granularity - Granularity level
   * @returns {Promise<Object>} Cash flow data
   */
  getCashFlow: async (granularity = 'daily') => {
    try {
      const response = await api.get(`/analytics/cash-flow?granularity=${granularity}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cash flow analysis', error);
      throw error;
    }
  },
  
  /**
   * Retrieves income breakdown
   * @returns {Promise<Object>} Income breakdown data
   */
  getIncomeBreakdown: async () => {
    try {
      const response = await api.get('/analytics/income-breakdown');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch income breakdown', error);
      throw error;
    }
  },
  
  /**
   * Retrieves spending forecast
   * @param {number} days - Forecast period in days
   * @returns {Promise<Object>} Spending forecast data
   */
  getForecast: async (days = 30) => {
    try {
      const response = await api.get(`/analytics/forecast?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch spending forecast', error);
      throw error;
    }
  },
  
  /**
   * Retrieves contextual insights
   * @returns {Promise<Object>} Contextual insights data
   */
  getContextualInsights: async () => {
    try {
      const response = await api.get('/analytics/contextual-insights');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contextual insights', error);
      throw error;
    }
  }
};

/**
 * Debt API methods
 * @namespace
 */
export const debtAPI = {
  /**
   * Retrieves all debts
   * @returns {Promise<Array>} Array of debts
   */
  getAll: async () => {
    try {
      const response = await api.get('/debts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch debts', error);
      throw error;
    }
  },

  /**
   * Retrieves debt analytics
   * @returns {Promise<Object>} Debt analytics data
   */
  getAnalytics: async () => {
    try {
      const response = await api.get('/debts/analytics/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch debt analytics', error);
      throw error;
    }
  },

  /**
   * Creates a new debt
   * @param {Object} debtData - Debt data
   * @returns {Promise<Object>} Created debt
   */
  create: async (debtData) => {
    try {
      const response = await api.post('/debts', debtData);
      return response.data;
    } catch (error) {
      console.error('Failed to create debt', error);
      throw error;
    }
  },

  /**
   * Updates an existing debt
   * @param {string|number} id - Debt ID
   * @param {Object} debtData - Updated debt data
   * @returns {Promise<Object>} Updated debt
   */
  update: async (id, debtData) => {
    try {
      const response = await api.put(`/debts/${id}`, debtData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update debt ${id}`, error);
      throw error;
    }
  },

  /**
   * Deletes a debt
   * @param {string|number} id - Debt ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/debts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete debt ${id}`, error);
      throw error;
    }
  },

  /**
   * Makes a payment on a debt
   * @param {string|number} id - Debt ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment confirmation
   */
  makePayment: async (id, paymentData) => {
    try {
      const response = await api.post(`/debts/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Failed to make payment on debt ${id}`, error);
      throw error;
    }
  },

  /**
   * Applies snowball debt repayment method
   * @returns {Promise<Object>} Repayment strategy
   */
  applySnowballMethod: async () => {
    try {
      const response = await api.get('/debts/analytics/strategies');
      return response.data;
    } catch (error) {
      console.error('Failed to apply snowball method', error);
      throw error;
    }
  },

  /**
   * Applies avalanche debt repayment method
   * @returns {Promise<Object>} Repayment strategy
   */
  applyAvalancheMethod: async () => {
    try {
      const response = await api.get('/debts/analytics/strategies');
      return response.data;
    } catch (error) {
      console.error('Failed to apply avalanche method', error);
      throw error;
    }
  }
};

export default api;
export {api}
/** @deprecated Use transactionMoodsAPI instead */
export const transactionMoodAPI = transactionMoodsAPI;