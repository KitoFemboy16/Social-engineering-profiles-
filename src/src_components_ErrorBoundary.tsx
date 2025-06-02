import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDev: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDev: process.env.NODE_ENV === 'development'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Catch error and error info for logging
    this.setState({
      errorInfo
    });

    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack trace:', errorInfo.componentStack);

    // Optional: Send error to a reporting service
    this.reportError(error, errorInfo);
  }

  // Report error to a service (placeholder function)
  reportError(error: Error, errorInfo: ErrorInfo): void {
    // This would typically send the error to a reporting service
    // For example: errorReportingService.logError(error, errorInfo);
    
    // For now, we'll just log that we would report it
    console.log('Would report this error to a service:', error.message);
  }

  // Reset the error boundary state
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  // Reload the application
  handleReload = (): void => {
    window.location.reload();
  };

  // Return to home page
  handleReturnHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, isDev } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise, use our default fallback UI with Black Mirror aesthetic
      return (
        <div className="error-boundary">
          <div className="error-container card">
            <div className="error-header">
              <div className="error-icon">⚠</div>
              <h2 className="error-title">System Malfunction</h2>
            </div>
            
            <div className="error-body">
              <p className="error-message">
                {isDev 
                  ? error?.message || 'An unexpected error occurred.'
                  : 'The system has encountered an unexpected error.'}
              </p>
              
              {isDev && errorInfo && (
                <div className="error-details">
                  <h3>Component Stack</h3>
                  <pre className="error-stack">{errorInfo.componentStack}</pre>
                </div>
              )}
              
              <div className="error-actions">
                <button 
                  className="btn btn-primary btn-glow"
                  onClick={this.handleReset}
                >
                  Attempt Recovery
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={this.handleReload}
                >
                  Reboot System
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={this.handleReturnHome}
                >
                  Return to Main Interface
                </button>
              </div>
            </div>
            
            <div className="error-footer">
              <p className="error-code">
                {isDev 
                  ? `Error: ${error?.name} | ${new Date().toISOString()}`
                  : `Incident ID: ${Math.random().toString(36).substring(2, 12).toUpperCase()}`}
              </p>
            </div>
          </div>
          
          {/* Glitch effect overlay */}
          <div className="glitch-overlay"></div>
        </div>
      );
    }

    // If there's no error, render children normally
    return children;
  }
}

export default ErrorBoundary;
