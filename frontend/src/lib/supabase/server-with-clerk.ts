import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from './admin'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client that properly handles Clerk authentication.
 * This client uses the service role to bypass RLS, but manually enforces
 * user access controls by including the Clerk user ID in queries.
 * 
 * @returns Object with supabase client and user context
 */
export async function createAuthenticatedClient() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: No user session found')
  }

  const supabase = createAdminClient()
  
  // Get the user record from our database using Clerk ID
  const { data: user, error } = await supabase
    .from('users')
    .select('id, clerk_id, email')
    .eq('clerk_id', userId)
    .single()
  
  if (error || !user) {
    throw new Error('User not found in database. Please ensure webhook is configured.')
  }

  // Return both the client and user context
  return {
    supabase,
    user: {
      id: user.id,
      clerkId: user.clerk_id,
      email: user.email
    }
  }
}

/**
 * Helper function to ensure queries are scoped to the authenticated user
 * Use this for queries that need user scoping
 */
export function scopeToUser<T extends { user_id?: string }>(
  query: any,
  userId: string
) {
  return query.eq('user_id', userId)
}

/**
 * Helper function for audit queries that ensures user ownership
 */
export function scopeAuditToUser(query: any, userId: string) {
  return query.eq('user_id', userId)
}

/**
 * Helper function for audit file queries that ensures user ownership through audit
 */
export async function scopeAuditFileToUser(
  supabase: ReturnType<typeof createAdminClient>,
  auditId: string,
  userId: string
): Promise<boolean> {
  const { data: audit } = await supabase
    .from('audits')
    .select('id')
    .eq('id', auditId)
    .eq('user_id', userId)
    .single()
  
  return !!audit
}