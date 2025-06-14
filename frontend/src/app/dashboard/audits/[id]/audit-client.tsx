'use client'

import { useRouter } from 'next/navigation'
import { AuditDetailView } from '@/components/audits/audit-detail-view'

interface AuditClientProps {
  audit: any
}

export function AuditClient({ audit }: AuditClientProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return <AuditDetailView audit={audit} onUpdate={handleUpdate} />
}