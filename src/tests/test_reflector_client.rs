// Unit tests for Reflector Oracle Client
#[cfg(test)]
mod test_reflector_client {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_fetch_latest_price() {
        let env = Env::default();
        let client = ReflectorOracleClientClient::new(&env, &env.register(ReflectorOracleClient, ()));
        
        let price_data = client.fetch_latest_price(&String::from_str(&env, "XLM"), &String::from_str(&env, "Stellar DEX"));
        
        assert!(price_data.price > 0);
        assert_eq!(price_data.asset, "XLM");
    }

    #[test]
    fn test_get_twap() {
        let env = Env::default();
        let client = ReflectorOracleClientClient::new(&env, &env.register(ReflectorOracleClient, ()));
        
        let twap = client.get_twap(&String::from_str(&env, "XLM"), &3600); // 1 hour TWAP
        
        assert!(twap > 0);
    }

    #[test]
    fn test_validate_price_deviation() {
        let client = ReflectorOracleClientClient::new(&Env::default(), &Env::default().register(ReflectorOracleClient, ()));
        
        let is_valid = client.validate_price_deviation(&100000000, &101000000, &5000000); // 5% max deviation
        
        assert_eq!(is_valid, true);
    }
}