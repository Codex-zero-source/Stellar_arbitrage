// Exchange Interface
// This module provides a unified interface to interact with Stellar DEX

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, Vec, String, Address};

// Import Reflector Oracle Client for cross-contract calls
use crate::reflector_oracle_client::{ReflectorOracleClient, PriceData, OracleError};

#[contracttype]
pub struct MarketPrice {
    pub price: i128,
    pub timestamp: u64,
}

#[contracterror]
pub enum ExchangeError {
    NetworkError = 1,
    InvalidData = 2,
    ContractCallFailed = 3,
}

#[contracttype]
pub struct OrderBook {
    pub bids: Vec<(i128, i128)>, // price, amount
    pub asks: Vec<(i128, i128)>, // price, amount
}

// New struct for storing market data in contract storage
#[contracttype]
pub struct MarketDataKey {
    pub exchange: String,
    pub pair: String,
}

// New struct for storing order book data in contract storage
#[contracttype]
pub struct OrderBookData {
    pub bids: Vec<(i128, i128)>, // price, amount
    pub asks: Vec<(i128, i128)>, // price, amount
    pub timestamp: u64,
}

#[contract]
pub struct ExchangeInterface;

#[contractimpl]
impl ExchangeInterface {
    /// Submit market price data (called by off-chain component)
    /// Maintained for backward compatibility
    pub fn submit_market_price(
        env: Env,
        exchange: String,
        pair: String,
        price: i128,
    ) -> Result<(), ExchangeError> {
        // Validate inputs
        if price <= 0 {
            return Err(ExchangeError::InvalidData);
        }
        
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Create storage key
        let key = MarketDataKey {
            exchange: exchange.clone(),
            pair: pair.clone(),
        };
        
        // Create market price data
        let market_price = MarketPrice {
            price,
            timestamp: env.ledger().timestamp(),
        };
        
        // Store the market price data in the contract's storage
        env.storage().persistent().set(&key, &market_price);
        
        Ok(())
    }
    
    /// Submit order book data (called by off-chain component)
    /// Maintained for backward compatibility
    pub fn submit_order_book(
        env: Env,
        exchange: String,
        pair: String,
        bids: Vec<(i128, i128)>,
        asks: Vec<(i128, i128)>,
    ) -> Result<(), ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Create storage key
        let key = MarketDataKey {
            exchange: exchange.clone(),
            pair: pair.clone(),
        };
        
        // Create order book data
        let order_book_data = OrderBookData {
            bids,
            asks,
            timestamp: env.ledger().timestamp(),
        };
        
        // Store the order book data in the contract's storage
        env.storage().persistent().set(&key, &order_book_data);
        
        Ok(())
    }

    /// Get current market price directly from Reflector Network contract
    pub fn get_market_price_direct(
        env: Env,
        exchange: String,
        pair: String,
    ) -> Result<MarketPrice, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Extract asset from pair (e.g., "XLM/USD" -> "XLM")
        let asset = Self::extract_asset_from_pair(&env, pair.clone());
        
        // Call Reflector Oracle Client to get price directly from Reflector contract
        match ReflectorOracleClient::fetch_latest_price_direct(env.clone(), asset, exchange.clone()) {
            Ok(price_data) => {
                Ok(MarketPrice {
                    price: price_data.price,
                    timestamp: price_data.timestamp,
                })
            }
            Err(_) => {
                // Fallback to cached version
                Self::get_market_price(env, exchange, pair)
            }
        }
    }

    /// Get current market price from Stellar DEX (cached version)
    pub fn get_market_price(
        env: Env,
        exchange: String,
        pair: String,
    ) -> Result<MarketPrice, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Create storage key to look up the market data
        let key = MarketDataKey {
            exchange,
            pair,
        };
        
        // Try to get the market price data from storage
        if let Some(market_price) = env.storage().persistent().get(&key) {
            // Validate that the data is not too old (older than 60 seconds)
            let current_time = env.ledger().timestamp();
            if current_time > market_price.timestamp && (current_time - market_price.timestamp) > 60 {
                return Err(ExchangeError::InvalidData); // Data is too old
            }
            
            Ok(market_price)
        } else {
            // No market data found for this exchange/pair
            Err(ExchangeError::InvalidData)
        }
    }

    /// Fetch order book data directly from Reflector Network contract
    pub fn get_order_book_direct(
        env: Env,
        exchange: String,
        pair: String,
        _depth: u32,
    ) -> Result<OrderBook, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // For this implementation, we'll return a simplified order book
        // A full implementation would fetch real order book data from Reflector
        
        // Try to get cached order book data
        Self::get_order_book(env, exchange, pair, _depth)
    }

    /// Fetch order book data for liquidity analysis from Stellar DEX (cached version)
    pub fn get_order_book(
        env: Env,
        exchange: String,
        pair: String,
        _depth: u32,
    ) -> Result<OrderBook, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Create storage key to look up the order book data
        let key = MarketDataKey {
            exchange,
            pair,
        };
        
        // Try to get the order book data from storage
        if let Some(order_book_data) = env.storage().persistent().get(&key) {
            // Validate that the data is not too old (older than 60 seconds)
            let current_time = env.ledger().timestamp();
            if current_time > order_book_data.timestamp && (current_time - order_book_data.timestamp) > 60 {
                return Err(ExchangeError::InvalidData); // Data is too old
            }
            
            Ok(OrderBook {
                bids: order_book_data.bids,
                asks: order_book_data.asks,
            })
        } else {
            // No order book data found for this exchange/pair
            // Return empty order book instead of error for graceful degradation
            Ok(OrderBook {
                bids: Vec::new(&env),
                asks: Vec::new(&env),
            })
        }
    }
    
    /// Helper function to extract asset from trading pair
    fn extract_asset_from_pair(env: &Env, pair: String) -> String {
        // Extract everything before the "/"
        let bytes = pair.to_bytes();
        let slash_index = bytes.iter().position(|&b| b == b'/').unwrap_or(bytes.len());
        String::from_bytes(env, &bytes.slice(0..slash_index as u32))
    }
}

// Unit tests for Exchange Interface
#[cfg(test)]
mod test_exchange_interface {
    use super::*;
    use soroban_sdk::{Env, String, Vec};

    #[test]
    fn test_submit_and_get_market_price() {
        let env = Env::default();
        let contract_id = env.register(ExchangeInterface, ());
        let client = ExchangeInterfaceClient::new(&env, &contract_id);
        
        // Submit market price data
        let submit_result = client.submit_market_price(
            &String::from_str(&env, "Stellar DEX"),
            &String::from_str(&env, "XLM/USD"),
            &100000000, // 1.00 USD
        );
        assert!(submit_result.is_ok());
        
        // Get market price data
        let market_price = client.get_market_price(&String::from_str(&env, "Stellar DEX"), &String::from_str(&env, "XLM/USD"));
        assert_eq!(market_price.price, 100000000);
    }

    #[test]
    fn test_submit_and_get_order_book() {
        let env = Env::default();
        let contract_id = env.register(ExchangeInterface, ());
        let client = ExchangeInterfaceClient::new(&env, &contract_id);
        
        // Create sample order book data
        let bids: Vec<(i128, i128)> = Vec::new(&env);
        let asks: Vec<(i128, i128)> = Vec::new(&env);
        
        // Submit order book data
        let submit_result = client.submit_order_book(
            &String::from_str(&env, "Stellar DEX"),
            &String::from_str(&env, "XLM/USD"),
            &bids,
            &asks,
        );
        assert!(submit_result.is_ok());
        
        // Get order book data
        let order_book = client.get_order_book(
            &String::from_str(&env, "Stellar DEX"),
            &String::from_str(&env, "XLM/USD"),
            &10,
        );
        assert_eq!(order_book.bids.len(), 0);
        assert_eq!(order_book.asks.len(), 0);
    }
    
    #[test]
    fn test_invalid_exchange_rejected() {
        let env = Env::default();
        let contract_id = env.register(ExchangeInterface, ());
        let client = ExchangeInterfaceClient::new(&env, &contract_id);
        
        // Try to submit market price for invalid exchange
        let result = client.try_submit_market_price(
            &String::from_str(&env, "Binance"),
            &String::from_str(&env, "XLM/USD"),
            &100000000,
        );
        
        assert!(result.is_err());
        if let Ok(Err(error)) = result {
            assert_eq!(error, ExchangeError::InvalidData);
        }
    }
}