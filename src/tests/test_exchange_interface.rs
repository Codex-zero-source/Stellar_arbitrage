// Unit tests for Exchange Interface
#[cfg(test)]
mod test_exchange_interface {
    use super::*;
    use soroban_sdk::{Env, String};

    #[test]
    fn test_get_market_price() {
        let env = Env::default();
        let client = ExchangeInterfaceClient::new(&env, &env.register(ExchangeInterface, ()));
        
        let market_price = client.get_market_price(
            &String::from_str(&env, "Binance"),
            &String::from_str(&env, "XLM/USD")
        );
        
        assert!(market_price.is_ok());
    }

    #[test]
    fn test_get_order_book() {
        let env = Env::default();
        let client = ExchangeInterfaceClient::new(&env, &env.register(ExchangeInterface, ()));
        
        let order_book = client.get_order_book(
            &String::from_str(&env, "Stellar DEX"),
            &String::from_str(&env, "XLM/USD"),
            &10
        );
        
        assert_eq!(order_book.bids.len(), 0);
        assert_eq!(order_book.asks.len(), 0);
    }
}