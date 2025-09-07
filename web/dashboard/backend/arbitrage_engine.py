import time
import os
import random
from dotenv import load_dotenv
from contract_client import ContractClient
from error_handler import check_account_balance, ensure_sufficient_fee
from trading_account import load_trading_account
from stellar_sdk import Asset

# Load environment variables
load_dotenv()

def run_arbitrage_engine(accounts: list, assets=None):
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
    
    # Check account status
    yield f"Using trader account: {trader_keypair.public_key}"
    
    # Check account balance
    balance_info = check_account_balance(trader_keypair.public_key)
    if "error" not in balance_info:
        yield f"Account XLM balance: {balance_info['xlm_balance']}"
    else:
        yield f"Could not check account balance: {balance_info['error']}"
        # If we can't check the balance, we'll proceed but warn the user
        yield "WARNING: Proceeding without verified account balance"
    
    # Define assets to scan for arbitrage opportunities
    # If assets are not provided, use default BTC/USDC pair
    if assets is None:
        # Create Asset objects for BTC and USDC
        if accounts and len(accounts) > 0:
            issuer_keypair = accounts[0]
            asset_codes = [
                Asset("BTC", issuer_keypair.public_key),
                Asset("USDC", issuer_keypair.public_key)
            ]
        else:
            # Fallback to string codes if no issuer available
            asset_codes = ["BTC", "USDC"]
    else:
        # Extract asset codes from the Asset objects or use as-is
        if isinstance(assets[0], Asset):
            asset_codes = [asset.code for asset in assets]
        else:
            asset_codes = assets

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
                if balance_info['xlm_balance'] < 1.0:  # Less than 1 XLM
                    yield "Warning: Low XLM balance. Please ensure account is properly funded."
            else:
                yield f"Could not check account balance: {balance_info['error']}"
            
            # Scan for arbitrage opportunities with the specified assets and minimum profit
            # Convert Asset objects to string codes if needed
            asset_strings = []
            if isinstance(asset_codes[0], Asset):
                asset_strings = [asset.code for asset in asset_codes]
            else:
                asset_strings = asset_codes
                
            yield f"Scanning for arbitrage opportunities with assets: {asset_strings}"
            result = contract_client.scan_arbitrage_opportunities(trader_keypair, asset_strings, min_profit=1000000)
            
            if result:
                yield "Arbitrage engine: Scan successful."
                # Parse the result and execute trades if opportunities are found
                # In a real implementation, we would parse the XDR response and execute trades
                yield "TODO: Parse opportunities and execute trades"
                consecutive_failures = 0  # Reset failure counter on success
            else:
                yield "Arbitrage engine: No opportunities found or scan failed."
                consecutive_failures += 1
                
                # If we have too many consecutive failures, pause longer
                if consecutive_failures >= max_consecutive_failures:
                    yield f"Too many consecutive failures ({consecutive_failures}). Pausing longer..."
                    time.sleep(scan_interval * 3)  # Wait 3x longer
                    consecutive_failures = 0  # Reset counter

        except Exception as e:
            yield f"Arbitrage engine: An error occurred: {e}"
            import traceback
            # This is not ideal for production, but for now, we'll yield the traceback
            yield traceback.format_exc()
            consecutive_failures += 1
            
            # If we have too many consecutive failures, pause longer
            if consecutive_failures >= max_consecutive_failures:
                yield f"Too many consecutive failures ({consecutive_failures}). Pausing longer..."
                time.sleep(scan_interval * 3)  # Wait 3x longer
                consecutive_failures = 0  # Reset counter

        # Respect the scan interval
        yield f"Waiting {scan_interval} seconds before next scan..."
        time.sleep(scan_interval)