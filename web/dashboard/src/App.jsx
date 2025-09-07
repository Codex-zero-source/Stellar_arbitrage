import React from 'react';
import ArbitrageDashboard from './components/ArbitrageDashboard'; // Import the new dashboard
import './index.css'; // Ensure the new styles are loaded

function App() {
  return (
    <div className="App">
      <ArbitrageDashboard /> {/* Render the new dashboard */}
    </div>
  );
}

export default App;

