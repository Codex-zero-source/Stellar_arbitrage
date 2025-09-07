# Stellar Arbitrage Trading Platform

A blockchain-based arbitrage detection and execution system built on the Stellar network using Soroban smart contracts. This platform identifies profitable arbitrage opportunities across decentralized exchanges (DEXs) and executes trades using flash loans (Xycloans) for capital-efficient trading.

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


## Smart Contract Addresses and Contract IDs
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015


ARBITRAGE_DETECTOR_CONTRACT_ID=CBQHRSQGINQL44XCAIMVEEJRNO7NUXEGRPF2I2E7SK2XBMFXY6XVOT4J
REFLECTOR_ORACLE_CONTRACT_ID=CDHXGW5XPQN34WP3GQZ3QA76ECI7RP3GE4HRASYPTRUJXYDWOTLVMAPK
TRADING_ENGINE_CONTRACT_ID=CC52KVUOD5YWXHKO55TO3FQ5QDY7ELWM7FHZ4JVE7CQWXR7KCTEU7WUY
```

## Running the Platform

### Start the Web Dashboard
The web dashboard displays real-time arbitrage opportunities and trade execution:
```bash
cd web/dashboard
npm install
npm run dev
```

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
   - Fetches market prices and order book data:
      - Simulated order book and liquidity using multiple accounts created to create Buy/Sell orders.
      - Custom created assets will be tracked by the reflector oracle contract endpoint.
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

## Troubleshooting

### Common Issues

1. **Contract call failures**: Ensure contract IDs are correctly set in `.env` files
2. **Insufficient funds**: Make sure trading accounts have sufficient XLM for transaction fees
3. **Network connectivity**: Verify RPC endpoint URLs are accessible
4. **Stellar CLI issues**: Try reinstalling with `cargo install --locked stellar-cli`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
