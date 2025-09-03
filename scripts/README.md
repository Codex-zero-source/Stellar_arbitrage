# Deployment and Testing Scripts

This directory contains scripts to help with testing and deploying the Stellar Arbitrage contracts.

## Prerequisites

Before using these scripts, you need to:

1. Install Rust and the wasm32-unknown-unknown target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. Install the Soroban CLI (once network issues are resolved):
   ```bash
   cargo install --locked soroban-cli
   ```

3. Have a Stellar account with testnet XLM funded from the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test).

## Testing Scripts

### Unix/Linux/macOS:
```bash
./scripts/run-tests.sh
```

### Windows:
```cmd
scripts\run-tests.bat
```

## Deployment Scripts

### Unix/Linux/macOS:
```bash
export SECRET_KEY="your_secret_key_here"
./scripts/deploy-testnet.sh
```

### Windows:
```cmd
set SECRET_KEY=your_secret_key_here
scripts\deploy-testnet.bat
```

## Post-Deployment

After deploying the contract, you'll receive a contract ID. Update the `STELLAR_CONTRACT_ID` variable in your `.env` file with this ID.

## Environment Variables

Make sure your `.env` file is properly configured with all required variables before testing or deploying.