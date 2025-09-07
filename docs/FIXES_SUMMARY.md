# Fixes for Account Funding Issues

## Problem
The arbitrage engine was automatically trying to fund accounts using Friendbot, which was causing errors:
1. `'Account' object is not subscriptable` error in the balance checking function
2. Network errors when trying to fund accounts with Friendbot
3. The script was stopping when funding failed

## Root Causes
1. **Account object access error**: In `error_handler.py`, the code was trying to access the Stellar SDK Account object as if it were a dictionary (`account['balances']` instead of `account.balances`)
2. **Automatic funding**: Multiple modules were trying to automatically fund accounts using Friendbot without proper error handling
3. **No manual funding option**: Users couldn't manually fund accounts and have the system work

## Fixes Applied

### 1. Fixed Account Object Access (`error_handler.py`)
```python
# Before (incorrect):
for balance in account['balances']:
    if balance['asset_type'] == "native":
        xlm_balance = float(balance['balance'])

# After (correct):
for balance in account.balances:
    if balance.asset_type == "native":
        xlm_balance = float(balance.balance)
```

### 2. Removed Automatic Funding from `trading_account.py`
- Modified `fund_account_with_friendbot()` to only display instructions instead of actually funding
- Modified `ensure_sufficient_xlm()` to only check balances and provide funding instructions
- Updated `create_trading_account()` to show manual funding instructions

### 3. Removed Automatic Funding from `accounts.py`
- Modified `ensure_account_funded()` to only check balances and provide funding instructions
- Modified `create_and_fund_accounts()` to only create accounts and provide manual funding instructions

### 4. Updated `arbitrage_engine.py`
- Removed calls to automatic funding functions
- Added warnings when accounts may not be properly funded
- Allowed the engine to continue running even if account balance checks fail

## Manual Funding Instructions
To manually fund any account, use the Friendbot URL:
```
https://friendbot.stellar.org?addr={ACCOUNT_PUBLIC_KEY}
```

For example, for the trading account:
https://friendbot.stellar.org?addr=GDE5PCMS5HJWTNRURCTCISWXEXQUNGRJMOH3GB73YS3WD75JXYBPFPKB

## Testing
The changes have been tested to ensure:
1. Account balance checking works correctly
2. No automatic funding attempts are made
3. Clear instructions are provided for manual funding
4. The arbitrage engine continues running even if accounts are not funded

## Files Modified
1. `web/dashboard/backend/error_handler.py` - Fixed account object access
2. `web/dashboard/backend/arbitrage_engine.py` - Removed automatic funding
3. `web/dashboard/backend/trading_account.py` - Removed automatic funding
4. `web/dashboard/backend/accounts.py` - Removed automatic funding