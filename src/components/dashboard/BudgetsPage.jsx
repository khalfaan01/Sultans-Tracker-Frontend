// src/components/dashboard/BudgetsPage.jsx
import { motion } from 'framer-motion';
import { Plus, TrendingUp, AlertTriangle, Trash2, Edit, Calculator, Settings } from 'lucide-react';
import { useState } from 'react';
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
    loading, 
    error, 
    createBudget, 
    updateBudget, 
    deleteBudget, 
    calculateRollover,
    clearError 
  } = useBudgets();
  
  const { transactions } = useTransactions();
  
  // UI state management
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRolloverCalc, setShowRolloverCalc] = useState(null);
  const [rolloverResult, setRolloverResult] = useState(null);
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Filter transactions: expense type, matching category, within current month
    const spent = transactions
      .filter(tx => 
        tx.type === 'expense' && 
        tx.category === budget.category &&
        new Date(tx.date) >= startOfMonth &&
        new Date(tx.date) <= endOfMonth
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const percentage = (spent / budget.limit) * 100;
    const remaining = Math.max(0, budget.limit - spent);
    
    // Determine budget status based on utilization percentage
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
      spent,
      percentage,
      remaining,
      status
    };
  });

  /**
   * Creates new budget with form validation
   * Clears error state before submission to ensure clean feedback
   */
  const handleAddBudget = async (e) => {
    e.preventDefault();
    clearError(); // Clear previous errors before new submission
    
    // Validate budget limit is provided and positive
    if (!newBudget.limit || parseFloat(newBudget.limit) <= 0) {
      // Note: In production, this would set a form-specific error state
      return;
    }
    
    const result = await createBudget(newBudget);
    
    if (result.success) {
      setShowAddForm(false);
      // Reset form to default values
      setNewBudget({
        name: '',
        category: 'Food',
        limit: '',
        period: 'monthly',
        rolloverType: 'none',
        rolloverAmount: 0,
        allowExceed: false
      });
    }
    // Error handling is managed by the context's error state
  };

  /**
   * Deletes budget with user confirmation
   * Uses native browser confirmation for simplicity
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  /**
   * Calculates rollover for specific budget
   * Displays result in modal overlay
   */
  const handleCalculateRollover = async (budgetId) => {
    const result = await calculateRollover(budgetId);
    if (result.success) {
      setRolloverResult(result.data);
      setShowRolloverCalc(budgetId);
    }
  };

  /**
   * Toggles budget active/inactive state
   * Inactive budgets are displayed with reduced opacity
   */
  const handleToggleActive = async (budget) => {
    await updateBudget(budget.id, {
      isActive: !budget.isActive
    });
  };

  /**
   * Generates human-readable description of rollover type
   * Supports full, partial, capped, and no rollover options
   */
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

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with add budget button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Smart Budgets</h2>
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

      {/* Error display from context */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Budget creation form with animated reveal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <h3 className="text-lg font-semibold mb-4">Create Smart Budget</h3>
          <form onSubmit={handleAddBudget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget name input */}
              <div>
                <label className="block text-sm font-medium mb-2">Budget Name</label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Groceries Budget"
                />
              </div>

              {/* Category selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full p-2 border rounded-lg"
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

              {/* Budget period */}
              <div>
                <label className="block text-sm font-medium mb-2">Period</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Budget limit */}
              <div>
                <label className="block text-sm font-medium mb-2">Budget Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({...newBudget, limit: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Rollover type selection */}
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

              {/* Conditional rollover amount input */}
              {(newBudget.rolloverType === 'partial' || newBudget.rolloverType === 'capped') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {newBudget.rolloverType === 'partial' ? 'Rollover Percentage' : 'Maximum Rollover Amount'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBudget.rolloverAmount}
                    onChange={(e) => setNewBudget({...newBudget, rolloverAmount: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder={newBudget.rolloverType === 'partial' ? '50' : '100'}
                    required
                  />
                </div>
              )}
            </div>

            {/* Allow exceed toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowExceed"
                checked={newBudget.allowExceed}
                onChange={(e) => setNewBudget({...newBudget, allowExceed: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="allowExceed" className="text-sm font-medium">
                Allow exceeding budget (warnings only)
              </label>
            </div>

            {/* Form actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg"
              >
                Create Budget
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Rollover calculation modal overlay */}
      {showRolloverCalc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRolloverCalc(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Rollover Calculation</h3>
            {rolloverResult && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Current Limit:</span>
                  <span className="font-semibold">${rolloverResult.currentLimit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spent This Month:</span>
                  <span className="font-semibold">${rolloverResult.spent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unused Amount:</span>
                  <span className="font-semibold text-green-600">${rolloverResult.unusedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rollover Type:</span>
                  <span className="font-semibold">{rolloverResult.rolloverType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Calculated Rollover:</span>
                  <span className="font-semibold text-blue-600">${rolloverResult.calculatedRollover.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Next Month's Limit:</span>
                  <span className="font-semibold text-green-600">${rolloverResult.newLimit.toFixed(2)}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowRolloverCalc(null)}
              className="w-full mt-4 bg-black text-white py-2 rounded-lg"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Budgets list - empty state or budget cards */}
      <div className="grid gap-6">
        {budgetsWithSpent.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center text-gray-500">
            No budgets found. Create your first smart budget to start tracking.
          </div>
        ) : (
          budgetsWithSpent.map((budget, index) => (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white p-6 rounded-lg shadow-sm border ${!budget.isActive ? 'opacity-60' : ''}`}
            >
              {/* Budget header with metadata and actions */}
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
                    ${budget.spent.toFixed(2)} of ${budget.limit.toFixed(2)} • {budget.period}
                  </p>
                  <p className="text-sm text-green-600">
                    ${budget.remaining.toFixed(2)} remaining
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Status indicator with appropriate icon */}
                  <div className={`flex items-center space-x-1 ${
                    budget.percentage > 100 ? 'text-red-600' : 
                    budget.percentage > 80 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {budget.percentage > 100 ? <AlertTriangle size={20} /> : 
                     budget.percentage > 80 ? <AlertTriangle size={20} /> : <TrendingUp size={20} />}
                    <span className="font-semibold">{budget.percentage.toFixed(0)}%</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleCalculateRollover(budget.id)}
                      className="p-1 hover:bg-blue-50 rounded transition-all"
                      title="Calculate rollover"
                    >
                      <Calculator size={16} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(budget)}
                      className="p-1 hover:bg-gray-50 rounded transition-all"
                      title={budget.isActive ? 'Deactivate budget' : 'Activate budget'}
                    >
                      <Settings size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1 hover:bg-red-50 rounded transition-all"
                      title="Delete budget"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Visual progress bar with color-coded utilization */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                  className={`h-3 rounded-full ${
                    budget.percentage > 100 ? 'bg-red-500' : 
                    budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                />
              </div>
              
              {/* Budget status messages based on utilization */}
              {budget.percentage > 100 && (
                <p className="text-red-600 text-sm mt-2">
                  {budget.allowExceed ? (
                    <> You've exceeded your budget by ${(budget.spent - budget.limit).toFixed(2)}</>
                  ) : (
                    <> Budget exceeded by ${(budget.spent - budget.limit).toFixed(2)} - new transactions blocked</>
                  )}
                </p>
              )}
              {budget.percentage > 80 && budget.percentage <= 100 && (
                <p className="text-yellow-600 text-sm mt-2">
                   Approaching budget limit - ${budget.remaining.toFixed(2)} remaining
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}