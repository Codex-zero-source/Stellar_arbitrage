# Stellar Arbitrage Trading Platform

A blockchain-based arbitrage detection system built on the Stellar network using Soroban smart contracts. This platform identifies profitable arbitrage opportunities across decentralized exchanges (DEXs) by leveraging real-time price data from the Reflector Network oracle.

## Project Overview

The Stellar-Arbitrage project enables automated detection of cross-market price discrepancies on the Stellar blockchain, allowing traders and bots to execute low-latency arbitrage strategies with minimal manual intervention.

### Key Features

- Arbitrage opportunity detection across multiple exchanges
- Integration with Reflector Network for trusted price oracles
- Modular interfaces for exchange and oracle interactions
- Comprehensive unit testing support via Soroban test utilities
- Flash loan integration for capital-efficient trading
- Risk management and position monitoring

## System Architecture

The platform consists of several core components:

1. **Oracle Client** - Interfaces with Reflector Network for real-time price data
2. **Arbitrage Detector** - Identifies profitable trading opportunities
3. **Exchange Interface** - Connects to various centralized and decentralized exchanges
4. **Flash Loan Arbitrage Engine** - Coordinates flash loan-based arbitrage opportunities
5. **Trading Execution Engine** - Executes trades across different venues
6. **Risk Management System** - Monitors and controls trading risks

## Technology Stack

- **Smart Contract Language**: Rust (edition 2021)
- **Blockchain Platform**: Soroban (Stellar's smart contract platform)
- **Core Framework**: soroban-sdk = "23.0.0-rc.3"
- **HTTP Client**: reqwest = "0.11" (with JSON support)
- **Async Runtime**: tokio = "1" (full features)
- **Configuration**: dotenv = "0.15.0"
- **Serialization**: serde, serde_json
- **Error Handling**: anyhow, thiserror
- **Math Operations**: rust_decimal
- **Off-chain Components**: Node.js (monitoring bot) and Python (analytics)

## Setup and Installation

### Prerequisites

- Rust toolchain (stable or nightly compatible with Soroban)
- Soroban CLI (`soroban-cli`)
- Node.js (for off-chain monitoring)
- Python 3.8+ (for analytics)

### Smart Contract Development Setup

1. Install Rust toolchain:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install the wasm32-unknown-unknown target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. Install Soroban CLI:
   ```bash
   cargo install --locked soroban-cli
   ```

4. Install development tools:
   ```bash
   cargo install cargo-hack cargo-nextest
   ```

### Environment Configuration

Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Update the values in `.env` with your actual API keys and configuration parameters.

### Building the Contracts

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Running Tests

```bash
cargo test
```

### Deploying to Testnet

1. Start a local Soroban network (optional):
   ```bash
   soroban lab start
   ```

2. Deploy the contract using one of the following methods:

   **Method 1: Using environment variable**
   ```bash
   export SECRET_KEY=YOUR_SECRET_KEY
   ./scripts/deploy-testnet.sh
   ```

   **Method 2: Using the new deployment scripts with secret key parameter**
   ```bash
   ./scripts/deploy-with-key.sh YOUR_SECRET_KEY
   ```

   **On Windows:**
   ```cmd
   scripts\deploy-with-key.bat YOUR_SECRET_KEY
   ```

   Note: You can create a testnet account and get funded XLM from the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test).

## Core Smart Contracts

### Phase 1 Contracts (Completed)

1. **[Reflector Oracle Client](src/reflector_oracle_client.rs)** - Fetches real-time price data from Reflector Network
2. **[Arbitrage Detector](src/arbitrage_detector.rs)** - Identifies profitable arbitrage opportunities
3. **[Exchange Interface](src/exchange_interface.rs)** - Connects to various exchanges

### Phase 2 Contracts (Implemented)

1. **[Flash Loan Arbitrage Engine](src/flash_loan_arbitrage_engine.rs)** - Coordinates flash loan-based arbitrage
2. **[Trading Execution Engine](src/trading_execution_engine.rs)** - Executes buy/sell orders
3. **[Risk Management System](src/risk_management_system.rs)** - Manages trading risks

## Off-chain Components

### Price Monitor (Node.js)

The price monitor connects to Reflector Network's WebSocket API to receive real-time price updates and trigger arbitrage opportunities.

To run:
```bash
cd off_chain
npm install
npm start
```

### Analytics (Python)

The analytics component tracks trading performance and generates reports.

To run:
```bash
cd off_chain
pip install -r requirements.txt
python Analytics.py
```

## Development Roadmap

See [development_plan.md](development_plan.md) for the detailed development plan.

## Testing Strategy

See [testing_strategy.md](testing_strategy.md) for the comprehensive testing approach.

## Risk Assessment

See [risk_assessment.md](risk_assessment.md) for the detailed risk analysis and mitigation strategies.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Stellar Development Foundation for the Soroban platform
- Reflector Network for providing price oracle services
- The Rust and Stellar communities for their excellent documentation and tools