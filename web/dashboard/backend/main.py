import asyncio
import websockets
import subprocess
import os
import json

# Set of connected clients
CLIENTS = set()

# Function to run the arbitrage engine and stream its output
async def run_engine():
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
            message = line.decode().strip()
            print(f"Sending: {message}")
            # Broadcast to all connected clients
            if CLIENTS:
                await asyncio.gather(
                    *[client.send(json.dumps({"type": "log", "content": message})) for client in CLIENTS], 
                    return_exceptions=True
                )
            await asyncio.sleep(0.1)  # Small delay to prevent overwhelming the connection

    # Stream stderr
    while process.stderr and not process.stderr.at_eof():
        line = await process.stderr.readline()
        if line:
            error_message = line.decode().strip()
            print(f"Error: {error_message}")
            # Broadcast error to all connected clients
            if CLIENTS:
                await asyncio.gather(
                    *[client.send(json.dumps({"type": "error", "content": error_message})) for client in CLIENTS], 
                    return_exceptions=True
                )
            await asyncio.sleep(0.1)

    await process.wait()

# WebSocket handler
async def handler(websocket):
    print("Client connected")
    CLIENTS.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.remove(websocket)
        print("Client disconnected")

# Start the WebSocket server
async def main():
    # Fixed port as per requirements
    port = 8768
    
    # Start the WebSocket server
    server = await websockets.serve(handler, "localhost", port)
    print(f"WebSocket server started on ws://localhost:{port}")
    
    # Start the engine in a separate task
    engine_task = asyncio.create_task(run_engine())
    
    # Wait for either the server to close or the engine task to complete
    try:
        await asyncio.gather(server.wait_closed(), engine_task)
    except asyncio.CancelledError:
        print("Server or engine task was cancelled")
    finally:
        # Cancel the engine task if it's still running
        if not engine_task.done():
            engine_task.cancel()
            try:
                await engine_task
            except asyncio.CancelledError:
                pass

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped by user")