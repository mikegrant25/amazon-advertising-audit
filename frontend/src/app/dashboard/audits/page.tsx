import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAuthenticatedClient } from '@/lib/supabase/server-with-clerk'
import { AuditHistoryClient } from './audit-history-client'

export default async function AuditsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    const { supabase, user } = await createAuthenticatedClient()
    
    const { data: audits, error } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching audits:', error)
    }

    return <AuditHistoryClient audits={audits || []} />
  } catch (error) {
    console.error('Authentication error:', error)
    return <AuditHistoryClient audits={[]} />
  }
}