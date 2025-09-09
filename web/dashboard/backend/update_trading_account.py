#!/usr/bin/env python3
"""
Script to update the trading account with a new keypair
"""

import json
import os

def main():
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # New keypair data
    keypair_data = {
        'public_key': 'GBFLFTEA57EOYNASDESLHX4TU3QWFKCLEMCZKYGY7YXFKPKEK3XVRXZP',
        'secret': 'SD4LPGDTTEKFKAW77TZHM5FH4C5XQZ2XVUOAPO2YB3VKDU23P37BAZ6N'
    }
    
    # Save to trading account file
    with open('data/trading_account.json', 'w') as f:
        json.dump(keypair_data, f, indent=4)
    
    print("Trading account updated successfully!")

if __name__ == "__main__":
    main()