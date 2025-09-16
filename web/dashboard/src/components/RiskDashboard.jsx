import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Alert, AlertTitle, AlertDescription } from './ui/Alert';
import Button from './ui/Button';
import { RiskManager } from '../lib/RiskManager';

const RiskDashboard = () => {
  const [riskManager] = useState(() => new RiskManager({
    maxPositionSize: 0.1,
    defaultStopLoss: 0.02,
    maxPortfolioExposure: 0.3,
    maxDrawdown: 0.1
  }));
  
  const [riskStatus, setRiskStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate portfolio data updates
  useEffect(() => {
    const updateRiskData = () => {
      // Simulate portfolio updates
      const portfolioData = {
        totalValue: 100000 + Math.random() * 10000,
        availableCapital: 75000 + Math.random() * 5000,
        totalExposure: 25000 + Math.random() * 15000,
        unrealizedPnL: (Math.random() - 0.5) * 5000,
        realizedPnL: Math.random() * 2000
      };
      
      // Simulate some returns data
      const returns = Array.from({ length: 30 }, () => (Math.random() - 0.5) * 0.05);
      riskManager.returns = returns;
      
      const alerts = riskManager.updatePortfolio(portfolioData);
      const status = riskManager.getRiskStatus();
      
      setRiskStatus(status);
      setIsLoading(false);
    };

    updateRiskData();
    const interval = setInterval(updateRiskData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [riskManager]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getAlertVariant = (level) => {
    switch (level) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getExposureStatus = (ratio, limit) => {
    if (ratio > limit * 0.9) return { variant: 'danger', text: 'Critical' };
    if (ratio > limit * 0.7) return { variant: 'warning', text: 'High' };
    if (ratio > limit * 0.5) return { variant: 'info', text: 'Moderate' };
    return { variant: 'success', text: 'Safe' };
  };

  if (isLoading || !riskStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-lg">Loading Risk Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const { portfolio, metrics, exposure, alerts } = riskStatus;
  const exposureStatus = getExposureStatus(exposure.ratio, exposure.limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            🛡️ RISK MANAGEMENT
          </h1>
          <p className="text-xl text-cyan-300 font-medium">
            Advanced Portfolio Protection & Risk Analytics
          </p>
        </div>

        {/* Critical Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert, index) => (
              <Alert key={index} variant={getAlertVariant(alert.level)}>
                <AlertTitle className="font-bold">
                  {alert.type} - {alert.level.toUpperCase()}
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                  {alert.value && alert.threshold && (
                    <span className="block mt-1 text-sm">
                      Current: {typeof alert.value === 'number' && alert.value < 1 
                        ? formatPercentage(alert.value) 
                        : formatCurrency(alert.value)} | 
                      Threshold: {typeof alert.threshold === 'number' && alert.threshold < 1 
                        ? formatPercentage(alert.threshold) 
                        : formatCurrency(alert.threshold)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(portfolio.totalValue)}
              </div>
              <p className="text-xs text-cyan-400 mt-1">
                Available: {formatCurrency(portfolio.availableCapital)}
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(exposure.total)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {formatPercentage(exposure.ratio)} of portfolio
                </span>
                <Badge variant={exposureStatus.variant} size="sm">
                  {exposureStatus.text}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Unrealized P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl sm:text-3xl font-black ${
                portfolio.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolio.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(portfolio.unrealizedPnL)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Realized: {formatCurrency(portfolio.realizedPnL)}
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {Math.round((exposure.ratio / exposure.limit) * 100)}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    exposure.ratio > exposure.limit * 0.8 ? 'bg-red-500' :
                    exposure.ratio > exposure.limit * 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((exposure.ratio / exposure.limit) * 100, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                📊 Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Value at Risk (95%)</div>
                  <div className="text-lg font-bold text-red-400">
                    {formatCurrency(metrics.var95)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Sharpe Ratio</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {metrics.sharpeRatio.toFixed(3)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Max Drawdown</div>
                  <div className="text-lg font-bold text-orange-400">
                    {formatPercentage(metrics.maxDrawdown)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatPercentage(metrics.winRate)}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Avg Win</div>
                    <div className="text-sm font-medium text-green-400">
                      {formatCurrency(metrics.avgWin)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Avg Loss</div>
                    <div className="text-sm font-medium text-red-400">
                      {formatCurrency(metrics.avgLoss)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Profit Factor</div>
                    <div className="text-sm font-medium text-cyan-400">
                      {metrics.profitFactor.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Current DD</div>
                    <div className="text-sm font-medium text-orange-400">
                      {formatPercentage(metrics.currentDrawdown)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                ⚙️ Risk Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Max Position Size</span>
                  <Badge variant="outline" size="sm">
                    {formatPercentage(riskStatus.config.maxPositionSize)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Default Stop Loss</span>
                  <Badge variant="outline" size="sm">
                    {formatPercentage(riskStatus.config.defaultStopLoss)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Max Portfolio Exposure</span>
                  <Badge variant="outline" size="sm">
                    {formatPercentage(riskStatus.config.maxPortfolioExposure)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Max Drawdown Limit</span>
                  <Badge variant="outline" size="sm">
                    {formatPercentage(riskStatus.config.maxDrawdown)}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4 space-y-3">
                <Button variant="secondary" className="w-full">
                  🔧 Adjust Risk Parameters
                </Button>
                <Button variant="danger" className="w-full">
                  🚨 Emergency Stop All Positions
                </Button>
                <Button variant="ghost" className="w-full">
                  📋 Export Risk Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exposure Breakdown */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              📈 Exposure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Portfolio Exposure Utilization</span>
                <span className="text-white font-bold">
                  {formatPercentage(exposure.ratio)} / {formatPercentage(exposure.limit)}
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    exposure.ratio > exposure.limit * 0.9 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    exposure.ratio > exposure.limit * 0.7 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-green-500 to-cyan-500'
                  }`}
                  style={{ width: `${Math.min((exposure.ratio / exposure.limit) * 100, 100)}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(portfolio.availableCapital)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Available Capital</div>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-cyan-400">
                    {formatCurrency(exposure.total)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Active Exposure</div>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatCurrency(portfolio.totalValue * exposure.limit - exposure.total)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Remaining Capacity</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskDashboard;