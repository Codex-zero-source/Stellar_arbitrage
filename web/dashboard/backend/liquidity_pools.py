import os
import time
from dotenv import load_dotenv
from stellar_sdk import Server, TransactionBuilder, LiquidityPoolAsset, Network, Asset

# Load environment variables
load_dotenv()

def setup_liquidity_pools(accounts: list, assets: list):
    """
    Sets up liquidity pools for the created assets.
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    server = Server(horizon_url)
    
    if len(accounts) < 2:
        print("Not enough accounts to set up liquidity pools")
        return []
    
    # Use the second account as liquidity provider
    liquidity_provider = accounts[1]
    asset_a = assets[0] if len(assets) > 0 else Asset("BTC", accounts[0].public_key)
    asset_b = assets[1] if len(assets) > 1 else Asset("USDC", accounts[0].public_key)

    print(f"Setting up liquidity pool for {asset_a.code}/{asset_b.code}")

    # The assets need to be sorted lexicographically
    if asset_a.code > asset_b.code:
        asset_a, asset_b = asset_b, asset_a

    pool_asset = LiquidityPoolAsset(asset_a, asset_b)

    try:
        # Load the account to check balances
        source_account = server.load_account(liquidity_provider.public_key)
        print(f"Liquidity provider account loaded: {liquidity_provider.public_key}")
        
        # Check if the liquidity provider has sufficient balances
        account_data = server.accounts().account_id(liquidity_provider.public_key).call()
        btc_balance = 0
        usdc_balance = 0
        
        for balance in account_data['balances']:
            if balance['asset_type'] != 'native':
                if balance.get('asset_code') == asset_a.code and balance.get('asset_issuer') == asset_a.issuer:
                    btc_balance = float(balance['balance'])
                elif balance.get('asset_code') == asset_b.code and balance.get('asset_issuer') == asset_b.issuer:
                    usdc_balance = float(balance['balance'])
        
        print(f"Liquidity provider balances - {asset_a.code}: {btc_balance}, {asset_b.code}: {usdc_balance}")
        
        # Only proceed if balances are sufficient
        if btc_balance < 10 or usdc_balance < 100:
            print("Insufficient asset balances for liquidity pool setup")
            return []

        builder = TransactionBuilder(
            source_account=source_account,
            network_passphrase=network_passphrase,
            base_fee=100,
        ).set_timeout(30)
        
        # Add trustline for the liquidity pool share
        builder.append_change_trust_op(asset=pool_asset)
        
        # Deposit assets into the liquidity pool with more realistic amounts
        builder.append_liquidity_pool_deposit_op(
            liquidity_pool_id=pool_asset.liquidity_pool_id,
            max_amount_a="50",  # 50 BTC
            max_amount_b="5000",  # 5000 USDC
            min_price="0.001",
            max_price="1000.0",
        )
        
        tx = builder.build()
        tx.sign(liquidity_provider)

        response = server.submit_transaction(tx)
        print(f"Liquidity pool setup response: {response}")
        print("Liquidity pool created successfully!")
        return [pool_asset]
    except Exception as e:
        print(f"Error setting up liquidity pool: {e}")
        import traceback
        traceback.print_exc()
        print("Note: This is not critical for the arbitrage system to function.")
        print("The system will continue without liquidity pools.")
        return []