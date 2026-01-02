// HamburgerNav.jsx
// Collapsible hamburger menu with authentication-aware navigation items

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, UserPlus, LogOut, User} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function HamburgerNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Safely handle logout with error catching
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsOpen(false);
      navigate('/');
    }
  };

  const handleNavigation = (path) => {
    if (!path || typeof path !== 'string') {
      console.warn('Invalid navigation path');
      return;
    }
    navigate(path);
    setIsOpen(false);
  };

  // Define menu items based on authentication state
  const menuItems = isAuthenticated 
    ? [
        { icon: User, label: 'Dashboard', path: '/dashboard', action: () => handleNavigation('/dashboard') },
        { icon: LogOut, label: 'Logout', action: handleLogout, isDestructive: true }
      ]
    : [
        { icon: LogIn, label: 'Login', path: '/login', action: () => handleNavigation('/login') },
        { icon: UserPlus, label: 'Register', path: '/register', action: () => handleNavigation('/register') }
      ];

  // Handle Escape key to close menu
  useState(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <motion.button
        className="fixed top-6 left-6 z-50 p-3 bg-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 p-6"
            aria-label="Navigation menu"
            role="dialog"
            aria-modal="true"
          >
            <nav className="mt-20 space-y-4">
              {/* User info section for authenticated users */}
              {isAuthenticated && user && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                  <p className="font-semibold text-gray-800">Welcome back!</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  {user.lastLoginFrom && (
                    <p className="text-xs text-gray-500 mt-1">Last login: {user.lastLoginFrom}</p>
                  )}
                </div>
              )}
              
              {/* Navigation items */}
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-100 rounded-lg transition-colors text-left ${
                    item.isDestructive ? 'text-red-600 hover:bg-red-50' : ''
                  }`}
                  whileHover={{ x: 10 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  aria-label={item.label}
                >
                  <item.icon size={20} className={item.isDestructive ? 'text-red-600' : ''} />
                  <span className={`font-medium ${item.isDestructive ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}