import os
from dotenv import load_dotenv
from stellar_sdk import Asset, Server, TransactionBuilder, Network

# Load environment variables
load_dotenv()

def create_assets_and_trustlines(accounts: list) -> list:
    """
    Creates custom assets, establishes trustlines for all accounts, and distributes the assets.
    """
    horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
    network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
    
    issuer_keypair = accounts[0]
    assets = [
        Asset("BTC", issuer_keypair.public_key),
        Asset("USDC", issuer_keypair.public_key),
    ]

    server = Server(horizon_url)
    
    # Establish trustlines and distribute assets
    for asset in assets:
        for account_keypair in accounts[1:]:
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

            try:
                # Build transaction to distribute assets from issuer
                issuer_account = server.load_account(issuer_keypair.public_key)
                builder = TransactionBuilder(
                    source_account=issuer_account,
                    network_passphrase=network_passphrase,
                    base_fee=100,
                ).set_timeout(30)

                builder.append_payment_op(
                    destination=account_keypair.public_key,
                    asset=asset,
                    amount="1000" # Distribute more of each asset
                )
                tx = builder.build()
                tx.sign(issuer_keypair)

                response = server.submit_transaction(tx)
                print(f"Payment response: {response}")
            except Exception as e:
                print(f"Error distributing asset: {e}")

    return assets