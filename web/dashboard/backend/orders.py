import os
import time
from dotenv import load_dotenv
from stellar_sdk import Server, TransactionBuilder, Network, Asset

# Load environment variables
load_dotenv()

def create_market_orders(accounts: list, assets: list):
    """
    Creates initial market orders on the SDEX.
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    server = Server(horizon_url)
    
    if len(accounts) < 3:
        print("Not enough accounts to create market orders")
        return
    
    trader = accounts[2] if len(accounts) > 2 else accounts[0]
    selling_asset = assets[0] if len(assets) > 0 else Asset("BTC", accounts[0].public_key)
    buying_asset = assets[1] if len(assets) > 1 else Asset("USDC", accounts[0].public_key)

    print(f"Creating market order for {trader.public_key}")

    try:
        # Load trader account
        source_account = server.load_account(trader.public_key)
        print(f"Trader account loaded: {trader.public_key}")
        
        # Check trader's asset balances
        account_data = server.accounts().account_id(trader.public_key).call()
        btc_balance = 0
        
        for balance in account_data['balances']:
            if balance['asset_type'] != 'native':
                if balance.get('asset_code') == selling_asset.code and balance.get('asset_issuer') == selling_asset.issuer:
                    btc_balance = float(balance['balance'])
        
        print(f"Trader {selling_asset.code} balance: {btc_balance}")
        
        # Only create orders if trader has sufficient balance
        if btc_balance < 5:
            print("Insufficient asset balance to create market order")
            return

        builder = TransactionBuilder(
            source_account=source_account,
            network_passphrase=network_passphrase,
            base_fee=100,
        ).set_timeout(30)
        
        # Create a more realistic market order
        builder.append_manage_sell_offer_op(
            selling=selling_asset,
            buying=buying_asset,
            amount="25",  # Sell 25 BTC
            price="0.05",  # At price of 0.05 USDC per BTC
        )
        
        tx = builder.build()
        tx.sign(trader)

        response = server.submit_transaction(tx)
        print(f"Market order response: {response}")
        print("Market order created successfully!")
    except Exception as e:
        print(f"Error creating market order: {e}")
        import traceback
        traceback.print_exc()