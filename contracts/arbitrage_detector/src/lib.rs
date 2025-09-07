#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contractclient, Env, Vec, String, log, Address};

// Import the Reflector Oracle client
use reflector_oracle_client::{ReflectorOracleClient, OracleError, PriceData, OrderBookData};

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

// Implement Clone for ArbitrageOpportunity
impl Clone for ArbitrageOpportunity {
    fn clone(&self) -> Self {
        Self {
            asset: self.asset.clone(),
            buy_exchange: self.buy_exchange.clone(),
            sell_exchange: self.sell_exchange.clone(),
            buy_price: self.buy_price,
            sell_price: self.sell_price,
            available_amount: self.available_amount,
            estimated_profit: self.estimated_profit,
            confidence_score: self.confidence_score,
            expiry_time: self.expiry_time,
        }
    }
}

#[contracttype]
pub struct TradingFees {
    pub maker_fee_bps: i128,
    pub taker_fee_bps: i128,
    pub withdrawal_fee: i128,
    pub gas_fee: i128,
    pub flash_loan_fee_bps: i128,
}

// Interface for Exchange contract
#[contractclient(name = "ExchangeClient")]
pub trait ExchangeInterface {
    fn get_market_price(env: Env, exchange: String, pair: String) -> Result<MarketPrice, ExchangeError>;
    fn get_order_book(env: Env, exchange: String, pair: String, depth: u32) -> Result<OrderBook, ExchangeError>;
}

#[contracttype]
pub struct MarketPrice {
    pub price: i128,
    pub timestamp: u64,
}

#[contracterror]
pub enum ExchangeError {
    NetworkError = 1,
    InvalidData = 2,
}

#[contracttype]
pub struct OrderBook {
    pub bids: Vec<(i128, i128)>, // price, amount
    pub asks: Vec<(i128, i128)>, // price, amount
}

#[contract]
pub struct ArbitrageDetector;

#[contractimpl]
impl ArbitrageDetector {
    /// Scan for arbitrage opportunities between Reflector oracle and Stellar DEX
    pub fn scan_opportunities(env: Env, assets: Vec<String>, min_profit: i128, exchange_address: Address) -> Vec<ArbitrageOpportunity> {
        log!(&env, "scan_opportunities called with assets.len(): {}, min_profit: {}", 
             assets.len(), min_profit);
        
        let mut opportunities: Vec<ArbitrageOpportunity> = Vec::new(&env);

        // Log the assets we received
        for i in 0..assets.len() {
            if let Some(asset) = assets.get(i) {
                log!(&env, "Asset {}: {}", i, asset);
            }
        }

        // If no assets provided, return empty opportunities list
        if assets.len() == 0 {
            log!(&env, "No assets provided, returning empty opportunities list");
            return opportunities;
        }

        // Create Reflector Oracle client
        let oracle_client = ReflectorOracleClient::new(&env, &env.invoker().unwrap());
        
        // Create Exchange client
        let exchange_client = ExchangeClient::new(&env, &exchange_address);

        // For each asset, check for arbitrage opportunities
        for i in 0..assets.len() {
            let asset = assets.get(i).unwrap();
            
            // Get price from Reflector Oracle
            let oracle_result = oracle_client.try_get_price_and_timestamp(asset.clone());
            
            if let Ok(Ok((oracle_price, oracle_timestamp))) = oracle_result {
                // Get price from Stellar DEX
                let pair = Self::create_trading_pair(&env, &asset);
                let exchange_result = exchange_client.try_get_market_price(
                    String::from_str(&env, "Stellar DEX"), 
                    pair.clone()
                );
                
                if let Ok(Ok(exchange_price)) = exchange_result {
                    // Calculate potential profit
                    let price_diff = (exchange_price.price - oracle_price).abs();
                    let estimated_profit = price_diff * 1000000; // Estimate based on 1M units
                    
                    // Create arbitrage opportunity if profitable
                    if estimated_profit >= min_profit {
                        let opportunity = ArbitrageOpportunity {
                            asset: asset.clone(),
                            buy_exchange: if exchange_price.price < oracle_price {
                                String::from_str(&env, "Stellar DEX")
                            } else {
                                String::from_str(&env, "Reflector Oracle")
                            },
                            sell_exchange: if exchange_price.price < oracle_price {
                                String::from_str(&env, "Reflector Oracle")
                            } else {
                                String::from_str(&env, "Stellar DEX")
                            },
                            buy_price: if exchange_price.price < oracle_price {
                                exchange_price.price
                            } else {
                                oracle_price
                            },
                            sell_price: if exchange_price.price < oracle_price {
                                oracle_price
                            } else {
                                exchange_price.price
                            },
                            available_amount: 10000000000, // 100 units (scaled)
                            estimated_profit,
                            confidence_score: 90,
                            expiry_time: env.ledger().timestamp() + 30, // 30 seconds expiry
                        };
                        
                        log!(&env, "Added opportunity for asset: {}, profit: {}", asset, opportunity.estimated_profit);
                        opportunities.push_back(opportunity);
                    }
                }
            }
        }

        log!(&env, "Total opportunities found: {}", opportunities.len());
        opportunities
    }

    /// Calculate net profit after all fees
    pub fn calculate_profit(
        buy_price: i128,
        sell_price: i128,
        amount: i128,
        fees: TradingFees,
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
        let buy_fee = (amount * buy_price / 100000000) * fees.taker_fee_bps / 10000; // Taker fee on buy
        let sell_fee = (amount * sell_price / 100000000) * fees.taker_fee_bps / 10000; // Taker fee on sell
        
        // Flash loan fees (if included)
        let flash_loan_fee = (amount * sell_price / 100000000) * fees.flash_loan_fee_bps / 10000;
        
        // Gas fees
        let gas_fee = fees.gas_fee;
        
        // Withdrawal fee (if applicable)
        let withdrawal_fee = fees.withdrawal_fee;
        
        // Total fees
        let total_fees = buy_fee + sell_fee + flash_loan_fee + gas_fee + withdrawal_fee;
        
        // Net profit
        let net_profit = gross_profit - total_fees;
        
        net_profit.max(0) // Ensure we don't return negative profit
    }

    /// Estimate price slippage for large trades on Stellar DEX
    pub fn estimate_slippage(env: Env, exchange_address: Address, asset: String, trade_size: i128) -> i128 {
        // Create Exchange client
        let exchange_client = ExchangeClient::new(&env, &exchange_address);
        
        // Get order book data
        let pair = Self::create_trading_pair(&env, &asset);
        let result = exchange_client.try_get_order_book(
            String::from_str(&env, "Stellar DEX"),
            pair,
            10 // Depth of 10 levels
        );
        
        if let Ok(Ok(order_book)) = result {
            // Calculate slippage based on order book depth
            let mut cumulative_amount = 0i128;
            let mut weighted_price = 0i128;
            
            // For sell orders, we look at the bid side of the order book
            for (price, amount) in order_book.bids.iter() {
                if cumulative_amount + amount > trade_size {
                    // This level will be partially filled
                    let remaining_amount = trade_size - cumulative_amount;
                    weighted_price += price * remaining_amount;
                    cumulative_amount = trade_size;
                    break;
                } else {
                    // This level will be fully filled
                    weighted_price += price * amount;
                    cumulative_amount += amount;
                }
                
                if cumulative_amount >= trade_size {
                    break;
                }
            }
            
            if cumulative_amount > 0 {
                let average_price = weighted_price / cumulative_amount;
                // Calculate slippage as percentage
                // We need a reference price - let's use the best bid
                if !order_book.bids.is_empty() {
                    let best_bid = order_book.bids.get(0).unwrap().0;
                    if best_bid > 0 {
                        let slippage_bps = ((best_bid - average_price) * 10000) / best_bid;
                        return slippage_bps;
                    }
                }
            }
        }
        
        // Default slippage if we can't calculate
        5 // 0.05% slippage
    }
    
    /// Helper function to create trading pair string
    fn create_trading_pair(env: &Env, asset: &String) -> String {
        // For now, we'll assume all assets are traded against XLM
        // In a real implementation, this would be more sophisticated
        let mut pair = asset.clone();
        pair.push_str(&String::from_str(env, "/XLM"));
        pair
    }
}

#[cfg(test)]
mod test_arbitrage_detector {
    use super::*;
    use soroban_sdk::{Env, Vec, String};

    #[test]
    fn test_scan_opportunities() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ArbitrageDetector);
        let client = ArbitrageDetectorClient::new(&env, &contract_id);
        
        let mut assets = Vec::new(&env);
        assets.push_back(String::from_str(&env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG")); // AQUA
        assets.push_back(String::from_str(&env, "CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS")); // yUSDC
        
        // For testing, we need to register the exchange contract
        let exchange_id = env.register_contract(None, crate::ExchangeInterface);
        
        let opportunities = client.scan_opportunities(&assets, &100000, &exchange_id);
        // We should get opportunities for both assets
        assert!(opportunities.len() >= 1);
    }

    #[test]
    fn test_calculate_profit() {
        let fees = TradingFees {
            maker_fee_bps: 5,
            taker_fee_bps: 10,
            withdrawal_fee: 100000,
            gas_fee: 100000,
            flash_loan_fee_bps: 5,
        };
        let profit = ArbitrageDetector::calculate_profit(100000000, 101000000, 10000000000, fees);
        assert!(profit > 0);
    }

    #[test]
    fn test_estimate_slippage() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ArbitrageDetector);
        let client = ArbitrageDetectorClient::new(&env, &contract_id);
        
        // For testing, we need to register the exchange contract
        let exchange_id = env.register_contract(None, crate::ExchangeInterface);
        
        let slippage = client.estimate_slippage(&exchange_id, &String::from_str(&env, "XLM"), &10000000000);
        assert!(slippage >= 0);
    }
}