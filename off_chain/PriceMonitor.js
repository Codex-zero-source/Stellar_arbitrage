// PriceMonitor.js
// Off-chain price monitoring bot for the Arbitrage Trading Platform

const WebSocket = require('ws');
const { SorobanClient } = require('@stellar/soroban-client');
const axios = require('axios'); // Add axios for HTTP requests
const StellarDexClient = require('./StellarDexClient'); // Add Stellar DEX client
require('dotenv').config();

class PriceMonitor {
    constructor() {
        this.reflectorWsUrl = process.env.REFLECTOR_WS_URL;
        this.reflectorApiUrl = process.env.REFLECTOR_API_URL; // Add Reflector API URL
        this.reflectorApiKey = process.env.REFLECTOR_API_KEY; // Add Reflector API Key
        this.stellarRpcUrl = process.env.STELLAR_TESTNET_RPC;
        this.contractId = process.env.STELLAR_CONTRACT_ID;
        
        // Validate required environment variables
        this.validateEnvironmentVariables();
        
        this.ws = null;
        this.sorobanClient = null;
        this.stellarDexClient = new StellarDexClient(); // Initialize Stellar DEX client
        this.priceData = new Map();
        this.arbitrageOpportunities = [];
        this.historicalPrices = new Map(); // For manipulation detection
        
        // Retry configuration
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        
        // Validation thresholds
        this.maxPriceDeviationPercent = 5.0; // 5% maximum price deviation
        this.minConfidenceScore = 80; // Minimum confidence score
        this.dataFreshnessThreshold = 60; // 60 seconds
        
        this.initializeSorobanClient();
    }
    
    validateEnvironmentVariables() {
        const requiredVars = ['REFLECTOR_WS_URL', 'REFLECTOR_API_URL', 'REFLECTOR_API_KEY', 'STELLAR_TESTNET_RPC', 'STELLAR_CONTRACT_ID'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        
        console.log('Environment variables validated successfully');
    }
    
    initializeSorobanClient() {
        this.sorobanClient = new SorobanClient({
            serverUrl: this.stellarRpcUrl
        });
    }
    
    // Validate price data for manipulation detection
    validatePriceData(asset, exchange, priceData) {
        // Check if data exists
        if (!priceData) {
            console.warn(`No price data received for ${asset} on ${exchange}`);
            return false;
        }
        
        // Check confidence score
        if (priceData.confidence < this.minConfidenceScore) {
            console.warn(`Low confidence score for ${asset} on ${exchange}: ${priceData.confidence}`);
            return false;
        }
        
        // Check data freshness
        const now = Date.now();
        const dataAge = (now - priceData.timestamp) / 1000; // in seconds
        if (dataAge > this.dataFreshnessThreshold) {
            console.warn(`Stale price data for ${asset} on ${exchange}: ${dataAge} seconds old`);
            return false;
        }
        
        // Check for price manipulation by comparing with historical data
        const key = `${asset}-${exchange}`;
        if (this.historicalPrices.has(key)) {
            const historicalData = this.historicalPrices.get(key);
            
            // Calculate price deviation
            const priceDeviation = Math.abs(priceData.price - historicalData.price) / historicalData.price * 100;
            
            if (priceDeviation > this.maxPriceDeviationPercent) {
                console.warn(`Potential price manipulation detected for ${asset} on ${exchange}: ${priceDeviation.toFixed(2)}% deviation`);
                return false;
            }
        }
        
        // Store current data for future comparison
        this.historicalPrices.set(key, {
            price: priceData.price,
            timestamp: priceData.timestamp
        });
        
        // Remove old historical data (older than 5 minutes)
        const fiveMinutesAgo = now - 300000;
        for (const [histKey, histData] of this.historicalPrices.entries()) {
            if (histData.timestamp < fiveMinutesAgo) {
                this.historicalPrices.delete(histKey);
            }
        }
        
        return true;
    }
    
    // New method to fetch price data from Reflector API via HTTP with error handling
    async fetchPriceFromReflector(asset, exchange) {
        // Validate inputs
        if (!asset || !exchange) {
            console.error('Invalid asset or exchange provided to fetchPriceFromReflector');
            return null;
        }
        
        let retries = 0;
        
        while (retries <= this.maxRetries) {
            try {
                const response = await axios.get(`${this.reflectorApiUrl}/${asset}/${exchange}`, {
                    headers: {
                        'Authorization': `Bearer ${this.reflectorApiKey}`, // Use API key from env vars
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000 // 5 second timeout
                });
                
                if (response.status === 200 && response.data && response.data.price) {
                    const priceData = {
                        asset: asset,
                        exchange: exchange,
                        price: response.data.price,
                        timestamp: Date.now(),
                        volume_24h: response.data.volume_24h || 0,
                        confidence: response.data.confidence || 90
                    };
                    
                    // Validate the price data
                    if (this.validatePriceData(asset, exchange, priceData)) {
                        return priceData;
                    } else {
                        console.warn(`Price data validation failed for ${asset} on ${exchange}`);
                        return null;
                    }
                } else {
                    throw new Error(`Invalid response from Reflector API: ${response.status}`);
                }
            } catch (error) {
                retries++;
                console.error(`Error fetching price for ${asset} from ${exchange} (attempt ${retries}/${this.maxRetries + 1}):`, error.message);
                
                // If this was the last retry, return null
                if (retries > this.maxRetries) {
                    console.error(`Failed to fetch price for ${asset} from ${exchange} after ${this.maxRetries + 1} attempts`);
                    return null;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * retries));
            }
        }
    }
    
    // Fetch market price from Stellar DEX
    async fetchStellarDexPrice(asset, counterAsset = 'XLM') {
        try {
            const marketData = await this.stellarDexClient.getMarketPrice(asset, counterAsset);
            return marketData;
        } catch (error) {
            console.error(`Error fetching price from Stellar DEX for ${asset}/${counterAsset}:`, error.message);
            return null;
        }
    }
    
    // Fetch order book from Stellar DEX
    async fetchStellarDexOrderBook(asset, counterAsset = 'XLM', limit = 20) {
        try {
            const orderBookData = await this.stellarDexClient.getOrderBook(asset, counterAsset, limit);
            return orderBookData;
        } catch (error) {
            console.error(`Error fetching order book from Stellar DEX for ${asset}/${counterAsset}:`, error.message);
            return null;
        }
    }
    
    // Enhanced method with error handling for WebSocket connection
    connectToReflector() {
        try {
            this.ws = new WebSocket(this.reflectorWsUrl);
            
            this.ws.on('open', () => {
                console.log('Connected to Reflector Network WebSocket');
                this.subscribeToPriceFeeds();
            });
            
            this.ws.on('message', (data) => {
                try {
                    const parsedData = JSON.parse(data);
                    this.handlePriceUpdate(parsedData);
                } catch (parseError) {
                    console.error('Error parsing WebSocket message:', parseError.message);
                }
            });
            
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error.message);
                // Attempt to reconnect
                this.scheduleReconnect();
            });
            
            this.ws.on('close', () => {
                console.log('WebSocket connection closed.');
                this.scheduleReconnect();
            });
        } catch (error) {
            console.error('Error establishing WebSocket connection:', error.message);
            this.scheduleReconnect();
        }
    }
    
    scheduleReconnect() {
        console.log('Scheduling reconnection in 5 seconds...');
        setTimeout(() => this.connectToReflector(), 5000);
    }
    
    subscribeToPriceFeeds() {
        try {
            // Subscribe to price feeds for major asset pairs
            const subscriptions = [
                { asset: 'XLM', exchanges: ['Stellar DEX', 'Binance', 'Coinbase Pro'] },
                { asset: 'BTC', exchanges: ['Stellar DEX', 'Binance', 'Coinbase Pro'] },
                { asset: 'ETH', exchanges: ['Stellar DEX', 'Binance', 'Coinbase Pro'] }
            ];
            
            subscriptions.forEach(sub => {
                try {
                    this.ws.send(JSON.stringify({
                        action: 'subscribe',
                        asset: sub.asset,
                        exchanges: sub.exchanges
                    }));
                } catch (sendError) {
                    console.error(`Error subscribing to ${sub.asset}:`, sendError.message);
                }
            });
        } catch (error) {
            console.error('Error subscribing to price feeds:', error.message);
        }
    }
    
    handlePriceUpdate(data) {
        try {
            // Validate data structure
            if (!data.asset || !data.exchange || !data.price) {
                console.warn('Invalid price update data received:', data);
                return;
            }
            
            // Validate the price data for manipulation
            const priceData = {
                asset: data.asset,
                exchange: data.exchange,
                price: data.price,
                timestamp: data.timestamp || Date.now(),
                volume: data.volume_24h || 0,
                confidence: data.confidence || 90
            };
            
            if (!this.validatePriceData(data.asset, data.exchange, priceData)) {
                console.warn(`Price data validation failed for WebSocket update: ${data.asset} on ${data.exchange}`);
                return;
            }
            
            // Store the latest price data
            const key = `${data.asset}-${data.exchange}`;
            this.priceData.set(key, {
                price: data.price,
                timestamp: data.timestamp || Date.now(),
                volume: data.volume_24h || 0
            });
            
            // Check for arbitrage opportunities
            this.detectArbitrageOpportunities(data.asset);
        } catch (error) {
            console.error('Error handling price update:', error.message);
        }
    }
    
    detectArbitrageOpportunities(asset) {
        try {
            // Get all exchanges for this asset
            const exchanges = Array.from(this.priceData.keys())
                .filter(key => key.startsWith(asset))
                .map(key => key.split('-')[1]);
            
            if (exchanges.length < 2) return;
            
            // Compare prices across exchanges
            for (let i = 0; i < exchanges.length; i++) {
                for (let j = i + 1; j < exchanges.length; j++) {
                    try {
                        const exchange1 = exchanges[i];
                        const exchange2 = exchanges[j];
                        
                        const key1 = `${asset}-${exchange1}`;
                        const key2 = `${asset}-${exchange2}`;
                        
                        const price1 = this.priceData.get(key1);
                        const price2 = this.priceData.get(key2);
                        
                        if (!price1 || !price2) continue;
                        
                        // Calculate price difference
                        const priceDiff = Math.abs(price1.price - price2.price);
                        const priceDiffPercent = (priceDiff / Math.min(price1.price, price2.price)) * 100;
                        
                        // Check if opportunity meets minimum threshold (0.5%)
                        if (priceDiffPercent > 0.5) {
                            const buyExchange = price1.price < price2.price ? exchange1 : exchange2;
                            const sellExchange = price1.price < price2.price ? exchange2 : exchange1;
                            const buyPrice = Math.min(price1.price, price2.price);
                            const sellPrice = Math.max(price1.price, price2.price);
                            
                            const opportunity = {
                                asset,
                                buyExchange,
                                sellExchange,
                                buyPrice,
                                sellPrice,
                                priceDiffPercent,
                                timestamp: Math.max(price1.timestamp, price2.timestamp)
                            };
                            
                            this.arbitrageOpportunities.push(opportunity);
                            this.scoreAndRankOpportunity(opportunity);
                        }
                    } catch (comparisonError) {
                        console.error(`Error comparing prices between ${exchanges[i]} and ${exchanges[j]}:`, comparisonError.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting arbitrage opportunities:', error.message);
        }
    }
    
    scoreAndRankOpportunity(opportunity) {
        try {
            // Validate opportunity data
            if (!opportunity.asset || !opportunity.buyExchange || !opportunity.sellExchange) {
                console.warn('Invalid arbitrage opportunity data:', opportunity);
                return;
            }
            
            // Calculate confidence score based on various factors
            let confidenceScore = 100;
            
            // Adjust score based on price difference (higher is better)
            confidenceScore += (opportunity.priceDiffPercent * 10);
            
            // Adjust score based on data freshness (newer is better)
            const now = Date.now();
            const dataAge = (now - opportunity.timestamp) / 1000; // in seconds
            if (dataAge > 30) {
                confidenceScore -= 20; // Penalty for old data
            }
            
            // Ensure confidence score is within valid range
            confidenceScore = Math.max(0, Math.min(100, confidenceScore));
            
            // Log the opportunity
            console.log(`Arbitrage Opportunity Detected:
                Asset: ${opportunity.asset}
                Buy: ${opportunity.buyExchange} at ${opportunity.buyPrice}
                Sell: ${opportunity.sellExchange} at ${opportunity.sellPrice}
                Profit: ${opportunity.priceDiffPercent.toFixed(2)}%
                Confidence Score: ${confidenceScore}`);
            
            // Trigger smart contract if confidence is high enough
            if (confidenceScore > 80) {
                this.triggerArbitrageExecution(opportunity);
            }
        } catch (error) {
            console.error('Error scoring arbitrage opportunity:', error.message);
        }
    }
    
    async triggerArbitrageExecution(opportunity) {
        try {
            console.log('Triggering arbitrage execution on Stellar network...');
            
            // Submit price data to Reflector Oracle Client contract
            await this.submitPriceDataToContract(opportunity.asset, opportunity.buyExchange, opportunity.buyPrice);
            await this.submitPriceDataToContract(opportunity.asset, opportunity.sellExchange, opportunity.sellPrice);
            
            // Prepare the transaction to call the arbitrage detector contract
            // This is a simplified example - actual implementation would be more complex
            const tx = await this.sorobanClient.prepareTransaction({
                contractId: this.contractId,
                method: 'scan_opportunities',
                args: [
                    [opportunity.asset],
                    50 // min profit in basis points (0.5%)
                ]
            });
            
            // Submit the transaction
            const result = await this.sorobanClient.submitTransaction(tx);
            console.log('Arbitrage execution triggered:', result);
        } catch (error) {
            console.error('Error triggering arbitrage execution:', error.message);
            // Log the full error for debugging
            console.error('Full error details:', error);
        }
    }
    
    // New method to submit price data to the smart contract
    async submitPriceDataToContract(asset, exchange, price) {
        try {
            // In a real implementation, this would call the submit_price_data method
            // on the ReflectorOracleClient contract
            console.log(`Submitting price data to contract: ${asset} on ${exchange} at ${price}`);
            
            // This is a placeholder - actual implementation would use Stellar SDK
            // to submit a transaction calling the contract's submit_price_data method
        } catch (error) {
            console.error('Error submitting price data to contract:', error.message);
        }
    }
    
    start() {
        console.log('Starting Price Monitor...');
        this.connectToReflector();
        
        // Periodic cleanup of old opportunities
        setInterval(() => {
            try {
                const now = Date.now();
                this.arbitrageOpportunities = this.arbitrageOpportunities.filter(
                    opp => (now - opp.timestamp) < 300000 // Remove opportunities older than 5 minutes
                );
            } catch (error) {
                console.error('Error during periodic cleanup:', error.message);
            }
        }, 60000); // Run cleanup every minute
    }
}

// Start the monitor
const monitor = new PriceMonitor();
monitor.start();

module.exports = PriceMonitor;