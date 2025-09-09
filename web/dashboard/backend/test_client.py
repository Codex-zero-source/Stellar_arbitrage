#!/usr/bin/env python3
"""
Test script to verify contract client initialization
"""

from contract_client import ContractClient
from trading_account import load_trading_account

def test_client_initialization():
    print("Testing contract client initialization...")
    
    try:
        # Initialize contract client
        contract_client = ContractClient()
        print("✓ Contract client initialized")
        
        # Check if we have contract IDs
        print(f"Arbitrage contract ID: {contract_client.arbitrage_contract_id}")
        print(f"Oracle contract ID: {contract_client.oracle_contract_id}")
        
        # Check Soroban server connection
        if contract_client.server:
            print("✓ Connected to Soroban RPC server")
        else:
            print("⚠ No connection to Soroban RPC server (may be due to network issues)")
            
        # Load trading account
        trader_keypair = load_trading_account()
        if trader_keypair:
            print(f"✓ Trading account loaded: {trader_keypair.public_key}")
        else:
            print("⚠ No trading account found")
            
    except Exception as e:
        print(f"✗ Error initializing contract client: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_client_initialization()