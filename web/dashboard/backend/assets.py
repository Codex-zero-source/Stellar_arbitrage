import os
from dotenv import load_dotenv
from stellar_sdk import Asset, Server, TransactionBuilder, Network
from contract_client import ContractClient
from trading_account import load_trading_account

# Load environment variables
load_dotenv()

def create_assets_and_trustlines(accounts: list) -> list:
    """
    Establishes trustlines for real assets for all accounts.
    Note: Real assets are already issued, we just need trustlines.
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    contract_client = ContractClient()
    if accounts:
        trader_keypair = accounts[0]
    else:
        trader_keypair = load_trading_account()

    if not trader_keypair:
        print("No trading account available to fetch assets.")
        return []

    supported_assets = contract_client.get_supported_assets(trader_keypair)
    if not supported_assets:
        print("Could not retrieve supported assets from the smart contract.")
        return []

    real_assets = [Asset(code=asset['code'], issuer=asset['issuer']) for asset in supported_assets]

    server = Server(horizon_url)
    
    # Establish trustlines for real assets
    for asset in real_assets:
        for account_keypair in accounts:
            print(f"Processing asset {asset.code} for {account_keypair.public_key}")
            
            try:
                source_account = server.load_account(account_keypair.public_key)
            except Exception as e:
                print(f"Error loading account {account_keypair.public_key}: {e}")
                continue
            
            try:
                # Build transaction to establish trustline
                builder = TransactionBuilder(
                    source_account=source_account,
                    network_passphrase=network_passphrase,
                    base_fee=100,
                ).set_timeout(30)
                
                builder.append_change_trust_op(asset=asset, limit="10000000")
                tx = builder.build()
                tx.sign(account_keypair)
                
                response = server.submit_transaction(tx)
                print(f"Trustline response: {response}")
            except Exception as e:
                print(f"Error establishing trustline: {e}")
                # If trustline already exists, we can ignore the error and proceed
                if "op_already_exists" not in str(e):
                    continue

    return real_assets