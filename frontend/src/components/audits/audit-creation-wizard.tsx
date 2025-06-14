'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { FileUploadWithProcessing } from './file-upload-with-processing'
import { GoalSelection, type AuditGoal } from './goal-selection'
import { CheckCircle, Upload, Target, Play } from 'lucide-react'
import { WorkflowTimer } from '@/lib/workflow/timing'
import { WorkflowProgress, type WorkflowStep } from '@/components/workflow/workflow-progress'

const auditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dateRangeStart: z.string().min(1, 'Start date is required'),
  dateRangeEnd: z.string().min(1, 'End date is required')
}).refine(data => new Date(data.dateRangeEnd) >= new Date(data.dateRangeStart), {
  message: 'End date must be after start date',
  path: ['dateRangeEnd']
})

type AuditFormData = z.infer<typeof auditSchema>

type WizardStep = 'details' | 'upload' | 'goal' | 'processing'

interface StepIndicatorProps {
  currentStep: WizardStep
  completedSteps: Set<WizardStep>
}

function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const steps = [
    { id: 'details' as const, label: 'Audit Details', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'upload' as const, label: 'Upload Files', icon: <Upload className="w-5 h-5" /> },
    { id: 'goal' as const, label: 'Select Goal', icon: <Target className="w-5 h-5" /> },
    { id: 'processing' as const, label: 'Process', icon: <Play className="w-5 h-5" /> }
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          const isPast = index < currentIndex

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isCompleted ? 'bg-green-600 text-white' : 
                      isCurrent ? 'bg-blue-600 text-white' : 
                      isPast ? 'bg-gray-300 text-gray-600' : 
                      'bg-gray-100 text-gray-400'}
                  `}
                >
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : step.icon}
                </div>
                <span className={`
                  mt-2 text-sm font-medium
                  ${isCurrent ? 'text-blue-600' : isCompleted || isPast ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 transition-colors
                  ${isPast || isCompleted ? 'bg-gray-300' : 'bg-gray-100'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AuditCreationWizard() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [currentStep, setCurrentStep] = useState<WizardStep>('details')
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [auditId, setAuditId] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<AuditGoal | undefined>()
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set())
  const [auditData, setAuditData] = useState<AuditFormData | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuditFormData>({
    resolver: zodResolver(auditSchema)
  })

  const onSubmitDetails = async (data: AuditFormData) => {
    setAuditData(data)
    setCompletedSteps(prev => new Set([...prev, 'details']))
    setCurrentStep('upload')
  }

  const createAudit = async () => {
    if (!user || !auditData) return

    setIsCreating(true)
    try {
      const supabase = createClient()
      
      const { data: audit, error } = await supabase
        .from('audits')
        .insert({
          user_id: user.id,
          name: auditData.name,
          goal: selectedGoal || 'growth',
          date_range_start: auditData.dateRangeStart,
          date_range_end: auditData.dateRangeEnd,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setAuditId(audit.id)
      return audit.id
    } catch (error) {
      console.error('Error creating audit:', error)
      alert('Failed to create audit. Please try again.')
      setIsCreating(false)
      return null
    }
  }

  const handleFileUpload = (fileType: string) => {
    setUploadedFiles(prev => new Set(prev).add(fileType))
  }

  const handleProceedFromUpload = async () => {
    if (!auditId) {
      const id = await createAudit()
      if (!id) return
    }
    setCompletedSteps(prev => new Set([...prev, 'upload']))
    setCurrentStep('goal')
  }

  const handleGoalSelect = async (goal: AuditGoal) => {
    setSelectedGoal(goal)
    
    if (auditId) {
      // Update the audit with the selected goal
      const supabase = createClient()
      await supabase
        .from('audits')
        .update({ goal })
        .eq('id', auditId)
    }
  }

  const handleProceedToAnalysis = () => {
    setCompletedSteps(prev => new Set([...prev, 'goal']))
    setCurrentStep('processing')
    
    // Redirect to the audit page
    if (auditId) {
      router.push(`/dashboard/audits/${auditId}`)
    }
  }

  const canProceedFromUpload = uploadedFiles.size >= 2 // At least 2 files required

  if (userLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      {currentStep === 'details' && (
        <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Create New Audit</h2>
          
          <div>
            <label htmlFor="audit-name" className="block text-sm font-medium text-gray-700 mb-1">
              Audit Name
            </label>
            <input
              id="audit-name"
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Q4 2024 Campaign Analysis"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                {...register('dateRangeStart')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.dateRangeStart && (
                <p className="text-red-500 text-sm mt-1">{errors.dateRangeStart.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                {...register('dateRangeEnd')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.dateRangeEnd && (
                <p className="text-red-500 text-sm mt-1">{errors.dateRangeEnd.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Continue to File Upload
          </button>
        </form>
      )}

      {currentStep === 'upload' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Upload Your Amazon Advertising Data</h2>
            <p className="text-gray-600">Upload at least 2 files to begin analysis. The more files you provide, the more comprehensive the analysis.</p>
          </div>
          
          <div className="grid gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Sponsored Products Report</h4>
              <p className="text-sm text-gray-600 mb-3">Campaign performance data for Sponsored Products</p>
              <FileUploadWithProcessing
                auditId={auditId || 'temp'}
                fileType="sponsored_products"
                onUploadComplete={() => handleFileUpload('sponsored_products')}
                onProcessingComplete={(fileId, status) => console.log(`File ${fileId} processed with status: ${status}`)}
                onError={(error) => alert(error.message)}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Search Terms Report</h4>
              <p className="text-sm text-gray-600 mb-3">Customer search queries and their performance</p>
              <FileUploadWithProcessing
                auditId={auditId || 'temp'}
                fileType="search_terms"
                onUploadComplete={() => handleFileUpload('search_terms')}
                onProcessingComplete={(fileId, status) => console.log(`File ${fileId} processed with status: ${status}`)}
                onError={(error) => alert(error.message)}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Business Report (Recommended)</h4>
              <p className="text-sm text-gray-600 mb-3">Product-level sales data for flywheel analysis</p>
              <FileUploadWithProcessing
                auditId={auditId || 'temp'}
                fileType="business_report"
                onUploadComplete={() => handleFileUpload('business_report')}
                onProcessingComplete={(fileId, status) => console.log(`File ${fileId} processed with status: ${status}`)}
                onError={(error) => alert(error.message)}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Sponsored Brands Report (Optional)</h4>
              <p className="text-sm text-gray-600 mb-3">Campaign performance for Sponsored Brands</p>
              <FileUploadWithProcessing
                auditId={auditId || 'temp'}
                fileType="sponsored_brands"
                onUploadComplete={() => handleFileUpload('sponsored_brands')}
                onProcessingComplete={(fileId, status) => console.log(`File ${fileId} processed with status: ${status}`)}
                onError={(error) => alert(error.message)}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Sponsored Display Report (Optional)</h4>
              <p className="text-sm text-gray-600 mb-3">Campaign performance for Sponsored Display</p>
              <FileUploadWithProcessing
                auditId={auditId || 'temp'}
                fileType="sponsored_display"
                onUploadComplete={() => handleFileUpload('sponsored_display')}
                onProcessingComplete={(fileId, status) => console.log(`File ${fileId} processed with status: ${status}`)}
                onError={(error) => alert(error.message)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {uploadedFiles.size} of 2 required files uploaded
            </div>
            <button
              onClick={handleProceedFromUpload}
              disabled={!canProceedFromUpload || isCreating}
              className={`
                px-6 py-2 rounded-lg font-medium transition
                ${canProceedFromUpload && !isCreating
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isCreating ? 'Creating Audit...' : 'Continue to Goal Selection'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 'goal' && (
        <GoalSelection
          selectedGoal={selectedGoal}
          onGoalSelect={handleGoalSelect}
          onContinue={handleProceedToAnalysis}
        />
      )}

      {currentStep === 'processing' && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Processing Your Audit</h2>
          <p className="text-gray-600">Redirecting to your analysis dashboard...</p>
        </div>
      )}
    </div>
  )
}