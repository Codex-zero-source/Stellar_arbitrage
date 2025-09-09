#![cfg(test)]
use soroban_sdk::{Env, String};
use super::{ArbitrageDetector, ArbitrageDetectorClient, RealAsset};

#[test]
fn test_supported_assets() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArbitrageDetector);
    let client = ArbitrageDetectorClient::new(&env, &contract_id);

    let assets = client.get_supported_assets();
    
    assert_eq!(assets.len(), 5);
    
    // Check AQUA asset
    let aqua_asset = &assets.get(0).unwrap();
    assert_eq!(aqua_asset.code, String::from_str(&env, "AQUA"));
    assert_eq!(aqua_asset.issuer, String::from_str(&env, "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"));
    
    // Check yUSDC asset
    let yusdc_asset = &assets.get(1).unwrap();
    assert_eq!(yusdc_asset.code, String::from_str(&env, "yUSDC"));
    assert_eq!(yusdc_asset.issuer, String::from_str(&env, "CABWYQLGOQ5Y3RIYUVYJZVA355YVX4SPAMN6ORDAVJZQBPPHLHRRLNMS"));
    
    // Check EURC asset
    let eurc_asset = &assets.get(2).unwrap();
    assert_eq!(eurc_asset.code, String::from_str(&env, "EURC"));
    assert_eq!(eurc_asset.issuer, String::from_str(&env, "CCBINL4TCQVEQN2Q2GO66RS4CWUARIECZEJA7JVYQO3GVF4LG6HJN236"));
    
    // Check BTCLN asset
    let btcln_asset = &assets.get(3).unwrap();
    assert_eq!(btcln_asset.code, String::from_str(&env, "BTCLN"));
    assert_eq!(btcln_asset.issuer, String::from_str(&env, "CAWH4XMRQL7AJZCXEJVRHHMT6Y7ZPFCQCSKLIFJL3AVIQNC5TSVWKQOR"));
    
    // Check KALE asset
    let kale_asset = &assets.get(4).unwrap();
    assert_eq!(kale_asset.code, String::from_str(&env, "KALE"));
    assert_eq!(kale_asset.issuer, String::from_str(&env, "CAOTLCI7DROK3PI4ANOFPHPMBCFWVHURJM2EKQSO725SYCWBWE5U22OG"));
}

#[test]
fn test_asset_validation() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArbitrageDetector);
    let client = ArbitrageDetectorClient::new(&env, &contract_id);

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