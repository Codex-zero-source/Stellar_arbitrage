# Analytics.py
# Performance analytics and monitoring for the Arbitrage Trading Platform

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import sqlite3
from datetime import datetime, timedelta
import os
import requests  # Add requests for HTTP calls
from dotenv import load_dotenv
import json

load_dotenv()

class PerformanceAnalytics:
    def __init__(self):
        self.db_path = os.getenv('ANALYTICS_DB_PATH', 'analytics.db')
        self.reflector_api_url = os.getenv('REFLECTOR_API_URL', 'https://api.reflector.network/data_feed')
        self.reflector_api_key = os.getenv('REFLECTOR_API_KEY')
        self.initialize_database()
        
    def initialize_database(self):
        """Initialize the SQLite database for storing analytics data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables for different types of analytics data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                asset TEXT,
                buy_exchange TEXT,
                sell_exchange TEXT,
                buy_price REAL,
                sell_price REAL,
                amount REAL,
                gross_profit REAL,
                net_profit REAL,
                fees REAL,
                gas_cost REAL,
                execution_time_ms INTEGER,
                success BOOLEAN
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS opportunities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                asset TEXT,
                buy_exchange TEXT,
                sell_exchange TEXT,
                buy_price REAL,
                sell_price REAL,
                estimated_profit REAL,
                confidence_score REAL,
                executed BOOLEAN
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                metric_name TEXT,
                value REAL,
                unit TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def fetch_reflector_price_data(self, asset, exchange):
        """Fetch real price data from Reflector Network API"""
        try:
            headers = {
                'Authorization': f'Bearer {self.reflector_api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{self.reflector_api_url}/{asset}/{exchange}',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'price': data.get('price'),
                    'volume_24h': data.get('volume_24h', 0),
                    'confidence': data.get('confidence', 90),
                    'timestamp': datetime.now()
                }
        except Exception as e:
            print(f"Error fetching price data from Reflector API: {e}")
        
        return None
        
    def record_trade(self, trade_data):
        """Record a completed trade in the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO trades (
                timestamp, asset, buy_exchange, sell_exchange,
                buy_price, sell_price, amount, gross_profit,
                net_profit, fees, gas_cost, execution_time_ms, success
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            trade_data.get('timestamp', datetime.now()),
            trade_data['asset'],
            trade_data['buy_exchange'],
            trade_data['sell_exchange'],
            trade_data['buy_price'],
            trade_data['sell_price'],
            trade_data['amount'],
            trade_data['gross_profit'],
            trade_data['net_profit'],
            trade_data['fees'],
            trade_data['gas_cost'],
            trade_data['execution_time_ms'],
            trade_data['success']
        ))
        
        conn.commit()
        conn.close()
        
    def record_opportunity(self, opportunity_data):
        """Record an arbitrage opportunity in the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO opportunities (
                timestamp, asset, buy_exchange, sell_exchange,
                buy_price, sell_price, estimated_profit, confidence_score, executed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            opportunity_data.get('timestamp', datetime.now()),
            opportunity_data['asset'],
            opportunity_data['buy_exchange'],
            opportunity_data['sell_exchange'],
            opportunity_data['buy_price'],
            opportunity_data['sell_price'],
            opportunity_data['estimated_profit'],
            opportunity_data['confidence_score'],
            opportunity_data.get('executed', False)
        ))
        
        conn.commit()
        conn.close()
        
    def update_performance_metric(self, metric_name, value, unit=''):
        """Update a performance metric in the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO performance_metrics (timestamp, metric_name, value, unit)
            VALUES (?, ?, ?, ?)
        ''', (datetime.now(), metric_name, value, unit))
        
        conn.commit()
        conn.close()
        
    def get_trading_performance(self, days=30):
        """Get trading performance metrics for the last N days"""
        conn = sqlite3.connect(self.db_path)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get trade statistics
        trades_df = pd.read_sql_query('''
            SELECT * FROM trades 
            WHERE timestamp > ? 
            ORDER BY timestamp
        ''', conn, params=(cutoff_date,))
        
        conn.close()
        
        if trades_df.empty:
            return {
                'total_trades': 0,
                'successful_trades': 0,
                'success_rate': 0,
                'total_gross_profit': 0,
                'total_net_profit': 0,
                'avg_profit_per_trade': 0,
                'profit_factor': 0,
                'avg_execution_time': 0
            }
        
        successful_trades = trades_df[trades_df['success'] == 1]
        
        total_trades = len(trades_df)
        successful_count = len(successful_trades)
        success_rate = successful_count / total_trades if total_trades > 0 else 0
        
        total_gross_profit = trades_df['gross_profit'].sum()
        total_net_profit = trades_df['net_profit'].sum()
        avg_profit_per_trade = total_net_profit / total_trades if total_trades > 0 else 0
        
        # Profit factor (gross profits / gross losses)
        gross_profits = trades_df[trades_df['gross_profit'] > 0]['gross_profit'].sum()
        gross_losses = abs(trades_df[trades_df['gross_profit'] < 0]['gross_profit'].sum())
        profit_factor = gross_profits / gross_losses if gross_losses > 0 else float('inf')
        
        avg_execution_time = trades_df['execution_time_ms'].mean()
        
        return {
            'total_trades': total_trades,
            'successful_trades': successful_count,
            'success_rate': success_rate,
            'total_gross_profit': total_gross_profit,
            'total_net_profit': total_net_profit,
            'avg_profit_per_trade': avg_profit_per_trade,
            'profit_factor': profit_factor,
            'avg_execution_time': avg_execution_time
        }
        
    def get_profitability_analysis(self, days=30):
        """Analyze profitability trends"""
        conn = sqlite3.connect(self.db_path)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        trades_df = pd.read_sql_query('''
            SELECT timestamp, net_profit, success FROM trades 
            WHERE timestamp > ? 
            ORDER BY timestamp
        ''', conn, params=(cutoff_date,))
        
        conn.close()
        
        if trades_df.empty:
            return None
            
        # Convert timestamp to datetime
        trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
        trades_df['date'] = trades_df['timestamp'].dt.date
        
        # Group by date and calculate daily metrics
        daily_stats = trades_df.groupby('date').agg({
            'net_profit': ['sum', 'count', lambda x: (x > 0).sum()],
            'success': 'sum'
        }).reset_index()
        
        daily_stats.columns = ['date', 'daily_profit', 'total_trades', 'profitable_trades', 'successful_trades']
        daily_stats['success_rate'] = daily_stats['successful_trades'] / daily_stats['total_trades']
        daily_stats['profit_rate'] = daily_stats['profitable_trades'] / daily_stats['total_trades']
        
        return daily_stats
        
    def get_gas_cost_analysis(self, days=30):
        """Analyze gas cost trends and efficiency"""
        conn = sqlite3.connect(self.db_path)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        trades_df = pd.read_sql_query('''
            SELECT timestamp, gas_cost, net_profit FROM trades 
            WHERE timestamp > ? AND success = 1
            ORDER BY timestamp
        ''', conn, params=(cutoff_date,))
        
        conn.close()
        
        if trades_df.empty:
            return None
            
        # Calculate gas cost as percentage of profit
        trades_df['gas_cost_pct'] = (trades_df['gas_cost'] / trades_df['net_profit']) * 100
        trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
        
        return {
            'avg_gas_cost_pct': trades_df['gas_cost_pct'].mean(),
            'max_gas_cost_pct': trades_df['gas_cost_pct'].max(),
            'min_gas_cost_pct': trades_df['gas_cost_pct'].min(),
            'gas_cost_trend': trades_df.set_index('timestamp')['gas_cost_pct'].resample('D').mean()
        }
        
    def generate_performance_report(self, days=30):
        """Generate a comprehensive performance report"""
        performance = self.get_trading_performance(days)
        profitability = self.get_profitability_analysis(days)
        gas_analysis = self.get_gas_cost_analysis(days)
        
        report = {
            'report_date': datetime.now().isoformat(),
            'period_days': days,
            'trading_performance': performance,
            'profitability_analysis': profitability.to_dict() if profitability is not None else None,
            'gas_cost_analysis': gas_analysis
        }
        
        # Save report to file
        with open(f'performance_report_{datetime.now().strftime("%Y%m%d")}.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
            
        return report
        
    def plot_profitability_trend(self, days=30):
        """Plot profitability trend over time"""
        profitability = self.get_profitability_analysis(days)
        
        if profitability is None:
            print("No data available for plotting")
            return
            
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
        
        # Daily profit chart
        ax1.plot(profitability['date'], profitability['daily_profit'])
        ax1.set_title('Daily Profit Trend')
        ax1.set_ylabel('Profit')
        ax1.grid(True)
        
        # Success rate chart
        ax2.plot(profitability['date'], profitability['success_rate'], label='Success Rate')
        ax2.plot(profitability['date'], profitability['profit_rate'], label='Profit Rate')
        ax2.set_title('Trade Success and Profit Rates')
        ax2.set_ylabel('Rate')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        plt.savefig(f'profitability_trend_{datetime.now().strftime("%Y%m%d")}.png')
        plt.show()
        
    def plot_gas_efficiency(self, days=30):
        """Plot gas efficiency metrics"""
        gas_analysis = self.get_gas_cost_analysis(days)
        
        if gas_analysis is None:
            print("No data available for plotting")
            return
            
        plt.figure(figsize=(10, 6))
        gas_analysis['gas_cost_trend'].plot()
        plt.title('Gas Cost as Percentage of Profit (Daily Average)')
        plt.ylabel('Gas Cost (%)')
        plt.xlabel('Date')
        plt.grid(True)
        plt.savefig(f'gas_efficiency_{datetime.now().strftime("%Y%m%d")}.png')
        plt.show()

# Example usage
if __name__ == "__main__":
    analytics = PerformanceAnalytics()
    
    # Generate a performance report
    report = analytics.generate_performance_report(30)
    print("Performance Report Generated:")
    print(json.dumps(report['trading_performance'], indent=2, default=str))
    
    # Plot charts
    analytics.plot_profitability_trend(30)
    analytics.plot_gas_efficiency(30)