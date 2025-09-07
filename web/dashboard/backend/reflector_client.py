import os
import json
import requests
import time
from dotenv import load_dotenv
from stellar_sdk import Asset

# Load environment variables
load_dotenv()

class ReflectorOracleClient:
    def __init__(self):
        self.api_url = os.getenv('REFLECTOR_API_URL')
        self.api_key = os.getenv('REFLECTOR_API_KEY')
        self.ws_url = os.getenv('REFLECTOR_WS_URL')
        
        # Validate configuration
        if not self.api_url or not self.api_key:
            raise ValueError("REFLECTOR_API_URL and REFLECTOR_API_KEY must be set in .env")

    def get_asset_price(self, asset_code: str, exchange: str = "Stellar DEX") -> dict:
        """
        Fetch the current price of an asset from the Reflector oracle.
        
        Args:
            asset_code: The asset code (e.g., "BTC", "USDC")
            exchange: The exchange name (default: "Stellar DEX")
            
        Returns:
            Dictionary with price data or None if error
        """
        try:
            url = f"{self.api_url}/price/{asset_code}/{exchange}"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return {
                'asset': asset_code,
                'price': data.get('price'),
                'volume_24h': data.get('volume_24h', 0),
                'timestamp': int(time.time()),
                'source': exchange,
                'confidence': data.get('confidence', 90)
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching price for {asset_code} from {exchange}: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing response for {asset_code} from {exchange}: {e}")
            return None

    def get_multiple_asset_prices(self, asset_pairs: list) -> dict:
        """
        Fetch prices for multiple asset pairs.
        
        Args:
            asset_pairs: List of tuples (asset_code, exchange)
            
        Returns:
            Dictionary mapping asset pairs to price data
        """
        prices = {}
        for asset_code, exchange in asset_pairs:
            price_data = self.get_asset_price(asset_code, exchange)
            if price_data:
                prices[f"{asset_code}-{exchange}"] = price_data
        return prices

    def validate_price_data(self, price_data: dict, historical_data: dict = None) -> bool:
        """
        Validate price data for manipulation detection.
        
        Args:
            price_data: Current price data
            historical_data: Previous price data for comparison
            
        Returns:
            True if data is valid, False otherwise
        """
        if not price_data:
            return False
            
        # Check confidence score
        if price_data.get('confidence', 0) < 80:
            print(f"Low confidence score: {price_data.get('confidence')}")
            return False
            
        # Check data freshness (within 60 seconds)
        if time.time() - price_data.get('timestamp', 0) > 60:
            print("Stale price data")
            return False
            
        # If we have historical data, check for manipulation
        if historical_data:
            current_price = price_data.get('price', 0)
            previous_price = historical_data.get('price', 0)
            
            if previous_price > 0:
                deviation = abs(current_price - previous_price) / previous_price * 100
                if deviation > 5.0:  # 5% maximum deviation
                    print(f"Potential price manipulation detected: {deviation:.2f}% deviation")
                    return False
                    
        return True

    def push_price_to_contract(self, price_data: dict, contract_client):
        """
        Push price data to the ReflectorOracleClient smart contract.
        This would typically be done by the oracle service itself, but we're simulating it here.
        
        Args:
            price_data: Price data to push
            contract_client: ContractClient instance to interact with the smart contract
        """
        # In a real implementation, the oracle service would directly call the contract
        # For simulation purposes, we're just showing how this would work
        print(f"Simulating price push to contract: {price_data}")
        # TODO: Implement actual contract interaction if needed