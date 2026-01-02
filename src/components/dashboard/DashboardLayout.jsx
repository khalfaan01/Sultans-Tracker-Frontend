// src/components/dashboard/DashboardLayout.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BarChart3, Target, Shield, CreditCard, User, LogOut, Clock, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts';

// Dashboard pages
import HomePage from '../../pages/HomePage';
import AnalyticsPage from './AnalyticsPage';
import BudgetsPage from './BudgetsPage';
import GoalsPage from './GoalsPage';
import SecurityAnalyticsPage from './SecurityAnalyticsPage';
import TransactionsMain from './TransactionsMain';
import DebtList from '../debt/DebtList';

const navigationItems = [
  { name: 'Home', icon: Home, path: '/dashboard', component: HomePage },
  { name: 'Analytics', icon: BarChart3, path: '/dashboard/analytics', component: AnalyticsPage },
  { name: 'Budgets', icon: Target, path: '/dashboard/budgets', component: BudgetsPage },
  { name: 'Goals', icon: Target, path: '/dashboard/goals', component: GoalsPage },
  { name: 'Transactions', icon: CreditCard, path: '/dashboard/transactions', component: TransactionsMain },
  { name: 'Debt Management', icon: DollarSign, path: '/dashboard/debts', component: DebtList },
  { name: 'Security', icon: Shield, path: '/dashboard/security', component: SecurityAnalyticsPage },
];

export default function DashboardLayout() {
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: {},
    amountRange: {},
    type: 'all'
  });
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sessionTime, setSessionTime] = useState('');
  const dropdownRef = useRef(null);

  const { 
    isAuthenticated, 
    loading: authLoading, 
    logout, 
    updateLastActivity,
    error: authError 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Use useCallback for the function
  const getActiveTabFromPath = useCallback(() => {
    const currentPath = location.pathname;
    
    // Special handling for Home (exact match only)
    if (currentPath === '/dashboard' || currentPath === '/dashboard/') {
      return 'Home';
    }
    
    // Check other routes
    for (const item of navigationItems) {
      if (item.name === 'Home') continue; // Skip Home check
      
      // Check if current path starts with item path
      if (currentPath.startsWith(item.path)) {
        return item.name;
      }
    }
    
    return 'Home'; // Default fallback
  }, [location.pathname]); // Only depend on location.pathname

  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath());

  useEffect(() => {
    const tab = getActiveTabFromPath();
    setActiveTab(tab);
  }, [getActiveTabFromPath, location.pathname]);

  const updateSessionTime = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      try {
        const timeDiff = Date.now() - parseInt(loginTime, 10);
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        setSessionTime(`${hours}h ${minutes}m`);
      } catch (error) {
        setSessionTime('0h 0m');
      }
    }
  };

  const safeUpdateActivity = () => {
    try {
      if (updateLastActivity) {
        updateLastActivity();
      } else {
        localStorage.setItem('lastActivity', Date.now().toString());
      }
    } catch (error) {
      // Silently handle activity update errors to prevent UI disruption
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      updateSessionTime();
      const timer = setInterval(updateSessionTime, 60000);
      
      const updateActivity = () => safeUpdateActivity();
      const events = ['click', 'keypress', 'scroll'];
      
      events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
      });

      return () => {
        clearInterval(timer);
        events.forEach(event => {
          document.removeEventListener(event, updateActivity);
        });
      };
    }
  }, [isAuthenticated]);

  const handleGoToMainPage = () => {
    console.log('Navigating to main page');
    navigate('/');
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    console.log('Logging out');
    try {
      logout('User manually logged out');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // Show error state if authentication check fails
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">Authentication Error</div>
          <div className="text-gray-600 mb-4">Unable to verify your session. Please try again.</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed header with user controls */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold" aria-label="Dashboard title">Dashboard</h1>
            <div className="flex items-center space-x-4">
              {/* Session timer display */}
              <div className="flex items-center space-x-2 text-sm text-gray-600" aria-label={`Current session duration: ${sessionTime}`}>
                <Clock size={16} aria-hidden="true" />
                <span>Session: {sessionTime}</span>
              </div>
              
              {/* User dropdown menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <User size={20} aria-hidden="true" />
                  <span>Account</span>
                </button>
                
                {/* Dropdown menu with animated reveal */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50"
                    role="menu"
                    aria-label="User account menu"
                  >
                    {/* Session info section */}
                    <div className="px-4 py-2 text-xs text-gray-500 border-b" role="none">
                      Session: {sessionTime}
                    </div>
                    
                    {/* Main page navigation */}
                    <button
                      onClick={handleGoToMainPage}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                      role="menuitem"
                    >
                      <User size={16} aria-hidden="true" />
                      <span>Go to Main Page</span>
                    </button>
                    
                    {/* Visual separator */}
                    <div className="border-t my-1" role="separator" aria-hidden="true"></div>
                    
                    {/* Logout action */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:bg-red-50"
                      role="menuitem"
                      aria-label="Log out of your account"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout container */}
      <div className="flex">
        {/* Fixed sidebar navigation */}
        <nav className="w-64 bg-white min-h-screen border-r sticky top-16 z-20" aria-label="Main navigation">
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 ${
                  activeTab === item.name 
                    ? 'bg-black text-white focus:ring-white' 
                    : 'hover:bg-gray-100 focus:bg-gray-100'
                }`}
                aria-current={activeTab === item.name ? 'page' : undefined}
                aria-label={`Navigate to ${item.name}`}
              >
                <item.icon size={20} aria-hidden="true" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main content area */}
        <main className="flex-1 p-6 min-h-[calc(100vh-80px)]" role="main">
          
          {/* Route configuration - all paths relative to /dashboard */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/debts" element={<DebtList />} />
            <Route path="/security" element={<SecurityAnalyticsPage />} />
            <Route path="/transactions/*" element={<TransactionsMain filters={filters} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}