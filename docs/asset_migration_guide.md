# Asset Migration Guide

## Overview
This document describes the migration from custom simulated assets to real Reflector Oracle tracked assets in the Stellar Arbitrage Platform.

## Real Assets Configuration

The following real assets are now used in the platform:

| Asset Code | Issuer Address                                       | Description              |
|------------|------------------------------------------------------|--------------------------|
| AQUA       | CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG | Aquarius Token           |
| yUSDC      | CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS | Yield USDC               |
| EURC       | CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236 | Euro Coin                |
| BTCLN      | CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR | Bitcoin Lightning        |
| KALE       | CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG | Kale Token               |

## Implementation Changes

### Backend Services
- Removed custom asset generation logic
- Updated `assets.py` to establish trustlines for real assets only
- No asset issuance required as these are already live on testnet

### Smart Contracts
- Smart contracts will be updated to work with real asset identifiers
- Oracle integration will use Reflector Oracle for price feeds

## Testing
- Verify trustlines are established for all accounts
- Test transactions with real assets
- Validate contract interactions with real asset addresses

## Configuration
The following environment variables are used:
- `STELLAR_HORIZON_URL`: Horizon endpoint for Stellar interactions
- `STELLAR_NETWORK_PASSPHRASE`: Network passphrase for transaction signing