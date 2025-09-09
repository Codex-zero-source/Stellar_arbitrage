#!/bin/bash
# Deployment script for Reflector Oracle Client contract to Testnet

echo "Building Reflector Oracle Client contract..."
cd /c/Users/user/Hackathon/Arbitrage/contracts/reflector_oracle_client
stellar contract build

if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

echo "Deploying Reflector Oracle Client contract to Stellar Testnet..."

# Use the first keypair from the keypairs.json file
export SECRET_KEY="SB2JQT3NZV3KJNZ3ONJZJFS2ZY6RMD5RXDNASIZGOCCMR4WALNASD3GK"

stellar contract deploy \
  --wasm ../target/wasm32v1-none/release/reflector_oracle_client.wasm \
  --source $SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

if [ $? -eq 0 ]; then
    echo "Reflector Oracle Client contract deployed successfully!"
    echo "Remember to update REFLECTOR_ORACLE_CONTRACT_ID in your .env file with the deployed contract ID"
else
    echo "Deployment failed."
    exit 1
fi