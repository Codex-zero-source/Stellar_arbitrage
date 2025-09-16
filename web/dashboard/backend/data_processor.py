#!/usr/bin/env python3
"""
Data Processing Module for Arbitrage Trading Platform
Handles price feeds, trade history, and portfolio tracking
"""

import os
import json
import time
import sqlite3
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict, deque
import statistics
from dotenv import load_dotenv

load_dotenv()

@dataclass
class PriceData:
    """Price data structure for market feeds."""
    symbol: str
    price: float
    timestamp: float
    volume: float = 0.0
    bid: float = 0.0
    ask: float = 0.0
    source: str = "unknown"

@dataclass
class TradeRecord:
    """Trade record structure for history tracking."""
    trade_id: str
    symbol: str
    side: str  # 'buy' or 'sell'
    amount: float
    price: float
    fee: float
    timestamp: float
    status: str  # 'pending', 'completed', 'failed'
    profit_loss: float = 0.0
    exchange: str = "stellar"

@dataclass
class PortfolioPosition:
    """Portfolio position structure."""
    asset: str
    balance: float
    value_xlm: float
    avg_cost: float
    unrealized_pnl: float
    last_updated: float

class DataProcessor:
    """Main data processing class for the arbitrage platform."""
    
    def __init__(self, db_path: str = "data/arbitrage_data.db"):
        self.db_path = db_path
        self.price_cache = {}  # Real-time price cache
        self.price_history = defaultdict(lambda: deque(maxlen=1000))  # Price history buffer
        self.trade_history = []
        self.portfolio = {}
        self.performance_metrics = {
            'total_pnl': 0.0,
            'win_rate': 0.0,
            'total_trades': 0,
            'avg_profit_per_trade': 0.0,
            'max_drawdown': 0.0,
            'sharpe_ratio': 0.0
        }
        
        # Initialize database
        self._init_database()
        
        # Load existing data
        self._load_data()
    
    def _init_database(self):
        """Initialize SQLite database for persistent storage."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Price data table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS price_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    price REAL NOT NULL,
                    timestamp REAL NOT NULL,
                    volume REAL DEFAULT 0,
                    bid REAL DEFAULT 0,
                    ask REAL DEFAULT 0,
                    source TEXT DEFAULT 'unknown'
                )
            ''')
            
            # Create index for price data
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_price_data_symbol_timestamp 
                ON price_data(symbol, timestamp)
            ''')
            
            # Trade history table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS trade_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trade_id TEXT UNIQUE NOT NULL,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    amount REAL NOT NULL,
                    price REAL NOT NULL,
                    fee REAL NOT NULL,
                    timestamp REAL NOT NULL,
                    status TEXT NOT NULL,
                    profit_loss REAL DEFAULT 0,
                    exchange TEXT DEFAULT 'stellar'
                )
            ''')
            
            # Portfolio table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS portfolio (
                    asset TEXT PRIMARY KEY,
                    balance REAL NOT NULL,
                    value_xlm REAL NOT NULL,
                    avg_cost REAL NOT NULL,
                    unrealized_pnl REAL DEFAULT 0,
                    last_updated REAL NOT NULL
                )
            ''')
            
            conn.commit()
    
    def _load_data(self):
        """Load existing data from database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Load recent price data (last 24 hours)
            yesterday = time.time() - 86400
            cursor.execute('''
                SELECT symbol, price, timestamp, volume, bid, ask, source
                FROM price_data 
                WHERE timestamp > ?
                ORDER BY timestamp DESC
            ''', (yesterday,))
            
            for row in cursor.fetchall():
                symbol, price, timestamp, volume, bid, ask, source = row
                price_data = PriceData(symbol, price, timestamp, volume, bid, ask, source)
                self.price_history[symbol].append(price_data)
                self.price_cache[symbol] = price_data
            
            # Load trade history (last 30 days)
            month_ago = time.time() - (30 * 86400)
            cursor.execute('''
                SELECT trade_id, symbol, side, amount, price, fee, timestamp, status, profit_loss, exchange
                FROM trade_history 
                WHERE timestamp > ?
                ORDER BY timestamp DESC
            ''', (month_ago,))
            
            for row in cursor.fetchall():
                trade_record = TradeRecord(*row)
                self.trade_history.append(trade_record)
            
            # Load portfolio
            cursor.execute('SELECT * FROM portfolio')
            for row in cursor.fetchall():
                asset, balance, value_xlm, avg_cost, unrealized_pnl, last_updated = row
                self.portfolio[asset] = PortfolioPosition(
                    asset, balance, value_xlm, avg_cost, unrealized_pnl, last_updated
                )
    
    def update_price(self, price_data: PriceData):
        """Update price data and store in database."""
        # Update cache
        self.price_cache[price_data.symbol] = price_data
        
        # Update history buffer
        self.price_history[price_data.symbol].append(price_data)
        
        # Store in database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO price_data (symbol, price, timestamp, volume, bid, ask, source)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (price_data.symbol, price_data.price, price_data.timestamp,
                  price_data.volume, price_data.bid, price_data.ask, price_data.source))
            conn.commit()
        
        # Update portfolio values
        self._update_portfolio_values()
    
    def record_trade(self, trade_record: TradeRecord):
        """Record a new trade and update portfolio."""
        # Add to history
        self.trade_history.append(trade_record)
        
        # Store in database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO trade_history 
                (trade_id, symbol, side, amount, price, fee, timestamp, status, profit_loss, exchange)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (trade_record.trade_id, trade_record.symbol, trade_record.side,
                  trade_record.amount, trade_record.price, trade_record.fee,
                  trade_record.timestamp, trade_record.status, trade_record.profit_loss,
                  trade_record.exchange))
            conn.commit()
        
        # Update portfolio if trade is completed
        if trade_record.status == 'completed':
            self._update_portfolio_from_trade(trade_record)
        
        # Update performance metrics
        self._calculate_performance_metrics()
    
    def _update_portfolio_from_trade(self, trade: TradeRecord):
        """Update portfolio position from completed trade."""
        asset = trade.symbol.split('/')[0]  # Get base asset
        
        if asset not in self.portfolio:
            self.portfolio[asset] = PortfolioPosition(
                asset=asset,
                balance=0.0,
                value_xlm=0.0,
                avg_cost=0.0,
                unrealized_pnl=0.0,
                last_updated=time.time()
            )
        
        position = self.portfolio[asset]
        
        if trade.side == 'buy':
            # Calculate new average cost
            total_cost = (position.balance * position.avg_cost) + (trade.amount * trade.price)
            new_balance = position.balance + trade.amount
            position.avg_cost = total_cost / new_balance if new_balance > 0 else 0
            position.balance = new_balance
        else:  # sell
            position.balance -= trade.amount
            if position.balance < 0:
                position.balance = 0
        
        position.last_updated = time.time()
        
        # Save to database
        self._save_portfolio_position(position)
    
    def _update_portfolio_values(self):
        """Update portfolio values based on current prices."""
        for asset, position in self.portfolio.items():
            if asset in self.price_cache:
                current_price = self.price_cache[asset].price
                position.value_xlm = position.balance * current_price
                position.unrealized_pnl = (current_price - position.avg_cost) * position.balance
                position.last_updated = time.time()
                
                # Save updated position
                self._save_portfolio_position(position)
    
    def _save_portfolio_position(self, position: PortfolioPosition):
        """Save portfolio position to database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO portfolio 
                (asset, balance, value_xlm, avg_cost, unrealized_pnl, last_updated)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (position.asset, position.balance, position.value_xlm,
                  position.avg_cost, position.unrealized_pnl, position.last_updated))
            conn.commit()
    
    def _calculate_performance_metrics(self):
        """Calculate performance metrics from trade history."""
        if not self.trade_history:
            return
        
        completed_trades = [t for t in self.trade_history if t.status == 'completed']
        
        if not completed_trades:
            return
        
        # Total PnL
        self.performance_metrics['total_pnl'] = sum(t.profit_loss for t in completed_trades)
        
        # Win rate
        winning_trades = [t for t in completed_trades if t.profit_loss > 0]
        self.performance_metrics['win_rate'] = len(winning_trades) / len(completed_trades) * 100
        
        # Total trades
        self.performance_metrics['total_trades'] = len(completed_trades)
        
        # Average profit per trade
        self.performance_metrics['avg_profit_per_trade'] = self.performance_metrics['total_pnl'] / len(completed_trades)
        
        # Calculate max drawdown
        cumulative_pnl = 0
        peak = 0
        max_drawdown = 0
        
        for trade in sorted(completed_trades, key=lambda x: x.timestamp):
            cumulative_pnl += trade.profit_loss
            if cumulative_pnl > peak:
                peak = cumulative_pnl
            drawdown = peak - cumulative_pnl
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        self.performance_metrics['max_drawdown'] = max_drawdown
        
        # Simple Sharpe ratio calculation (assuming risk-free rate of 0)
        if len(completed_trades) > 1:
            returns = [t.profit_loss for t in completed_trades]
            avg_return = statistics.mean(returns)
            std_return = statistics.stdev(returns)
            self.performance_metrics['sharpe_ratio'] = avg_return / std_return if std_return > 0 else 0
    
    def get_price_history(self, symbol: str, hours: int = 24) -> List[PriceData]:
        """Get price history for a symbol."""
        cutoff_time = time.time() - (hours * 3600)
        return [p for p in self.price_history[symbol] if p.timestamp > cutoff_time]
    
    def get_current_price(self, symbol: str) -> Optional[PriceData]:
        """Get current price for a symbol."""
        return self.price_cache.get(symbol)
    
    def get_portfolio_summary(self) -> Dict[str, Any]:
        """Get portfolio summary with current values."""
        total_value = sum(pos.value_xlm for pos in self.portfolio.values())
        total_unrealized_pnl = sum(pos.unrealized_pnl for pos in self.portfolio.values())
        
        return {
            'positions': {asset: asdict(pos) for asset, pos in self.portfolio.items()},
            'total_value_xlm': total_value,
            'total_unrealized_pnl': total_unrealized_pnl,
            'performance_metrics': self.performance_metrics,
            'last_updated': time.time()
        }
    
    def get_trade_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent trade history."""
        recent_trades = sorted(self.trade_history, key=lambda x: x.timestamp, reverse=True)[:limit]
        return [asdict(trade) for trade in recent_trades]
    
    def cleanup_old_data(self, days: int = 30):
        """Clean up old data from database."""
        cutoff_time = time.time() - (days * 86400)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Clean old price data
            cursor.execute('DELETE FROM price_data WHERE timestamp < ?', (cutoff_time,))
            
            # Clean old trade history (keep longer for analysis)
            trade_cutoff = time.time() - (90 * 86400)  # Keep 90 days
            cursor.execute('DELETE FROM trade_history WHERE timestamp < ?', (trade_cutoff,))
            
            conn.commit()
        
        print(f"Data cleanup completed. Removed data older than {days} days.")

# Global data processor instance
data_processor = DataProcessor()