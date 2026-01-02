// src/components/dashboard/NotificationsSummary.jsx
import { useMemo } from 'react';
import { 
  Bell, Calendar, Target, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, DollarSign
} from 'lucide-react';
import { useTransactions, useBudgets, useGoals } from '../../contexts';

/**
 * Consolidated notification center for financial alerts and reminders
 * 
 * Features:
 * - Aggregates notifications from multiple financial domains (bills, budgets, goals)
 * - Prioritizes alerts based on severity and urgency
 * - Provides real-time updates based on transaction and financial data changes
 * - Includes simulated bill reminders for demonstration purposes
 * 
 * Notification Categories:
 * 1. Bill Due: Simulated upcoming bill payments with deadline warnings
 * 2. Budget Alerts: Threshold warnings for budget categories (90%+, 100%+)
 * 3. Goal Progress: Completion milestones, deadline reminders, and achievements
 * 
 * Severity Levels:
 * - High: Critical issues requiring immediate attention (budget exceeded, urgent bills)
 * - Medium: Important warnings (upcoming deadlines, budget thresholds)
 * - Low: Informational updates (goal progress, near-completion alerts)
 * - Info: Positive achievements (goal completion, milestones)
 * 
 * Data Integration:
 * - Accepts direct props for isolated testing
 * - Falls back to context data for real application use
 * - Memoized calculations for performance optimization
 */
const NotificationsSummary = ({ transactions, budgets, goals }) => {
  // Data source resolution: Use props if provided, otherwise fall back to context
  const transContext = useTransactions();
  const budgetContext = useBudgets();
  const goalContext = useGoals();
  
  const trans = transactions || transContext.transactions;
  const budg = budgets || budgetContext.budgets;
  const gls = goals || goalContext.goals;

  // Loading and error states from contexts
  const isLoading = transContext.loading || budgetContext.loading || goalContext.loading;
  const hasError = transContext.error || budgetContext.error || goalContext.error;

  /**
   * Aggregates notifications from all financial domains with prioritization
   * Processes bills, budget thresholds, and goal progress into actionable alerts
   */
  const notifications = useMemo(() => {
    const notificationsList = [];
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. BILL DUE NOTIFICATIONS (Simulated for demonstration)
    const upcomingBills = [
      { name: 'Electricity Bill', dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), amount: 120 },
      { name: 'Internet Bill', dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), amount: 80 },
    ].filter(bill => bill.dueDate <= oneWeekFromNow);

    upcomingBills.forEach(bill => {
      const daysUntilDue = Math.ceil((bill.dueDate - today) / (1000 * 60 * 60 * 24));
      notificationsList.push({
        type: 'bill_due',
        title: 'Bill Due Soon',
        message: `${bill.name} of $${bill.amount} due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
        severity: daysUntilDue <= 2 ? 'high' : 'medium',
        icon: Calendar,
        dueDate: bill.dueDate,
        amount: bill.amount
      });
    });

    // 2. GOAL PROGRESS NOTIFICATIONS
    gls.forEach(goal => {
      if (!goal.isCompleted && goal.isActive) {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const daysLeft = Math.ceil((new Date(goal.deadline) - today) / (1000 * 60 * 60 * 24));
        
        // Near-completion alert (90-100% progress)
        if (progress >= 90 && progress < 100) {
          notificationsList.push({
            type: 'goal_near_completion',
            title: 'Goal Almost Reached!',
            message: `${goal.name} is ${progress.toFixed(1)}% complete - only $${(goal.targetAmount - goal.currentAmount).toFixed(2)} to go`,
            severity: 'low',
            icon: Target,
            progress: progress,
            goalId: goal.id
          });
        }

        // Deadline warning (7 days or less)
        if (daysLeft <= 7 && progress < 100) {
          notificationsList.push({
            type: 'goal_deadline',
            title: 'Goal Deadline Approaching',
            message: `${goal.name} deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. ${progress.toFixed(1)}% complete`,
            severity: 'medium',
            icon: Clock,
            daysLeft: daysLeft,
            progress: progress
          });
        }

        // Completion celebration (100% progress, not marked completed)
        if (progress >= 100 && !goal.isCompleted) {
          notificationsList.push({
            type: 'goal_completed',
            title: 'Goal Completed! 🎉',
            message: `Congratulations! You've reached your ${goal.name} goal`,
            severity: 'info',
            icon: CheckCircle,
            goalId: goal.id
          });
        }
      }
    });

    // 3. BUDGET ALERTS
    budg.forEach(budget => {
      if (budget.isActive) {
        const spent = trans
          .filter(tx => tx.type === 'expense' && tx.category === budget.category)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
        const percentage = (spent / budget.limit) * 100;
        
        // Budget warning threshold (90-100% utilization)
        if (percentage >= 90 && percentage < 100) {
          notificationsList.push({
            type: 'budget_warning',
            title: 'Budget Nearly Exceeded',
            message: `${budget.category} budget is ${percentage.toFixed(1)}% used. $${(budget.limit - spent).toFixed(2)} remaining`,
            severity: 'medium',
            icon: AlertTriangle,
            category: budget.category,
            percentage: percentage
          });
        }

        // Budget exceeded (100%+ utilization)
        if (percentage >= 100) {
          notificationsList.push({
            type: 'budget_exceeded',
            title: 'Budget Exceeded',
            message: `${budget.category} budget exceeded by $${(spent - budget.limit).toFixed(2)}`,
            severity: 'high',
            icon: AlertTriangle,
            category: budget.category,
            overspend: spent - budget.limit
          });
        }
      }
    });

    // Prioritize notifications by severity and limit to 8 for UI constraints
    const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
    return notificationsList
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, 8);
  }, [trans, budg, gls]);

  /**
   * Maps severity levels to UI color schemes
   * @param {string} severity - Notification severity level
   * @returns {string} Tailwind CSS classes for styling
   */
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const unreadCount = notifications.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Unable to load notification data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" role="region" aria-label="Notifications summary">
      {/* Header with unread count */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="mr-2" size={20} aria-hidden="true" />
          Notifications
        </h3>
        {/* Unread counter badge */}
        {unreadCount > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full" aria-label={`${unreadCount} new notifications`}>
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="text-center py-8" role="status" aria-label="No notifications">
          <Bell size={32} className="mx-auto text-gray-300 mb-2" aria-hidden="true" />
          <p className="text-gray-500">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        /* Notifications list */
        <div className="space-y-3 max-h-96 overflow-y-auto" role="list" aria-label="Notification list">
          {notifications.map((notification, index) => {
            const IconComponent = notification.icon || Bell;
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(notification.severity)}`}
                role="listitem"
                aria-label={`${notification.severity} priority notification: ${notification.title}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Notification icon */}
                  <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                    <IconComponent size={16} />
                  </div>
                  {/* Notification content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold">{notification.title}</h4>
                      {/* Severity badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.severity === 'high' ? 'bg-red-100 text-red-700' :
                        notification.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                        notification.severity === 'low' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {notification.severity}
                      </span>
                    </div>
                    {/* Notification message */}
                    <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                    {/* Due date for bill notifications */}
                    {notification.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {notification.dueDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification summary footer */}
      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200" role="status" aria-label="Notification priority breakdown">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Priority breakdown</span>
          </div>
          {/* Priority summary badges */}
          <div className="flex space-x-2 mt-2">
            {notifications.some(n => n.severity === 'high') && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full" aria-label={`${notifications.filter(n => n.severity === 'high').length} critical notifications`}>
                {notifications.filter(n => n.severity === 'high').length} Critical
              </span>
            )}
            {notifications.some(n => n.severity === 'medium') && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full" aria-label={`${notifications.filter(n => n.severity === 'medium').length} important notifications`}>
                {notifications.filter(n => n.severity === 'medium').length} Important
              </span>
            )}
            {notifications.some(n => n.severity === 'low') && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full" aria-label={`${notifications.filter(n => n.severity === 'low').length} update notifications`}>
                {notifications.filter(n => n.severity === 'low').length} Updates
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsSummary;