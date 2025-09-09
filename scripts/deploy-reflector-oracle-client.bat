@echo off
REM Deployment script for Reflector Oracle Client contract to Testnet

echo Building Reflector Oracle Client contract...
cd /d C:\Users\user\Hackathon\Arbitrage\contracts\reflector_oracle_client
stellar contract build

if %errorlevel% neq 0 (
    echo Build failed. Exiting.
    exit /b 1
)

echo Deploying Reflector Oracle Client contract to Stellar Testnet...

REM Use the first keypair from the keypairs.json file
set SECRET_KEY=SB2JQT3NZV3KJNZ3ONJZJFS2ZY6RMD5RXDNASIZGOCCMR4WALNASD3GK

stellar contract deploy ^
  --wasm ..\target\wasm32v1-none\release\reflector_oracle_client.wasm ^
  --source %SECRET_KEY% ^
  --rpc-url https://soroban-testnet.stellar.org ^
  --network-passphrase "Test SDF Network ; September 2015"

if %errorlevel% equ 0 (
    echo Reflector Oracle Client contract deployed successfully!
    echo Remember to update REFLECTOR_ORACLE_CONTRACT_ID in your .env file with the deployed contract ID
) else (
    echo Deployment failed.
    exit /b 1
)