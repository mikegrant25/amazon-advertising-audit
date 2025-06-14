'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Calendar, 
  Target, 
  TrendingUp, 
  Rocket, 
  Shield, 
  Grid3X3,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { GoalIndicator } from '@/components/audits/goal-indicator'
import type { AuditGoal } from '@/components/audits/goal-selection'
import { Button } from '@/components/ui/button'

const goalIcons = {
  profitability: Target,
  growth: TrendingUp,
  launch: Rocket,
  defense: Shield,
  portfolio: Grid3X3
}

const goalDisplayNames = {
  profitability: 'Maximize Profitability',
  growth: 'Scale Revenue',
  launch: 'Accelerate Launch',
  defense: 'Defend Market Share',
  portfolio: 'Optimize Portfolio'
}

interface Audit {
  id: string
  name: string
  description?: string
  goal?: string
  status: string
  created_at: string
  updated_at: string
}

interface AuditHistoryClientProps {
  audits: Audit[]
}

export function AuditHistoryClient({ audits }: AuditHistoryClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGoal, setFilterGoal] = useState<string>('all')

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (audit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = filterStatus === 'all' || audit.status === filterStatus
    const matchesGoal = filterGoal === 'all' || audit.goal === filterGoal
    
    return matchesSearch && matchesStatus && matchesGoal
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
          <p className="text-gray-600 mt-1">
            View and manage all your Amazon advertising audits
          </p>
        </div>
        <Link href="/dashboard">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search audits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Goals</option>
            <option value="profitability">Maximize Profitability</option>
            <option value="growth">Scale Revenue</option>
            <option value="launch">Accelerate Launch</option>
            <option value="defense">Defend Market Share</option>
            <option value="portfolio">Optimize Portfolio</option>
          </select>
        </div>
      </div>

      {/* Audit List */}
      <div className="bg-white rounded-lg shadow">
        {filteredAudits.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No audits found</h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all' || filterGoal !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first audit to get started'}
            </p>
            {audits.length === 0 && (
              <Link href="/dashboard">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Audit
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/dashboard/audits/${audit.id}`}
                className="block hover:bg-gray-50 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {audit.name}
                        </h3>
                        {getStatusBadge(audit.status)}
                        {audit.goal && (
                          <GoalIndicator 
                            goal={audit.goal as AuditGoal} 
                            variant="compact" 
                          />
                        )}
                      </div>
                      
                      {audit.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {audit.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })}
                        </span>
                        {audit.status === 'completed' && (
                          <span className="text-green-600 font-medium">
                            View Results →
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {getStatusIcon(audit.status)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {audits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Audits</p>
            <p className="text-2xl font-bold text-gray-900">{audits.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {audits.filter(a => a.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {audits.filter(a => a.status === 'processing').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-600">
              {audits.filter(a => a.status === 'pending').length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}