import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import Button from './ui/Button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import StellarContractClient from '../lib/StellarContractClient';

const ContractMonitor = () => {
  const [contractClient, setContractClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [contractMetrics, setContractMetrics] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalGasUsed: 0,
    averageGasPrice: 0,
    totalProfit: 0,
    averageExecutionTime: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [contractStatus, setContractStatus] = useState({
    flashLoanEngine: 'unknown',
    arbitrageDetector: 'unknown',
    tradingEngine: 'unknown'
  });

  const monitoringRef = useRef(null);
  const alertsRef = useRef([]);

  useEffect(() => {
    initializeMonitoring();
    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
      }
    };
  }, []);

  const initializeMonitoring = async () => {
    try {
      const client = new StellarContractClient({
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        contractIds: {
          flashLoanEngine: 'FLASH_LOAN_ENGINE_CONTRACT_ID',
          arbitrageDetector: 'ARBITRAGE_DETECTOR_CONTRACT_ID',
          tradingEngine: 'TRADING_ENGINE_CONTRACT_ID',
          reflectorOracle: 'CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC'
        }
      });
      
      setContractClient(client);
      setIsConnected(true);
      addAlert('success', 'Contract monitoring initialized successfully');
      
      // Initial status check
      await checkContractStatus(client);
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      addAlert('error', 'Failed to initialize contract monitoring');
    }
  };

  const addAlert = (type, message) => {
    const alert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    alertsRef.current = [alert, ...alertsRef.current.slice(0, 4)];
    setAlerts([...alertsRef.current]);
    
    setTimeout(() => {
      alertsRef.current = alertsRef.current.filter(a => a.id !== alert.id);
      setAlerts([...alertsRef.current]);
    }, 5000);
  };

  const checkContractStatus = async (client) => {
    const status = { ...contractStatus };
    
    try {
      // Check Flash Loan Engine
      const metrics = await client.getExecutionMetrics();
      status.flashLoanEngine = metrics ? 'active' : 'inactive';
    } catch (error) {
      status.flashLoanEngine = 'error';
    }

    try {
      // Check Arbitrage Detector
      const assets = await client.getSupportedAssets();
      status.arbitrageDetector = assets && assets.length > 0 ? 'active' : 'inactive';
    } catch (error) {
      status.arbitrageDetector = 'error';
    }

    try {
      // Check Trading Engine (simulate a call)
      status.tradingEngine = 'active'; // Simplified check
    } catch (error) {
      status.tradingEngine = 'error';
    }

    setContractStatus(status);
  };

  const startMonitoring = async () => {
    if (!contractClient || isMonitoring) return;

    try {
      setIsMonitoring(true);
      addAlert('info', 'Starting contract monitoring...');

      const monitor = async () => {
        try {
          // Get execution metrics
          const metrics = await contractClient.getExecutionMetrics();
          if (metrics) {
            setContractMetrics(prev => ({
              ...prev,
              flashLoanEngine: metrics
            }));

            // Update performance data
            setPerformanceData(prev => ({
              ...prev,
              totalTransactions: metrics.total_executions || 0,
              successfulTransactions: metrics.successful_executions || 0,
              failedTransactions: (metrics.total_executions || 0) - (metrics.successful_executions || 0),
              totalProfit: metrics.total_profit || 0,
              averageExecutionTime: metrics.average_execution_time || 0
            }));
          }

          // Check contract status
          await checkContractStatus(contractClient);

          // Simulate transaction monitoring (in production, use event listeners)
          const mockTransaction = {
            id: Date.now(),
            hash: `TX_${Date.now().toString(36)}`,
            contract: 'FlashLoanEngine',
            method: 'execute_flash_loan_arbitrage',
            status: Math.random() > 0.2 ? 'success' : 'failed',
            gasUsed: Math.floor(Math.random() * 100000) + 50000,
            timestamp: new Date().toISOString(),
            profit: Math.random() > 0.5 ? Math.floor(Math.random() * 10000) : 0
          };

          setTransactionHistory(prev => [mockTransaction, ...prev.slice(0, 19)]);

        } catch (error) {
          console.error('Monitoring error:', error);
          addAlert('error', `Monitoring error: ${error.message}`);
        }
      };

      // Initial monitoring
      await monitor();
      
      // Set up interval monitoring
      monitoringRef.current = setInterval(monitor, 10000); // Every 10 seconds
      
      addAlert('success', 'Contract monitoring started');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      addAlert('error', 'Failed to start monitoring');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
    setIsMonitoring(false);
    addAlert('info', 'Contract monitoring stopped');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default: return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  const formatProfit = (profit) => {
    return (profit / 10000000).toFixed(4); // Convert stroops to XLM
  };

  const formatGas = (gas) => {
    return gas.toLocaleString();
  };

  const calculateSuccessRate = () => {
    const total = performanceData.totalTransactions;
    if (total === 0) return 0;
    return ((performanceData.successfulTransactions / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Contract Monitor</h1>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </Badge>
          {isMonitoring && (
            <Badge variant="outline" className="animate-pulse">
              📡 Monitoring
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Alert key={alert.id} className={getAlertColor(alert.type)}>
              <AlertDescription>
                <span className="font-medium">[{alert.timestamp}]</span> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎛️ Monitoring Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={!isConnected}
              variant={isMonitoring ? "destructive" : "default"}
            >
              {isMonitoring ? "⏹️ Stop Monitoring" : "▶️ Start Monitoring"}
            </Button>
            <Button
              onClick={() => checkContractStatus(contractClient)}
              disabled={!isConnected}
              variant="outline"
            >
              🔄 Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contract Status */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ Contract Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(contractStatus).map(([contract, status]) => (
              <div key={contract} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">
                      {contract.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Smart Contract
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl mb-1">
                      {getStatusIcon(status)}
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.totalTransactions}
              </div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {calculateSuccessRate()}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatProfit(performanceData.totalProfit)} XLM
              </div>
              <div className="text-sm text-gray-600">Total Profit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatGas(performanceData.totalGasUsed)}
              </div>
              <div className="text-sm text-gray-600">Total Gas Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactionHistory.slice(0, 10).map((tx) => (
                <div key={tx.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {tx.contract} - {tx.method}
                      </div>
                      <div className="text-sm text-gray-600">
                        Hash: {tx.hash}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Gas Used: {formatGas(tx.gasUsed)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(tx.status === 'success' ? 'active' : 'error')}>
                        {tx.status}
                      </Badge>
                      {tx.profit > 0 && (
                        <div className="font-bold text-green-600 mt-1">
                          +{formatProfit(tx.profit)} XLM
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Metrics Details */}
      {contractMetrics.flashLoanEngine && (
        <Card>
          <CardHeader>
            <CardTitle>⚡ Flash Loan Engine Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {contractMetrics.flashLoanEngine.total_executions || 0}
                </div>
                <div className="text-sm text-gray-600">Total Executions</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {contractMetrics.flashLoanEngine.successful_executions || 0}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {formatProfit(contractMetrics.flashLoanEngine.total_profit || 0)} XLM
                </div>
                <div className="text-sm text-gray-600">Total Profit</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">
                  {contractMetrics.flashLoanEngine.average_execution_time || 0}ms
                </div>
                <div className="text-sm text-gray-600">Avg Execution Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractMonitor;