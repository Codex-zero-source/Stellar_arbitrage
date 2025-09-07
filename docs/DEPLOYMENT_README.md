# Stellar Arbitrage Deployment Guide

This document provides instructions for deploying the Stellar Arbitrage contracts to the Stellar Testnet.

## Prerequisites

1. Rust and Cargo installed
2. wasm32-unknown-unknown target installed:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
3. Stellar account with testnet XLM (get from https://laboratory.stellar.org/#account-creator?network=test)

## Environment Configuration

The project uses environment variables for configuration. Make sure your `.env` file is properly configured:

```env
# Key variables that need to be set:
STELLAR_TESTNET_RPC=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
FLASH_LOAN_PROVIDER=CB75LG2KULDDIFL2BBZHIBXDPXELJJFWRRHKJZ2H5JF7C4DT6GHW4PJQ
```

## Build Process

To build the contracts for deployment:

```bash
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM file will be located at:
`target/wasm32-unknown-unknown/release/stellar_arbitrage.wasm`

## Deployment

Once the Soroban CLI is installed, you can deploy the contract:

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_arbitrage.wasm \
  --source $SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

## Post-Deployment

After deployment, update your `.env` file with the deployed contract ID:

```env
STELLAR_CONTRACT_ID= # The ID returned by the deployment command
```

## Testing

Run the unit tests to verify functionality:

```bash
cargo test
```

Note: Some tests have been temporarily disabled due to client method signature issues. These will be fixed in a future update.

## Known Issues

1. Some unit tests are temporarily disabled due to client method signature issues
2. Soroban CLI installation may have network issues
3. The validation logic for flash loan arbitrage may need adjustment

## Next Steps

1. Install Soroban CLI when network issues are resolved
2. Re-enable and fix disabled unit tests
3. Test deployment on Stellar Testnet
4. Verify contract functionality with actual flash loans from XycLoans