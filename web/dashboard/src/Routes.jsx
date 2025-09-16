import React, { useState } from 'react';
import Navigation from './components/Navigation';
import ArbitrageDashboard from './components/ArbitrageDashboard';
import Settings from './components/Settings';
import Button from './components/ui/Button';

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
          <Button
            onClick={() => setCurrentView('dashboard')}
            variant={currentView === 'dashboard' ? 'primary' : 'ghost'}
            size="sm"
            className="text-sm font-medium"
          >
            Dashboard
          </Button>
          <Button
            onClick={() => setCurrentView('settings')}
            variant={currentView === 'settings' ? 'primary' : 'ghost'}
            size="sm"
            className="text-sm font-medium"
          >
            Settings
          </Button>
        </div>
        {renderView()}
      </div>
    </div>
  );
};

export default Routes;