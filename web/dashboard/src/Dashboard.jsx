import React from 'react';
import ArbitrageLogViewer from './components/ArbitrageLogViewer';
import KpiCard from './components/KpiCard';
import TradeHistoryTable from './components/TradeHistoryTable';
import { WebSocketProvider } from './components/SocketContext';

const ArbitrageDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-neon-cyan text-center text-glow">
          Arbitrage Dashboard
        </h1>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <KpiCard title="Net Profit" value="$ 0.00" />
        <KpiCard title="Total Trades" value="0" />
        <KpiCard title="Win Rate" value="0%" />
        <KpiCard title="Active Pairs" value="0" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <ArbitrageLogViewer />
        <TradeHistoryTable />
      </div>
    </div>
  );
};

const Dashboard = () => (
  <WebSocketProvider>
    <ArbitrageDashboard />
  </WebSocketProvider>
);

export default Dashboard;