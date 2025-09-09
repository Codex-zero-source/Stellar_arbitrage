use jsonrpsee_http_client::HttpClientBuilder;
use jsonrpsee_http_client::HttpClient as Client;

mod price_monitoring;

fn main() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rpc_url = "https://soroban-testnet.stellar.org:443";
        let rpc_client = Client::new(rpc_url).unwrap();

        let asset_contract_id = "CDJF2JQINO7WRFXB2AAHLONFDPPI4M3W2UM5THGQQ7JMJDIEJYC4CMPG"; // AQUA

        let price = price_monitoring::get_price(&rpc_client, asset_contract_id).await;
        println!("Price of {}: {:?}", asset_contract_id, price);
    });
}