import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const goalLabels = {
    profitability: 'Profitability Focus',
    growth: 'Growth Mode',
    launch: 'New Product Launch',
    defense: 'Market Defense',
    portfolio: 'Portfolio Optimization'
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{audit.name}</h2>
        <div className="flex items-center gap-4 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[audit.status]}`}>
            {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
          </span>
          <span className="text-gray-600">
            Goal: {goalLabels[audit.goal as keyof typeof goalLabels]}
          </span>
          <span className="text-gray-600">
            {new Date(audit.date_range_start).toLocaleDateString()} - {new Date(audit.date_range_end).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
        
        {audit.audit_files.length === 0 ? (
          <p className="text-gray-500">No files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {audit.audit_files.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{file.original_filename}</p>
                  <p className="text-sm text-gray-500">
                    {file.file_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  file.status === 'processed' ? 'bg-green-100 text-green-800' : 
                  file.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {audit.status === 'pending' && audit.audit_files.length >= 2 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">Your audit is ready for processing. The analysis will begin shortly.</p>
          </div>
        )}
      </div>
    </div>
  )
}