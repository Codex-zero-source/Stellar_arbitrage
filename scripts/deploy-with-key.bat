@echo off
REM Deployment script for Stellar Arbitrage contracts to Testnet with provided secret key

if "%1"=="" (
    echo Usage: deploy-with-key.bat ^<SECRET_KEY^>
    echo Please provide the secret key for deployment
    exit /b 1
)

echo Building contracts...
cargo build --target wasm32-unknown-unknown --release --features contract

if %errorlevel% neq 0 (
    echo Build failed. Exiting.
    exit /b 1
)

echo Deploying contract to Stellar Testnet...

soroban contract deploy ^
  --wasm target/wasm32-unknown-unknown/release/stellar_arbitrage.wasm ^
  --source %1 ^
  --rpc-url https://soroban-testnet.stellar.org ^
  --network-passphrase "Test SDF Network ; September 2015"

if %errorlevel% equ 0 (
    echo Contract deployed successfully!
    echo Remember to update STELLAR_CONTRACT_ID in your .env file with the deployed contract ID
) else (
    echo Deployment failed.
    exit /b 1
)