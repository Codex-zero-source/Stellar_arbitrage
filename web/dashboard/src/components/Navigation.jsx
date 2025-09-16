import React from 'react';
import Button from './ui/Button';

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
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Settings
              </Button>
              <Button variant="primary" size="sm" className="text-sm font-medium">
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;