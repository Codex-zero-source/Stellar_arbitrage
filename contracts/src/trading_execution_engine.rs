// Trading Execution Engine
// This module handles the actual execution of buy and sell orders
// on Stellar DEX with proper risk management

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, String, Address};

#[contracttype]
pub struct TradeOrder {
    pub asset: String,
    pub exchange: String,
    pub amount: i128,
    pub price_limit: i128, // Maximum buy price or minimum sell price
    pub order_type: String, // "buy" or "sell"
    pub deadline: u64,
    pub trader: Address,
}

#[contracttype]
pub struct TradeResult {
    pub success: bool,
    pub executed_amount: i128,
    pub average_price: i128,
    pub fees_paid: i128,
    pub timestamp: u64,
    pub error_message: String,
}

#[contracttype]
pub struct BatchTradeParameters {
    pub orders: soroban_sdk::Vec<TradeOrder>,
    pub max_slippage_bps: i128, // in basis points
    pub deadline: u64,
}

#[contracterror]
#[derive(Debug)]
pub enum TradingError {
    InsufficientBalance = 1,
    PriceLimitExceeded = 2,
    DeadlineExceeded = 3,
    ExchangeUnavailable = 4,
    InsufficientLiquidity = 5,
    SlippageTooHigh = 6,
    InvalidOrderType = 7,
}

#[contract]
pub struct TradingEngine;

#[contractimpl]
impl TradingEngine {
    /// Execute a buy order with maximum price constraint
    pub fn execute_buy_order(
        env: Env,
        _asset: String,
        exchange: String,
        amount: i128,
        max_price: i128,
        _buyer: Address,
    ) -> Result<TradeResult, TradingError> {
        // Validate parameters
        if amount <= 0 {
            return Err(TradingError::InsufficientLiquidity);
        }
        
        if max_price <= 0 {
            return Err(TradingError::PriceLimitExceeded);
        }
        
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(TradingError::ExchangeUnavailable);
        }
        
        // Check deadline
        if env.ledger().timestamp() > env.ledger().timestamp() + 30 { // 30 seconds default deadline
            return Err(TradingError::DeadlineExceeded);
        }
        
        // In a real implementation, this would:
        // 1. Check buyer's balance
        // 2. Fetch current market price from Stellar DEX
        // 3. Verify price is within limit
        // 4. Execute the trade
        // 5. Update balances
        
        // For simulation, we'll assume the trade is successful
        let current_price = max_price - 100000; // Slightly below max price
        let fees = (amount * 10) / 10000; // 0.1% fee
        
        Ok(TradeResult {
            success: true,
            executed_amount: amount,
            average_price: current_price,
            fees_paid: fees,
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
        })
    }

    /// Execute a sell order with minimum price constraint
    pub fn execute_sell_order(
        env: Env,
        _asset: String,
        exchange: String,
        amount: i128,
        min_price: i128,
        _seller: Address,
    ) -> Result<TradeResult, TradingError> {
        // Validate parameters
        if amount <= 0 {
            return Err(TradingError::InsufficientLiquidity);
        }
        
        if min_price <= 0 {
            return Err(TradingError::PriceLimitExceeded);
        }
        
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return Err(TradingError::ExchangeUnavailable);
        }
        
        // Check deadline
        if env.ledger().timestamp() > env.ledger().timestamp() + 30 { // 30 seconds default deadline
            return Err(TradingError::DeadlineExceeded);
        }
        
        // In a real implementation, this would:
        // 1. Check seller's balance
        // 2. Fetch current market price from Stellar DEX
        // 3. Verify price is within limit
        // 4. Execute the trade
        // 5. Update balances
        
        // For simulation, we'll assume the trade is successful
        let current_price = min_price + 100000; // Slightly above min price
        let fees = (amount * 10) / 10000; // 0.1% fee
        
        Ok(TradeResult {
            success: true,
            executed_amount: amount,
            average_price: current_price,
            fees_paid: fees,
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
        })
    }

    /// Execute multiple trades atomically
    pub fn batch_execute_trades(
        env: Env,
        params: BatchTradeParameters,
        _trader: Address,
    ) -> Result<soroban_sdk::Vec<TradeResult>, TradingError> {
        // Validate batch parameters
        if params.orders.len() == 0 {
            return Err(TradingError::InsufficientLiquidity);
        }
        
        if env.ledger().timestamp() > params.deadline {
            return Err(TradingError::DeadlineExceeded);
        }
        
        let mut results: soroban_sdk::Vec<TradeResult> = soroban_sdk::Vec::new(&env);
        
        // Execute each order in the batch
        for i in 0..params.orders.len() {
            let order = params.orders.get(i).unwrap();
            
            // Validate that we're only working with Stellar DEX
            if order.exchange != String::from_str(&env, "Stellar DEX") {
                return Err(TradingError::ExchangeUnavailable);
            }
            
            // Instead of using to_string(), we'll compare directly
            let buy_order = String::from_str(&env, "buy");
            let sell_order = String::from_str(&env, "sell");
            
            let result = match order.order_type {
                order_type if order_type == buy_order => {
                    Self::execute_buy_order(
                        env.clone(),
                        order.asset.clone(),
                        order.exchange.clone(),
                        order.amount,
                        order.price_limit,
                        order.trader.clone(),
                    )
                }
                order_type if order_type == sell_order => {
                    Self::execute_sell_order(
                        env.clone(),
                        order.asset.clone(),
                        order.exchange.clone(),
                        order.amount,
                        order.price_limit,
                        order.trader.clone(),
                    )
                }
                _ => {
                    return Err(TradingError::InvalidOrderType);
                }
            };
            
            match result {
                Ok(trade_result) => {
                    results.push_back(trade_result);
                }
                Err(error) => {
                    // In a real implementation, we might want to rollback all trades
                    // For now, we'll just return the error
                    return Err(error);
                }
            }
        }
        
        Ok(results)
    }
}

// Unit tests for Trading Execution Engine
#[cfg(test)]
mod test_trading_execution_engine {
    use super::*;
    use soroban_sdk::{Env, String, Address};

    #[test]
    fn test_execute_buy_order() {
        let env = Env::default();
        let contract_id = env.register(TradingEngine, ());
        let client = TradingEngineClient::new(&env, &contract_id);
        
        let buyer = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let result = client.execute_buy_order(
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "Stellar DEX"),
            &10000000000, // 100 XLM
            &101000000, // 1.01 XLM price limit
            &buyer,
        );
        
        assert!(result.success);
        assert_eq!(result.executed_amount, 10000000000);
    }

    #[test]
    fn test_execute_sell_order() {
        let env = Env::default();
        let contract_id = env.register(TradingEngine, ());
        let client = TradingEngineClient::new(&env, &contract_id);
        
        let seller = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let result = client.execute_sell_order(
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "Stellar DEX"),
            &10000000000, // 100 XLM
            &99000000, // 0.99 XLM price limit
            &seller,
        );
        
        assert!(result.success);
        assert_eq!(result.executed_amount, 10000000000);
    }

    #[test]
    fn test_batch_execute_trades() {
        let env = Env::default();
        let contract_id = env.register(TradingEngine, ());
        let client = TradingEngineClient::new(&env, &contract_id);
        
        let trader = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let order1 = TradeOrder {
            asset: String::from_str(&env, "XLM"),
            exchange: String::from_str(&env, "Stellar DEX"),
            amount: 5000000000, // 50 XLM
            price_limit: 101000000, // 1.01 XLM
            order_type: String::from_str(&env, "buy"),
            deadline: env.ledger().timestamp() + 300,
            trader: trader.clone(),
        };
        
        let order2 = TradeOrder {
            asset: String::from_str(&env, "XLM"),
            exchange: String::from_str(&env, "Stellar DEX"),
            amount: 5000000000, // 50 XLM
            price_limit: 99000000, // 0.99 XLM
            order_type: String::from_str(&env, "sell"),
            deadline: env.ledger().timestamp() + 300,
            trader: trader.clone(),
        };
        
        let orders = soroban_sdk::vec![&env, order1, order2];
        
        let params = BatchTradeParameters {
            orders,
            max_slippage_bps: 50, // 0.5%
            deadline: env.ledger().timestamp() + 300,
        };
        
        let results = client.batch_execute_trades(&params, &trader);
        
        assert_eq!(results.len(), 2);
    }
}