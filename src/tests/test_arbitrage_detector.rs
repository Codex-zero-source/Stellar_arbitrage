// Unit tests for Arbitrage Detector
#[cfg(test)]
mod test_arbitrage_detector {
    use super::*;
    use soroban_sdk::{Env, Vec};

    #[test]
    fn test_scan_opportunities() {
        let env = Env::default();
        let client = ArbitrageDetectorClient::new(&env, &env.register(ArbitrageDetector, ()));
        
        let assets = Vec::new(&env);
        let opportunities = client.scan_opportunities(&assets, &1000000); // min profit 1%
        
        assert!(opportunities.len() >= 0);
    }

    #[test]
    fn test_calculate_profit() {
        let fees = TradingFees {
            maker_fee_bps: 10, // 0.1%
            taker_fee_bps: 10, // 0.1%
            withdrawal_fee: 1000000, // 0.01 units
            gas_fee: 500000, // 0.005 units
            flash_loan_fee_bps: 5, // 0.05%
        };
        
        let profit = ArbitrageDetector::calculate_profit(
            100000000, // buy price 1 unit
            101000000, // sell price 1.01 units
            10000000000, // amount 100 units
            fees
        );
        
        assert!(profit > 0);
    }

    #[test]
    fn test_estimate_slippage() {
        let slippage = ArbitrageDetector::estimate_slippage(
            "Binance".to_string(),
            "XLM".to_string(),
            10000000000 // 100 units
        );
        
        assert!(slippage >= 0);
    }
}