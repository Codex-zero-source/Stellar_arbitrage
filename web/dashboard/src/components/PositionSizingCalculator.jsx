import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import { Input, Label } from './ui/Input';
import { Badge } from './ui/Badge';
import { Alert, AlertTitle, AlertDescription } from './ui/Alert';
import { RiskManager } from '../lib/RiskManager';

const PositionSizingCalculator = () => {
  const [riskManager] = useState(() => new RiskManager());
  const [inputs, setInputs] = useState({
    capital: 100000,
    expectedReturn: 0.03,
    probability: 0.65,
    maxLoss: 0.02,
    asset: 'BTC/USD',
    entryPrice: 45000,
    correlationFactor: 1.0
  });
  
  const [results, setResults] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    calculatePositionSize();
  }, [inputs]);

  const calculatePositionSize = () => {
    try {
      // Update risk manager portfolio
      riskManager.updatePortfolio({
        totalValue: inputs.capital,
        availableCapital: inputs.capital * 0.8, // 80% available
        totalExposure: inputs.capital * 0.2, // 20% currently exposed
        unrealizedPnL: 0,
        realizedPnL: 0
      });

      // Calculate position sizing
      const opportunity = {
        expectedReturn: inputs.expectedReturn,
        probability: inputs.probability,
        maxLoss: inputs.maxLoss,
        asset: inputs.asset,
        entryPrice: inputs.entryPrice,
        correlationFactor: inputs.correlationFactor
      };

      const positionSize = riskManager.calculateOptimalPositionSize(opportunity, inputs.capital);
      const tradeRecommendation = riskManager.evaluateTradeOpportunity(opportunity);

      setResults(positionSize);
      setRecommendation(tradeRecommendation);
    } catch (error) {
      console.error('Error calculating position size:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || value
    }));
  };

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

  const getRecommendationColor = (approved) => {
    return approved ? 'success' : 'danger';
  };

  const calculateShares = () => {
    if (!results || inputs.entryPrice === 0) return 0;
    return Math.floor(results.size / inputs.entryPrice);
  };

  const calculateRiskRewardRatio = () => {
    if (inputs.maxLoss === 0) return 0;
    return inputs.expectedReturn / inputs.maxLoss;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            🎯 POSITION SIZING CALCULATOR
          </h1>
          <p className="text-xl text-cyan-300 font-medium">
            Advanced Kelly Criterion & Risk-Based Position Sizing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Parameters */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                ⚙️ Trade Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capital" className="text-gray-300">Portfolio Capital</Label>
                  <Input
                    id="capital"
                    type="number"
                    value={inputs.capital}
                    onChange={(e) => handleInputChange('capital', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="asset" className="text-gray-300">Asset Pair</Label>
                  <Input
                    id="asset"
                    type="text"
                    value={inputs.asset}
                    onChange={(e) => handleInputChange('asset', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entryPrice" className="text-gray-300">Entry Price ($)</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    value={inputs.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedReturn" className="text-gray-300">Expected Return (%)</Label>
                  <Input
                    id="expectedReturn"
                    type="number"
                    step="0.001"
                    value={inputs.expectedReturn * 100}
                    onChange={(e) => handleInputChange('expectedReturn', e.target.value / 100)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="probability" className="text-gray-300">Win Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={inputs.probability * 100}
                    onChange={(e) => handleInputChange('probability', e.target.value / 100)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoss" className="text-gray-300">Max Loss (%)</Label>
                  <Input
                    id="maxLoss"
                    type="number"
                    step="0.001"
                    value={inputs.maxLoss * 100}
                    onChange={(e) => handleInputChange('maxLoss', e.target.value / 100)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="correlationFactor" className="text-gray-300">Correlation Factor</Label>
                  <Input
                    id="correlationFactor"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="3"
                    value={inputs.correlationFactor}
                    onChange={(e) => handleInputChange('correlationFactor', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    1.0 = No correlation, &gt;1.0 = Positive correlation (reduces size)
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <Button 
                  onClick={calculatePositionSize}
                  className="w-full"
                  variant="primary"
                >
                  🔄 Recalculate Position Size
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                📊 Position Sizing Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendation && (
                <Alert variant={getRecommendationColor(recommendation.approved)}>
                  <AlertTitle className="font-bold">
                    {recommendation.approved ? '✅ TRADE APPROVED' : '❌ TRADE REJECTED'}
                  </AlertTitle>
                  <AlertDescription>
                    {recommendation.approved 
                      ? 'Position size calculated and risk limits satisfied'
                      : 'Trade exceeds risk limits or position size too small'
                    }
                  </AlertDescription>
                </Alert>
              )}

              {results && (
                <div className="space-y-4">
                  {/* Main Results */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                      <div className="text-sm text-gray-400 mb-1">Optimal Position Size</div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {formatCurrency(results.size)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {calculateShares()} shares @ {formatCurrency(inputs.entryPrice)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                      <div className="text-sm text-gray-400 mb-1">Portfolio Allocation</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {formatPercentage(results.size / inputs.capital)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        of total capital
                      </div>
                    </div>
                  </div>

                  {/* Risk Metrics */}
                  <div className="border-t border-gray-600 pt-4">
                    <h4 className="text-lg font-bold text-white mb-3">Risk Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Risk Amount:</span>
                          <span className="text-sm font-medium text-red-400">
                            {recommendation && formatCurrency(recommendation.riskAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Expected Return:</span>
                          <span className="text-sm font-medium text-green-400">
                            {recommendation && formatCurrency(recommendation.expectedReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Risk/Reward:</span>
                          <span className="text-sm font-medium text-cyan-400">
                            1:{calculateRiskRewardRatio().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Stop Loss:</span>
                          <span className="text-sm font-medium text-orange-400">
                            {recommendation && formatCurrency(recommendation.stopLoss)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Take Profit:</span>
                          <span className="text-sm font-medium text-green-400">
                            {recommendation && formatCurrency(recommendation.takeProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Win Probability:</span>
                          <span className="text-sm font-medium text-blue-400">
                            {formatPercentage(inputs.probability)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Algorithm Breakdown */}
                  {results.reasoning && (
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="text-lg font-bold text-white mb-3">Algorithm Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Kelly Criterion Size:</span>
                          <Badge variant="outline" size="sm">
                            {formatCurrency(results.reasoning.kellySize)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Fixed Fractional Size:</span>
                          <Badge variant="outline" size="sm">
                            {formatCurrency(results.reasoning.fixedSize)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Exposure Limit:</span>
                          <Badge variant="outline" size="sm">
                            {formatCurrency(results.reasoning.exposureLimit)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Correlation Adjustment:</span>
                          <Badge variant="outline" size="sm">
                            {results.reasoning.correlationAdjustment.toFixed(2)}x
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-gray-600 pt-4 space-y-2">
                    <Button 
                      variant={recommendation?.approved ? "primary" : "secondary"}
                      className="w-full"
                      disabled={!recommendation?.approved}
                    >
                      {recommendation?.approved ? '🚀 Execute Trade' : '⚠️ Cannot Execute - Risk Limits'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" size="sm">
                        📋 Save Calculation
                      </Button>
                      <Button variant="ghost" size="sm">
                        📊 View Backtest
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Educational Info */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              📚 Position Sizing Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-cyan-400">Kelly Criterion</h4>
                <p className="text-sm text-gray-300">
                  Optimal position sizing based on win probability and win/loss ratio. 
                  Formula: f = (bp - q) / b, where b = odds, p = win probability, q = loss probability.
                </p>
                <div className="text-xs text-gray-400">
                  ✅ Maximizes long-term growth<br/>
                  ⚠️ Can be aggressive, use fractional Kelly
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-purple-400">Fixed Fractional</h4>
                <p className="text-sm text-gray-300">
                  Risk a fixed percentage of capital on each trade. 
                  Position size = (Risk Amount) / (Stop Loss Distance).
                </p>
                <div className="text-xs text-gray-400">
                  ✅ Simple and conservative<br/>
                  ✅ Consistent risk management
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionSizingCalculator;