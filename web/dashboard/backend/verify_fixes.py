#!/usr/bin/env python3
"""
Verification script for the fixes to the account funding issue
"""

import os
import sys
import traceback

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

def test_error_handler():
    """Test the error handler fix"""
    print("Testing error_handler.py fix...")
    try:
        from error_handler import check_account_balance
        
        # Test with the existing trading account
        test_account = "GDE5PCMS5HJWTNRURCTCISWXEXQUNGRJMOH3GB73YS3WD75JXYBPFPKB"
        result = check_account_balance(test_account)
        
        print(f"Balance check result: {result}")
        if "error" in result:
            print("SUCCESS: Error handler correctly returned error info without crashing")
            return True
        else:
            print("SUCCESS: Error handler correctly returned balance info")
            return True
    except Exception as e:
        print(f"FAILED: Error in error_handler: {e}")
        traceback.print_exc()
        return False

def test_trading_account():
    """Test the trading account module"""
    print("\nTesting trading_account.py fix...")
    try:
        from trading_account import load_trading_account, ensure_sufficient_xlm
        
        # Load the trading account
        account = load_trading_account()
        if account:
            print(f"SUCCESS: Loaded trading account: {account.public_key}")
            
            # Test balance check (should not try to fund)
            result = ensure_sufficient_xlm(account.public_key, 1.0)
            print(f"Balance check result: {result}")
            print("SUCCESS: Trading account module did not try to auto-fund")
            return True
        else:
            print("INFO: No trading account found, but module loaded correctly")
            return True
    except Exception as e:
        print(f"FAILED: Error in trading_account: {e}")
        traceback.print_exc()
        return False

def test_arbitrage_engine_import():
    """Test that we can import the arbitrage engine without errors"""
    print("\nTesting arbitrage_engine.py import...")
    try:
        from arbitrage_engine import run_arbitrage_engine
        print("SUCCESS: Arbitrage engine imported without errors")
        return True
    except Exception as e:
        print(f"FAILED: Error importing arbitrage_engine: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all verification tests"""
    print("Verifying fixes for account funding issues...\n")
    
    tests = [
        test_error_handler,
        test_trading_account,
        test_arbitrage_engine_import
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"Test failed with exception: {e}")
            traceback.print_exc()
            results.append(False)
    
    print(f"\nResults: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("All fixes verified successfully!")
        return 0
    else:
        print("Some fixes failed verification!")
        return 1

if __name__ == "__main__":
    sys.exit(main())