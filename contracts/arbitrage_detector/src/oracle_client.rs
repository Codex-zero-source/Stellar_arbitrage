use soroban_sdk::{contracttype, Vec, Env};

#[contracttype]
#[derive(Clone)]
pub struct OrderBookEntry {
    pub price: i128,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct OrderBookData {
    pub bids: Vec<OrderBookEntry>,
    pub asks: Vec<OrderBookEntry>,
    pub timestamp: u64,
}