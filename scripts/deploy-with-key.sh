#!/bin/bash
# Deployment script for Stellar Arbitrage contracts to Testnet with provided secret key

if [ -z "$1" ]; then
    echo "Usage: deploy-with-key.sh <SECRET_KEY>"
    echo "Please provide the secret key for deployment"
    exit 1
fi

echo "Building contracts..."
cargo build --target wasm32-unknown-unknown --release --features contract

if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

echo "Deploying contract to Stellar Testnet..."

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_arbitrage.wasm \
  --source $1 \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

if [ $? -eq 0 ]; then
    echo "Contract deployed successfully!"
    echo "Remember to update STELLAR_CONTRACT_ID in your .env file with the deployed contract ID"
else
    echo "Deployment failed."
    exit 1
fi