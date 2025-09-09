import React, { createContext, useContext, useState, useEffect } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [supportedAssets, setSupportedAssets] = useState([]);

  useEffect(() => {
    // Connect to the actual WebSocket server
    const ws = new WebSocket('ws://localhost:8766');
    
    ws.onopen = () => {
      console.log('Connected to arbitrage engine WebSocket');
      setLogs(prevLogs => [...prevLogs, 'Status: Connected to arbitrage engine']);
      ws.send(JSON.stringify({ command: 'get_supported_assets' }));
      ws.send(JSON.stringify({ command: 'start_engine' }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.log) {
          setLogs(prevLogs => [...prevLogs, data.log]);
        } else if (data.error) {
          setLogs(prevLogs => [...prevLogs, `Error: ${data.error}`]);
        } else if (data.supported_assets) {
          setSupportedAssets(data.supported_assets);
        } else {
          // Handle any other message format
          setLogs(prevLogs => [...prevLogs, event.data]);
        }
      } catch (e) {
        // If it's not JSON, treat it as a plain log message
        setLogs(prevLogs => [...prevLogs, event.data]);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from arbitrage engine WebSocket');
      setLogs(prevLogs => [...prevLogs, 'Status: Disconnected from arbitrage engine']);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLogs(prevLogs => [...prevLogs, `Error: WebSocket connection failed`]);
    };

    // Clean up the WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, []);

  const value = {
    logs,
    supportedAssets,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};