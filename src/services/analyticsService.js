// analyticsService.js
import api from './api.js';

/**
 * Service class for handling analytics-related API operations.
 * Provides methods to fetch various analytics data with enhanced error handling and logging.
 * @class
 */
export class AnalyticsService {
  /**
   * Fetches enhanced analytics data for a specified timeframe.
   * @param {string} timeframe - The timeframe for analytics ('daily', 'weekly', 'monthly', etc.).
   * @returns {Promise<Object>} The enhanced analytics data.
   * @throws {Error} If the API request fails.
   */
  static async getEnhancedAnalytics(timeframe = 'monthly') {
    try {
      const response = await api.get(`/analytics/enhanced?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch enhanced analytics for timeframe: ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Retrieves cash flow analysis data with specified granularity.
   * @param {string} granularity - The granularity level ('daily', 'weekly', 'monthly').
   * @returns {Promise<Object>} The cash flow analysis data.
   * @throws {Error} If the API request fails.
   */
  static async getCashFlowAnalysis(granularity = 'daily') {
    try {
      const response = await api.get(`/analytics/cash-flow?granularity=${granularity}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch cash flow analysis with granularity: ${granularity}`, error);
      throw error;
    }
  }

  /**
   * Fetches a breakdown of income by category or source.
   * @returns {Promise<Object>} The income breakdown data.
   * @throws {Error} If the API request fails.
   */
  static async getIncomeBreakdown() {
    try {
      const response = await api.get('/analytics/income-breakdown');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch income breakdown', error);
      throw error;
    }
  }

  /**
   * Retrieves a spending forecast for a specified number of days.
   * @param {number} days - The forecast period in days (default: 30).
   * @returns {Promise<Object>} The spending forecast data.
   * @throws {Error} If the API request fails.
   */
  static async getSpendingForecast(days = 30) {
    try {
      const response = await api.get(`/analytics/forecast?days=${days}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch spending forecast for ${days} days`, error);
      throw error;
    }
  }

  /**
   * Fetches contextual insights or recommendations based on analytics.
   * @returns {Promise<Object>} Contextual insights data.
   * @throws {Error} If the API request fails.
   */
  static async getContextualInsights() {
    try {
      const response = await api.get('/analytics/contextual-insights');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contextual insights', error);
      throw error;
    }
  }
}

// Export both the class and a singleton instance for convenience
export const analyticsService = AnalyticsService;