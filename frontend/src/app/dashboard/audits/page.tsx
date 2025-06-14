import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuditHistoryClient } from './audit-history-client'

export default async function AuditsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const supabase = await createClient()
  
  const { data: audits, error } = await supabase
    .from('audits')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching audits:', error)
  }

  return <AuditHistoryClient audits={audits || []} />
}