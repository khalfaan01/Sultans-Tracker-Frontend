// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

// Session timeout set to 24 hours (in milliseconds)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Provider component that manages authentication state and session management
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Authentication context provider
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated,setIsAuthenticated] = useState(false);

  /**
   * Checks if session has timed out based on login time and last activity
   * @returns {boolean} True if session has timed out
   */
  const checkSessionTimeout = () => {
    const loginTime = localStorage.getItem('loginTime');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (loginTime && lastActivity) {
      const timeSinceLogin = Date.now() - parseInt(loginTime);
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      
      // Log out if either total session time or idle time exceeds timeout
      if (timeSinceLogin > SESSION_TIMEOUT || timeSinceActivity > SESSION_TIMEOUT) {
        logout('Session timeout');
        return true;
      }
    }
    return false;
  };

  /**
   * Updates the last activity timestamp in localStorage
   */
  const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  /**
   * Sets up cleanup handler for when the window/tab is closed
   * @returns {Function} Cleanup function to remove event listener
   */
  const setupBeforeUnload = () => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  };

  /**
   * Sets up activity tracking for user interactions to detect idle time
   * @returns {Function} Cleanup function to remove event listeners
   */
  const setupActivityTracking = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const updateActivity = () => updateLastActivity();
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  };

  /**
   * Sets up interval to periodically check for session timeout
   * @returns {Function} Cleanup function to clear interval
   */
  const setupSessionChecker = () => {
    const interval = setInterval(() => {
      checkSessionTimeout();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  };

  /**
   * Logs out the user and clears all authentication data
   * @param {string} reason - Reason for logout (for logging purposes)
   */
  const logout = (reason = 'User initiated') => {
    console.log(` Auth - Logging out: ${reason}`);
    
    // Clear all auth-related storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('lastActivity');
    
    // Clear session storage flags
    sessionStorage.removeItem('visitedLandingPage');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false); 
    
    // Use a small delay to ensure state updates
    setTimeout(() => {
      // Force full page reload to reset all state
      window.location.href = '/';
    }, 100);
  };

  // Effect for initial authentication check and session setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      if (checkSessionTimeout()) return;
      
      // Restore user session from localStorage
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      updateLastActivity();
      
      // Set up all session management handlers
      const cleanupBeforeUnload = setupBeforeUnload();
      const cleanupActivityTracking = setupActivityTracking();
      const cleanupSessionChecker = setupSessionChecker();

      setLoading(false);
      
      // Cleanup all event listeners on unmount
      return () => {
        cleanupBeforeUnload();
        cleanupActivityTracking();
        cleanupSessionChecker();
      };
    } else {
      setLoading(false);
      setIsAuthenticated(false)
    }
  }, []);

  /**
   * Authenticates user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object with success status and data/error
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      const responseData = await authAPI.login(email, password);
      
      if (!responseData.accessToken) {
        throw new Error('No access token received');
      }
      
      const { accessToken, refreshToken, user: userData } = responseData;
      
      // Store auth data in localStorage
      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      localStorage.setItem('lastActivity', Date.now().toString());
      
      // Initialize session management
      setupBeforeUnload();
      setupActivityTracking();
      setupSessionChecker();
      
      setUser(userData);
      setIsAuthenticated(true); 
      setLoading(false); 
      
      return { success: true, data: responseData };
    } catch (error) {
      setLoading(false); 
      setIsAuthenticated(false); 

      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Result object with success status and data/error
   */
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.register(name, email, password);
      return { success: true, data: response };
    } catch (error) {
      let errorMessage = 'Registration failed';
      
      // Handle different error response formats
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    updateLastActivity,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};