# API Documentation for Enhanced Reflector Oracle Features

## Overview

This document provides detailed API documentation for the enhanced Reflector Oracle client and its integration with the Stellar Arbitrage Platform. The enhanced oracle provides real-time price feeds, TWAP calculations, historical price data, and price manipulation detection for genuine arbitrage opportunities.

## Reflector Oracle Client API

### get_price_and_timestamp

**Description**: Fetches the current price and timestamp for a given asset from the Reflector Oracle.

**Signature**:
```rust
pub fn get_price_and_timestamp(env: Env, asset_address: String) -> Result<(i128, u64), OracleError>
```

**Parameters**:
- `env`: Soroban environment
- `asset_address`: Contract address of the asset (String)

**Returns**:
- `Ok((price, timestamp))`: Tuple containing the price (scaled by 10^7) and timestamp (Unix timestamp)
- `Err(OracleError)`: Error if the call fails

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid asset address
- `ContractCallFailed`: Failed to call the oracle contract
- `AssetNotSupported`: Asset not tracked by the oracle

**Example**:
```rust
let (price, timestamp) = oracle_client.get_price_and_timestamp(env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG")?;
```

### get_twap_price

**Description**: Calculates the Time-Weighted Average Price (TWAP) for a given asset over a specified number of records.

**Signature**:
```rust
pub fn get_twap_price(env: Env, asset_address: String, records: u32) -> Result<i128, OracleError>
```

**Parameters**:
- `env`: Soroban environment
- `asset_address`: Contract address of the asset (String)
- `records`: Number of historical records to include in TWAP calculation (u32)

**Returns**:
- `Ok(twap)`: Time-weighted average price (scaled by 10^7)
- `Err(OracleError)`: Error if the call fails

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid asset address
- `ContractCallFailed`: Failed to call the oracle contract
- `AssetNotSupported`: Asset not tracked by the oracle

**Example**:
```rust
let twap = oracle_client.get_twap_price(env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG", 30)?;
```

### get_historical_prices

**Description**: Retrieves historical price data for a given asset.

**Signature**:
```rust
pub fn get_historical_prices(env: Env, asset_address: String, count: u32) -> Result<Vec<PriceData>, OracleError>
```

**Parameters**:
- `env`: Soroban environment
- `asset_address`: Contract address of the asset (String)
- `count`: Number of historical price records to retrieve (u32)

**Returns**:
- `Ok(prices)`: Vector of PriceData structs containing historical price information
- `Err(OracleError)`: Error if the call fails

**PriceData Structure**:
```rust
pub struct PriceData {
    pub asset: String,
    pub price: i128,
    pub volume_24h: i128,
    pub timestamp: u64,
    pub source: String,
    pub confidence: i128,
}
```

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid asset address
- `ContractCallFailed`: Failed to call the oracle contract
- `AssetNotSupported`: Asset not tracked by the oracle

**Example**:
```rust
let historical_prices = oracle_client.get_historical_prices(env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG", 100)?;
```

### get_price_data

**Description**: Retrieves comprehensive price data for a given asset.

**Signature**:
```rust
pub fn get_price_data(env: Env, asset_address: String) -> Result<PriceData, OracleError>
```

**Parameters**:
- `env`: Soroban environment
- `asset_address`: Contract address of the asset (String)

**Returns**:
- `Ok(price_data)`: PriceData struct containing comprehensive price information
- `Err(OracleError)`: Error if the call fails

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid asset address
- `ContractCallFailed`: Failed to call the oracle contract
- `AssetNotSupported`: Asset not tracked by the oracle

**Example**:
```rust
let price_data = oracle_client.get_price_data(env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG")?;
```

### get_supported_assets

**Description**: Retrieves a list of all assets supported by the Reflector Oracle.

**Signature**:
```rust
pub fn get_supported_assets(env: Env) -> Result<Vec<String>, OracleError>
```

**Parameters**:
- `env`: Soroban environment

**Returns**:
- `Ok(assets)`: Vector of asset contract addresses (String)
- `Err(OracleError)`: Error if the call fails

**Errors**:
- `NetworkError`: Network connectivity issues
- `ContractCallFailed`: Failed to call the oracle contract

**Example**:
```rust
let supported_assets = oracle_client.get_supported_assets(env)?;
```

### get_oracle_decimals

**Description**: Retrieves the decimal precision used by the Reflector Oracle.

**Signature**:
```rust
pub fn get_oracle_decimals(env: Env) -> Result<u32, OracleError>
```

**Parameters**:
- `env`: Soroban environment

**Returns**:
- `Ok(decimals)`: Number of decimal places used by the oracle (u32)
- `Err(OracleError)`: Error if the call fails

**Errors**:
- `NetworkError`: Network connectivity issues
- `ContractCallFailed`: Failed to call the oracle contract

**Example**:
```rust
let decimals = oracle_client.get_oracle_decimals(env)?;
```

### get_price_change_percentage

**Description**: Retrieves the price change percentage for a given asset over the last 24 hours.

**Signature**:
```rust
pub fn get_price_change_percentage(env: Env, asset_address: String) -> Result<i128, OracleError>
```

**Parameters**:
- `env`: Soroban environment
- `asset_address`: Contract address of the asset (String)

**Returns**:
- `Ok(change_percentage)`: Price change percentage in basis points (i128)
- `Err(OracleError)`: Error if the call fails

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid asset address
- `ContractCallFailed`: Failed to call the oracle contract
- `AssetNotSupported`: Asset not tracked by the oracle

**Example**:
```rust
let change_percentage = oracle_client.get_price_change_percentage(env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG")?;
```

### get_order_book

**Description**: Retrieves order book data for a given asset and exchange.

**Signature**:
```rust
pub fn get_order_book(env: Env, asset_address: String, exchange: String) -> Result<OrderBookData, OracleError>
```

**Parameters**:
- `env`: Soroban environment
- `asset_address`: Contract address of the asset (String)
- `exchange`: Exchange identifier (String)

**Returns**:
- `Ok(order_book)`: OrderBookData struct containing bid and ask data
- `Err(OracleError)`: Error if the call fails

**OrderBookData Structure**:
```rust
pub struct OrderBookData {
    pub bids: Vec<OrderBookEntry>,
    pub asks: Vec<OrderBookEntry>,
    pub timestamp: u64,
}

pub struct OrderBookEntry {
    pub price: i128,
    pub amount: i128,
}
```

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid asset address or exchange
- `ContractCallFailed`: Failed to call the oracle contract
- `AssetNotSupported`: Asset not tracked by the oracle

**Example**:
```rust
let order_book = oracle_client.get_order_book(env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG", "Stellar DEX")?;
```

### validate_price_deviation

**Description**: Validates whether a price deviates significantly from a reference price, which could indicate price manipulation.

**Signature**:
```rust
pub fn validate_price_deviation(current_price: i128, reference_price: i128, max_deviation_bps: i128) -> bool
```

**Parameters**:
- `current_price`: Current price to validate (i128)
- `reference_price`: Reference price for comparison (i128)
- `max_deviation_bps`: Maximum allowed deviation in basis points (i128)

**Returns**:
- `bool`: True if price deviation is within acceptable limits, false otherwise

**Example**:
```rust
let is_valid = oracle_client.validate_price_deviation(100000000, 101000000, 500)?; // 5% max deviation
```

## Arbitrage Detector API

### scan_opportunities

**Description**: Scans for arbitrage opportunities between the Reflector Oracle and Stellar DEX.

**Signature**:
```rust
pub fn scan_opportunities(env: Env, assets: Vec<String>, min_profit: i128, exchange_address: Address) -> Vec<ArbitrageOpportunity>
```

**Parameters**:
- `env`: Soroban environment
- `assets`: Vector of asset contract addresses to scan (Vec<String>)
- `min_profit`: Minimum profit threshold (i128)
- `exchange_address`: Address of the Exchange contract (Address)

**Returns**:
- `Vec<ArbitrageOpportunity>`: Vector of detected arbitrage opportunities

**ArbitrageOpportunity Structure**:
```rust
pub struct ArbitrageOpportunity {
    pub asset: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: i128,
    pub sell_price: i128,
    pub available_amount: i128,
    pub estimated_profit: i128,
    pub confidence_score: i128,
    pub expiry_time: u64,
}
```

**Example**:
```rust
let opportunities = arbitrage_detector.scan_opportunities(env, assets, 1000000, exchange_address)?;
```

### calculate_profit

**Description**: Calculates the net profit for an arbitrage opportunity after accounting for all fees.

**Signature**:
```rust
pub fn calculate_profit(buy_price: i128, sell_price: i128, amount: i128, fees: TradingFees) -> i128
```

**Parameters**:
- `buy_price`: Purchase price (i128)
- `sell_price`: Selling price (i128)
- `amount`: Trade amount (i128)
- `fees`: TradingFees struct containing fee information (TradingFees)

**Returns**:
- `i128`: Net profit after fees

**TradingFees Structure**:
```rust
pub struct TradingFees {
    pub maker_fee_bps: i128,
    pub taker_fee_bps: i128,
    pub withdrawal_fee: i128,
    pub gas_fee: i128,
    pub flash_loan_fee_bps: i128,
}
```

**Example**:
```rust
let profit = arbitrage_detector.calculate_profit(100000000, 101000000, 10000000000, fees);
```

### estimate_slippage

**Description**: Estimates price slippage for large trades on Stellar DEX based on order book depth.

**Signature**:
```rust
pub fn estimate_slippage(env: Env, exchange_address: Address, asset: String, trade_size: i128) -> i128
```

**Parameters**:
- `env`: Soroban environment
- `exchange_address`: Address of the Exchange contract (Address)
- `asset`: Asset contract address (String)
- `trade_size`: Size of the trade (i128)

**Returns**:
- `i128`: Estimated slippage in basis points

**Example**:
```rust
let slippage = arbitrage_detector.estimate_slippage(env, exchange_address, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG", 10000000000);
```

## Exchange Interface API

### get_market_price

**Description**: Retrieves the current market price for a trading pair from a specified exchange.

**Signature**:
```rust
pub fn get_market_price(env: Env, exchange: String, pair: String) -> Result<MarketPrice, ExchangeError>
```

**Parameters**:
- `env`: Soroban environment
- `exchange`: Exchange identifier (String)
- `pair`: Trading pair (String)

**Returns**:
- `Ok(MarketPrice)`: MarketPrice struct containing price and timestamp
- `Err(ExchangeError)`: Error if the call fails

**MarketPrice Structure**:
```rust
pub struct MarketPrice {
    pub price: i128,
    pub timestamp: u64,
}
```

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid exchange or pair
- `InsufficientLiquidity`: Not enough liquidity for the pair

**Example**:
```rust
let market_price = exchange_interface.get_market_price(env, "Stellar DEX", "AQUA/XLM")?;
```

### get_order_book

**Description**: Retrieves order book data for a trading pair from a specified exchange.

**Signature**:
```rust
pub fn get_order_book(env: Env, exchange: String, pair: String, depth: u32) -> Result<OrderBook, ExchangeError>
```

**Parameters**:
- `env`: Soroban environment
- `exchange`: Exchange identifier (String)
- `pair`: Trading pair (String)
- `depth`: Depth of order book to retrieve (u32)

**Returns**:
- `Ok(OrderBook)`: OrderBook struct containing bid and ask data
- `Err(ExchangeError)`: Error if the call fails

**OrderBook Structure**:
```rust
pub struct OrderBook {
    pub bids: Vec<(i128, i128)>, // price, amount
    pub asks: Vec<(i128, i128)>, // price, amount
}
```

**Errors**:
- `NetworkError`: Network connectivity issues
- `InvalidData`: Invalid exchange or pair
- `InsufficientLiquidity`: Not enough liquidity for the pair

**Example**:
```rust
let order_book = exchange_interface.get_order_book(env, "Stellar DEX", "AQUA/XLM", 10)?;
```

## Flash Loan Arbitrage Engine API

### execute_flash_arbitrage

**Description**: Executes a flash loan arbitrage opportunity.

**Signature**:
```rust
pub fn execute_flash_arbitrage(
    env: Env,
    params: FlashLoanParameters,
    borrower: Address,
    trading_engine_address: Address,
    dex_contract_address: Address,
    asset_address: Address,
) -> Result<ArbitrageResult, FlashLoanError>
```

**Parameters**:
- `env`: Soroban environment
- `params`: FlashLoanParameters struct containing trade parameters
- `borrower`: Address of the borrower (Address)
- `trading_engine_address`: Address of the Trading Engine contract (Address)
- `dex_contract_address`: Address of the DEX contract (Address)
- `asset_address`: Address of the asset contract (Address)

**Returns**:
- `Ok(ArbitrageResult)`: ArbitrageResult struct containing execution results
- `Err(FlashLoanError)`: Error if execution fails

**FlashLoanParameters Structure**:
```rust
pub struct FlashLoanParameters {
    pub asset: String,
    pub amount: i128,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub min_profit: i128,
    pub deadline: u64,
    pub flash_loan_provider: String,
}
```

**ArbitrageResult Structure**:
```rust
pub struct ArbitrageResult {
    pub success: bool,
    pub profit: i128,
    pub gas_used: i128,
    pub error_message: String,
}
```

**Errors**:
- `InsufficientProfit`: Profit below minimum threshold
- `DeadlineExceeded`: Trade deadline has passed
- `FlashLoanFailed`: Flash loan request failed
- `TradeExecutionFailed`: Trade execution failed
- `RepaymentFailed`: Flash loan repayment failed
- `InvalidParameters`: Invalid trade parameters
- `InsufficientLiquidity`: Not enough liquidity for the trade

**Example**:
```rust
let result = flash_arbitrage_engine.execute_flash_arbitrage(
    env, 
    params, 
    borrower, 
    trading_engine_address, 
    dex_contract_address, 
    asset_address
)?;
```

## Risk Management API

### assess_trade_risk

**Description**: Assesses the risk level for a potential trade.

**Signature**:
```rust
pub fn assess_trade_risk(
    env: Env,
    trade_params: Map<String, i128>,
    risk_params: RiskParameters,
    oracle_address: Address,
) -> Result<TradeRiskAssessment, RiskError>
```

**Parameters**:
- `env`: Soroban environment
- `trade_params`: Map of trade parameters
- `risk_params`: RiskParameters struct containing risk thresholds
- `oracle_address`: Address of the Oracle contract (Address)

**Returns**:
- `Ok(TradeRiskAssessment)`: TradeRiskAssessment struct containing risk assessment
- `Err(RiskError)`: Error if assessment fails

**RiskParameters Structure**:
```rust
pub struct RiskParameters {
    pub max_position_size: i128,
    pub max_drawdown_bps: i128,
    pub max_slippage_bps: i128,
    pub min_liquidity: i128,
    pub confidence_threshold: i128,
    pub max_concurrent_trades: u32,
}
```

**TradeRiskAssessment Structure**:
```rust
pub struct TradeRiskAssessment {
    pub trade_id: String,
    pub risk_score: i128,
    pub recommended_action: String,
    pub risk_factors: Vec<String>,
    pub timestamp: u64,
}
```

**Errors**:
- `PositionLimitExceeded`: Trade size exceeds position limit
- `DrawdownLimitExceeded`: Drawdown exceeds threshold
- `InsufficientConfidence`: Confidence score below threshold
- `LiquidityRiskTooHigh`: Liquidity risk too high
- `InvalidRiskParameters`: Invalid risk parameters

**Example**:
```rust
let assessment = risk_manager.assess_trade_risk(env, trade_params, risk_params, oracle_address)?;
```

### set_stop_loss

**Description**: Sets a stop-loss order for a position.

**Signature**:
```rust
pub fn set_stop_loss(
    env: Env,
    params: StopLossParameters,
    trader: Address,
    oracle_address: Address,
) -> Result<bool, RiskError>
```

**Parameters**:
- `env`: Soroban environment
- `params`: StopLossParameters struct containing stop-loss parameters
- `trader`: Address of the trader (Address)
- `oracle_address`: Address of the Oracle contract (Address)

**Returns**:
- `Ok(bool)`: True if stop-loss is successfully set
- `Err(RiskError)`: Error if setting stop-loss fails

**StopLossParameters Structure**:
```rust
pub struct StopLossParameters {
    pub asset: String,
    pub exchange: String,
    pub stop_loss_price: i128,
    pub amount: i128,
    pub activation_time: u64,
}
```

**Errors**:
- `InvalidRiskParameters`: Invalid stop-loss parameters
- `StopLossTriggered`: Stop-loss would be immediately triggered

**Example**:
```rust
let success = risk_manager.set_stop_loss(env, params, trader, oracle_address)?;
```

## Cross-Chain Arbitrage Detector API

### scan_cross_chain_opportunities

**Description**: Scans for arbitrage opportunities between Stellar and Ethereum blockchains.

**Signature**:
```rust
pub fn scan_cross_chain_opportunities(
    env: Env, 
    assets: Vec<String>, 
    min_profit: i128,
    reflector_oracle_address: Address,
    uniswap_address: Address,
) -> Vec<CrossChainArbitrageOpportunity>
```

**Parameters**:
- `env`: Soroban environment
- `assets`: Vector of asset contract addresses to scan (Vec<String>)
- `min_profit`: Minimum profit threshold (i128)
- `reflector_oracle_address`: Address of the Reflector Oracle contract (Address)
- `uniswap_address`: Address of the Uniswap contract (Address)

**Returns**:
- `Vec<CrossChainArbitrageOpportunity>`: Vector of detected cross-chain arbitrage opportunities

**CrossChainArbitrageOpportunity Structure**:
```rust
pub struct CrossChainArbitrageOpportunity {
    pub asset: String,
    pub buy_chain: String,
    pub sell_chain: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: i128,
    pub sell_price: i128,
    pub available_amount: i128,
    pub estimated_profit: i128,
    pub confidence_score: i128,
    pub expiry_time: u64,
}
```

**Example**:
```rust
let opportunities = cross_chain_detector.scan_cross_chain_opportunities(
    env, 
    assets, 
    1000000, 
    reflector_oracle_address, 
    uniswap_address
);
```

### calculate_cross_chain_profit

**Description**: Calculates the net profit for a cross-chain arbitrage opportunity after accounting for all fees.

**Signature**:
```rust
pub fn calculate_cross_chain_profit(
    buy_price: i128,
    sell_price: i128,
    amount: i128,
    fees: CrossChainTradingFees,
) -> i128
```

**Parameters**:
- `buy_price`: Purchase price (i128)
- `sell_price`: Selling price (i128)
- `amount`: Trade amount (i128)
- `fees`: CrossChainTradingFees struct containing fee information (CrossChainTradingFees)

**Returns**:
- `i128`: Net profit after fees

**CrossChainTradingFees Structure**:
```rust
pub struct CrossChainTradingFees {
    pub maker_fee_bps: i128,
    pub taker_fee_bps: i128,
    pub withdrawal_fee: i128,
    pub gas_fee: i128,
    pub flash_loan_fee_bps: i128,
    pub cross_chain_fee: i128,
}
```

**Example**:
```rust
let profit = cross_chain_detector.calculate_cross_chain_profit(100000000, 102000000, 10000000000, fees);
```

## Error Codes

### OracleError
- `NetworkError` (1): Network connectivity issues
- `InvalidData` (2): Invalid data provided
- `PriceManipulationDetected` (3): Potential price manipulation detected
- `ContractCallFailed` (4): Failed to call external contract
- `AssetNotSupported` (5): Asset not supported by the oracle

### ExchangeError
- `NetworkError` (1): Network connectivity issues
- `InvalidData` (2): Invalid exchange or trading pair
- `InsufficientLiquidity` (3): Not enough liquidity for the trade

### FlashLoanError
- `InsufficientProfit` (1): Profit below minimum threshold
- `DeadlineExceeded` (2): Trade deadline has passed
- `FlashLoanFailed` (3): Flash loan request failed
- `TradeExecutionFailed` (4): Trade execution failed
- `RepaymentFailed` (5): Flash loan repayment failed
- `InvalidParameters` (6): Invalid trade parameters
- `InsufficientLiquidity` (7): Not enough liquidity for the trade

### RiskError
- `PositionLimitExceeded` (1): Trade size exceeds position limit
- `DrawdownLimitExceeded` (2): Drawdown exceeds threshold
- `InsufficientConfidence` (3): Confidence score below threshold
- `LiquidityRiskTooHigh` (4): Liquidity risk too high
- `InvalidRiskParameters` (5): Invalid risk parameters
- `StopLossTriggered` (6): Stop-loss would be immediately triggered

## Data Types and Scaling

### Price Scaling
All prices are scaled by 10^7 for 7 decimal precision. For example, a price of 1.00 USD would be represented as 10000000.

### Amount Scaling
Asset amounts are scaled according to their native decimal precision:
- AQUA: 7 decimals
- yUSDC: 6 decimals
- EURC: 6 decimals
- BTCLN: 8 decimals
- KALE: 7 decimals

### Basis Points
Percentages are represented in basis points (1/100th of a percent). For example, 1% = 100 basis points.

## Best Practices

1. **Always validate asset addresses** before making oracle calls
2. **Handle errors gracefully** and implement fallback mechanisms
3. **Use TWAP for price validation** to detect potential manipulation
4. **Check liquidity** before executing large trades
5. **Monitor slippage** and adjust trade sizes accordingly
6. **Implement proper risk management** with stop-loss orders
7. **Regularly update supported assets** as new tokens are added to the oracle
8. **Test thoroughly** with real market data before deploying to production