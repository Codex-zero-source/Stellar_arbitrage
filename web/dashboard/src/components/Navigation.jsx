import React from 'react';

const Navigation = () => {
  return (
    <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-white font-bold text-xl bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Stellar DEX Arbitrage
              </h1>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                Dashboard
              </button>
              <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                Settings
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-teal-600 px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-teal-700 transition-all">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;