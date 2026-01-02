import { api } from './api';

/**
 * Service for analyzing and managing transaction moods and emotional impact
 * of financial transactions using scoring algorithms and contextual analysis
 * @class
 */
class TransactionMoodService {
  /**
   * Analyzes the emotional impact of a single transaction
   * @param {Object} transaction - Transaction object with amount, category, etc.
   * @param {Object} context - Additional context like budget status, savings trends
   * @returns {Object} Mood analysis with score, category, and metadata
   */
  analyzeTransactionMood(transaction, context = {}) {
    const amount = Math.abs(transaction.amount);
    const isIncome = transaction.amount > 0;
    const category = transaction.category || 'Other';
    
    let moodScore = 50; // Neutral baseline
    let mood = 'neutral';
    let factors = [];

    // Analyze transaction amount impact
    if (isIncome) {
      if (amount > 1000) {
        moodScore += 25;
        factors.push('large income');
      } else if (amount > 100) {
        moodScore += 10;
        factors.push('moderate income');
      }
    } else {
      // Expense mood impact based on amount
      if (amount > 500) {
        moodScore -= 30;
        factors.push('large expense');
      } else if (amount > 100) {
        moodScore -= 15;
        factors.push('moderate expense');
      } else if (amount < 20) {
        moodScore += 5;
        factors.push('small expense');
      }

      // Apply category-specific mood impact
      const categoryImpact = this.getCategoryMoodImpact(category);
      moodScore += categoryImpact.score;
      if (categoryImpact.factor) {
        factors.push(categoryImpact.factor);
      }
    }

    // Apply contextual factors
    if (context.budgetStatus === 'under_budget') {
      moodScore += 10;
      factors.push('under budget');
    } else if (context.budgetStatus === 'over_budget') {
      moodScore -= 15;
      factors.push('over budget');
    }

    if (context.savingsTrend === 'increasing') {
      moodScore += 8;
      factors.push('savings increasing');
    } else if (context.savingsTrend === 'decreasing') {
      moodScore -= 12;
      factors.push('savings decreasing');
    }

    // Ensure score stays within 0-100 range
    moodScore = Math.max(0, Math.min(100, moodScore));

    // Map score to mood category
    if (moodScore >= 80) mood = 'excellent';
    else if (moodScore >= 65) mood = 'good';
    else if (moodScore >= 45) mood = 'neutral';
    else if (moodScore >= 30) mood = 'poor';
    else mood = 'terrible';

    return {
      score: Math.round(moodScore),
      mood,
      factors,
      emoji: this.getMoodEmoji(mood),
      color: this.getMoodColor(mood),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Returns mood impact score for transaction categories
   * @param {string} category - Transaction category
   * @returns {Object} Impact score and descriptive factor
   * @private
   */
  getCategoryMoodImpact(category) {
    const impacts = {
      'Dining': { score: -5, factor: 'dining out' },
      'Entertainment': { score: -3, factor: 'entertainment' },
      'Shopping': { score: -8, factor: 'shopping' },
      'Utilities': { score: -2, factor: 'bills' },
      'Healthcare': { score: -10, factor: 'healthcare' },
      'Education': { score: 5, factor: 'education investment' },
      'Savings': { score: 15, factor: 'savings' },
      'Investment': { score: 12, factor: 'investment' },
      'Groceries': { score: 0, factor: 'essential groceries' },
      'Transportation': { score: -2, factor: 'transportation' }
    };

    return impacts[category] || { score: 0, factor: null };
  }

  /**
   * Returns emoji representation for mood category
   * @param {string} mood - Mood category
   * @returns {string} Emoji character
   * @private
   */
  getMoodEmoji(mood) {
    const emojis = {
      'excellent': '😊',
      'good': '🙂',
      'neutral': '😐',
      'poor': '😕',
      'terrible': '😞'
    };
    return emojis[mood] || '😐';
  }

  /**
   * Returns color code for mood category
   * @param {string} mood - Mood category
   * @returns {string} Hex color code
   * @private
   */
  getMoodColor(mood) {
    const colors = {
      'excellent': '#10B981', // Green
      'good': '#34D399',      // Light Green
      'neutral': '#6B7280',   // Gray
      'poor': '#F59E0B',      // Yellow
      'terrible': '#EF4444'   // Red
    };
    return colors[mood] || '#6B7280';
  }

  /**
   * Analyzes overall financial mood for a specified time period
   * @param {Array} transactions - Array of transaction objects
   * @param {string} period - Time period ('week', 'month', 'quarter')
   * @returns {Object} Aggregated mood analysis
   */
  analyzeOverallMood(transactions, period = 'month') {
    if (!transactions || transactions.length === 0) {
      return this.getDefaultMood();
    }

    const recentTransactions = this.filterByPeriod(transactions, period);
    const moods = recentTransactions.map(transaction => 
      this.analyzeTransactionMood(transaction)
    );

    const averageScore = moods.reduce((sum, mood) => sum + mood.score, 0) / moods.length;
    const allFactors = [...new Set(moods.flatMap(mood => mood.factors))];

    // Determine overall mood from average score
    let overallMood = 'neutral';
    if (averageScore >= 75) overallMood = 'excellent';
    else if (averageScore >= 60) overallMood = 'good';
    else if (averageScore >= 40) overallMood = 'neutral';
    else if (averageScore >= 25) overallMood = 'poor';
    else overallMood = 'terrible';

    return {
      score: Math.round(averageScore),
      mood: overallMood,
      factors: allFactors.slice(0, 5), // Top 5 factors
      emoji: this.getMoodEmoji(overallMood),
      color: this.getMoodColor(overallMood),
      transactionCount: recentTransactions.length,
      analyzedPeriod: period,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Filters transactions by specified time period
   * @param {Array} transactions - Transaction array
   * @param {string} period - Time period to filter
   * @returns {Array} Filtered transactions
   * @private
   */
  filterByPeriod(transactions, period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    return transactions.filter(transaction => 
      new Date(transaction.date) >= startDate
    );
  }

  /**
   * Returns default mood analysis for empty transaction sets
   * @returns {Object} Default mood analysis
   * @private
   */
  getDefaultMood() {
    return {
      score: 50,
      mood: 'neutral',
      factors: ['no transaction data'],
      emoji: '😐',
      color: '#6B7280',
      transactionCount: 0,
      analyzedPeriod: 'month',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyzes mood trends across multiple time periods
   * @param {Array} transactions - Transaction history
   * @param {Array} periods - Array of time periods to analyze
   * @returns {Array} Mood analysis for each period
   */
  analyzeMoodTrends(transactions, periods = ['week', 'month', 'quarter']) {
    return periods.map(period => ({
      period,
      mood: this.analyzeOverallMood(transactions, period)
    }));
  }

  /**
   * Generates improvement suggestions based on mood analysis
   * @param {Object} moodAnalysis - Mood analysis result
   * @returns {Array} Personalized improvement suggestions
   */
  getMoodImprovementSuggestions(moodAnalysis) {
    const suggestions = [];

    if (moodAnalysis.score < 40) {
      suggestions.push(
        'Consider reviewing your recent large expenses',
        'Look for subscription services you can cancel',
        'Set up a weekly spending limit'
      );
    }

    if (moodAnalysis.factors.includes('dining out')) {
      suggestions.push('Try cooking at home more often to save on dining expenses');
    }

    if (moodAnalysis.factors.includes('shopping')) {
      suggestions.push('Implement a 24-hour waiting period before non-essential purchases');
    }

    if (moodAnalysis.score > 70) {
      suggestions.push(
        'Great job! Consider increasing your savings rate',
        'Your financial habits are excellent - keep it up!'
      );
    }

    return suggestions.length > 0 ? suggestions : [
      'Your financial mood is stable. Consider setting new financial goals!'
    ];
  }

  /**
   * Saves transaction mood analysis to backend
   * @param {string|number} transactionId - Transaction identifier
   * @param {Object} moodData - Mood analysis data
   * @returns {Promise<Object>} Saved mood record
   * @throws {Error} If API request fails
   */
  async saveTransactionMood(transactionId, moodData) {
    try {
      const response = await api.post('/transaction-mood', {
        transactionId,
        ...moodData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save transaction mood', error);
      throw error;
    }
  }

  /**
   * Retrieves transaction moods for specified period
   * @param {string} period - Time period to fetch moods for
   * @returns {Promise<Array>} Array of mood records
   * @throws {Error} If API request fails
   */
  async getTransactionMoods(period = 'month') {
    try {
      const response = await api.get(`/transaction-mood/analysis?timeframe=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch transaction moods', error);
      throw error;
    }
  }

  /**
   * Retrieves historical mood data
   * @param {number} days - Number of days of history to retrieve
   * @returns {Promise<Array>} Mood history records
   * @throws {Error} If API request fails
   */
  async getMoodHistory(days = 30) {
    try {
      const response = await api.get(`/transaction-mood/trends?groupBy=week`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch mood history', error);
      throw error;
    }
  }
}


export const transactionMoodService = new TransactionMoodService();
export default transactionMoodService;