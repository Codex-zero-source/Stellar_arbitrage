# Stellar Arbitrage Trading Platform

A blockchain-based arbitrage detection and execution system built on the Stellar network using Soroban smart contracts. This platform identifies profitable arbitrage opportunities across decentralized exchanges (DEXs) and executes trades using flash loans (Xycloans) for capital-efficient trading.

## Project Overview

The Stellar Arbitrage Trading Platform is a sophisticated on-chain automated cryptocurrency arbitrage trading system. It leverages real-time price data from Reflector Network oracles to detect and execute profitable trades across decentralized exchanges on the Stellar blockchain using Soroban smart contracts.

The system focuses exclusively on DEX-to-DEX arbitrage strategies to avoid the complexity of centralized exchange APIs, with cross-chain support for Ethereum through Uniswap integration.

## Key Features

- **Arbitrage Detection**: Identifies profitable trading opportunities across multiple DEXs using real market data
- **Flash Loan Integration**: Uses XycLoans contract for capital-efficient trading
- **Cross-Chain Support**: Integrates with Uniswap for Ethereum-based trading opportunities
- **Real-time Monitoring**: WebSocket-based dashboard for real-time trade monitoring
- **Risk Management**: Position monitoring and stop-loss mechanisms
- **Modular Architecture**: Clean separation of concerns across multiple smart contracts
- **Real Asset Integration**: Uses genuine Reflector-tracked assets (AQUA, yUSDC, EURC, BTCLN, KALE)
- **TWAP Calculations**: Time-weighted average price validation for manipulation detection
- **Historical Analysis**: Access to historical price data and trends

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

## Troubleshooting

### Common Issues

1. **Contract call failures**: Ensure contract IDs are correctly set in `.env` files
2. **Insufficient funds**: Make sure trading accounts have sufficient XLM for transaction fees
3. **Network connectivity**: Verify RPC endpoint URLs are accessible
4. **Stellar CLI issues**: Try reinstalling with `cargo install --locked stellar-cli`
5. **Oracle data delays**: Check Reflector Oracle status and network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.