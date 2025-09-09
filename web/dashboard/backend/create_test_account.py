#!/usr/bin/env python3
"""
Script to create a test trading account for development purposes
"""

import os
import sys
import json
from stellar_sdk import Keypair

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from trading_account import save_trading_account

def create_test_account():
    """Create a test trading account for development"""
    print("Creating test trading account...")
    
    # Create a new keypair
    keypair = Keypair.random()
    
    print(f"Test account public key: {keypair.public_key}")
    print(f"Test account secret: {keypair.secret}")
    print("WARNING: This is a test account for development only!")
    print("Do not use this account with real funds!")
    
    # Save the account
    save_trading_account(keypair)
    
    print(f"Test account saved to data/trading_account.json")
    
    # Also save to the main data directory for compatibility
    main_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    if not os.path.exists(main_data_dir):
        os.makedirs(main_data_dir)
    
    main_account_file = os.path.join(main_data_dir, "trading_account.json")
    with open(main_account_file, 'w') as f:
        json.dump({
            'public_key': keypair.public_key,
            'secret': keypair.secret
        }, f, indent=4)
    
    print(f"Test account also saved to {main_account_file}")
    
    return keypair

if __name__ == "__main__":
    create_test_account()