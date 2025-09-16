import asyncio
import websockets
import subprocess
import os
import json
import sys
import traceback
from contract_client import ContractClient
from trading_account import load_trading_account
from data_processor import data_processor

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Function to run the arbitrage engine and stream its output
async def run_engine(websocket):
    try:
        # Import the run_arbitrage_engine function directly
        from arbitrage_engine import run_arbitrage_engine
        
        # Load trading account
        trader_keypair = load_trading_account()
        if not trader_keypair:
            await websocket.send(json.dumps({"error": "No trading account available"}))
            return
            
        # Run the arbitrage engine and stream output
        async for message in run_arbitrage_engine(accounts=[trader_keypair]):
            print(f"Sending: {message}")
            await websocket.send(json.dumps({"log": message}))
            await asyncio.sleep(0.1)  # Small delay to prevent overwhelming the connection
            
    except Exception as e:
        error_msg = f"ERROR in run_engine: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        await websocket.send(json.dumps({"error": error_msg}))

# WebSocket handler
async def handler(websocket):
    print("Client connected")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get('command') == 'get_supported_assets':
                    contract_client = ContractClient()
                    trader_keypair = load_trading_account()
                    if trader_keypair:
                        # Check if we have a connection to the Soroban server
                        if not contract_client.server:
                            await websocket.send(json.dumps({"error": "No connection to Soroban RPC server"}))
                        else:
                            assets = contract_client.get_supported_assets(trader_keypair)
                            await websocket.send(json.dumps({"supported_assets": assets}))
                    else:
                        await websocket.send(json.dumps({"error": "No trading account available"}))
                elif data.get('command') == 'start_engine':
                    # Run the engine in a separate task to avoid blocking
                    asyncio.create_task(run_engine(websocket))
                elif data.get('command') == 'check_wallet_balance':
                    public_key = data.get('public_key')
                    if public_key:
                        try:
                            from error_handler import check_account_balance
                            balance_info = check_account_balance(public_key)
                            await websocket.send(json.dumps({"wallet_balance": balance_info}))
                        except Exception as e:
                            await websocket.send(json.dumps({"error": f"Failed to check wallet balance: {str(e)}"}))
                    else:
                        await websocket.send(json.dumps({"error": "Public key required for balance check"}))
                elif data.get('command') == 'validate_wallet':
                    public_key = data.get('public_key')
                    if public_key:
                        try:
                            # Validate the wallet address format and check if account exists
                            from stellar_sdk import Keypair
                            from stellar_sdk.exceptions import Ed25519PublicKeyInvalidError
                            
                            # Validate public key format
                            Keypair.from_public_key(public_key)
                            
                            # Check if account exists on network
                            from error_handler import check_account_balance
                            balance_info = check_account_balance(public_key)
                            
                            await websocket.send(json.dumps({
                                "wallet_validation": {
                                    "valid": True,
                                    "exists": balance_info is not None,
                                    "balance_info": balance_info
                                }
                            }))
                        except Ed25519PublicKeyInvalidError:
                            await websocket.send(json.dumps({
                                "wallet_validation": {
                                    "valid": False,
                                    "error": "Invalid public key format"
                                }
                            }))
                        except Exception as e:
                            await websocket.send(json.dumps({
                                "wallet_validation": {
                                    "valid": False,
                                    "error": str(e)
                                }
                            }))
                    else:
                        await websocket.send(json.dumps({"error": "Public key required for wallet validation"}))
                elif data.get('command') == 'get_portfolio':
                    portfolio_summary = data_processor.get_portfolio_summary()
                    await websocket.send(json.dumps({
                        "type": "portfolio_data",
                        "data": portfolio_summary
                    }))
                elif data.get('command') == 'get_trade_history':
                    limit = data.get("limit", 100)
                    trade_history = data_processor.get_trade_history(limit)
                    await websocket.send(json.dumps({
                        "type": "trade_history",
                        "data": trade_history
                    }))
                elif data.get('command') == 'get_price_data':
                    symbol = data.get("symbol")
                    hours = data.get("hours", 24)
                    if symbol:
                        price_history = data_processor.get_price_history(symbol, hours)
                        current_price = data_processor.get_current_price(symbol)
                        await websocket.send(json.dumps({
                            "type": "price_data",
                            "data": {
                                "symbol": symbol,
                                "current_price": current_price.__dict__ if current_price else None,
                                "history": [p.__dict__ for p in price_history]
                            }
                        }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Symbol is required"
                        }))
                elif data.get('command') == 'get_performance_metrics':
                    portfolio_summary = data_processor.get_portfolio_summary()
                    await websocket.send(json.dumps({
                        "type": "performance_metrics",
                        "data": portfolio_summary["performance_metrics"]
                    }))
                elif data.get('command') == 'get_account_balance':
                    account_id = data.get("account_id")
                    if account_id:
                        from error_handler import check_account_balance
                        balance_info = check_account_balance(account_id)
                        await websocket.send(json.dumps({
                            "type": "account_balance",
                            "data": balance_info
                        }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Account ID is required"
                        }))
            except json.JSONDecodeError:
                print(f"Received non-JSON message: {message}")
                await websocket.send(json.dumps({"log": f"Received non-JSON message: {message}"}))

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in WebSocket handler: {e}")
        traceback.print_exc()
    finally:
        print("Connection closed")

# Start the WebSocket server
async def main():
    # Get the port from environment variables, default to 8768 as per project specification
    port = int(os.environ.get("PORT", 8768))
    print(f"Starting WebSocket server on port {port}...")
    
    # Try alternative ports if the default is in use
    ports_to_try = [port, 8769, 8770, 8771]
    
    for try_port in ports_to_try:
        try:
            async with websockets.serve(handler, "localhost", try_port) as server:
                print(f"WebSocket server started on ws://localhost:{try_port}")
                await asyncio.Future()  # run forever
                break  # If successful, break out of the loop
        except OSError as e:
            if "10048" in str(e) or "Address already in use" in str(e):
                print(f"Port {try_port} is already in use, trying next port...")
                continue
            else:
                print(f"Failed to start WebSocket server on port {try_port}: {e}")
                traceback.print_exc()
                break
        except Exception as e:
            print(f"Failed to start WebSocket server on port {try_port}: {e}")
            traceback.print_exc()
            break
    else:
        print("Failed to start WebSocket server on any of the attempted ports")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped by user")
    except Exception as e:
        print(f"Server error: {e}")
        traceback.print_exc()