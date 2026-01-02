// MultiFilter.jsx
// Multi-criteria filter component for transaction data with collapsible UI

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown } from 'lucide-react';

export default function MultiFilter({ filters, onFiltersChange, activeTab = 'Transactions' }) {
  const [isOpen, setIsOpen] = useState(false);

  // Memoize filter configuration to prevent recreation on every render
  const filterTypes = useMemo(() => [
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'date-range'
    },
    {
      key: 'amountRange', 
      label: 'Amount Range',
      type: 'amount-range'
    },
    {
      key: 'categories',
      label: 'Categories',
      type: 'multi-select',
      options: ['Food', 'Travel', 'Entertainment', 'Rent', 'Shopping', 'Utilities', 'Healthcare', 'Other']
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select', 
      options: ['All', 'Income', 'Expense']
    }
  ], []);

  // Check if any filters are active to show the clear button
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) ||
      (filters.amountRange && (filters.amountRange.min || filters.amountRange.max)) ||
      (filters.categories && filters.categories.length > 0) ||
      (filters.type && filters.type !== 'all')
    );
  }, [filters]);

  // Only show filters for Transactions tab - after ALL hooks
  if (activeTab !== 'Transactions') {
    return null;
  }

  const handleDateRangeChange = (type, value) => {
    const newDateRange = { ...filters.dateRange, [type]: value };
    
    // Validate date range logic: end date cannot be before start date
    if (type === 'end' && filters.dateRange?.start && value) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(value);
      if (endDate < startDate) {
        console.warn('End date cannot be before start date');
        return;
      }
    }
    
    onFiltersChange({ ...filters, dateRange: newDateRange });
  };

  const handleAmountRangeChange = (type, value) => {
    const numericValue = parseFloat(value);
    
    // Validate amount range logic: min cannot exceed max
    if (type === 'min' && filters.amountRange?.max && numericValue > parseFloat(filters.amountRange.max)) {
      console.warn('Minimum amount cannot exceed maximum amount');
      return;
    }
    
    if (type === 'max' && filters.amountRange?.min && numericValue < parseFloat(filters.amountRange.min)) {
      console.warn('Maximum amount cannot be less than minimum amount');
      return;
    }
    
    const newAmountRange = { ...filters.amountRange, [type]: value || '' };
    onFiltersChange({ ...filters, amountRange: newAmountRange });
  };

  const clearFilter = (filterKey) => {
    onFiltersChange({ ...filters, [filterKey]: filterKey === 'categories' ? [] : null });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center flex-wrap gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Toggle filters"
          aria-expanded={isOpen}
        >
          <Filter size={20} />
          <span>Filters</span>
          <ChevronDown 
            size={16} 
            className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        
        {/* Active filters display */}
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (filters.dateRange.start || filters.dateRange.end) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full text-sm"
            >
              <span className="truncate max-w-xs">
                Date: {filters.dateRange.start || 'Any'} to {filters.dateRange.end || 'Any'}
              </span>
              <button 
                onClick={() => clearFilter('dateRange')} 
                className="hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                aria-label="Clear date filter"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
          
          {filters.amountRange && (filters.amountRange.min || filters.amountRange.max) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full text-sm"
            >
              <span>
                Amount: ${filters.amountRange.min || '0'} to ${filters.amountRange.max || 'Any'}
              </span>
              <button 
                onClick={() => clearFilter('amountRange')} 
                className="hover:text-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
                aria-label="Clear amount filter"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
          
          {filters.categories && filters.categories.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-purple-100 px-3 py-1 rounded-full text-sm"
            >
              <span>Categories: {filters.categories.length} selected</span>
              <button 
                onClick={() => clearFilter('categories')} 
                className="hover:text-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded"
                aria-label="Clear categories filter"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
          
          {filters.type && filters.type !== 'all' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full text-sm"
            >
              <span>Type: {filters.type}</span>
              <button 
                onClick={() => clearFilter('type')} 
                className="hover:text-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded"
                aria-label="Clear type filter"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 bg-white p-6 rounded-lg border shadow-sm overflow-hidden"
            role="region"
            aria-label="Filter options"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-3">Date Range</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.dateRange?.start || ''}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const today = new Date();
                        
                        // Prevent future dates
                        if (selectedDate > today) {
                          console.warn('Future dates are not allowed for filtering.');
                          return;
                        }
                        handleDateRangeChange('start', e.target.value);
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      aria-label="Filter by start date"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.dateRange?.end || ''}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const today = new Date();
                        
                        if (selectedDate > today) {
                          console.warn('Future dates are not allowed for filtering.');
                          return;
                        }
                        handleDateRangeChange('end', e.target.value);
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      aria-label="Filter by end date"
                    />
                  </div>
                </div>
              </div>

              {/* Amount Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-3">Amount Range</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.amountRange?.min || ''}
                      onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      aria-label="Minimum amount filter"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Any"
                      value={filters.amountRange?.max || ''}
                      onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      aria-label="Maximum amount filter"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Filter */}
              <div>
                <label className="block text-sm font-medium mb-3">Categories</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {filterTypes.find(f => f.key === 'categories').options.map(option => (
                    <label 
                      key={option} 
                      className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(option) || false}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...(filters.categories || []), option]
                            : filters.categories?.filter(cat => cat !== option);
                          onFiltersChange({...filters, categories: newCategories});
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        aria-label={`Filter by ${option} category`}
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-3">Type</label>
                <select
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  value={filters.type || 'all'}
                  onChange={(e) => onFiltersChange({...filters, type: e.target.value})}
                  aria-label="Filter by transaction type"
                >
                  {filterTypes.find(f => f.key === 'type').options.map(option => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => onFiltersChange({
                    dateRange: null,
                    amountRange: null,
                    categories: [],
                    type: 'all'
                  })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Clear all filters"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}