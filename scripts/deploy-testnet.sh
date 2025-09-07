#!/bin/bash

# Deployment script for Stellar Arbitrage contracts to Testnet

echo "Building contracts..."
cargo build --target wasm32-unknown-unknown --release

if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

echo "Deploying contract to Stellar Testnet..."

# Note: You'll need to replace the secret key with your own
# and update the contract ID in the .env file after deployment

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_arbitrage.wasm \
  --source $SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

if [ $? -eq 0 ]; then
    echo "Contract deployed successfully!"
    echo "Remember to update STELLAR_CONTRACT_ID in your .env file with the deployed contract ID"
else
    echo "Deployment failed."
    exit 1
fi