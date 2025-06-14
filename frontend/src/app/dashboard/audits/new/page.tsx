import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AuditCreationForm } from '@/components/audits/audit-creation-form'

export default async function NewAuditPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Create New Audit</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <AuditCreationForm />
      </div>
    </div>
  )
}