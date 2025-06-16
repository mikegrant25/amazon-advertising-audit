import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client authenticated with Clerk JWT
 * For use in Server Components and API routes
 */
export async function createClerkSupabaseClient() {
  const { getToken } = await auth()
  
  // Get token from the 'supabase' JWT template
  const token = await getToken({ template: 'supabase' })
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          // Pass the Clerk JWT as the Authorization header
          // Supabase will use this for RLS policies
          Authorization: `Bearer ${token || ''}`,
        },
      },
    }
  )
}