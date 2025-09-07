import React, { createContext, useContext, useState, useEffect } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Connect to the actual WebSocket server on port 8768
    const ws = new WebSocket('ws://localhost:8768');
    
    ws.onopen = () => {
      console.log('Connected to arbitrage engine WebSocket');
      setLogs(prevLogs => [...prevLogs, {type: 'info', content: 'Status: Connected to arbitrage engine'}]);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type && data.content) {
          // New structured message format
          setLogs(prevLogs => [...prevLogs, {type: data.type, content: data.content}]);
        } else if (data.log) {
          // Old format for backward compatibility
          setLogs(prevLogs => [...prevLogs, {type: 'log', content: data.log}]);
        } else if (data.error) {
          // Old format for backward compatibility
          setLogs(prevLogs => [...prevLogs, {type: 'error', content: data.error}]);
        } else {
          // Handle any other message format
          setLogs(prevLogs => [...prevLogs, {type: 'log', content: event.data}]);
        }
      } catch (e) {
        // If it's not JSON, treat it as a plain log message
        setLogs(prevLogs => [...prevLogs, {type: 'log', content: event.data}]);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from arbitrage engine WebSocket');
      setLogs(prevLogs => [...prevLogs, {type: 'info', content: 'Status: Disconnected from arbitrage engine'}]);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLogs(prevLogs => [...prevLogs, {type: 'error', content: 'Error: WebSocket connection failed'}]);
    };

    // Clean up the WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, []);

  const value = {
    logs,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};