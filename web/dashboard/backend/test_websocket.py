#!/usr/bin/env python3
"""
Test script to verify WebSocket connection
"""

import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8768"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Send request for supported assets
            await websocket.send(json.dumps({"command": "get_supported_assets"}))
            print("Sent get_supported_assets command")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Parse response
            try:
                data = json.loads(response)
                if "supported_assets" in data:
                    print(f"Supported assets: {data['supported_assets']}")
                elif "error" in data:
                    print(f"Error: {data['error']}")
                else:
                    print(f"Unexpected response: {data}")
            except json.JSONDecodeError:
                print(f"Non-JSON response: {response}")
            
            # Send request to start engine
            await websocket.send(json.dumps({"command": "start_engine"}))
            print("Sent start_engine command")
            
            # Wait for a few messages
            for i in range(5):
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    print(f"Received: {response}")
                except asyncio.TimeoutError:
                    print("No message received within 10 seconds")
                    break
                    
    except Exception as e:
        print(f"Failed to connect to {uri}: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())