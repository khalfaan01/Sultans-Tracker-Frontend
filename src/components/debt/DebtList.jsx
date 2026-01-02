// DebtList.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebt } from '../../contexts/DebtContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DebtCard from './DebtCard.jsx';
import DebtForm from './DebtForm.jsx';
import DebtAnalytics from './DebtAnalytics.jsx';

const DebtList = () => {
  const { debts = [], loading, error: debtError } = useDebt();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [view, setView] = useState('list');
  const [localError, setLocalError] = useState(null);

  // Handle debt edit action
  const handleEdit = useCallback((debt) => {
    try {
      if (!debt || typeof debt !== 'object') {
        throw new Error('Invalid debt data for editing');
      }
      setEditingDebt(debt);
      setShowForm(true);
      setLocalError(null);
    } catch (err) {
      console.error('Error preparing debt for edit:', err);
      setLocalError('Unable to edit debt. Invalid data provided.');
    }
  }, []);

  // Handle form close with cleanup
  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingDebt(null);
    setLocalError(null);
  }, []);

  // Calculate debt categories safely
  const { activeDebts, paidOffDebts } = useMemo(() => {
    try {
      if (!Array.isArray(debts)) {
        console.warn('Debts is not an array:', debts);
        return { activeDebts: [], paidOffDebts: [] };
      }

      return {
        activeDebts: debts.filter(debt => 
          debt && typeof debt === 'object' && Boolean(debt.isActive)
        ),
        paidOffDebts: debts.filter(debt => 
          debt && typeof debt === 'object' && !debt.isActive
        )
      };
    } catch (err) {
      console.error('Error categorizing debts:', err);
      return { activeDebts: [], paidOffDebts: [] };
    }
  }, [debts]);

  // Handle retry action
  const handleRetry = useCallback(() => {
    setLocalError(null);
    window.location.reload();
  }, []);

  // Handle navigation to login
  const handleGoToLogin = useCallback(() => {
    try {
      window.location.href = '/login';
    } catch (err) {
      console.error('Error navigating to login:', err);
      setLocalError('Unable to redirect to login page');
    }
  }, []);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setLocalError(null);
    };
  }, []);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debt information...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">Authentication Required</h2>
          <p className="text-yellow-700 mb-6">Please log in to access Debt Management</p>
          <button 
            onClick={handleGoToLogin}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
            disabled={localError}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Error state (show debt error first, then local errors)
  const displayError = debtError || localError;
  if (displayError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-medium text-red-800">Error loading debts</h3>
              <p className="text-red-700 mt-1">{displayError}</p>
            </div>
          </div>
          <button 
            onClick={handleRetry}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debt Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your debts in one place</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${
                view === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setView('list')}
              disabled={loading}
              aria-pressed={view === 'list'}
            >
              List View
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${
                view === 'analytics' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setView('analytics')}
              disabled={loading}
              aria-pressed={view === 'analytics'}
            >
              Analytics
            </button>
          </div>
          
          {/* Add Debt Button */}
          <button 
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setEditingDebt(null);
              setShowForm(true);
            }}
            disabled={loading}
            aria-label="Add new debt"
          >
            <span>+</span>
            Add New Debt
          </button>
        </div>
      </div>

      {/* Main Content */}
      {view === 'analytics' ? (
        <DebtAnalytics />
      ) : (
        <>
          {/* Active Debts Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Active Debts ({activeDebts.length})
              </h2>
              {activeDebts.length > 0 && (
                <span className="text-sm text-gray-500">
                  Total: {activeDebts.length} debt{activeDebts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {activeDebts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4" role="img" aria-label="Money with wings">💸</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active debts found</h3>
                <p className="text-gray-600 mb-6">Add your first debt to get started with debt tracking</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  disabled={loading}
                >
                  Add Your First Debt
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDebts.map((debt, index) => (
                  <DebtCard 
                    key={debt.id || `active-debt-${index}`} 
                    debt={debt} 
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Paid Off Debts Section */}
          {paidOffDebts.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Paid Off ({paidOffDebts.length})
                </h2>
                <span className="text-sm text-green-600 font-medium">
                  🎉 Great job!
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paidOffDebts.map((debt, index) => (
                  <DebtCard 
                    key={debt.id || `paid-debt-${index}`} 
                    debt={debt} 
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Debt Form Modal */}
      {showForm && (
        <DebtForm 
          debt={editingDebt}
          onClose={handleFormClose}
          onSave={() => {
            handleFormClose();
            setLocalError(null);
          }}
        />
      )}
    </div>
  );
};

export default DebtList;