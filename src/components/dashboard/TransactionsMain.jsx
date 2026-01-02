// TransactionsMain.jsx
import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  List, Calendar, TrendingUp, Repeat, Compass, ArrowLeft 
} from 'lucide-react';

// Import all transaction components
import TransactionsPage from './TransactionsPage';
import TransactionList from '../transactions/TransactionList';
import CalendarView from './CalendarView';
import TransactionHeatmap from '../transactions/TransactionHeatmap';
import RecurringTransactions from './RecurringTransactions';
import CashCompass from './CashCompass';

// Configuration for transaction sub-pages
const transactionSubPages = [
  { name: 'Overview', path: '/dashboard/transactions', icon: List, component: TransactionsPage },
  { name: 'All Transactions', path: '/dashboard/transactions/list', icon: List, component: TransactionList },
  { name: 'Calendar View', path: '/dashboard/transactions/calendar', icon: Calendar, component: CalendarView },
  { name: 'Spending Heatmap', path: '/dashboard/transactions/heatmap', icon: TrendingUp, component: TransactionHeatmap },
  { name: 'Recurring', path: '/dashboard/transactions/recurring', icon: Repeat, component: RecurringTransactions },
  { name: 'Cash Compass', path: '/dashboard/transactions/cash-compass', icon: Compass, component: CashCompass },
];

export default function TransactionsMain({ filters = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSubPage, setActiveSubPage] = useState('Overview');
  const [error, setError] = useState(null);

  // Safely determine the active subpage based on current URL
  const getActiveSubPage = useCallback(() => {
    try {
      const currentPath = location.pathname;
      const subPage = transactionSubPages.find(item => currentPath === item.path);
      return subPage ? subPage.name : 'Overview';
    } catch (err) {
      console.error('Error determining active subpage:', err);
      setError('Navigation error occurred');
      return 'Overview';
    }
  }, [location.pathname]);

  // Update active subpage when location changes
  useEffect(() => {
    try {
      setActiveSubPage(getActiveSubPage());
    } catch (err) {
      console.error('Error updating active subpage:', err);
    }
  }, [location.pathname, getActiveSubPage]);

  const handleSubNavigation = useCallback((path) => {
    try {
      navigate(path);
      setActiveSubPage(getActiveSubPage());
      setError(null); // Clear errors on successful navigation
    } catch (err) {
      console.error('Navigation error:', err);
      setError('Failed to navigate to selected page');
    }
  }, [navigate, getActiveSubPage]);

  const isRootTransactions = location.pathname === '/dashboard/transactions';

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!isRootTransactions && (
            <button
              onClick={() => navigate('/dashboard/transactions')}
              className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors disabled:opacity-50"
              aria-label="Back to transactions overview"
            >
            </button>
          )}
          
        </div>
      </div>

      {/* Dashboard View with Feature Cards */}
      {isRootTransactions && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Management</h3>
          <p className="text-gray-600 mb-6">
            Manage and analyze your financial transactions with powerful tools and insights.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transactionSubPages.map((page) => {
              const Icon = page.icon;
              const description = {
                'Overview': 'Quick view of recent transactions',
                'All Transactions': 'Detailed transaction list',
                'Calendar View': 'Visual spending calendar',
                'Spending Heatmap': 'Yearly spending patterns',
                'Recurring': 'Manage automated transactions',
                'Cash Compass': 'Spending insights & guidance'
              }[page.name] || 'Transaction management tool';

              return (
                <motion.button
                  key={page.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubNavigation(page.path)}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors text-left disabled:opacity-50"
                  disabled={error} // Disable buttons if there's an error
                  aria-label={`Navigate to ${page.name}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={20} className="text-gray-600" />
                    <div>
                      <h4 className="font-semibold">{page.name}</h4>
                      <p className="text-sm text-gray-600">
                        {description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction Sub-routes with Error Boundary */}
      <div className="min-h-[400px]">
        <Routes>
          <Route path="/" element={<TransactionsPage filters={filters} />} />
          <Route path="/list" element={<TransactionList />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/heatmap" element={<TransactionHeatmap />} />
          <Route path="/recurring" element={<RecurringTransactions />} />
          <Route path="/cash-compass" element={<CashCompass />} />
        </Routes>
      </div>

      {/* Sub-navigation Bar for non-root pages */}
      {!isRootTransactions && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex space-x-1 overflow-x-auto">
            {transactionSubPages.map((page) => (
              <button
                key={page.name}
                onClick={() => handleSubNavigation(page.path)}
                disabled={error}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 ${
                  activeSubPage === page.name 
                    ? 'bg-black text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                aria-current={activeSubPage === page.name ? 'page' : undefined}
              >
                {page.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}