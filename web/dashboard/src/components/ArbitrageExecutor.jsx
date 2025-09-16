import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import Button from './ui/Button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import StellarContractClient from '../lib/StellarContractClient';
import { Keypair } from '@stellar/stellar-sdk';
import { useNotifications } from './NotificationSystem';
import { validateStellarAddress, validateAmount, sanitizeInput, createRateLimiter } from '../lib/validation';

const ArbitrageExecutor = () => {
  const { addNotification, handleApiError } = useNotifications();
  const [contractClient, setContractClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState({
    minProfit: 1000,
    maxRisk: 0.05,
    autoExecute: false,
    monitoringInterval: 5000
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  const monitoringRef = useRef(null);
  const alertsRef = useRef([]);
  const executeRateLimit = useRef(createRateLimiter(5, 60000)); // 5 executions per minute

  useEffect(() => {
    initializeClient();
    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
      }
    };
  }, []);

  const initializeClient = async () => {
    try {
      // Validate contract configuration
      const contractIds = {
        flashLoanEngine: 'FLASH_LOAN_ENGINE_CONTRACT_ID',
        arbitrageDetector: 'ARBITRAGE_DETECTOR_CONTRACT_ID',
        tradingEngine: 'TRADING_ENGINE_CONTRACT_ID',
        reflectorOracle: 'CBIW2BTCOMOEV5WQC2JRWVH4TAXCZNAUIUOXYVAYP4YDW4D3AEEQPNTC'
      };

      // Validate contract addresses (simplified validation for demo)
      for (const [name, id] of Object.entries(contractIds)) {
        if (!id || id.length < 10) {
          throw new Error(`Invalid contract ID for ${name}: ${id}`);
        }
      }

      const client = new StellarContractClient({
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        contractIds
      });
      
      // Test connection
      await client.testConnection?.();
      
      setContractClient(client);
      setIsConnected(true);
      addAlert('success', 'Successfully connected to Stellar smart contracts');
      addNotification('Successfully connected to Stellar smart contracts', 'success');
    } catch (error) {
      console.error('Failed to initialize contract client:', error);
      const errorMessage = `Failed to connect to smart contracts: ${error.message}`;
      addAlert('error', errorMessage);
      handleApiError(error, 'Contract Initialization');
      setIsConnected(false);
    }
  };

  const validateConfig = (newConfig) => {
    const errors = {};
    
    if (!validateAmount(newConfig.minProfit) || newConfig.minProfit < 0) {
      errors.minProfit = 'Minimum profit must be a positive number';
    }
    
    if (typeof newConfig.maxRisk !== 'number' || newConfig.maxRisk < 0 || newConfig.maxRisk > 1) {
      errors.maxRisk = 'Maximum risk must be between 0 and 1';
    }
    
    if (!Number.isInteger(newConfig.monitoringInterval) || newConfig.monitoringInterval < 1000) {
      errors.monitoringInterval = 'Monitoring interval must be at least 1000ms';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const updateConfig = (field, value) => {
    const newConfig = { ...config, [field]: value };
    const validation = validateConfig(newConfig);
    
    if (validation.isValid) {
      setConfig(newConfig);
      setValidationErrors({});
      addNotification(`Configuration updated: ${field}`, 'success');
    } else {
      setValidationErrors(validation.errors);
      addNotification(`Invalid configuration: ${validation.errors[field]}`, 'error');
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
    
    // Auto-remove alerts after 5 seconds
    setTimeout(() => {
      alertsRef.current = alertsRef.current.filter(a => a.id !== alert.id);
      setAlerts([...alertsRef.current]);
    }, 5000);
  };

  const startMonitoring = async () => {
    if (!contractClient || isMonitoring) return;

    try {
      setIsMonitoring(true);
      addAlert('info', 'Starting arbitrage monitoring...');

      const intervalId = await contractClient.startArbitrageMonitoring(
        (data) => {
          if (data.type === 'opportunities') {
            setOpportunities(data.data);
            
            if (config.autoExecute && data.data.length > 0) {
              const bestOpportunity = data.data.reduce((best, current) => 
                current.profit_estimate > best.profit_estimate ? current : best
              );
              
              if (bestOpportunity.profit_estimate >= config.minProfit) {
                executeArbitrage(bestOpportunity);
              }
            }
          } else if (data.type === 'metrics') {
            setMetrics(data.data);
          } else if (data.type === 'error') {
            addAlert('error', `Monitoring error: ${data.error}`);
          }
        },
        config.monitoringInterval
      );

      monitoringRef.current = intervalId;
      addAlert('success', 'Arbitrage monitoring started');
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      addAlert('error', 'Failed to start monitoring');
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    if (monitoringRef.current) {
      contractClient.stopArbitrageMonitoring(monitoringRef.current);
      monitoringRef.current = null;
    }
    setIsMonitoring(false);
    addAlert('info', 'Arbitrage monitoring stopped');
  };

  const executeArbitrage = async (opportunity) => {
    if (!contractClient || isExecuting) {
      addNotification('Cannot execute: system not ready or already executing', 'warning');
      return;
    }

    // Rate limiting check
    if (!executeRateLimit.current()) {
      addNotification('Execution rate limit exceeded. Please wait before trying again.', 'warning');
      return;
    }

    try {
      // Validate opportunity data
      if (!opportunity || !opportunity.asset_a || !opportunity.asset_b) {
        throw new Error('Invalid opportunity data');
      }

      if (!validateAmount(opportunity.profit_estimate)) {
        throw new Error('Invalid profit estimate');
      }

      if (opportunity.profit_estimate < config.minProfit) {
        throw new Error(`Profit estimate (${opportunity.profit_estimate}) below minimum threshold (${config.minProfit})`);
      }

      setIsExecuting(true);
      const executionMessage = `Executing arbitrage for ${opportunity.asset_a.code}/${opportunity.asset_b.code}`;
      addAlert('info', executionMessage);
      addNotification(executionMessage, 'info');

      // Generate a keypair for demo purposes (in production, use secure key management)
      const sourceKeypair = Keypair.random();

      // Validate flash loan provider address
      const flashLoanProvider = 'FLASH_LOAN_PROVIDER_ADDRESS';
      if (!validateStellarAddress(flashLoanProvider)) {
        throw new Error('Invalid flash loan provider address');
      }

      const params = {
        sourceKeypair,
        flashLoanProvider: sanitizeInput(flashLoanProvider),
        opportunities: [opportunity],
        riskTolerance: config.maxRisk
      };

      // Validate risk tolerance
      if (config.maxRisk < 0 || config.maxRisk > 1) {
        throw new Error('Risk tolerance must be between 0 and 1');
      }

      const result = await contractClient.executeAdvancedArbitrage(params);
      
      const execution = {
        id: Date.now(),
        opportunity,
        result,
        timestamp: new Date().toISOString(),
        status: result.status === 'SUCCESS' ? 'completed' : 'failed',
        profit: result.status === 'SUCCESS' ? opportunity.profit_estimate : 0,
        gasUsed: result.gasUsed || 0,
        transactionHash: result.transactionHash || null
      };

      setExecutionHistory(prev => [execution, ...prev.slice(0, 9)]);
      
      if (result.status === 'SUCCESS') {
        const successMessage = `Arbitrage executed successfully! Profit: ${formatProfit(opportunity.profit_estimate)} XLM`;
        addAlert('success', successMessage);
        addNotification(successMessage, 'success');
      } else {
        const errorMessage = `Arbitrage execution failed: ${result.error || 'Unknown error'}`;
        addAlert('error', errorMessage);
        addNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Arbitrage execution failed:', error);
      const errorMessage = `Execution failed: ${error.message}`;
      addAlert('error', errorMessage);
      handleApiError(error, 'Arbitrage Execution');
      
      // Add failed execution to history
      const failedExecution = {
        id: Date.now(),
        opportunity,
        result: { status: 'FAILED', error: error.message },
        timestamp: new Date().toISOString(),
        status: 'failed',
        profit: 0
      };
      setExecutionHistory(prev => [failedExecution, ...prev.slice(0, 9)]);
    } finally {
      setIsExecuting(false);
    }
  };

  const emergencyStop = async () => {
    if (!contractClient) return;

    try {
      const sourceKeypair = Keypair.random();
      await contractClient.emergencyStop(sourceKeypair, true);
      addAlert('warning', 'Emergency stop activated');
      stopMonitoring();
    } catch (error) {
      console.error('Emergency stop failed:', error);
      addAlert('error', 'Emergency stop failed');
    }
  };

  const formatProfit = (profit) => {
    return (profit / 10000000).toFixed(4); // Convert stroops to XLM
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">⚡ Arbitrage Executor</h1>
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
          <CardTitle>🎛️ Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Min Profit (stroops)</label>
              <input
                type="number"
                value={config.minProfit}
                onChange={(e) => setConfig(prev => ({ ...prev, minProfit: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Risk (%)</label>
              <input
                type="number"
                value={config.maxRisk * 100}
                onChange={(e) => setConfig(prev => ({ ...prev, maxRisk: parseFloat(e.target.value) / 100 }))}
                className="w-full p-2 border rounded-md"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monitor Interval (ms)</label>
              <input
                type="number"
                value={config.monitoringInterval}
                onChange={(e) => setConfig(prev => ({ ...prev, monitoringInterval: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
                min="1000"
                step="1000"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.autoExecute}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoExecute: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto Execute</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={!isConnected}
              variant={isMonitoring ? "destructive" : "default"}
            >
              {isMonitoring ? "⏹️ Stop Monitoring" : "▶️ Start Monitoring"}
            </Button>
            <Button
              onClick={emergencyStop}
              disabled={!isConnected}
              variant="destructive"
            >
              🚨 Emergency Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Live Opportunities ({opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No arbitrage opportunities detected
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.slice(0, 5).map((opportunity, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {opportunity.asset_a.code} ↔ {opportunity.asset_b.code}
                      </div>
                      <div className="text-sm text-gray-600">
                        Exchange A: {opportunity.exchange_a} → Exchange B: {opportunity.exchange_b}
                      </div>
                      <div className="text-sm text-gray-600">
                        Price Difference: {(opportunity.price_difference * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        +{formatProfit(opportunity.profit_estimate)} XLM
                      </div>
                      <Button
                        size="sm"
                        onClick={() => executeArbitrage(opportunity)}
                        disabled={isExecuting || !isConnected}
                        className="mt-2"
                      >
                        {isExecuting ? "⏳ Executing..." : "⚡ Execute"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {executionHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No executions yet
            </div>
          ) : (
            <div className="space-y-3">
              {executionHistory.map((execution) => (
                <div key={execution.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {execution.opportunity.asset_a.code} ↔ {execution.opportunity.asset_b.code}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(execution.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                      {execution.profit > 0 && (
                        <div className="font-bold text-green-600 mt-1">
                          +{formatProfit(execution.profit)} XLM
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

      {/* Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>📈 Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.total_executions || 0}
                </div>
                <div className="text-sm text-gray-600">Total Executions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.successful_executions || 0}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatProfit(metrics.total_profit || 0)} XLM
                </div>
                <div className="text-sm text-gray-600">Total Profit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {((metrics.successful_executions || 0) / Math.max(metrics.total_executions || 1, 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArbitrageExecutor;