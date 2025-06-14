'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} reset={this.reset} />
      }

      return <DefaultErrorFallback error={this.state.error!} reset={this.reset} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  reset: () => void
}

export function DefaultErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
          Something went wrong
        </h2>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Link href="/dashboard" className="block">
            <Button className="w-full" variant="ghost">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Error details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}