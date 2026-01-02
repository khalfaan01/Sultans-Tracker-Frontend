// SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

/**
 * Custom hook to access the WebSocket context
 * @returns {Object} Socket context value
 * @throws {Error} If used outside of SocketProvider
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * Provider component that manages WebSocket connections and real-time communication
 * Handles authentication, connection state, and security alerts
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Socket context provider
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const { user, isAuthenticated, logout } = useAuth();

  /**
   * Manages WebSocket lifecycle based on authentication state
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });

      // Handle successful connection
      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join_user_room', user.id);
      });

      // Handle disconnection
      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Handle connection errors (especially authentication failures)
      newSocket.on('connect_error', (error) => {
        if (error.message.includes('auth') || error.message.includes('401')) {
          logout('Socket authentication failed');
        }
      });

      // Listen for security alerts from server
      newSocket.on('security_alert', (alertData) => {
        setSecurityAlerts(prev => [alertData, ...prev.slice(0, 9)]);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('Security Alert', {
            body: alertData.message,
            icon: '/security-shield.png'
          });
        }
      });

      setSocket(newSocket);

      // Cleanup function to disconnect socket when component unmounts or dependencies change
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user, logout]);

  /**
   * Sends transaction data to server for real-time monitoring
   * @param {Object} transactionData - Transaction details to monitor
   */
  const sendTransactionForMonitoring = (transactionData) => {
    if (socket && isConnected) {
      socket.emit('monitor_transaction', transactionData);
    }
  };

  const value = {
    socket,
    isConnected,
    securityAlerts,
    clearAlerts: () => setSecurityAlerts([]),
    sendTransactionForMonitoring
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};