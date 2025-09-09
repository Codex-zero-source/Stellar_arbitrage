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
    Check if an account has sufficient balance and fund it if needed.
    
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
            return False
            
        current_balance = balance_info['xlm_balance']
        print(f"Account {public_key} balance: {current_balance} XLM")
        
        if current_balance >= min_balance:
            return True
            
        # If balance is too low, try to fund it
        print(f"Funding account {public_key} with Friendbot...")
        response = requests.get(f"https://friendbot.stellar.org?addr={public_key}")
        response.raise_for_status()
        
        if response.status_code == 200:
            print(f"SUCCESS! Account {public_key} funded.")
            # Wait a moment for the funding to propagate
            time.sleep(2)
            return True
        else:
            print(f"ERROR! Could not fund account {public_key}. Response: \n{response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Network error while funding account {public_key}: {e}")
        return False
    except Exception as e:
        print(f"Error checking/funding account {public_key}: {e}")
        return False

def create_and_fund_accounts(num_accounts: int = None) -> list:
    """
    Creates and funds a specified number of Stellar accounts using Friendbot,
    persisting them to a file.
    """
    if num_accounts is None:
        num_accounts = int(os.getenv('NUM_ACCOUNTS', 10))
    
    keypairs = load_keypairs()
    print(f"Loaded {len(keypairs)} existing accounts.")

    # First, ensure all existing accounts are properly funded
    for i, keypair in enumerate(keypairs):
        public_key = keypair.public_key
        print(f"Checking funding for existing account #{i+1}: {public_key}")
        if not ensure_account_funded(public_key, 5.0):  # Ensure at least 5 XLM
            print(f"Warning: Could not ensure funding for account {public_key}")

    # Create new accounts if needed
    while len(keypairs) < num_accounts:
        new_keypair = Keypair.random()
        public_key = new_keypair.public_key
        print(f"Creating and funding new account #{len(keypairs) + 1} with public key: {public_key}")

        try:
            response = requests.get(f"https://friendbot.stellar.org?addr={public_key}")
            response.raise_for_status()
            if response.status_code == 200:
                print(f"SUCCESS! Account #{len(keypairs) + 1} funded.")
                keypairs.append(new_keypair)
                save_keypairs(keypairs)
                # Wait a moment for the funding to propagate
                time.sleep(2)
            else:
                print(f"ERROR! Could not fund account. Response: \n{response.text}")
        except requests.exceptions.RequestException as e:
            print(f"An error occurred while funding account: {e}")
            # Don't add the keypair if funding failed
            break
            
    return keypairs