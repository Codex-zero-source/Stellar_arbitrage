import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    profitabilityThreshold: 0.5,
    maxTradeSize: 1000,
    slippageTolerance: 0.25,
    gasPriceThreshold: 100000,
    enableNotifications: true,
    enableAutoTrade: false,
    selectedDexPairs: ['Stellar DEX 1-Stellar DEX 2', 'Stellar DEX 2-Stellar DEX 3']
  });

  const dexPairs = [
    'Stellar DEX 1-Stellar DEX 2',
    'Stellar DEX 2-Stellar DEX 3',
    'Stellar DEX 1-Stellar DEX 3',
    'Stellar DEX 4-Stellar DEX 1'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || value
    }));
  };

  const handleDexPairChange = (pair) => {
    setSettings(prev => {
      const newPairs = prev.selectedDexPairs.includes(pair)
        ? prev.selectedDexPairs.filter(p => p !== pair)
        : [...prev.selectedDexPairs, pair];
      
      return {
        ...prev,
        selectedDexPairs: newPairs
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings updated:', settings);
    // In a real implementation, this would send the settings to your backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Settings</h1>
          <p className="text-gray-400 mt-2">Configure your DEX-to-DEX arbitrage parameters</p>
        </header>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Trading Parameters</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Profitability Threshold (%)
                </label>
                <input
                  type="number"
                  name="profitabilityThreshold"
                  value={settings.profitabilityThreshold}
                  onChange={handleInputChange}
                  step="0.1"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Minimum profit percentage required to trigger an arbitrage opportunity
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Trade Size (XLM)
                </label>
                <input
                  type="number"
                  name="maxTradeSize"
                  value={settings.maxTradeSize}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Maximum amount to trade in a single arbitrage transaction
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slippage Tolerance (%)
                </label>
                <input
                  type="number"
                  name="slippageTolerance"
                  value={settings.slippageTolerance}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Maximum acceptable price movement during trade execution
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Gas Price Threshold (stroops)
                </label>
                <input
                  type="number"
                  name="gasPriceThreshold"
                  value={settings.gasPriceThreshold}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Maximum gas price to execute trades
                </p>
              </div>

              <div className="md:col-span-2 pt-4">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">DEX Pair Monitoring</h2>
                <p className="text-sm text-gray-400 mb-4">Select which DEX pairs to monitor for arbitrage opportunities</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dexPairs.map((pair) => (
                    <div key={pair} className="flex items-center p-3 bg-gray-700/30 rounded-lg">
                      <input
                        type="checkbox"
                        id={pair}
                        checked={settings.selectedDexPairs.includes(pair)}
                        onChange={() => handleDexPairChange(pair)}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={pair} className="ml-2 block text-sm">
                        {pair}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 pt-4">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Notifications</h2>
              </div>

              <div className="flex items-center md:col-span-2 p-3 bg-gray-700/30 rounded-lg">
                <input
                  type="checkbox"
                  name="enableNotifications"
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="enableNotifications" className="ml-2 block text-sm">
                  Enable Notifications
                </label>
                <p className="mt-1 text-sm text-gray-400 ml-6">
                  Receive alerts for new opportunities and trade execution
                </p>
              </div>

              <div className="flex items-center md:col-span-2 p-3 bg-gray-700/30 rounded-lg">
                <input
                  type="checkbox"
                  name="enableAutoTrade"
                  id="enableAutoTrade"
                  checked={settings.enableAutoTrade}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="enableAutoTrade" className="ml-2 block text-sm">
                  Enable Auto Trading
                </label>
                <p className="mt-1 text-sm text-gray-400 ml-6">
                  Automatically execute profitable arbitrage opportunities
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all font-medium"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;