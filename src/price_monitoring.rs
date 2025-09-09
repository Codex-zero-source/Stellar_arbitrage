use jsonrpsee_http_client::HttpClient as Client;
use jsonrpsee_core::client::ClientT;
use stellar_xdr::{ScVal, ScObject, ScAddress, Hash, ContractId};

pub async fn get_price(client: &Client, asset_contract_id: &str) -> Option<i128> {
    let contract_id = "CDHXGW5XPQN34WP3GQZ3QA76ECI7RP3GE4HRASYPTRUJXYDWOTLVMAPK";
    let function_name = "get_price";
    let args = vec![ScVal::Object(Some(ScObject::Address(ScAddress::Contract(ContractId(Hash(hex::decode(asset_contract_id).unwrap().try_into().unwrap()))))))];

    let result = client.request("invokeContractFunction", (contract_id, function_name, args)).await.unwrap();

    if let ScVal::Object(Some(ScObject::I128(price))) = result {
        Some(price.into())
    } else {
        None
    }
}
