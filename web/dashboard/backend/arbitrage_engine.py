import time
import os
import random
from dotenv import load_dotenv
from contract_client import ContractClient
from error_handler import check_account_balance, ensure_sufficient_fee
from trading_account import load_trading_account, ensure_sufficient_xlm
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
    
    # Check account status and ensure it's properly funded
    yield f"Using trader account: {trader_keypair.public_key}"
    
    # Ensure the trading account has sufficient XLM
    if not ensure_sufficient_xlm(trader_keypair.public_key, 10.0):  # Ensure at least 10 XLM
        yield "Failed to ensure sufficient XLM for trading account"
        return
    
    # Check account balance after ensuring funding
    balance_info = check_account_balance(trader_keypair.public_key)
    if "error" not in balance_info:
        yield f"Account XLM balance: {balance_info['xlm_balance']}"
    else:
        yield f"Could not check account balance: {balance_info['error']}"
    
    # Define assets to scan for arbitrage opportunities
    # If assets are not provided, use real Reflector-tracked assets
    if assets is None:
        # Use real asset codes
        asset_codes = contract_client.get_supported_assets(trader_keypair)
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
                if float(balance_info['xlm_balance']) < 1.0:  # Less than 1 XLM
                    yield "Warning: Low XLM balance. Consider funding the account."
                    # Try to ensure sufficient funds
                    ensure_sufficient_xlm(trader_keypair.public_key, 5.0)
            
            # Scan for arbitrage opportunities with the specified assets and minimum profit
            # Convert Asset objects to string codes if needed
            asset_strings = []
            for asset in asset_codes:
                if hasattr(asset, "code") and not isinstance(asset, str):
                    asset_strings.append(asset.code)
                else:
                    asset_strings.append(asset)
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
                    # Also try to ensure account is properly funded
                    ensure_sufficient_xlm(trader_keypair.public_key, 10.0)

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
                # Also try to ensure account is properly funded
                ensure_sufficient_xlm(trader_keypair.public_key, 10.0)

        # Respect the scan interval
        yield f"Waiting {scan_interval} seconds before next scan..."
        time.sleep(scan_interval)

if __name__ == "__main__":
    for message in run_arbitrage_engine(accounts=[]):
        print(message)