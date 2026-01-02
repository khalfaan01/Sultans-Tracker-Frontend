// SubscriptionManager.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Trash2, Edit3, AlertTriangle, 
  Zap, Calendar, DollarSign, TrendingUp,
  CreditCard, Shield, Bell
} from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionsContext';

const SubscriptionManager = () => {
  const { transactions, recurringTransactions = [], updateRecurringTransaction, deleteRecurringTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('amount');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Advanced subscription detection and analysis with error handling
  const subscriptions = useMemo(() => {
    try {
      const detectedSubscriptions = Array.isArray(recurringTransactions) ? recurringTransactions : [];
      
      // Enhanced analysis with validation
      return detectedSubscriptions.map(sub => {
        if (!sub || typeof sub !== 'object') {
          console.warn('Invalid subscription data detected:', sub);
          return null;
        }

        const amount = parseFloat(sub.amount) || 0;
        const frequency = sub.frequency || 'monthly';
        const usageHours = parseFloat(sub.usageHours) || 0;
        const category = sub.category || 'Unknown';
        
        // Calculate costs safely
        const monthlyCost = frequency === 'yearly' ? amount / 12 : amount;
        const totalYearlyCost = frequency === 'monthly' ? amount * 12 : amount;
        
        // Calculate value score (0-100) with bounds
        let valueScore = 50;
        const usageScore = Math.min(Math.max(0, usageHours / 10), 1) * 40;
        const costEfficiency = Math.max(0, Math.min(1 - (monthlyCost / 100), 1)) * 30;
        const necessityScore = category === 'Essential' ? 30 : 10;
        
        valueScore = Math.min(100, Math.max(0, usageScore + costEfficiency + necessityScore));
        
        // Risk assessment
        const risks = [];
        if (monthlyCost > 50) risks.push('High Cost');
        if (frequency === 'yearly' && amount > 200) risks.push('Large Annual Commitment');
        if (!sub.cancellationUrl) risks.push('Hard to Cancel');
        if (sub.priceIncreased) risks.push('Recent Price Increase');
        
        return {
          ...sub,
          id: sub.id || `sub-${Math.random().toString(36).substr(2, 9)}`,
          amount,
          frequency,
          category,
          usageHours,
          monthlyCost,
          totalYearlyCost,
          valueScore: Math.round(valueScore),
          risks,
          status: sub.status || 'active',
          nextBillingDate: sub.nextBillingDate || new Date().toISOString()
        };
      }).filter(Boolean); // Remove null entries
    } catch (err) {
      console.error('Error processing subscriptions:', err);
      setError('Failed to process subscription data');
      return [];
    }
  }, [recurringTransactions]);

  // Filter and sort subscriptions safely
  const filteredSubscriptions = useMemo(() => {
    try {
      return subscriptions.filter(sub => {
        const name = sub.name || '';
        const category = sub.category || '';
        const status = sub.status || 'active';
        
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        
        return matchesSearch && matchesStatus;
      }).sort((a, b) => {
        switch (sortBy) {
          case 'amount': 
            return (b.monthlyCost || 0) - (a.monthlyCost || 0);
          case 'name': 
            return (a.name || '').localeCompare(b.name || '');
          case 'value': 
            return (b.valueScore || 0) - (a.valueScore || 0);
          case 'date': 
            const dateA = new Date(a.nextBillingDate || 0).getTime();
            const dateB = new Date(b.nextBillingDate || 0).getTime();
            return dateB - dateA;
          default: 
            return 0;
        }
      });
    } catch (err) {
      console.error('Error filtering subscriptions:', err);
      return [];
    }
  }, [subscriptions, searchTerm, statusFilter, sortBy]);

  // Calculate analytics safely
  const analytics = useMemo(() => {
    try {
      const totalMonthly = subscriptions.reduce((sum, sub) => sum + (sub.monthlyCost || 0), 0);
      const totalYearly = subscriptions.reduce((sum, sub) => sum + (sub.totalYearlyCost || 0), 0);
      
      const byCategory = subscriptions.reduce((acc, sub) => {
        const category = sub.category || 'Unknown';
        acc[category] = (acc[category] || 0) + (sub.monthlyCost || 0);
        return acc;
      }, {});
      
      const optimizationOpportunities = subscriptions.filter(sub => 
        (sub.valueScore || 0) < 40 && (sub.monthlyCost || 0) > 10
      ).length;

      return {
        totalMonthly: Math.max(0, totalMonthly),
        totalYearly: Math.max(0, totalYearly),
        byCategory,
        optimizationOpportunities,
        subscriptionCount: subscriptions.length
      };
    } catch (err) {
      console.error('Error calculating analytics:', err);
      return {
        totalMonthly: 0,
        totalYearly: 0,
        byCategory: {},
        optimizationOpportunities: 0,
        subscriptionCount: 0
      };
    }
  }, [subscriptions]);

  // Handle edit subscription
  const handleEdit = useCallback((subscription) => {
    try {
      if (!subscription || typeof subscription !== 'object') {
        throw new Error('Invalid subscription data');
      }
      
      setEditingId(subscription.id);
      setEditForm({
        name: subscription.name || '',
        amount: subscription.amount || 0,
        frequency: subscription.frequency || 'monthly',
        category: subscription.category || 'Entertainment',
        nextBillingDate: subscription.nextBillingDate || new Date().toISOString().split('T')[0]
      });
      setError(null);
    } catch (err) {
      console.error('Error preparing subscription for edit:', err);
      setError('Unable to edit subscription');
    }
  }, []);

  // Handle save subscription changes
  const handleSave = useCallback(async () => {
    if (!editingId) {
      setError('No subscription selected for editing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validatedForm = {
        name: editForm.name?.trim() || 'Unnamed Subscription',
        amount: Math.max(0, parseFloat(editForm.amount) || 0),
        frequency: ['monthly', 'yearly'].includes(editForm.frequency) ? editForm.frequency : 'monthly',
        category: editForm.category || 'Entertainment',
        nextBillingDate: editForm.nextBillingDate || new Date().toISOString().split('T')[0]
      };

      if (!validatedForm.name || validatedForm.name.length < 2) {
        throw new Error('Subscription name must be at least 2 characters');
      }

      if (validatedForm.amount <= 0) {
        throw new Error('Subscription amount must be greater than 0');
      }

      const result = await updateRecurringTransaction(editingId, validatedForm);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update subscription');
      }

      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Failed to update subscription:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  }, [editingId, editForm, updateRecurringTransaction]);

  // Handle subscription cancellation
  const handleCancelSubscription = useCallback(async (subscriptionId) => {
    if (!subscriptionId) {
      setError('Invalid subscription ID');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteRecurringTransaction(subscriptionId);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  }, [deleteRecurringTransaction]);

  // Get color based on value score
  const getValueColor = useCallback((score) => {
    const numericScore = Number(score) || 0;
    if (numericScore >= 70) return 'text-green-600 bg-green-100';
    if (numericScore >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  // Get risk level based on number of risks
  const getRiskLevel = useCallback((risks) => {
    if (!Array.isArray(risks)) return 'low';
    if (risks.length >= 3) return 'high';
    if (risks.length >= 2) return 'medium';
    return 'low';
  }, []);

  // Format date safely
  const formatDate = useCallback((dateString) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Format currency safely
  const formatCurrency = useCallback((amount) => {
    try {
      const numAmount = Number(amount) || 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numAmount);
    } catch {
      return '$0.00';
    }
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
    setError(null);
  }, []);

  // Clear error when search/filter changes
  useEffect(() => {
    setError(null);
  }, [searchTerm, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 text-lg"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-gray-700">Monthly Cost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analytics.totalMonthly)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="font-semibold text-gray-700">Yearly Cost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analytics.totalYearly)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <span className="font-semibold text-gray-700">Subscriptions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.subscriptionCount}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <span className="font-semibold text-gray-700">Optimization</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.optimizationOpportunities}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="paused">Paused</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="amount">Sort by Amount</option>
            <option value="name">Sort by Name</option>
            <option value="value">Sort by Value</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
        
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={() => console.log('Add subscription clicked')}
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Subscription List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <AnimatePresence>
          {filteredSubscriptions.map((subscription, index) => (
            <motion.div
              key={subscription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100 last:border-b-0"
            >
              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {subscription.name || 'Unnamed Subscription'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {subscription.status || 'unknown'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getValueColor(subscription.valueScore)} flex-shrink-0`}>
                          Value: {(subscription.valueScore || 0)}/100
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>{formatCurrency(subscription.amount)} {subscription.frequency}</span>
                        <span className="hidden md:inline">•</span>
                        <span>{subscription.category || 'Unknown'}</span>
                        <span className="hidden md:inline">•</span>
                        <span>Next: {formatDate(subscription.nextBillingDate)}</span>
                      </div>
                      
                      {Array.isArray(subscription.risks) && subscription.risks.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {subscription.risks.map((risk, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                                  getRiskLevel(subscription.risks) === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {risk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleEdit(subscription)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Edit subscription"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancelSubscription(subscription.id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Cancel subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                <AnimatePresence>
                  {editingId === subscription.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Subscription Name"
                          disabled={loading}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          minLength="2"
                          maxLength="100"
                        />
                        <input
                          type="number"
                          value={editForm.amount || 0}
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            amount: Math.max(0, parseFloat(e.target.value) || 0)
                          }))}
                          placeholder="Amount"
                          disabled={loading}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          step="0.01"
                          min="0"
                        />
                        <select
                          value={editForm.frequency || 'monthly'}
                          onChange={(e) => setEditForm(prev => ({ ...prev, frequency: e.target.value }))}
                          disabled={loading}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <select
                          value={editForm.category || 'Entertainment'}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          disabled={loading}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="Entertainment">Entertainment</option>
                          <option value="Productivity">Productivity</option>
                          <option value="Essential">Essential</option>
                          <option value="Lifestyle">Lifestyle</option>
                        </select>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscriptions found</h3>
          <p className="text-gray-600">
            {subscriptions.length === 0 
              ? "We haven't detected any subscriptions yet. They'll appear here automatically."
              : "Try adjusting your search or filters."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;