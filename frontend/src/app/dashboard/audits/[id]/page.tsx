import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAuthenticatedClient } from '@/lib/supabase/server-with-clerk'
import { AuditClient } from './audit-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AuditDetailPage({ params }: PageProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const { id } = await params
  
  try {
    const { supabase, user } = await createAuthenticatedClient()
    
    const { data: audit, error } = await supabase
      .from('audits')
      .select(`
        *,
        audit_files (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !audit) {
      redirect('/dashboard')
    }

    return <AuditClient audit={audit} />
  } catch (error) {
    console.error('Audit detail error:', error)
    redirect('/dashboard')
  }
}