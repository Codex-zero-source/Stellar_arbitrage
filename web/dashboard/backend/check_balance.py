#!/usr/bin/env python3
"""
Script to check the trading account balance
"""

from error_handler import check_account_balance
from trading_account import load_trading_account
import json

def main():
    # Load trading account
    trading_account = load_trading_account()
    if not trading_account:
        print("No trading account found.")
        return
    
    print(f"Checking balance for account: {trading_account.public_key}")
    
    # Check account balance
    result = check_account_balance(trading_account.public_key)
    
    print(f"Full result: {json.dumps(result, indent=2)}")
    
    if "error" in result:
        print(f"Error checking balance: {result['error']}")
        return
    
    print(f"XLM Balance: {result.get('xlm_balance', 'Unknown')}")
    print(f"Balances: {result.get('balances', {})}")

if __name__ == "__main__":
    main()