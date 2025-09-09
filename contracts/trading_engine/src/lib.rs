#![no_std]
// Trading Execution Engine
// This module handles the actual execution of buy and sell orders
// on Stellar DEX with proper risk management

use soroban_sdk::{contract, contractclient, contractimpl, contracttype, contracterror, Env, String, Address, Vec};

#[derive(Clone)]
#[contracttype]
pub struct TradeOrder {
    pub asset: Address,
    pub exchange: String,
    pub amount: i64,
    pub price_limit: i64, // Maximum buy price or minimum sell price
    pub order_type: String, // "buy" or "sell"
    pub deadline: u64,
    pub trader: Address,
}

#[contracttype]
pub struct TradeResult {
    pub success: bool,
    pub executed_amount: i64,
    pub average_price: i64,
    pub fees_paid: i64,
    pub timestamp: u64,
    pub error_message: String,
}

#[contracttype]
pub struct BatchTradeParameters {
    pub orders: Vec<TradeOrder>,
    pub max_slippage_bps: i64, // in basis points
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

// Interface for a standard DEX contract
#[contractclient(name = "DexClient")]
pub trait Dex {
    fn swap_exact_tokens_for_tokens(
        env: Env,
        trader: Address,
        amount_in: i64,
        amount_out_min: i64,
        path: Vec<Address>,
        deadline: u64,
    ) -> Vec<i64>;
}

#[contract]
pub struct TradingEngine;

#[contractimpl]
impl TradingEngine {
    /// Executes a buy order by swapping a 'payment_asset' for a 'target_asset'.
    pub fn execute_buy_order(
        env: Env,
        trader: Address,
        dex_contract: Address,
        payment_asset: Address,
        target_asset: Address,
        amount_to_buy: i64,
        max_payment_amount: i64,
        deadline: u64,
    ) -> Result<TradeResult, TradingError> {
        trader.require_auth();

        if env.ledger().timestamp() > deadline {
            return Err(TradingError::DeadlineExceeded);
        }

        let dex_client = DexClient::new(&env, &dex_contract);
        let mut path = Vec::new(&env);
        path.push_back(payment_asset);
        path.push_back(target_asset);

        let amounts = dex_client.swap_exact_tokens_for_tokens(
            &trader.clone(),
            &max_payment_amount,
            &amount_to_buy, // Minimum amount of target_asset to receive
            &path,
            &deadline,
        );

        let amount_paid = amounts.get(0).unwrap_or(0);
        let amount_received = amounts.get(1).unwrap_or(0);

        if amount_received < amount_to_buy {
            return Err(TradingError::SlippageTooHigh);
        }

        Ok(TradeResult {
            success: true,
            executed_amount: amount_received,
            average_price: amount_paid / amount_received, // Simplified price
            fees_paid: 0, // The DEX handles fees internally
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
        })
    }

    /// Executes a sell order by swapping a 'target_asset' for a 'payment_asset'.
    pub fn execute_sell_order(
        env: Env,
        trader: Address,
        dex_contract: Address,
        target_asset: Address,
        payment_asset: Address,
        amount_to_sell: i64,
        min_payment_amount: i64,
        deadline: u64,
    ) -> Result<TradeResult, TradingError> {
        trader.require_auth();

        if env.ledger().timestamp() > deadline {
            return Err(TradingError::DeadlineExceeded);
        }

        let dex_client = DexClient::new(&env, &dex_contract);
        let mut path = Vec::new(&env);
        path.push_back(target_asset);
        path.push_back(payment_asset);

        let amounts = dex_client.swap_exact_tokens_for_tokens(
            &trader,
            &amount_to_sell,
            &min_payment_amount, // Minimum amount of payment_asset to receive
            &path,
            &deadline,
        );
        
        let amount_sold = amounts.get(0).unwrap_or(0);
        let amount_received = amounts.get(1).unwrap_or(0);

        if amount_received < min_payment_amount {
            return Err(TradingError::SlippageTooHigh);
        }

        Ok(TradeResult {
            success: true,
            executed_amount: amount_sold,
            average_price: amount_received / amount_sold, // Simplified price
            fees_paid: 0, // The DEX handles fees internally
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
        })
    }

    /// Execute multiple trades atomically.
    pub fn batch_execute_trades(
        env: Env,
        params: BatchTradeParameters,
        trader: Address,
    ) -> Result<Vec<TradeResult>, TradingError> {
        trader.require_auth();

        if env.ledger().timestamp() > params.deadline {
            return Err(TradingError::DeadlineExceeded);
        }

        let mut results = Vec::new(&env);

        for order in params.orders.iter() {
            let dex_contract = env.storage().persistent().get(&order.exchange).unwrap();

            let buy_order = String::from_str(&env, "buy");
            let sell_order = String::from_str(&env, "sell");

            let result = if order.order_type == buy_order {
                Self::execute_buy_order(
                    env.clone(),
                    trader.clone(),
                    dex_contract,
                    env.storage().persistent().get(&String::from_str(&env, "YUSDC")).unwrap(), // payment_asset
                    order.asset, // target_asset
                    order.amount,
                    order.price_limit, // Interpreted as max_payment_amount
                    order.deadline,
                )
            } else if order.order_type == sell_order {
                Self::execute_sell_order(
                    env.clone(),
                    trader.clone(),
                    dex_contract,
                    order.asset, // target_asset
                    env.storage().persistent().get(&String::from_str(&env, "YUSDC")).unwrap(), // payment_asset
                    order.amount,
                    order.price_limit, // Interpreted as min_payment_amount
                    order.deadline,
                )
            } else {
                return Err(TradingError::InvalidOrderType);
            };

            match result {
                Ok(trade_result) => results.push_back(trade_result),
                Err(e) => return Err(e),
            }
        }

        Ok(results)
    }
}

#[cfg(test)]
mod test_trading_engine {
    use super::*;
    use soroban_sdk::{Env, String, Address, Vec, testutils::{Address as _, Ledger as _}};

    // Mock DEX contract for testing
    #[contract]
    pub struct MockDex;

    #[contractimpl]
    impl Dex for MockDex {
        fn swap_exact_tokens_for_tokens(
            _env: Env,
            _trader: Address,
            amount_in: i64,
            _amount_out_min: i64,
            _path: Vec<Address>,
            _deadline: u64,
        ) -> Vec<i64> {
            let mut amounts = Vec::new(&_env);
            amounts.push_back(amount_in);
            amounts.push_back(amount_in * 99 / 100); // Simulate 1% slippage
            amounts
        }
    }

    fn setup_test<'a>() -> (Env, TradingEngineClient<'a>, Address, Address, Address, Address) {
        let env = Env::default();
        env.ledger().with_mut(|li| {
            li.timestamp = 12345;
        });

        let contract_id = env.register_contract(None, TradingEngine);
        let client = TradingEngineClient::new(&env, &contract_id);

        let trader = Address::random(&env);
        let dex_contract = env.register_contract(None, MockDex);
        let payment_asset = Address::from_string(&String::from_str(&env, "CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS"));
        let target_asset = Address::from_string(&String::from_str(&env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"));

        env.storage().persistent().set(&String::from_str(&env, "stellar_dex"), &dex_contract);
        env.storage().persistent().set(&String::from_str(&env, "YUSDC"), &payment_asset);

        (env, client, trader, dex_contract, payment_asset, target_asset)
    }

    #[test]
    fn test_execute_buy_order() {
        let (env, client, trader, dex_contract, payment_asset, target_asset) = setup_test();

        let amount_to_buy = 100_0000000; // 100 units
        let max_payment_amount = 101_0000000; // 101 units
        let deadline = env.ledger().timestamp() + 100;

        let result = client.execute_buy_order(
            &trader,
            &dex_contract,
            &payment_asset,
            &target_asset,
            &amount_to_buy,
            &max_payment_amount,
            &deadline,
        );

        assert!(result.is_ok());
        let trade_result = result.unwrap();
        assert!(trade_result.success);
        assert_eq!(trade_result.executed_amount, max_payment_amount * 99 / 100);
    }

    #[test]
    fn test_execute_sell_order() {
        let (env, client, trader, dex_contract, payment_asset, target_asset) = setup_test();

        let amount_to_sell = 100_0000000; // 100 units
        let min_payment_amount = 99_0000000; // 99 units
        let deadline = env.ledger().timestamp() + 100;

        let result = client.execute_sell_order(
            &trader,
            &dex_contract,
            &target_asset,
            &payment_asset,
            &amount_to_sell,
            &min_payment_amount,
            &deadline,
        );

        assert!(result.is_ok());
        let trade_result = result.unwrap();
        assert!(trade_result.success);
        assert_eq!(trade_result.executed_amount, amount_to_sell);
    }

    #[test]
    fn test_deadline_exceeded() {
        let (env, client, trader, dex_contract, payment_asset, target_asset) = setup_test();

        let amount_to_buy = 100_0000000;
        let max_payment_amount = 101_0000000;
        let deadline = env.ledger().timestamp() - 1; // Deadline in the past

        let result = client.try_execute_buy_order(
            &trader,
            &dex_contract,
            &payment_asset,
            &target_asset,
            &amount_to_buy,
            &max_payment_amount,
            &deadline,
        );

        assert_eq!(result, Err(Ok(TradingError::DeadlineExceeded)));
    }
}
