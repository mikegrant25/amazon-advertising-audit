'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Target,
  Rocket,
  Shield,
  Grid3X3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { GoalIndicator } from '@/components/audits/goal-indicator'
import type { AuditGoal } from '@/components/audits/goal-selection'

interface Audit {
  id: string
  name: string
  description?: string
  goal?: string
  status: string
  created_at: string
}

interface DashboardClientProps {
  recentAudits: Audit[]
  stats: {
    total: number
    completed: number
    processing: number
    pending: number
  }
}

const goalIcons = {
  profitability: Target,
  growth: TrendingUp,
  launch: Rocket,
  defense: Shield,
  portfolio: Grid3X3
}

export function DashboardClient({ recentAudits, stats }: DashboardClientProps) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Analyze your Amazon advertising performance with AI-powered insights
          </p>
        </div>
        <Link href="/dashboard/audits/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Insights Found</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed * 12}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Audits</h2>
            {stats.total > 0 && (
              <Link 
                href="/dashboard/audits" 
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </Link>
            )}
          </div>
        </div>
        
        {recentAudits.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No audits yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first audit to start analyzing your Amazon advertising performance
            </p>
            <Link href="/dashboard/audits/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Audit
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/dashboard/audits/${audit.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">
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
                    <p className="text-sm text-gray-600">
                      Created {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Start New Analysis</h3>
          <p className="mb-4 opacity-90">
            Upload your Amazon advertising reports and get AI-powered recommendations
          </p>
          <Link href="/dashboard/audits/new">
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Plus className="mr-2 h-4 w-4" />
              New Audit
            </Button>
          </Link>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">View All Audits</h3>
          <p className="mb-4 opacity-90">
            Access your complete audit history and track performance over time
          </p>
          <Link href="/dashboard/audits">
            <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              <FileText className="mr-2 h-4 w-4" />
              Audit History
            </Button>
          </Link>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Upload at least 3 months of data for the most accurate flywheel analysis. 
              The more data you provide, the better our AI can identify optimization opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}