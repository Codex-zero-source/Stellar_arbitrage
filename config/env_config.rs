// Arbitrage DApp Environment Configuration
// This file contains all the environment variables needed for the arbitrage DApp

// Reflector Network Oracle Configuration
pub const REFLECTOR_ORACLE_ADDRESS: &str = "CDHXGW5XPQN34WP3GQZ3QA76ECI7RP3GE4HRASYPTRUJXYDWOTLVMAPK";
pub const SUPPORTED_ASSETS: &str = "AQUA,yUSDC,EURC,BTCLN,KALE";
pub const DEX_ENDPOINTS: &str = "stellar_dex,soroswap,aqua_dex";
pub const PRICE_UPDATE_INTERVAL: u64 = 5000;
pub const TWAP_WINDOW: u64 = 300;

// Exchange API Keys (for testing purposes)
pub const BINANCE_API_KEY: &str = "your_binance_api_key";
pub const BINANCE_API_SECRET: &str = "your_binance_api_secret";

pub const COINBASE_API_KEY: &str = "your_coinbase_api_key";
pub const COINBASE_API_SECRET: &str = "your_coinbase_api_secret";

pub const KRAKEN_API_KEY: &str = "your_kraken_api_key";
pub const KRAKEN_API_SECRET: &str = "your_kraken_api_secret";

// Stellar Network Configuration
pub const STELLAR_TESTNET_RPC: &str = "https://soroban-testnet.stellar.org";
pub const STELLAR_CONTRACT_ID: &str = "your_stellar_contract_id";

// Trading Parameters
pub const GAS_PRICE_THRESHOLD: u64 = 100000;
pub const MIN_PROFIT_THRESHOLD_BPS: u64 = 50; // 0.5% in basis points
pub const SLIPPAGE_TOLERANCE_BPS: u64 = 25; // 0.25% in basis points
pub const EXECUTION_TIMEOUT_SECS: u64 = 30;

// Flash Loan Configuration
pub const FLASH_LOAN_PROVIDER: &str = "your_flash_loan_provider_address";
pub const ORACLE_UPDATE_INTERVAL_SECS: u64 = 1;
pub const ORACLE_FAIL_OVER_SOURCES: u64 = 3;

// Asset Configuration
pub mod assets {
    pub struct Asset {
        pub symbol: &'static str,
        pub contract_id: &'static str,
        pub issuer: &'static str,
        pub decimals: u32,
        pub asset_type: &'static str,
    }

    pub const AQUA: Asset = Asset {
        symbol: "AQUA",
        contract_id: "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG",
        issuer: "GCQHNQR2ZRFKD45VGS6EEWGPHPND7DEQFPAVYJ5CQZXYZSHZCCZ5ILHP",
        decimals: 7,
        asset_type: "governance_token",
    };

    pub const YUSDC: Asset = Asset {
        symbol: "yUSDC",
        contract_id: "CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS",
        issuer: "GDDIKAFGVT7VUHV7R6YKCBQZH3VQRZ2Z7ZFQF7UKUZD2EABJ7UBJWZM4",
        decimals: 6,
        asset_type: "stablecoin",
    };

    pub const EURC: Asset = Asset {
        symbol: "EURC",
        contract_id: "CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236",
        issuer: "GBTM4WVMZMZW7ZRUYJZBRKXDWZKWLIPQXRMKJYQZ6WDDZ7FFHRLGBHZJ",
        decimals: 6,
        asset_type: "stablecoin",
    };

    pub const BTCLN: Asset = Asset {
        symbol: "BTCLN",
        contract_id: "CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR",
        issuer: "GDVMVDHJWMQFZSQHGTKQJ7DMBG7RSTMYVWPUQHEGFHQLBMJRR5PLLF2W",
        decimals: 8,
        asset_type: "crypto_asset",
    };

    pub const KALE: Asset = Asset {
        symbol: "KALE",
        contract_id: "CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG",
        issuer: "GARFQB6WUV7NBRWOGWXJ4LQGQE2TQVXBFNW6VUGWSAFUDWKZ6PZKNPRZ",
        decimals: 7,
        asset_type: "utility_token",
    };
}
