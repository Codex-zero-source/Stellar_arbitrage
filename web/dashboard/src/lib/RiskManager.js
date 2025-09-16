/**
 * Comprehensive Risk Management System for Arbitrage Trading
 * Implements position sizing, stop-loss, exposure limits, and risk metrics
 */

export class RiskManager {
  constructor(config = {}) {
    this.config = {
      // Position Sizing
      maxPositionSize: config.maxPositionSize || 0.1, // 10% of portfolio
      kellyFraction: config.kellyFraction || 0.25, // Conservative Kelly
      fixedFractional: config.fixedFractional || 0.02, // 2% risk per trade
      
      // Stop Loss & Take Profit
      defaultStopLoss: config.defaultStopLoss || 0.02, // 2% stop loss
      defaultTakeProfit: config.defaultTakeProfit || 0.06, // 3:1 risk/reward
      trailingStopDistance: config.trailingStopDistance || 0.01, // 1% trailing
      
      // Portfolio Exposure
      maxPortfolioExposure: config.maxPortfolioExposure || 0.3, // 30% max exposure
      maxCorrelatedExposure: config.maxCorrelatedExposure || 0.15, // 15% correlated assets
      maxSingleAssetExposure: config.maxSingleAssetExposure || 0.05, // 5% single asset
      
      // Risk Metrics
      varConfidence: config.varConfidence || 0.95, // 95% VaR confidence
      lookbackPeriod: config.lookbackPeriod || 30, // 30 days for calculations
      maxDrawdown: config.maxDrawdown || 0.1, // 10% max drawdown
      
      // Alert Thresholds
      riskAlertThreshold: config.riskAlertThreshold || 0.8, // 80% of limits
      emergencyStopThreshold: config.emergencyStopThreshold || 0.95, // 95% of limits
      
      ...config
    };
    
    this.positions = new Map();
    this.portfolio = {
      totalValue: 0,
      availableCapital: 0,
      totalExposure: 0,
      unrealizedPnL: 0,
      realizedPnL: 0
    };
    
    this.riskMetrics = {
      var95: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0
    };
    
    this.alerts = [];
    this.priceHistory = new Map();
    this.returns = [];
  }

  /**
   * POSITION SIZING ALGORITHMS
   */
  
  // Kelly Criterion position sizing
  calculateKellyPosition(winRate, avgWin, avgLoss, capital) {
    if (avgLoss === 0) return 0;
    
    const winLossRatio = avgWin / Math.abs(avgLoss);
    const kellyFraction = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;
    
    // Apply conservative fraction to avoid over-leveraging
    const conservativeKelly = Math.max(0, kellyFraction * this.config.kellyFraction);
    
    return Math.min(conservativeKelly * capital, this.config.maxPositionSize * capital);
  }
  
  // Fixed fractional position sizing
  calculateFixedFractionalPosition(stopLossDistance, capital) {
    if (stopLossDistance === 0) return 0;
    
    const riskAmount = capital * this.config.fixedFractional;
    return riskAmount / stopLossDistance;
  }
  
  // Optimal position size considering multiple factors
  calculateOptimalPositionSize(opportunity, capital) {
    const { 
      expectedReturn, 
      probability, 
      maxLoss, 
      asset,
      correlationFactor = 1 
    } = opportunity;
    
    // Kelly-based sizing
    const kellySize = this.calculateKellyPosition(
      probability, 
      expectedReturn, 
      maxLoss, 
      capital
    );
    
    // Fixed fractional sizing
    const fixedSize = this.calculateFixedFractionalPosition(
      Math.abs(maxLoss), 
      capital
    );
    
    // Take the more conservative approach
    let optimalSize = Math.min(kellySize, fixedSize);
    
    // Apply exposure limits
    const currentExposure = this.getCurrentExposure(asset);
    const maxAllowedExposure = this.config.maxSingleAssetExposure * capital;
    
    if (currentExposure + optimalSize > maxAllowedExposure) {
      optimalSize = Math.max(0, maxAllowedExposure - currentExposure);
    }
    
    // Apply correlation adjustments
    optimalSize *= (1 / correlationFactor);
    
    return {
      size: optimalSize,
      reasoning: {
        kellySize,
        fixedSize,
        exposureLimit: maxAllowedExposure - currentExposure,
        correlationAdjustment: correlationFactor
      }
    };
  }

  /**
   * STOP LOSS & TAKE PROFIT MANAGEMENT
   */
  
  createStopLossOrder(position, currentPrice) {
    const stopPrice = position.side === 'long' 
      ? currentPrice * (1 - this.config.defaultStopLoss)
      : currentPrice * (1 + this.config.defaultStopLoss);
    
    return {
      id: `sl_${position.id}_${Date.now()}`,
      type: 'stop_loss',
      positionId: position.id,
      stopPrice,
      originalPrice: currentPrice,
      isTrailing: false,
      createdAt: new Date()
    };
  }
  
  createTakeProfitOrder(position, currentPrice) {
    const targetPrice = position.side === 'long'
      ? currentPrice * (1 + this.config.defaultTakeProfit)
      : currentPrice * (1 - this.config.defaultTakeProfit);
    
    return {
      id: `tp_${position.id}_${Date.now()}`,
      type: 'take_profit',
      positionId: position.id,
      targetPrice,
      originalPrice: currentPrice,
      createdAt: new Date()
    };
  }
  
  updateTrailingStop(position, currentPrice, stopOrder) {
    if (!stopOrder.isTrailing) return stopOrder;
    
    const trailingDistance = this.config.trailingStopDistance;
    
    if (position.side === 'long') {
      const newStopPrice = currentPrice * (1 - trailingDistance);
      if (newStopPrice > stopOrder.stopPrice) {
        stopOrder.stopPrice = newStopPrice;
        stopOrder.updatedAt = new Date();
      }
    } else {
      const newStopPrice = currentPrice * (1 + trailingDistance);
      if (newStopPrice < stopOrder.stopPrice) {
        stopOrder.stopPrice = newStopPrice;
        stopOrder.updatedAt = new Date();
      }
    }
    
    return stopOrder;
  }

  /**
   * PORTFOLIO EXPOSURE MANAGEMENT
   */
  
  getCurrentExposure(asset) {
    let exposure = 0;
    for (const [id, position] of this.positions) {
      if (position.asset === asset && position.status === 'open') {
        exposure += position.size * position.currentPrice;
      }
    }
    return exposure;
  }
  
  getTotalPortfolioExposure() {
    let totalExposure = 0;
    for (const [id, position] of this.positions) {
      if (position.status === 'open') {
        totalExposure += position.size * position.currentPrice;
      }
    }
    return totalExposure;
  }
  
  checkExposureLimits(newPosition) {
    const currentTotalExposure = this.getTotalPortfolioExposure();
    const newPositionValue = newPosition.size * newPosition.price;
    
    const checks = {
      totalExposure: {
        current: currentTotalExposure,
        new: currentTotalExposure + newPositionValue,
        limit: this.portfolio.totalValue * this.config.maxPortfolioExposure,
        passed: (currentTotalExposure + newPositionValue) <= (this.portfolio.totalValue * this.config.maxPortfolioExposure)
      },
      singleAsset: {
        current: this.getCurrentExposure(newPosition.asset),
        new: this.getCurrentExposure(newPosition.asset) + newPositionValue,
        limit: this.portfolio.totalValue * this.config.maxSingleAssetExposure,
        passed: (this.getCurrentExposure(newPosition.asset) + newPositionValue) <= (this.portfolio.totalValue * this.config.maxSingleAssetExposure)
      }
    };
    
    return {
      canOpen: checks.totalExposure.passed && checks.singleAsset.passed,
      checks
    };
  }

  /**
   * RISK METRICS CALCULATION
   */
  
  calculateVaR(returns, confidence = 0.95) {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    
    return Math.abs(sortedReturns[index] || 0);
  }
  
  calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    return volatility === 0 ? 0 : (avgReturn - riskFreeRate / 252) / volatility;
  }
  
  calculateMaxDrawdown(equityCurve) {
    if (equityCurve.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = equityCurve[0];
    
    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
      } else {
        const drawdown = (peak - equityCurve[i]) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }
  
  updateRiskMetrics() {
    // Calculate VaR
    this.riskMetrics.var95 = this.calculateVaR(this.returns, this.config.varConfidence);
    
    // Calculate Sharpe Ratio
    this.riskMetrics.sharpeRatio = this.calculateSharpeRatio(this.returns);
    
    // Calculate win rate and profit metrics
    const trades = Array.from(this.positions.values()).filter(p => p.status === 'closed');
    const winningTrades = trades.filter(t => t.pnl > 0);
    
    this.riskMetrics.winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
    this.riskMetrics.avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0;
    
    const losingTrades = trades.filter(t => t.pnl < 0);
    this.riskMetrics.avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losingTrades.length
      : 0;
    
    // Profit factor
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    this.riskMetrics.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
  }

  /**
   * RISK ALERTS SYSTEM
   */
  
  checkRiskAlerts() {
    const alerts = [];
    const totalExposure = this.getTotalPortfolioExposure();
    const exposureRatio = totalExposure / this.portfolio.totalValue;
    
    // Exposure alerts
    if (exposureRatio > this.config.emergencyStopThreshold * this.config.maxPortfolioExposure) {
      alerts.push({
        type: 'EMERGENCY',
        message: 'Portfolio exposure exceeds emergency threshold',
        level: 'critical',
        value: exposureRatio,
        threshold: this.config.emergencyStopThreshold * this.config.maxPortfolioExposure,
        timestamp: new Date()
      });
    } else if (exposureRatio > this.config.riskAlertThreshold * this.config.maxPortfolioExposure) {
      alerts.push({
        type: 'WARNING',
        message: 'Portfolio exposure approaching limit',
        level: 'warning',
        value: exposureRatio,
        threshold: this.config.riskAlertThreshold * this.config.maxPortfolioExposure,
        timestamp: new Date()
      });
    }
    
    // Drawdown alerts
    if (this.riskMetrics.currentDrawdown > this.config.maxDrawdown * this.config.emergencyStopThreshold) {
      alerts.push({
        type: 'EMERGENCY',
        message: 'Maximum drawdown exceeded',
        level: 'critical',
        value: this.riskMetrics.currentDrawdown,
        threshold: this.config.maxDrawdown,
        timestamp: new Date()
      });
    }
    
    // VaR alerts
    if (this.riskMetrics.var95 > this.portfolio.totalValue * 0.05) {
      alerts.push({
        type: 'WARNING',
        message: 'Value at Risk exceeds 5% of portfolio',
        level: 'warning',
        value: this.riskMetrics.var95,
        threshold: this.portfolio.totalValue * 0.05,
        timestamp: new Date()
      });
    }
    
    this.alerts = [...this.alerts, ...alerts].slice(-100); // Keep last 100 alerts
    return alerts;
  }

  /**
   * PUBLIC API METHODS
   */
  
  // Evaluate if a trade should be opened
  evaluateTradeOpportunity(opportunity) {
    const positionSize = this.calculateOptimalPositionSize(opportunity, this.portfolio.availableCapital);
    const exposureCheck = this.checkExposureLimits({
      asset: opportunity.asset,
      size: positionSize.size,
      price: opportunity.entryPrice
    });
    
    const recommendation = {
      approved: exposureCheck.canOpen && positionSize.size > 0,
      positionSize: positionSize.size,
      reasoning: positionSize.reasoning,
      exposureChecks: exposureCheck.checks,
      stopLoss: opportunity.entryPrice * (1 - this.config.defaultStopLoss),
      takeProfit: opportunity.entryPrice * (1 + this.config.defaultTakeProfit),
      riskAmount: positionSize.size * this.config.defaultStopLoss,
      expectedReturn: positionSize.size * opportunity.expectedReturn
    };
    
    return recommendation;
  }
  
  // Update portfolio and risk metrics
  updatePortfolio(portfolioData) {
    this.portfolio = { ...this.portfolio, ...portfolioData };
    this.updateRiskMetrics();
    return this.checkRiskAlerts();
  }
  
  // Get current risk status
  getRiskStatus() {
    return {
      portfolio: this.portfolio,
      metrics: this.riskMetrics,
      exposure: {
        total: this.getTotalPortfolioExposure(),
        ratio: this.getTotalPortfolioExposure() / this.portfolio.totalValue,
        limit: this.config.maxPortfolioExposure
      },
      alerts: this.alerts.slice(-10), // Last 10 alerts
      config: this.config
    };
  }
}