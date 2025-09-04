# Deployment Scripts

This directory contains scripts for deploying the Stellar Arbitrage contracts to the Stellar Testnet.

## Prerequisites

1. Rust and Cargo installed
2. wasm32-unknown-unknown target installed:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
3. Stellar account with testnet XLM (get from https://laboratory.stellar.org/#account-creator?network=test)
4. Soroban CLI installed (if possible)

## Deployment Scripts

### deploy-testnet.bat / deploy-testnet.sh
These are the original deployment scripts that require setting the SECRET_KEY environment variable.

### deploy-with-key.bat / deploy-with-key.sh
These scripts accept the secret key as a command-line parameter for deployment.

Usage:
```bash
# Windows
deploy-with-key.bat <SECRET_KEY>

# Unix/Linux/Mac
./deploy-with-key.sh <SECRET_KEY>
```

Example:
```bash
# Windows
deploy-with-key.bat SD7XJF45O3P33Z7YJZT5P3P33Z7YJZT5P3P33Z7YJZT5P3P33Z7YJZT5

# Unix/Linux/Mac
./deploy-with-key.sh SD7XJF45O3P33Z7YJZT5P3P33Z7YJZT5P3P33Z7YJZT5P3P33Z7YJZT5
```

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
cargo build --target wasm32-unknown-unknown --release --features contract
```

The compiled WASM file will be located at:
`target/wasm32-unknown-unknown/release/stellar_arbitrage.wasm`

## Testing

Run the unit tests to verify functionality:

```bash
cargo test
```

Note: Some tests have been temporarily disabled due to client method signature issues. These will be fixed in a future update.

## Known Issues

1. Some unit tests are temporarily disabled due to client method signature issues
2. Soroban CLI installation may have network issues on Windows
3. The validation logic for flash loan arbitrage may need adjustment

## Next Steps

1. Install Soroban CLI when network issues are resolved
2. Re-enable and fix disabled unit tests
3. Test deployment on Stellar Testnet
4. Verify contract functionality with actual flash loans from XycLoans