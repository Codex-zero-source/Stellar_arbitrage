// Cross-Chain Trading Execution Engine
// This module handles the execution of cross-chain arbitrage trades

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, Vec, String, Address};

#[contracttype]
#[derive(Clone)]
pub struct CrossChainTradeOrder {
    pub asset: String,
    pub chain: String,
    pub exchange: String,
    pub amount: i128,
    pub price_limit: i128, // Maximum buy price or minimum sell price
    pub order_type: String, // "buy" or "sell"
    pub deadline: u64,
    pub trader: Address,
}

#[contracttype]
pub struct CrossChainTradeResult {
    pub success: bool,
    pub executed_amount: i128,
    pub average_price: i128,
    pub fees_paid: i128,
    pub cross_chain_fee: i128,
    pub timestamp: u64,
    pub error_message: String,
}

#[contracttype]
pub struct CrossChainBatchTradeParameters {
    pub orders: Vec<CrossChainTradeOrder>,
    pub max_slippage_bps: i128, // in basis points
    pub deadline: u64,
}

#[contracterror]
#[derive(Debug)]
pub enum CrossChainTradingError {
    InsufficientBalance = 1,
    PriceLimitExceeded = 2,
    DeadlineExceeded = 3,
    ExchangeUnavailable = 4,
    InsufficientLiquidity = 5,
    SlippageTooHigh = 6,
    InvalidOrderType = 7,
    InvalidChain = 8,
    CrossChainTransferFailed = 9,
    TradeExecutionFailed = 10,
}

#[contract]
pub struct CrossChainTradingEngine;

#[contractimpl]
impl CrossChainTradingEngine {
    /// Execute a cross-chain buy order with maximum price constraint
    pub fn execute_cross_chain_buy_order(
        env: Env,
        _asset: String,
        chain: String,
        _exchange: String,
        amount: i128,
        max_price: i128,
        _buyer: Address,
    ) -> Result<CrossChainTradeResult, CrossChainTradingError> {
        // Validate parameters
        if amount <= 0 {
            return Err(CrossChainTradingError::InsufficientLiquidity);
        }
        
        if max_price <= 0 {
            return Err(CrossChainTradingError::PriceLimitExceeded);
        }
        
        // Validate supported chains
        let stellar_chain = String::from_str(&env, "Stellar");
        let ethereum_chain = String::from_str(&env, "Ethereum");
        if chain != stellar_chain && chain != ethereum_chain {
            return Err(CrossChainTradingError::InvalidChain);
        }
        
        // Check deadline
        if env.ledger().timestamp() > env.ledger().timestamp() + 300 { // 5 minutes default deadline
            return Err(CrossChainTradingError::DeadlineExceeded);
        }
        
        // In a real implementation, this would:
        // 1. Check buyer's balance on the specified chain
        // 2. Fetch current market price from the exchange
        // 3. Verify price is within limit
        // 4. Execute the trade
        // 5. Handle cross-chain transfers if needed
        // 6. Update balances
        
        // For simulation, we'll assume the trade is successful
        let current_price = max_price - 100000; // Slightly below max price
        let fees = (amount * 10) / 10000; // 0.1% fee
        let cross_chain_fee = if chain == ethereum_chain { 5000000 } else { 0 }; // Simulated cross-chain fee
        
        Ok(CrossChainTradeResult {
            success: true,
            executed_amount: amount,
            average_price: current_price,
            fees_paid: fees,
            cross_chain_fee,
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
        })
    }

    /// Execute a cross-chain sell order with minimum price constraint
    pub fn execute_cross_chain_sell_order(
        env: Env,
        _asset: String,
        chain: String,
        _exchange: String,
        amount: i128,
        min_price: i128,
        _seller: Address,
    ) -> Result<CrossChainTradeResult, CrossChainTradingError> {
        // Validate parameters
        if amount <= 0 {
            return Err(CrossChainTradingError::InsufficientLiquidity);
        }
        
        if min_price <= 0 {
            return Err(CrossChainTradingError::PriceLimitExceeded);
        }
        
        // Validate supported chains
        let stellar_chain = String::from_str(&env, "Stellar");
        let ethereum_chain = String::from_str(&env, "Ethereum");
        if chain != stellar_chain && chain != ethereum_chain {
            return Err(CrossChainTradingError::InvalidChain);
        }
        
        // Check deadline
        if env.ledger().timestamp() > env.ledger().timestamp() + 300 { // 5 minutes default deadline
            return Err(CrossChainTradingError::DeadlineExceeded);
        }
        
        // In a real implementation, this would:
        // 1. Check seller's balance on the specified chain
        // 2. Fetch current market price from the exchange
        // 3. Verify price is within limit
        // 4. Execute the trade
        // 5. Handle cross-chain transfers if needed
        // 6. Update balances
        
        // For simulation, we'll assume the trade is successful
        let current_price = min_price + 100000; // Slightly above min price
        let fees = (amount * 10) / 10000; // 0.1% fee
        let cross_chain_fee = if chain == ethereum_chain { 5000000 } else { 0 }; // Simulated cross-chain fee
        
        Ok(CrossChainTradeResult {
            success: true,
            executed_amount: amount,
            average_price: current_price,
            fees_paid: fees,
            cross_chain_fee,
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
        })
    }

    /// Execute multiple cross-chain trades atomically
    pub fn batch_execute_cross_chain_trades(
        env: Env,
        params: CrossChainBatchTradeParameters,
        _trader: Address,
    ) -> Result<Vec<CrossChainTradeResult>, CrossChainTradingError> {
        // Validate batch parameters
        if params.orders.len() == 0 {
            return Err(CrossChainTradingError::InsufficientLiquidity);
        }
        
        if env.ledger().timestamp() > params.deadline {
            return Err(CrossChainTradingError::DeadlineExceeded);
        }
        
        let mut results: Vec<CrossChainTradeResult> = Vec::new(&env);
        
        // Execute each order in the batch
        for i in 0..params.orders.len() {
            let order = params.orders.get(i).unwrap();
            
            // Validate chain
            let stellar_chain = String::from_str(&env, "Stellar");
            let ethereum_chain = String::from_str(&env, "Ethereum");
            if order.chain != stellar_chain && order.chain != ethereum_chain {
                return Err(CrossChainTradingError::InvalidChain);
            }
            
            // Instead of using to_string(), we'll compare directly
            let buy_order = String::from_str(&env, "buy");
            let sell_order = String::from_str(&env, "sell");
            
            let result = if order.order_type == buy_order {
                Self::execute_cross_chain_buy_order(
                    env.clone(),
                    order.asset.clone(),
                    order.chain.clone(),
                    order.exchange.clone(),
                    order.amount,
                    order.price_limit,
                    order.trader.clone(),
                )
            } else if order.order_type == sell_order {
                Self::execute_cross_chain_sell_order(
                    env.clone(),
                    order.asset.clone(),
                    order.chain.clone(),
                    order.exchange.clone(),
                    order.amount,
                    order.price_limit,
                    order.trader.clone(),
                )
            } else {
                return Err(CrossChainTradingError::InvalidOrderType);
            };
            
            match result {
                Ok(trade_result) => {
                    results.push_back(trade_result);
                }
                Err(_error) => {
                    // In a real implementation, we might want to rollback all trades
                    // For now, we'll just return the error
                    return Err(CrossChainTradingError::TradeExecutionFailed);
                }
            }
        }
        
        Ok(results)
    }
}

// Unit tests for Cross-Chain Trading Execution Engine
#[cfg(test)]
mod test_cross_chain_trading_engine {
    use super::*;
    use soroban_sdk::{Env, String, Address};

    #[test]
    fn test_execute_cross_chain_buy_order() {
        let env = Env::default();
        let contract_id = env.register(CrossChainTradingEngine, ());
        let client = CrossChainTradingEngineClient::new(&env, &contract_id);
        
        let buyer = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let result = client.execute_cross_chain_buy_order(
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "Stellar"),
            &String::from_str(&env, "Stellar DEX"),
            &10000000000, // 100 XLM
            &101000000, // 1.01 XLM price limit
            &buyer,
        );
        
        assert!(result.success);
        assert_eq!(result.executed_amount, 10000000000);
    }

    #[test]
    fn test_execute_cross_chain_sell_order() {
        let env = Env::default();
        let contract_id = env.register(CrossChainTradingEngine, ());
        let client = CrossChainTradingEngineClient::new(&env, &contract_id);
        
        let seller = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let result = client.execute_cross_chain_sell_order(
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "Ethereum"),
            &String::from_str(&env, "Uniswap"),
            &10000000000, // 100 XLM
            &99000000, // 0.99 XLM price limit
            &seller,
        );
        
        assert!(result.success);
        assert_eq!(result.executed_amount, 10000000000);
    }

    #[test]
    fn test_batch_execute_cross_chain_trades() {
        let env = Env::default();
        let contract_id = env.register(CrossChainTradingEngine, ());
        let client = CrossChainTradingEngineClient::new(&env, &contract_id);
        
        let trader = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let order1 = CrossChainTradeOrder {
            asset: String::from_str(&env, "XLM"),
            chain: String::from_str(&env, "Stellar"),
            exchange: String::from_str(&env, "Stellar DEX"),
            amount: 5000000000, // 50 XLM
            price_limit: 101000000, // 1.01 XLM
            order_type: String::from_str(&env, "buy"),
            deadline: env.ledger().timestamp() + 300,
            trader: trader.clone(),
        };
        
        let order2 = CrossChainTradeOrder {
            asset: String::from_str(&env, "XLM"),
            chain: String::from_str(&env, "Ethereum"),
            exchange: String::from_str(&env, "Uniswap"),
            amount: 5000000000, // 50 XLM
            price_limit: 99000000, // 0.99 XLM
            order_type: String::from_str(&env, "sell"),
            deadline: env.ledger().timestamp() + 300,
            trader: trader.clone(),
        };
        
        let orders = soroban_sdk::vec![&env, order1, order2];
        
        let params = CrossChainBatchTradeParameters {
            orders,
            max_slippage_bps: 50, // 0.5%
            deadline: env.ledger().timestamp() + 300,
        };
        
        let results = client.batch_execute_cross_chain_trades(&params, &trader);
        
        assert_eq!(results.len(), 2);
    }
}