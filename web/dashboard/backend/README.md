# Stellar Arbitrage Trading Platform - Backend

This backend service implements a real-time arbitrage detection and execution system for the Stellar blockchain using Soroban smart contracts. It interfaces with deployed smart contracts to detect and execute profitable arbitrage opportunities across decentralized exchanges.

## Current Architecture

The backend follows a modular architecture focused on real contract interactions:

```
main.py                 # WebSocket server entry point and orchestration
├── contract_client.py  # Primary interface to Stellar smart contracts
├── trading_account.py  # Trading account management and funding
├── arbitrage_engine.py # Core arbitrage detection logic
├── error_handler.py    # Error handling and account balance management
├── accounts.py         # Account creation and management
├── assets.py           # Asset trustline management
└── reflector_client.py # Reflector oracle interface
```

## Key Components

1. **WebSocket Server** (`main.py`): 
   - Runs on port 8768
   - Handles real-time communication with frontend dashboard
   - Provides endpoints for supported assets and arbitrage engine control

2. **Contract Client** (`contract_client.py`):
   - Direct interface to Stellar smart contracts
   - Implements all required contract functions:
     - `set_reflector_contract_id`
     - `is_asset_supported`
     - `get_supported_assets`
     - `scan_opportunities` (as `scan_arbitrage_opportunities`)

3. **Trading Account Management** (`trading_account.py`):
   - Creates and manages dedicated trading accounts
   - Ensures accounts have sufficient XLM for transactions
   - Handles account funding through Friendbot

4. **Arbitrage Engine** (`arbitrage_engine.py`):
   - Continuously scans for arbitrage opportunities
   - Uses contract client to interact with smart contracts
   - Streams real-time results through WebSocket

5. **Error Handler** (`error_handler.py`):
   - Manages account balance checking
   - Decodes Stellar transaction errors
   - Ensures sufficient fees for transactions

## Smart Contract Integration

The backend integrates with the following deployed smart contracts:

- **Arbitrage Detector Contract**: `CAIEZ2IDLR2NWZVA3AYTJ5OLJC2A53GSPBMB43FQSESVJRWM4CFLZ45Q`
- **Reflector Oracle Contract**: `CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC`

## WebSocket API

The backend exposes a WebSocket API with the following commands:

- `{"command": "get_supported_assets"}` - Returns list of assets supported by the arbitrage contract
- `{"command": "start_engine"}` - Starts the arbitrage scanning engine

## Setup Instructions

### Prerequisites

- Python 3.8+
- Stellar SDK for Python
- Access to Stellar Testnet

### Installation

1. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Service

```bash
python main.py
```

The WebSocket server will start on `ws://localhost:8768`.

## Configuration

The service is configured through environment variables in the `.env` file:

- `STELLAR_NETWORK`: Network to use (TESTNET, PUBLIC)
- `STELLAR_HORIZON_URL`: Horizon server URL
- `STELLAR_SOROBAN_RPC_URL`: Soroban RPC URL
- `STELLAR_NETWORK_PASSPHRASE`: Network passphrase
- `ARBITRAGE_DETECTOR_CONTRACT_ID`: Deployed arbitrage detector contract ID
- `REFLECTOR_ORACLE_CONTRACT_ID`: Deployed Reflector oracle contract ID
- `NUM_ACCOUNTS`: Number of accounts to create (default: 10)
- `ARBITRAGE_SCAN_INTERVAL`: Seconds between arbitrage scans (default: 15)

## Testing

Run individual component tests:

```bash
# Test contract interactions
python test_contracts.py

# Test WebSocket connection
python test_websocket.py

# Check account balance
python check_balance.py
```

## Current Status

### Working Components
- ✅ WebSocket server starts and accepts connections
- ✅ Contract client connects to Soroban RPC server
- ✅ Trading account management loads and checks balances
- ✅ `is_asset_supported` function works correctly

### In Progress
- ⚠️ `get_supported_assets` - Not returning results (may need contract configuration)
- ⚠️ `scan_arbitrage_opportunities` - Transactions submitted but not found (network delay or processing issue)

## Troubleshooting

Common issues and solutions:

- **Account funding failures**: Check Friendbot availability and network connectivity
- **Contract interaction errors**: Verify contract IDs and network configuration
- **WebSocket connection issues**: Ensure the server is running on the correct port
- **Insufficient XLM**: Accounts must have sufficient XLM for transaction fees
- **RPC connection issues**: Try alternative RPC URLs in the `.env` file:
  ```
  STELLAR_SOROBAN_RPC_URL=https://rpc.testnet.stellar.org:443/soroban/rpc
  # or
  STELLAR_SOROBAN_RPC_URL=https://soroban-rpc.testnet.stellar.org
  ```