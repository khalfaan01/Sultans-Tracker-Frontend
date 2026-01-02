// AlertNotification.jsx
// Displays animated security alert notifications with risk-based styling

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, Bell, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function AlertNotification({ alerts, onDismiss }) {
  // Request browser notification permission once on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'suspicious_transaction':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'unusual_login':
        return <Shield className="text-orange-500" size={20} />;
      case 'high_risk_activity':
        return <Bell className="text-red-500" size={20} />;
      default:
        return <Bell className="text-blue-500" size={20} />;
    }
  };

  const getAlertColor = (riskScore) => {
    if (riskScore > 80) return 'border-red-500 bg-red-50';
    if (riskScore > 60) return 'border-orange-500 bg-orange-50';
    return 'border-yellow-500 bg-yellow-50';
  };

  const getAlertTitle = (type) => {
    const titles = {
      suspicious_transaction: 'Suspicious Transaction',
      unusual_login: 'Unusual Login',
      high_risk_activity: 'High Risk Activity'
    };
    return titles[type] || 'Alert';
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {alerts.map((alert, index) => {
          // Use timestamp as primary key, fallback to index for stability
          const uniqueKey = alert.timestamp ? `${alert.timestamp}-${index}` : index;
          
          return (
            <motion.div
              key={uniqueKey}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, type: "spring" }}
              className={`p-4 rounded-lg border-l-4 shadow-lg ${getAlertColor(alert.riskScore)}`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">
                      {getAlertTitle(alert.type)}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.riskScore > 80 ? 'bg-red-100 text-red-800' :
                        alert.riskScore > 60 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Risk: {alert.riskScore}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(index)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}