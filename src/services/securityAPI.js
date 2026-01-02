// securityAPI.js
import api from './api';

/**
 * Security API service for handling security-related operations
 * including monitoring, alerts, and security event management
 * @namespace
 */
export const securityAPI = {
  /**
   * Retrieves security overview and summary statistics
   * @returns {Promise<Object>} Security overview data
   * @throws {Error} If API request fails
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
   * Retrieves login attempt history for specified timeframe
   * @param {number} days - Number of days to include in history (default: 30)
   * @returns {Promise<Array>} Login attempt records
   * @throws {Error} If API request fails
   */
  getLoginAttempts: async (days = 30) => {
    try {
      const response = await api.get(`/security/login-attempts?days=${days}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch login attempts for ${days} days`, error);
      throw error;
    }
  },

  /**
   * Retrieves transactions flagged as suspicious by security monitoring
   * @returns {Promise<Array>} Suspicious transaction records
   * @throws {Error} If API request fails
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
   * Updates user alert preferences for security notifications
   * @param {Object} preferences - Alert preference settings
   * @returns {Promise<Object>} Updated preferences confirmation
   * @throws {Error} If API request fails
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
   * Retrieves comprehensive security event logs
   * @returns {Promise<Array>} Security log entries
   * @throws {Error} If API request fails
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
   * Subscribes to real-time security alerts via WebSocket
   * @param {Function} callback - Function to handle incoming alerts
   * @returns {void}
   */
  subscribeToAlerts: (callback) => {
    // Placeholder for Socket.IO implementation
    console.error('Security alert subscription not implemented');
  }
};

export default securityAPI;