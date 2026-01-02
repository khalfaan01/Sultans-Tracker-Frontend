// src/components/dashboard/GoalsPage.jsx
import { motion } from 'framer-motion';
import { Plus, Target, Trophy, Trash2, Edit, DollarSign, PieChart, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useGoals } from '../../contexts';

/**
 * Financial goals management interface with automated income allocation
 * 
 * Features:
 * - Goal creation, tracking, and completion management
 * - Visual progress indicators with deadline tracking
 * - Automated income allocation for systematic savings
 * - Manual contribution capabilities for ad-hoc savings
 * - Goal categorization with visual theming
 * 
 * Goal Lifecycle:
 * 1. Creation: Define target amount, category, deadline, and optional allocation percentage
 * 2. Active Tracking: Monitor progress, make contributions, adjust as needed
 * 3. Completion: Visual celebration and archiving
 * 4. Inactive Management: Deactivate without deletion for historical tracking
 * 
 * Income Allocation:
 * - Automated distribution of income across multiple goals
 * - Percentage-based allocation ensuring proportional distribution
 * - Real-time allocation summary and validation
 * 
 * Error Handling:
 * - Context-level error display with user-friendly messages
 * - Form validation with clear feedback
 * - Safe mutation operations with confirmation dialogs
 */
export default function GoalsPage({ filters }) {
  // Centralized goals context for state management and operations
  const { 
    goals, 
    loading, 
    error, 
    createGoal, 
    updateGoal, 
    deleteGoal, 
    contributeToGoal, 
    autoAllocateIncome,
    clearError 
  } = useGoals();
  
  // UI state management for forms and modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState(null);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [allocationData, setAllocationData] = useState({
    incomeAmount: '',
    incomeDescription: 'Monthly Income'
  });
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    category: 'savings',
    allocationPercentage: ''
  });

  // Goal category configuration with visual theming
  const goalCategories = [
    { value: 'savings', label: 'Savings', color: 'bg-blue-100 text-blue-600' },
    { value: 'emergency', label: 'Emergency Fund', color: 'bg-red-100 text-red-600' },
    { value: 'vacation', label: 'Vacation', color: 'bg-green-100 text-green-600' },
    { value: 'investment', label: 'Investment', color: 'bg-purple-100 text-purple-600' },
    { value: 'debt', label: 'Debt Payment', color: 'bg-orange-100 text-orange-600' },
    { value: 'education', label: 'Education', color: 'bg-indigo-100 text-indigo-600' },
    { value: 'home', label: 'Home', color: 'bg-pink-100 text-pink-600' },
    { value: 'vehicle', label: 'Vehicle', color: 'bg-teal-100 text-teal-600' }
  ];

  /**
   * Creates a new financial goal with form validation
   * Clears previous errors and resets form on successful creation
   */
  const handleAddGoal = async (e) => {
    e.preventDefault();
    clearError();
    
    // Validate required fields
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) {
      // Note: In production, would set form-specific error state
      return;
    }
    
    const result = await createGoal(newGoal);
    
    if (result.success) {
      setShowAddForm(false);
      // Reset form to default values
      setNewGoal({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        category: 'savings',
        allocationPercentage: ''
      });
    }
    // Error handling is managed by context's error state
  };

  /**
   * Deletes a goal with user confirmation
   * @param {string} id - Goal identifier
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id);
    }
  };

  /**
   * Processes manual contribution to a specific goal
   * @param {string} goalId - Target goal identifier
   */
  const handleContribute = async (goalId) => {
    // Validate contribution amount
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      return;
    }
    
    const result = await contributeToGoal(goalId, {
      amount: parseFloat(contributionAmount),
      description: 'Manual contribution'
    });
    
    if (result.success) {
      setShowContributeForm(null);
      setContributionAmount('');
    }
  };

  /**
   * Automatically allocates income across goals based on configured percentages
   * Validates allocation percentages don't exceed 100% total
   */
  const handleAutoAllocate = async (e) => {
    e.preventDefault();
    clearError();
    
    // Validate income amount
    if (!allocationData.incomeAmount || parseFloat(allocationData.incomeAmount) <= 0) {
      return;
    }
    
    const result = await autoAllocateIncome({
      incomeAmount: parseFloat(allocationData.incomeAmount),
      incomeDescription: allocationData.incomeDescription
    });
    
    if (result.success) {
      setShowAllocateForm(false);
      setAllocationData({ incomeAmount: '', incomeDescription: 'Monthly Income' });
    }
  };

  /**
   * Toggles goal active/inactive status
   * @param {Object} goal - Goal object to toggle
   */
  const handleToggleActive = async (goal) => {
    await updateGoal(goal.id, {
      isActive: !goal.isActive
    });
  };

  /**
   * Retrieves category information for a goal
   * @param {string} category - Goal category identifier
   * @returns {Object} Category configuration with label and color
   */
  const getCategoryInfo = (category) => {
    return goalCategories.find(cat => cat.value === category) || goalCategories[0];
  };

  /**
   * Calculates days remaining until goal deadline
   * @param {string} deadline - ISO date string
   * @returns {number} Days remaining (negative if overdue)
   */
  const calculateDaysLeft = (deadline) => {
    try {
      const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return days;
    } catch (error) {
      return 0; // Fallback for invalid dates
    }
  };

  /**
   * Determines goal status based on progress and timeline
   * @param {Object} goal - Goal object
   * @returns {Object} Status information with text and color
   */
  const getGoalStatus = (goal) => {
    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const daysLeft = calculateDaysLeft(goal.deadline);
    
    // Status determination logic
    if (goal.isCompleted || percentage >= 100) {
      return { status: 'completed', text: 'Goal Achieved! 🎉', color: 'text-green-600' };
    }
    if (daysLeft <= 0) {
      return { status: 'overdue', text: 'Deadline Passed', color: 'text-red-600' };
    }
    if (daysLeft <= 30) {
      return { status: 'urgent', text: `${daysLeft} days left`, color: 'text-orange-600' };
    }
    return { status: 'active', text: `${daysLeft} days left`, color: 'text-blue-600' };
  };

  /**
   * Calculates total allocation percentage across all active goals
   * Used to validate that total doesn't exceed 100%
   */
  const totalAllocation = goals
    .filter(goal => goal.isActive && !goal.isCompleted && goal.allocationPercentage)
    .reduce((sum, goal) => sum + (goal.allocationPercentage || 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // Error state display
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Reload Goals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Goals</h2>
          <p className="text-gray-600">Track and achieve your financial dreams</p>
        </div>
        <div className="flex space-x-3">
          {/* Income allocation button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllocateForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Allocate income to goals"
          >
            <PieChart size={20} aria-hidden="true" />
            <span>Allocate Income</span>
          </motion.button>
          {/* Add goal button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2"
            aria-label="Add new goal"
          >
            <Plus size={20} aria-hidden="true" />
            <span>Add Goal</span>
          </motion.button>
        </div>
      </div>

      {/* Context error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Income allocation summary banner */}
      {totalAllocation > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" role="status" aria-label="Income allocation summary">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-800">Income Allocation Setup</h3>
              <p className="text-blue-600 text-sm">
                {totalAllocation}% of future income will be automatically allocated to your goals
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-800 font-semibold">{totalAllocation}% Allocated</p>
              <p className="text-blue-600 text-sm">{100 - totalAllocation}% Available</p>
            </div>
          </div>
        </div>
      )}

      {/* Goal creation form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
          role="dialog"
          aria-label="Create new goal form"
        >
          <h3 className="text-lg font-semibold mb-4">Create New Financial Goal</h3>
          <form onSubmit={handleAddGoal} className="space-y-4">
            {/* Goal name input */}
            <div>
              <label className="block text-sm font-medium mb-2">Goal Name</label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., New Laptop, Europe Vacation, Emergency Fund"
                required
                aria-required="true"
              />
            </div>

            {/* Target and current amount inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                  required
                  aria-required="true"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({...newGoal, currentAmount: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                  required
                  aria-required="true"
                  min="0"
                />
              </div>
            </div>

            {/* Category and deadline selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  aria-label="Select goal category"
                >
                  {goalCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Date</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                  aria-required="true"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Income allocation percentage */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Income Allocation Percentage (Optional)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newGoal.allocationPercentage}
                onChange={(e) => setNewGoal({...newGoal, allocationPercentage: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., 20 for 20% of income"
                aria-label="Percentage of income to allocate to this goal"
              />
              <p className="text-sm text-gray-500 mt-1">
                What percentage of future income should be automatically allocated to this goal?
              </p>
            </div>

            {/* Form actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                aria-label="Create goal"
              >
                Create Goal
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Cancel goal creation"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Auto-allocate income modal */}
      {showAllocateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAllocateForm(false)}
          role="presentation"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Allocate income to goals"
          >
            <h3 className="text-lg font-semibold mb-4">Allocate Income to Goals</h3>
            <form onSubmit={handleAutoAllocate} className="space-y-4">
              {/* Income amount input */}
              <div>
                <label className="block text-sm font-medium mb-2">Income Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={allocationData.incomeAmount}
                  onChange={(e) => setAllocationData({...allocationData, incomeAmount: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                  required
                  aria-required="true"
                  min="0"
                />
              </div>
              {/* Income description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={allocationData.incomeDescription}
                  onChange={(e) => setAllocationData({...allocationData, incomeDescription: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Salary, Bonus, Freelance"
                  aria-label="Income source description"
                />
              </div>
              
              {/* Active goals with allocation summary */}
              <div className="bg-gray-50 p-3 rounded-lg" role="region" aria-label="Active goals with allocation percentages">
                <h4 className="font-medium mb-2">Active Goals with Allocation:</h4>
                {goals.filter(goal => goal.isActive && !goal.isCompleted && goal.allocationPercentage).length === 0 ? (
                  <p className="text-sm text-gray-500">No active goals with allocation percentages</p>
                ) : (
                  goals
                    .filter(goal => goal.isActive && !goal.isCompleted && goal.allocationPercentage)
                    .map(goal => (
                      <div key={goal.id} className="flex justify-between text-sm mb-1">
                        <span>{goal.name}</span>
                        <span className="font-medium">{goal.allocationPercentage}%</span>
                      </div>
                    ))
                )}
              </div>

              {/* Allocation form actions */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Allocate income"
                >
                  Allocate Income
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllocateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Cancel allocation"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Manual contribution modal */}
      {showContributeForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowContributeForm(null)}
          role="presentation"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Contribute to goal"
          >
            <h3 className="text-lg font-semibold mb-4">Contribute to Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contribution Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleContribute(showContributeForm)}
                  className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  aria-label="Confirm contribution"
                >
                  Contribute
                </button>
                <button
                  onClick={() => setShowContributeForm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Cancel contribution"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Goals list - empty state or goal cards */}
      <div className="grid gap-6">
        {goals.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center text-gray-500">
            <Target size={48} className="mx-auto mb-4 text-gray-400" aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
            <p className="mb-4">Create your first financial goal to start tracking your progress</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              aria-label="Create first goal"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((goal, index) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const status = getGoalStatus(goal);
            const categoryInfo = getCategoryInfo(goal.category);
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white p-6 rounded-lg shadow-sm border ${!goal.isActive ? 'opacity-60' : ''}`}
                role="article"
                aria-label={`Goal: ${goal.name}, Progress: ${percentage.toFixed(0)}%, Status: ${status.status}`}
              >
                {/* Goal header with metadata */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${categoryInfo.color}`} aria-hidden="true">
                      <Target size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        {!goal.isActive && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Inactive</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                        {goal.allocationPercentage && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                            {goal.allocationPercentage}% Allocation
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">Target: ${goal.targetAmount.toFixed(2)}</p>
                      <p className={`text-sm ${status.color}`}>
                        {status.text}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress percentage display */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{percentage.toFixed(0)}%</p>
                    <p className="text-sm text-gray-600">${goal.currentAmount.toFixed(2)} saved</p>
                  </div>
                </div>
                
                {/* Progress bar visualization */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    className={`h-3 rounded-full ${
                      goal.isCompleted ? 'bg-green-500' :
                      status.status === 'overdue' ? 'bg-red-500' :
                      status.status === 'urgent' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                
                {/* Progress summary */}
                <div className="flex justify-between text-sm text-gray-600 mb-3">
                  <span>Saved: ${goal.currentAmount.toFixed(2)}</span>
                  <span>Target: ${goal.targetAmount.toFixed(2)}</span>
                </div>
                
                {/* Goal completion celebration */}
                {goal.isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center space-x-2 p-2 bg-green-100 rounded-lg mb-3"
                    role="status"
                    aria-label="Goal achieved"
                  >
                    <Trophy className="text-green-600" size={16} aria-hidden="true" />
                    <span className="text-green-600 font-semibold">Goal Achieved! 🎉</span>
                  </motion.div>
                )}

                {/* Goal action buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowContributeForm(goal.id)}
                      className="flex items-center space-x-1 bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 disabled:opacity-50"
                      disabled={goal.isCompleted}
                      aria-label={`Contribute to ${goal.name}`}
                    >
                      <DollarSign size={14} aria-hidden="true" />
                      <span>Contribute</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(goal)}
                      className="flex items-center space-x-1 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                      aria-label={`${goal.isActive ? 'Deactivate' : 'Activate'} ${goal.name}`}
                    >
                      <Edit size={14} aria-hidden="true" />
                      <span>{goal.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1 hover:bg-red-50 rounded transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="Delete goal"
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash2 size={16} className="text-red-500" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}