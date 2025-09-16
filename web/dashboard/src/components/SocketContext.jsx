import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { validateWebSocketMessage } from '../lib/validation';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastError, setLastError] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp
    };
    
    setLogs(prevLogs => {
      const newLogs = [logEntry, ...prevLogs];
      // Keep only the last 100 logs to prevent memory issues
      return newLogs.slice(0, 100);
    });
  }, []);

  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Queue message for when connection is restored
      setMessageQueue(prev => [...prev, message]);
      addLog('Message queued - WebSocket not connected', 'warning');
      return false;
    }

    try {
      // Validate message before sending
      const validation = validateWebSocketMessage(message);
      if (!validation.isValid) {
        addLog(`Invalid message format: ${validation.error}`, 'error');
        setLastError(validation.error);
        return false;
      }

      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageStr);
      addLog(`Sent: ${messageStr}`, 'info');
      return true;
    } catch (error) {
      addLog(`Failed to send message: ${error.message}`, 'error');
      setLastError(error.message);
      return false;
    }
  }, [addLog]);

  const processMessageQueue = useCallback(() => {
    if (messageQueue.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      const messages = [...messageQueue];
      setMessageQueue([]);
      
      messages.forEach(message => {
        sendMessage(message);
      });
      
      addLog(`Processed ${messages.length} queued messages`, 'info');
    }
  }, [messageQueue, sendMessage, addLog]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      setConnectionStatus('connecting');
      addLog('Attempting to connect to arbitrage engine...', 'info');
      
      const ws = new WebSocket('ws://localhost:8768');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Connected to arbitrage engine WebSocket');
        setConnectionStatus('connected');
        setLastError(null);
        reconnectAttemptsRef.current = 0;
        addLog('Successfully connected to arbitrage engine', 'success');
        
        // Send initial commands
        sendMessage({ command: 'get_supported_assets' });
        sendMessage({ command: 'start_engine' });
        
        // Process any queued messages
        processMessageQueue();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Validate received message
          const validation = validateWebSocketMessage(data);
          if (!validation.isValid) {
            addLog(`Received invalid message: ${validation.error}`, 'warning');
            return;
          }
          
          // Process different message types
          if (data.log) {
            addLog(data.log, 'info');
          } else if (data.error) {
            addLog(`Server error: ${data.error}`, 'error');
            setLastError(data.error);
          } else if (data.supported_assets) {
            setSupportedAssets(data.supported_assets);
            addLog(`Received ${data.supported_assets.length} supported assets`, 'success');
          } else if (data.portfolio_data) {
            addLog('Portfolio data updated', 'info');
          } else if (data.trade_history) {
            addLog('Trade history updated', 'info');
          } else if (data.price_feeds) {
            addLog('Price feeds updated', 'info');
          } else if (data.performance_metrics) {
            addLog('Performance metrics updated', 'info');
          } else {
            // Handle any other message format
            addLog(`Received: ${event.data}`, 'info');
          }
        } catch (e) {
          // If it's not JSON, treat it as a plain log message
          addLog(event.data, 'info');
        }
      };
      
      ws.onclose = (event) => {
        console.log('Disconnected from arbitrage engine WebSocket', event);
        setConnectionStatus('disconnected');
        
        if (event.wasClean) {
          addLog('Connection closed cleanly', 'info');
        } else {
          addLog(`Connection lost (Code: ${event.code})`, 'warning');
          
          // Attempt to reconnect if not at max attempts
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            addLog(`Reconnecting in ${reconnectDelay/1000}s (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`, 'info');
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay);
          } else {
            addLog('Max reconnection attempts reached', 'error');
            setLastError('Connection failed after multiple attempts');
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        const errorMessage = 'WebSocket connection failed';
        addLog(errorMessage, 'error');
        setLastError(errorMessage);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      addLog(`Connection failed: ${error.message}`, 'error');
      setLastError(error.message);
    }
  }, [addLog, sendMessage, processMessageQueue]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    addLog('Disconnected by user', 'info');
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  }, [addLog]);

  const retry = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setLastError(null);
    connect();
  }, [connect]);

  // Initial connection
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  const value = {
    logs,
    supportedAssets,
    connectionStatus,
    lastError,
    messageQueue: messageQueue.length,
    sendMessage,
    connect,
    disconnect,
    retry,
    clearLogs,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error' || lastError !== null
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};