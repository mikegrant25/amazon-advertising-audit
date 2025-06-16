'use client'

import { useAuth, useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Hook to create a Supabase client authenticated with Clerk JWT
 * For use in Client Components
 */
export function useClerkSupabase() {
  const { session } = useSession()
  
  // Create a custom Supabase client that injects the Clerk session token
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: async () => {
          // Get token from the 'supabase' JWT template
          const token = await session?.getToken({ template: 'supabase' })
          
          return {
            Authorization: token ? `Bearer ${token}` : '',
          }
        },
      },
    }
  )
}