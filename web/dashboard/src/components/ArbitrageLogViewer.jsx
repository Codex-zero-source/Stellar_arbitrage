import React, { useEffect, useRef } from 'react';
import { useWebSocket } from './SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ArbitrageLogViewer = () => {
  const { logs } = useWebSocket();
  const terminalEndRef = useRef(null);

  // Scroll to the bottom of the terminal on new logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLineColor = (logEntry) => {
    // Handle undefined or null log entries
    if (!logEntry) {
      return "text-neon-lime"; // Default log color
    }
    
    const { type, content } = logEntry;
    
    // If content is not a string, convert it
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const lowerCaseContent = contentStr.toLowerCase();
    
    // Color based on message type first
    if (type === 'error') {
      return "text-red-500"; // Neon red for errors
    }
    if (type === 'warning') {
      return "text-yellow-400"; // Yellow for warnings
    }
    if (type === 'success') {
      return "text-green-400"; // Green for success
    }
    
    // Then color based on content keywords
    if (lowerCaseContent.includes("error") || lowerCaseContent.includes("disconnected") || lowerCaseContent.includes("failed")) {
        return "text-red-500"; // Neon red for errors
    }
    if (lowerCaseContent.includes("opportunity") || lowerCaseContent.includes("trade") || lowerCaseContent.includes("success")) {
        return "text-neon-cyan";
    }
    if (lowerCaseContent.includes("status: connected") || lowerCaseContent.includes("websocket server started")) {
        return "text-green-400"; // Neon green for success
    }
    if (lowerCaseContent.includes("warning") || lowerCaseContent.includes("low")) {
        return "text-yellow-400"; // Yellow for warnings
    }
    return "text-neon-lime"; // Default log color
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
    if (!logEntry) return '> ';
    
    const { type } = logEntry;
    
    switch (type) {
      case 'error':
        return '[ERROR] > ';
      case 'warning':
        return '[WARN]  > ';
      case 'success':
        return '[SUCCESS] > ';
      case 'info':
        return '[INFO]  > ';
      default:
        return '> ';
    }
  }

  return (
    <Card className="bg-card/60 border-neon-magenta shadow-[0_0_15px_rgba(255,0,255,0.4)] backdrop-blur-sm bg-gradient-to-br from-card to-card/80">
      <CardHeader>
        <CardTitle className="text-neon-cyan font-bold uppercase text-sm tracking-wider text-glow">
          Arbitrage Engine Output
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="terminal bg-black/80 h-96 overflow-y-auto rounded p-4 font-mono text-sm border border-neon-magenta shadow-[0_0_15px_rgba(255,0,255,0.4)]">
          {logs.length === 0 ? (
            <p className="text-neon-lime text-glow">{'>'} Waiting for arbitrage engine output...</p>
          ) : (
            logs.map((logEntry, index) => (
              <p key={index} className={`terminal-line ${getLineColor(logEntry)} text-glow whitespace-pre-wrap`}>
                <span className="mr-2">{getLogPrefix(logEntry)}</span>
                {formatLogMessage(logEntry)}
              </p>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ArbitrageLogViewer;