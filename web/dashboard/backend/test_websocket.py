#!/usr/bin/env python3
"""
Simple WebSocket test script
"""

import asyncio
import websockets
import json

async def test_client():
    """Test WebSocket client connection"""
    uri = "ws://localhost:8767"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Listen for messages
            async for message in websocket:
                print(f"Received: {message}")
                
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_client())