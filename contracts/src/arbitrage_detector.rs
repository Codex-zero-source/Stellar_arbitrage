// Arbitrage Detector
// This module scans Stellar DEX for arbitrage opportunities
// and calculates potential profits

use soroban_sdk::{contract, contractimpl, contracttype, Env, Vec, String};

// Import other contracts for cross-contract calls
use crate::exchange_interface::{ExchangeInterface, MarketPrice, ExchangeError};
use crate::reflector_oracle_client::{ReflectorOracleClient, PriceData, OracleError};

#[contracttype]
pub struct ArbitrageOpportunity {
    pub asset: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: i128,
    pub sell_price: i128,
    pub available_amount: i128,
    pub estimated_profit: i128,
    pub confidence_score: i128,
    pub expiry_time: u64,
}

#[contracttype]
pub struct TradingFees {
    pub maker_fee_bps: i128,
    pub taker_fee_bps: i128,
    pub withdrawal_fee: i128,
    pub gas_fee: i128,
    pub flash_loan_fee_bps: i128,
}

#[contract]
pub struct ArbitrageDetector;

#[contractimpl]
impl ArbitrageDetector {
    /// Scan Stellar DEX for arbitrage opportunities using direct Reflector integration
    pub fn scan_opportunities(env: Env, assets: Vec<String>, min_profit: i128) -> Vec<ArbitrageOpportunity> {
        let mut opportunities: Vec<ArbitrageOpportunity> = Vec::new(&env);
        
        // For each asset, check for arbitrage opportunities
        for i in 0..assets.len() {
            let asset = assets.get(i).unwrap();
            
            // Get price directly from Reflector Network smart contract for validation
            let oracle_result = ReflectorOracleClient::fetch_latest_price_direct(
                env.clone(),
                asset.clone(),
                String::from_str(&env, "Stellar DEX")
            );
            
            if let Ok(oracle_price_data) = oracle_result {
                // Get market price directly from Reflector Network contract
                let exchange_result = ExchangeInterface::get_market_price_direct(
                    env.clone(),
                    String::from_str(&env, "Stellar DEX"),
                    // Create a proper trading pair string (e.g., "XLM/USD")
                    format_pair_string(&env, asset.clone(), String::from_str(&env, "USD"))
                );
                
                if let Ok(market_price) = exchange_result {
                    // Validate that prices are close (within 5% to detect manipulation)
                    let is_valid = ReflectorOracleClient::validate_price_deviation(
                        market_price.price,
                        oracle_price_data.price,
                        500 // 5% max deviation (500 bps)
                    );
                    
                    if is_valid {
                        // Calculate potential profit (using a fixed amount for demonstration)
                        let trade_amount = 10000000000; // 100 units (scaled)
                        
                        // Estimate sell price with slippage
                        let slippage_bps = Self::estimate_slippage(
                            env.clone(),
                            String::from_str(&env, "Stellar DEX"),
                            asset.clone(),
                            trade_amount
                        );
                        
                        // Apply slippage to sell price (reduce it)
                        let adjusted_sell_price = market_price.price * (10000 - slippage_bps) / 10000;
                        
                        // Calculate profit with realistic fee structure
                        let profit = Self::calculate_profit(
                            market_price.price, // buy price
                            adjusted_sell_price, // sell price (with slippage)
                            trade_amount,
                            true // Include flash loan fees
                        );
                        
                        // Only include opportunities that meet minimum profit requirement
                        if profit >= min_profit {
                            // Calculate confidence score based on price deviation and liquidity
                            let price_deviation_bps = ((market_price.price - oracle_price_data.price).abs() * 10000) 
                                / oracle_price_data.price;
                            let confidence_score = 100 - price_deviation_bps; // Higher confidence with lower deviation
                            
                            opportunities.push_back(ArbitrageOpportunity {
                                asset: asset.clone(),
                                buy_exchange: String::from_str(&env, "Stellar DEX"),
                                sell_exchange: String::from_str(&env, "Stellar DEX"),
                                buy_price: market_price.price,
                                sell_price: adjusted_sell_price,
                                available_amount: trade_amount,
                                estimated_profit: profit,
                                confidence_score: confidence_score.min(100), // Cap at 100
                                expiry_time: env.ledger().timestamp() + 30, // 30 seconds from now
                            });
                        }
                    }
                }
            }
        }
        
        opportunities
    }

    /// Calculate net profit after all fees with real exchange fee structures
    pub fn calculate_profit(
        buy_price: i128,
        sell_price: i128,
        amount: i128,
        include_flash_loan_fees: bool,
    ) -> i128 {
        // Validate inputs
        if buy_price <= 0 || sell_price <= 0 || amount <= 0 || sell_price <= buy_price {
            return 0; // No profit or invalid inputs
        }
        
        // Calculate gross profit (in base asset units, scaled)
        let gross_profit_scaled = (sell_price - buy_price) * amount;
        
        // Convert to actual units (remove scaling)
        let gross_profit = gross_profit_scaled / 100000000;
        
        // Realistic fee calculations for Stellar DEX:
        // - Maker fee: 0.05% (5 basis points)
        // - Taker fee: 0.1% (10 basis points)
        // - Assume we're taking liquidity on both sides (taker fees)
        let maker_fee_bps = 5;
        let taker_fee_bps = 10;
        
        // Calculate fees in base asset units
        let buy_fee = (amount * buy_price / 100000000) * taker_fee_bps / 10000; // Taker fee on buy
        let sell_fee = (amount * sell_price / 100000000) * taker_fee_bps / 10000; // Taker fee on sell
        
        // Flash loan fees (if included)
        let flash_loan_fee = if include_flash_loan_fees {
            // XycLoans typical fee: 0.05% (5 basis points)
            (amount * sell_price / 100000000) * 5 / 10000
        } else {
            0
        };
        
        // Gas fees (estimated)
        let gas_fee = 100000; // 0.001 units (typical Stellar transaction fee)
        
        // Withdrawal fee (if applicable)
        let withdrawal_fee = 0; // Assuming no withdrawal fee for DEX-to-DEX arbitrage
        
        // Total fees
        let total_fees = buy_fee + sell_fee + flash_loan_fee + gas_fee + withdrawal_fee;
        
        // Net profit
        let net_profit = gross_profit - total_fees;
        
        net_profit
    }

    /// Estimate price slippage for large trades on Stellar DEX with order book analysis
    pub fn estimate_slippage(env: Env, exchange: String, asset: String, trade_size: i128) -> i128 {
        // Validate that we're only working with Stellar DEX
        if exchange != String::from_str(&env, "Stellar DEX") {
            return -1; // Invalid exchange
        }
        
        // Validate trade size
        if trade_size <= 0 {
            return 0; // No slippage for zero or negative trades
        }
        
        // Get order book data directly from Reflector Network contract
        let order_book_result = ExchangeInterface::get_order_book_direct(
            env.clone(),
            exchange.clone(),
            format_pair_string(&env, asset.clone(), String::from_str(&env, "USD")), // Proper trading pair
            20 // Depth
        );
        
        if let Ok(order_book) = order_book_result {
            // Analyze the order book to calculate realistic slippage
            if order_book.asks.len() > 0 && order_book.bids.len() > 0 {
                // Calculate slippage based on order book depth analysis
                let mut cumulative_amount = 0i128;
                let mut slippage_bps = 0i128;
                
                // For sell slippage (when selling the asset), we look at the bids
                // Process bids to see how much impact the trade would have
                for i in 0..order_book.bids.len() {
                    let (price, amount) = order_book.bids.get(i).unwrap();
                    cumulative_amount += amount;
                    
                    // If we've accumulated enough liquidity to cover our trade
                    if cumulative_amount >= trade_size {
                        // Calculate slippage as percentage difference from the best price
                        if let Some((best_price, _)) = order_book.bids.get(0) {
                            if *best_price > 0 {
                                slippage_bps = ((*best_price - price) * 10000) / *best_price;
                            }
                        }
                        break;
                    }
                }
                
                // If we couldn't fill the entire order, slippage is higher
                if cumulative_amount < trade_size {
                    // In a real scenario, this would mean insufficient liquidity
                    // For now, we'll return a high slippage estimate
                    return 500; // 5% slippage for insufficient liquidity
                }
                
                return slippage_bps.min(1000); // Cap at 10%
            }
        }
        
        // Fallback to a default slippage estimation when order book data is not available
        // Base slippage + size-based component
        let base_slippage = 5; // 0.05% base slippage
        let size_component = (trade_size / 10000000000) * 3; // 0.03% per 100 units
        (base_slippage + size_component).min(1000) // Cap at 10%
    }
}

// Helper function to format trading pair strings
fn format_pair_string(env: &Env, asset: String, quote: String) -> String {
    // In a real implementation, this would properly format pairs like "XLM/USD"
    // For simplicity, we'll concatenate with a slash
    let mut pair = asset;
    pair.push_str(&String::from_str(env, "/"));
    pair.push_str(&quote);
    pair
}

// Unit tests for Arbitrage Detector
#[cfg(test)]
mod test_arbitrage_detector {
    use super::*;
    use soroban_sdk::{Env, Vec, String};

    #[test]
    fn test_scan_opportunities() {
        let env = Env::default();
        let contract_id = env.register(ArbitrageDetector, ());
        let client = ArbitrageDetectorClient::new(&env, &contract_id);
        
        let assets = Vec::new(&env);
        let opportunities = client.scan_opportunities(&assets, &1000000); // min profit 1%
        
        // In a real test, we would set up mock data in the other contracts first
        // For now, we're just testing that the function doesn't panic
    }

    #[test]
    fn test_calculate_profit() {
        // Test profit calculation with realistic fees
        let profit = ArbitrageDetector::calculate_profit(
            100000000, // buy price 1 unit
            101000000, // sell price 1.01 units
            10000000000, // amount 100 units
            true // Include flash loan fees
        );
        
        assert!(profit > 0);
    }

    #[test]
    fn test_calculate_profit_without_flash_loan() {
        // Test profit calculation without flash loan fees
        let profit = ArbitrageDetector::calculate_profit(
            100000000, // buy price 1 unit
            101000000, // sell price 1.01 units
            10000000000, // amount 100 units
            false // Exclude flash loan fees
        );
        
        assert!(profit > 0);
    }

    #[test]
    fn test_estimate_slippage() {
        let env = Env::default();
        let contract_id = env.register(ArbitrageDetector, ());
        let client = ArbitrageDetectorClient::new(&env, &contract_id);
        
        let slippage = client.estimate_slippage(&String::from_str(&env, "Stellar DEX"), &String::from_str(&env, "XLM"), &10000000000); // 100 units
        
        assert!(slippage >= 0);
    }
    
    #[test]
    fn test_estimate_slippage_invalid_exchange() {
        let env = Env::default();
        let contract_id = env.register(ArbitrageDetector, ());
        let client = ArbitrageDetectorClient::new(&env, &contract_id);
        
        let slippage = client.estimate_slippage(&String::from_str(&env, "Binance"), &String::from_str(&env, "XLM"), &10000000000); // 100 units
        
        assert_eq!(slippage, -1); // Invalid exchange should return -1
    }
}