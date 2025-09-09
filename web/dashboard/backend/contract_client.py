import os
import time
from dotenv import load_dotenv
from stellar_sdk import Keypair, Network, Server
from stellar_sdk.soroban_server import SorobanServer
from stellar_sdk.transaction_builder import TransactionBuilder
from stellar_sdk.xdr import SCVal, SCVec, SCValType, SCString, Int64
from stellar_sdk.address import Address
from stellar_sdk.scval import scval_to_native
from error_handler import decode_stellar_error, check_account_balance, ensure_sufficient_fee

# Load environment variables
load_dotenv()

class ContractClient:
    def __init__(self):
        # Try multiple RPC URLs as fallbacks
        self.rpc_urls = [
            os.getenv('STELLAR_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org'),
            'https://soroban-testnet.stellar.org',
            'https://rpc.testnet.stellar.org'
        ]
        self.horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
        self.network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
        self.arbitrage_contract_id = os.getenv('ARBITRAGE_DETECTOR_CONTRACT_ID')
        self.oracle_contract_id = os.getenv('REFLECTOR_ORACLE_CONTRACT_ID')
        self.server = self._create_soroban_server()
        self.horizon_server = Server(self.horizon_url)
        print(f"Using RPC URLs: {self.rpc_urls}")
        print(f"Using Horizon URL: {self.horizon_url}")

    def get_supported_assets(self, trader_keypair: Keypair):
        """
        Calls the get_supported_assets function on the ArbitrageDetector contract.
        """
        if not self.arbitrage_contract_id:
            print("Error: ARBITRAGE_DETECTOR_CONTRACT_ID not set in environment variables")
            return []

        try:
            source_account = self.horizon_server.load_account(trader_keypair.public_key)

            tx = (
                TransactionBuilder(source_account, self.network_passphrase, base_fee=100)
                .set_timeout(300)
                .append_invoke_contract_function_op(
                    contract_id=self.arbitrage_contract_id,
                    function_name="get_supported_assets",
                    parameters=[],
                )
                .build()
            )

            sim_response = self.server.simulate_transaction(tx)

            if sim_response.results:
                result_xdr = sim_response.results[0].xdr
                scval = SCVal.from_xdr(result_xdr)
                native_val = scval.to_native()
                
                return native_val
            else:
                print("Simulation successful but no results returned")
                return []

        except Exception as e:
            print(f"Error getting supported assets: {e}")
            return []



    def _create_soroban_server(self):
        """Create SorobanServer with fallback URLs."""
        for rpc_url in self.rpc_urls:
            try:
                server = SorobanServer(rpc_url)
                # Test the connection
                server.get_latest_ledger()
                print(f"Successfully connected to Soroban RPC: {rpc_url}")
                return server
            except Exception as e:
                print(f"Failed to connect to {rpc_url}: {e}")
                continue
        raise Exception("Failed to connect to any Soroban RPC URL")

    def scan_arbitrage_opportunities(self, trader_keypair: Keypair, assets=None, min_profit=0):
        """
        Calls the scan_opportunities function on the ArbitrageDetector contract.
        """
        # Check if contract ID is set
        if not self.arbitrage_contract_id:
            print("Error: ARBITRAGE_DETECTOR_CONTRACT_ID not set in environment variables")
            return None
            
        try:
            print(f"[DEBUG] Loading source account: {trader_keypair.public_key}")
            source_account = self.horizon_server.load_account(trader_keypair.public_key)

            # Construct the arguments for the scan_opportunities function
            if assets is None:
                assets_scvec = SCVec([])
            else:
                # Convert assets list to SCVec if provided
                asset_scvals = [self._create_string_scval(asset) for asset in assets]
                assets_scvec = SCVec(asset_scvals)

            from stellar_sdk.xdr import Int128Parts, Int64
            min_profit_i128_parts = Int128Parts(
                hi=Int64(0),
                lo=Int64(min_profit)
            )
            
            args = [
                SCVal(type=SCValType.SCV_VEC, vec=assets_scvec),
                SCVal(type=SCValType.SCV_I128, i128=min_profit_i128_parts),
            ]

            print(f"Calling contract {self.arbitrage_contract_id} with args:")
            print(f"  Assets: {assets}")
            print(f"  Min profit: {min_profit}")

            tx = (
                TransactionBuilder(source_account, self.network_passphrase, base_fee=100)
                .set_timeout(300)
                .append_invoke_contract_function_op(
                    contract_id=self.arbitrage_contract_id,
                    function_name="scan_opportunities",
                    parameters=args,
                )
                .build()
            )

            print("Simulating transaction...")
            try:
                sim_response = self.server.simulate_transaction(tx)
                print(f"Simulation response: {sim_response}")
                
                if hasattr(sim_response, 'error') and sim_response.error:
                    print(f"Simulation error: {sim_response.error}")
                    if hasattr(sim_response, 'error_result_xdr'):
                        try:
                            error_details = decode_stellar_error(sim_response.error_result_xdr)
                            print(f"Decoded error: {error_details}")
                        except Exception as decode_error:
                            print(f"Failed to decode error: {decode_error}")
                    return None
                
                if hasattr(sim_response, 'results') and sim_response.results:
                    print("Simulation successful with results")
                    if hasattr(sim_response, 'min_resource_fee') and sim_response.min_resource_fee:
                        min_fee = sim_response.min_resource_fee
                        print(f"Minimum resource fee required: {min_fee} stroops")
                        tx.transaction.fee = max(tx.transaction.fee, min_fee)
                        if not ensure_sufficient_fee(trader_keypair.public_key, tx.transaction.fee, self.horizon_url):
                            print(f"Warning: Account may not have sufficient funds for the required fee of {tx.transaction.fee} stroops")
                else:
                    print("Simulation successful but no results returned")
                        
            except Exception as e:
                print(f"Error during simulation: {e}")
                import traceback
                traceback.print_exc()

            print(f"[DEBUG] Signing transaction with keypair: {trader_keypair.public_key}")
            tx.sign(trader_keypair)
            print(f"Submitting transaction with hash: {tx.hash_hex()}")
            
            send_response = self.server.send_transaction(tx)
            print(f"Send response: {send_response}")
            
            if send_response.status == "ERROR":
                error_msg = getattr(send_response, 'error', 'Unknown error')
                print(f"Transaction failed: {error_msg}")
                if hasattr(send_response, 'error_result_xdr'):
                    print(f"Error result XDR: {send_response.error_result_xdr}")
                    try:
                        error_details = decode_stellar_error(send_response.error_result_xdr)
                        print(f"Decoded error details: {error_details}")
                    except Exception as decode_error:
                        print(f"Failed to decode error: {decode_error}")
                return None
            
            tx_hash = send_response.hash
            print(f"Transaction submitted with hash: {tx_hash}")
            
            for _ in range(10):
                result = self.server.get_transaction(tx_hash)
                if result.status != "NOT_FOUND":
                    break
                time.sleep(2)
            
            print(f"Final transaction result: {result}")
            
            if result and result.status == "SUCCESS":
                print("Arbitrage scan successful")
                return result
            else:
                error_message = getattr(result, 'result_xdr', 'Unknown error') if result else 'Transaction not found'
                print(f"Transaction failed: {error_message}")
                if result and error_message and error_message != 'Unknown error':
                    try:
                        error_details = decode_stellar_error(error_message)
                        print(f"Decoded error details: {error_details}")
                    except Exception as decode_error:
                        print(f"Failed to decode error: {decode_error}")
                if result and hasattr(result, 'result_meta_xdr'):
                    print(f"Result meta: {result.result_meta_xdr}")
                return None

        except Exception as e:
            print(f"Error scanning arbitrage opportunities: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _create_string_scval(self, string_value: str) -> SCVal:
        sc_string = SCString(string_value.encode('utf-8'))
        return SCVal(type=SCValType.SCV_STRING, str=sc_string)
        
    def _create_address_scval(self, address: str) -> SCVal:
        addr = Address(address)
        return SCVal(type=SCValType.SCV_ADDRESS, address=addr.to_xdr_sc_address())
