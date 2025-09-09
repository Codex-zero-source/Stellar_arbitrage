#!/bin/bash
# Deployment script for Arbitrage Detector contract to Testnet

echo "Building Arbitrage Detector contract..."
cd /c/Users/user/Hackathon/Arbitrage/contracts/arbitrage_detector
stellar contract build

if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

echo "Deploying Arbitrage Detector contract to Stellar Testnet..."

# Use the first keypair from the keypairs.json file
export SECRET_KEY="SB2JQT3NZV3KJNZ3ONJZJFS2ZY6RMD5RXDNASIZGOCCMR4WALNASD3GK"

stellar contract deploy \
  --wasm ../target/wasm32v1-none/release/arbitrage_detector.wasm \
  --source $SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

if [ $? -eq 0 ]; then
    echo "Arbitrage Detector contract deployed successfully!"
    echo "Remember to update ARBITRAGE_DETECTOR_CONTRACT_ID in your .env file with the deployed contract ID"
else
    echo "Deployment failed."
    exit 1
fi