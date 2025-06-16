import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client with service role privileges.
 * This bypasses RLS and should only be used in server-side code
 * where we can verify the user's identity through Clerk.
 * 
 * IMPORTANT: Never expose the service role key to the client!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}