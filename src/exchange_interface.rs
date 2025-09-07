// Exchange Interface
// This module provides a unified interface to interact with Stellar DEX

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, contractclient, Env, Vec, String, Address, BytesN};

#[contracttype]
pub struct MarketPrice {
    pub price: i128,
    pub timestamp: u64,
}

#[contracterror]
pub enum ExchangeError {
    NetworkError = 1,
    InvalidData = 2,
    InsufficientLiquidity = 3,
}

#[contracttype]
pub struct OrderBook {
    pub bids: Vec<(i128, i128)>, // price, amount
    pub asks: Vec<(i128, i128)>, // price, amount
}

// Interface for Stellar DEX operations
#[contractclient(name = "StellarDexClient")]
pub trait StellarDexInterface {
    fn get_price(&self, pair: String) -> Result<(i128, u64), u32>;
    fn get_order_book(&self, pair: String, depth: u32) -> Result<(Vec<(i128, i128)>, Vec<(i128, i128)>), u32>;
    fn get_liquidity(&self, pair: String) -> Result<i128, u32>;
}

#[contract]
pub struct ExchangeInterface;

#[contractimpl]
impl ExchangeInterface {
    /// Get current market price from Stellar DEX
    pub fn get_market_price(
        env: Env,
        exchange: String,
        pair: String,
    ) -> Result<MarketPrice, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Get Stellar DEX contract address from environment
        // In a real implementation, this would be configured properly
        let dex_address = env.invoker().unwrap_or_else(|| {
            // Default to a test address if not configured
            String::from_str(&env, "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M")
        });
        
        let dex_contract_address = Address::from_string(&dex_address);
        let dex_client = StellarDexClient::new(&env, &dex_contract_address);
        
        // Call the Stellar DEX contract to get the price
        match dex_client.try_get_price(pair) {
            Ok(Ok((price, timestamp))) => {
                Ok(MarketPrice {
                    price,
                    timestamp,
                })
            },
            Ok(Err(_)) => Err(ExchangeError::InsufficientLiquidity),
            Err(_) => Err(ExchangeError::NetworkError),
        }
    }

    /// Fetch order book data for liquidity analysis from Stellar DEX
    pub fn get_order_book(
        env: Env,
        exchange: String,
        pair: String,
        depth: u32,
    ) -> Result<OrderBook, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Get Stellar DEX contract address from environment
        // In a real implementation, this would be configured properly
        let dex_address = env.invoker().unwrap_or_else(|| {
            // Default to a test address if not configured
            String::from_str(&env, "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M")
        });
        
        let dex_contract_address = Address::from_string(&dex_address);
        let dex_client = StellarDexClient::new(&env, &dex_contract_address);
        
        // Call the Stellar DEX contract to get the order book
        match dex_client.try_get_order_book(pair, &depth) {
            Ok(Ok((bids, asks))) => {
                Ok(OrderBook {
                    bids,
                    asks,
                })
            },
            Ok(Err(_)) => Err(ExchangeError::InsufficientLiquidity),
            Err(_) => Err(ExchangeError::NetworkError),
        }
    }
    
    /// Get liquidity information for a trading pair
    pub fn get_liquidity(
        env: Env,
        exchange: String,
        pair: String,
    ) -> Result<i128, ExchangeError> {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(ExchangeError::InvalidData);
        }
        
        // Get Stellar DEX contract address from environment
        // In a real implementation, this would be configured properly
        let dex_address = env.invoker().unwrap_or_else(|| {
            // Default to a test address if not configured
            String::from_str(&env, "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M")
        });
        
        let dex_contract_address = Address::from_string(&dex_address);
        let dex_client = StellarDexClient::new(&env, &dex_contract_address);
        
        // Call the Stellar DEX contract to get liquidity
        match dex_client.try_get_liquidity(pair) {
            Ok(Ok(liquidity)) => Ok(liquidity),
            Ok(Err(_)) => Err(ExchangeError::InsufficientLiquidity),
            Err(_) => Err(ExchangeError::NetworkError),
        }
    }
}

// Unit tests for Exchange Interface
#[cfg(test)]
mod test_exchange_interface {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_get_market_price() {
        let env = Env::default();
        let contract_id = env.register(ExchangeInterface, ());
        let client = ExchangeInterfaceClient::new(&env, &contract_id);
        
        let market_price = client.get_market_price(&String::from_str(&env, "Stellar DEX"), &String::from_str(&env, "AQUA/XLM"));
        
        // In a real test, we would check for specific values
        // For now, we just check that it doesn't panic
    }

    #[test]
    fn test_get_order_book() {
        let env = Env::default();
        let contract_id = env.register(ExchangeInterface, ());
        let client = ExchangeInterfaceClient::new(&env, &contract_id);
        
        let order_book = client.get_order_book(
            &String::from_str(&env, "Stellar DEX"),
            &String::from_str(&env, "AQUA/XLM"),
            &10
        );
        
        // In a real test, we would check for specific values
        // For now, we just check that it doesn't panic
    }
    
    #[test]
    fn test_invalid_exchange_rejected() {
        let env = Env::default();
        let contract_id = env.register(ExchangeInterface, ());
        let client = ExchangeInterfaceClient::new(&env, &contract_id);
        
        let result = client.try_get_market_price(&String::from_str(&env, "Binance"), &String::from_str(&env, "AQUA/XLM"));
        
        assert_eq!(result, Err(Ok(ExchangeError::InvalidData)));
    }
}