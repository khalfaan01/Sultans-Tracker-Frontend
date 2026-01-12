// src/components/dashboard/BudgetsPage.jsx
import { motion } from 'framer-motion';
import { Plus, TrendingUp, AlertTriangle, Trash2, Calculator, Settings, Lightbulb, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useBudgets, useTransactions } from '../../contexts';

/**
 * Smart budget management interface with rollover calculations
 * 
 * Features:
 * - Visual budget tracking with progress indicators
 * - Flexible rollover policies (full, partial, capped)
 * - Real-time spending calculation using transactions
 * - Budget creation, editing, and deletion
 * - Interactive rollover calculation tool
 * 
 * Data Flow:
 * - Uses dedicated BudgetsContext for budget operations
 * - Calculates spent amounts from transaction data
 * - Supports multiple budget periods (weekly/monthly/yearly)
 * 
 * Error Handling:
 * - Context-level error display
 * - Form validation with user feedback
 * - Transaction filtering with date validation
 */
export default function BudgetsPage({ filters }) {
  // Context hooks - budgets for management, transactions for spending calculation
  const { 
    budgets, 
    summary,
    recommendations,
    loading, 
    error, 
    createBudget, 
    updateBudget, 
    deleteBudget, 
    calculateRollover,
    applyRecommendation,
    clearError,
    loadBudgets,
    loadBudgetSummary,
    loadRecommendations
    
  } = useBudgets();
  
  const { transactions, loadTransactions } = useTransactions();
  
  // UI state management
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRolloverCalc, setShowRolloverCalc] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [rolloverResult, setRolloverResult] = useState(null);
  const [budgetCheck, setBudgetCheck] = useState(null);
  const [formError, setFormError] = useState('');
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: 'Food',
    limit: '',
    period: 'monthly',
    rolloverType: 'none',
    rolloverAmount: 0,
    allowExceed: false
  });
    

  /**
   * Calculates current spending for each budget using month-to-date transactions
   * Applies date filtering to only count transactions within current month
   */
  const budgetsWithSpent = budgets.map(budget => {
  // Use database spent value as primary
  const spent = budget.spent || 0;
  
  // Calculate from transactions only for debugging and to identify issues
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const spentFromTransactions = transactions
    .filter(tx => {
      // Filter expense transactions
      if (tx.type !== 'expense') return false;
      
      // Filter by category
      if (tx.category !== budget.category) return false;
      
      // Filter by date within current month
      const txDate = new Date(tx.date);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Log detailed discrepancy for debugging
  const difference = spent - spentFromTransactions;
  if (Math.abs(difference) > 0.01) {
    console.warn(`Budget spent mismatch for ${budget.category}:`, {
      budgetId: budget.id,
      budgetPeriod: budget.period,
      dbSpent: spent,
      calculatedSpent: spentFromTransactions,
      difference: difference,
      transactionCount: transactions.filter(tx => 
        tx.type === 'expense' && 
        tx.category === budget.category &&
        new Date(tx.date) >= startOfMonth &&
        new Date(tx.date) <= endOfMonth
      ).length,
      totalTransactionCount: transactions.filter(tx => 
        tx.type === 'expense' && 
        tx.category === budget.category
      ).length
    });
  }
  
  const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
  const remaining = Math.max(0, budget.limit - spent);
  
  let status;
  if (spent > budget.limit) {
    status = 'over';
  } else if (spent > budget.limit * 0.8) {
    status = 'warning';
  } else {
    status = 'good';
  }
  
  return {
    ...budget,
    spent, // Always use database value
    percentage,
    remaining,
    status,
    // Add calculated from transactions for debugging
    _calculatedSpent: spentFromTransactions,
    _hasDiscrepancy: Math.abs(difference) > 0.01
  };
});

  // Refresh all data on component mount
  useEffect(() => {
  const loadAllData = async () => {
    try {
      
      if (!loading) {
        await loadBudgets();
        await loadBudgetSummary();
        await loadRecommendations();
      }
    } catch (err) {
      console.error('Failed to load budget data', err);
    }
  };
  
  loadAllData();
}, []);

  // Clear errors when form opens/closes
  useEffect(() => {
    if (showAddForm) {
      clearError();
      setFormError('');
      setBudgetCheck(null);
    }
  }, [showAddForm]);

  /**
   * Creates new budget with form validation
   * Clears error state before submission to ensure clean feedback
   */
  const handleAddBudget = async (e) => {
    e.preventDefault();
    clearError();
    setFormError('');
    
    // Validate form
    if (!newBudget.category) {
      setFormError('Please select a category');
      return;
    }
    
    if (!newBudget.limit || parseFloat(newBudget.limit) <= 0) {
      setFormError('Please enter a valid budget limit');
      return;
    }
    
    if ((newBudget.rolloverType === 'partial' || newBudget.rolloverType === 'capped') && 
        (!newBudget.rolloverAmount || parseFloat(newBudget.rolloverAmount) <= 0)) {
      setFormError(`Please enter a valid ${newBudget.rolloverType === 'partial' ? 'percentage' : 'amount'} for rollover`);
      return;
    }
    
    try {
      const budgetData = {
        category: newBudget.category,
        limit: parseFloat(newBudget.limit),
        period: newBudget.period,
        rolloverType: newBudget.rolloverType,
        rolloverAmount: newBudget.rolloverType !== 'none' ? parseFloat(newBudget.rolloverAmount) : 0,
        allowExceed: newBudget.allowExceed
      };
      
      if (newBudget.name) {
        budgetData.name = newBudget.name;
      }
      
      const result = await createBudget(budgetData);
      
      if (result) {
        setShowAddForm(false);
        setNewBudget({
          name: '',
          category: 'Food',
          limit: '',
          period: 'monthly',
          rolloverType: 'none',
          rolloverAmount: 0,
          allowExceed: false
        });
        setBudgetCheck(null);
      }
    } catch (err) {
      // Error is handled by context
    }
  };
  
  /**
   * Applies a smart recommendation
   */
  const handleApplyRecommendation = async (recommendation) => {
    try {
      await applyRecommendation(recommendation);
      // Show success message
      setTimeout(() => {
        setShowRecommendations(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to apply recommendation', err);
    }
  };

  /**
   * Calculates rollover for budget
   */
  const handleCalculateRollover = async (budgetId) => {
    try {
      const result = await calculateRollover(budgetId);
      if (result) {
        setRolloverResult(result);
        setShowRolloverCalc(budgetId);
      }
    } catch (err) {
      console.error('Failed to calculate rollover', err);
      // Show error in modal
      setRolloverResult({
        error: 'Failed to calculate rollover. Please try again.'
      });
      setShowRolloverCalc(budgetId);
    }
  };

  /**
   * Toggles budget active state
   */
  const handleToggleActive = async (budget) => {
    try {
      await updateBudget(budget.id, {
        isActive: !budget.isActive
      });
    } catch (err) {
      console.error('Failed to toggle budget', err);
    }
  };

  /**
   * Deletes budget with confirmation
   */
  const handleDelete = async (id, budgetName) => {
    if (window.confirm(`Are you sure you want to delete "${budgetName}" budget? This action cannot be undone.`)) {
      try {
        await deleteBudget(id);
      } catch (err) {
        console.error('Failed to delete budget', err);
      }
    }
  };

  // Get rollover description
  const getRolloverDescription = (budget) => {
    switch (budget.rolloverType) {
      case 'full':
        return 'Full rollover';
      case 'partial':
        return `${budget.rolloverAmount}% rollover`;
      case 'capped':
        return `Capped at $${budget.rolloverAmount}`;
      default:
        return 'No rollover';
    }
  };

  /**
   * Refresh all budget data
   */
  const handleRefresh = async () => {
    try {
      await loadBudgets();
      await loadBudgetSummary();
      await loadRecommendations();
      if (transactions.length === 0) {
        await loadTransactions();
      }
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  };

  const handleSyncBudgets = async () => {
  try {
    const response = await budgetsAPI.sync();
    if (response && response.synchronized) {
      alert(` Synced ${response.synchronized} budgets. Differences fixed: ${JSON.stringify(response.results, null, 2)}`);
      // Reload data
      await loadBudgets();
      await loadBudgetSummary();
    } else {
      alert('No budgets needed synchronization');
    }
  } catch (error) {
    console.error('Failed to sync budgets:', error);
    alert('Failed to sync budgets. Please check console for details.');
  }
};

  if (loading && budgets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Smart Budgets</h2>
          {summary && (
            <p className="text-gray-600">
              {summary.activeBudgets || budgets.filter(b => b.isActive).length} active budgets • 
              ${summary.totalLimit?.toFixed(2) || budgets.reduce((sum, b) => sum + b.limit, 0).toFixed(2)} total limit
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            title="Refresh data"
          >
            <RefreshCw size={20} />
          </motion.button>
          
          {recommendations && recommendations.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRecommendations(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              <Lightbulb size={20} />
              <span>Smart Tips ({recommendations.length})</span>
            </motion.button>
          )}

          <button
              onClick={handleSyncBudgets}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              title="Sync budget spent amounts with transactions"
            >
             <RefreshCw size={20} />
             <span>Sync Budgets</span>
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg"
          >
            <Plus size={20} />
            <span>Add Budget</span>
          </motion.button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Budget summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-gray-600 text-sm">Total Limit</h3>
            <p className="text-2xl font-bold">${summary.totalLimit?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-gray-600 text-sm">Total Spent</h3>
            <p className="text-2xl font-bold">${summary.totalSpent?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-gray-600 text-sm">Active Budgets</h3>
            <p className="text-2xl font-bold">{summary.activeBudgets || '0'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-gray-600 text-sm">Exceeded</h3>
            <p className="text-2xl font-bold text-red-600">{summary.exceededBudgets?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Smart recommendations modal */}
      {showRecommendations && recommendations && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRecommendations(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Lightbulb className="mr-2 text-yellow-500" /> Smart Budget Recommendations
            </h3>
            <p className="text-gray-600 mb-4">
              Based on your spending patterns, here are some budget suggestions:
            </p>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{rec.category}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Current average spending: <span className="font-semibold">${rec.currentSpending?.toFixed(2) || '0.00'}/month</span>
                      </p>
                      <p className="text-sm mt-1">
                        Recommended budget: <span className="font-semibold text-green-600">${rec.recommendedLimit?.toFixed(2)}/month</span>
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          rec.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.confidence || 'low'} confidence
                        </span>
                        {rec.potentialSavings && rec.potentialSavings > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 ml-2">
                            Save ${rec.potentialSavings.toFixed(2)}/month
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyRecommendation(rec)}
                      className="ml-4 bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRecommendations(false)}
              className="w-full mt-6 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Budget creation form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create Smart Budget</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {formError}
            </div>
          )}
          
          {budgetCheck && budgetCheck.warning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
              ⚠ {budgetCheck.warning}
            </div>
          )}
          
          <form onSubmit={handleAddBudget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Budget Name (Optional)</label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Groceries Budget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Period *</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget Limit ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({...newBudget, limit: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rollover Type</label>
                <select
                  value={newBudget.rolloverType}
                  onChange={(e) => setNewBudget({...newBudget, rolloverType: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="none">No Rollover</option>
                  <option value="full">Full Rollover</option>
                  <option value="partial">Partial Rollover</option>
                  <option value="capped">Capped Rollover</option>
                </select>
              </div>

              {(newBudget.rolloverType === 'partial' || newBudget.rolloverType === 'capped') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {newBudget.rolloverType === 'partial' ? 'Rollover Percentage (%)' : 'Maximum Rollover Amount ($)'}
                  </label>
                  <input
                    type="number"
                    step={newBudget.rolloverType === 'partial' ? '1' : '0.01'}
                    min="0"
                    max={newBudget.rolloverType === 'partial' ? '100' : undefined}
                    value={newBudget.rolloverAmount}
                    onChange={(e) => setNewBudget({...newBudget, rolloverAmount: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder={newBudget.rolloverType === 'partial' ? '50' : '100'}
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowExceed"
                checked={newBudget.allowExceed}
                onChange={(e) => setNewBudget({...newBudget, allowExceed: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="allowExceed" className="text-sm font-medium">
                Allow exceeding budget (show warnings only, don't block transactions)
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Budget
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Rollover calculation modal */}
      {showRolloverCalc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowRolloverCalc(null);
            setRolloverResult(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Rollover Calculation</h3>
            
            {rolloverResult?.error ? (
              <div className="text-red-600 p-3 bg-red-50 rounded-lg">
                {rolloverResult.error}
              </div>
            ) : rolloverResult ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Limit:</span>
                  <span className="font-semibold">${rolloverResult.currentLimit?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Spent This Month:</span>
                  <span className="font-semibold">${rolloverResult.spent?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unused Amount:</span>
                  <span className="font-semibold text-green-600">${rolloverResult.unusedAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rollover Type:</span>
                  <span className="font-semibold capitalize">{rolloverResult.rolloverType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Calculated Rollover:</span>
                  <span className="font-semibold text-blue-600">${rolloverResult.calculatedRollover?.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Next Month's Limit:</span>
                    <span className="font-bold text-lg text-green-600">${rolloverResult.newLimit?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                <p className="text-gray-600">Calculating rollover...</p>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowRolloverCalc(null);
                setRolloverResult(null);
              }}
              className="w-full mt-6 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {rolloverResult ? 'Close' : 'Cancel'}
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Budgets list */}
      <div className="grid gap-6">
        {budgets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="text-gray-400 mb-4">
              <Calculator size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Budgets Yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first budget to start tracking your spending
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          budgets.map((budget, index) => {
            // Calculate spent from transactions (fallback if budget.spent is 0)
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            const spentFromTransactions = transactions
              .filter(tx => 
                tx.type === 'expense' && 
                tx.category === budget.category &&
                new Date(tx.date) >= startOfMonth &&
                new Date(tx.date) <= endOfMonth
              )
              .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            
            // Use database spent value if available, otherwise calculate from transactions
            const spent = budget.spent > 0 ? budget.spent : spentFromTransactions;
            const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
            const remaining = Math.max(0, budget.limit - spent);
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white p-6 rounded-lg shadow-sm border ${!budget.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-lg">{budget.name || budget.category}</h3>
                      {!budget.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Inactive</span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {getRolloverDescription(budget)}
                      </span>
                      {!budget.allowExceed && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Strict</span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      ${spent.toFixed(2)} of ${budget.limit.toFixed(2)} • {budget.period}
                    </p>
                    <p className={`text-sm ${remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${remaining.toFixed(2)} remaining
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-1 ${
                      percentage > 100 ? 'text-red-600' : 
                      percentage > 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {percentage > 100 ? <AlertTriangle size={20} /> : 
                       percentage > 80 ? <AlertTriangle size={20} /> : <TrendingUp size={20} />}
                      <span className="font-semibold">{percentage.toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleCalculateRollover(budget.id)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Calculate rollover"
                      >
                        <Calculator size={18} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(budget)}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        title={budget.isActive ? 'Deactivate budget' : 'Activate budget'}
                      >
                        <Settings size={18} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id, budget.name || budget.category)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-3 rounded-full ${
                      percentage > 100 ? 'bg-red-500' : 
                      percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  />
                </div>
                
                {percentage > 100 && (
                  <p className={`text-sm mt-2 ${budget.allowExceed ? 'text-yellow-600' : 'text-red-600'}`}>
                    {budget.allowExceed ? (
                      <> ⚠ You've exceeded your budget by ${(spent - budget.limit).toFixed(2)}</>
                    ) : (
                      <> ⛔ Budget exceeded by ${(spent - budget.limit).toFixed(2)}</>
                    )}
                  </p>
                )}
                {percentage > 80 && percentage <= 100 && (
                  <p className="text-yellow-600 text-sm mt-2">
                    ⚠ Approaching budget limit - ${remaining.toFixed(2)} remaining
                  </p>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}