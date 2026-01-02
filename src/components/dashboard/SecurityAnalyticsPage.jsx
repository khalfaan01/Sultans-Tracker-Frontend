// src/components/dashboard/SecurityAnalyticsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, MapPin, Clock, Eye, 
  TrendingUp, Users, Globe, Cpu, Mail, Bell,
  Wifi, WifiOff, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { useSocket } from '../../contexts';
import { securityAPI } from '../../services/api';
import AlertNotification from '../ui/AlertNotification';

/**
 * Comprehensive security monitoring dashboard with real-time threat detection
 * 
 * Features:
 * - Real-time security event monitoring via WebSocket connections
 * - Suspicious transaction detection with risk scoring
 * - Geographic login tracking and anomaly detection
 * - Interactive security testing and simulation capabilities
 * - Automated alert systems with configurable notification preferences
 * 
 * Security Domains:
 * 1. Authentication Security: Login attempt tracking and location validation
 * 2. Transaction Security: Fraud detection for financial transactions
 * 3. Session Security: Active session monitoring and geographic tracking
 * 4. System Security: Connection health and real-time monitoring status
 * 
 * Real-time Integration:
 * - WebSocket connection for instant security event notifications
 * - Automated data refresh with configurable intervals
 * - Manual testing capabilities for security rule validation
 * 
 * Error Handling:
 * - Graceful degradation when security services are unavailable
 * - Connection state monitoring with visual indicators
 * - Fallback data structures for uninterrupted UI experience
 */

// ==================== SUB-COMPONENTS ====================

/**
 * Reusable security metric card with trend indicator
 */
const SecurityCard = ({ icon, title, value, trend, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white p-6 rounded-lg shadow-sm border"
    role="article"
    aria-label={`${title}: ${value}, ${trend}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className={`text-sm mt-1 ${
          color === 'red' ? 'text-red-600' :
          color === 'orange' ? 'text-orange-600' :
          color === 'blue' ? 'text-blue-600' :
          color === 'green' ? 'text-green-600' : 'text-gray-600'
        }`}>
          {trend}
        </p>
      </div>
      {icon}
    </div>
  </motion.div>
);

/**
 * Individual security event display component
 */
const SecurityEvent = ({ event }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" role="listitem">
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 rounded-full ${
        event.riskLevel === 'high' ? 'bg-red-500' : 
        event.riskLevel === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
      }`} aria-hidden="true" />
      <div>
        <p className="font-medium capitalize">{event.type.replace('_', ' ')}</p>
        <p className="text-sm text-gray-500">{event.description}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-500">{event.time}</p>
      <p className="text-xs text-gray-400">{event.ip}</p>
    </div>
  </div>
);

/**
 * Geographic location display component for login tracking
 */
const LocationItem = ({ location }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" role="listitem">
    <div className="flex items-center space-x-3">
      <Globe size={16} className="text-gray-400" aria-hidden="true" />
      <div>
        <p className="font-medium">{location.city}, {location.country}</p>
        <p className="text-sm text-gray-500">{location.ip}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-500">{location.lastLogin}</p>
      <p className={`text-xs ${
        location.trusted ? 'text-green-600' : 'text-orange-600'
      }`}>
        {location.trusted ? 'Trusted' : 'New Location'}
      </p>
    </div>
  </div>
);

/**
 * Suspicious transaction display with risk scoring visualization
 */
const SuspiciousTransaction = ({ transaction }) => (
  <div className="p-4 flex justify-between items-center hover:bg-gray-50" role="listitem">
    <div className="flex items-center space-x-4">
      <AlertTriangle size={20} className="text-red-500" aria-hidden="true" />
      <div>
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">{transaction.description}</h3>
          <span className={`px-2 py-1 rounded-full text-xs ${
            transaction.riskScore > 80 ? 'bg-red-100 text-red-800' :
            transaction.riskScore > 60 ? 'bg-orange-100 text-orange-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            Risk: {transaction.riskScore}%
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
        </p>
        <p className="text-sm text-red-600">{transaction.fraudReason}</p>
      </div>
    </div>
    
    <div className="text-right">
      <div className="text-lg font-semibold text-red-600">
        -${Math.abs(transaction.amount).toFixed(2)}
      </div>
      <p className="text-sm text-gray-500">{transaction.time}</p>
    </div>
  </div>
);

/**
 * Daily login statistics summary component
 */
const DailyLoginStats = ({ stats }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border" role="region" aria-label="Today's login activity">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <Users className="mr-2" size={20} aria-hidden="true" />
      Today's Login Activity
    </h3>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Attempts</div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1">
          <CheckCircle size={16} className="text-green-500" aria-hidden="true" />
          <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
        </div>
        <div className="text-sm text-gray-600">Successful</div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1">
          <XCircle size={16} className="text-red-500" aria-hidden="true" />
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="text-sm text-gray-600">Failed</div>
      </div>
    </div>
    {stats.failed > 0 && (
      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg" role="alert">
        <p className="text-sm text-red-700 text-center">
           {stats.failed} failed login attempt{stats.failed > 1 ? 's' : ''} today
        </p>
      </div>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================

export default function SecurityAnalyticsPage() {
  // State management for security data and UI controls
  const [securityData, setSecurityData] = useState({
    loginAttempts: [],
    suspiciousTransactions: [],
    securityEvents: [],
    ipLocations: [],
    riskScore: 0,
    todayLoginStats: {
      total: 0,
      successful: 0,
      failed: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState(null);
  
  // Real-time WebSocket context
  const { socket, isConnected, securityAlerts, clearAlerts } = useSocket();
  const refreshIntervalRef = useRef(null);

  /**
   * Initializes component with security data and sets up real-time monitoring
   */
  useEffect(() => {
    loadSecurityData();
    setupAutoRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  /**
   * Updates security events when new WebSocket alerts are received
   */
  useEffect(() => {
    if (securityAlerts.length > 0) {
      setSecurityData(prev => ({
        ...prev,
        securityEvents: [
          ...securityAlerts.map(alert => ({
            type: alert.type,
            description: alert.message,
            riskLevel: alert.riskScore > 80 ? 'high' : 
                      alert.riskScore > 60 ? 'medium' : 'low',
            time: new Date(alert.timestamp).toLocaleString(),
            ip: alert.ip
          })),
          ...prev.securityEvents
        ].slice(0, 20) // Keep last 20 events for performance
      }));
    }
  }, [securityAlerts]);

  /**
   * Loads security overview data from API with error handling
   * Provides fallback data when API is unavailable
   */
  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await securityAPI.getSecurityOverview();
      setSecurityData(data);
    } catch (err) {
      console.error('Failed to load security data:', err);
      setError('Unable to load security data. Using limited functionality.');
      
      // Fallback data to maintain UI functionality
      setSecurityData(prev => ({
        ...prev,
        todayLoginStats: {
          total: 0,
          successful: 0,
          failed: 0
        },
        ipLocations: [{
          ip: 'Current Session',
          city: 'Cape Town',
          country: 'South Africa',
          lastLogin: 'Now',
          trusted: true
        }]
      }));
      
      // Handle authentication errors
      if (err.response?.status === 403 || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manually refreshes security data with user feedback
   */
  const handleRefreshData = async () => {
    await loadSecurityData();
    alert('Security data refreshed!');
  };

  /**
   * Clears active security alerts with confirmation
   */
  const handleClearAlerts = () => {
    const alertCount = securityAlerts.length;
    clearAlerts();
    if (alertCount > 0) {
      alert(`Cleared ${alertCount} active alerts!`);
    } else {
      alert('No active alerts to clear.');
    }
  };

  /**
   * Configures automatic data refresh based on user preference
   */
  const setupAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadSecurityData();
      }, 30000); // Refresh every 30 seconds
    }
  };

  /**
   * Toggles email alert preferences
   */
  const toggleEmailAlerts = async () => {
    try {
      await securityAPI.updateAlertPreferences({
        emailAlerts: !emailAlertsEnabled
      });
      setEmailAlertsEnabled(!emailAlertsEnabled);
      alert(`Email alerts ${!emailAlertsEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update alert preferences:', err);
      alert('Failed to update alert preferences');
    }
  };

  /**
   * Tests real-time security monitoring with simulated transaction
   */
  const testRealTimeConnection = async () => {
    try {
      // Generate randomized test transaction for realistic testing
      const testAmount = Math.floor(Math.random() * 2000) + 500;
      const testCategories = ['Electronics', 'Jewelry', 'Travel', 'Cryptocurrency', 'Luxury Goods'];
      const randomCategory = testCategories[Math.floor(Math.random() * testCategories.length)];
      
      const result = await securityAPI.monitorTransaction({
        amount: testAmount,
        type: 'expense',
        category: randomCategory,
        description: `Test Security Monitoring - ${randomCategory} Purchase`,
        timestamp: new Date()
      });

      if (result.riskScore > 60) {
        alert(`Suspicious Activity Detected!\nRisk Score: ${result.riskScore}%\nAnomalies: ${result.anomalies?.join(', ') || 'None'}`);
      } else {
        alert(`Transaction monitored - Normal activity\nRisk Score: ${result.riskScore}%`);
      }

      await loadSecurityData();
      
    } catch (err) {
      console.error('Security test failed:', err);
      alert('Real-time monitoring test failed. Please check your connection.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error state notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
          <button
            onClick={loadSecurityData}
            className="ml-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Real-time Alert Notifications */}
      <AlertNotification 
        alerts={securityAlerts} 
        onDismiss={clearAlerts}
      />

      {/* Dashboard header with connection status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Shield className="text-blue-600" size={32} aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold">Security Analytics</h2>
            <p className="text-gray-600">Monitor suspicious activity in real-time</p>
          </div>
        </div>
        
        {/* Connection and control panel */}
        <div className="flex items-center space-x-4">
          {/* Connection status indicator */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-sm">
              {isConnected ? 'Real-time Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Email alerts toggle */}
          <button
            onClick={toggleEmailAlerts}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
              emailAlertsEnabled 
                ? 'bg-green-100 text-green-700 border-green-300' 
                : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
            aria-label={`Email alerts: ${emailAlertsEnabled ? 'ON' : 'OFF'}`}
          >
            <Mail size={16} aria-hidden="true" />
            <span>Email Alerts: {emailAlertsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
              autoRefresh 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
            aria-label={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Real-time status metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {securityAlerts.length}
              </p>
            </div>
            <Bell className="text-red-500" size={24} aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Real-time Status</p>
              <p className={`text-lg font-bold ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </p>
            </div>
            {isConnected ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Connection</p>
              <p className="text-lg font-bold text-blue-600">
                {socket?.id ? socket.id.substring(0, 8) + '...' : 'N/A'}
              </p>
            </div>
            <Cpu className="text-blue-500" size={24} aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Last Update</p>
              <p className="text-lg font-bold text-gray-700">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <Clock className="text-gray-500" size={24} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Daily login statistics */}
      <DailyLoginStats stats={securityData.todayLoginStats} />

      {/* Security metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SecurityCard
          icon={<AlertTriangle className="text-red-500" />}
          title="High Risk Events"
          value={securityData.securityEvents.filter(e => e.riskLevel === 'high').length}
          trend="This week"
          color="red"
        />
        <SecurityCard
          icon={<TrendingUp className="text-orange-500" />}
          title="Suspicious Transactions"
          value={securityData.suspiciousTransactions.length}
          trend="Total flagged"
          color="orange"
        />
        <SecurityCard
          icon={<Users className="text-blue-500" />}
          title="Today's Logins"
          value={`${securityData.todayLoginStats.successful}/${securityData.todayLoginStats.total}`}
          trend={`${securityData.todayLoginStats.failed} failed`}
          color="blue"
        />
        <SecurityCard
          icon={<Globe className="text-green-500" />}
          title="Current Location"
          value={securityData.ipLocations[0]?.country || 'Unknown'}
          trend={securityData.ipLocations[0]?.city || 'Unknown'}
          color="green"
        />
      </div>

      {/* Interactive controls panel */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Real-time Monitoring</h3>
        <div className="flex space-x-4">
          <button
            onClick={testRealTimeConnection}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Test security monitoring"
          >
            Test Security Monitoring
          </button>
          <button
            onClick={handleRefreshData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Refresh security data"
          >
            Refresh Data
          </button>
          <button
            onClick={handleClearAlerts}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={`Clear ${securityAlerts.length} alerts`}
          >
            Clear Alerts ({securityAlerts.length})
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Test button sends random transactions to test fraud detection
        </p>
      </div>

      {/* Main security dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent security events panel */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="mr-2" size={20} aria-hidden="true" />
            Recent Security Events
          </h3>
          <div className="max-h-80 overflow-y-auto">
            <div className="space-y-3 pr-2" role="list" aria-label="Security events list">
              {securityData.securityEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 text-gray-300" aria-hidden="true" />
                  <p>No security events yet</p>
                  <p className="text-sm">Security events will appear here when detected</p>
                </div>
              ) : (
                securityData.securityEvents.slice(0, 20).map((event, index) => (
                  <SecurityEvent key={index} event={event} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Login locations panel */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MapPin className="mr-2" size={20} aria-hidden="true" />
            Login Locations
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-3 pr-2" role="list" aria-label="Login locations list">
              {securityData.ipLocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin size={32} className="mx-auto mb-2 text-gray-300" aria-hidden="true" />
                  <p>No login locations recorded</p>
                  <p className="text-sm">Login locations will appear here</p>
                </div>
              ) : (
                securityData.ipLocations.map((location, index) => (
                  <LocationItem key={index} location={location} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Suspicious transactions table (full width) */}
        <div className="bg-white rounded-lg shadow-sm border lg:col-span-2">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="mr-2" size={20} aria-hidden="true" />
                Suspicious Transactions
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Total: {securityData.suspiciousTransactions.length}
                </span>
                {securityData.suspiciousTransactions.length > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    {securityData.suspiciousTransactions.filter(tx => tx.riskScore > 80).length} High Risk
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y">
              {securityData.suspiciousTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Eye size={32} className="mx-auto mb-2 text-gray-300" aria-hidden="true" />
                  <p>No suspicious transactions</p>
                  <p className="text-sm">Flagged transactions will appear here when detected</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Transaction</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Date & Time</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Risk Level</th>
                      <th className="text-right p-4 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityData.suspiciousTransactions.map((transaction, index) => (
                      <tr key={transaction.id || index} className="hover:bg-gray-50 border-b">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle 
                              size={18} 
                              className={
                                transaction.riskScore > 80 ? 'text-red-500' :
                                transaction.riskScore > 60 ? 'text-orange-500' : 'text-yellow-500'
                              } 
                              aria-hidden="true"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {transaction.description || 'No description'}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 max-w-md">
                                {transaction.fraudReason || 'Suspicious activity detected'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          <div>{new Date(transaction.date).toLocaleDateString()}</div>
                          <div>{transaction.time || new Date(transaction.date).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              transaction.riskScore > 80 ? 'bg-red-500' :
                              transaction.riskScore > 60 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`} aria-hidden="true" />
                            <span className={`text-sm font-medium ${
                              transaction.riskScore > 80 ? 'text-red-700' :
                              transaction.riskScore > 60 ? 'text-orange-700' : 'text-yellow-700'
                            }`}>
                              {transaction.riskScore > 80 ? 'High' :
                               transaction.riskScore > 60 ? 'Medium' : 'Low'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({transaction.riskScore}%)
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-lg font-semibold text-red-600">
                            -${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.account?.name || 'Main Account'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          {/* Table summary footer */}
          {securityData.suspiciousTransactions.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full" aria-hidden="true"></div>
                    <span>High Risk ({securityData.suspiciousTransactions.filter(tx => tx.riskScore > 80).length})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" aria-hidden="true"></div>
                    <span>Medium Risk ({securityData.suspiciousTransactions.filter(tx => tx.riskScore > 60 && tx.riskScore <= 80).length})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" aria-hidden="true"></div>
                    <span>Low Risk ({securityData.suspiciousTransactions.filter(tx => tx.riskScore <= 60).length})</span>
                  </div>
                </div>
                <button
                  onClick={() => alert('Export feature coming soon!')}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Export security report"
                >
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security tips section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <Shield className="mr-2" size={20} aria-hidden="true" />
          Security Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Monitor Login Activity</h4>
            <p className="text-sm text-blue-600">
              Regularly check your login locations and report any unfamiliar locations immediately.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Review Suspicious Transactions</h4>
            <p className="text-sm text-blue-600">
              Flagged transactions are automatically detected. Review them regularly for unauthorized activity.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Enable Real-time Alerts</h4>
            <p className="text-sm text-blue-600">
              Keep real-time monitoring enabled to receive immediate notifications of suspicious activity.
            </p>
          </div>
        </div>
      </div>

      {/* Last updated footer */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p className="mt-1">Security analytics refresh automatically every {autoRefresh ? '30 seconds' : 'manual refresh'}</p>
      </div>
    </div>
  );
}