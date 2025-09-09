#!/usr/bin/env python3
"""
Test script to verify contract interactions
"""

import asyncio
import json
from contract_client import ContractClient
from trading_account import load_trading_account, ensure_sufficient_xlm

async def test_contract_interactions():
    print("Testing contract interactions...")
    
    # Initialize contract client
    contract_client = ContractClient()
    
    # Check if we have a connection to the Soroban server
    if not contract_client.server:
        print("ERROR: No connection to Soroban RPC server. Cannot interact with smart contracts.")
        print("Please check your network connection and RPC server availability.")
        return
    
    # Load trading account
    trader_keypair = load_trading_account()
    if not trader_keypair:
        print("No trading account available. Please create one first.")
        return
    
    print(f"Using trader account: {trader_keypair.public_key}")
    
    # Ensure the trading account has sufficient XLM
    if not ensure_sufficient_xlm(trader_keypair.public_key, 10.0):
        print("Failed to ensure sufficient XLM for trading account")
        return
    
    # Test 1: Set reflector contract ID
    print("\n1. Testing set_reflector_contract_id...")
    if contract_client.oracle_contract_id:
        result, error = contract_client.set_reflector_contract_id(
            trader_keypair, 
            contract_client.oracle_contract_id
        )
        if result:
            print("✓ Successfully set reflector contract ID")
        else:
            print(f"✗ Failed to set reflector contract ID: {error}")
    else:
        print("✗ REFLECTOR_ORACLE_CONTRACT_ID not set in environment variables")
    
    # Test 2: Get supported assets
    print("\n2. Testing get_supported_assets...")
    supported_assets = contract_client.get_supported_assets(trader_keypair)
    if supported_assets:
        print(f"✓ Successfully retrieved supported assets: {supported_assets}")
    else:
        print("✗ Failed to retrieve supported assets")
    
    # Test 3: Check if specific asset is supported
    print("\n3. Testing is_asset_supported...")
    test_asset = "AQUA"  # Common asset on Stellar testnet
    is_supported = contract_client.is_asset_supported(trader_keypair, test_asset)
    if is_supported:
        print(f"✓ Asset {test_asset} is supported")
    else:
        print(f"✗ Asset {test_asset} is not supported or check failed")
    
    # Test 4: Scan arbitrage opportunities
    print("\n4. Testing scan_arbitrage_opportunities...")
    # Use a small list of assets for testing
    test_assets = [test_asset] if is_supported else None
    result, error = contract_client.scan_opportunities(
        trader_keypair, 
        test_assets, 
        min_profit=1000000  # Small minimum profit for testing
    )
    if result:
        print("✓ Successfully scanned for arbitrage opportunities")
    else:
        print(f"✗ Failed to scan for arbitrage opportunities: {error}")

if __name__ == "__main__":
    asyncio.run(test_contract_interactions())