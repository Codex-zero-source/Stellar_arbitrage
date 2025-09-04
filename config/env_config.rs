// Arbitrage DApp Environment Configuration
// This file contains all the environment variables needed for the arbitrage DApp

// Reflector Network Oracle Configuration
pub const REFLECTOR_API_URL: &str = "https://api.reflector.network/data_feed";
pub const REFLECTOR_WS_URL: &str = "wss://ws.reflector.network/price_stream";
// Reflector Network Smart Contract Addresses (Testnet)
pub const REFLECTOR_STELLAR_DEX_CONTRACT: &str = "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"; // Stellar DEX price feeds
pub const REFLECTOR_CROSS_CHAIN_CONTRACT: &str = "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63"; // Cross-chain price feeds

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