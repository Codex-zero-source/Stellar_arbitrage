
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- In-memory data for simulation ---

const opportunities = [
  {
    id: '1',
    asset: 'XLM/yUSDC',
    buy_exchange: 'Stellar DEX',
    sell_exchange: 'Soroswap',
    buy_price: 0.108,
    sell_price: 0.11,
    available_amount: 50000,
    estimated_profit: 0, // Will be calculated on execution
    confidence_score: 95,
    expiry_time: Date.now() + 60000, // Expires in 1 minute
  },
  {
    id: '2',
    asset: 'AQUA/yUSDC',
    buy_exchange: 'Aqua Network',
    sell_exchange: 'Stellar DEX',
    buy_price: 0.015,
    sell_price: 0.0155,
    available_amount: 100000,
    estimated_profit: 0,
    confidence_score: 92,
    expiry_time: Date.now() + 120000, // Expires in 2 minutes
  },
    {
    id: '3',
    asset: 'BTCLN/yUSDC',
    buy_exchange: 'Stellar DEX',
    sell_exchange: 'Soroswap',
    buy_price: 68000,
    sell_price: 68050,
    available_amount: 2,
    estimated_profit: 0,
    confidence_score: 88,
    expiry_time: Date.now() + 90000, // Expires in 1.5 minutes
  },
];

// --- API Endpoints ---

app.get('/api/opportunities', (req, res) => {
  // In a real app, you'd filter out expired opportunities
  res.json(opportunities);
});

app.post('/api/execute/:id', (req, res) => {
  const { id } = req.params;
  const opportunity = opportunities.find(op => op.id === id);

  if (!opportunity) {
    return res.status(404).json({ message: 'Opportunity not found' });
  }

  const executionLog = [];
  const loanAmount = opportunity.available_amount * opportunity.buy_price;
  const flashLoanFee = loanAmount * 0.0009; // 0.09% fee for XycLoans

  const simulateStep = (message, duration) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const logEntry = `[${new Date().toISOString()}] ${message}`;
        console.log(logEntry);
        executionLog.push(logEntry);
        resolve();
      }, duration);
    });
  };

  (async () => {
    await simulateStep(`INFO: Initiating arbitrage for ${opportunity.asset} (ID: ${opportunity.id}).`, 0);
    await simulateStep(`INFO: Estimated loan required: ${loanAmount.toFixed(2)} yUSDC.`, 500);
    await simulateStep(`STEP 1: Requesting flash loan of ${loanAmount.toFixed(2)} yUSDC from XycLoans...`, 1000);
    await simulateStep(`SUCCESS: Flash loan secured.`, 1500);
    await simulateStep(`STEP 2: Executing BUY order for ${opportunity.available_amount} ${opportunity.asset.split('/')[0]} on ${opportunity.buy_exchange} @ ${opportunity.buy_price}.`, 1000);
    
    const amountBought = opportunity.available_amount;
    const grossRevenue = amountBought * opportunity.sell_price;
    
    await simulateStep(`SUCCESS: BUY order filled.`, 1500);
    await simulateStep(`STEP 3: Executing SELL order for ${amountBought} ${opportunity.asset.split('/')[0]} on ${opportunity.sell_exchange} @ ${opportunity.sell_price}.`, 1000);
    await simulateStep(`SUCCESS: SELL order filled. Gross revenue: ${grossRevenue.toFixed(2)} yUSDC.`, 1500);
    await simulateStep(`STEP 4: Repaying flash loan of ${loanAmount.toFixed(2)} yUSDC with fee of ${flashLoanFee.toFixed(2)} yUSDC...`, 1000);
    
    const netProfit = grossRevenue - loanAmount - flashLoanFee;

    if (netProfit > 0) {
      await simulateStep(`SUCCESS: Flash loan repaid.`, 500);
      await simulateStep(`COMPLETE: Arbitrage successful! Net Profit: ${netProfit.toFixed(2)} yUSDC.`, 500);
    } else {
      await simulateStep(`ERROR: Arbitrage failed. Insufficient profit to cover loan and fees.`, 500);
    }

    res.json({ 
      message: netProfit > 0 ? 'Arbitrage successful!' : 'Arbitrage failed!',
      profit: netProfit,
      log: executionLog 
    });
  })();
});

app.listen(port, () => {
  console.log(`Simulation server listening at http://localhost:${port}`);
});
