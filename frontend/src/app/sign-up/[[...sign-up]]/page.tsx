'use client'

import { SignUp } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if Clerk is properly configured
    const timer = setTimeout(() => {
      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        setError('Clerk publishable key is not configured')
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Add console logs for debugging
  if (typeof window !== 'undefined') {
    console.log('SignUp page loaded')
    console.log('Clerk key exists:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    console.log('Key prefix:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      {error ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please ensure all required environment variables are set in production.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading sign-up form...</p>
        </div>
      ) : (
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl"
            }
          }}
          afterSignUpUrl="/dashboard"
          signInUrl="/sign-in"
          // Add fallback UI if Clerk fails to load
          fallback={
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-2">Sign-up form is loading...</h2>
              <p className="text-gray-600">If this message persists, please check your internet connection.</p>
            </div>
          }
        />
      )}
    </div>
  )
}