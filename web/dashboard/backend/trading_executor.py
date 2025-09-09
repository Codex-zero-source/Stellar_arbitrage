import time
import os
from dotenv import load_dotenv
from stellar_sdk import Server, TransactionBuilder, Network, Asset, Keypair
# Account import not needed
from error_handler import check_account_balance, ensure_sufficient_fee

# Load environment variables
load_dotenv()

class TradingExecutor:
    def __init__(self):
        self.server = Server(os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org'))
        self.network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE')

    def execute_arbitrage_trade(self, trader_keypair: Keypair, opportunity: dict):
        """
        Execute an arbitrage trade based on an opportunity.
        
        Args:
            trader_keypair: Keypair of the trader account
            opportunity: Arbitrage opportunity data
        """
        try:
            print(f"Executing arbitrage trade: {opportunity}")
            
            # Load trader account
            source_account = self.server.load_account(trader_keypair.public_key)
            
            # Check account balance before executing trade
            balance_info = check_account_balance(trader_keypair.public_key)
            if "error" not in balance_info:
                print(f"Account XLM balance before trade: {balance_info['xlm_balance']}")
                # Ensure sufficient funds for a reasonable fee (e.g., 1000000 stroops = 0.1 XLM)
                if not ensure_sufficient_fee(trader_keypair.public_key, 1000000):
                    print("Warning: Insufficient funds for trade execution")
                    return {"status": "failed", "reason": "insufficient_funds"}
            
            # Extract opportunity details
            asset_pair = opportunity.get('asset', 'AQUA/yUSDC')
            buy_exchange = opportunity.get('buy_exchange', 'Stellar DEX')
            sell_exchange = opportunity.get('sell_exchange', 'Reflector')
            buy_price = opportunity.get('buy_price', 1500000)  # Default to 0.015 with 8 decimals for AQUA
            sell_price = opportunity.get('sell_price', 1550000)  # Default to 0.0155 with 8 decimals for AQUA
            amount = opportunity.get('available_amount', 10000000000)  # Default to 100 with 8 decimals
            
            # Initialize selling_code
            selling_code = "AQUA"
            
            # For this simulation, we'll just create a simple buy order
            # In a real implementation, this would involve more complex multi-step transactions
            
            builder = TransactionBuilder(
                source_account=source_account,
                network_passphrase=self.network_passphrase or 'Test SDF Network ; September 2015',
                base_fee=100,
            ).set_timeout(30)
            
            # Parse asset pair (using real Reflector-tracked assets)
            if '/' in asset_pair:
                selling_code, buying_code = asset_pair.split('/')
                # Map to real asset issuers
                asset_issuers = {
                    "AQUA": "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
                    "yUSDC": "GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF",
                    "EURC": "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
                    "BTCLN": "GDPKQ2TSNJOFSEE7XSUXPWRP27H6GFGLWD7JCHNEYYWQVGFA543EVBVT",
                    "KALE": "GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE",
                    "XLM": None  # Native asset, no issuer
                }
                
                # Create assets with proper issuers
                if selling_code == "XLM":
                    selling_asset = Asset.native()
                else:
                    selling_issuer = asset_issuers.get(selling_code, trader_keypair.public_key)
                    selling_asset = Asset(selling_code, selling_issuer)
                    
                if buying_code == "XLM":
                    buying_asset = Asset.native()
                else:
                    buying_issuer = asset_issuers.get(buying_code, trader_keypair.public_key)
                    buying_asset = Asset(buying_code, buying_issuer)
            else:
                # Default to AQUA/yUSDC
                selling_asset = Asset("AQUA", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA")
                buying_asset = Asset("yUSDC", "GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF")
            
            # Validate that we have sufficient balance of the selling asset
            # Use check_account_balance to get the balances
            balance_info = check_account_balance(trader_keypair.public_key)
            selling_asset_balance = 0
            if "balances" in balance_info:
                balances = balance_info["balances"]
                # Cast to dict to help type checker
                if isinstance(balances, dict):
                    try:
                        if selling_code in balances:
                            asset_info = balances[selling_code]
                            if isinstance(asset_info, dict) and "balance" in asset_info:
                                selling_asset_balance = float(asset_info["balance"])
                        elif selling_code == "XLM" and "XLM" in balances:
                            xlm_info = balances["XLM"]
                            if isinstance(xlm_info, dict) and "balance" in xlm_info:
                                selling_asset_balance = float(xlm_info["balance"])
                    except (KeyError, TypeError):
                        # Handle case where balances is not a dictionary or key doesn't exist
                        selling_asset_balance = 0
            
            required_amount = amount / 100000000  # Convert from stroops
            if selling_asset_balance < required_amount:
                print(f"Insufficient {selling_code} balance. Required: {required_amount}, Available: {selling_asset_balance}")
                return {"status": "failed", "reason": "insufficient_asset_balance"}
            
            # Create buy order
            builder.append_manage_buy_offer_op(
                selling=selling_asset,
                buying=buying_asset,
                amount=str(amount / 100000000),  # Convert from stroops
                price=str(buy_price / 100000000),    # Convert from stroops
            )
            
            tx = builder.build()
            tx.sign(trader_keypair)
            
            response = self.server.submit_transaction(tx)
            print(f"Trade executed successfully: {response['hash']}")
            
            # Check account balance after trade
            balance_info = check_account_balance(trader_keypair.public_key)
            if "error" not in balance_info:
                print(f"Account XLM balance after trade: {balance_info['xlm_balance']}")
            
            return response
            
        except Exception as e:
            print(f"Error executing arbitrage trade: {e}")
            import traceback
            traceback.print_exc()
            return {"status": "failed", "reason": str(e)}

    def execute_flash_loan_arbitrage(self, trader_keypair: Keypair, opportunity: dict, flash_loan_provider: str):
        """
        Execute a flash loan arbitrage trade.
        
        Args:
            trader_keypair: Keypair of the trader account
            opportunity: Arbitrage opportunity data
            flash_loan_provider: Address of the flash loan provider
        """
        # Flash loan arbitrage would require a more complex multi-contract transaction
        # This is a simplified version for demonstration
        print(f"Executing flash loan arbitrage: {opportunity}")
        print("Note: Flash loan implementation requires smart contract support")
        
        # Check account balance
        balance_info = check_account_balance(trader_keypair.public_key)
        if "error" not in balance_info:
            print(f"Account XLM balance: {balance_info['xlm_balance']}")
        
        # In a real implementation, this would:
        # 1. Call the flash loan contract to borrow funds
        # 2. Execute the arbitrage trades
        # 3. Repay the loan plus fees
        # 4. Keep the profit
        
        # For now, we'll just simulate the process
        print("Flash loan arbitrage simulation completed")
        return {"status": "simulated", "opportunity": opportunity}