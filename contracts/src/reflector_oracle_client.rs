// Reflector Network Oracle Client
// This module handles communication with the Reflector Network oracle
// to fetch real-time price data for arbitrage opportunities

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Env, String, Address, Vec, Bytes, BytesN};

// Import Reflector Network contract interface
// Based on SEP-40 standard with additional utility functions
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

#[contracterror]
#[derive(Debug)]
pub enum OracleError {
    NetworkError = 1,
    InvalidData = 2,
    PriceManipulationDetected = 3,
    ContractCallFailed = 4,
}

// New struct for storing price data in the contract storage
#[contracttype]
pub struct PriceStorageKey {
    pub asset: String,
    pub exchange: String,
}

#[contract]
pub struct ReflectorOracleClient;

#[contractimpl]
impl ReflectorOracleClient {
    /// Submit real-time price data from Reflector oracle (called by off-chain component)
    /// Maintained for backward compatibility
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
    
    /// Fetch real-time price directly from Reflector Network smart contract
    pub fn fetch_latest_price_direct(env: Env, asset: String, exchange: String) -> Result<PriceData, OracleError> {
        // Determine which Reflector contract to call based on exchange
        let reflector_contract_address = if exchange == String::from_str(&env, "Stellar DEX") {
            // Use Reflector's Stellar DEX contract
            Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"))
        } else {
            // Use Reflector's cross-chain contract for other exchanges
            Address::from_string(&String::from_str(&env, "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63"))
        };
        
        // Format the asset for Reflector contract (e.g., "XLM/USD")
        let formatted_asset = Self::format_asset_for_reflector(&env, asset.clone());
        
        // Call the Reflector contract's get_price method
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_address);
        
        match reflector_client.try_get_price(&formatted_asset) {
            Ok(reflector_price_data) => {
                // Convert Reflector's price data to our format
                let price_data = PriceData {
                    asset: asset.clone(),
                    price: reflector_price_data.price,
                    volume_24h: reflector_price_data.volume_24h,
                    timestamp: reflector_price_data.timestamp,
                    source: exchange.clone(),
                    confidence: reflector_price_data.confidence as i128,
                };
                
                // Store in our cache for faster access
                let key = PriceStorageKey {
                    asset: asset.clone(),
                    exchange: exchange.clone(),
                };
                env.storage().persistent().set(&key, &price_data);
                
                Ok(price_data)
            }
            Err(_) => {
                // If direct call fails, try to get from our cache
                Self::fetch_latest_price(env, asset, exchange)
            }
        }
    }
    
    /// Fetch real-time price from Reflector oracle (cached version)
    pub fn fetch_latest_price(env: Env, asset: String, exchange: String) -> Result<PriceData, OracleError> {
        // Create storage key to look up the price data
        let key = PriceStorageKey {
            asset: asset.clone(),
            exchange: exchange.clone(),
        };
        
        // Try to get the price data from storage
        if let Some(price_data) = env.storage().persistent().get(&key) {
            // Validate that the data is not too old (older than 60 seconds)
            let current_time = env.ledger().timestamp();
            if current_time > price_data.timestamp && (current_time - price_data.timestamp) > 60 {
                return Err(OracleError::InvalidData); // Data is too old
            }
            
            Ok(price_data)
        } else {
            // No price data found for this asset/exchange pair
            Err(OracleError::InvalidData)
        }
    }

    /// Calculate time-weighted average price directly from Reflector contract
    pub fn get_twap_direct(env: Env, asset: String, period: u64) -> Result<i128, OracleError> {
        // Use Reflector's cross-chain contract for TWAP (has more comprehensive data)
        let reflector_contract_address = Address::from_string(&String::from_str(&env, "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63"));
        
        // Format the asset for Reflector contract
        let formatted_asset = Self::format_asset_for_reflector(&env, asset.clone());
        
        // Call the Reflector contract's get_twap method
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_address);
        
        match reflector_client.try_get_twap(&formatted_asset, &period) {
            Ok(twap_price) => Ok(twap_price),
            Err(_) => {
                // Fallback to cached version
                Self::get_twap(env, asset, period)
            }
        }
    }

    /// Calculate time-weighted average price (cached version)
    pub fn get_twap(env: Env, asset: String, period: u64) -> Result<i128, OracleError> {
        // In a real implementation, TWAP would be calculated from historical data
        // For this implementation, we'll fetch the latest price as a placeholder
        // A full implementation would require storing historical price data
        
        // Get the latest price for the asset (using a default exchange)
        let price_data = Self::fetch_latest_price(env.clone(), asset, String::from_str(&env, "Stellar DEX"))?;
        Ok(price_data.price)
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
    
    /// Helper function to format asset names for Reflector contract
    fn format_asset_for_reflector(env: &Env, asset: String) -> String {
        // For most assets, we'll format as "ASSET/USD" 
        // In a real implementation, this would be more sophisticated
        let mut formatted = asset;
        formatted.push_str(&String::from_str(env, "/USD"));
        formatted
    }
}

// Reflector Network contract client interface
// This would be generated from the Reflector contract's ABI
#[contractclient(name = "ReflectorPriceClient")]
pub trait ReflectorPriceInterface {
    fn get_price(asset: String) -> ReflectorPriceData;
    fn get_twap(asset: String, period: u64) -> i128;
}

// Note: In a real Soroban smart contract, HTTP requests are not directly possible
// The oracle integration works through cross-contract calls to Reflector's smart contracts
// This implementation enables real data integration while maintaining security

// Unit tests for Reflector Oracle Client
#[cfg(test)]
mod test_reflector_client {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_submit_and_fetch_price_data() {
        let env = Env::default();
        let contract_id = env.register(ReflectorOracleClient, ());
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
        
        // Fetch the price data
        let fetch_result = client.fetch_latest_price(&String::from_str(&env, "XLM"), &String::from_str(&env, "Stellar DEX"));
        assert!(fetch_result.is_ok());
        
        let fetched_data = fetch_result.unwrap();
        assert_eq!(fetched_data.price, 100000000);
        assert_eq!(fetched_data.asset, String::from_str(&env, "XLM"));
    }

    #[test]
    fn test_validate_price_deviation() {
        let env = Env::default();
        let contract_id = env.register(ReflectorOracleClient, ());
        let client = ReflectorOracleClientClient::new(&env, &contract_id);
        
        let is_valid = client.validate_price_deviation(&100000000, &101000000, &500); // 5% max deviation (500 bps)
        
        assert_eq!(is_valid, true);
    }
    
    #[test]
    fn test_old_price_data_rejected() {
        let env = Env::default();
        let contract_id = env.register(ReflectorOracleClient, ());
        let client = ReflectorOracleClientClient::new(&env, &contract_id);
        
        // Create old price data (61 seconds old)
        let old_timestamp = env.ledger().timestamp() - 61;
        let price_data = PriceData {
            asset: String::from_str(&env, "XLM"),
            price: 100000000, // 1.00 XLM
            volume_24h: 1000000000000,
            timestamp: old_timestamp,
            source: String::from_str(&env, "Stellar DEX"),
            confidence: 95,
        };
        
        // Submit the old price data
        let submit_result = client.submit_price_data(&price_data);
        assert!(submit_result.is_ok());
        
        // Try to fetch the old price data (should fail)
        let fetch_result = client.fetch_latest_price(&String::from_str(&env, "XLM"), &String::from_str(&env, "Stellar DEX"));
        assert!(fetch_result.is_err());
    }
}