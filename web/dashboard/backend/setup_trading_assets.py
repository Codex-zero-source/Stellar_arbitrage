#!/usr/bin/env python3
"""
Script to establish trustlines and distribute assets to the trading account
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
from stellar_sdk import Keypair, Asset
from trading_account import load_trading_account
from assets import create_assets_and_trustlines
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

def main():
    print("Setting up assets for trading account...")
    
    # Load trading account
    trading_account = load_trading_account()
    if not trading_account:
        print("No trading account found. Please run trading_account.py first.")
        return
    
    print(f"Trading account: {trading_account.public_key}")
    
    # Load existing accounts (we'll include the trading account in the list for trustline establishment)
    accounts = load_existing_accounts()
    
    # Add trading account to the list of accounts for trustline establishment
    accounts.append(trading_account)
    
    # Use the updated create_assets_and_trustlines function which now handles real assets
    # This function establishes trustlines for all real assets for all accounts
    real_assets = create_assets_and_trustlines(accounts)
    
    print("Asset setup for trading account complete!")
    print("Note: Real assets are already issued on the network, no distribution needed.")

if __name__ == "__main__":
    main()