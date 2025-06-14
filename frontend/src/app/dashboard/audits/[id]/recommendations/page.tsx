import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecommendationsClient } from './recommendations-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecommendationsPage({ params }: PageProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const { id } = await params
  const supabase = await createClient()
  
  const { data: audit, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !audit) {
    redirect('/dashboard')
  }

  if (audit.status !== 'completed') {
    redirect(`/dashboard/audits/${id}`)
  }

  return <RecommendationsClient audit={audit} />
}