'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RecommendationsDashboard } from '@/components/recommendations/recommendations-dashboard'
import { GoalIndicator } from '@/components/audits/goal-indicator'
import { AuditGoal } from '@/components/audits/goal-selection'
import { PDFGenerator } from '@/components/reports/pdf-generator'
import type { Recommendation } from '@/types/recommendation'

interface RecommendationsClientProps {
  audit: any
}

export function RecommendationsClient({ audit }: RecommendationsClientProps) {
  const [flywheelData, setFlywheelData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        // Get performance metrics
        const perfResponse = await fetch(`/api/audits/${audit.id}/performance`)
        if (perfResponse.ok) {
          const perfData = await perfResponse.json()
          setPerformanceData(perfData)
        }

        // Analysis result already contains flywheel data
        if (audit.analysis_result) {
          setFlywheelData(audit.analysis_result)
        }
      } catch (error) {
        console.error('Error loading analysis data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalysisData()
  }, [audit.id, audit.analysis_result])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/dashboard/audits/${audit.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Audit Details
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{audit.name}</h1>
              <p className="text-gray-600 mt-1">
                Optimization recommendations tailored to your goals
              </p>
            </div>
            <GoalIndicator goal={audit.goal as AuditGoal} variant="compact" />
          </div>
        </div>

        {/* Recommendations */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <RecommendationsDashboard
              auditId={audit.id}
              goal={audit.goal as AuditGoal}
              flywheelData={flywheelData}
              performanceData={performanceData}
              onRecommendationsGenerated={setRecommendations}
            />
            
            {recommendations.length > 0 && (
              <div className="mt-8">
                <PDFGenerator
                  audit={audit}
                  flywheelAnalysis={flywheelData}
                  performanceMetrics={performanceData}
                  recommendations={recommendations}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}