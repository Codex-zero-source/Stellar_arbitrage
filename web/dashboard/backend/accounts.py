import json
import os
import time
from stellar_sdk import Keypair, Server
import requests
from dotenv import load_dotenv
from error_handler import check_account_balance

# Load environment variables
load_dotenv()

KEYPAIRS_FILE = os.path.join("data", "keypairs.json")

def load_keypairs() -> list:
    """Loads keypairs from the JSON file."""
    if not os.path.exists(KEYPAIRS_FILE):
        return []
    
    with open(KEYPAIRS_FILE, 'r') as f:
        try:
            data = json.load(f)
            return [Keypair.from_secret(item['secret']) for item in data]
        except json.JSONDecodeError:
            return []

def save_keypairs(keypairs: list):
    """Saves keypairs to the JSON file."""
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(KEYPAIRS_FILE), exist_ok=True)
    
    with open(KEYPAIRS_FILE, 'w') as f:
        json.dump([{'public_key': kp.public_key, 'secret': kp.secret} for kp in keypairs], f, indent=4)

def ensure_account_funded(public_key: str, min_balance: float = 10.0) -> bool:
    """
    Check if an account has sufficient balance. Does not automatically fund.
    
    Args:
        public_key (str): The public key of the account to check
        min_balance (float): Minimum XLM balance required
        
    Returns:
        bool: True if account is properly funded, False otherwise
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    
    try:
        # Check current balance
        balance_info = check_account_balance(public_key, horizon_url)
        if "error" in balance_info:
            print(f"Error checking balance for {public_key}: {balance_info['error']}")
            print("Please manually ensure the account is properly funded")
            return False
            
        current_balance = balance_info['xlm_balance']
        print(f"Account {public_key} balance: {current_balance} XLM")
        
        if current_balance >= min_balance:
            return True
        else:
            print(f"Account balance ({current_balance}) is below minimum ({min_balance})")
            print("Please manually fund the account using Friendbot or another method")
            print(f"Friendbot URL: https://friendbot.stellar.org?addr={public_key}")
            return False
            
    except Exception as e:
        print(f"Error checking account {public_key}: {e}")
        print("Please manually ensure the account is properly funded")
        return False

def create_and_fund_accounts(num_accounts: int = None) -> list:
    """
    Creates Stellar accounts (without automatic funding),
    persisting them to a file.
    """
    if num_accounts is None:
        num_accounts = int(os.getenv('NUM_ACCOUNTS', 10))
    
    keypairs = load_keypairs()
    print(f"Loaded {len(keypairs)} existing accounts.")

    # First, check funding status of all existing accounts
    for i, keypair in enumerate(keypairs):
        public_key = keypair.public_key
        print(f"Checking funding for existing account #{i+1}: {public_key}")
        if not ensure_account_funded(public_key, 5.0):  # Check at least 5 XLM
            print(f"Warning: Account {public_key} may not be properly funded")

    # Create new accounts if needed
    while len(keypairs) < num_accounts:
        new_keypair = Keypair.random()
        public_key = new_keypair.public_key
        print(f"Creating new account #{len(keypairs) + 1} with public key: {public_key}")
        print("Please manually fund this account using Friendbot or another method")
        print(f"Friendbot URL: https://friendbot.stellar.org?addr={public_key}")
        
        keypairs.append(new_keypair)
        save_keypairs(keypairs)
            
    return keypairs