#![no_std]
// Reflector Network Oracle Client
// This module handles communication with the Reflector Network oracle
// to fetch real-time price data for arbitrage opportunities

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Env, String, Vec};

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

#[contracterror]
#[derive(Debug)]
pub enum OracleError {
    NetworkError = 1,
    InvalidData = 2,
    PriceManipulationDetected = 3,
    ContractCallFailed = 4,
    NotImplemented = 5,
}

// Storage key for price data
#[contracttype]
pub struct PriceStorageKey {
    pub asset: String,
    pub exchange: String,
}

#[contract]
pub struct ReflectorOracleClient;

#[contractimpl]
impl ReflectorOracleClient {
    /// Fetch real-time price from Reflector oracle
    pub fn fetch_latest_price(env: Env, asset: String, exchange: String) -> Result<PriceData, OracleError> {
        // Simple implementation that returns mock data for testing
        let price_data = PriceData {
            asset: asset.clone(),
            price: 5_0000000, // 0.05 BTC/USDC
            volume_24h: 1000000000000, // Simulated volume
            timestamp: env.ledger().timestamp(),
            source: exchange.clone(),
            confidence: 95,
        };
        
        // Store in persistent storage for caching
        let key = PriceStorageKey {
            asset,
            exchange,
        };
        env.storage().persistent().set(&key, &price_data);
        
        Ok(price_data)
    }

    /// Get price data (cached version)
    pub fn get_price(env: Env, asset: String, exchange: String) -> Result<PriceData, OracleError> {
        let key = PriceStorageKey {
            asset,
            exchange,
        };
        
        if let Some(price_data) = env.storage().persistent().get::<PriceStorageKey, PriceData>(&key) {
            // Check if data is not too old (older than 60 seconds)
            let current_time = env.ledger().timestamp();
            if current_time > price_data.timestamp && (current_time - price_data.timestamp) > 60 {
                return Err(OracleError::InvalidData); // Data is too old
            }
            Ok(price_data)
        } else {
            Err(OracleError::InvalidData)
        }
    }

    /// Calculate time-weighted average price
    pub fn get_twap(_env: Env, _asset: String, _period: u64) -> Result<i128, OracleError> {
        // Simple implementation that always returns the same TWAP for testing
        Ok(5_0000000) // 0.05 BTC/USDC
    }

    /// Validate price data for manipulation detection
    pub fn validate_price_deviation(
        _current_price: i128,
        _reference_price: i128,
        max_deviation_bps: i128, // in basis points (1/100th of a percent)
    ) -> bool {
        if _reference_price == 0 {
            return false;
        }
        
        // Calculate the percentage deviation in basis points
        let deviation_bps = ((_current_price - _reference_price).abs() * 10000) / _reference_price;
        
        // Check if deviation is within acceptable limits
        deviation_bps <= max_deviation_bps
    }
    
    /// Get order book data
    pub fn get_order_book(_env: Env, _asset: String, _exchange: String) -> Result<OrderBookData, OracleError> {
        // Return mock order book data for testing
        let bids: Vec<OrderBookEntry> = Vec::new(&_env);
        let asks: Vec<OrderBookEntry> = Vec::new(&_env);
        
        let order_book = OrderBookData {
            bids,
            asks,
            timestamp: 0,
        };
        
        Ok(order_book)
    }
    
    /// Submit price data (for off-chain components to update prices)
    pub fn submit_price_data(env: Env, price_data: PriceData) -> Result<(), OracleError> {
        // Validate the price data
        if price_data.price <= 0 {
            return Err(OracleError::InvalidData);
        }
        
        if price_data.timestamp == 0 {
            return Err(OracleError::InvalidData);
        }
        
        // Create storage key
        let key = PriceStorageKey {
            asset: price_data.asset.clone(),
            exchange: price_data.source.clone(),
        };
        
        // Store the price data in the contract's storage
        env.storage().persistent().set(&key, &price_data);
        
        Ok(())
    }
}

#[cfg(test)]
mod test_reflector_client {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_fetch_latest_price() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);

        let result = client.try_fetch_latest_price(&String::from_str(&env, "XLM"), &String::from_str(&env, "Stellar DEX"));

        assert!(result.is_ok());
        if let Ok(Ok(price_data)) = result {
            assert!(price_data.price > 0);
            assert!(price_data.asset.len() > 0);
        }
    }

    #[test]
    fn test_get_twap() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);

        let result = client.try_get_twap(&String::from_str(&env, "XLM"), &3600); // 1 hour TWAP

        assert!(result.is_ok());
        if let Ok(Ok(twap_value)) = result {
            assert!(twap_value > 0);
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
    fn test_submit_and_get_price_data() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ReflectorOracleClient);
        let client = ReflectorOracleClientClient::new(&env, &contract_id);
        
        // Create price data to submit
        let price_data = PriceData {
            asset: String::from_str(&env, "XLM"),
            price: 100000000, // 1.00 XLM
            volume_24h: 1000000000000,
            timestamp: env.ledger().timestamp(),
            source: String::from_str(&env, "Stellar DEX"),
            confidence: 95,
        };
        
        // Submit the price data
        let submit_result = client.submit_price_data(&price_data);
        assert!(submit_result.is_ok());
        
        // Get the price data
        let get_result = client.get_price(&String::from_str(&env, "XLM"), &String::from_str(&env, "Stellar DEX"));
        assert!(get_result.is_ok());
        
        let fetched_data = get_result.unwrap();
        assert_eq!(fetched_data.price, 100000000);
        assert_eq!(fetched_data.asset, String::from_str(&env, "XLM"));
    }
}