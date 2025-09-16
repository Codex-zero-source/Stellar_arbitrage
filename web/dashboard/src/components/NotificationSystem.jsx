import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/Alert';
import Button from './ui/Button';

// Notification context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Individual notification component
const NotificationItem = ({ notification, onDismiss }) => {
  const { id, type, title, message, duration, persistent, actions } = notification;

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          icon: '✅',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          textColor: 'text-emerald-300'
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          icon: '❌',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-300'
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          textColor: 'text-yellow-300'
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          textColor: 'text-blue-300'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`
      glass-panel p-4 rounded-lg border ${styles.borderColor} ${styles.bgColor}
      transform transition-all duration-300 ease-in-out
      hover:scale-105 hover:shadow-lg
    `}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{styles.icon}</span>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold ${styles.textColor} mb-1`}>
              {title}
            </h4>
          )}
          <p className="text-slate-300 text-sm leading-relaxed">
            {message}
          </p>
          
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    action.onClick();
                    if (action.dismissOnClick !== false) {
                      onDismiss(id);
                    }
                  }}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Notification container
export const NotificationContainer = ({ notifications = [], onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Notification provider
export const NotificationProvider = ({ children, maxNotifications = 5 }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      duration: 5000,
      persistent: false,
      ...notification,
      timestamp: Date.now()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      return updated.slice(0, maxNotifications);
    });

    return id;
  }, [maxNotifications]);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      duration: 6000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options
    });
  }, [addNotification]);

  // Handle API errors with detailed information
  const handleApiError = useCallback((error, context = '') => {
    let message = 'An unexpected error occurred';
    let title = 'Error';

    if (error?.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      title = `HTTP ${status} Error`;
      
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else {
        switch (status) {
          case 400:
            message = 'Invalid request. Please check your input.';
            break;
          case 401:
            message = 'Authentication required. Please log in.';
            break;
          case 403:
            message = 'Access denied. You don\'t have permission.';
            break;
          case 404:
            message = 'Resource not found.';
            break;
          case 429:
            message = 'Too many requests. Please try again later.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          default:
            message = `Request failed with status ${status}`;
        }
      }
    } else if (error?.message) {
      // JavaScript error
      message = error.message;
    }

    if (context) {
      title = `${title} - ${context}`;
    }

    return showError(message, { 
      title,
      persistent: true,
      actions: [
        {
          label: 'Retry',
          onClick: () => window.location.reload(),
          dismissOnClick: false
        }
      ]
    });
  }, [showError]);

  // Handle WebSocket connection errors
  const handleWebSocketError = useCallback((error) => {
    return showError('WebSocket connection failed. Real-time updates may not work.', {
      title: 'Connection Error',
      persistent: true,
      actions: [
        {
          label: 'Reconnect',
          onClick: () => window.location.reload()
        }
      ]
    });
  }, [showError]);

  const value = {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiError,
    handleWebSocketError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;