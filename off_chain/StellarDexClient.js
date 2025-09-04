// StellarDexClient.js
// Client for interacting with Stellar DEX API

const axios = require('axios');
require('dotenv').config();

class StellarDexClient {
    constructor() {
        this.horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org';
        this.networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE || 'Public Global Stellar Network ; September 2015';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Initialize cache
        this.cache = new Map();
        this.cacheExpiry = 30000; // 30 seconds cache expiry
    }

    // Generate cache key for market data
    generateCacheKey(baseAsset, counterAsset, dataType) {
        const baseAssetCode = typeof baseAsset === 'string' ? baseAsset : baseAsset.code;
        const baseAssetIssuer = typeof baseAsset === 'object' && baseAsset.issuer ? baseAsset.issuer : '';
        const counterAssetCode = typeof counterAsset === 'string' ? counterAsset : counterAsset.code;
        const counterAssetIssuer = typeof counterAsset === 'object' && counterAsset.issuer ? counterAsset.issuer : '';
        
        return `${baseAssetCode}-${baseAssetIssuer}-${counterAssetCode}-${counterAssetIssuer}-${dataType}`;
    }

    // Check if cached data is still valid
    isCacheValid(cacheEntry) {
        if (!cacheEntry) return false;
        return (Date.now() - cacheEntry.timestamp) < this.cacheExpiry;
    }

    // Get data from cache if available and valid
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (this.isCacheValid(cached)) {
            return cached.data;
        } else {
            // Remove expired cache entry
            this.cache.delete(key);
            return null;
        }
    }

    // Store data in cache
    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Clear expired cache entries
    cleanCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if ((now - entry.timestamp) >= this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }

    // Fetch market price for a trading pair from Stellar DEX
    async getMarketPrice(baseAsset, counterAsset, useCache = true) {
        // Validate assets
        if (!this.validateAsset(baseAsset) || !this.validateAsset(counterAsset)) {
            throw new Error('Invalid asset parameters');
        }
        
        // Check cache first
        if (useCache) {
            const cacheKey = this.generateCacheKey(baseAsset, counterAsset, 'price');
            const cachedData = this.getCachedData(cacheKey);
            if (cachedData) {
                console.log(`Returning cached market price for ${typeof baseAsset === 'string' ? baseAsset : baseAsset.code}/${typeof counterAsset === 'string' ? counterAsset : counterAsset.code}`);
                return cachedData;
            }
        }
        
        let retries = 0;
        
        while (retries <= this.maxRetries) {
            try {
                // Construct the asset codes and issuers
                const baseAssetCode = baseAsset.code || baseAsset;
                const baseAssetIssuer = baseAsset.issuer || null;
                const counterAssetCode = counterAsset.code || counterAsset;
                const counterAssetIssuer = counterAsset.issuer || null;
                
                // For XLM, we don't need an issuer
                const isBaseXLM = baseAssetCode === 'XLM' && !baseAssetIssuer;
                const isCounterXLM = counterAssetCode === 'XLM' && !counterAssetIssuer;
                
                // Validate asset combinations
                if (isBaseXLM && isCounterXLM) {
                    throw new Error('Cannot fetch order book for XLM/XLM pair');
                }
                
                // Build query parameters
                const params = {
                    base_asset_type: isBaseXLM ? 'native' : 'credit_alphanum4',
                    counter_asset_type: isCounterXLM ? 'native' : 'credit_alphanum4'
                };
                
                if (!isBaseXLM) {
                    params.base_asset_code = baseAssetCode;
                    if (baseAssetIssuer) {
                        params.base_asset_issuer = baseAssetIssuer;
                    }
                }
                
                if (!isCounterXLM) {
                    params.counter_asset_code = counterAssetCode;
                    if (counterAssetIssuer) {
                        params.counter_asset_issuer = counterAssetIssuer;
                    }
                }
                
                // Make the API request to Horizon
                const response = await axios.get(`${this.horizonUrl}/order_book`, {
                    params: params,
                    timeout: 5000
                });
                
                if (response.status === 200 && response.data) {
                    // Check if we have valid order book data
                    const orderBook = response.data;
                    
                    if (!orderBook.bids || !orderBook.asks) {
                        throw new Error('Invalid order book data structure');
                    }
                    
                    if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
                        // Use the best bid and ask prices to calculate midpoint
                        const bestBid = parseFloat(orderBook.bids[0].price);
                        const bestAsk = parseFloat(orderBook.asks[0].price);
                        
                        // Validate price values
                        if (isNaN(bestBid) || isNaN(bestAsk) || bestBid <= 0 || bestAsk <= 0) {
                            throw new Error('Invalid price data in order book');
                        }
                        
                        const marketPrice = (bestBid + bestAsk) / 2;
                        
                        const result = {
                            price: marketPrice,
                            bid: bestBid,
                            ask: bestAsk,
                            timestamp: Date.now(),
                            baseAsset: baseAssetCode,
                            counterAsset: counterAssetCode,
                            bids: orderBook.bids.slice(0, 10), // Top 10 bids
                            asks: orderBook.asks.slice(0, 10)  // Top 10 asks
                        };
                        
                        // Cache the result
                        if (useCache) {
                            const cacheKey = this.generateCacheKey(baseAsset, counterAsset, 'price');
                            this.setCachedData(cacheKey, result);
                        }
                        
                        return result;
                    } else if (orderBook.bids.length > 0) {
                        // Only bids available
                        const bestBid = parseFloat(orderBook.bids[0].price);
                        
                        // Validate price value
                        if (isNaN(bestBid) || bestBid <= 0) {
                            throw new Error('Invalid bid price data in order book');
                        }
                        
                        const result = {
                            price: bestBid,
                            bid: bestBid,
                            ask: null,
                            timestamp: Date.now(),
                            baseAsset: baseAssetCode,
                            counterAsset: counterAssetCode,
                            bids: orderBook.bids.slice(0, 10),
                            asks: []
                        };
                        
                        // Cache the result
                        if (useCache) {
                            const cacheKey = this.generateCacheKey(baseAsset, counterAsset, 'price');
                            this.setCachedData(cacheKey, result);
                        }
                        
                        return result;
                    } else if (orderBook.asks.length > 0) {
                        // Only asks available
                        const bestAsk = parseFloat(orderBook.asks[0].price);
                        
                        // Validate price value
                        if (isNaN(bestAsk) || bestAsk <= 0) {
                            throw new Error('Invalid ask price data in order book');
                        }
                        
                        const result = {
                            price: bestAsk,
                            bid: null,
                            ask: bestAsk,
                            timestamp: Date.now(),
                            baseAsset: baseAssetCode,
                            counterAsset: counterAssetCode,
                            bids: [],
                            asks: orderBook.asks.slice(0, 10)
                        };
                        
                        // Cache the result
                        if (useCache) {
                            const cacheKey = this.generateCacheKey(baseAsset, counterAsset, 'price');
                            this.setCachedData(cacheKey, result);
                        }
                        
                        return result;
                    } else {
                        throw new Error('No order book data available');
                    }
                } else {
                    throw new Error(`Invalid response from Stellar Horizon: ${response.status}`);
                }
            } catch (error) {
                retries++;
                
                // Log specific error types
                if (error.code === 'ECONNABORTED') {
                    console.error(`Timeout error fetching market price for ${baseAssetCode}/${counterAssetCode} (attempt ${retries}/${this.maxRetries + 1})`);
                } else if (error.response) {
                    console.error(`HTTP error ${error.response.status} fetching market price for ${baseAssetCode}/${counterAssetCode} (attempt ${retries}/${this.maxRetries + 1}): ${error.response.statusText}`);
                } else {
                    console.error(`Error fetching market price for ${baseAssetCode}/${counterAssetCode} (attempt ${retries}/${this.maxRetries + 1}):`, error.message);
                }
                
                // If this was the last retry, throw the error
                if (retries > this.maxRetries) {
                    throw new Error(`Failed to fetch market price after ${this.maxRetries + 1} attempts: ${error.message}`);
                }
                
                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retries - 1)));
            }
        }
    }

    // Fetch order book data for liquidity analysis
    async getOrderBook(baseAsset, counterAsset, limit = 20, useCache = true) {
        // Validate assets
        if (!this.validateAsset(baseAsset) || !this.validateAsset(counterAsset)) {
            throw new Error('Invalid asset parameters');
        }
        
        // Validate limit
        if (limit <= 0 || limit > 200) {
            throw new Error('Invalid limit parameter: must be between 1 and 200');
        }
        
        // Check cache first
        if (useCache) {
            const cacheKey = this.generateCacheKey(baseAsset, counterAsset, `orderbook-${limit}`);
            const cachedData = this.getCachedData(cacheKey);
            if (cachedData) {
                console.log(`Returning cached order book for ${typeof baseAsset === 'string' ? baseAsset : baseAsset.code}/${typeof counterAsset === 'string' ? counterAsset : counterAsset.code}`);
                return cachedData;
            }
        }
        
        let retries = 0;
        
        while (retries <= this.maxRetries) {
            try {
                // Construct the asset codes and issuers
                const baseAssetCode = baseAsset.code || baseAsset;
                const baseAssetIssuer = baseAsset.issuer || null;
                const counterAssetCode = counterAsset.code || counterAsset;
                const counterAssetIssuer = counterAsset.issuer || null;
                
                // For XLM, we don't need an issuer
                const isBaseXLM = baseAssetCode === 'XLM' && !baseAssetIssuer;
                const isCounterXLM = counterAssetCode === 'XLM' && !counterAssetIssuer;
                
                // Validate asset combinations
                if (isBaseXLM && isCounterXLM) {
                    throw new Error('Cannot fetch order book for XLM/XLM pair');
                }
                
                // Build query parameters
                const params = {
                    base_asset_type: isBaseXLM ? 'native' : 'credit_alphanum4',
                    counter_asset_type: isCounterXLM ? 'native' : 'credit_alphanum4',
                    limit: limit
                };
                
                if (!isBaseXLM) {
                    params.base_asset_code = baseAssetCode;
                    if (baseAssetIssuer) {
                        params.base_asset_issuer = baseAssetIssuer;
                    }
                }
                
                if (!isCounterXLM) {
                    params.counter_asset_code = counterAssetCode;
                    if (counterAssetIssuer) {
                        params.counter_asset_issuer = counterAssetIssuer;
                    }
                }
                
                // Make the API request to Horizon
                const response = await axios.get(`${this.horizonUrl}/order_book`, {
                    params: params,
                    timeout: 5000
                });
                
                if (response.status === 200 && response.data) {
                    const orderBook = response.data;
                    
                    // Validate order book structure
                    if (!orderBook.bids || !orderBook.asks) {
                        throw new Error('Invalid order book data structure');
                    }
                    
                    // Process bids and asks to standardize format
                    const processedBids = [];
                    const processedAsks = [];
                    
                    // Process bids
                    for (let i = 0; i < Math.min(orderBook.bids.length, limit); i++) {
                        const bid = orderBook.bids[i];
                        const price = parseFloat(bid.price);
                        const amount = parseFloat(bid.amount);
                        
                        // Validate price and amount
                        if (isNaN(price) || isNaN(amount) || price <= 0 || amount <= 0) {
                            console.warn(`Skipping invalid bid entry at position ${i}`);
                            continue;
                        }
                        
                        processedBids.push({
                            price: price,
                            amount: amount,
                            timestamp: Date.now()
                        });
                    }
                    
                    // Process asks
                    for (let i = 0; i < Math.min(orderBook.asks.length, limit); i++) {
                        const ask = orderBook.asks[i];
                        const price = parseFloat(ask.price);
                        const amount = parseFloat(ask.amount);
                        
                        // Validate price and amount
                        if (isNaN(price) || isNaN(amount) || price <= 0 || amount <= 0) {
                            console.warn(`Skipping invalid ask entry at position ${i}`);
                            continue;
                        }
                        
                        processedAsks.push({
                            price: price,
                            amount: amount,
                            timestamp: Date.now()
                        });
                    }
                    
                    const result = {
                        bids: processedBids,
                        asks: processedAsks,
                        timestamp: Date.now(),
                        baseAsset: baseAssetCode,
                        counterAsset: counterAssetCode
                    };
                    
                    // Cache the result
                    if (useCache) {
                        const cacheKey = this.generateCacheKey(baseAsset, counterAsset, `orderbook-${limit}`);
                        this.setCachedData(cacheKey, result);
                    }
                    
                    return result;
                } else {
                    throw new Error(`Invalid response from Stellar Horizon: ${response.status}`);
                }
            } catch (error) {
                retries++;
                
                // Log specific error types
                if (error.code === 'ECONNABORTED') {
                    console.error(`Timeout error fetching order book for ${baseAssetCode}/${counterAssetCode} (attempt ${retries}/${this.maxRetries + 1})`);
                } else if (error.response) {
                    console.error(`HTTP error ${error.response.status} fetching order book for ${baseAssetCode}/${counterAssetCode} (attempt ${retries}/${this.maxRetries + 1}): ${error.response.statusText}`);
                } else {
                    console.error(`Error fetching order book for ${baseAssetCode}/${counterAssetCode} (attempt ${retries}/${this.maxRetries + 1}):`, error.message);
                }
                
                // If this was the last retry, throw the error
                if (retries > this.maxRetries) {
                    throw new Error(`Failed to fetch order book after ${this.maxRetries + 1} attempts: ${error.message}`);
                }
                
                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retries - 1)));
            }
        }
    }

    // Validate asset objects
    validateAsset(asset) {
        if (typeof asset === 'string') {
            // Simple asset code like 'XLM'
            return asset.length > 0 && asset.length <= 12;
        } else if (typeof asset === 'object' && asset !== null) {
            // Asset object with code and optional issuer
            if (!asset.code || typeof asset.code !== 'string') {
                return false;
            }
            
            if (asset.code.length === 0 || asset.code.length > 12) {
                return false;
            }
            
            // For non-XLM assets, issuer is required
            if (asset.code !== 'XLM') {
                if (!asset.issuer || typeof asset.issuer !== 'string') {
                    return false;
                }
                
                // Basic validation of Stellar address format
                return asset.issuer.length === 56 && asset.issuer.startsWith('G');
            }
            
            return true;
        }
        
        return false;
    }
}

module.exports = StellarDexClient;