// TransactionMoodTracker.jsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTransactionMood } from '../../contexts/TransactionMoodContext';
import { 
  Smile, Frown, Meh, Zap, Heart, Clock, AlertCircle, TrendingUp,
  Edit2, RefreshCw, X, Save, Loader2
} from 'lucide-react';

// Mood configuration with visual properties
const moodOptions = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { value: 'stressed', label: 'Stressed', icon: Frown, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { value: 'bored', label: 'Bored', icon: Meh, color: 'text-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { value: 'impulsive', label: 'Impulsive', icon: Zap, color: 'text-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { value: 'planned', label: 'Planned', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { value: 'anxious', label: 'Anxious', icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { value: 'excited', label: 'Excited', icon: TrendingUp, color: 'text-pink-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { value: 'regretful', label: 'Regretful', icon: Heart, color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
];

// Mood intensity descriptions
const intensityDescriptions = {
  1: 'Very Mild',
  2: 'Mild',
  3: 'Slight',
  4: 'Moderate',
  5: 'Neutral',
  6: 'Noticeable',
  7: 'Strong',
  8: 'Very Strong',
  9: 'Intense',
  10: 'Extreme'
};

export default function TransactionMoodTracker({ 
  transaction, 
  onMoodAdded, 
  onMoodUpdated, 
  onMoodDeleted,
  compact = false,
  readOnly = false
}) {
  // State
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Refs
  const modalRef = useRef(null);
  const isLoadingRef = useRef(false);
  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  // Context
  const { 
    addTransactionMood, 
    getCurrentTransactionMood,
    updateMoodEntry,
    deleteMoodEntry,
    loading: contextLoading,
    error: contextError,
    clearError
  } = useTransactionMood(); 
  
  // Get current mood from context (fast, uses moodMap)
  const currentMood = getCurrentTransactionMood(transaction?.id?.toString());

  // Get mood configuration for current mood
  const getMoodConfig = (moodValue) => {
    return moodOptions.find(m => m.value === moodValue) || {
      label: 'Unknown',
      icon: Smile,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const moodConfig = currentMood ? getMoodConfig(currentMood.mood) : null;

  // Reset form state
  const handleCancel = useCallback(() => {
    setShowMoodSelector(false);
    setSelectedMood(null);
    setIntensity(5);
    setNotes('');
    setError(null);
    setIsEditing(false);
    // Clear any cached mood data for this transaction
    if (contextError) clearError();
  }, [contextError, clearError]);

  // Clear success/error messages after timeout
  useEffect(() => {
    if (successMessage) {
      successTimerRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
    
    if (error) {
      errorTimerRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
    
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [successMessage, error]);

  useEffect(() => {
    if (isEditing && !currentMood) {
      handleCancel();
    }
  }, [currentMood, isEditing]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    if (showMoodSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showMoodSelector, handleCancel]);

  // Handle escape key to close modal
  const handleEscapeKey = useCallback((event) => {
    if (event.key === 'Escape' && showMoodSelector) {
      handleCancel();
    }
  }, [showMoodSelector, handleCancel]);

  // Initialize form with current mood data when editing
  useEffect(() => {
    if (isEditing && currentMood) {
      const moodOption = moodOptions.find(m => m.value === currentMood.mood);
      setSelectedMood(moodOption || null);
      setIntensity(currentMood.intensity || 5);
      setNotes(currentMood.notes || '');
    }
  }, [isEditing, currentMood]);

  // Handle mood selection and submission
  const handleMoodSelect = useCallback(async (mood) => {
    if (!transaction?.id) {
      setError('Invalid transaction ID');
      return;
    }

    if (isLoadingRef.current || contextLoading) {
      return;
    }

    try {
      setError(null);
      isLoadingRef.current = true;

      const moodData = {
        mood: mood.value,
        intensity: Math.max(1, Math.min(10, intensity)),
        notes: notes.trim() || null
      };

      let result;
      
      if (isEditing && currentMood) {
        // Update existing mood
        result = await updateMoodEntry(currentMood.id, moodData);
        if (result?.success) {
          setSuccessMessage('Mood updated successfully!');
          if (onMoodUpdated) onMoodUpdated(result.data);
        }
      } else {
        // Create new mood
        result = await addTransactionMood(transaction.id, moodData);
        if (result?.success) {
          setSuccessMessage('Mood tracked successfully!');
          if (onMoodAdded) onMoodAdded(result.data);
        }
      }

      if (result?.success) {
        handleCancel();
      } else {
        throw new Error(result?.error || 'Failed to save mood');
      }
    } catch (err) {
      console.error('Error handling mood:', err);
      setError(err.message || 'Failed to save mood. Please try again.');
    } finally {
      isLoadingRef.current = false;
    }
  }, [
    transaction?.id, 
    intensity, 
    notes, 
    addTransactionMood, 
    updateMoodEntry, 
    onMoodAdded, 
    onMoodUpdated,
    contextLoading,
    isEditing,
    currentMood,
    handleCancel
  ]);

  // Handle mood deletion
  const handleDeleteMood = useCallback(async () => {
    if (!currentMood?.id) {
      console.warn('No mood to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this mood?')) {
      return;
    }

    try {
      const result = await deleteMoodEntry(currentMood.id);
      if (result?.success) {
        setSuccessMessage('Mood deleted successfully!');
        if (onMoodDeleted) onMoodDeleted(currentMood.id);
        // Force a refresh of the current mood data
        handleCancel();
      } else {
        throw new Error(result?.error || 'Failed to delete mood');
      }
    } catch (err) {
      console.error('Error deleting mood:', err);
      // If 404, the mood was already deleted
      if (err.response?.status === 404 || err.message?.includes('404')) {
        setError('This mood was already deleted');
        // Force a refresh by calling onMoodDeleted even though it might not exist
        if (onMoodDeleted) onMoodDeleted(currentMood.id);
        handleCancel(); // Close the modal
      } else {
        setError(err.message || 'Failed to delete mood. Please try again.');
      }
    }
  }, [currentMood, deleteMoodEntry, onMoodDeleted, handleCancel]);

  // Start editing mode
  const handleEdit = useCallback(() => {
    if (!currentMood) {
      console.warn('No mood to edit');
      return;
    }
    
    // Double-check the mood still exists
    if (!currentMood.id || !currentMood.mood) {
      setError('Cannot edit: Mood data is incomplete');
      return;
    }
    
    setIsEditing(true);
    setShowMoodSelector(true);
  }, [currentMood]);

  // Start adding new mood
  const handleAddMood = useCallback(() => {
    setIsEditing(false);
    setSelectedMood(null);
    setIntensity(5);
    setNotes('');
    setShowMoodSelector(true);
  }, []);

  // Validate transaction data
  if (!transaction || typeof transaction !== 'object') {
    console.warn('Invalid transaction provided to TransactionMoodTracker');
    return null;
  }

  // Handle loading state
  if (contextLoading && !currentMood && !showMoodSelector) {
    return (
      <div className="flex items-center justify-center px-3 py-2 bg-gray-100 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  // Handle read-only mode
  if (readOnly && !currentMood) {
    return null;
  }

  if (readOnly && currentMood) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${moodConfig.bgColor} ${moodConfig.borderColor} border`}>
        <moodConfig.icon className={moodConfig.color} size={compact ? 14 : 16} />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`font-medium capitalize truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {moodConfig.label}
            </span>
            {!compact && currentMood.intensity && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                ({currentMood.intensity}/10)
              </span>
            )}
          </div>
          {!compact && currentMood.notes && (
            <div className="text-xs text-gray-600 truncate max-w-[150px]" title={currentMood.notes}>
              {currentMood.notes}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" 
    ref={modalRef}
    key={`mood-tracker-${transaction.id}-${currentMood ? currentMood.id : 'no-mood'}`}
    >
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1 bg-green-500 text-white text-xs rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg shadow-lg z-50">
          ⚠️ {error}
        </div>
      )}

      {/* Mood Display/Trigger */}
      {currentMood ? (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${moodConfig.bgColor} ${moodConfig.borderColor} border transition-colors hover:shadow-sm`}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <moodConfig.icon className={moodConfig.color} size={compact ? 14 : 16} />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className={`font-medium capitalize truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {moodConfig.label}
                </span>
                {!compact && currentMood.intensity && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ({currentMood.intensity}/10)
                  </span>
                )}
              </div>
              {!compact && currentMood.notes && (
                <div className="text-xs text-gray-600 truncate" title={currentMood.notes}>
                  {currentMood.notes}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <button
              onClick={handleEdit}
              disabled={contextLoading}
              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              aria-label="Edit mood"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={handleDeleteMood}
              disabled={contextLoading}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              aria-label="Delete mood"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddMood}
          disabled={!transaction.id || contextLoading}
          className={`flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            compact ? 'text-xs' : 'text-sm'
          }`}
          aria-label="Add mood to transaction"
        >
          {contextLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          ) : (
            <Smile size={compact ? 14 : 16} className="text-gray-600" />
          )}
          <span className="text-gray-700 whitespace-nowrap">
            {contextLoading ? 'Loading...' : compact ? 'Add Mood' : 'Track Spending Mood'}
          </span>
        </motion.button>
      )}

      {/* Mood Selector Modal */}
      {showMoodSelector && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isEditing ? 'Edit Mood' : 'Track Your Spending Mood'}
                </h3>
                {transaction.description && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    Transaction: {transaction.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close mood selector"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Mood Options Grid */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How did this spending make you feel?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {moodOptions.map((mood) => (
                    <motion.button
                      key={mood.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMood(mood)}
                      disabled={contextLoading}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all border-2 ${
                        selectedMood?.value === mood.value 
                          ? `${mood.bgColor} ${mood.borderColor} border-opacity-100 scale-105` 
                          : 'bg-gray-50 border-gray-200 border-opacity-50 hover:bg-gray-100'
                      } ${contextLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label={`Select ${mood.label} mood`}
                    >
                      <mood.icon className={`${mood.color} mb-1`} size={20} />
                      <span className="text-xs font-medium capitalize">{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Intensity: {intensity}/10
                  </label>
                  <span className="text-xs text-gray-500">
                    {intensityDescriptions[intensity]}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value) || 5)}
                    disabled={contextLoading}
                    className="w-full h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:shadow-sm"
                    aria-label="Mood intensity level"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                  <span className="text-xs text-gray-500 ml-1">
                    — What triggered this feeling?
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="e.g., Impulse buy, needed cheering up, planned purchase..."
                  disabled={contextLoading}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                  rows="3"
                  maxLength={500}
                  aria-label="Add notes about your mood"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Helpful for identifying spending patterns</span>
                  <span>{notes.length}/500</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {isEditing && currentMood && (
                  <button
                    onClick={handleDeleteMood}
                    disabled={contextLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <X size={16} className="mr-2" />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  disabled={contextLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedMood && handleMoodSelect(selectedMood)}
                  disabled={!selectedMood || contextLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {contextLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {isEditing ? 'Update' : 'Save Mood'}
                    </>
                  )}
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Tracking moods helps identify emotional spending patterns and improve financial habits
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Utility function to clear all cached moods 
export const clearMoodCache = () => {
  // Import dynamically to avoid circular dependencies
  import('../../contexts/TransactionMoodContext').then(({ moodCache }) => {
    if (moodCache && typeof moodCache.clear === 'function') {
      moodCache.clear();
    }
  });
};

// Utility function to get cache statistics
export const getMoodCacheStats = () => {
  // Import dynamically to avoid circular dependencies
  return import('../../contexts/TransactionMoodContext').then(({ moodCache }) => {
    return {
      size: moodCache ? moodCache.size() : 0,
      timestamp: new Date().toISOString()
    };
  });
};