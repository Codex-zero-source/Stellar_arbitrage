import React, { useEffect, useRef } from 'react';
import { useWebSocket } from './SocketContext';

const ArbitrageLogViewer = () => {
  const { logs } = useWebSocket();
  const terminalEndRef = useRef(null);
  const terminalRef = useRef(null);

  // Scroll to the bottom of the terminal on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const getLineColor = (logEntry) => {
    // Handle undefined or null log entries
    if (!logEntry) {
      return ""; // Default color
    }
    
    const { type, content } = logEntry;
    
    // If content is not a string, convert it
    if (!content) {
      return ""; // Default color if content is undefined
    }
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const lowerCaseContent = contentStr.toLowerCase();
    
    // Color based on message type first
    if (type === 'error') {
      return "error";
    }
    if (type === 'warning') {
      return "warning";
    }
    if (type === 'success') {
      return "success";
    }
    
    // Then color based on content keywords
    if (lowerCaseContent.includes("error") || lowerCaseContent.includes("disconnected") || lowerCaseContent.includes("failed")) {
        return "error";
    }
    if (lowerCaseContent.includes("opportunity") || lowerCaseContent.includes("trade") || lowerCaseContent.includes("success")) {
        return "opportunity";
    }
    if (lowerCaseContent.includes("status: connected") || lowerCaseContent.includes("websocket server started")) {
        return "success";
    }
    if (lowerCaseContent.includes("warning") || lowerCaseContent.includes("low")) {
        return "warning";
    }
    return ""; // Default color
  }

  const formatLogMessage = (logEntry) => {
    // Handle undefined or null log entries
    if (!logEntry) {
      return '';
    }
    
    const { content } = logEntry;
    
    // If it's already a string, return it as is
    if (typeof content === 'string') {
      return content;
    }
    
    // If it's an object, try to format it nicely
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return String(content);
    }
  }

  const getLogPrefix = (logEntry) => {
    if (!logEntry) return '';
    
    const { type } = logEntry;
    
    switch (type) {
      case 'error':
        return '[ERROR] ';
      case 'warning':
        return '[WARN]  ';
      case 'success':
        return '[SUCCESS] ';
      case 'info':
        return '[INFO]  ';
      default:
        return '';
    }
  }

  return (
    <div className="brutal-glass">
      <div className="border-b-4 border-neon-cyan p-4">
        <h2 className="text-neon-cyan font-black uppercase text-lg tracking-widest text-glow">
          ARBITRAGE ENGINE OUTPUT
        </h2>
      </div>
      <div 
        ref={terminalRef}
        className="h-80 overflow-y-auto bg-brutal-black/80 border-4 border-neon-cyan m-4 p-4 terminal font-mono text-sm"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#00F6FF #000000' }}
      >
        {logs.length === 0 ? (
          <div className="text-neon-lime text-glow animate-pulse">
            <span className="text-neon-cyan">[SYSTEM]</span> Waiting for arbitrage engine output...
          </div>
        ) : (
          logs.map((logEntry, index) => {
            const lineColor = getLineColor(logEntry);
            const colorClass = {
              'error': 'text-brutal-red',
              'warning': 'text-brutal-yellow',
              'success': 'text-neon-lime',
              'opportunity': 'text-neon-cyan',
              '': 'text-white'
            }[lineColor] || 'text-white';

            return (
              <div key={index} className={`terminal-line mb-1 ${colorClass} text-glow`}>
                <span className="text-neon-magenta font-bold">{getLogPrefix(logEntry)}</span>
                <span className="font-mono">{formatLogMessage(logEntry)}</span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default ArbitrageLogViewer;