# Stellar Arbitrage Trading Platform

A blockchain-based arbitrage detection and execution system built on the Stellar network using Soroban smart contracts. This platform identifies profitable arbitrage opportunities across decentralized exchanges (DEXs) and executes trades using flash loans for capital-efficient trading.

## Project Overview

The Stellar Arbitrage Trading Platform is a sophisticated on-chain automated cryptocurrency arbitrage trading system. It leverages real-time price data from Reflector Network oracles to detect and execute profitable trades across decentralized exchanges on the Stellar blockchain using Soroban smart contracts.

The system focuses exclusively on DEX-to-DEX arbitrage strategies to avoid the complexity of centralized exchange APIs, with cross-chain support for Ethereum through Uniswap integration.

## Key Features

- **Arbitrage Detection**: Identifies profitable trading opportunities across multiple DEXs
- **Flash Loan Integration**: Uses XycLoans contract for capital-efficient trading
- **Cross-Chain Support**: Integrates with Uniswap for Ethereum-based trading opportunities
- **Real-time Monitoring**: WebSocket-based dashboard for real-time trade monitoring
- **Risk Management**: Position monitoring and stop-loss mechanisms
- **Modular Architecture**: Clean separation of concerns across multiple smart contracts

## System Architecture

The platform consists of several core components:

1. **Oracle Client** - Interfaces with Reflector Network for real-time price data
2. **Arbitrage Detector** - Identifies profitable trading opportunities
3. **Exchange Interface** - Connects to various decentralized exchanges
4. **Flash Loan Arbitrage Engine** - Coordinates flash loan-based arbitrage opportunities
5. **Trading Execution Engine** - Executes trades across different venues
6. **Risk Management System** - Monitors and controls trading risks
7. **Cross-Chain Modules** - Enables arbitrage opportunities across Stellar and Ethereum

## Prerequisites

1. **Rust Toolchain**: Install Rust with the wasm32 target
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. **Stellar CLI Tools**: Install Stellar CLI
   ```bash
   cargo install --locked stellar-cli
   ```

3. **Node.js**: For web dashboard components (v14 or higher)

## Smart Contract Deployment

### 1. Compile Contracts
```bash
cd contracts
stellar contract build
```

This will build all contracts in the workspace and generate WASM files in the `target/wasm32-unknown-unknown/release/` directory.

### 2. Deploy to Stellar Testnet
```bash
# Deploy Reflector Oracle Client
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reflector_oracle_client.wasm \
  --source <SOURCE_ACCOUNT_SECRET_KEY> \
  --network testnet

# Deploy Arbitrage Detector
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/arbitrage_detector.wasm \
  --source <SOURCE_ACCOUNT_SECRET_KEY> \
  --network testnet
```

### 3. Update Environment Variables
Update the `.env` file with your deployed contract IDs:
```env
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

ARBITRAGE_DETECTOR_CONTRACT_ID=your_deployed_arbitrage_detector_id
REFLECTOR_ORACLE_CONTRACT_ID=your_deployed_reflector_oracle_client_id
```

## Running the Platform

### Start the Web Dashboard
The web dashboard displays real-time arbitrage opportunities and trade execution:
```bash
cd web/dashboard
npm install
npm run dev
```

## Configuration

Set up your environment variables in `web/dashboard/backend/.env`:

```env
# Stellar Network Configuration
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract IDs (updated with deployed addresses)
ARBITRAGE_DETECTOR_CONTRACT_ID=your_deployed_arbitrage_detector_id
REFLECTOR_ORACLE_CONTRACT_ID=your_deployed_reflector_oracle_client_id
TRADING_ENGINE_CONTRACT_ID=your_deployed_trading_engine_id

# Flash Loan Provider
FLASH_LOAN_PROVIDER=CB75LG2KULDDIFL2BBZHIBXDPXELJJFWRRHKJZ2H5JF7C4DT6GHW4PJQ

# Simulation Parameters
NUM_ACCOUNTS=10
SIMULATION_INTERVAL=10
ARBITRAGE_SCAN_INTERVAL=15
```

## Smart Contract Structure

### Core Contracts

1. **Reflector Oracle Client**
   - Integrates with Reflector Network for real-time price data
   - Implements TWAP (Time-Weighted Average Price) calculations
   - Provides price validation and manipulation detection

2. **Arbitrage Detector**
   - Scans multiple exchanges for arbitrage opportunities
   - Calculates net profits after all trading fees
   - Estimates price slippage for large trades

3. **Exchange Interface**
   - Provides unified interface to interact with various exchanges
   - Fetches market prices and order book data
   - Supports DEX integrations

4. **Flash Loan Arbitrage Engine**
   - Coordinates flash loan-based arbitrage opportunities
   - Integrated with XycLoans contract for flash loan functionality
   - Validates arbitrage parameters specifically for Stellar DEX

5. **Trading Execution Engine**
   - Executes trades exclusively on Stellar DEX
   - Handles buy and sell orders with proper validation
   - Implements batch trade execution with atomicity guarantees

6. **Risk Management System**
   - Assesses trade risk based on multiple factors
   - Monitors position exposure and drawdowns
   - Implements stop-loss functionality

### Cross-Chain Contracts

1. **Uniswap Interface**
   - Provides integration with Uniswap for Ethereum-based trades
   - Fetches market prices and liquidity data

2. **Cross-Chain Arbitrage Detector**
   - Identifies cross-chain arbitrage opportunities
   - Calculates profitability across different blockchains

3. **Cross-Chain Trading Engine**
   - Executes trades across different blockchains
   - Handles cross-chain order management

4. **Cross-Chain Flash Loan Engine**
   - Handles cross-chain flash loan arbitrage
   - Coordinates borrowing and trading across chains

## Testing

### Unit Tests
Run contract unit tests:
```bash
cd contracts
cargo test
```

### Integration Tests
Run integration tests:
```bash
cd web/dashboard/backend
python test_contracts.py
```

## Troubleshooting

### Common Issues

1. **Contract call failures**: Ensure contract IDs are correctly set in `.env` files
2. **Insufficient funds**: Make sure trading accounts have sufficient XLM for transaction fees
3. **Network connectivity**: Verify RPC endpoint URLs are accessible
4. **Stellar CLI issues**: Try reinstalling with `cargo install --locked stellar-cli`

### Debugging

Use the debug scripts in `web/dashboard/backend/`:
- `debug_contract_call.py` - Debug contract calls
- `test_contracts.py` - Test contract functionality
- `address_test.py` - Test address parameter passing

## Development Progress

### Completed Components
- ✅ Reflector Oracle Client with TWAP calculations
- ✅ Arbitrage Detector with core logic
- ✅ Exchange Interface for DEX operations
- ✅ Flash Loan Arbitrage Engine with XycLoans integration
- ✅ Trading Execution Engine for DEX trades
- ✅ Risk Management System with real position monitoring
- ✅ Cross-Chain modules for Ethereum integration
- ✅ Web dashboard with real-time monitoring
- ✅ Unit tests for all components

### Next Steps for Production Deployment
1. Implement actual Stellar DEX API connections
2. Integrate with Uniswap smart contracts
3. Add real-time market data feeds
4. Conduct comprehensive integration testing
5. Prepare for security audit
6. Deploy to testnet for validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

For more detailed information, check the documentation in the [docs](docs/) directory:
- [Project Summary](docs/PROJECT_SUMMARY.md)
- [Implementation Report](docs/FINAL_IMPLEMENTATION_REPORT.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Development Plan](docs/development_plan.md)
- [Development Timeline](docs/development_timeline.md)