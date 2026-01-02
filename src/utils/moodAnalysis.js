//moodAnalysis.js
// UI utilities for mood analysis - no business logic, pure display functions only

/**
 * Maps a numeric mood score to a descriptive label for UI display
 * @param {number} score - Mood score between 0-100
 * @returns {string} Mood label: 'excellent', 'good', 'neutral', 'poor', or 'terrible'
 * @throws {Error} If score is not a number or outside valid range
 */
export const getMoodLabel = (score) => {
  try {
    if (typeof score !== 'number' || isNaN(score)) {
      throw new Error('Mood score must be a valid number');
    }
    
    if (score < 0 || score > 100) {
      throw new Error('Mood score must be between 0 and 100');
    }
    
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'neutral';
    if (score >= 30) return 'poor';
    return 'terrible';
  } catch (error) {
    console.error('Error getting mood label:', error);
    return 'neutral'; // Safe fallback for UI
  }
};

/**
 * Returns an emoji corresponding to a mood label for visual representation
 * @param {string} moodLabel - Mood label from getMoodLabel()
 * @returns {string} Emoji character for the mood
 * @throws {Error} If moodLabel is not a valid string
 */
export const getMoodEmoji = (moodLabel) => {
  try {
    if (typeof moodLabel !== 'string') {
      throw new Error('Mood label must be a string');
    }
    
    const emojis = {
      'excellent': '😊',
      'good': '🙂',
      'neutral': '😐',
      'poor': '😕',
      'terrible': '😞'
    };
    
    return emojis[moodLabel.toLowerCase()] || '😐'; // Case-insensitive lookup
  } catch (error) {
    console.error('Error getting mood emoji:', error);
    return '😐'; // Neutral fallback
  }
};

/**
 * Returns a color code for a mood label for consistent UI theming
 * @param {string} moodLabel - Mood label from getMoodLabel()
 * @returns {string} Hex color code
 * @throws {Error} If moodLabel is not a valid string
 */
export const getMoodColor = (moodLabel) => {
  try {
    if (typeof moodLabel !== 'string') {
      throw new Error('Mood label must be a string');
    }
    
    const colors = {
      'excellent': '#10B981', // Green
      'good': '#34D399',      // Light Green
      'neutral': '#6B7280',   // Gray
      'poor': '#F59E0B',      // Yellow
      'terrible': '#EF4444'   // Red
    };
    
    return colors[moodLabel.toLowerCase()] || '#6B7280'; // Case-insensitive with gray fallback
  } catch (error) {
    console.error('Error getting mood color:', error);
    return '#6B7280'; // Neutral gray fallback
  }
};

/**
 * Formats a numeric mood score for consistent display across the UI
 * @param {number} score - Mood score between 0-100
 * @returns {string} Formatted score string (e.g., "85/100")
 * @throws {Error} If score is not a valid number
 */
export const formatMoodScore = (score) => {
  try {
    if (typeof score !== 'number' || isNaN(score)) {
      throw new Error('Score must be a valid number');
    }
    
    // Ensure score is an integer for display
    const roundedScore = Math.round(score);
    return `${Math.max(0, Math.min(100, roundedScore))}/100`; // Clamp to 0-100 range
  } catch (error) {
    console.error('Error formatting mood score:', error);
    return '0/100'; // Safe fallback
  }
};

/**
 * Maps a severity level to a corresponding color for consistent UI theming
 * @param {string} severity - Severity level: 'high', 'medium', 'low', 'positive', or 'info'
 * @returns {string} Hex color code for the severity
 * @throws {Error} If severity is not a valid string
 */
export const getSeverityColor = (severity) => {
  try {
    if (typeof severity !== 'string') {
      throw new Error('Severity must be a string');
    }
    
    const colors = {
      'high': '#EF4444',     // Red
      'medium': '#F59E0B',   // Yellow
      'low': '#3B82F6',      // Blue
      'positive': '#10B981', // Green
      'info': '#6B7280'      // Gray
    };
    
    return colors[severity.toLowerCase()] || '#6B7280'; // Case-insensitive with info fallback
  } catch (error) {
    console.error('Error getting severity color:', error);
    return '#6B7280'; // Info gray fallback
  }
};

/**
 * Formats a numeric amount as USD currency for display
 * @param {number} amount - Monetary amount to format
 * @returns {string} Formatted currency string (e.g., "$1,234.56")
 * @throws {Error} If amount is not a valid number
 */
export const formatCurrency = (amount) => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0.00'; // Safe fallback
  }
};

/**
 * Returns an arrow icon representing a trend direction for visual indicators
 * @param {string} trend - Trend description: 'improving', 'slightly improving', 'stable', 'slightly declining', or 'declining'
 * @returns {string} Arrow emoji representing the trend
 * @throws {Error} If trend is not a valid string
 */
export const getTrendIcon = (trend) => {
  try {
    if (typeof trend !== 'string') {
      throw new Error('Trend must be a string');
    }
    
    const icons = {
      'improving': '↗️',
      'slightly improving': '↗️',
      'stable': '→',
      'slightly declining': '↘️',
      'declining': '↘️'
    };
    
    return icons[trend.toLowerCase()] || '→'; // Case-insensitive with stable fallback
  } catch (error) {
    console.error('Error getting trend icon:', error);
    return '→'; // Stable fallback
  }
};

/**
 * Maps a numeric confidence level to a descriptive label for UI display
 * @param {number} confidence - Confidence percentage between 0-100
 * @returns {string} Descriptive confidence label
 * @throws {Error} If confidence is not a valid number
 */
export const formatConfidence = (confidence) => {
  try {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      throw new Error('Confidence must be a valid number');
    }
    
    const normalizedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));
    
    if (normalizedConfidence >= 80) return 'High';
    if (normalizedConfidence >= 60) return 'Medium-High';
    if (normalizedConfidence >= 40) return 'Medium';
    if (normalizedConfidence >= 20) return 'Low-Medium';
    return 'Low';
  } catch (error) {
    console.error('Error formatting confidence:', error);
    return 'Low'; // Conservative fallback
  }
};