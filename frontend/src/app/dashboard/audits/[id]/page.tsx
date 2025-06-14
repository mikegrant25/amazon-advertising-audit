import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  
  const { data: audit, error } = await supabase
    .from('audits')
    .select(`
      *,
      audit_files (*)
    `)
    .eq('id', id)
    .single()

  if (error || !audit) {
    redirect('/dashboard')
  }

  return <AuditClient audit={audit} />
}