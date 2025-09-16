import React, { useState, useEffect } from 'react';
import ArbitrageDashboard from './components/ArbitrageDashboard';
import UIShowcase from './components/UIShowcase';
import RiskDashboard from './components/RiskDashboard';
import PositionSizingCalculator from './components/PositionSizingCalculator';
import ArbitrageExecutor from './components/ArbitrageExecutor';
import ContractMonitor from './components/ContractMonitor';
import Button from './components/ui/Button';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for interactive glass effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ArbitrageDashboard />;
      case 'risk-dashboard':
        return <RiskDashboard />;
      case 'position-sizing':
        return <PositionSizingCalculator />;
      case 'arbitrage-executor':
        return <ArbitrageExecutor />;
      case 'contract-monitor':
        return <ContractMonitor />;
      case 'ui-showcase':
        return <UIShowcase />;
      default:
        return <ArbitrageDashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with Skeuomorphic Elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle Material Textures */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/15 to-teal-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Interactive Light Effect */}
        <div 
          className="absolute w-64 h-64 bg-gradient-radial from-white/8 to-transparent rounded-full blur-2xl pointer-events-none transition-all duration-500"
          style={{
            left: mousePosition.x - 128,
            top: mousePosition.y - 128,
          }}
        ></div>
      </div>

      {/* Simplified Navigation Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Brand Section */}
          <div className="flex items-center justify-center mb-8">
            <div className="skeu-glass px-8 py-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                ⚡ Stellar Arbitrage
              </h1>
              <p className="text-slate-400 text-sm mt-1 text-center">Trading Platform</p>
            </div>
          </div>
          
          {/* Simplified Main Navigation */}
          <nav className="glass-panel p-6 rounded-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Button
                variant={currentView === 'dashboard' ? 'primary' : 'glass'}
                onClick={() => setCurrentView('dashboard')}
                className={`glass-button h-16 flex flex-col items-center justify-center space-y-1 ${
                  currentView === 'dashboard' ? 'material-primary' : ''
                }`}
              >
                <span className="text-xl">📊</span>
                <span className="text-sm font-medium">Overview</span>
              </Button>
              
              <Button
                variant={currentView === 'arbitrage-executor' ? 'primary' : 'glass'}
                onClick={() => setCurrentView('arbitrage-executor')}
                className={`glass-button h-16 flex flex-col items-center justify-center space-y-1 ${
                  currentView === 'arbitrage-executor' ? 'material-primary' : ''
                }`}
              >
                <span className="text-xl">⚡</span>
                <span className="text-sm font-medium">Execute</span>
              </Button>
              
              <Button
                variant={currentView === 'risk-dashboard' ? 'primary' : 'glass'}
                onClick={() => setCurrentView('risk-dashboard')}
                className={`glass-button h-16 flex flex-col items-center justify-center space-y-1 ${
                  currentView === 'risk-dashboard' ? 'material-primary' : ''
                }`}
              >
                <span className="text-xl">🛡️</span>
                <span className="text-sm font-medium">Risk</span>
              </Button>
              
              <Button
                variant={currentView === 'contract-monitor' ? 'primary' : 'glass'}
                onClick={() => setCurrentView('contract-monitor')}
                className={`glass-button h-16 flex flex-col items-center justify-center space-y-1 ${
                  currentView === 'contract-monitor' ? 'material-primary' : ''
                }`}
              >
                <span className="text-xl">📈</span>
                <span className="text-sm font-medium">Monitor</span>
              </Button>
            </div>
            
            {/* Secondary Navigation */}
            <div className="flex justify-center mt-4 space-x-3">
              <Button
                variant={currentView === 'position-sizing' ? 'primary' : 'glass'}
                onClick={() => setCurrentView('position-sizing')}
                className={`glass-button px-4 py-2 text-sm ${
                  currentView === 'position-sizing' ? 'material-success' : ''
                }`}
              >
                🎯 Position Sizing
              </Button>
              <Button
                variant={currentView === 'ui-showcase' ? 'primary' : 'glass'}
                onClick={() => setCurrentView('ui-showcase')}
                className={`glass-button px-4 py-2 text-sm ${
                  currentView === 'ui-showcase' ? 'material-success' : ''
                }`}
              >
                🎨 UI Showcase
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content with Enhanced Glass Container */}
      <main className="relative z-10 px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="skeu-glass rounded-3xl p-8 min-h-[600px] backdrop-blur-xl">
            {renderView()}
          </div>
        </div>
      </main>

      {/* Enhanced Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-20">
        <Button
          onClick={() => setCurrentView('arbitrage-executor')}
          className="glass-fab w-16 h-16 rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 group relative overflow-hidden"
          title="Quick Execute"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300 relative z-10">⚡</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
        </Button>
      </div>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;

