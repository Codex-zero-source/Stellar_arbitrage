import time
import os
import random
import asyncio
from dotenv import load_dotenv
from contract_client import ContractClient
from error_handler import check_account_balance, ensure_sufficient_fee
from trading_account import load_trading_account, ensure_sufficient_xlm
from stellar_sdk import Asset

# Load environment variables
load_dotenv()

async def run_arbitrage_engine(accounts: list, assets=None):
    """
    Continuously scans for and executes arbitrage opportunities using the Soroban smart contract.
    """
    yield "Starting arbitrage engine..."
    
    # Initialize contract client
    contract_client = ContractClient()
    
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
            # Check account balance before each scan
            balance_info = check_account_balance(trader_keypair.public_key)
            if "error" not in balance_info:
                yield f"Current XLM balance: {balance_info['xlm_balance']}"
                if float(balance_info['xlm_balance']) < 1.0:  # Less than 1 XLM
                    yield "Warning: Low XLM balance. Consider funding the account."
                    # Try to ensure sufficient XLM
                    ensure_sufficient_xlm(trader_keypair.public_key, 5.0)
            
            yield f"Scanning for arbitrage opportunities with assets: {asset_codes}"
            result, error = contract_client.scan_arbitrage_opportunities(trader_keypair, asset_codes, min_profit=1000000)
            
            if result:
                yield "Arbitrage engine: Scan successful."
                # TODO: Parse the result and execute trades if opportunities are found
                yield "TODO: Parse opportunities and execute trades"
                consecutive_failures = 0  # Reset failure counter on success
            else:
                yield f"Arbitrage engine: No opportunities found or scan failed. Error: {error}"
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