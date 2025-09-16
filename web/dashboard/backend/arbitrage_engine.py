import time
import os
import random
import asyncio
from dotenv import load_dotenv
from contract_client import ContractClient
from error_handler import check_account_balance, ensure_sufficient_fee
from trading_account import load_trading_account, ensure_sufficient_xlm
from risk_management import RiskManager, RiskLevel
from data_processor import data_processor, PriceData, TradeRecord
from stellar_sdk import Asset
import uuid

# Load environment variables
load_dotenv()

async def parse_arbitrage_result(result):
    """Parse the result from contract scan and extract arbitrage opportunities."""
    try:
        if not result:
            return []
        
        # For now, return empty list since we need to implement proper parsing
        # based on the actual contract response format
        return []
    except Exception as e:
        print(f"Error parsing arbitrage result: {e}")
        return []

async def mock_arbitrage_scan(asset_codes):
    """Mock arbitrage scanning for demonstration purposes."""
    try:
        opportunities = []
        
        # Simulate finding arbitrage opportunities between different asset pairs
        for i, asset in enumerate(asset_codes[:3]):  # Limit to first 3 assets
            if random.random() > 0.7:  # 30% chance of finding an opportunity
                profit_percentage = random.uniform(0.1, 2.5)  # 0.1% to 2.5% profit
                opportunities.append({
                    'pair': f'{asset}/XLM',
                    'profit_percentage': profit_percentage,
                    'estimated_profit': profit_percentage * 100,  # Mock profit in stroops
                    'exchange_a': 'StellarX',
                    'exchange_b': 'Aquarius',
                    'asset': asset
                })
        
        # Sort by profit percentage (highest first)
        opportunities.sort(key=lambda x: x['profit_percentage'], reverse=True)
        return opportunities
        
    except Exception as e:
        print(f"Error in mock arbitrage scan: {e}")
        return []

async def execute_arbitrage_opportunity(contract_client, trader_keypair, opportunity):
    """Execute an arbitrage opportunity (mock implementation for now)."""
    try:
        # For now, this is a mock implementation
        # In a real implementation, this would execute the actual trades
        
        profit = opportunity.get('estimated_profit', 0)
        pair = opportunity.get('pair', 'Unknown')
        
        # Simulate execution time
        await asyncio.sleep(1)
        
        # Mock execution result
        if random.random() > 0.2:  # 80% success rate
            return f"Successfully executed arbitrage on {pair} with profit of {profit} stroops"
        else:
            return f"Failed to execute arbitrage on {pair} - market conditions changed"
            
    except Exception as e:
        return f"Error executing arbitrage: {e}"

async def run_arbitrage_engine(accounts: list, assets=None):
    """
    Continuously scans for and executes arbitrage opportunities using the Soroban smart contract.
    """
    yield "Starting arbitrage engine..."
    
    # Initialize contract client and risk manager
    contract_client = ContractClient()
    risk_manager = RiskManager()
    
    # Use dedicated trading account if available, otherwise use the first account provided
    trading_account = load_trading_account()
    if trading_account:
        trader_keypair = trading_account
        yield "Using dedicated trading account"
    elif accounts and len(accounts) > 0:
        trader_keypair = accounts[0]
        yield "Using provided trading account"
    else:
        yield "No trading account available. Cannot proceed."
        return
    
    # Check account status and ensure it's properly funded
    yield f"Using trader account: {trader_keypair.public_key}"
    
    # Ensure the trading account has sufficient XLM
    balance_info = check_account_balance(trader_keypair.public_key)
    if "error" in balance_info:
        yield f"Error checking account balance: {balance_info['error']}"
        return
    
    xlm_balance = balance_info.get('xlm_balance', 0)
    yield f"Account XLM balance: {xlm_balance}"
    
    if xlm_balance < 10.0:
        yield "Insufficient XLM balance. Attempting to fund account..."
        if not ensure_sufficient_xlm(trader_keypair.public_key, 10.0):
            yield "Failed to ensure sufficient XLM for trading account"
            return
        else:
            yield "Account funded successfully"
    
    # Check if we have a connection to the Soroban server
    if not contract_client.server:
        yield "ERROR: No connection to Soroban RPC server. Cannot interact with smart contracts."
        yield "Please check your network connection and RPC server availability."
        return
    
    # Fetch supported assets from the contract
    yield "Fetching supported assets from the contract..."
    supported_assets = contract_client.get_supported_assets(trader_keypair)
    if not supported_assets:
        yield "Could not fetch supported assets. Using default list."
        asset_codes = ["AQUA", "yUSDC", "EURC", "BTCLN", "KALE"]
    else:
        yield f"Contract supports the following assets: {supported_assets}"
        # Extract asset codes from the returned data structure
        if isinstance(supported_assets, list):
            if isinstance(supported_assets[0], dict) and 'code' in supported_assets[0]:
                asset_codes = [asset['code'] for asset in supported_assets]
            else:
                asset_codes = supported_assets
        else:
            asset_codes = ["AQUA", "yUSDC", "EURC", "BTCLN", "KALE"]

    scan_interval = int(os.getenv('ARBITRAGE_SCAN_INTERVAL', 15))
    consecutive_failures = 0
    max_consecutive_failures = 5  # Maximum consecutive failures before pausing

    while True:
        yield "Arbitrage engine: Scanning for opportunities..."
        try:
            # Check risk limits before scanning
            should_stop, stop_reason = risk_manager.should_stop_trading()
            if should_stop:
                yield f"Trading halted: {stop_reason}"
                await asyncio.sleep(scan_interval)
                continue
            # Check account balance before each scan
            balance_info = check_account_balance(trader_keypair.public_key)
            if "error" not in balance_info:
                yield f"Current XLM balance: {balance_info['xlm_balance']}"
                if float(balance_info['xlm_balance']) < 1.0:  # Less than 1 XLM
                    yield "Warning: Low XLM balance. Consider funding the account."
                    # Try to ensure sufficient XLM
                    ensure_sufficient_xlm(trader_keypair.public_key, 5.0)
            
            yield f"Scanning for arbitrage opportunities with assets: {asset_codes}"
            
            # Try contract-based scanning first
            result, error = contract_client.scan_opportunities(trader_keypair, asset_codes, min_profit=1000000)
            
            if result:
                yield "Arbitrage engine: Contract scan successful."
                # Parse the result and check for opportunities
                opportunities = await parse_arbitrage_result(result)
                if opportunities:
                    yield f"Found {len(opportunities)} arbitrage opportunities!"
                    for i, opp in enumerate(opportunities):
                        yield f"Opportunity {i+1}: {opp['description']} - Profit: {opp['profit']}"
                        # Execute the most profitable opportunity
                        if i == 0:  # Execute first (most profitable) opportunity
                            execution_result = await execute_arbitrage_opportunity(contract_client, trader_keypair, opp)
                            yield f"Execution result: {execution_result}"
                else:
                    yield "Contract scan successful but no profitable opportunities found."
                    consecutive_failures = 0  # Reset failure counter on success
            else:
                yield f"Contract scan failed. Error: {error}"
                # Fallback to mock scanning for demonstration
                yield "Falling back to mock arbitrage detection..."
                
                # Update price data for tracked assets
                current_time = time.time()
                mock_prices = {
                    'AQUA/XLM': 0.015 + (time.time() % 100) * 0.0001,
                    'yUSDC/XLM': 8.5 + (time.time() % 50) * 0.01,
                    'EURC/XLM': 9.2 + (time.time() % 30) * 0.005,
                    'BTCLN/XLM': 2850.0 + (time.time() % 200) * 0.1,
                    'KALE/XLM': 0.12 + (time.time() % 20) * 0.001
                }
                
                for symbol, price in mock_prices.items():
                    price_data = PriceData(
                        symbol=symbol,
                        price=price,
                        timestamp=current_time,
                        volume=1000 + (time.time() % 500),
                        bid=price * 0.999,
                        ask=price * 1.001,
                        source="mock"
                    )
                    data_processor.update_price(price_data)
                
                mock_opportunities = await mock_arbitrage_scan(asset_codes)
                if mock_opportunities:
                    yield f"Mock scan found {len(mock_opportunities)} potential opportunities:"
                    
                    # Apply risk management to each opportunity
                    for opp in mock_opportunities:
                        yield f"  - {opp['pair']}: {opp['profit_percentage']:.2f}% profit potential"
                        
                        # Assess risk for this opportunity
                        risk_assessment = risk_manager.assess_trade_risk(opp)
                        yield f"    Risk Level: {risk_assessment.risk_level.value.upper()}, Score: {risk_assessment.risk_score:.1f}"
                        yield f"    Recommended Position: {risk_assessment.recommended_position_size:.2f} XLM"
                        
                        if risk_assessment.warnings:
                            yield f"    Warnings: {', '.join(risk_assessment.warnings)}"
                        
                        # Execute if risk assessment allows
                        if risk_assessment.should_execute:
                            trade_id = str(uuid.uuid4())[:8]
                            yield f"    Executing trade {trade_id} with position size {risk_assessment.recommended_position_size:.2f} XLM"
                            
                            # Record trade start
                            risk_manager.record_trade_start(trade_id, risk_assessment.recommended_position_size, opp)
                            
                            # Create trade record for data processor
                            trade_record = TradeRecord(
                                trade_id=trade_id,
                                symbol=opp['pair'],
                                side='buy',  # Arbitrage typically starts with a buy
                                amount=risk_assessment.recommended_position_size,
                                price=opp.get('buy_price', 0.015),
                                fee=risk_assessment.recommended_position_size * 0.001,  # 0.1% fee
                                timestamp=time.time(),
                                status='pending',
                                exchange='stellar'
                            )
                        
                            # Execute the trade
                            execution_result = await execute_arbitrage_opportunity(contract_client, trader_keypair, opp)
                            yield f"    Execution result: {execution_result}"
                            
                            # Simulate PnL and record trade end
                            simulated_pnl = random.uniform(-2.0, 5.0)  # Random PnL for demo
                            success = simulated_pnl > 0
                            
                            # Update trade record with results
                            trade_record.status = 'completed' if success else 'failed'
                            trade_record.profit_loss = simulated_pnl
                            
                            # Record trade in data processor
                            data_processor.record_trade(trade_record)
                            
                            # Record trade end in risk manager
                            risk_manager.record_trade_end(trade_id, simulated_pnl, success)
                            
                            # Show risk summary
                            risk_summary = risk_manager.get_risk_summary()
                            yield f"    Daily PnL: {risk_summary['daily_pnl']:.2f} XLM, Active trades: {risk_summary['active_trades_count']}"
                        else:
                            yield f"    Trade rejected due to risk assessment"
                    
                    consecutive_failures = 0  # Reset on mock success
                else:
                    yield "No opportunities found in mock scan either."
                    consecutive_failures += 1
                
                if consecutive_failures >= max_consecutive_failures:
                    yield f"Too many consecutive failures ({consecutive_failures}). Pausing longer..."
                    time.sleep(scan_interval * 3)  # Wait 3x longer
                    consecutive_failures = 0  # Reset counter
                    ensure_sufficient_xlm(trader_keypair.public_key, 10.0)

        except Exception as e:
            yield f"Arbitrage engine: An error occurred: {e}"
            import traceback
            yield traceback.format_exc()
            consecutive_failures += 1
            
            if consecutive_failures >= max_consecutive_failures:
                yield f"Too many consecutive failures ({consecutive_failures}). Pausing longer..."
                time.sleep(scan_interval * 3)  # Wait 3x longer
                consecutive_failures = 0  # Reset counter
                ensure_sufficient_xlm(trader_keypair.public_key, 10.0)

        yield f"Waiting {scan_interval} seconds before next scan..."
        await asyncio.sleep(scan_interval)

if __name__ == "__main__":
    async def run_sync():
        async for message in run_arbitrage_engine(accounts=[]):
            print(message)
    
    asyncio.run(run_sync())