# Stellar Arbitrage Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Stellar Arbitrage smart contracts to the Stellar Testnet.

## Prerequisites

1. **Stellar Account**: You need a Stellar account with testnet XLM
   - Create an account using the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
   - Fund your account with testnet XLM from the friendbot

2. **Secret Key**: You need the secret key (starting with 'S') for your Stellar account

3. **Rust Toolchain**: Ensure you have Rust installed with the wasm32 target
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

## Deployment Steps

### 1. Verify the WASM File

Ensure the contract has been compiled:
```bash
cd c:\Users\user\Hackathon\Arbitrage
dir target\wasm32-unknown-unknown\release\stellar_arbitrage.wasm
```

The file should be approximately 50-60KB in size.

### 2. Deploy Using the New Script

Use the new deployment script that accepts the secret key as a parameter:

**On Windows:**
```cmd
scripts\deploy-with-key.bat YOUR_SECRET_KEY
```

**On Unix/Linux/Mac:**
```bash
./scripts/deploy-with-key.sh YOUR_SECRET_KEY
```

### 3. Example Deployment

```cmd
scripts\deploy-with-key.bat SD7XJF45O3P33Z7YJZT5P3P33Z7YJZT5P3P33Z7YJZT5P3P33Z7YJZT5
```

### 4. Successful Deployment Output

If successful, you'll see output similar to:
```
Building contracts...
...
Deploying contract to Stellar Testnet...
...
Contract deployed successfully!
Remember to update STELLAR_CONTRACT_ID in your .env file with the deployed contract ID
```

### 5. Update Environment Configuration

After deployment, update your `.env` file with the deployed contract ID:
```env
STELLAR_CONTRACT_ID=CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM
```

## Troubleshooting

### Soroban CLI Not Found

If you get an error that `soroban` is not recognized, you may need to install the Soroban CLI:
```bash
cargo install --locked soroban-cli
```

Note: This may have issues on Windows with the GNU toolchain.

### Build Issues

If you encounter build issues, try:
```bash
cargo clean
cargo build --target wasm32-unknown-unknown --release --features contract
```

### Network Issues

If you encounter network issues, verify the RPC endpoint is accessible:
```bash
curl https://soroban-testnet.stellar.org
```

## Post-Deployment Verification

1. Update your `.env` file with the new contract ID
2. Test contract invocation using the Soroban CLI
3. Verify the contract is working with the off-chain components

## Security Considerations

1. **Never share your secret key** - Keep it secure and never commit it to version control
2. **Use testnet for development** - Only deploy to mainnet with thoroughly tested contracts
3. **Verify contract functionality** - Test all functions before using with real funds

## Next Steps

1. Configure the off-chain monitoring components
2. Test arbitrage detection with real price data
3. Verify flash loan integration
4. Test trading execution with small amounts