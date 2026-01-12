/**
 * Check if a transaction would exceed budget limits
 * Use this function before creating any expense transaction
 * @param {Object} transactionData - Transaction data to check
 * @param {Function} checkBudgetLimit - From useBudgets hook
 * @returns {Promise<Object>} Check result with warnings or errors
 */

export const checkTransactionAgainstBudget = async (transactionData, checkBudgetLimit) => {
  if (!transactionData || transactionData.type !== 'expense') {
    return { allowed: true };
  }

  try {
    const result = await checkBudgetLimit(
      transactionData.category,
      Math.abs(transactionData.amount)
    );
    
    console.log('Budget check result:', result);
    
    // Handle case where budget doesn't exist for category
    if (!result.budget) {
      return { allowed: true };
    }
    
    // Check if transaction is blocked
    if (result.allowed === false) {
      return {
        allowed: false,
        message: result.error || `This expense would exceed your ${transactionData.category} budget`,
        details: {
          budgetCategory: result.budget.category || transactionData.category,
          budgetLimit: result.budget.limit,
          currentSpent: result.currentSpent || 0,
          transactionAmount: Math.abs(transactionData.amount),
          wouldBeTotal: result.wouldBeTotal,
          overspendAmount: result.overspendAmount,
          suggestion: result.suggestion
        }
      };
    }
    
    // Check for warnings (budget allows exceed or is near limit)
    if (result.warning) {
      return {
        allowed: true,
        warning: result.warning,
        details: {
          budgetCategory: result.budget.category || transactionData.category,
          overspendAmount: result.overspendAmount,
          budgetLimit: result.budget.limit,
          currentSpent: result.currentSpent || 0,
          allowExceed: result.budget.allowExceed || false
        }
      };
    }
    
    return { allowed: true };
    
  } catch (error) {
    console.warn('Budget check failed, proceeding with transaction', error);
    return { allowed: true, error: 'Budget check failed' };
  }
};

/**
 * Show budget warning alert to user
 * @param {Object} checkResult - Result from checkTransactionAgainstBudget
 * @param {Function} onProceed - Callback if user chooses to proceed
 * @param {Function} onCancel - Callback if user cancels
 */
export const showBudgetWarning = (checkResult, onProceed, onCancel) => {
  if (!checkResult.warning) return onProceed();
  
  const confirmed = window.confirm(
    `⚠️ BUDGET WARNING\n\n${checkResult.warning}\n\nDo you want to proceed with this transaction?`
  );
  
  if (confirmed) {
    onProceed();
  } else {
    onCancel && onCancel();
  }
};

/**
 * Show budget error blocking transaction
 * @param {Object} checkResult - Result from checkTransactionAgainstBudget
 * @returns {Object} Error details or null if allowed
 */
export const showBudgetError = (checkResult) => {
  if (checkResult.allowed) return null;
  
  const errorMessage = `⛔ BUDGET LIMIT EXCEEDED\n\n${checkResult.message}\n\nCategory: ${checkResult.details?.budgetCategory}\nCurrent Spent: $${checkResult.details?.currentSpent?.toFixed(2) || '0.00'}\nBudget Limit: $${checkResult.details?.budgetLimit?.toFixed(2) || '0.00'}\nThis Transaction: $${checkResult.details?.transactionAmount?.toFixed(2) || '0.00'}\nWould Be Total: $${checkResult.details?.wouldBeTotal?.toFixed(2) || '0.00'}\n\n${checkResult.details?.suggestion || 'Please reduce the amount or choose a different category.'}`;
  
  return {
    blocked: true,
    message: errorMessage,
    details: checkResult.details
  };
};