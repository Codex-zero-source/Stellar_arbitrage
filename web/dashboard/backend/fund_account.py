#!/usr/bin/env python3
"""
Script to fund an account with Friendbot
"""

import requests
import time
from trading_account import load_trading_account

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

def main():
    # Load trading account
    trading_account = load_trading_account()
    if not trading_account:
        print("No trading account found. Please create one first.")
        return
    
    public_key = trading_account.public_key
    print(f"Funding trading account: {public_key}")
    
    if fund_account_with_friendbot(public_key):
        print("Account funded successfully!")
    else:
        print("Failed to fund account.")

if __name__ == "__main__":
    main()