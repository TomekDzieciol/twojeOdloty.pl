import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          padding: '2rem',
          background: '#1a1a2e',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <h1 style={{ marginBottom: '1rem', color: '#e94560' }}>Wystąpił błąd</h1>
          <p style={{ marginBottom: '0.5rem' }}>{this.state.error.message}</p>
          <pre style={{
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            overflow: 'auto',
            maxWidth: '100%',
            fontSize: '0.85rem',
          }}>
            {this.state.error.stack}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1rem',
              background: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
