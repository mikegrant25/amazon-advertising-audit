'use client'

import { useAuth } from '@clerk/nextjs'
import { createBrowserClient } from '@supabase/ssr'
import { useMemo } from 'react'
import type { Database } from '@/types/database.types'

/**
 * Hook to create a Supabase client authenticated with Clerk JWT
 * For use in Client Components
 */
export function useClerkSupabase() {
  const { getToken } = useAuth()
  
  const supabase = useMemo(() => {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await getToken()
            
            // Create new headers object
            const headers = new Headers(options.headers)
            
            // Add Clerk JWT as Bearer token
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`)
            }
            
            // Use native fetch with modified headers
            return fetch(url, {
              ...options,
              headers,
            })
          },
        },
      }
    )
  }, [getToken])
  
  return supabase
}