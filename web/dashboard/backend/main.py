import asyncio
import websockets
import subprocess
import os

import asyncio
import websockets
import subprocess
import os
import json
from contract_client import ContractClient
from trading_account import load_trading_account

# Function to run the arbitrage engine and stream its output
async def run_engine(websocket):
    # Path to the real arbitrage engine script
    engine_script_path = os.path.join(os.path.dirname(__file__), 'arbitrage_engine.py')

    # Start the subprocess
    process = await asyncio.create_subprocess_exec(
        'python', engine_script_path,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Stream stdout
    while process.stdout and not process.stdout.at_eof():
        line = await process.stdout.readline()
        if line:
            print(f"Sending: {line.decode().strip()}")
            await websocket.send(line.decode().strip())
            await asyncio.sleep(0.1)  # Small delay to prevent overwhelming the connection

    # Stream stderr
    while process.stderr and not process.stderr.at_eof():
        line = await process.stderr.readline()
        if line:
            print(f"Error: {line.decode().strip()}")
            await websocket.send(f"ERROR: {line.decode().strip()}")
            await asyncio.sleep(0.1)

    await process.wait()

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
                        assets = contract_client.get_supported_assets(trader_keypair)
                        await websocket.send(json.dumps({"supported_assets": assets}))
                    else:
                        await websocket.send(json.dumps({"error": "No trading account available"}))
                elif data.get('command') == 'start_engine':
                    asyncio.create_task(run_engine(websocket))
            except json.JSONDecodeError:
                print(f"Received non-JSON message: {message}")

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        print("Connection closed")

# Start the WebSocket server
async def main():
    # Get the port from environment variables, default to 8766
    port = int(os.environ.get("PORT", 8766))
    async with websockets.serve(handler, "localhost", port) as server:
        print(f"WebSocket server started on ws://localhost:{port}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
