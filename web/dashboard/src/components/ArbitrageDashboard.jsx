import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Navigation from './Navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ArbitrageDashboard = () => {
  const [priceData, setPriceData] = useState({
    labels: [],
    datasets: [
      {
        label: 'XLM/USD - Stellar DEX 1',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'XLM/USD - Stellar DEX 2',
        data: [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }
    ],
  });

  const [opportunities, setOpportunities] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    stellarNetwork: 'Connected',
    smartContract: 'Deployed',
    activeOpportunities: 0,
    activeTrades: 0,
    lastBlock: 0
  });

  // Generate mock data for the chart
  useEffect(() => {
    const generateMockData = () => {
      const newLabels = [];
      const dex1Data = [];
      const dex2Data = [];
      
      for (let i = 0; i < 20; i++) {
        newLabels.push(`${i * 5}s`);
        // Generate mock prices with some variance
        const basePrice = 0.12 + Math.sin(i * 0.5) * 0.02;
        dex1Data.push(basePrice + (Math.random() * 0.01 - 0.005));
        dex2Data.push(basePrice + (Math.random() * 0.01 - 0.005) - 0.001);
      }
      
      setPriceData({
        labels: newLabels,
        datasets: [
          {
            label: 'XLM/USD - Stellar DEX 1',
            data: dex1Data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
          {
            label: 'XLM/USD - Stellar DEX 2',
            data: dex2Data,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          }
        ],
      });
    };

    generateMockData();
    const interval = setInterval(generateMockData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate mock opportunities (DEX-to-DEX only)
  useEffect(() => {
    const mockOpportunities = [
      { id: 1, asset: 'XLM/USD', buyDex: 'Stellar DEX 1', sellDex: 'Stellar DEX 2', profit: '1.2%', time: '2 min ago' },
      { id: 2, asset: 'BTC/USD', buyDex: 'Stellar DEX 2', sellDex: 'Stellar DEX 3', profit: '0.8%', time: '5 min ago' },
      { id: 3, asset: 'ETH/USD', buyDex: 'Stellar DEX 3', sellDex: 'Stellar DEX 1', profit: '1.5%', time: '10 min ago' }
    ];
    
    setOpportunities(mockOpportunities);
    setSystemStatus(prev => ({
      ...prev,
      activeOpportunities: mockOpportunities.length
    }));
  }, []);

  // Generate mock active trades (DEX-to-DEX only)
  useEffect(() => {
    const mockTrades = [
      { id: 1, asset: 'XLM/USD', buyDex: 'Stellar DEX 1', sellDex: 'Stellar DEX 2', status: 'Executing', profit: '1.2%' },
      { id: 2, asset: 'ETH/USD', buyDex: 'Stellar DEX 3', sellDex: 'Stellar DEX 1', status: 'Completed', profit: '1.5%' }
    ];
    
    setActiveTrades(mockTrades);
    setSystemStatus(prev => ({
      ...prev,
      activeTrades: mockTrades.length
    }));
  }, []);

  const executeTrade = (opportunityId) => {
    console.log(`Executing DEX-to-DEX arbitrage for opportunity ${opportunityId}`);
    // In a real implementation, this would connect to your backend to execute the trade
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Stellar DEX Arbitrage Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time monitoring and control of DEX-to-DEX arbitrage opportunities</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Price Comparison</h2>
              <span className="text-sm text-gray-400">Real-time XLM/USD prices across Stellar DEXs</span>
            </div>
            <div className="h-80">
              <Line 
                data={priceData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    title: {
                      display: true,
                      text: 'XLM/USD Price Comparison Across Stellar DEXs',
                      color: 'rgba(255, 255, 255, 0.9)'
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    },
                    y: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        callback: function(value) {
                          return '$' + value.toFixed(4);
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span>Stellar Network</span>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Connected</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span>Smart Contract</span>
                </div>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Deployed</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                  <span>Active Opportunities</span>
                </div>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">{systemStatus.activeOpportunities}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                  <span>Active Trades</span>
                </div>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">{systemStatus.activeTrades}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-teal-500 mr-3"></div>
                  <span>Last Block</span>
                </div>
                <span className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs">#{systemStatus.lastBlock || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Arbitrage Opportunities</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 text-left">Asset</th>
                    <th className="py-2 text-left">Buy DEX</th>
                    <th className="py-2 text-left">Sell DEX</th>
                    <th className="py-2 text-left">Profit</th>
                    <th className="py-2 text-left">Time</th>
                    <th className="py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                      <td className="py-3">{opportunity.asset}</td>
                      <td className="py-3">{opportunity.buyDex}</td>
                      <td className="py-3">{opportunity.sellDex}</td>
                      <td className="py-3 text-green-400 font-medium">{opportunity.profit}</td>
                      <td className="py-3 text-gray-400">{opportunity.time}</td>
                      <td className="py-3">
                        <button 
                          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg hover:from-blue-700 hover:to-teal-700 text-sm transition-all"
                          onClick={() => executeTrade(opportunity.id)}
                        >
                          Execute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Active Trades</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 text-left">Asset</th>
                    <th className="py-2 text-left">Buy DEX</th>
                    <th className="py-2 text-left">Sell DEX</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                      <td className="py-3">{trade.asset}</td>
                      <td className="py-3">{trade.buyDex}</td>
                      <td className="py-3">{trade.sellDex}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.status === 'Executing' 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-3 text-green-400 font-medium">{trade.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageDashboard;