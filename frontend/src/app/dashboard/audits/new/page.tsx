import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AuditCreationWizard } from '@/components/audits/audit-creation-wizard'

export default async function NewAuditPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <AuditCreationWizard />
        </div>
      </div>
    </div>
  )
}