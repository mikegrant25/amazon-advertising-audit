'use client'

import { useAuth, useClerk } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function DebugClerkPage() {
  const { isLoaded: authLoaded, userId, sessionId } = useAuth()
  const clerk = useClerk()
  const [clerkStatus, setClerkStatus] = useState<any>({})
  const [windowInfo, setWindowInfo] = useState<any>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowInfo({
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent
      })

      // Check global Clerk object
      const globalClerk = (window as any).Clerk
      setClerkStatus({
        clerkExists: !!globalClerk,
        clerkLoaded: globalClerk?.loaded,
        clerkVersion: globalClerk?.version,
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        keyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
        authLoaded,
        userId,
        sessionId,
        clerkClientLoaded: clerk.loaded
      })
    }
  }, [authLoaded, userId, sessionId, clerk.loaded])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Clerk Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'Not set',
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'Not set',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || 'Not set',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || 'Not set',
}, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Clerk Status</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(clerkStatus, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Window Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(windowInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Network Test</h2>
          <p className="mb-4">Testing Clerk domain resolution...</p>
          <div className="space-y-2">
            <div>
              <span className="font-medium">clerk.audit.verexiq.com:</span>
              <img 
                src="https://clerk.audit.verexiq.com/favicon.ico" 
                alt="Test"
                className="inline-block ml-2 w-4 h-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement?.insertAdjacentHTML('beforeend', ' <span class="text-red-500">❌ Failed to load</span>')
                }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement
                  target.parentElement?.insertAdjacentHTML('beforeend', ' <span class="text-green-500">✅ Loaded</span>')
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}