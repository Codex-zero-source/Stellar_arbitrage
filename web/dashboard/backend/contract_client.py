import os
import time
from dotenv import load_dotenv
from stellar_sdk import Keypair, Network, Server
from stellar_sdk.soroban_server import SorobanServer
from stellar_sdk.transaction_builder import TransactionBuilder
from stellar_sdk.xdr import SCVal, SCVec, SCValType, SCString, Int64
from stellar_sdk.address import Address
from error_handler import decode_stellar_error, check_account_balance, ensure_sufficient_fee

# Load environment variables
load_dotenv()

class ContractClient:
    def __init__(self):
        # Try multiple RPC URLs as fallbacks
        self.rpc_urls = [
            os.getenv('STELLAR_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org'),
            'https://rpc.testnet.stellar.org:443/soroban/rpc',
            'https://soroban-rpc.testnet.stellar.org',
            'https://horizon-testnet.stellar.org'
        ]
        self.horizon_url = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
        self.network_passphrase = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
        self.arbitrage_contract_id = os.getenv('ARBITRAGE_DETECTOR_CONTRACT_ID')
        self.oracle_contract_id = os.getenv('REFLECTOR_ORACLE_CONTRACT_ID')
        self.server = self._create_soroban_server()
        self.horizon_server = Server(self.horizon_url)
        print(f"Using RPC URLs: {self.rpc_urls}")
        print(f"Using Horizon URL: {self.horizon_url}")

    def _create_soroban_server(self):
        """Create SorobanServer with fallback URLs."""
        for rpc_url in self.rpc_urls:
            try:
                print(f"Attempting to connect to Soroban RPC: {rpc_url}")
                server = SorobanServer(rpc_url)
                # Test the connection
                server.get_latest_ledger()
                print(f"Successfully connected to Soroban RPC: {rpc_url}")
                return server
            except Exception as e:
                print(f"Failed to connect to {rpc_url}: {e}")
                continue
        print("WARNING: Failed to connect to any Soroban RPC URL. Contract calls will not work.")
        return None

    def _submit_transaction(self, tx: TransactionBuilder, signer: Keypair):
        """Signs and submits a transaction, handling simulation and confirmation."""
        if not self.server:
            return None, "No Soroban server connection available"
            
        try:
            print("Simulating transaction...")
            sim_response = self.server.simulate_transaction(tx)
            
            if hasattr(sim_response, 'error') and sim_response.error:
                print(f"Simulation error: {sim_response.error}")
                if hasattr(sim_response, 'error_result_xdr'):
                    try:
                        error_details = decode_stellar_error(sim_response.error_result_xdr)
                        print(f"Decoded error: {error_details}")
                    except Exception as decode_error:
                        print(f"Failed to decode error: {decode_error}")
                return None, sim_response

            if hasattr(sim_response, 'results') and sim_response.results:
                print("Simulation successful with results")
                if hasattr(sim_response, 'min_resource_fee') and sim_response.min_resource_fee:
                    min_fee = sim_response.min_resource_fee
                    print(f"Minimum resource fee required: {min_fee} stroops")
                    tx.transaction.fee = max(tx.transaction.fee, int(min_fee) + 100)
                    if not ensure_sufficient_fee(signer.public_key, tx.transaction.fee, self.horizon_url):
                        print(f"Warning: Account may not have sufficient funds for the required fee of {tx.transaction.fee} stroops")
            else:
                print("Simulation successful but no results returned")

            print(f"[DEBUG] Signing transaction with keypair: {signer.public_key}")
            tx.sign(signer)
            
            print(f"Submitting transaction with hash: {tx.hash_hex()}")
            send_response = self.server.send_transaction(tx)
            
            if send_response.status == "ERROR":
                error_msg = getattr(send_response, 'error', 'Unknown error')
                print(f"Transaction failed: {error_msg}")
                if hasattr(send_response, 'error_result_xdr'):
                    try:
                        error_details = decode_stellar_error(send_response.error_result_xdr)
                        print(f"Decoded error details: {error_details}")
                    except Exception as decode_error:
                        print(f"Failed to decode error: {decode_error}")
                return None, send_response

            tx_hash = send_response.hash
            print(f"Transaction submitted with hash: {tx_hash}")
            
            # Wait for transaction confirmation
            for i in range(20):  # Wait up to 20 seconds
                result = self.server.get_transaction(tx_hash)
                if result.status != "NOT_FOUND":
                    break
                time.sleep(1)
            
            print(f"Final transaction result: {result}")
            
            if result and result.status == "SUCCESS":
                print("Transaction successful")
                return result, None
            else:
                error_message = getattr(result, 'result_xdr', 'Unknown error') if result else 'Transaction not found'
                print(f"Transaction failed: {error_message}")
                if result and error_message and error_message != 'Unknown error':
                    try:
                        error_details = decode_stellar_error(error_message)
                        print(f"Decoded error details: {error_details}")
                    except Exception as decode_error:
                        print(f"Failed to decode error: {decode_error}")
                return None, result

        except Exception as e:
            print(f"Error submitting transaction: {e}")
            import traceback
            traceback.print_exc()
            return None, str(e)

    def set_reflector_contract_id(self, trader_keypair: Keypair, reflector_contract_id: str):
        """Calls the set_reflector_contract_id function on the ArbitrageDetector contract."""
        if not self.arbitrage_contract_id:
            print("Error: ARBITRAGE_DETECTOR_CONTRACT_ID not set in environment variables")
            return None, "ARBITRAGE_DETECTOR_CONTRACT_ID not set"
            
        if not self.server:
            return None, "No Soroban server connection available"

        try:
            source_account = self.horizon_server.load_account(trader_keypair.public_key)
            args = [self._create_address_scval(reflector_contract_id)]

            tx = (
                TransactionBuilder(source_account, self.network_passphrase, base_fee=100)
                .set_timeout(300)
                .append_invoke_contract_function_op(
                    contract_id=self.arbitrage_contract_id,
                    function_name="set_reflector_contract_id",
                    parameters=args,
                )
                .build()
            )
            return self._submit_transaction(tx, trader_keypair)
        except Exception as e:
            print(f"Error setting reflector contract ID: {e}")
            return None, str(e)

    def is_asset_supported(self, trader_keypair: Keypair, asset_code: str):
        """Calls the is_asset_supported function on the ArbitrageDetector contract."""
        if not self.arbitrage_contract_id:
            print("Error: ARBITRAGE_DETECTOR_CONTRACT_ID not set in environment variables")
            return False
            
        if not self.server:
            print("Error: No Soroban server connection available")
            return False

        try:
            source_account = self.horizon_server.load_account(trader_keypair.public_key)
            args = [self._create_string_scval(asset_code)]

            tx = (
                TransactionBuilder(source_account, self.network_passphrase, base_fee=100)
                .set_timeout(300)
                .append_invoke_contract_function_op(
                    contract_id=self.arbitrage_contract_id,
                    function_name="is_asset_supported",
                    parameters=args,
                )
                .build()
            )
            
            if not self.server:
                print("Error: No Soroban server connection available")
                return False
                
            sim_response = self.server.simulate_transaction(tx)

            if sim_response.results:
                result_xdr = sim_response.results[0].xdr
                scval = SCVal.from_xdr(result_xdr)
                # Handle SCVal parsing correctly
                if scval.type == SCValType.SCV_BOOL:
                    return scval.b
                else:
                    print(f"Unexpected SCVal type: {scval.type}")
                    return False
            else:
                print("Simulation successful but no results returned")
                return False
        except Exception as e:
            print(f"Error checking if asset is supported: {e}")
            import traceback
            traceback.print_exc()
            return False

    def get_supported_assets(self, trader_keypair: Keypair):
        """Calls the get_supported_assets function on the ArbitrageDetector contract."""
        if not self.arbitrage_contract_id:
            print("Error: ARBITRAGE_DETECTOR_CONTRACT_ID not set in environment variables")
            return []
            
        if not self.server:
            print("Error: No Soroban server connection available")
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

            if not self.server:
                print("Error: No Soroban server connection available")
                return []

            sim_response = self.server.simulate_transaction(tx)

            if sim_response.results:
                result_xdr = sim_response.results[0].xdr
                scval = SCVal.from_xdr(result_xdr)
                # Handle SCVal parsing correctly for vectors
                if scval.type == SCValType.SCV_VEC and scval.vec is not None:
                    assets = []
                    for vec_element in scval.vec.sc_vec:
                        # Parse each asset in the vector
                        if vec_element.type == SCValType.SCV_MAP and vec_element.map is not None:
                            asset_dict = {}
                            for map_entry in vec_element.map.sc_map:
                                # Extract key and value
                                key = map_entry.key
                                value = map_entry.val
                                
                                # Parse key (should be string)
                                if key.type == SCValType.SCV_STRING:
                                    key_str = key.str.sc_string.decode('utf-8')
                                    
                                    # Parse value based on type
                                    if value.type == SCValType.SCV_STRING:
                                        value_str = value.str.sc_string.decode('utf-8')
                                        asset_dict[key_str] = value_str
                                    elif value.type == SCValType.SCV_ADDRESS:
                                        # Convert address to string
                                        address_obj = Address.from_xdr_sc_address(value.address)
                                        asset_dict[key_str] = str(address_obj)
                            
                            if asset_dict:
                                assets.append(asset_dict)
                    return assets
                else:
                    print(f"Unexpected SCVal type or no vector: {scval.type}")
                    return []
            else:
                print("Simulation successful but no results returned")
                return []

        except Exception as e:
            print(f"Error getting supported assets: {e}")
            import traceback
            traceback.print_exc()
            return []

    def scan_opportunities(self, trader_keypair: Keypair, assets=None, min_profit=0):
        """Calls the scan_opportunities function on the ArbitrageDetector contract."""
        if not self.arbitrage_contract_id:
            print("Error: ARBITRAGE_DETECTOR_CONTRACT_ID not set in environment variables")
            return None, "ARBITRAGE_DETECTOR_CONTRACT_ID not set"
            
        if not self.server:
            return None, "No Soroban server connection available"
            
        try:
            source_account = self.horizon_server.load_account(trader_keypair.public_key)

            if assets is None:
                assets_scvec = SCVec([])
            else:
                asset_scvals = [self._create_string_scval(asset) for asset in assets]
                assets_scvec = SCVec(asset_scvals)

            from stellar_sdk.xdr import Int128Parts, Int64
            min_profit_i128_parts = Int128Parts(hi=Int64(0), lo=Int64(min_profit))
            
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
            
            return self._submit_transaction(tx, trader_keypair)

        except Exception as e:
            print(f"Error scanning arbitrage opportunities: {e}")
            import traceback
            traceback.print_exc()
            return None, str(e)

    def _create_string_scval(self, string_value: str) -> SCVal:
        sc_string = SCString(string_value.encode('utf-8'))
        return SCVal(type=SCValType.SCV_STRING, str=sc_string)
        
    def _create_address_scval(self, address: str) -> SCVal:
        addr = Address(address)
        return SCVal(type=SCValType.SCV_ADDRESS, address=addr.to_xdr_sc_address())