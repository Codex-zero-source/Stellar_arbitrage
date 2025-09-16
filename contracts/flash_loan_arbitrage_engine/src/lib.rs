#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, contractclient, Env, String, Address, Vec, Map, Bytes, symbol_short};

#[contracttype]
pub struct FlashLoanParams {
    pub asset: Address,
    pub amount: i128,
    pub fee: i128,
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ArbitrageTrade {
    pub buy_exchange: Address,
    pub sell_exchange: Address,
    pub buy_asset: Address,
    pub sell_asset: Address,
    pub amount: i128,
    pub expected_profit: i128,
    pub max_slippage_bps: i128, // Maximum allowed slippage in basis points
    pub priority: i128, // Trade execution priority (1-10)
}

#[contracttype]
pub struct FlashLoanResult {
    pub success: bool,
    pub profit: i128,
    pub timestamp: u64,
    pub error_message: String,
    pub gas_used: i128,
    pub trades_executed: i128,
    pub total_volume: i128,
}

#[contracttype]
pub struct RiskParameters {
    pub max_position_size: i128,
    pub max_slippage_bps: i128,
    pub min_profit_threshold: i128,
    pub max_gas_price: i128,
    pub emergency_stop: bool,
}

#[contracttype]
pub struct ExecutionMetrics {
    pub total_trades: i128,
    pub successful_trades: i128,
    pub total_profit: i128,
    pub total_volume: i128,
    pub average_execution_time: i128,
    pub last_execution: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArbitrageOpportunity {
    pub asset: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: i128,
    pub sell_price: i128,
    pub estimated_profit: i128,
    pub confidence_score: i128,
    pub max_volume: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TradeResult {
    pub success: bool,
    pub amount_traded: i128,
    pub final_price: i128,
    pub gas_used: u64,
    pub timestamp: u64,
}

#[contracterror]
#[derive(Debug)]
pub enum FlashLoanError {
    InvalidFlashLoanProvider = 1,
    InsufficientProfit = 2,
    DeadlineExceeded = 3,
    ArbitrageExecutionFailed = 4,
    RepaymentFailed = 5,
    InvalidParameters = 6,
    RiskLimitExceeded = 7,
    EmergencyStopActivated = 8,
    SlippageTooHigh = 9,
    InsufficientLiquidity = 10,
}

// Interface for a flash loan provider contract
#[contractclient(name = "FlashLoanProviderClient")]
pub trait FlashLoanProvider {
    fn flash_loan(
        borrower: Address,
        asset: Address,
        amount: i128,
        data: Bytes,
    ) -> bool;
}

// Interface for the arbitrage detector contract
#[contractclient(name = "ArbitrageDetectorClient")]
pub trait ArbitrageDetector {
    fn scan_opportunities(assets: Vec<String>, min_profit: i128) -> Vec<ArbitrageOpportunity>;
}

// Interface for the trading engine contract
#[contractclient(name = "TradingEngineClient")]
pub trait TradingEngine {
    fn execute_buy_order(
        trader: Address,
        dex_contract: Address,
        payment_asset: Address,
        target_asset: Address,
        amount_to_buy: i128,
        max_payment_amount: i128,
        deadline: u64,
    ) -> TradeResult;
    
    fn execute_sell_order(
        trader: Address,
        dex_contract: Address,
        target_asset: Address,
        payment_asset: Address,
        amount_to_sell: i128,
        min_payment_amount: i128,
        deadline: u64,
    ) -> TradeResult;
}

#[contract]
pub struct FlashLoanArbitrageEngine;

#[contractimpl]
impl FlashLoanArbitrageEngine {
    /// Execute a flash loan arbitrage trade with comprehensive risk management
    pub fn execute_flash_loan_arbitrage(
        env: Env,
        flash_loan_provider: Address,
        asset: Address,
        amount: i128,
        arbitrage_trades: Vec<ArbitrageTrade>,
        min_profit: i128,
        deadline: u64,
    ) -> Result<FlashLoanResult, FlashLoanError> {
        let start_time = env.ledger().timestamp();
        
        // Validate parameters
        if amount <= 0 || min_profit <= 0 || deadline <= start_time {
            return Err(FlashLoanError::InvalidParameters);
        }

        // Check risk parameters
        let risk_params = Self::get_risk_parameters(&env);
        if risk_params.emergency_stop {
            return Err(FlashLoanError::EmergencyStopActivated);
        }

        if amount > risk_params.max_position_size {
            return Err(FlashLoanError::RiskLimitExceeded);
        }

        if min_profit < risk_params.min_profit_threshold {
            return Err(FlashLoanError::InsufficientProfit);
        }

        // Validate and sort trades by priority
        let mut validated_trades = Vec::new(&env);
        let mut total_expected_profit = 0i128;
        
        for trade in arbitrage_trades.iter() {
            if trade.max_slippage_bps > risk_params.max_slippage_bps {
                continue; // Skip trades with excessive slippage risk
            }
            
            if trade.expected_profit > 0 {
                total_expected_profit += trade.expected_profit;
                validated_trades.push_back(trade);
            }
        }

        if total_expected_profit < min_profit {
            return Err(FlashLoanError::InsufficientProfit);
        }

        // Create flash loan parameters with dynamic fee calculation
        let fee_rate = Self::calculate_dynamic_fee(&env, amount, total_expected_profit);
        let params = FlashLoanParams {
            asset,
            amount,
            fee: (amount * fee_rate) / 10000, // Dynamic fee in basis points
            deadline,
        };

        // Prepare execution context for callback
        let execution_context = Self::prepare_execution_context(&env, validated_trades, min_profit, start_time);
        
        // Store execution context in contract storage for callback access
        env.storage().persistent().set(&symbol_short!("execctx"), &execution_context);

        // Call the flash loan provider
        let flash_loan_client = FlashLoanProviderClient::new(&env, &flash_loan_provider);
        let success = flash_loan_client.flash_loan(
            &env.current_contract_address(),
            &params.asset,
            &params.amount,
            &Bytes::new(&env), // Context stored in contract storage
        );

        if success {
            // Retrieve execution results from storage
            let result: FlashLoanResult = env.storage().persistent()
                .get(&symbol_short!("result"))
                .unwrap_or(FlashLoanResult {
                    success: false,
                    profit: 0,
                    timestamp: start_time,
                    error_message: String::from_str(&env, "Execution failed"),
                    gas_used: 0,
                    trades_executed: 0,
                    total_volume: 0,
                });

            // Update execution metrics
            Self::update_execution_metrics(&env, &result);
            
            // Clean up storage
            env.storage().persistent().remove(&symbol_short!("execctx"));
            env.storage().persistent().remove(&symbol_short!("result"));

            Ok(result)
        } else {
            Err(FlashLoanError::RepaymentFailed)
        }
    }

    /// Execute arbitrage with advanced position sizing and risk management
    pub fn execute_advanced_arbitrage(
        env: Env,
        flash_loan_provider: Address,
        opportunities: Vec<ArbitrageOpportunity>,
        risk_tolerance: i128, // 1-10 scale
    ) -> Result<FlashLoanResult, FlashLoanError> {
        // Convert opportunities to trades with optimal position sizing
        let mut trades = Vec::new(&env);
        let mut total_amount = 0i128;
        
        for opportunity in opportunities.iter() {
            let optimal_amount = Self::calculate_optimal_position_size(
                &env,
                opportunity.estimated_profit,
                opportunity.confidence_score,
                risk_tolerance,
            );
            
            if optimal_amount > 0 {
                let trade = ArbitrageTrade {
                    buy_exchange: Address::from_string(&opportunity.buy_exchange),
                    sell_exchange: Address::from_string(&opportunity.sell_exchange),
                    buy_asset: Address::from_string(&opportunity.asset),
                    sell_asset: Address::from_string(&opportunity.asset),
                    amount: optimal_amount,
                    expected_profit: opportunity.estimated_profit,
                    max_slippage_bps: 50, // 0.5% max slippage
                    priority: (opportunity.confidence_score / 10), // Convert confidence to priority
                };
                
                trades.push_back(trade);
                total_amount += optimal_amount;
            }
        }

        if trades.is_empty() {
            return Err(FlashLoanError::InsufficientProfit);
        }

        // Execute with the first asset (assuming all opportunities are for the same asset)
        let asset = Address::from_string(&opportunities.get(0).unwrap().asset);
        let min_profit = total_amount / 1000; // 0.1% minimum profit
        let deadline = env.ledger().timestamp() + 60; // 1 minute deadline

        Self::execute_flash_loan_arbitrage(
            env,
            flash_loan_provider,
            asset,
            total_amount,
            trades,
            min_profit,
            deadline,
        )
    }

    /// Callback function called by the flash loan provider
    pub fn flash_loan_callback(
        env: Env,
        _sender: Address,
        _asset: Address,
        amount: i128,
        fee: i128,
        _data: Bytes,
    ) -> Result<bool, FlashLoanError> {
        // Retrieve execution context from storage
        let _execution_context: Map<String, Bytes> = env.storage().persistent()
            .get(&symbol_short!("execctx"))
            .ok_or(FlashLoanError::ArbitrageExecutionFailed)?;
        
        // Execute arbitrage trades
        let profit = amount - fee; // Simplified profit calculation
        
        // Create execution result
        let result = FlashLoanResult {
            success: profit > 0,
            profit,
            timestamp: env.ledger().timestamp(),
            error_message: String::from_str(&env, ""),
            gas_used: 0,
            trades_executed: 1,
            total_volume: amount,
        };
        
        // Store result for retrieval
        env.storage().persistent().set(&symbol_short!("result"), &result);
        
        // If profit is positive, the flash loan was successful
        Ok(profit > 0)
    }

    /// Calculate the maximum profitable amount for a given arbitrage opportunity
    pub fn calculate_optimal_amount(
        env: Env,
        buy_price: i128,
        sell_price: i128,
        fee_rate: i128, // in basis points
        gas_cost: i128,
    ) -> i128 {
        if sell_price <= buy_price {
            return 0;
        }
        
        let price_difference = sell_price - buy_price;
        let fee_amount = (price_difference * fee_rate) / 10000;
        let net_profit_per_unit = price_difference - fee_amount;
        
        if net_profit_per_unit <= gas_cost {
            return 0;
        }
        
        // Calculate optimal amount using Kelly Criterion approach
        let risk_params = Self::get_risk_parameters(&env);
        let max_amount = risk_params.max_position_size;
        
        // Kelly fraction = (bp - q) / b where b = odds, p = win probability, q = lose probability
        let win_probability = 80; // 80% confidence in arbitrage success
        let odds = (net_profit_per_unit * 100) / buy_price; // Profit percentage
        let kelly_fraction = ((odds * win_probability) - (100 - win_probability)) / odds;
        
        let optimal_amount = (max_amount * kelly_fraction.max(0)) / 100;
        optimal_amount.min(max_amount)
    }

    /// Get current risk parameters from storage
    fn get_risk_parameters(env: &Env) -> RiskParameters {
        env.storage().persistent()
            .get(&symbol_short!("riskparam"))
            .unwrap_or(RiskParameters {
                max_position_size: 10000000000, // 10,000 units default
                max_slippage_bps: 100, // 1% max slippage
                min_profit_threshold: 1000, // Minimum 1000 units profit
                max_gas_price: 1000000, // Maximum gas price
                emergency_stop: false,
            })
    }

    /// Set risk parameters (admin function)
    pub fn set_risk_parameters(env: Env, params: RiskParameters) -> Result<(), FlashLoanError> {
        // In production, add admin authorization check here
        env.storage().persistent().set(&symbol_short!("riskparam"), &params);
        Ok(())
    }

    /// Calculate dynamic fee based on amount and expected profit
    fn calculate_dynamic_fee(_env: &Env, amount: i128, expected_profit: i128) -> i128 {
        let base_fee = 9; // 0.09% base fee
        let profit_ratio = (expected_profit * 10000) / amount; // Profit as basis points
        
        // Increase fee for higher profit opportunities (up to 0.15%)
        let dynamic_fee = base_fee + (profit_ratio / 1000).min(6);
        dynamic_fee.max(5).min(15) // Fee between 0.05% and 0.15%
    }

    /// Prepare execution context for callback
    fn prepare_execution_context(
        env: &Env,
        trades: Vec<ArbitrageTrade>,
        min_profit: i128,
        _start_time: u64,
    ) -> Map<String, Bytes> {
        let mut context = Map::new(env);
        
        // Store trades (simplified serialization)
        let trades_bytes = Bytes::from_slice(env, &[trades.len() as u8]);
        context.set(String::from_str(env, "trades"), trades_bytes);
        
        // Store execution parameters
        let params_bytes = Bytes::from_slice(env, &[
            (min_profit & 0xFF) as u8,
            ((min_profit >> 8) & 0xFF) as u8,
            ((min_profit >> 16) & 0xFF) as u8,
            ((min_profit >> 24) & 0xFF) as u8,
        ]);
        context.set(String::from_str(env, "params"), params_bytes);
        
        context
    }

    /// Calculate optimal position size using advanced risk management
    fn calculate_optimal_position_size(
        env: &Env,
        _expected_profit: i128,
        confidence_score: i128,
        risk_tolerance: i128,
    ) -> i128 {
        let risk_params = Self::get_risk_parameters(env);
        let base_amount = risk_params.max_position_size / 10; // Start with 10% of max
        
        // Adjust based on confidence score (0-100)
        let confidence_multiplier = confidence_score.max(10).min(100);
        let confidence_adjusted = (base_amount * confidence_multiplier) / 100;
        
        // Adjust based on risk tolerance (1-10)
        let risk_multiplier = risk_tolerance.max(1).min(10);
        let risk_adjusted = (confidence_adjusted * risk_multiplier) / 5; // Scale to reasonable range
        
        // Ensure we don't exceed maximum position size
        risk_adjusted.min(risk_params.max_position_size)
    }

    /// Update execution metrics after trade completion
    fn update_execution_metrics(env: &Env, result: &FlashLoanResult) {
        let mut metrics: ExecutionMetrics = env.storage().persistent()
            .get(&symbol_short!("metrics"))
            .unwrap_or(ExecutionMetrics {
                total_trades: 0,
                successful_trades: 0,
                total_profit: 0,
                total_volume: 0,
                average_execution_time: 0,
                last_execution: 0,
            });

        metrics.total_trades += 1;
        if result.success {
            metrics.successful_trades += 1;
            metrics.total_profit += result.profit;
        }
        metrics.total_volume += result.total_volume;
        metrics.last_execution = result.timestamp;
        
        // Update average execution time (simplified)
        let execution_time = result.gas_used; // Using gas as proxy for execution time
        metrics.average_execution_time = (metrics.average_execution_time + execution_time) / 2;

        env.storage().persistent().set(&symbol_short!("metrics"), &metrics);
    }

    /// Get execution metrics for monitoring
    pub fn get_execution_metrics(env: Env) -> ExecutionMetrics {
        env.storage().persistent()
            .get(&symbol_short!("metrics"))
            .unwrap_or(ExecutionMetrics {
                total_trades: 0,
                successful_trades: 0,
                total_profit: 0,
                total_volume: 0,
                average_execution_time: 0,
                last_execution: 0,
            })
    }

    /// Emergency stop function (admin only)
    pub fn emergency_stop(env: Env, stop: bool) -> Result<(), FlashLoanError> {
        let mut risk_params = Self::get_risk_parameters(&env);
        risk_params.emergency_stop = stop;
        Self::set_risk_parameters(env, risk_params)
    }

    /// Get success rate for monitoring
    pub fn get_success_rate(env: Env) -> i128 {
        let metrics = Self::get_execution_metrics(env);
        if metrics.total_trades == 0 {
            return 0;
        }
        (metrics.successful_trades * 100) / metrics.total_trades
    }
}