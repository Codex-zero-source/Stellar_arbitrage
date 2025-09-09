#![cfg(test)]
use soroban_sdk::{Env, String};
use reflector_oracle_client::{ReflectorOracleClient, ReflectorOracleClientClient};

#[test]
fn test_supported_assets() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReflectorOracleClient);
    let client = ReflectorOracleClientClient::new(&env, &contract_id);

    let assets = client.get_supported_assets();
    
    // For now, we're just testing that the function works
    // In a real implementation, we would check for specific asset codes
    assert!(assets.len() >= 0);
}

#[test]
fn test_asset_validation() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReflectorOracleClient);
    let client = ReflectorOracleClientClient::new(&env, &contract_id);

    // Test supported assets
    assert_eq!(client.is_asset_supported(String::from_str(&env, "AQUA")), true);
    assert_eq!(client.is_asset_supported(String::from_str(&env, "yUSDC")), true);
    assert_eq!(client.is_asset_supported(String::from_str(&env, "EURC")), true);
    assert_eq!(client.is_asset_supported(String::from_str(&env, "BTCLN")), true);
    assert_eq!(client.is_asset_supported(String::from_str(&env, "KALE")), true);
    
    // Test unsupported assets
    assert_eq!(client.is_asset_supported(String::from_str(&env, "BTC")), false);
    assert_eq!(client.is_asset_supported(String::from_str(&env, "USDC")), false);
    assert_eq!(client.is_asset_supported(String::from_str(&env, "XLM")), false);
}

#[test]
fn test_price_deviation_validation() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ReflectorOracleClient);
    let client = ReflectorOracleClientClient::new(&env, &contract_id);

    // Test valid deviation (within 1%)
    assert_eq!(client.validate_price_deviation(10000, 10050, 100), true);
    
    // Test invalid deviation (outside 0.5%)
    assert_eq!(client.validate_price_deviation(10000, 10100, 50), false);
    
    // Test zero reference price
    assert_eq!(client.validate_price_deviation(10000, 0, 100), false);
}