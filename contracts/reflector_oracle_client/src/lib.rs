#![no_std]
// Reflector Network Oracle Client
// This module handles communication with the Reflector Network oracle
// to fetch real-time price data for arbitrage opportunities

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Env, String, Vec, BytesN, Address, Map};

#[contracttype]
#[derive(Clone)]
pub struct ReflectorPriceData {
    pub price: i128,
    pub timestamp: u64,
    pub confidence: u32,
    pub volume_24h: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct PriceData {
    pub asset: String,
    pub price: i128,
    pub volume_24h: i128,
    pub timestamp: u64,
    pub source: String,
    pub confidence: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct OrderBookEntry {
    pub price: i128,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct OrderBookData {
    pub bids: Vec<OrderBookEntry>,
    pub asks: Vec<OrderBookEntry>,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct HistoricalPriceData {
    pub prices: Vec<PriceData>,
    pub twap: i128,
    pub price_change_percentage: i128,
}

#[contracterror]
#[derive(Debug)]
pub enum OracleError {
    NetworkError = 1,
    InvalidData = 2,
    PriceManipulationDetected = 3,
    ContractCallFailed = 4,
    AssetNotSupported = 5,
}

// Storage key for price data
#[contracttype]
pub struct PriceStorageKey {
    pub asset: String,
    pub exchange: String,
}

// Interface for Reflector Oracle contract
#[contractclient(name = "ReflectorOracle")]
pub trait ReflectorOracleInterface {
    fn get_price(&self, asset: String) -> (i128, u64);
    fn get_twap(&self, asset: String, window: u64) -> i128;
    fn get_historical_prices(&self, asset: String, count: u32) -> Vec<(i128, u64)>;
    fn get_supported_assets(&self) -> Vec<String>;
    fn get_decimals(&self) -> u32;
    fn get_price_change(&self, asset: String, period: u64) -> i128;
    fn get_order_book(&self, asset: String, depth: u32) -> (Vec<(i128, i128)>, Vec<(i128, i128)>);
}

#[contract]
pub struct ReflectorOracleClient;

#[contractimpl]
impl ReflectorOracleClient {
    /// Fetch real-time price from Reflector oracle
    pub fn get_price_and_timestamp(env: Env, asset_address: String) -> Result<(i128, u64), OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Call the Reflector Oracle contract to get price and timestamp
        match oracle_client.try_get_price(&asset_address) {
            Ok((price, timestamp)) => Ok((price, timestamp)),
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Calculate time-weighted average price
    pub fn get_twap_price(env: Env, asset_address: String, records: u32) -> Result<i128, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Calculate time window based on records (assuming 60 seconds per record)
        let time_window = records as u64 * 60;
        
        // Call the Reflector Oracle contract to get TWAP
        match oracle_client.try_get_twap(&asset_address, &time_window) {
            Ok(twap) => Ok(twap),
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get historical prices
    pub fn get_historical_prices(env: Env, asset_address: String, count: u32) -> Result<Vec<PriceData>, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Call the Reflector Oracle contract to get historical prices
        match oracle_client.try_get_historical_prices(&asset_address, &count) {
            Ok(price_data) => {
                let mut prices: Vec<PriceData> = Vec::new(&env);
                let current_timestamp = env.ledger().timestamp();
                
                for (price, timestamp) in price_data.iter() {
                    let price_data = PriceData {
                        asset: asset_address.clone(),
                        price: *price,
                        volume_24h: 0, // Volume data would need separate call
                        timestamp: *timestamp,
                        source: String::from_str(&env, "Reflector Oracle"),
                        confidence: 95,
                    };
                    prices.push_back(price_data);
                }
                
                Ok(prices)
            },
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get comprehensive price data
    pub fn get_price_data(env: Env, asset_address: String) -> Result<PriceData, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Call the Reflector Oracle contract to get price and timestamp
        match oracle_client.try_get_price(&asset_address) {
            Ok((price, timestamp)) => {
                let price_data = PriceData {
                    asset: asset_address.clone(),
                    price,
                    volume_24h: 0, // Volume data would need separate call
                    timestamp,
                    source: String::from_str(&env, "Reflector Oracle"),
                    confidence: 95,
                };
                
                Ok(price_data)
            },
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get list of supported assets
    pub fn get_supported_assets(env: Env) -> Result<Vec<String>, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Call the Reflector Oracle contract to get supported assets
        match oracle_client.try_get_supported_assets() {
            Ok(assets) => Ok(assets),
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get oracle decimals
    pub fn get_oracle_decimals(env: Env) -> Result<u32, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Call the Reflector Oracle contract to get decimals
        match oracle_client.try_get_decimals() {
            Ok(decimals) => Ok(decimals),
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get price change percentage
    pub fn get_price_change_percentage(env: Env, asset_address: String) -> Result<i128, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Calculate period (24 hours in seconds)
        let period = 24 * 60 * 60;
        
        // Call the Reflector Oracle contract to get price change
        match oracle_client.try_get_price_change(&asset_address, &period) {
            Ok(change) => Ok(change),
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }

    /// Validate price data for manipulation detection
    pub fn validate_price_deviation(
        current_price: i128,
        reference_price: i128,
        max_deviation_bps: i128, // in basis points (1/100th of a percent)
    ) -> bool {
        if reference_price == 0 {
            return false;
        }
        
        // Calculate the percentage deviation in basis points
        let deviation_bps = ((current_price - reference_price).abs() * 10000) / reference_price;
        
        // Check if deviation is within acceptable limits
        deviation_bps <= max_deviation_bps
    }
    
    /// Get order book data
    pub fn get_order_book(env: Env, asset_address: String, _exchange: String) -> Result<OrderBookData, OracleError> {
        // Get the Reflector Oracle contract address from environment
        let oracle_address_str = env
            .invoker()
            .unwrap_or_else(|| panic!("Oracle address not found in environment"));
        let oracle_address = Address::from_string(&oracle_address_str);
        
        // Create client for Reflector Oracle contract
        let oracle_client = ReflectorOracleClient::new(&env, &oracle_address);
        
        // Call the Reflector Oracle contract to get order book data
        match oracle_client.try_get_order_book(&asset_address, &10) { // Get 10 levels of depth
            Ok((bids, asks)) => {
                let mut bid_entries: Vec<OrderBookEntry> = Vec::new(&env);
                let mut ask_entries: Vec<OrderBookEntry> = Vec::new(&env);
                
                // Convert bids
                for (price, amount) in bids.iter() {
                    let entry = OrderBookEntry {
                        price: *price,
                        amount: *amount,
                    };
                    bid_entries.push_back(entry);
                }
                
                // Convert asks
                for (price, amount) in asks.iter() {
                    let entry = OrderBookEntry {
                        price: *price,
                        amount: *amount,
                    };
                    ask_entries.push_back(entry);
                }
                
                let order_book = OrderBookData {
                    bids: bid_entries,
                    asks: ask_entries,
                    timestamp: env.ledger().timestamp(),
                };
                
                Ok(order_book)
            },
            Err(_) => Err(OracleError::ContractCallFailed),
        }
    }
    
    /// Helper function to check if an asset is supported
    fn is_asset_supported(asset_address: &String) -> bool {
        let supported_assets = [
            "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG", // AQUA
            "CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS", // yUSDC
            "CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236", // EURC
            "CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR", // BTCLN
            "CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG", // KALE
        ];
        
        for supported_asset in supported_assets.iter() {
            if asset_address == supported_asset {
                return true;
            }
        }
        false
    }
}

#[cfg(test)]
mod test_reflector_client {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_get_price_and_timestamp() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);

        let result = client.try_get_price_and_timestamp(&String::from_str(&env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG")); // AQUA

        assert!(result.is_ok());
        if let Ok(Ok((price, timestamp))) = result {
            assert!(price > 0);
            assert!(timestamp > 0);
        }
    }

    #[test]
    fn test_get_twap_price() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);

        let result = client.try_get_twap_price(&String::from_str(&env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"), &30); // 30 records

        assert!(result.is_ok());
        if let Ok(Ok(twap_value)) = result {
            assert!(twap_value > 0);
        }
    }

    #[test]
    fn test_get_supported_assets() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);

        let result = client.try_get_supported_assets();
        
        assert!(result.is_ok());
        if let Ok(Ok(assets)) = result {
            assert_eq!(assets.len(), 5); // We should have 5 supported assets
        }
    }

    #[test]
    fn test_validate_price_deviation() {
        let is_valid = ReflectorOracleClient::validate_price_deviation(100000000, 101000000, 500); // 5% max deviation (500 bps)
        assert_eq!(is_valid, true);
        
        let is_valid2 = ReflectorOracleClient::validate_price_deviation(100000000, 50000000, 500); // 50% deviation
        assert_eq!(is_valid2, false);
    }
    
    #[test]
    fn test_get_order_book() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);
        
        let result = client.try_get_order_book(
            &String::from_str(&env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"), // AQUA
            &String::from_str(&env, "Stellar DEX")
        );
        
        assert!(result.is_ok());
        if let Ok(Ok(order_book)) = result {
            assert!(order_book.bids.len() > 0);
            assert!(order_book.asks.len() > 0);
            assert!(order_book.timestamp > 0);
        }
    }
}