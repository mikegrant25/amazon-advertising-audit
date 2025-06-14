'use client'

import { CheckCircle, Download, BarChart3, RefreshCw, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface WorkflowCompletionProps {
  auditId: string
  auditName: string
  processingTime: number // in seconds
  totalFiles: number
  productsAnalyzed: number
  recommendationsCount: number
  onStartNewAudit: () => void
}

export function WorkflowCompletion({
  auditId,
  auditName,
  processingTime,
  totalFiles,
  productsAnalyzed,
  recommendationsCount,
  onStartNewAudit
}: WorkflowCompletionProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Analysis Complete!
          </h2>
          <p className="text-lg text-gray-600">
            Your audit &quot;{auditName}&quot; has been successfully processed
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Processing Time</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {formatTime(processingTime)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Files Processed</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {totalFiles} files
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Products Analyzed</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {productsAnalyzed.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Recommendations</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {recommendationsCount} found
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href={`/dashboard/audits/${auditId}/recommendations`} className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Recommendations & Download Report
            </Button>
          </Link>
          
          <Link href={`/dashboard/audits/${auditId}`} className="block">
            <Button variant="outline" className="w-full" size="lg">
              View Audit Details
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onStartNewAudit}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Audit
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Your PDF report includes all analysis results and can be 
            shared with stakeholders. Download it from the recommendations page.
          </p>
        </div>
      </div>
    </div>
  )
}