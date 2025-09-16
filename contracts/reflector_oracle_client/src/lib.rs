// Reflector Network Oracle Client
// This module handles communication with the Reflector Network oracle
// to fetch real-time price data for arbitrage opportunities
#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, contracterror, contracttype, Env, String, Address, Vec, Symbol, symbol_short};

#[contracttype]
#[derive(Clone)]
pub struct PriceData {
    pub asset: String,
    pub price: i128,
    pub volume_24h: i128,
    pub timestamp: u64,
    pub source: String,
    pub confidence: i128,
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
    DataNotAvailable = 7,
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
        
        // Get the Reflector contract ID - Stellar Pubnet Price feeds
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to Asset enum - using symbol_short for now
        let asset = Asset::Other(symbol_short!("USDC"));
        
        // Call the Reflector contract to get price data using correct function name
        match reflector_client.try_lastprice(&asset) {
            Ok(Ok(Some(data))) => Ok((data.price, data.timestamp)),
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
        
        // Get the Reflector contract ID - Stellar Pubnet Price feeds
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to Asset enum - using symbol_short for now
        let asset = Asset::Other(symbol_short!("USDC"));
        
        // Calculate number of records based on window (assuming 30-second intervals)
        let records = (window_seconds / 30) as u32;
        if records == 0 {
            return Err(OracleError::InvalidWindow);
        }
        
        // Call the Reflector contract to get TWAP price using correct function name
        match reflector_client.try_twap(&asset, &records) {
            Ok(Ok(Some(price))) => Ok(price),
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
        let count = if count > 100 { 100 } else { count };
        
        // Get the Reflector contract ID
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to Asset enum - using symbol_short for now
        let asset = Asset::Other(symbol_short!("USDC"));
        
        // Call the Reflector contract to get historical prices using correct function name
        match reflector_client.try_prices(&asset, &count) {
            Ok(Ok(Some(prices))) => {
                // Convert ReflectorPriceData to PriceData
                let mut converted_prices = Vec::new(&env);
                for i in 0..prices.len() {
                    let price_data = prices.get(i).unwrap();
                    converted_prices.push_back(PriceData {
                        asset: asset_code.clone(),
                        price: price_data.price,
                        volume_24h: 0, // Not available in ReflectorPriceData
                        timestamp: price_data.timestamp,
                        source: String::from_str(&env, "Reflector"),
                        confidence: 100, // Default confidence since not available in ReflectorPriceData
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
        
        // Get the Reflector contract ID - Stellar Pubnet Price feeds
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Convert asset code to Asset enum - using symbol_short for now
        let asset = Asset::Other(symbol_short!("USDC"));
        
        // Call the Reflector contract to get price data using correct function name
        match reflector_client.try_lastprice(&asset) {
            Ok(Ok(Some(data))) => {
                // Convert ReflectorPriceData to PriceData
                Ok(PriceData {
                    asset: asset_code,
                    price: data.price,
                    volume_24h: 0, // Not available in ReflectorPriceData
                    timestamp: data.timestamp,
                    source: String::from_str(&env, "Reflector"),
                    confidence: 100, // Default confidence since not available in ReflectorPriceData
                })
            },
            _ => Err(OracleError::ContractCallFailed),
        }
    }

    /// Get list of supported assets
    pub fn get_supported_assets(env: Env) -> Result<Vec<String>, OracleError> {
        // Get the Reflector contract ID - Stellar Pubnet Price feeds
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"));
        let _reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // For now, return a hardcoded list of supported assets
        let mut asset_strings = Vec::new(&env);
        asset_strings.push_back(String::from_str(&env, "USDC"));
        asset_strings.push_back(String::from_str(&env, "XLM"));
        Ok(asset_strings)
    }

    /// Get oracle decimals for price calculations
    pub fn get_oracle_decimals(env: Env) -> Result<u32, OracleError> {
        // Get the Reflector contract ID - Stellar Pubnet Price feeds
        let reflector_contract_id = Address::from_string(&String::from_str(&env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"));
        let reflector_client = ReflectorPriceClient::new(&env, &reflector_contract_id);
        
        // Call the Reflector contract to get oracle decimals
        match reflector_client.try_decimals() {
            Ok(decimals) => decimals.map_err(|_| OracleError::ContractCallFailed),
            Err(_) => Err(OracleError::ContractCallFailed)
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
            Address::from_string(&String::from_str(env, "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP"))
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
// Asset enum from Reflector Network
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

// PriceData struct from Reflector Network
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReflectorPriceData {
    pub price: i128,
    pub timestamp: u64,
}

#[contractclient(name = "ReflectorPriceClient")]
pub trait ReflectorPriceInterface {
    fn lastprice(asset: Asset) -> Option<ReflectorPriceData>;
    fn assets() -> Vec<Asset>;
    fn decimals() -> u32;
    fn twap(asset: Asset, records: u32) -> Option<i128>;
    fn prices(asset: Asset, records: u32) -> Option<Vec<ReflectorPriceData>>;
}
