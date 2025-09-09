#!/usr/bin/env python3
"""
Module for creating and managing a dedicated trading account
"""

import os
import json
import time
from dotenv import load_dotenv
from stellar_sdk import Keypair, Server, TransactionBuilder, Network, Asset
from error_handler import check_account_balance
import requests

# Load environment variables
load_dotenv()

TRADING_ACCOUNT_FILE = os.path.join("data", "trading_account.json")

def load_trading_account() -> Keypair:
    """Load the trading account keypair from file."""
    if not os.path.exists(TRADING_ACCOUNT_FILE):
        return None
    
    try:
        with open(TRADING_ACCOUNT_FILE, 'r') as f:
            data = json.load(f)
            return Keypair.from_secret(data['secret'])
    except Exception as e:
        print(f"Error loading trading account: {e}")
        return None

def save_trading_account(keypair: Keypair):
    """Save the trading account keypair to file."""
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(TRADING_ACCOUNT_FILE), exist_ok=True)
    
    with open(TRADING_ACCOUNT_FILE, 'w') as f:
        json.dump({
            'public_key': keypair.public_key,
            'secret': keypair.secret
        }, f, indent=4)

def create_trading_account() -> Keypair:
    """
    Create a new trading account.
    
    Returns:
        Keypair: The new trading account keypair
    """
    print("Creating new trading account...")
    keypair = Keypair.random()
    print(f"New trading account public key: {keypair.public_key}")
    
    save_trading_account(keypair)
    return keypair

def fund_account_with_friendbot(public_key: str) -> bool:
    """
    Fund an account using Friendbot.
    
    Args:
        public_key (str): The public key of the account to fund
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"Funding account {public_key} with Friendbot...")
        response = requests.get(f"https://friendbot.stellar.org?addr={public_key}")
        response.raise_for_status()
        
        if response.status_code == 200:
            print(f"SUCCESS! Account {public_key} funded.")
            # Wait a moment for the funding to propagate
            time.sleep(2)
            return True
        else:
            print(f"ERROR! Could not fund account. Response: \n{response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Network error while funding account {public_key}: {e}")
        return False
    except Exception as e:
        print(f"Error funding account {public_key}: {e}")
        return False

def ensure_sufficient_xlm(public_key: str, min_balance: float = 20.0) -> bool:
    """
    Ensure the account has sufficient XLM balance.
    
    Args:
        public_key (str): The public key of the account
        min_balance (float): Minimum XLM balance required
        
    Returns:
        bool: True if account has sufficient balance, False otherwise
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    
    try:
        # Check current balance
        balance_info = check_account_balance(public_key, horizon_url)
        if "error" in balance_info:
            # If account not found, it needs to be funded first
            if "not found" in balance_info['error'].lower():
                print(f"Account {public_key} not found on network, funding it...")
                return fund_account_with_friendbot(public_key)
            else:
                print(f"Error checking balance for {public_key}: {balance_info['error']}")
                # Try to fund it anyway
                return fund_account_with_friendbot(public_key)
            
        current_balance = balance_info['xlm_balance']
        print(f"Account {public_key} XLM balance: {current_balance}")
        
        if current_balance >= min_balance:
            print(f"Account has sufficient XLM balance ({current_balance} >= {min_balance})")
            return True
            
        # If balance is too low, try to fund it
        print(f"Account balance ({current_balance}) is below minimum ({min_balance}), funding...")
        return fund_account_with_friendbot(public_key)
    except Exception as e:
        print(f"Error checking/funding XLM for account {public_key}: {e}")
        # Try to fund it anyway
        return fund_account_with_friendbot(public_key)

def establish_trustlines(account_keypair: Keypair, assets: list) -> bool:
    """
    Establish trustlines for the specified assets.
    
    Args:
        account_keypair (Keypair): The account keypair
        assets (list): List of Asset objects
        
    Returns:
        bool: True if successful, False otherwise
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    server = Server(horizon_url)
    
    try:
        source_account = server.load_account(account_keypair.public_key)
    except Exception as e:
        print(f"Error loading account {account_keypair.public_key}: {e}")
        return False
    
    success = True
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
            tx.sign(account_keypair)
            
            response = server.submit_transaction(tx)
            print(f"Trustline established for {asset.code}: {response['hash']}")
        except Exception as e:
            print(f"Error establishing trustline for {asset.code}: {e}")
            # If trustline already exists, we can ignore the error and proceed
            if "op_already_exists" not in str(e).lower():
                success = False
    
    return success

def distribute_assets(issuer_keypair: Keypair, recipient_keypair: Keypair, assets: list) -> bool:
    """
    Distribute assets from issuer to recipient.
    
    Args:
        issuer_keypair (Keypair): The asset issuer keypair
        recipient_keypair (Keypair): The recipient keypair
        assets (list): List of Asset objects to distribute
        
    Returns:
        bool: True if successful, False otherwise
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    server = Server(horizon_url)
    
    try:
        issuer_account = server.load_account(issuer_keypair.public_key)
    except Exception as e:
        print(f"Error loading issuer account {issuer_keypair.public_key}: {e}")
        return False
    
    success = True
    for asset in assets:
        print(f"Distributing {asset.code} to trading account...")
        try:
            builder = TransactionBuilder(
                source_account=issuer_account,
                network_passphrase=network_passphrase,
                base_fee=100,
            ).set_timeout(30)

            builder.append_payment_op(
                destination=recipient_keypair.public_key,
                asset=asset,
                amount="10000"  # Distribute 10,000 units of each asset
            )
            tx = builder.build()
            tx.sign(issuer_keypair)

            response = server.submit_transaction(tx)
            print(f"Asset {asset.code} distributed: {response['hash']}")
        except Exception as e:
            print(f"Error distributing asset {asset.code}: {e}")
            success = False
    
    return success

def setup_trading_account(accounts: list = None) -> Keypair:
    """
    Create and fully set up a trading account with XLM and custom assets.
    
    Args:
        accounts (list): List of existing accounts (to get issuer account)
        
    Returns:
        Keypair: The trading account keypair
    """
    print("Setting up dedicated trading account...")
    
    # Load existing trading account or create new one
    trading_account = load_trading_account()
    if not trading_account:
        trading_account = create_trading_account()
    else:
        print(f"Loaded existing trading account: {trading_account.public_key}")
    
    # Ensure sufficient XLM
    if not ensure_sufficient_xlm(trading_account.public_key, 20.0):
        print("Failed to ensure sufficient XLM balance")
        return None
    
    # Define assets
    if accounts and len(accounts) > 0:
        issuer_keypair = accounts[0]
    else:
        # If no accounts provided, we can't create assets
        print("No issuer account provided, skipping asset distribution")
        return trading_account
    
    assets = [
        Asset("BTC", issuer_keypair.public_key),
        Asset("USDC", issuer_keypair.public_key),
    ]
    
    # Establish trustlines
    print("Establishing trustlines...")
    if not establish_trustlines(trading_account, assets):
        print("Failed to establish all trustlines")
        return trading_account
    
    # Distribute assets
    print("Distributing assets...")
    if not distribute_assets(issuer_keypair, trading_account, assets):
        print("Failed to distribute all assets")
        return trading_account
    
    print("Trading account setup complete!")
    return trading_account

if __name__ == "__main__":
    # This can be run standalone to create and setup a trading account
    setup_trading_account()