// Cross-Chain Arbitrage Detector
// This module detects arbitrage opportunities between Stellar DEX and Uniswap

use soroban_sdk::{contract, contractimpl, contracttype, Env, Vec, String};

// Import other contracts for cross-contract calls
use crate::exchange_interface::{ExchangeInterface, MarketPrice};
use crate::uniswap_interface::{UniswapInterface, UniswapPrice};
use crate::reflector_oracle_client::{ReflectorOracleClient, PriceData};

#[contracttype]
pub struct CrossChainArbitrageOpportunity {
    pub asset: String,
    pub buy_chain: String,
    pub sell_chain: String,
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
pub struct CrossChainTradingFees {
    pub maker_fee_bps: i128,
    pub taker_fee_bps: i128,
    pub withdrawal_fee: i128,
    pub gas_fee: i128,
    pub flash_loan_fee_bps: i128,
    pub cross_chain_fee: i128,
}

#[contract]
pub struct CrossChainArbitrageDetector;

#[contractimpl]
impl CrossChainArbitrageDetector {
    /// Scan for cross-chain arbitrage opportunities between Stellar and Ethereum using direct Reflector integration
    pub fn scan_cross_chain_opportunities(env: Env, assets: Vec<String>, min_profit: i128) -> Vec<CrossChainArbitrageOpportunity> {
        let mut opportunities: Vec<CrossChainArbitrageOpportunity> = Vec::new(&env);
        
        // For each asset, check for cross-chain arbitrage opportunities
        for i in 0..assets.len() {
            let asset = assets.get(i).unwrap();
            
            // Get price from Stellar DEX directly from Reflector Network contract
            let stellar_pair = format_pair_string(&env, asset.clone(), String::from_str(&env, "USD"));
            let stellar_price_result = ExchangeInterface::get_market_price_direct(
                env.clone(),
                String::from_str(&env, "Stellar DEX"),
                stellar_pair.clone()
            );
            
            // Get price from Uniswap directly from Reflector Network contract
            let uniswap_pair = format_uniswap_pair_string(&env, asset.clone(), String::from_str(&env, "USD"));
            let uniswap_price_result = UniswapInterface::get_uniswap_price_direct(
                env.clone(),
                uniswap_pair.clone()
            );
            
            // Get oracle prices for validation
            let stellar_oracle_result = ReflectorOracleClient::fetch_latest_price_direct(
                env.clone(),
                asset.clone(),
                String::from_str(&env, "Stellar DEX")
            );
            
            let uniswap_oracle_result = ReflectorOracleClient::fetch_latest_price_direct(
                env.clone(),
                asset.clone(),
                String::from_str(&env, "Uniswap")
            );
            
            match (stellar_price_result, uniswap_price_result, stellar_oracle_result, uniswap_oracle_result) {
                (Ok(stellar_price), Ok(uniswap_price), Ok(stellar_oracle), Ok(uniswap_oracle)) => {
                    // Validate prices with oracles (manipulation detection)
                    let stellar_valid = ReflectorOracleClient::validate_price_deviation(
                        stellar_price.price,
                        stellar_oracle.price,
                        500 // 5% max deviation (500 bps)
                    );
                    
                    let uniswap_valid = ReflectorOracleClient::validate_price_deviation(
                        uniswap_price.price,
                        uniswap_oracle.price,
                        500 // 5% max deviation (500 bps)
                    );
                    
                    if stellar_valid && uniswap_valid {
                        // Calculate potential profit (using a fixed amount for demonstration)
                        let trade_amount = 10000000000; // 100 units (scaled)
                        
                        // Calculate profit with realistic fee structure
                        let fees = CrossChainTradingFees {
                            maker_fee_bps: 5,   // 0.05% maker fee
                            taker_fee_bps: 10,  // 0.1% taker fee
                            withdrawal_fee: 1000000, // 0.01 units
                            gas_fee: 500000,    // 0.005 units
                            flash_loan_fee_bps: 5,   // 0.05% flash loan fee
                            cross_chain_fee: 20,     // 0.2% cross-chain fee
                        };
                        
                        let profit = Self::calculate_cross_chain_profit(
                            stellar_price.price,
                            uniswap_price.price,
                            trade_amount,
                            fees
                        );
                        
                        // Only include opportunities that meet minimum profit requirement
                        if profit >= min_profit {
                            // Calculate confidence score based on price deviations and liquidity
                            let stellar_deviation_bps = ((stellar_price.price - stellar_oracle.price).abs() * 10000) 
                                / stellar_oracle.price;
                            let uniswap_deviation_bps = ((uniswap_price.price - uniswap_oracle.price).abs() * 10000) 
                                / uniswap_oracle.price;
                            
                            let price_confidence = 100 - (stellar_deviation_bps + uniswap_deviation_bps) / 2;
                            let liquidity_confidence = 85; // Placeholder based on liquidity analysis
                            let confidence_score = (price_confidence + liquidity_confidence) / 2;
                            
                            opportunities.push_back(CrossChainArbitrageOpportunity {
                                asset: asset.clone(),
                                buy_chain: String::from_str(&env, "Stellar"),
                                sell_chain: String::from_str(&env, "Ethereum"),
                                buy_exchange: String::from_str(&env, "Stellar DEX"),
                                sell_exchange: String::from_str(&env, "Uniswap"),
                                buy_price: stellar_price.price,
                                sell_price: uniswap_price.price,
                                available_amount: trade_amount,
                                estimated_profit: profit,
                                confidence_score: confidence_score.min(100), // Cap at 100
                                expiry_time: env.ledger().timestamp() + 30, // 30 seconds from now
                            });
                        }
                    }
                }
                _ => {
                    // Failed to get prices from one or more sources
                    // Continue to next asset
                    continue;
                }
            }
        }
        
        opportunities
    }

    /// Calculate net profit after all fees for cross-chain arbitrage
    pub fn calculate_cross_chain_profit(
        buy_price: i128,
        sell_price: i128,
        amount: i128,
        fees: CrossChainTradingFees,
    ) -> i128 {
        // Validate inputs
        if buy_price <= 0 || sell_price <= 0 || amount <= 0 || sell_price <= buy_price {
            return 0; // No profit or invalid inputs
        }
        
        // Calculate gross profit (in base asset units, scaled)
        let gross_profit_scaled = (sell_price - buy_price) * amount;
        
        // Convert to actual units (remove scaling)
        let gross_profit = gross_profit_scaled / 100000000;
        
        // Calculate fees in base asset units
        let maker_fee = gross_profit * fees.maker_fee_bps / 10000; // Maker fee on sell side
        let taker_fee = gross_profit * fees.taker_fee_bps / 10000; // Taker fee on buy side
        let flash_loan_fee = gross_profit * fees.flash_loan_fee_bps / 10000; // Flash loan fee
        let cross_chain_fee = gross_profit * fees.cross_chain_fee / 10000; // Cross-chain transfer fee
        
        // Total fees
        let total_fees = maker_fee + taker_fee + flash_loan_fee + cross_chain_fee + fees.gas_fee + fees.withdrawal_fee;
        
        // Net profit
        let net_profit = gross_profit - total_fees;
        
        net_profit
    }

    /// Estimate cross-chain transaction time
    pub fn estimate_cross_chain_time(_chain_a: String, _chain_b: String) -> i128 {
        // Implementation for cross-chain time estimation
        300 // 5 minutes in seconds
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

// Unit tests for Cross-Chain Arbitrage Detector
#[cfg(test)]
mod test_cross_chain_arbitrage_detector {
    use super::*;
    use soroban_sdk::{Env, Vec, String};

    #[test]
    fn test_scan_cross_chain_opportunities() {
        let env = Env::default();
        let contract_id = env.register(CrossChainArbitrageDetector, ());
        let client = CrossChainArbitrageDetectorClient::new(&env, &contract_id);
        
        let assets = Vec::new(&env);
        let opportunities = client.scan_cross_chain_opportunities(&assets, &1000000); // min profit 1%
        
    }

    #[test]
    fn test_calculate_cross_chain_profit() {
        let fees = CrossChainTradingFees {
            maker_fee_bps: 10, // 0.1%
            taker_fee_bps: 10, // 0.1%
            withdrawal_fee: 1000000, // 0.01 units
            gas_fee: 500000, // 0.005 units
            flash_loan_fee_bps: 5, // 0.05%
            cross_chain_fee: 20, // 0.2%
        };
        
        let profit = CrossChainArbitrageDetector::calculate_cross_chain_profit(
            100000000, // buy price 1 unit
            102000000, // sell price 1.02 units
            10000000000, // amount 100 units
            fees
        );
        
        assert!(profit > 0);
    }

    #[test]
    fn test_estimate_cross_chain_time() {
        let env = Env::default();
        let contract_id = env.register(CrossChainArbitrageDetector, ());
        let client = CrossChainArbitrageDetectorClient::new(&env, &contract_id);
        
        let time_estimate = client.estimate_cross_chain_time(
            &String::from_str(&env, "Stellar"),
            &String::from_str(&env, "Ethereum")
        );
        
        assert!(time_estimate > 0);
    }
}