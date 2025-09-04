import React, { useState } from 'react';
import Navigation from './components/Navigation';
import ArbitrageDashboard from './components/ArbitrageDashboard';
import Settings from './components/Settings';

const Routes = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ArbitrageDashboard />;
      case 'settings':
        return <Settings />;
      default:
        return <ArbitrageDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-2 mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50 w-fit">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'settings'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Settings
          </button>
        </div>
        {renderView()}
      </div>
    </div>
  );
};

export default Routes;