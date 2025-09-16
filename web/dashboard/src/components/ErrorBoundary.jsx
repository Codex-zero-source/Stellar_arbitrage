import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Alert, AlertDescription } from './ui/Alert';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    try {
      // Send error report to backend or monitoring service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };

      // Log to console for development
      console.error('Error Report:', errorReport);

      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/error-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport)
        }).catch(err => console.error('Failed to report error:', err));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Card className="max-w-2xl w-full glass-panel">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertDescription className="text-red-300">
                  Something went wrong while rendering this component. The error has been logged and reported.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">What happened?</h3>
                  <p className="text-slate-400">
                    An unexpected error occurred in the application. This could be due to:
                  </p>
                  <ul className="list-disc list-inside text-slate-400 mt-2 space-y-1">
                    <li>Network connectivity issues</li>
                    <li>Invalid data from the server</li>
                    <li>Browser compatibility problems</li>
                    <li>Temporary service disruption</li>
                  </ul>
                </div>

                {isDevelopment && error && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-200">Error Details (Development)</h3>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <p className="text-red-400 font-mono text-sm mb-2">
                        {error.message}
                      </p>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-slate-300 cursor-pointer hover:text-white">
                            Stack Trace
                          </summary>
                          <pre className="text-xs text-slate-400 mt-2 overflow-auto max-h-40">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                      {errorInfo && errorInfo.componentStack && (
                        <details className="mt-2">
                          <summary className="text-slate-300 cursor-pointer hover:text-white">
                            Component Stack
                          </summary>
                          <pre className="text-xs text-slate-400 mt-2 overflow-auto max-h-40">
                            {errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={this.handleRetry}
                    variant="primary"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={this.handleReload}
                    variant="glass"
                    className="flex-1"
                  >
                    Reload Page
                  </Button>
                </div>

                {errorId && (
                  <div className="text-center">
                    <p className="text-slate-500 text-sm">
                      Error ID: <code className="bg-slate-800 px-2 py-1 rounded">{errorId}</code>
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Please include this ID when reporting the issue
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;