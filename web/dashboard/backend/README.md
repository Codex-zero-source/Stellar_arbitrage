# Stellar Arbitrage Simulation Backend

This backend service simulates a trading environment for the Stellar arbitrage detection system. It creates accounts, assets, and trading activity to generate arbitrage opportunities for the smart contracts to detect.

## Components

1. **Account Management**: Creates and funds Stellar accounts using Friendbot
2. **Asset Creation**: Creates custom assets and establishes trustlines
3. **Liquidity Pools**: Sets up liquidity pools for trading
4. **Order Management**: Creates initial market orders
5. **Simulation Engine**: Continuously generates trading activity
6. **Arbitrage Engine**: Scans for and executes arbitrage opportunities
7. **Contract Client**: Interfaces with Soroban smart contracts
8. **Reflector Client**: Interfaces with the Reflector oracle service

## Setup Instructions

### Prerequisites

- Python 3.7+
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

## Configuration

The service is configured through environment variables in the `.env` file:

- `STELLAR_NETWORK`: Network to use (TESTNET, PUBLIC)
- `STELLAR_HORIZON_URL`: Horizon server URL
- `STELLAR_SOROBAN_RPC_URL`: Soroban RPC URL
- `STELLAR_NETWORK_PASSPHRASE`: Network passphrase
- `ARBITRAGE_DETECTOR_CONTRACT_ID`: Deployed arbitrage detector contract ID
- `REFLECTOR_ORACLE_CONTRACT_ID`: Deployed Reflector oracle contract ID
- `NUM_ACCOUNTS`: Number of accounts to create
- `SIMULATION_INTERVAL`: Seconds between simulation iterations
- `ARBITRAGE_SCAN_INTERVAL`: Seconds between arbitrage scans

## Testing

Run the integration tests:

```bash
python test_integration.py
```

## Architecture

The backend follows a modular architecture:

```
main.py                 # Entry point and orchestration
├── accounts.py         # Account management
├── assets.py           # Asset creation and trustlines
├── liquidity_pools.py  # Liquidity pool setup
├── orders.py           # Initial order creation
├── simulation.py       # Continuous trading simulation
├── arbitrage_engine.py # Arbitrage detection and execution
├── contract_client.py  # Smart contract interface
├── reflector_client.py # Reflector oracle interface
└── trading_executor.py # Trade execution logic
```

## Data Flow

1. Accounts and assets are created and funded
2. Initial market orders are placed
3. Simulation engine continuously creates new orders
4. Arbitrage engine periodically scans for opportunities
5. Opportunities are sent to smart contracts for validation
6. Valid opportunities trigger trade execution
7. Reflector oracle provides price data to contracts

## Extending the System

To add new features:

1. Create new modules for specific functionality
2. Integrate with existing components through well-defined interfaces
3. Update the main orchestration logic as needed
4. Add configuration options to `.env`
5. Update documentation

## Troubleshooting

Common issues and solutions:

- **Account funding failures**: Check Friendbot availability and network connectivity
- **Contract interaction errors**: Verify contract IDs and network configuration
- **Permission errors**: Ensure accounts have sufficient funds for transactions
- **Rate limiting**: Reduce simulation frequency if hitting rate limits