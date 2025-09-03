// PriceMonitor.js
// Off-chain price monitoring bot for the Arbitrage Trading Platform

const WebSocket = require('ws');
const { SorobanClient } = require('@stellar/soroban-client');
require('dotenv').config();

class PriceMonitor {
    constructor() {
        this.reflectorWsUrl = process.env.REFLECTOR_WS_URL;
        this.stellarRpcUrl = process.env.STELLAR_TESTNET_RPC;
        this.contractId = process.env.STELLAR_CONTRACT_ID;
        
        this.ws = null;
        this.sorobanClient = null;
        this.priceData = new Map();
        this.arbitrageOpportunities = [];
        
        this.initializeSorobanClient();
    }
    
    initializeSorobanClient() {
        this.sorobanClient = new SorobanClient({
            serverUrl: this.stellarRpcUrl
        });
    }
    
    connectToReflector() {
        this.ws = new WebSocket(this.reflectorWsUrl);
        
        this.ws.on('open', () => {
            console.log('Connected to Reflector Network WebSocket');
            this.subscribeToPriceFeeds();
        });
        
        this.ws.on('message', (data) => {
            this.handlePriceUpdate(JSON.parse(data));
        });
        
        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        
        this.ws.on('close', () => {
            console.log('WebSocket connection closed. Reconnecting in 5 seconds...');
            setTimeout(() => this.connectToReflector(), 5000);
        });
    }
    
    subscribeToPriceFeeds() {
        // Subscribe to price feeds for major asset pairs
        const subscriptions = [
            { asset: 'XLM', exchanges: ['Stellar DEX', 'Binance', 'Coinbase Pro'] },
            { asset: 'BTC', exchanges: ['Stellar DEX', 'Binance', 'Coinbase Pro'] },
            { asset: 'ETH', exchanges: ['Stellar DEX', 'Binance', 'Coinbase Pro'] }
        ];
        
        subscriptions.forEach(sub => {
            this.ws.send(JSON.stringify({
                action: 'subscribe',
                asset: sub.asset,
                exchanges: sub.exchanges
            }));
        });
    }
    
    handlePriceUpdate(data) {
        // Store the latest price data
        const key = `${data.asset}-${data.exchange}`;
        this.priceData.set(key, {
            price: data.price,
            timestamp: data.timestamp,
            volume: data.volume_24h
        });
        
        // Check for arbitrage opportunities
        this.detectArbitrageOpportunities(data.asset);
    }
    
    detectArbitrageOpportunities(asset) {
        // Get all exchanges for this asset
        const exchanges = Array.from(this.priceData.keys())
            .filter(key => key.startsWith(asset))
            .map(key => key.split('-')[1]);
        
        if (exchanges.length < 2) return;
        
        // Compare prices across exchanges
        for (let i = 0; i < exchanges.length; i++) {
            for (let j = i + 1; j < exchanges.length; j++) {
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
            }
        }
    }
    
    scoreAndRankOpportunity(opportunity) {
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
    }
    
    async triggerArbitrageExecution(opportunity) {
        try {
            console.log('Triggering arbitrage execution on Stellar network...');
            
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
            console.error('Error triggering arbitrage execution:', error);
        }
    }
    
    start() {
        console.log('Starting Price Monitor...');
        this.connectToReflector();
        
        // Periodic cleanup of old opportunities
        setInterval(() => {
            const now = Date.now();
            this.arbitrageOpportunities = this.arbitrageOpportunities.filter(
                opp => (now - opp.timestamp) < 300000 // Remove opportunities older than 5 minutes
            );
        }, 60000); // Run cleanup every minute
    }
}

// Start the monitor
const monitor = new PriceMonitor();
monitor.start();

module.exports = PriceMonitor;