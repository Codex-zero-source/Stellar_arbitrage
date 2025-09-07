#![no_std]
// Trading Execution Engine
// This module handles the actual execution of buy and sell orders
// on Stellar DEX with proper risk management

use soroban_sdk::{contract, contractclient, contractimpl, contracttype, contracterror, Env, String, Address};

#[derive(Clone)]
#[contracttype]
pub struct TradeOrder {
    pub asset: String,
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
    pub orders: soroban_sdk::Vec<TradeOrder>,
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
        path: soroban_sdk::Vec<Address>,
        deadline: u64,
    ) -> soroban_sdk::Vec<i64>;
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

        // This is a simplified logic. A real implementation would need to
        // transfer 'max_payment_amount' from the trader to this contract first.
        // For now, we assume this contract holds the funds.

        let dex_client = DexClient::new(&env, &dex_contract);
        let mut path = soroban_sdk::Vec::new(&env);
        path.push_back(payment_asset);
        path.push_back(target_asset);

        // We are doing a reverse swap: we know how much we want to receive (amount_to_buy),
        // so we need to calculate how much to pay. Most DEXs use `swap_exact_tokens_for_tokens`.
        // A full implementation would require a `get_amounts_in` call or similar.
        // For this example, we'll perform a forward swap, which is more common.
        // The caller is responsible for calculating the correct input amount.
        
        // Let's assume the `max_payment_amount` is the exact amount to be swapped.
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

        // Assumes this contract holds the 'amount_to_sell' of the 'target_asset'.
        // A real implementation would require a transfer from the trader first.

        let dex_client = DexClient::new(&env, &dex_contract);
        let mut path = soroban_sdk::Vec::new(&env);
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
    /// NOTE: The atomicity is guaranteed by Soroban. If any trade fails, the whole transaction reverts.
    pub fn batch_execute_trades(
        env: Env,
        params: BatchTradeParameters,
        trader: Address,
    ) -> Result<soroban_sdk::Vec<TradeResult>, TradingError> {
        trader.require_auth();

        if env.ledger().timestamp() > params.deadline {
            return Err(TradingError::DeadlineExceeded);
        }

        let mut results = soroban_sdk::Vec::new(&env);

        for order in params.orders.iter() {
            // NOTE: This assumes a pre-defined mapping from a String-based exchange
            // name to a contract Address. This is a placeholder for a real registry or lookup.
            let dex_contract = Address::from_string(&String::from_str(&env, "CDEX...PLACEHOLDER"));

            // NOTE: Asset strings also need to be resolved to Addresses. Placeholder logic.
            let asset_a = Address::from_string(&String::from_str(&env, "CASA...PLACEHOLDER_A"));
            let asset_b = Address::from_string(&String::from_str(&env, "CASB...PLACEHOLDER_B"));

            let buy_order = String::from_str(&env, "buy");
            let sell_order = String::from_str(&env, "sell");

            let result = if order.order_type == buy_order {
                Self::execute_buy_order(
                    env.clone(),
                    trader.clone(),
                    dex_contract,
                    asset_a, // payment_asset
                    asset_b, // target_asset
                    order.amount,
                    order.price_limit, // Interpreted as max_payment_amount
                    order.deadline,
                )
            } else if order.order_type == sell_order {
                Self::execute_sell_order(
                    env.clone(),
                    trader.clone(),
                    dex_contract,
                    asset_a, // target_asset
                    asset_b, // payment_asset
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
            _path: soroban_sdk::Vec<Address>,
            _deadline: u64,
        ) -> soroban_sdk::Vec<i64> {
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
        let payment_asset = Address::random(&env);
        let target_asset = Address::random(&env);

        (env, client, trader, dex_contract, payment_asset, target_asset)
    }

    #[test]
    fn test_execute_buy_order() {
        let (env, client, trader, dex_contract, payment_asset, target_asset) = setup_test();
        trader.require_auth();

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
        trader.require_auth();

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
        trader.require_auth();

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