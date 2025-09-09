// Reflector Network Oracle Client
// This module handles communication with the Reflector Network oracle
// to fetch real-time price data for arbitrage opportunities
#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, contracterror, contracttype, Env, String, Address, Vec, symbol_short};

// Reflector Price Data structure
#[contracttype]
#[derive(Clone)]
pub struct ReflectorPriceData {
    pub price: i128,
    pub timestamp: u64,
    pub confidence: u32,
    pub volume_24h: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct PriceData {
    pub asset: String,
    pub price: i128,
    pub volume_24h: i128,
    pub timestamp: u64,
    pub source: String,
    pub confidence: i128,
    pub price_change_percentage: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct HistoricalPrice {
    pub price: i128,
    pub timestamp: u64,
    pub volume: i128,
}

#[contracterror]
#[derive(Debug, Copy, Clone, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum OracleError {
    NetworkError = 1,
    InvalidData = 2,
    PriceManipulationDetected = 3,
    ContractCallFailed = 4,
    UnsupportedAsset = 5,
    InvalidWindow = 6,
}

#[contract]
pub struct ReflectorOracleClient;

#[contractimpl]
impl ReflectorOracleClient {
    /// Fetch real-time price and timestamp for an asset
    pub fn get_price_and_timestamp(env: Env, asset_code: String) -> Result<(i128, u64), OracleError> {
        // Validate asset is supported
        if !Self::is_asset_supported(&env, asset_code.clone()) {
            return Err(OracleError::UnsupportedAsset);
        }
        
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to address
        let asset_address = Self::asset_code_to_address(&env, asset_code);
        
        // Call the Reflector contract to get price data
        match reflector_client.try_get_price(&asset_address) {
            Ok(Ok(data)) => Ok((data.price, data.timestamp)),
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Calculate Time-Weighted Average Price over a specified window
    pub fn get_twap_price(env: Env, asset_code: String, window_seconds: u64) -> Result<i128, OracleError> {
        // Validate asset is supported
        if !Self::is_asset_supported(&env, asset_code.clone()) {
            return Err(OracleError::UnsupportedAsset);
        }
        
        // Validate window is reasonable (between 1 minute and 24 hours)
        if window_seconds < 60 || window_seconds > 86400 {
            return Err(OracleError::InvalidWindow);
        }
        
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to address
        let asset_address = Self::asset_code_to_address(&env, asset_code);
        
        // Calculate number of records based on window (assuming 30-second intervals)
        let records = (window_seconds / 30) as u32;
        if records == 0 {
            return Err(OracleError::InvalidWindow);
        }
        
        // Call the Reflector contract to get TWAP price
        match reflector_client.try_get_twap_price(&asset_address, &records) {
            Ok(Ok(price)) => Ok(price),
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get historical prices for an asset
    pub fn get_historical_prices(env: Env, asset_code: String, count: u32) -> Result<Vec<PriceData>, OracleError> {
        // Validate asset is supported
        if !Self::is_asset_supported(&env, asset_code.clone()) {
            return Err(OracleError::UnsupportedAsset);
        }
        
        // Limit count to reasonable values
        let limited_count = if count > 100 { 100 } else { count };
        
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to address
        let asset_address = Self::asset_code_to_address(&env, asset_code.clone());
        
        // Call the Reflector contract to get historical prices
        match reflector_client.try_get_historical_prices(&asset_address, &limited_count) {
            Ok(Ok(prices)) => {
                // Convert ReflectorPriceData to PriceData
                let mut converted_prices = Vec::new(&env);
                for price_data in prices.iter() {
                    converted_prices.push_back(PriceData {
                        asset: asset_code.clone(),
                        price: price_data.price,
                        volume_24h: price_data.volume_24h,
                        timestamp: price_data.timestamp,
                        source: String::from_str(&env, "Reflector"),
                        confidence: price_data.confidence as i128,
                        price_change_percentage: 0,
                    });
                }
                Ok(converted_prices)
            },
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get comprehensive price data for an asset
    pub fn get_price_data(env: Env, asset_code: String) -> Result<PriceData, OracleError> {
        // Validate asset is supported
        if !Self::is_asset_supported(&env, asset_code.clone()) {
            return Err(OracleError::UnsupportedAsset);
        }
        
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to address
        let asset_address = Self::asset_code_to_address(&env, asset_code.clone());
        
        // Call the Reflector contract to get price data
        match reflector_client.try_get_price(&asset_address) {
            Ok(Ok(data)) => {
                // Convert ReflectorPriceData to PriceData
                Ok(PriceData {
                    asset: asset_code,
                    price: data.price,
                    volume_24h: data.volume_24h,
                    timestamp: data.timestamp,
                    source: String::from_str(&env, "Reflector"),
                    confidence: data.confidence as i128,
                    price_change_percentage: 0, // This would need to be calculated separately or fetched from another method
                })
            },
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get list of supported assets
    pub fn get_supported_assets(env: Env) -> Result<Vec<String>, OracleError> {
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Call the Reflector contract to get supported assets
        match reflector_client.try_get_supported_assets() {
            Ok(Ok(assets)) => {
                // Convert addresses to asset codes for easier handling
                let mut asset_codes = Vec::new(&env);
                for asset_address in assets.iter() {
                    let asset_code = Self::address_to_asset_code(&env, asset_address);
                    asset_codes.push_back(asset_code);
                }
                Ok(asset_codes)
            },
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get oracle decimals for price calculations
    pub fn get_oracle_decimals(env: Env) -> Result<u32, OracleError> {
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Call the Reflector contract to get oracle decimals
        match reflector_client.try_get_oracle_decimals() {
            Ok(Ok(decimals)) => Ok(decimals),
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get price change percentage for an asset
    pub fn get_price_change_percentage(env: Env, asset_code: String) -> Result<i128, OracleError> {
        // Validate asset is supported
        if !Self::is_asset_supported(&env, asset_code.clone()) {
            return Err(OracleError::UnsupportedAsset);
        }
        
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to address
        let asset_address = Self::asset_code_to_address(&env, asset_code);
        
        // Call the Reflector contract to get price change percentage
        match reflector_client.try_get_price_change_percentage(&asset_address) {
            Ok(Ok(percentage)) => Ok(percentage),
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Validate price deviation to detect manipulation
    pub fn validate_price_deviation(_env: Env, current_price: i128, reference_price: i128, max_deviation_bps: i128) -> bool {
        if reference_price == 0 {
            return false;
        }
        
        let deviation = (current_price - reference_price).abs() * 10000 / reference_price;
        deviation <= max_deviation_bps
    }

    /// Helper function to check if an asset is supported
    fn is_asset_supported(env: &Env, asset_code: String) -> bool {
        // List of supported assets
        if asset_code == String::from_str(env, "AQUA") { true }
        else if asset_code == String::from_str(env, "yUSDC") { true }
        else if asset_code == String::from_str(env, "EURC") { true }
        else if asset_code == String::from_str(env, "BTCLN") { true }
        else if asset_code == String::from_str(env, "KALE") { true }
        else { false }
    }

    /// Helper function to convert asset code to address
    fn asset_code_to_address(env: &Env, asset_code: String) -> Address {
        if asset_code == String::from_str(env, "AQUA") {
            Address::from_string(&String::from_str(env, "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"))
        } else if asset_code == String::from_str(env, "yUSDC") {
            Address::from_string(&String::from_str(env, "GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF"))
        } else if asset_code == String::from_str(env, "EURC") {
            Address::from_string(&String::from_str(env, "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2"))
        } else if asset_code == String::from_str(env, "BTCLN") {
            Address::from_string(&String::from_str(env, "GDPKQ2TSNJOFSEE7XSUXPWRP27H6GFGLWD7JCHNEYYWQVGFA543EVBVT"))
        } else if asset_code == String::from_str(env, "KALE") {
            Address::from_string(&String::from_str(env, "GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE"))
        } else {
            // fallback to Reflector contract for unknown assets
            Address::from_string(&String::from_str(env, "CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC"))
        }
    }

    /// Helper function to convert address to asset code
    fn address_to_asset_code(env: &Env, address: Address) -> String {
        // This is a reverse lookup. For simplicity, we are not implementing a full reverse lookup here.
        // A real implementation would need a mapping contract or a more complex logic.
        // For now, we will just return a placeholder.
        let aqua_address = Address::from_string(&String::from_str(env, "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"));
        if address == aqua_address {
            return String::from_str(env, "AQUA");
        }
        String::from_str(env, "Unknown")
    }
}

// Reflector Network contract client interface
// This would be generated from the Reflector contract's ABI
#[contractclient(name = "ReflectorPriceClient")]
pub trait ReflectorPriceInterface {
    fn get_price(asset_address: Address) -> ReflectorPriceData;
    fn get_twap_price(asset_address: Address, records: u32) -> i128;
    fn get_historical_prices(asset_address: Address, count: u32) -> Vec<ReflectorPriceData>;
    fn get_supported_assets() -> Vec<Address>;
    fn get_oracle_decimals() -> u32;
    fn get_price_change_percentage(asset_address: Address) -> i128;
}
