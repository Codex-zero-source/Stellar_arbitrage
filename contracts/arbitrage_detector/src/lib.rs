#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Vec, String, log};

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

#[contract]
pub struct ArbitrageDetector;

#[contractimpl]
impl ArbitrageDetector {
    /// Scan for arbitrage opportunities between Reflector oracle and Stellar DEX
    pub fn scan_opportunities(env: Env, assets: Vec<String>, min_profit: i128) -> Vec<ArbitrageOpportunity> {
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

        // For each asset, check for arbitrage opportunities
        for i in 0..assets.len() {
            let asset = assets.get(i).unwrap();
            
            // Get price from Reflector Oracle
            // In a real implementation, this would call the ReflectorOracleClient contract
            // For now, we'll create mock opportunities
            
            log!(&env, "Creating test opportunity for asset: {}", asset);
            
            let opportunity = ArbitrageOpportunity {
                asset: asset.clone(),
                buy_exchange: String::from_str(&env, "Stellar DEX"),
                sell_exchange: String::from_str(&env, "Stellar DEX"),
                buy_price: 5_0000000,  // 0.05 BTC/USDC
                sell_price: 5_1000000, // 0.051 BTC/USDC (1% higher)
                available_amount: 1000000,
                estimated_profit: 100000, // 0.001 BTC profit
                confidence_score: 90,
                expiry_time: env.ledger().timestamp() + 30, // 30 seconds expiry
            };
            
            // Only include opportunities that meet minimum profit requirement
            if opportunity.estimated_profit >= min_profit {
                log!(&env, "Added opportunity for asset: {}, profit: {}", asset, opportunity.estimated_profit);
                opportunities.push_back(opportunity);
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
    pub fn estimate_slippage(env: Env, exchange: String, _asset: String, _trade_size: i128) -> i128 {
        if exchange != String::from_str(&env, "Stellar DEX") {
            return -1;
        }
        // Simple fixed slippage for testing
        5 // 0.05% slippage
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
        assets.push_back(String::from_str(&env, "BTC"));
        assets.push_back(String::from_str(&env, "USDC"));
        
        let opportunities = client.scan_opportunities(&assets, &100000);
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
        let slippage = client.estimate_slippage(&String::from_str(&env, "Stellar DEX"), &String::from_str(&env, "XLM"), &10000000000);
        assert!(slippage >= 0);
    }

    #[test]
    fn test_estimate_slippage_invalid_exchange() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ArbitrageDetector);
        let client = ArbitrageDetectorClient::new(&env, &contract_id);
        let slippage = client.estimate_slippage(&String::from_str(&env, "Binance"), &String::from_str(&env, "XLM"), &10000000000);
        assert_eq!(slippage, -1);
    }
}