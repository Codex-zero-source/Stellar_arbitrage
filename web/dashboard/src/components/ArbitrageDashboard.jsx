import React from 'react';
import ArbitrageLogViewer from './ArbitrageLogViewer';
import KpiCard from './KpiCard';
import TradeHistoryTable from './TradeHistoryTable';

const ArbitrageDashboard = () => {
  const kpiData = [
    { title: 'NET PROFIT', value: '$ 100.00' },
    { title: 'TOTAL TRADES', value: '150' },
    { title: 'WIN RATE', value: '75%' },
    { title: 'ACTIVE PAIRS', value: '5' },
  ];

  return (
    <div className="container mx-auto p-4 bg-gradient-to-br from-background to-background/80 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-glow text-neon-cyan">Arbitrage Dashboard</h1>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((data, index) => (
          <KpiCard key={index} title={data.title} value={data.value} />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ArbitrageLogViewer />
        </div>
        <div>
          <TradeHistoryTable />
        </div>
      </div>
    </div>
  );
};

export default ArbitrageDashboard;