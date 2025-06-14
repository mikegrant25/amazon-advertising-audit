'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFReport } from './pdf-document'
import type { Audit, FlywheelAnalysis, PerformanceMetrics } from '@/types/audit'
import type { Recommendation } from '@/types/recommendation'

interface PDFGeneratorProps {
  audit: Audit
  flywheelAnalysis: FlywheelAnalysis | null
  performanceMetrics: PerformanceMetrics | null
  recommendations: Recommendation[]
}

export function PDFGenerator({ 
  audit, 
  flywheelAnalysis, 
  performanceMetrics, 
  recommendations 
}: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Generate the PDF
      const doc = (
        <PDFReport 
          audit={audit}
          flywheelAnalysis={flywheelAnalysis}
          performanceMetrics={performanceMetrics}
          recommendations={recommendations}
        />
      )
      
      const pdfBlob = await pdf(doc).toBlob()
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${audit.name.replace(/[^a-z0-9]/gi, '_')}_audit_report_${new Date().toISOString().split('T')[0]}.pdf`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Professional PDF Report
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate a comprehensive PDF report with your audit results, flywheel analysis, 
              performance metrics, and prioritized recommendations.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                Executive summary with key findings
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                Detailed flywheel analysis results
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                Performance metrics breakdown
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                Top 10 prioritized recommendations
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Report will be approximately 4-5 pages
          </div>
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF Report
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> PDF generation may take 10-30 seconds depending on the amount of data. 
          The report will automatically download when ready.
        </p>
      </div>
    </div>
  )
}