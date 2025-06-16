import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthenticatedClient } from '@/lib/supabase/server-with-clerk'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    const { supabase, user } = await createAuthenticatedClient()
    
    // Get recent audits
    const { data: recentAudits } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get audit stats
    const { data: stats } = await supabase
      .from('audits')
      .select('status')
      .eq('user_id', user.id)
    
  const auditStats = {
    total: stats?.length || 0,
    completed: stats?.filter(s => s.status === 'completed').length || 0,
    processing: stats?.filter(s => s.status === 'processing').length || 0,
    pending: stats?.filter(s => s.status === 'pending').length || 0
  }

    return <DashboardClient recentAudits={recentAudits || []} stats={auditStats} />
  } catch (error) {
    console.error('Dashboard error:', error)
    return <DashboardClient recentAudits={[]} stats={{ total: 0, completed: 0, processing: 0, pending: 0 }} />
  }
}