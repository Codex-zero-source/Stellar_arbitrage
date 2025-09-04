import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stellarData, setStellarData] = useState({
    lastBlock: 0,
    networkStatus: 'Disconnected',
    dexPrices: {}
  });

  useEffect(() => {
    // In a real implementation, you would connect to your backend server
    // For now, we'll create a more realistic mock socket for Stellar DEX data
    const mockSocket = {
      on: (event, callback) => {
        console.log(`Listening for Stellar event: ${event}`);
        
        // Simulate real-time data updates
        if (event === 'stellarData') {
          // Simulate periodic data updates
          const interval = setInterval(() => {
            const mockData = {
              lastBlock: Math.floor(Math.random() * 1000000) + 30000000,
              networkStatus: 'Connected',
              dexPrices: {
                'XLM/USD-DEX1': 0.12 + (Math.random() * 0.02 - 0.01),
                'XLM/USD-DEX2': 0.12 + (Math.random() * 0.02 - 0.01),
                'BTC/USD-DEX1': 25000 + (Math.random() * 1000 - 500),
                'BTC/USD-DEX2': 25000 + (Math.random() * 1000 - 500)
              }
            };
            callback(mockData);
          }, 3000);
          
          // Clean up interval on unmount
          return () => clearInterval(interval);
        }
      },
      emit: (event, data) => {
        console.log(`Emitting Stellar event: ${event}`, data);
      },
      disconnect: () => {
        console.log('Disconnecting from Stellar network');
        setIsConnected(false);
      }
    };

    setSocket(mockSocket);
    setIsConnected(true);

    // Simulate connection to Stellar network
    setTimeout(() => {
      setStellarData({
        lastBlock: 30125432,
        networkStatus: 'Connected',
        dexPrices: {
          'XLM/USD-DEX1': 0.1234,
          'XLM/USD-DEX2': 0.1245,
          'BTC/USD-DEX1': 25432.12,
          'BTC/USD-DEX2': 25456.78
        }
      });
    }, 1000);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, stellarData }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;