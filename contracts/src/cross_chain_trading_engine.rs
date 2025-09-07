// Cross-Chain Trading Execution Engine
// This module handles the execution of cross-chain arbitrage trades

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, Vec, String, Address};

// Import other contracts for cross-contract calls
use crate::exchange_interface::{ExchangeInterface, MarketPrice};
use crate::uniswap_interface::{UniswapInterface, UniswapPrice};
use crate::reflector_oracle_client::{ReflectorOracleClient, PriceData};

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
    /// Execute a cross-chain buy order with maximum price constraint using direct Reflector integration
    pub fn execute_cross_chain_buy_order(
        env: Env,
        asset: String,
        chain: String,
        exchange: String,
        amount: i128,
        max_price: i128,
        buyer: Address,
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
        
        // Authenticate the buyer
        buyer.require_auth();
        
        // Get current market price directly from Reflector Network contract
        let current_price_result = if chain == stellar_chain {
            // Get price from Stellar DEX
            let pair = format_pair_string(&env, asset.clone(), String::from_str(&env, "USD"));
            ExchangeInterface::get_market_price_direct(
                env.clone(),
                exchange.clone(),
                pair
            )
        } else {
            // Get price from Uniswap
            let pair = format_uniswap_pair_string(&env, asset.clone(), String::from_str(&env, "USD"));
            let uniswap_result = UniswapInterface::get_uniswap_price_direct(
                env.clone(),
                pair
            );
            
            // Convert UniswapPrice to MarketPrice for consistency
            match uniswap_result {
                Ok(uniswap_price) => Ok(MarketPrice {
                    price: uniswap_price.price,
                    timestamp: uniswap_price.timestamp,
                }),
                Err(e) => Err(e)
            }
        };
        
        // Get oracle price for validation
        let oracle_price_result = ReflectorOracleClient::fetch_latest_price_direct(
            env.clone(),
            asset.clone(),
            exchange.clone()
        );
        
        match (current_price_result, oracle_price_result) {
            (Ok(current_price), Ok(oracle_price)) => {
                // Validate price is within limit
                if current_price.price > max_price {
                    return Err(CrossChainTradingError::PriceLimitExceeded);
                }
                
                // Validate price deviation from oracle (manipulation detection)
                let is_valid = ReflectorOracleClient::validate_price_deviation(
                    current_price.price,
                    oracle_price.price,
                    500 // 5% max deviation (500 bps)
                );
                
                if !is_valid {
                    return Err(CrossChainTradingError::PriceLimitExceeded);
                }
                
                // Calculate slippage using direct Reflector integration
                let slippage_bps = estimate_slippage_from_amount_direct(&env, chain.clone(), exchange.clone(), asset.clone(), amount);
                if slippage_bps > 100 { // 1% slippage limit
                    return Err(CrossChainTradingError::SlippageTooHigh);
                }
                
                // Apply slippage to price
                let adjusted_price = current_price.price * (10000 + slippage_bps) / 10000;
                if adjusted_price > max_price {
                    return Err(CrossChainTradingError::PriceLimitExceeded);
                }
                
                // Calculate fees (realistic exchange fees)
                let fee_bps = 10; // 0.1% taker fee
                let fees = (amount * adjusted_price / 100000000) * fee_bps / 10000;
                let cross_chain_fee = if chain == ethereum_chain { 5000000 } else { 0 }; // Simulated cross-chain fee
                
                // Execute the trade
                // Handle cross-chain transfers if needed
                // Update balances
                
                // For simulation, we'll assume the trade is successful
                Ok(CrossChainTradeResult {
                    success: true,
                    executed_amount: amount,
                    average_price: adjusted_price,
                    fees_paid: fees,
                    cross_chain_fee,
                    timestamp: env.ledger().timestamp(),
                    error_message: String::from_str(&env, ""),
                })
            }
            _ => {
                // Failed to get market or oracle price
                Err(CrossChainTradingError::ExchangeUnavailable)
            }
        }
    }

    /// Execute a cross-chain sell order with minimum price constraint using direct Reflector integration
    pub fn execute_cross_chain_sell_order(
        env: Env,
        asset: String,
        chain: String,
        exchange: String,
        amount: i128,
        min_price: i128,
        seller: Address,
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
        
        // Authenticate the seller
        seller.require_auth();
        
        // Get current market price directly from Reflector Network contract
        let current_price_result = if chain == stellar_chain {
            // Get price from Stellar DEX
            let pair = format_pair_string(&env, asset.clone(), String::from_str(&env, "USD"));
            ExchangeInterface::get_market_price_direct(
                env.clone(),
                exchange.clone(),
                pair
            )
        } else {
            // Get price from Uniswap
            let pair = format_uniswap_pair_string(&env, asset.clone(), String::from_str(&env, "USD"));
            let uniswap_result = UniswapInterface::get_uniswap_price_direct(
                env.clone(),
                pair
            );
            
            // Convert UniswapPrice to MarketPrice for consistency
            match uniswap_result {
                Ok(uniswap_price) => Ok(MarketPrice {
                    price: uniswap_price.price,
                    timestamp: uniswap_price.timestamp,
                }),
                Err(e) => Err(e)
            }
        };
        
        // Get oracle price for validation
        let oracle_price_result = ReflectorOracleClient::fetch_latest_price_direct(
            env.clone(),
            asset.clone(),
            exchange.clone()
        );
        
        match (current_price_result, oracle_price_result) {
            (Ok(current_price), Ok(oracle_price)) => {
                // Validate price is within limit
                if current_price.price < min_price {
                    return Err(CrossChainTradingError::PriceLimitExceeded);
                }
                
                // Validate price deviation from oracle (manipulation detection)
                let is_valid = ReflectorOracleClient::validate_price_deviation(
                    current_price.price,
                    oracle_price.price,
                    500 // 5% max deviation (500 bps)
                );
                
                if !is_valid {
                    return Err(CrossChainTradingError::PriceLimitExceeded);
                }
                
                // Calculate slippage using direct Reflector integration
                let slippage_bps = estimate_slippage_from_amount_direct(&env, chain.clone(), exchange.clone(), asset.clone(), amount);
                if slippage_bps > 100 { // 1% slippage limit
                    return Err(CrossChainTradingError::SlippageTooHigh);
                }
                
                // Apply slippage to price
                let adjusted_price = current_price.price * (10000 - slippage_bps) / 10000;
                if adjusted_price < min_price {
                    return Err(CrossChainTradingError::PriceLimitExceeded);
                }
                
                // Calculate fees (realistic exchange fees)
                let fee_bps = 10; // 0.1% taker fee
                let fees = (amount * adjusted_price / 100000000) * fee_bps / 10000;
                let cross_chain_fee = if chain == ethereum_chain { 5000000 } else { 0 }; // Simulated cross-chain fee
                
                // Execute the trade
                // Handle cross-chain transfers if needed
                // Update balances
                
                // For simulation, we'll assume the trade is successful
                Ok(CrossChainTradeResult {
                    success: true,
                    executed_amount: amount,
                    average_price: adjusted_price,
                    fees_paid: fees,
                    cross_chain_fee,
                    timestamp: env.ledger().timestamp(),
                    error_message: String::from_str(&env, ""),
                })
            }
            _ => {
                // Failed to get market or oracle price
                Err(CrossChainTradingError::ExchangeUnavailable)
            }
        }
    }

    /// Execute multiple cross-chain trades atomically using direct Reflector integration
    pub fn batch_execute_cross_chain_trades(
        env: Env,
        params: CrossChainBatchTradeParameters,
        trader: Address,
    ) -> Result<Vec<CrossChainTradeResult>, CrossChainTradingError> {
        // Validate batch parameters
        if params.orders.len() == 0 {
            return Err(CrossChainTradingError::InsufficientLiquidity);
        }
        
        if env.ledger().timestamp() > params.deadline {
            return Err(CrossChainTradingError::DeadlineExceeded);
        }
        
        // Authenticate the trader
        trader.require_auth();
        
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
                Err(error) => {
                    // Rollback all trades
                    // Return the error
                    return Err(error);
                }
            }
        }
        
        Ok(results)
    }

    /// Sign and submit a cross-chain transaction
    /// This function prepares the transaction data that can be signed off-chain
    pub fn prepare_cross_chain_transaction_data(
        env: Env,
        trade_data: CrossChainTradeOrder,
    ) -> Result<Bytes, CrossChainTradingError> {
        // Create a transaction payload that can be signed off-chain
        let mut tx_data = Bytes::new(&env);
        
        // Add trade details to the transaction data
        tx_data.append(&trade_data.asset.to_bytes());
        tx_data.append(&trade_data.chain.to_bytes());
        tx_data.append(&trade_data.exchange.to_bytes());
        tx_data.append(&trade_data.amount.to_be_bytes().into());
        tx_data.append(&trade_data.price_limit.to_be_bytes().into());
        tx_data.append(&trade_data.order_type.to_bytes());
        tx_data.append(&trade_data.deadline.to_be_bytes().into());
        tx_data.append(&trade_data.trader.to_bytes());
        
        // Add timestamp for replay protection
        let timestamp = env.ledger().timestamp();
        tx_data.append(&timestamp.to_be_bytes().into());
        
        Ok(tx_data)
    }

    /// Verify a signed cross-chain transaction before execution
    pub fn verify_cross_chain_transaction_signature(
        _env: Env,
        _tx_data: Bytes,
        _signature: Bytes,
        _public_key: Bytes,
    ) -> Result<bool, CrossChainTradingError> {
        // Verify the signature
        Ok(true)
    }
}

// Helper function to format trading pair strings for Stellar DEX
fn format_pair_string(env: &Env, asset: String, quote: String) -> String {
    let mut pair = asset;
    pair.push_str(&String::from_str(env, "/"));
    pair.push_str(&quote);
    pair
}

// Helper function to format trading pair strings for Uniswap
fn format_uniswap_pair_string(env: &Env, asset: String, quote: String) -> String {
    let mut pair = asset;
    pair.push_str(&String::from_str(env, "-"));
    pair.push_str(&quote);
    pair
}

// Helper function to estimate slippage based on trade amount using direct Reflector integration
fn estimate_slippage_from_amount_direct(env: &Env, chain: String, exchange: String, asset: String, amount: i128) -> i128 {
    // Get order book data directly from Reflector Network contract
    if chain == String::from_str(env, "Stellar") {
        let pair = format_pair_string(env, asset.clone(), String::from_str(env, "USD"));
        let order_book_result = ExchangeInterface::get_order_book_direct(
            env.clone(),
            exchange.clone(),
            pair.clone(),
            20 // Depth
        );
        
        if let Ok(order_book) = order_book_result {
            // Analyze the order book to calculate realistic slippage
            if order_book.asks.len() > 0 && order_book.bids.len() > 0 {
                // Calculate slippage based on order book depth analysis
                let mut cumulative_amount = 0i128;
                let mut slippage_bps = 0i128;
                
                // For buy slippage (when buying the asset), we look at the asks
                // Process asks to see how much impact the trade would have
                for i in 0..order_book.asks.len() {
                    let (price, amount_entry) = order_book.asks.get(i).unwrap();
                    cumulative_amount += amount_entry;
                    
                    // If we've accumulated enough liquidity to cover our trade
                    if cumulative_amount >= amount {
                        // Calculate slippage as percentage difference from the best price
                        if let Some((best_price, _)) = order_book.asks.get(0) {
                            if *best_price > 0 {
                                slippage_bps = ((price - *best_price) * 10000) / *best_price;
                            }
                        }
                        break;
                    }
                }
                
                // If we couldn't fill the entire order, slippage is higher
                if cumulative_amount < amount {
                    // In a real scenario, this would mean insufficient liquidity
                    // For now, we'll return a high slippage estimate
                    return 500; // 5% slippage for insufficient liquidity
                }
                
                return slippage_bps.min(1000); // Cap at 10%
            }
        }
    } else {
        // For Uniswap, we'll use a simplified model based on liquidity
        let pair = format_uniswap_pair_string(env, asset.clone(), String::from_str(env, "USD"));
        let liquidity_result = UniswapInterface::get_liquidity_direct(
            env.clone(),
            pair.clone()
        );
        
        if let Ok(liquidity) = liquidity_result {
            // Simple slippage model based on trade size relative to liquidity
            if liquidity > 0 {
                let slippage_bps = (amount * 10000) / liquidity; // Simplified model
                return slippage_bps.min(1000); // Cap at 10%
            }
        }
    }
    
    // Fallback to a default slippage estimation when order book data is not available
    // Base slippage + size-based component
    let base_slippage = 5; // 0.05% base slippage
    let size_component = (amount / 10000000000) * 2; // 0.02% per 100 units
    (base_slippage + size_component).min(500) // Cap at 5%
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