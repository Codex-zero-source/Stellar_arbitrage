#!/usr/bin/env python3
"""
Script to verify the trading account has been properly set up with XLM and custom assets
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
from stellar_sdk import Keypair
from trading_account import load_trading_account
from error_handler import check_account_balance
import json

# Load environment variables
load_dotenv()

def load_existing_accounts():
    """Load existing accounts from keypairs file."""
    KEYPAIRS_FILE = os.path.join("data", "keypairs.json")
    
    if not os.path.exists(KEYPAIRS_FILE):
        return []
    
    try:
        with open(KEYPAIRS_FILE, 'r') as f:
            data = json.load(f)
            return [Keypair.from_secret(item['secret']) for item in data]
    except Exception as e:
        print(f"Error loading existing accounts: {e}")
        return []

def verify_account_balances(account_public_key):
    """Verify account balances using our error handler."""
    print(f"\nAccount: {account_public_key}")
    
    balance_info = check_account_balance(account_public_key)
    if "error" in balance_info:
        print(f"Error checking balance: {balance_info['error']}")
        return False
    
    print("Balances:")
    print(f"  XLM: {balance_info['xlm_balance']}")
    
    # Print other balances if available
    if 'balances' in balance_info:
        for asset_code, asset_info in balance_info['balances'].items():
            if asset_code != "XLM":
                print(f"  {asset_code}: {asset_info['balance']}")
    
    return True

def main():
    print("Verifying trading account setup...")
    
    # Load trading account
    trading_account = load_trading_account()
    if not trading_account:
        print("No trading account found.")
        return
    
    print(f"Trading account public key: {trading_account.public_key}")
    
    # Verify balances
    if verify_account_balances(trading_account.public_key):
        print("\nTrading account verification successful!")
    else:
        print("\nTrading account verification failed!")

if __name__ == "__main__":
    main()