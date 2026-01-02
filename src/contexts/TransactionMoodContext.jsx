// src/contexts/TransactionMoodContext.jsx
import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { transactionMoodsAPI } from '../services/api';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useDataLoader } from '../hooks/useDataLoader';

const TransactionMoodContext = createContext();

export const useTransactionMood = () => {
  const context = useContext(TransactionMoodContext);
  if (!context) {
    throw new Error('useTransactionMood must be used within a TransactionMoodProvider');
  }
  return context;
};

export const TransactionMoodProvider = ({ children }) => {
  const { requireAuthSilent, isAuthenticated } = useAuthCheck();
  const { executeAsync, loading, error, clearError } = useDataLoader();

  const [moods, setMoods] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [moodMap, setMoodMap] = useState(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Update moodMap when moods change
  useEffect(() => {
    const map = new Map();
    moods.forEach(mood => {
      if (mood.transactionId) {
        map.set(mood.transactionId.toString(), mood);
      }
    });
    setMoodMap(map);
  }, [moods]);

  // Load moods when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      loadInitialData();
    } else if (!isAuthenticated) {
      // Clear data when user logs out
      setMoods([]);
      setAnalysis(null);
      setMoodMap(new Map());
      setIsInitialized(false);
    }
  }, [isAuthenticated, isInitialized]);

  /**
   * Loads initial mood data
   */
  const loadInitialData = async () => {
    if (!requireAuthSilent()) return;
    
    try {
      await loadAnalysis();
      setIsInitialized(true);
      console.log('Mood data loaded:', {
        moodsCount: moods.length,
        hasAnalysis: !!analysis
      });
    } catch (error) {
      console.error('Failed to load initial mood data:', error);
    }
  };

  /**
   * Loads comprehensive mood analysis data from the API
   */
  const loadAnalysis = async () => {
    if (!requireAuthSilent()) return;
    
    return await executeAsync(async () => {
      try {
        const data = await transactionMoodsAPI.getMoodAnalysis();
        setAnalysis(data);
        
        // Extract moods from analysis if available
        if (data.moods && Array.isArray(data.moods)) {
          setMoods(data.moods);
        } else {
          // If moods aren't in analysis, fetch them separately
          await loadMoodsDirectly();
        }
        
        return data;
      } catch (error) {
        console.error('Failed to load mood analysis:', error);
        throw error;
      }
    }, { showLoading: false });
  };

  /**
   * Loads moods directly from the API
   */
  const loadMoodsDirectly = async () => {
    if (!requireAuthSilent()) return;
    
    try {
      // Try to get all moods (you may need to implement this endpoint)
      const allMoods = await transactionMoodsAPI.getAllMoods();
      if (allMoods && Array.isArray(allMoods)) {
        setMoods(allMoods);
      }
    } catch (error) {
      console.warn('Could not load moods directly:', error);
    }
  };

  /**
   * Creates a new mood entry for a transaction
   */
  const createMoodEntry = async (moodData) => {
    if (!requireAuthSilent()) return;
    
    return await executeAsync(async () => {
      try {
        const newMood = await transactionMoodsAPI.addMood(moodData);
        
        // Update local state
        setMoods(prev => {
          const existingIndex = prev.findIndex(m => m.transactionId === moodData.transactionId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newMood;
            return updated;
          } else {
            return [...prev, newMood];
          }
        });
        
        // Refresh analysis in background
        setTimeout(() => {
          loadAnalysis().catch(err => 
            console.warn('Failed to refresh analysis after mood creation:', err)
          );
        }, 100);
        
        return { success: true, data: newMood };
      } catch (error) {
        console.error('Error creating mood entry:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Failed to save mood';
        return { success: false, error: errorMsg };
      }
    });
  };

  /**
   * Alias for createMoodEntry for backward compatibility
   */
  const addTransactionMood = async (transactionId, moodData) => {
    if (!requireAuthSilent()) return;
    
    const moodEntryData = {
      transactionId: parseInt(transactionId),
      mood: moodData.mood,
      intensity: moodData.intensity || 5,
      notes: moodData.notes || null
    };
    
    return await createMoodEntry(moodEntryData);
  };

  /**
   * Updates an existing mood entry
   */
  const updateMoodEntry = async (id, moodData) => {
    if (!requireAuthSilent()) return;
    
    return await executeAsync(async () => {
      try {
        const updatedMood = await transactionMoodsAPI.updateMood(id, moodData);
        
        // Update local state
        setMoods(prev => {
          const index = prev.findIndex(m => m.id === parseInt(id));
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = updatedMood;
            return updated;
          }
          return prev;
        });
        
        // Refresh analysis in background
        setTimeout(() => {
          loadAnalysis().catch(err => 
            console.warn('Failed to refresh analysis after mood update:', err)
          );
        }, 100);
        
        return { success: true, data: updatedMood };
      } catch (error) {
        console.error('Error updating mood entry:', error);
        return { success: false, error: error.message };
      }
    });
  };

  /**
   * Deletes a mood entry by ID
   */
  const deleteMoodEntry = useCallback(async (moodId) => {
    try {
      const response = await transactionMoodsAPI.deleteMood(moodId);
      
      // Update local state
      setMoods(prev => prev.filter(mood => mood.id !== parseInt(moodId)));
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Error deleting mood:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Retrieves mood entry for a specific transaction
   */
  const getMoodByTransaction = useCallback(async (transactionId) => {
    if (!requireAuthSilent()) return null;
    
    // Check moodMap first (fastest)
    const moodFromMap = moodMap.get(transactionId.toString());
    if (moodFromMap) return moodFromMap;
    
    // Fetch from API
    try {
      const moodFromApi = await transactionMoodsAPI.getMoodByTransaction(transactionId);
      if (moodFromApi) {
        // Update local state if not already present
        setMoods(prev => {
          const exists = prev.some(m => m.id === moodFromApi.id);
          if (!exists) {
            return [...prev, moodFromApi];
          }
          return prev;
        });
      }
      return moodFromApi;
    } catch (error) {
      console.error('Error fetching mood by transaction:', error);
      return null;
    }
  }, [requireAuthSilent, moodMap]);

  /**
   * Gets current mood for a transaction if it exists
   */
  const getCurrentTransactionMood = useCallback((transactionId) => {
    return moodMap.get(transactionId.toString()) || null;
  }, [moodMap]);

  const value = useMemo(() => ({
    // Data
    moods,
    analysis,
    moodMap,
    
    // State
    loading,
    error,
    clearError,
    
    // Operations
    loadAnalysis,
    addTransactionMood,
    updateMoodEntry,
    deleteMoodEntry,
    
    // Queries
    getMoodByTransaction,
    getCurrentTransactionMood,
  }), [
    moods,
    analysis,
    moodMap,
    loading,
    error,
    loadAnalysis,
    addTransactionMood,
    updateMoodEntry,
    deleteMoodEntry,
    getMoodByTransaction,
    getCurrentTransactionMood
  ]);

  return (
    <TransactionMoodContext.Provider value={value}>
      {children}
    </TransactionMoodContext.Provider>
  );
};