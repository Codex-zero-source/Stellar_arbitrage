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
    
    # Load existing accounts to get the issuer
    accounts = load_existing_accounts()
    if not accounts:
        print("No existing accounts found. Cannot establish trustlines without issuer.")
        return
    
    issuer_keypair = accounts[0]
    print(f"Using issuer account: {issuer_keypair.public_key}")
    
    # Define assets
    assets = [
        Asset("BTC", issuer_keypair.public_key),
        Asset("USDC", issuer_keypair.public_key),
    ]
    
    # For this specific task, we'll just establish trustlines and distribute assets
    # to the trading account, not all accounts
    
    # We'll reuse some functions from assets.py but modify them for our specific needs
    
    # Since we're only setting up one account, we can simplify the process
    from stellar_sdk import Server, TransactionBuilder
    import time
    
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    server = Server(horizon_url)
    
    # Establish trustlines for trading account
    print("Establishing trustlines for trading account...")
    try:
        source_account = server.load_account(trading_account.public_key)
    except Exception as e:
        print(f"Error loading trading account: {e}")
        return
    
    for asset in assets:
        print(f"Establishing trustline for {asset.code}:{asset.issuer}...")
        try:
            builder = TransactionBuilder(
                source_account=source_account,
                network_passphrase=network_passphrase,
                base_fee=100,
            ).set_timeout(30)
            
            builder.append_change_trust_op(asset=asset, limit="10000000")
            tx = builder.build()
            tx.sign(trading_account)
            
            response = server.submit_transaction(tx)
            print(f"Trustline established for {asset.code}: {response['hash']}")
            time.sleep(2)  # Wait between transactions
        except Exception as e:
            print(f"Error establishing trustline for {asset.code}: {e}")
            if "op_already_exists" not in str(e).lower():
                continue
    
    # Distribute assets from issuer to trading account
    print("Distributing assets to trading account...")
    try:
        issuer_account = server.load_account(issuer_keypair.public_key)
    except Exception as e:
        print(f"Error loading issuer account: {e}")
        return
    
    for asset in assets:
        print(f"Distributing {asset.code} to trading account...")
        try:
            builder = TransactionBuilder(
                source_account=issuer_account,
                network_passphrase=network_passphrase,
                base_fee=100,
            ).set_timeout(30)

            builder.append_payment_op(
                destination=trading_account.public_key,
                asset=asset,
                amount="10000"  # Distribute 10,000 units of each asset
            )
            tx = builder.build()
            tx.sign(issuer_keypair)

            response = server.submit_transaction(tx)
            print(f"Asset {asset.code} distributed: {response['hash']}")
            time.sleep(2)  # Wait between transactions
        except Exception as e:
            print(f"Error distributing asset {asset.code}: {e}")
    
    print("Asset setup for trading account complete!")

if __name__ == "__main__":
    main()