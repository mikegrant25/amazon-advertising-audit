'use client'

import { CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WorkflowStep = 
  | 'create-audit'
  | 'upload-files'
  | 'select-goal'
  | 'analyze-data'
  | 'view-results'
  | 'download-report'

export type StepStatus = 'pending' | 'current' | 'completed' | 'error'

interface Step {
  id: WorkflowStep
  label: string
  description: string
  status: StepStatus
}

interface WorkflowProgressProps {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  errorStep?: WorkflowStep
  className?: string
}

const stepDefinitions: Record<WorkflowStep, { label: string; description: string }> = {
  'create-audit': {
    label: 'Create Audit',
    description: 'Name your audit and provide details'
  },
  'upload-files': {
    label: 'Upload Files',
    description: 'Upload at least 2 Amazon CSV reports'
  },
  'select-goal': {
    label: 'Select Goal',
    description: 'Choose your optimization objective'
  },
  'analyze-data': {
    label: 'Analyze Data',
    description: 'Process files and generate insights'
  },
  'view-results': {
    label: 'View Results',
    description: 'Review recommendations and metrics'
  },
  'download-report': {
    label: 'Download Report',
    description: 'Get your PDF report'
  }
}

const stepOrder: WorkflowStep[] = [
  'create-audit',
  'upload-files',
  'select-goal',
  'analyze-data',
  'view-results',
  'download-report'
]

export function WorkflowProgress({ 
  currentStep, 
  completedSteps, 
  errorStep,
  className 
}: WorkflowProgressProps) {
  const getStepStatus = (stepId: WorkflowStep): StepStatus => {
    if (errorStep === stepId) return 'error'
    if (currentStep === stepId) return 'current'
    if (completedSteps.includes(stepId)) return 'completed'
    return 'pending'
  }

  const steps: Step[] = stepOrder.map(stepId => ({
    id: stepId,
    ...stepDefinitions[stepId],
    status: getStepStatus(stepId)
  }))

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop view */}
      <div className="hidden md:block">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => (
            <li 
              key={step.id} 
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "w-full"
              )}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : step.status === 'current' ? (
                    <div className="relative">
                      <Circle className="w-8 h-8 text-blue-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    step.status === 'completed' && "text-green-600",
                    step.status === 'current' && "text-blue-600",
                    step.status === 'error' && "text-red-600",
                    step.status === 'pending' && "text-gray-400"
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    "text-xs mt-1 max-w-[120px]",
                    step.status === 'pending' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4",
                  steps[index + 1].status !== 'pending' ? "bg-green-600" : "bg-gray-300"
                )} />
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <ol className="relative border-l border-gray-300">
          {steps.map((step) => (
            <li key={step.id} className="mb-8 ml-6">
              <span className={cn(
                "absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white",
                step.status === 'completed' && "bg-green-100",
                step.status === 'current' && "bg-blue-100",
                step.status === 'error' && "bg-red-100",
                step.status === 'pending' && "bg-gray-100"
              )}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : step.status === 'current' ? (
                  <Circle className="w-5 h-5 text-blue-600" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </span>
              <h3 className={cn(
                "font-medium text-sm",
                step.status === 'completed' && "text-green-600",
                step.status === 'current' && "text-blue-600",
                step.status === 'error' && "text-red-600",
                step.status === 'pending' && "text-gray-400"
              )}>
                {step.label}
              </h3>
              <p className={cn(
                "text-xs mt-1",
                step.status === 'pending' ? "text-gray-400" : "text-gray-600"
              )}>
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}