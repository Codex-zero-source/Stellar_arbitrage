# Stellar Arbitrage Trading Platform

A comprehensive blockchain-based arbitrage detection and execution system built on the Stellar network using Soroban smart contracts. This platform identifies profitable arbitrage opportunities across decentralized exchanges (DEXs) and executes trades using flash loans (Xycloans) for capital-efficient trading.

## Project Overview

The Stellar Arbitrage Trading Platform is a sophisticated full-stack automated cryptocurrency arbitrage trading system. It leverages real-time price data from Reflector Network oracles to detect and execute profitable trades across decentralized exchanges on the Stellar blockchain using Soroban smart contracts.

The system features a complete React-based frontend dashboard with real-time WebSocket communication to a Python backend, providing live monitoring and control of arbitrage operations. The platform focuses exclusively on DEX-to-DEX arbitrage strategies to avoid the complexity of centralized exchange APIs, with cross-chain support for Ethereum through Uniswap integration.

## Key Features

### Core Trading Features
- **Arbitrage Detection**: Identifies profitable trading opportunities across multiple DEXs using real market data
- **Flash Loan Integration**: Uses XycLoans contract for capital-efficient trading
- **Cross-Chain Support**: Integrates with Uniswap for Ethereum-based trading opportunities
- **Risk Management**: Position monitoring and stop-loss mechanisms
- **Real Asset Integration**: Uses genuine Reflector-tracked assets (AQUA, yUSDC, EURC, BTCLN, KALE)
- **TWAP Calculations**: Time-weighted average price validation for manipulation detection
- **Historical Analysis**: Access to historical price data and trends

### Frontend Dashboard Features
- **Real-time Monitoring**: Live WebSocket-based dashboard for real-time trade monitoring and system status
- **Interactive UI**: Modern React-based interface with Tailwind CSS styling
- **Live Data Visualization**: Real-time price feeds, arbitrage opportunities, and trading statistics
- **System Controls**: Start/stop arbitrage monitoring, configure trading parameters
- **Notifications System**: Real-time alerts for trading opportunities and system events
- **Responsive Design**: Mobile-friendly interface for monitoring on any device

### Backend Integration Features
- **WebSocket Server**: Real-time bidirectional communication between frontend and backend
- **Python Trading Engine**: Robust backend system for executing arbitrage strategies
- **Stellar SDK Integration**: Direct integration with Stellar network and Soroban smart contracts
- **Error Handling**: Comprehensive error management and recovery systems
- **Modular Architecture**: Clean separation of concerns across multiple smart contracts

## System Architecture

The platform consists of several core components:

1. **Oracle Client** - Interfaces with Reflector Network for real-time price data
2. **Arbitrage Detector** - Identifies profitable trading opportunities using real market data
3. **Exchange Interface** - Connects to various decentralized exchanges with real liquidity
4. **Flash Loan Arbitrage Engine** - Coordinates flash loan-based arbitrage opportunities
5. **Trading Execution Engine** - Executes trades across different venues with real DEX integration
6. **Risk Management System** - Monitors and controls trading risks with real market analysis
7. **Cross-Chain Modules** - Enables arbitrage opportunities across Stellar and Ethereum

## Smart Contract Addresses and Contract IDs

```
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

ARBITRAGE_DETECTOR_CONTRACT_ID=CAIEZ2IDLR2NWZVA3AYTJ5OLJC2A53GSPBMB43FQSESVJRWM4CFLZ45Q
REFLECTOR_ORACLE_CONTRACT_ID=CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC
TRADING_ENGINE_CONTRACT_ID=CC52KVUOD5YWXHKO55TO3FQ5QDY7ELWM7FHZ4JVE7CQWXR7KCTEU7WUY

FLASH_LOAN_PROVIDER=CBXLI4HIOKWWOUT5OHCCQYDSCLOVGBWXCGFVI44SC3BJA6QHFJFIKM7R
```

## Real Asset Integration

The platform now uses genuine Reflector-tracked assets instead of custom simulations:

1. **AQUA** (Governance token)
   - Contract: CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG
   - Issuer: GCQHNQR2ZRFKD45VGS6EEWGPHPND7DEQFPAVYJ5CQZXYZSHZCCZ5ILHP
   - Decimals: 7

2. **yUSDC** (Yield-bearing USD Coin)
   - Contract: CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS
   - Issuer: GDDIKAFGVT7VUHV7R6YKCBQZH3VQRZ2Z7ZFQF7UKUZD2EABJ7UBJWZM4
   - Decimals: 6

3. **EURC** (Euro Coin)
   - Contract: CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236
   - Issuer: GBTM4WVMZMZW7ZRUYJZBRKXDWZKWLIPQXRMKJYQZ6WDDZ7FFHRLGBHZJ
   - Decimals: 6

4. **BTCLN** (Bitcoin Lightning)
   - Contract: CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR
   - Issuer: GDVMVDHJWMQFZSQHGTKQJ7DMBG7RSTMYVWPUQHEGFHQLBMJRR5PLLF2W
   - Decimals: 8

5. **KALE** (Utility token)
   - Contract: CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG
   - Issuer: GARFQB6WUV7NBRWOGWXJ4LQGQE2TQVXBFNW6VUGWSAFUDWKZ6PZKNPRZ
   - Decimals: 7

## Smart Contract Structure

### Core Contracts

1. **Reflector Oracle Client**
   - Integrates with Reflector Network for real-time price data
   - Implements TWAP (Time-Weighted Average Price) calculations
   - Provides price validation and manipulation detection
   - Accesses historical price data and trends

2. **Arbitrage Detector**
   - Scans multiple exchanges for arbitrage opportunities using real market data
   - Calculates net profits after all trading fees
   - Estimates price slippage for large trades based on actual liquidity
   - Validates prices using TWAP to detect manipulation

3. **Exchange Interface**
   - Provides unified interface to interact with various exchanges
   - Fetches real market prices and order book data from actual DEX liquidity pools
   - Supports DEX integrations with real trading pairs

4. **Flash Loan Arbitrage Engine**
   - Coordinates flash loan-based arbitrage opportunities
   - Integrated with XycLoans contract for flash loan functionality
   - Validates arbitrage parameters specifically for Stellar DEX with real market conditions

5. **Trading Execution Engine**
   - Executes trades exclusively on Stellar DEX with real liquidity
   - Handles buy and sell orders with proper validation against actual market prices
   - Implements batch trade execution with atomicity guarantees

6. **Risk Management System**
   - Assesses trade risk based on real market volatility and liquidity
   - Monitors position exposure and drawdowns using actual price movements
   - Implements stop-loss functionality based on real market conditions

### Cross-Chain Contracts

1. **Uniswap Interface**
   - Provides integration with Uniswap for Ethereum-based trades
   - Fetches real market prices and liquidity data from Uniswap

2. **Cross-Chain Arbitrage Detector**
   - Identifies cross-chain arbitrage opportunities using real price data
   - Calculates profitability across different blockchains with actual trading fees

3. **Cross-Chain Trading Engine**
   - Executes trades across different blockchains with real market integration
   - Handles cross-chain order management with actual execution

4. **Cross-Chain Flash Loan Engine**
   - Handles cross-chain flash loan arbitrage with real asset trading
   - Coordinates borrowing and trading across chains with actual market data

## Frontend Dashboard

### Overview

The platform includes a modern React-based frontend dashboard that provides real-time monitoring and control of the arbitrage trading system. The dashboard communicates with the Python backend through WebSocket connections for live data updates.

### Frontend Features

- **Real-time Data**: Live price feeds, arbitrage opportunities, and system status
- **Interactive Controls**: Start/stop monitoring, configure trading parameters
- **Notifications**: Real-time alerts and system notifications
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Built with React, Vite, and Tailwind CSS

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd web/dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` (or the next available port).

### Frontend Components

- **ArbitrageExecutor**: Main component for monitoring and controlling arbitrage operations
- **SocketContext**: WebSocket connection management and real-time data handling
- **NotificationContext**: System-wide notification and alert management
- **StellarContractClient**: Frontend interface to Stellar smart contracts
- **Dashboard Components**: Various UI components for data visualization and controls

## Running the Backend System

### Prerequisites

1. Python 3.8+
2. Stellar SDK for Python
3. Access to Stellar Testnet
4. Funded Stellar account for trading
5. Node.js 16+ (for frontend development)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd web/dashboard/backend
   ```

2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up the trading account:
   ```bash
   python setup_trading.py
   ```

4. Test contract interactions:
   ```bash
   python test_contracts.py
   ```

### Starting the WebSocket Server

To start the backend WebSocket server that handles arbitrage scanning:

```bash
python main.py
```

The server will start on `localhost:8768` and handle WebSocket connections for real-time arbitrage scanning.

### Backend Components

- **main.py**: WebSocket server that orchestrates all operations
- **arbitrage_engine.py**: Core logic for scanning arbitrage opportunities
- **contract_client.py**: Interface to Stellar smart contracts
- **trading_account.py**: Management of trading accounts and funding
- **assets.py**: Asset trustline management
- **accounts.py**: Account creation and management
- **error_handler.py**: Error handling and decoding

## Complete System Deployment

### Development Environment

1. **Start Backend Server**:
   ```bash
   cd web/dashboard/backend
   python main.py
   ```

2. **Start Frontend Dashboard** (in a new terminal):
   ```bash
   cd web/dashboard
   npm run dev
   ```

3. **Access the Application**:
   - Frontend Dashboard: `http://localhost:5173`
   - Backend WebSocket: `ws://localhost:8768`

### Production Deployment

The system can be deployed using Docker and the provided configuration files:

```bash
docker-compose up -d
```

This will start both the frontend and backend services with proper networking and persistence.

## WebSocket Integration

### Real-time Communication

The platform uses WebSocket connections to provide real-time communication between the frontend dashboard and backend trading engine. This enables:

- **Live Price Updates**: Real-time price feeds from multiple exchanges
- **Arbitrage Alerts**: Instant notifications when profitable opportunities are detected
- **System Status**: Live monitoring of backend processes and connection status
- **Trading Updates**: Real-time feedback on trade execution and results

### WebSocket Protocol

The WebSocket server runs on `localhost:8768` and handles the following message types:

- **Connection Management**: Client connection/disconnection handling
- **Price Data**: Real-time price updates from Reflector oracles
- **Arbitrage Opportunities**: Detected trading opportunities with profit calculations
- **System Commands**: Start/stop monitoring, configuration updates
- **Error Notifications**: Real-time error reporting and system alerts

### Message Format

WebSocket messages use JSON format for structured communication:

```json
{
  "type": "arbitrage_opportunity",
  "data": {
    "pair": "AQUA/yUSDC",
    "profit": 0.025,
    "exchanges": ["StellarX", "Lobstr"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Troubleshooting

### Common Issues

1. **Contract call failures**: Ensure contract IDs are correctly set in `.env` files
2. **Insufficient funds**: Make sure trading accounts have sufficient XLM for transaction fees
3. **Network connectivity**: Verify RPC endpoint URLs are accessible
4. **Stellar CLI issues**: Try reinstalling with `cargo install --locked stellar-cli`
5. **Oracle data delays**: Check Reflector Oracle status and network connectivity

### Frontend Issues

1. **WebSocket connection failures**: Ensure backend server is running on port 8768
2. **Build errors**: Clear Vite cache with `rm -rf node_modules/.vite && npm run build`
3. **Port conflicts**: Frontend may use ports 5173-5176 if others are occupied
4. **Browser cache**: Hard refresh (Ctrl+F5) to clear cached JavaScript files
5. **Node.js version**: Ensure Node.js 16+ is installed for proper dependency support

### Backend Issues

1. **Python dependencies**: Ensure all requirements are installed with `pip install -r requirements.txt`
2. **Stellar SDK errors**: Verify Stellar SDK version compatibility
3. **WebSocket server**: Check if port 8768 is available and not blocked by firewall
4. **Contract deployment**: Ensure smart contracts are properly deployed to testnet

### RPC Connection Issues

If you encounter RPC connection issues, try these alternative URLs in your `.env` file:

```
STELLAR_SOROBAN_RPC_URL=https://rpc.testnet.stellar.org:443/soroban/rpc
# or
STELLAR_SOROBAN_RPC_URL=https://soroban-rpc.testnet.stellar.org
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.