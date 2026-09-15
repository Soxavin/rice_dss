import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#fafafa' }}
      >
        <div
          className="max-w-md w-full text-center p-8 bg-white"
          style={{
            border: '1px solid #bdbdbd',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            borderRadius: '16px',
          }}
        >
          <p className="text-4xl mb-3">⚠️</p>
          <h1 className="text-lg font-bold text-neutral-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-500">
            An unexpected error occurred. Reloading the page usually fixes this.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#558b2f', color: '#fff' }}
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
