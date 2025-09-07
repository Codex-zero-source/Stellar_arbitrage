# Deployment Guide for Stellar Arbitrage Platform

## Overview

This guide provides step-by-step instructions for deploying the upgraded Stellar Arbitrage Platform with real Reflector-tracked assets and genuine market integration.

## Prerequisites

### Software Requirements
1. Rust and Cargo (latest stable version)
2. Stellar CLI tools
3. Git
4. Node.js and npm (for frontend)
5. Docker (optional, for containerized deployment)

### Environment Setup
1. Access to Stellar Testnet or Mainnet
2. Reflector Oracle contract deployed
3. XycLoans flash loan provider contract deployed
4. Stellar DEX contracts deployed
5. Uniswap contracts deployed (for cross-chain functionality)

### Wallet and Accounts
1. Stellar wallet with sufficient XLM for transaction fees
2. Access to asset issuer accounts for real tokens
3. Permissions to deploy contracts on the target network

## Deployment Steps

### Step 1: Environment Configuration

1. Create a `.env` file in the project root with the following configuration:

```env
# Network Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Reflector Oracle Configuration
REFLECTOR_ORACLE_ADDRESS=CDHXGW5XPQN34WP3GQZ3QA76ECI7RP3GE4HRASYPTRUJXYDWOTLVMAPK
SUPPORTED_ASSETS=AQUA,yUSDC,EURC,BTCLN,KALE
PRICE_UPDATE_INTERVAL=5000
TWAP_WINDOW=300

# DEX Configuration
DEX_ENDPOINTS=stellar_dex,soroswap,aqua_dex

# Flash Loan Provider
FLASH_LOAN_PROVIDER=CB75LG2KULDDIFL2BBZHIBXDPXELJJFWRRHKJZ2H5JF7C4DT6GHW4PJQ

# Asset Configuration
AQUA_CONTRACT=CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG
AQUA_ISSUER=GCQHNQR2ZRFKD45VGS6EEWGPHPND7DEQFPAVYJ5CQZXYZSHZCCZ5ILHP
AQUA_DECIMALS=7

yUSDC_CONTRACT=CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS
yUSDC_ISSUER=GDDIKAFGVT7VUHV7R6YKCBQZH3VQRZ2Z7ZFQF7UKUZD2EABJ7UBJWZM4
yUSDC_DECIMALS=6

EURC_CONTRACT=CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236
EURC_ISSUER=GBTM4WVMZMZW7ZRUYJZBRKXDWZKWLIPQXRMKJYQZ6WDDZ7FFHRLGBHZJ
EURC_DECIMALS=6

BTCLN_CONTRACT=CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR
BTCLN_ISSUER=GDVMVDHJWMQFZSQHGTKQJ7DMBG7RSTMYVWPUQHEGFHQLBMJRR5PLLF2W
BTCLN_DECIMALS=8

KALE_CONTRACT=CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG
KALE_ISSUER=GARFQB6WUV7NBRWOGWXJ4LQGQE2TQVXBFNW6VUGWSAFUDWKZ6PZKNPRZ
KALE_DECIMALS=7
```

### Step 2: Build Smart Contracts

1. Navigate to the project root directory:
```bash
cd /path/to/stellar-arbitrage-platform
```

2. Build all contracts:
```bash
# Build Reflector Oracle Client
cd contracts/reflector_oracle_client
cargo build --release

# Build Arbitrage Detector
cd ../arbitrage_detector
cargo build --release

# Build Trading Engine
cd ../trading_engine
cargo build --release

# Return to project root
cd ../..
```

### Step 3: Deploy Contracts

1. Deploy Reflector Oracle Client:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reflector_oracle_client.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

2. Deploy Arbitrage Detector:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/arbitrage_detector.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

3. Deploy Trading Engine:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/trading_engine.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

4. Deploy Risk Management System:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/risk_management_system.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

5. Deploy Cross-Chain Contracts (if needed):
```bash
# Deploy Uniswap Interface
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/uniswap_interface.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"

# Deploy Cross-Chain Arbitrage Detector
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/cross_chain_arbitrage_detector.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

### Step 4: Configure Contract Interactions

1. Update contract addresses in the configuration:
```bash
# Get deployed contract addresses and update .env file
echo "ARBITRAGE_DETECTOR_CONTRACT_ID=DEPLOYED_CONTRACT_ID" >> .env
echo "TRADING_ENGINE_CONTRACT_ID=DEPLOYED_CONTRACT_ID" >> .env
echo "RISK_MANAGEMENT_CONTRACT_ID=DEPLOYED_CONTRACT_ID" >> .env
```

2. Configure contract permissions and cross-contract calls:
```bash
# Set up contract invoker permissions if needed
stellar contract invoke \
  --id CONTRACT_ID \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- \
  set_admin \
  --new_admin ADMIN_ACCOUNT_ID
```

### Step 5: Deploy Backend Services

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Configure backend environment:
```bash
cp .env.example .env
# Update .env with deployed contract addresses and network configuration
```

3. Start backend services:
```bash
npm start
```

### Step 6: Deploy Frontend

1. Install frontend dependencies:
```bash
cd web/dashboard
npm install
```

2. Configure frontend environment:
```bash
cp .env.example .env
# Update .env with backend service URLs and contract addresses
```

3. Build and deploy frontend:
```bash
npm run build
# Deploy build files to web server or hosting platform
```

## Testing Deployment

### Contract Functionality Tests

1. Test Reflector Oracle Client:
```bash
stellar contract invoke \
  --id $REFLECTOR_ORACLE_CONTRACT_ID \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- \
  get_supported_assets
```

2. Test Arbitrage Detector:
```bash
stellar contract invoke \
  --id ARBITRAGE_DETECTOR_CONTRACT_ID \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- \
  scan_opportunities \
  --assets '["CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"]' \
  --min_profit 1000000
```

3. Test Trading Engine:
```bash
stellar contract invoke \
  --id TRADING_ENGINE_CONTRACT_ID \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- \
  get_supported_pairs
```

### Integration Tests

1. Test end-to-end arbitrage detection:
```bash
# Run integration test script
cd scripts
node test_arbitrage_detection.js
```

2. Test flash loan execution:
```bash
# Run flash loan test script
node test_flash_loan.js
```

3. Test risk management:
```bash
# Run risk management test script
node test_risk_management.js
```

## Monitoring and Maintenance

### Health Checks

1. Monitor contract deployments:
```bash
# Check contract status
stellar contract info \
  --id CONTRACT_ID \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

2. Monitor oracle connectivity:
```bash
# Test oracle data retrieval
stellar contract invoke \
  --id REFLECTOR_ORACLE_CONTRACT_ID \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- \
  get_price_and_timestamp \
  --asset_address "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"
```

### Performance Monitoring

1. Monitor arbitrage detection latency:
```bash
# Run performance test script
cd scripts
node performance_test.js
```

2. Monitor WebSocket connections:
```bash
# Check WebSocket server status
curl -i http://localhost:8768/health
```

### Regular Maintenance Tasks

1. Update contract addresses if redeployed:
```bash
# Update configuration files with new contract addresses
sed -i 's/OLD_CONTRACT_ID/NEW_CONTRACT_ID/g' .env
```

2. Rotate API keys and secrets:
```bash
# Update secrets in configuration files
sed -i 's/OLD_SECRET/NEW_SECRET/g' .env
```

3. Apply contract upgrades:
```bash
# Deploy updated contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/updated_contract.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url $STELLAR_SOROBAN_RPC_URL \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
```

## Troubleshooting

### Common Deployment Issues

1. **Insufficient Funds**:
   - Ensure deploying account has sufficient XLM for transaction fees
   - Check account balance: `stellar account info --address ACCOUNT_ID`

2. **Contract Deployment Failures**:
   - Verify WASM files are properly built
   - Check contract size limits (48KB maximum)
   - Ensure network connectivity to RPC endpoint

3. **Oracle Connectivity Issues**:
   - Verify Reflector Oracle contract address
   - Check network configuration
   - Test oracle contract directly with simple calls

4. **Permission Errors**:
   - Verify contract invoker permissions
   - Check account authorization for contract calls
   - Ensure proper contract admin setup

### Recovery Procedures

1. **Rollback Contract Deployment**:
   - Revert to previous contract version
   - Update configuration with previous contract addresses
   - Restart services with previous configuration

2. **Restore from Backup**:
   - Restore database from latest backup
   - Revert configuration files to known good state
   - Redeploy services with restored configuration

3. **Emergency Shutdown**:
   - Stop all trading activities
   - Disable contract invocations
   - Investigate and resolve critical issues
   - Gradually resume operations after verification

## Security Considerations

### Access Control
1. Restrict contract admin access to authorized accounts only
2. Use multisig wallets for critical contract operations
3. Regularly rotate API keys and secrets
4. Implement rate limiting for contract invocations

### Data Protection
1. Encrypt sensitive configuration data
2. Use secure storage for private keys
3. Implement proper logging without exposing sensitive information
4. Regularly audit access logs and contract invocations

### Network Security
1. Use HTTPS for all external communications
2. Implement proper firewall rules for backend services
3. Regularly update dependencies to address security vulnerabilities
4. Monitor for suspicious network activity

## Scaling Considerations

### Horizontal Scaling
1. Deploy multiple instances of backend services
2. Use load balancers for distributing requests
3. Implement caching for frequently accessed data
4. Use message queues for handling high-volume operations

### Performance Optimization
1. Optimize contract code for gas efficiency
2. Implement efficient data structures and algorithms
3. Use indexing for faster data retrieval
4. Cache oracle data to reduce external calls

### Resource Management
1. Monitor system resource usage (CPU, memory, disk)
2. Implement auto-scaling based on demand
3. Use efficient database queries and indexing
4. Regularly clean up temporary data and logs

## Conclusion

This deployment guide provides a comprehensive approach to deploying the upgraded Stellar Arbitrage Platform with real Reflector-tracked assets. Following these steps will ensure a successful deployment with proper monitoring and maintenance procedures in place.

Regular monitoring and maintenance are crucial for the continued success of the platform. Always test changes in a staging environment before applying them to production, and maintain regular backups of all critical data and configurations.