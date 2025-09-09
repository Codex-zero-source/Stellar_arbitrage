#!/usr/bin/env python3
"""
Setup script to create and fund a trading account
"""

from trading_account import setup_trading_account, load_trading_account, ensure_sufficient_xlm
from accounts import load_keypairs

def main():
    print("Setting up trading account...")
    
    # Load existing keypairs
    keypairs = load_keypairs()
    print(f"Loaded {len(keypairs)} existing accounts")
    
    # Setup trading account
    trading_account = setup_trading_account(keypairs)
    
    if trading_account:
        print(f"✓ Trading account setup complete: {trading_account.public_key}")
        
        # Ensure sufficient XLM
        if ensure_sufficient_xlm(trading_account.public_key, 20.0):
            print("✓ Trading account has sufficient XLM")
        else:
            print("✗ Failed to ensure sufficient XLM")
    else:
        print("✗ Failed to setup trading account")
        
        # Try to load existing trading account
        existing_account = load_trading_account()
        if existing_account:
            print(f"Loaded existing trading account: {existing_account.public_key}")
            
            # Ensure sufficient XLM
            if ensure_sufficient_xlm(existing_account.public_key, 20.0):
                print("✓ Trading account has sufficient XLM")
            else:
                print("✗ Failed to ensure sufficient XLM")

if __name__ == "__main__":
    main()