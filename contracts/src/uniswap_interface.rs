// Uniswap Interface
// This module provides an interface to interact with Uniswap for cross-chain arbitrage

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, String, Address};

// Import Reflector Oracle Client for cross-contract calls
use crate::reflector_oracle_client::{ReflectorOracleClient, PriceData, OracleError};

#[contracttype]
pub struct UniswapPrice {
    pub price: i128,
    pub timestamp: u64,
    pub liquidity: i128,
}

#[contracterror]
#[derive(Debug)]
pub enum UniswapError {
    NetworkError = 1,
    InvalidData = 2,
    InsufficientLiquidity = 3,
    ContractCallFailed = 4,
}

// New struct for storing Uniswap data in contract storage
#[contracttype]
pub struct UniswapDataKey {
    pub pair: String,
}

#[contract]
pub struct UniswapInterface;

#[contractimpl]
impl UniswapInterface {
    /// Submit Uniswap price data (called by off-chain component)
    /// Maintained for backward compatibility
    pub fn submit_uniswap_price(
        env: Env,
        pair: String,
        price: i128,
        liquidity: i128,
    ) -> Result<(), UniswapError> {
        // Validate inputs
        if price <= 0 {
            return Err(UniswapError::InvalidData);
        }
        
        if liquidity <= 0 {
            return Err(UniswapError::InsufficientLiquidity);
        }
        
        // Create storage key
        let key = UniswapDataKey {
            pair: pair.clone(),
        };
        
        // Create Uniswap price data
        let uniswap_price = UniswapPrice {
            price,
            timestamp: env.ledger().timestamp(),
            liquidity,
        };
        
        // Store the Uniswap price data in the contract's storage
        env.storage().persistent().set(&key, &uniswap_price);
        
        Ok(())
    }
    
    /// Submit liquidity data (called by off-chain component)
    /// Maintained for backward compatibility
    pub fn submit_liquidity(
        env: Env,
        pair: String,
        liquidity: i128,
    ) -> Result<(), UniswapError> {
        // Validate inputs
        if liquidity <= 0 {
            return Err(UniswapError::InsufficientLiquidity);
        }
        
        // Create storage key
        let key = UniswapDataKey {
            pair: pair.clone(),
        };
        
        // Try to get existing price data
        if let Some(mut uniswap_price) = env.storage().persistent().get(&key) {
            // Update liquidity while keeping existing price
            uniswap_price.liquidity = liquidity;
            uniswap_price.timestamp = env.ledger().timestamp();
            
            // Store the updated Uniswap price data
            env.storage().persistent().set(&key, &uniswap_price);
        } else {
            // No existing price data, create new entry with zero price
            let uniswap_price = UniswapPrice {
                price: 0,
                timestamp: env.ledger().timestamp(),
                liquidity,
            };
            
            // Store the Uniswap price data
            env.storage().persistent().set(&key, &uniswap_price);
        }
        
        Ok(())
    }

    /// Get current market price directly from Reflector Network cross-chain contract
    pub fn get_uniswap_price_direct(
        env: Env,
        pair: String,
    ) -> Result<UniswapPrice, UniswapError> {
        // Call Reflector Oracle Client to get price directly from Reflector's cross-chain contract
        // For cross-chain assets, we use the cross-chain Reflector contract
        let asset = Self::format_pair_for_reflector(&env, pair.clone());
        let exchange = String::from_str(&env, "Uniswap");
        
        match ReflectorOracleClient::fetch_latest_price_direct(env.clone(), asset, exchange) {
            Ok(price_data) => {
                Ok(UniswapPrice {
                    price: price_data.price,
                    timestamp: price_data.timestamp,
                    liquidity: price_data.volume_24h, // Use volume as proxy for liquidity
                })
            }
            Err(_) => {
                // Fallback to cached version
                Self::get_uniswap_price(env, pair)
            }
        }
    }

    /// Get current market price from Uniswap (cached version)
    pub fn get_uniswap_price(
        env: Env,
        pair: String,
    ) -> Result<UniswapPrice, UniswapError> {
        // Create storage key to look up the Uniswap data
        let key = UniswapDataKey {
            pair,
        };
        
        // Try to get the Uniswap price data from storage
        if let Some(uniswap_price) = env.storage().persistent().get(&key) {
            // Validate that the data is not too old (older than 60 seconds)
            let current_time = env.ledger().timestamp();
            if current_time > uniswap_price.timestamp && (current_time - uniswap_price.timestamp) > 60 {
                return Err(UniswapError::InvalidData); // Data is too old
            }
            
            // Validate that we have a valid price
            if uniswap_price.price <= 0 {
                return Err(UniswapError::InvalidData);
            }
            
            Ok(uniswap_price)
        } else {
            // No Uniswap data found for this pair
            Err(UniswapError::InvalidData)
        }
    }

    /// Fetch liquidity data directly from Reflector Network contract
    pub fn get_liquidity_direct(
        env: Env,
        pair: String,
    ) -> Result<i128, UniswapError> {
        // Get price data which includes liquidity information
        let uniswap_price = Self::get_uniswap_price_direct(env, pair)?;
        Ok(uniswap_price.liquidity)
    }

    /// Fetch liquidity data for a trading pair (cached version)
    pub fn get_liquidity(
        env: Env,
        pair: String,
    ) -> Result<i128, UniswapError> {
        // Create storage key to look up the Uniswap data
        let key = UniswapDataKey {
            pair,
        };
        
        // Try to get the Uniswap price data from storage
        if let Some(uniswap_price) = env.storage().persistent().get(&key) {
            // Validate that the data is not too old (older than 60 seconds)
            let current_time = env.ledger().timestamp();
            if current_time > uniswap_price.timestamp && (current_time - uniswap_price.timestamp) > 60 {
                return Err(UniswapError::InvalidData); // Data is too old
            }
            
            Ok(uniswap_price.liquidity)
        } else {
            // No Uniswap data found for this pair
            Err(UniswapError::InvalidData)
        }
    }
    
    /// Helper function to format pair for Reflector contract
    fn format_pair_for_reflector(env: &Env, pair: String) -> String {
        // Convert "ETH/USD" to "ETH-USD" format for Reflector
        let bytes = pair.to_bytes();
        let mut formatted_bytes = Vec::<u8>::new(env);
        
        for byte in bytes.iter() {
            if byte == b'/' {
                formatted_bytes.push_back(b'-');
            } else {
                formatted_bytes.push_back(byte);
            }
        }
        
        String::from_bytes(env, &formatted_bytes.to_array())
    }
}

// Unit tests for Uniswap Interface
#[cfg(test)]
mod test_uniswap_interface {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_submit_and_get_market_price() {
        let env = Env::default();
        let contract_id = env.register(UniswapInterface, ());
        let client = UniswapInterfaceClient::new(&env, &contract_id);
        
        // Submit Uniswap price data
        let submit_result = client.submit_uniswap_price(
            &String::from_str(&env, "XLM/ETH"),
            &100000000, // 1.00 ETH
            &1000000000000, // Liquidity
        );
        assert!(submit_result.is_ok());
        
        // Get Uniswap price data
        let result = client.get_uniswap_price(&String::from_str(&env, "XLM/ETH"));
        assert!(result.price > 0);
        assert!(result.liquidity > 0);
    }

    #[test]
    fn test_submit_and_get_liquidity() {
        let env = Env::default();
        let contract_id = env.register(UniswapInterface, ());
        let client = UniswapInterfaceClient::new(&env, &contract_id);
        
        // Submit liquidity data
        let submit_result = client.submit_liquidity(
            &String::from_str(&env, "XLM/ETH"),
            &1000000000000, // Liquidity
        );
        assert!(submit_result.is_ok());
        
        // Get liquidity data
        let result = client.get_liquidity(&String::from_str(&env, "XLM/ETH"));
        assert!(result > 0);
    }
}