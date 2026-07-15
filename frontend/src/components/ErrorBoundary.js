import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ error: error, errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ margin: '20px', padding: '20px', border: '2px solid #C25934', borderRadius: '8px', backgroundColor: '#FDFBF7' }}>
          <h1 style={{ color: '#C25934', fontFamily: 'Playfair Display, serif' }}>Something went wrong.</h1>
          <p style={{ color: '#5C4B40', marginTop: '1rem' }}>
            The application has encountered an error. Please try refreshing the page. If the problem persists, the details below might help identify the issue.
          </p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1.5rem', background: '#F3EFE6', padding: '10px', borderRadius: '4px', border: '1px solid #E3DCCF' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2D241E' }}>Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;