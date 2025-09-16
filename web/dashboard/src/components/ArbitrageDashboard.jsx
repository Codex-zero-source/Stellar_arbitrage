import React, { useState } from 'react';
import ArbitrageLogViewer from './ArbitrageLogViewer';
import KpiCard from './KpiCard';
import TradeHistoryTable from './TradeHistoryTable';
import WalletConnector from './WalletConnector';
import ArbitrageChart from './ArbitrageChart';
import { useWebSocket } from './SocketContext';
import Button from './ui/Button';

const ArbitrageDashboard = () => {
  const { supportedAssets } = useWebSocket();
  const [activeView, setActiveView] = useState('overview');

  const kpiData = [
    { title: 'NET PROFIT', value: '$ 100.00', variant: 'hybrid' },
    { title: 'TOTAL TRADES', value: '150', variant: 'hybrid' },
    { title: 'WIN RATE', value: '75%', variant: 'hybrid' },
    { title: 'ACTIVE PAIRS', value: supportedAssets.length, variant: 'hybrid' },
  ];

  const navigationButtons = [
    { id: 'overview', label: 'OVERVIEW', icon: '📊' },
    { id: 'analytics', label: 'ANALYTICS', icon: '📈' },
    { id: 'trades', label: 'TRADES', icon: '💱' },
    { id: 'settings', label: 'SETTINGS', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-dark to-brutal-black p-2 sm:p-4">
      {/* Neobrutalism Header */}
      <header className="mb-4 sm:mb-8">
        <div className="brutal-glass p-3 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black text-neon-cyan text-glow uppercase tracking-wider text-center">
            STELLAR ARBITRAGE
          </h1>
          <p className="text-center text-neon-lime font-bold uppercase tracking-widest text-xs sm:text-sm mt-2">
            TRADING PLATFORM
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          {navigationButtons.map((button) => (
            <Button
              key={button.id}
              onClick={() => setActiveView(button.id)}
              variant={activeView === button.id ? "primary" : "secondary"}
              size="sm"
              className="text-xs sm:text-sm uppercase tracking-wider"
            >
              <span className="hidden sm:inline">{button.icon} {button.label}</span>
              <span className="sm:hidden">{button.icon}</span>
            </Button>
          ))}
        </div>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-8">
        {kpiData.map((data, index) => (
          <KpiCard 
            key={index} 
            title={data.title} 
            value={data.value} 
            variant={data.variant}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-6">
        {/* Left Sidebar - Wallet */}
        <div className="lg:col-span-1">
          <WalletConnector />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-6">
          {activeView === 'overview' && (
            <>
              <ArbitrageChart />
              <ArbitrageLogViewer />
            </>
          )}
          {activeView === 'analytics' && (
            <div className="space-y-3 sm:space-y-6">
              <ArbitrageChart />
              <div className="brutal-glass p-3 sm:p-6">
                <h3 className="text-neon-cyan font-black uppercase text-sm sm:text-lg mb-2 sm:mb-4 text-glow">
                  ADVANCED ANALYTICS
                </h3>
                <p className="text-neon-lime text-sm sm:text-base">Coming soon: Advanced trading analytics and performance metrics</p>
              </div>
            </div>
          )}
          {activeView === 'trades' && (
            <div className="space-y-3 sm:space-y-6">
              <TradeHistoryTable />
              <div className="brutal-glass p-3 sm:p-6">
                <h3 className="text-neon-cyan font-black uppercase text-sm sm:text-lg mb-2 sm:mb-4 text-glow">
                  TRADE EXECUTION
                </h3>
                <p className="text-neon-lime text-sm sm:text-base">Coming soon: Manual trade execution interface</p>
              </div>
            </div>
          )}
          {activeView === 'settings' && (
            <div className="brutal-glass p-3 sm:p-6">
              <h3 className="text-neon-cyan font-black uppercase text-sm sm:text-lg mb-2 sm:mb-4 text-glow">
                PLATFORM SETTINGS
              </h3>
              <div className="space-y-2 sm:space-y-4">
                <div className="border-2 sm:border-4 border-neon-magenta p-2 sm:p-4">
                  <h4 className="text-neon-magenta font-bold uppercase text-xs sm:text-sm mb-1 sm:mb-2">Risk Management</h4>
                  <p className="text-white text-xs sm:text-sm">Configure stop-loss and position limits</p>
                </div>
                <div className="border-2 sm:border-4 border-neon-lime p-2 sm:p-4">
                  <h4 className="text-neon-lime font-bold uppercase text-xs sm:text-sm mb-1 sm:mb-2">API Configuration</h4>
                  <p className="text-white text-xs sm:text-sm">Manage exchange API connections</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Additional Info */}
        <div className="lg:col-span-1">
          <div className="brutal-glass p-3 sm:p-4 mb-3 sm:mb-6">
            <h3 className="text-neon-cyan font-black uppercase text-xs sm:text-sm mb-2 sm:mb-3 text-glow">
              SYSTEM STATUS
            </h3>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white">WebSocket</span>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neon-lime border-2 border-brutal-black"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white">Stellar Network</span>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neon-lime border-2 border-brutal-black"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white">Oracle Feed</span>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neon-cyan border-2 border-brutal-black"></div>
              </div>
            </div>
          </div>
          
          <div className="brutal-glass p-3 sm:p-4">
            <h3 className="text-neon-magenta font-black uppercase text-xs sm:text-sm mb-2 sm:mb-3 text-glow">
              QUICK STATS
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white">Assets Tracked:</span>
                <span className="text-neon-lime font-bold">{supportedAssets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Avg Response:</span>
                <span className="text-neon-cyan font-bold">45ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Uptime:</span>
                <span className="text-neon-lime font-bold">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageDashboard;