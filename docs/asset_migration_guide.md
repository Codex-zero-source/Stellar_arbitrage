# Asset Migration Guide: Custom to Real Reflector-Tracked Tokens

## Overview

This guide provides detailed instructions for migrating the Stellar Arbitrage Platform from custom simulated assets to real Reflector-tracked tokens. This migration enables genuine arbitrage detection using real market data from the Reflector Oracle.

## Migration Steps

### Step 1: Identify and Remove Custom Assets

#### Assets to Remove
1. All custom-created tokens used for simulation
2. Simulated order book accounts
3. Artificial liquidity pools
4. Mock price feeds

#### Code Areas to Update
1. Asset definition files
2. Trading pair configurations
3. Price feed generators
4. Liquidity simulation modules

### Step 2: Integrate Real Reflector-Tracked Assets

#### Supported Assets
1. **AQUA**
   - Contract ID: CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG
   - Issuer: GCQHNQR2ZRFKD45VGS6EEWGPHPND7DEQFPAVYJ5CQZXYZSHZCCZ5ILHP
   - Decimals: 7
   - Type: Governance token

2. **yUSDC**
   - Contract ID: CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS
   - Issuer: GDDIKAFGVT7VUHV7R6YKCBQZH3VQRZ2Z7ZFQF7UKUZD2EABJ7UBJWZM4
   - Decimals: 6
   - Type: Stablecoin

3. **EURC**
   - Contract ID: CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236
   - Issuer: GBTM4WVMZMZW7ZRUYJZBRKXDWZKWLIPQXRMKJYQZ6WDDZ7FFHRLGBHZJ
   - Decimals: 6
   - Type: Stablecoin

4. **BTCLN**
   - Contract ID: CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR
   - Issuer: GDVMVDHJWMQFZSQHGTKQJ7DMBG7RSTMYVWPUQHEGFHQLBMJRR5PLLF2W
   - Decimals: 8
   - Type: Crypto asset

5. **KALE**
   - Contract ID: CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG
   - Issuer: GARFQB6WUV7NBRWOGWXJ4LQGQE2TQVXBFNW6VUGWSAFUDWKZ6PZKNPRZ
   - Decimals: 7
   - Type: Utility token

### Step 3: Update Contract Code

#### Reflector Oracle Client
1. Replace simulated price functions with real oracle calls
2. Implement all Reflector Oracle functions:
   - `get_price_and_timestamp`
   - `get_twap_price`
   - `get_historical_prices`
   - `get_price_data`
   - `get_supported_assets`
   - `get_oracle_decimals`
   - `get_price_change_percentage`
   - `get_order_book`

#### Arbitrage Detector
1. Update asset lists to use real contract addresses
2. Implement Reflector Oracle client integration
3. Add TWAP-based price validation
4. Enhance arbitrage calculation logic with real market data
5. Add price manipulation detection using historical data

#### Exchange Interface
1. Connect to real Stellar DEX contracts
2. Implement functions to fetch real market prices
3. Add order book data retrieval
4. Implement liquidity analysis

#### Trading Engine
1. Update trading pairs to use real assets
2. Implement real DEX order placement logic
3. Add slippage protection based on actual liquidity
4. Enhance execution validation with real market conditions
5. Update fee calculations for real DEX interactions

#### Risk Management
1. Implement real market volatility analysis
2. Add liquidity-based position sizing
3. Enable dynamic stop-loss based on market conditions
4. Add correlation analysis between assets
5. Implement portfolio risk assessment

### Step 4: Update Backend Services

#### Price Monitoring
1. Replace mock price feeds with Reflector Oracle data
2. Implement WebSocket connections for real-time price updates
3. Add price history tracking and analysis
4. Enable price alert system based on real market movements
5. Add market volatility analysis

#### Arbitrage Detection
1. Update arbitrage algorithms to use real price differences
2. Implement cross-DEX opportunity scanning
3. Add profitability calculations with real trading fees
4. Enable multi-hop arbitrage detection
5. Add market timing analysis

### Step 5: Update Frontend

#### Asset Display
1. Update asset lists to show real tokens with metadata
2. Add real-time price charts using Reflector data
3. Display actual market capitalization and volume
4. Show real trading pairs and liquidity information
5. Add asset performance analytics

#### Trading Interface
1. Update trading pairs selection to real assets
2. Add real order book visualization
3. Display actual slippage estimates
4. Show real-time arbitrage opportunities
5. Add market depth analysis

#### Analytics Dashboard
1. Replace simulated data with real market analytics
2. Add TWAP charts and historical analysis
3. Display real profit/loss from executed trades
4. Show actual market efficiency improvements
5. Add performance benchmarking against market

## Configuration Updates

### Environment Variables
Update your `.env` file with the following configuration:

```env
# Reflector Oracle Configuration
REFLECTOR_ORACLE_ADDRESS=CDHXGW5XPQN34WP3GQZ3QA76ECI7RP3GE4HRASYPTRUJXYDWOTLVMAPK
SUPPORTED_ASSETS=AQUA,yUSDC,EURC,BTCLN,KALE
PRICE_UPDATE_INTERVAL=5000
TWAP_WINDOW=300

# DEX Configuration
DEX_ENDPOINTS=stellar_dex,soroswap,aqua_dex

# Asset-Specific Configuration
AQUA_CONTRACT=CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG
AQUA_DECIMALS=7
AQUA_TYPE=governance_token

yUSDC_CONTRACT=CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS
yUSDC_DECIMALS=6
yUSDC_TYPE=stablecoin

EURC_CONTRACT=CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236
EURC_DECIMALS=6
EURC_TYPE=stablecoin

BTCLN_CONTRACT=CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR
BTCLN_DECIMALS=8
BTCLN_TYPE=crypto_asset

KALE_CONTRACT=CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG
KALE_DECIMALS=7
KALE_TYPE=utility_token
```

## Testing Migration

### Integration Tests
1. Verify Reflector Oracle connectivity and data accuracy
2. Test arbitrage detection with real market conditions
3. Validate trading execution with actual DEX integration
4. Confirm price feeds update correctly and timely
5. Test error handling for oracle data unavailability

### Performance Tests
1. Measure arbitrage detection latency with real data
2. Test system performance under high market volatility
3. Validate flash loan execution speed with real assets
4. Confirm scalability with multiple trading pairs
5. Test WebSocket connection stability for real-time data

### Market Simulation
1. Test arbitrage opportunities during different market conditions
2. Validate profitability calculations with real trading fees
3. Test slippage protection with various liquidity levels
4. Confirm cross-DEX arbitrage execution
5. Validate risk management under real market stress

## Validation Checklist

### Pre-Migration
- [ ] Backup all existing code and configurations
- [ ] Document all custom assets and their usage
- [ ] Identify all code locations that reference custom assets
- [ ] Set up access to Reflector Oracle contracts
- [ ] Configure environment for real asset testing

### Migration Process
- [ ] Update Reflector Oracle Client with real implementations
- [ ] Replace custom assets with real Reflector-tracked tokens
- [ ] Update Arbitrage Detector to use real market data
- [ ] Connect Exchange Interface to real Stellar DEX
- [ ] Update Trading Engine for real DEX interactions
- [ ] Enhance Risk Management with real market analysis
- [ ] Replace mock price feeds with real oracle data
- [ ] Update frontend to display real asset information

### Post-Migration
- [ ] Verify all contract functions work with real assets
- [ ] Test arbitrage detection with real market conditions
- [ ] Validate trading execution with actual DEX integration
- [ ] Confirm price feeds update correctly and timely
- [ ] Test error handling for oracle data unavailability
- [ ] Measure system performance with real data
- [ ] Validate risk management effectiveness
- [ ] Document any issues encountered and their solutions

## Common Issues and Solutions

### Oracle Connectivity Issues
**Problem**: Unable to connect to Reflector Oracle contracts
**Solution**: 
1. Verify contract addresses are correct
2. Check network configuration
3. Ensure proper permissions for contract calls
4. Test connectivity with simple oracle calls

### Asset Not Supported
**Problem**: Reflector Oracle returns "AssetNotSupported" error
**Solution**:
1. Verify asset contract addresses are correct
2. Check that assets are listed in `get_supported_assets`
3. Confirm assets are actively tracked by Reflector Oracle

### Price Data Inconsistencies
**Problem**: Price data from oracle seems incorrect or delayed
**Solution**:
1. Check timestamp of price data
2. Compare with other price sources
3. Verify network connectivity
4. Contact Reflector support if issues persist

### Liquidity Issues
**Problem**: Insufficient liquidity for trades
**Solution**:
1. Check order book data from oracle
2. Adjust trade sizes to match available liquidity
3. Implement better slippage protection
4. Consider alternative trading pairs

### Performance Degradation
**Problem**: System performance worse with real data
**Solution**:
1. Optimize oracle call frequency
2. Implement caching for frequently accessed data
3. Review and optimize arbitrage algorithms
4. Consider parallel processing for multiple assets

## Rollback Plan

If issues are encountered during migration:

1. **Immediate Rollback**:
   - Revert to backup code
   - Restore previous environment configuration
   - Document issues encountered

2. **Partial Rollback**:
   - Keep working components with real assets
   - Revert problematic components to simulation
   - Fix issues incrementally

3. **Issue Resolution**:
   - Identify root cause of issues
   - Develop and test fixes in isolated environment
   - Deploy fixes incrementally
   - Monitor system performance

## Post-Migration Monitoring

### Key Metrics to Monitor
1. Arbitrage detection accuracy
2. Trading execution success rate
3. System performance and latency
4. Oracle data quality and timeliness
5. Risk management effectiveness
6. Profitability of executed trades

### Alerting Thresholds
1. Arbitrage detection latency > 2 seconds
2. Oracle data staleness > 60 seconds
3. Trading execution failure rate > 5%
4. Risk management false positive rate > 10%
5. WebSocket connection uptime < 99%

## Conclusion

This migration from custom simulated assets to real Reflector-tracked tokens represents a significant upgrade to the Stellar Arbitrage Platform. By using real market data, the platform can now identify genuine arbitrage opportunities and execute profitable trades in actual market conditions.

The migration process requires careful planning and execution, with thorough testing at each stage. Following this guide will help ensure a smooth transition to the enhanced platform with real market integration.