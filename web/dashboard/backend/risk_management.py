import os
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from dotenv import load_dotenv

load_dotenv()

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class RiskParameters:
    max_position_size_xlm: float = 100.0  # Maximum position size in XLM
    max_daily_loss_xlm: float = 50.0      # Maximum daily loss in XLM
    stop_loss_percentage: float = 5.0     # Stop loss at 5% loss
    max_slippage_percentage: float = 2.0  # Maximum acceptable slippage
    min_profit_threshold: float = 0.5     # Minimum profit percentage to execute
    max_concurrent_trades: int = 3        # Maximum concurrent arbitrage trades
    cooldown_period_seconds: int = 300    # Cooldown after a loss (5 minutes)

@dataclass
class TradeRisk:
    risk_level: RiskLevel
    risk_score: float  # 0-100
    warnings: List[str]
    recommended_position_size: float
    should_execute: bool

class RiskManager:
    def __init__(self):
        self.params = RiskParameters()
        self.daily_pnl = 0.0
        self.active_trades = []
        self.last_loss_time = None
        self.trade_history = []
        
        # Load risk parameters from environment if available
        self._load_risk_parameters()
    
    def _load_risk_parameters(self):
        """Load risk parameters from environment variables."""
        try:
            self.params.max_position_size_xlm = float(os.getenv('MAX_POSITION_SIZE_XLM', 100.0))
            self.params.max_daily_loss_xlm = float(os.getenv('MAX_DAILY_LOSS_XLM', 50.0))
            self.params.stop_loss_percentage = float(os.getenv('STOP_LOSS_PERCENTAGE', 5.0))
            self.params.max_slippage_percentage = float(os.getenv('MAX_SLIPPAGE_PERCENTAGE', 2.0))
            self.params.min_profit_threshold = float(os.getenv('MIN_PROFIT_THRESHOLD', 0.5))
            self.params.max_concurrent_trades = int(os.getenv('MAX_CONCURRENT_TRADES', 3))
            self.params.cooldown_period_seconds = int(os.getenv('COOLDOWN_PERIOD_SECONDS', 300))
        except (ValueError, TypeError) as e:
            print(f"Warning: Error loading risk parameters from environment: {e}")
            print("Using default risk parameters")
    
    def assess_trade_risk(self, opportunity: Dict) -> TradeRisk:
        """Assess the risk of a potential arbitrage trade."""
        warnings = []
        risk_score = 0.0
        
        # Check profit percentage
        profit_percentage = opportunity.get('profit_percentage', 0)
        if profit_percentage < self.params.min_profit_threshold:
            warnings.append(f"Low profit margin: {profit_percentage:.2f}%")
            risk_score += 20
        
        # Check slippage risk
        estimated_slippage = opportunity.get('estimated_slippage', 0)
        if estimated_slippage > self.params.max_slippage_percentage:
            warnings.append(f"High slippage risk: {estimated_slippage:.2f}%")
            risk_score += 30
        
        # Check daily loss limits
        if self.daily_pnl < -self.params.max_daily_loss_xlm:
            warnings.append("Daily loss limit exceeded")
            risk_score += 50
        
        # Check concurrent trades
        if len(self.active_trades) >= self.params.max_concurrent_trades:
            warnings.append("Maximum concurrent trades reached")
            risk_score += 25
        
        # Check cooldown period
        if self.last_loss_time and (time.time() - self.last_loss_time) < self.params.cooldown_period_seconds:
            warnings.append("Still in cooldown period after recent loss")
            risk_score += 30
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = RiskLevel.CRITICAL
        elif risk_score >= 60:
            risk_level = RiskLevel.HIGH
        elif risk_score >= 30:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW
        
        # Calculate recommended position size
        base_position = min(self.params.max_position_size_xlm, 50.0)  # Base position
        risk_multiplier = max(0.1, 1.0 - (risk_score / 100))  # Reduce size based on risk
        recommended_position_size = base_position * risk_multiplier
        
        # Decide whether to execute
        should_execute = (
            risk_level != RiskLevel.CRITICAL and
            profit_percentage >= self.params.min_profit_threshold and
            self.daily_pnl > -self.params.max_daily_loss_xlm and
            len(self.active_trades) < self.params.max_concurrent_trades
        )
        
        return TradeRisk(
            risk_level=risk_level,
            risk_score=risk_score,
            warnings=warnings,
            recommended_position_size=recommended_position_size,
            should_execute=should_execute
        )
    
    def record_trade_start(self, trade_id: str, position_size: float, opportunity: Dict):
        """Record the start of a new trade."""
        trade_record = {
            'id': trade_id,
            'start_time': time.time(),
            'position_size': position_size,
            'opportunity': opportunity,
            'status': 'active'
        }
        self.active_trades.append(trade_record)
        print(f"Risk Manager: Started tracking trade {trade_id} with position size {position_size} XLM")
    
    def record_trade_end(self, trade_id: str, pnl: float, success: bool):
        """Record the end of a trade and update risk metrics."""
        # Find and remove the trade from active trades
        trade_record = None
        for i, trade in enumerate(self.active_trades):
            if trade['id'] == trade_id:
                trade_record = self.active_trades.pop(i)
                break
        
        if trade_record:
            trade_record['end_time'] = time.time()
            trade_record['pnl'] = pnl
            trade_record['success'] = success
            trade_record['status'] = 'completed'
            self.trade_history.append(trade_record)
            
            # Update daily PnL
            self.daily_pnl += pnl
            
            # Record loss time for cooldown
            if pnl < 0:
                self.last_loss_time = time.time()
            
            print(f"Risk Manager: Trade {trade_id} completed. PnL: {pnl:.2f} XLM, Daily PnL: {self.daily_pnl:.2f} XLM")
        else:
            print(f"Warning: Trade {trade_id} not found in active trades")
    
    def get_risk_summary(self) -> Dict:
        """Get a summary of current risk metrics."""
        return {
            'daily_pnl': self.daily_pnl,
            'active_trades_count': len(self.active_trades),
            'max_concurrent_trades': self.params.max_concurrent_trades,
            'daily_loss_limit': self.params.max_daily_loss_xlm,
            'remaining_daily_loss_capacity': self.params.max_daily_loss_xlm + self.daily_pnl,
            'in_cooldown': self.last_loss_time and (time.time() - self.last_loss_time) < self.params.cooldown_period_seconds,
            'cooldown_remaining': max(0, self.params.cooldown_period_seconds - (time.time() - (self.last_loss_time or 0))),
            'total_trades_today': len([t for t in self.trade_history if time.time() - t.get('start_time', 0) < 86400])
        }
    
    def should_stop_trading(self) -> Tuple[bool, str]:
        """Check if trading should be stopped due to risk limits."""
        if self.daily_pnl <= -self.params.max_daily_loss_xlm:
            return True, f"Daily loss limit of {self.params.max_daily_loss_xlm} XLM exceeded"
        
        if len(self.active_trades) >= self.params.max_concurrent_trades:
            return True, f"Maximum concurrent trades ({self.params.max_concurrent_trades}) reached"
        
        if self.last_loss_time and (time.time() - self.last_loss_time) < self.params.cooldown_period_seconds:
            remaining = self.params.cooldown_period_seconds - (time.time() - self.last_loss_time)
            return True, f"In cooldown period for {remaining:.0f} more seconds"
        
        return False, ""
    
    def reset_daily_metrics(self):
        """Reset daily metrics (should be called at start of each trading day)."""
        self.daily_pnl = 0.0
        # Keep only recent trade history (last 7 days)
        week_ago = time.time() - (7 * 86400)
        self.trade_history = [t for t in self.trade_history if t.get('start_time', 0) > week_ago]
        print("Risk Manager: Daily metrics reset")