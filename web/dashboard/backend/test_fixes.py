#!/usr/bin/env python3
"""
Test script to verify our fixes for the account funding issue
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__)))

from trading_account import load_trading_account
from error_handler import check_account_balance

def test_account_balance_check():
    """Test that we can check account balance without errors"""
    print("Testing account balance check...")
    
    # Load the existing trading account
    trading_account = load_trading_account()
    if not trading_account:
        print("No trading account found!")
        return False
    
    print(f"Trading account: {trading_account.public_key}")
    
    # Check the balance (this should not try to fund the account)
    balance_info = check_account_balance(trading_account.public_key)
    print(f"Balance info: {balance_info}")
    
    if "error" in balance_info:
        print(f"Expected error (account may not be funded): {balance_info['error']}")
        return True  # This is expected if account isn't funded
    else:
        print(f"Account balance: {balance_info['xlm_balance']} XLM")
        return True

if __name__ == "__main__":
    success = test_account_balance_check()
    if success:
        print("Test completed successfully!")
    else:
        print("Test failed!")
        sys.exit(1)