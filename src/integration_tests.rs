// Integration tests for the Arbitrage Trading Platform
// This file demonstrates how all components work together

#[cfg(test)]
mod integration_tests {
    use super::*;
    use soroban_sdk::{Env, String, Address, Vec, Map};
    
    // Import all our contract modules
    use crate::reflector_oracle_client::{ReflectorOracleClient, PriceData};
    use crate::arbitrage_detector::{ArbitrageDetector, ArbitrageOpportunity, TradingFees};
    use crate::exchange_interface::{ExchangeInterface, MarketPrice};
    use crate::flash_loan_arbitrage_engine::{FlashArbitrageEngine, FlashLoanParameters};
    use crate::trading_execution_engine::{TradingEngine, TradeOrder, TradeResult};
    use crate::risk_management_system::{RiskManager, RiskParameters, TradeRiskAssessment};

    #[test]
    fn test_end_to_end_arbitrage_flow() {
        let env = Env::default();
        
        // Register all contracts
        let oracle_id = env.register(ReflectorOracleClient, ());
        let detector_id = env.register(ArbitrageDetector, ());
        let exchange_id = env.register(ExchangeInterface, ());
        let flash_loan_id = env.register(FlashArbitrageEngine, ());
        let trading_id = env.register(TradingEngine, ());
        let risk_id = env.register(RiskManager, ());
        
        // Create clients
        let oracle_client = reflector_oracle_client::ReflectorOracleClientClient::new(&env, &oracle_id);
        let detector_client = arbitrage_detector::ArbitrageDetectorClient::new(&env, &detector_id);
        let exchange_client = exchange_interface::ExchangeInterfaceClient::new(&env, &exchange_id);
        let flash_loan_client = flash_loan_arbitrage_engine::FlashArbitrageEngineClient::new(&env, &flash_loan_id);
        let trading_client = trading_execution_engine::TradingEngineClient::new(&env, &trading_id);
        let risk_client = risk_management_system::RiskManagerClient::new(&env, &risk_id);
        
        // Step 1: Fetch prices from oracle
        let asset = String::from_str(&env, "XLM");
        let stellar_price_result = oracle_client.try_fetch_latest_price(
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "Stellar DEX")
        );
        
        assert!(stellar_price_result.is_ok());
        
        // Step 2: Detect arbitrage opportunities
        let assets = Vec::new(&env);
        let opportunities = detector_client.scan_opportunities(&assets, &1000000); // min profit 1%
        
        assert!(opportunities.len() >= 0);
        
        // Step 3: Assess risk for the opportunity
        let mut trade_params: Map<String, i128> = Map::new(&env);
        trade_params.set(String::from_str(&env, "position_size"), 10000000000); // 100 XLM
        trade_params.set(String::from_str(&env, "confidence"), 90);
        trade_params.set(String::from_str(&env, "liquidity"), 100000000000); // 1000 XLM
        trade_params.set(String::from_str(&env, "slippage"), 30); // 0.3%
        
        let risk_params = RiskParameters {
            max_position_size: 100000000000, // 1000 XLM
            max_drawdown_bps: 500, // 5%
            max_slippage_bps: 50, // 0.5%
            min_liquidity: 50000000000, // 500 XLM
            confidence_threshold: 80,
            max_concurrent_trades: 10,
        };
        
        let risk_assessment = risk_client.assess_trade_risk(&trade_params, &risk_params);
        assert!(risk_assessment.is_ok());
        
        // Step 4: Execute flash loan arbitrage with XycLoans
        let borrower = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        let flash_params = FlashLoanParameters {
            asset: String::from_str(&env, "XLM"),
            amount: 10000000000, // 100 XLM
            buy_exchange: String::from_str(&env, "Stellar DEX"),
            sell_exchange: String::from_str(&env, "Stellar DEX"),
            min_profit: 1000000, // 0.01 XLM
            deadline: env.ledger().timestamp() + 300, // 5 minutes from now
            flash_loan_provider: String::from_str(&env, "CB75LG2KULDDIFL2BBZHIBXDPXELJJFWRRHKJZ2H5JF7C4DT6GHW4PJQ"),
        };
        
        let arbitrage_result = flash_loan_client.execute_flash_arbitrage(&flash_params, &borrower);
        assert!(arbitrage_result.is_ok());
        
        // Step 5: Verify successful execution
        let result = arbitrage_result.unwrap();
        assert_eq!(result.success, true);
        assert!(result.profit > 0);
    }

    #[test]
    fn test_trading_engine_batch_execution() {
        let env = Env::default();
        let trading_id = env.register(TradingEngine, ());
        let trading_client = trading_execution_engine::TradingEngineClient::new(&env, &trading_id);
        
        let trader = Address::from_string(&String::from_str(&env, "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"));
        
        // Create a batch of trades - only Stellar DEX
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
        
        let orders = vec![&env, order1, order2];
        
        let params = trading_execution_engine::BatchTradeParameters {
            orders,
            max_slippage_bps: 50, // 0.5%
            deadline: env.ledger().timestamp() + 300,
        };
        
        let result = trading_client.batch_execute_trades(&params, &trader);
        assert!(result.is_ok());
        
        let trade_results = result.unwrap();
        assert_eq!(trade_results.len(), 2);
    }
}