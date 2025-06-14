'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GoalSelection, type AuditGoal } from './goal-selection'
import { 
  Target, 
  TrendingUp, 
  Rocket, 
  Shield, 
  Grid3X3,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

const goalIcons = {
  profitability: <Target className="w-5 h-5" />,
  growth: <TrendingUp className="w-5 h-5" />,
  launch: <Rocket className="w-5 h-5" />,
  defense: <Shield className="w-5 h-5" />,
  portfolio: <Grid3X3 className="w-5 h-5" />
}

const goalColors = {
  profitability: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  growth: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  launch: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  defense: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  portfolio: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
}

interface AuditDetailViewProps {
  audit: any
  onUpdate?: () => void
}

export function AuditDetailView({ audit, onUpdate }: AuditDetailViewProps) {
  const [isChangingGoal, setIsChangingGoal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<AuditGoal>(audit.goal)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleGoalChange = async (goal: AuditGoal) => {
    setSelectedGoal(goal)
  }

  const handleSaveGoal = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from('audits')
      .update({ goal: selectedGoal })
      .eq('id', audit.id)

    if (!error) {
      setIsChangingGoal(false)
      if (onUpdate) onUpdate()
    }
  }

  const handleStartAnalysis = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/audits/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: audit.id })
      })

      if (response.ok) {
        if (onUpdate) onUpdate()
      } else {
        throw new Error('Failed to start analysis')
      }
    } catch (error) {
      console.error('Error starting analysis:', error)
      alert('Failed to start analysis. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const allFilesProcessed = audit.audit_files.every((f: any) => 
    f.status === 'completed' || f.status === 'warning'
  )
  const hasMinimumFiles = audit.audit_files.length >= 2
  const canStartAnalysis = allFilesProcessed && hasMinimumFiles && audit.status === 'pending'

  const goalColor = goalColors[audit.goal as keyof typeof goalColors]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{audit.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {new Date(audit.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>
                {new Date(audit.date_range_start).toLocaleDateString()} - {new Date(audit.date_range_end).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            audit.status === 'completed' ? 'bg-green-100 text-green-800' :
            audit.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            audit.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Goal Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Analysis Goal</h3>
          {audit.status === 'pending' && !isChangingGoal && (
            <button
              onClick={() => setIsChangingGoal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Change Goal
            </button>
          )}
        </div>

        {isChangingGoal ? (
          <div>
            <GoalSelection
              selectedGoal={selectedGoal}
              onGoalSelect={handleGoalChange}
              onContinue={handleSaveGoal}
            />
            <button
              onClick={() => setIsChangingGoal(false)}
              className="mt-4 text-gray-600 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className={`p-4 rounded-lg border-2 ${goalColor.bg} ${goalColor.border}`}>
            <div className={`flex items-center gap-3 ${goalColor.text}`}>
              {goalIcons[audit.goal as keyof typeof goalIcons]}
              <div>
                <h4 className="font-semibold">
                  {audit.goal.charAt(0).toUpperCase() + audit.goal.slice(1).replace(/_/g, ' ')}
                </h4>
                <p className="text-sm opacity-90">
                  Your analysis will be optimized for this objective
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
        
        {audit.audit_files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audit.audit_files.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{file.original_filename}</p>
                    <p className="text-sm text-gray-500">
                      {file.file_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    {file.validation_result?.warnings?.length > 0 && (
                      <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {file.validation_result.warnings.length} warnings
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {file.status === 'processing' && (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    file.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    file.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    file.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    file.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {file.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasMinimumFiles && audit.audit_files.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Upload at least 2 files to begin analysis
            </p>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      {audit.status === 'pending' && canStartAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Ready for Analysis</h3>
          <p className="text-gray-600 mb-4">
            All files have been processed successfully. You can now start the analysis.
          </p>
          <button
            onClick={handleStartAnalysis}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              <>
                Start Flywheel Analysis
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      {audit.status === 'completed' && audit.analysis_result && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Products Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {audit.analysis_result.productsAnalyzed || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Flywheel Opportunities</p>
                <p className="text-2xl font-bold text-green-700">
                  {audit.analysis_result.flywheelOpportunities?.length || 0}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Potential Monthly Savings</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${audit.analysis_result.totalMonthlySavings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* View Recommendations Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
                <p className="text-sm text-gray-600 mt-1">
                  View personalized recommendations based on your {audit.goal} goal
                </p>
              </div>
              <a
                href={`/dashboard/audits/${audit.id}/recommendations`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Recommendations
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}