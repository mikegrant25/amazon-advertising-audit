'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { FileUpload } from './file-upload'

const auditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  goal: z.enum(['profitability', 'growth', 'launch', 'defense', 'portfolio']),
  dateRangeStart: z.string().min(1, 'Start date is required'),
  dateRangeEnd: z.string().min(1, 'End date is required')
}).refine(data => new Date(data.dateRangeEnd) >= new Date(data.dateRangeStart), {
  message: 'End date must be after start date',
  path: ['dateRangeEnd']
})

type AuditFormData = z.infer<typeof auditSchema>

const goalDescriptions = {
  profitability: 'Maximize profit margins across your portfolio',
  growth: 'Scale revenue while maintaining efficiency',
  launch: 'Optimize launch strategies for maximum impact',
  defense: 'Protect market share from competitors',
  portfolio: 'Balance performance across product lines'
}

export function AuditCreationForm() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [isCreating, setIsCreating] = useState(false)
  const [auditId, setAuditId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuditFormData>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      goal: 'growth'
    }
  })

  const onSubmit = async (data: AuditFormData) => {
    if (!user || isCreating) return

    setIsCreating(true)
    try {
      const supabase = createClient()
      
      const { data: audit, error } = await supabase
        .from('audits')
        .insert({
          user_id: user.id,
          name: data.name,
          goal: data.goal,
          date_range_start: data.dateRangeStart,
          date_range_end: data.dateRangeEnd,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setAuditId(audit.id)
    } catch (error) {
      console.error('Error creating audit:', error)
      alert('Failed to create audit. Please try again.')
      setIsCreating(false)
    }
  }

  const handleFileUpload = (fileType: string) => {
    setUploadedFiles(prev => new Set(prev).add(fileType))
  }

  const canProceed = uploadedFiles.size >= 2 // At least 2 files required

  const handleProceed = () => {
    if (auditId) {
      router.push(`/dashboard/audits/${auditId}`)
    }
  }

  if (userLoading) {
    return <div>Loading...</div>
  }

  if (!auditId) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Audit Name
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Q4 2024 Campaign Analysis"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Analysis Goal
          </label>
          <select
            {...register('goal')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(goalDescriptions).map(([value, description]) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)} - {description}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              {...register('dateRangeStart')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.dateRangeStart && (
              <p className="text-red-500 text-sm mt-1">{errors.dateRangeStart.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
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
          disabled={isCreating}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Audit'}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">Audit created successfully! Now upload your Amazon advertising data files.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upload Required Files</h3>
        <p className="text-gray-600">Upload at least 2 files to begin analysis. The more files you provide, the more comprehensive the analysis.</p>
        
        <div className="grid gap-4">
          <div>
            <h4 className="font-medium mb-2">Sponsored Products Report</h4>
            <FileUpload
              auditId={auditId}
              fileType="sponsored_products"
              onUploadComplete={() => handleFileUpload('sponsored_products')}
              onError={(error) => alert(error.message)}
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Search Terms Report</h4>
            <FileUpload
              auditId={auditId}
              fileType="search_terms"
              onUploadComplete={() => handleFileUpload('search_terms')}
              onError={(error) => alert(error.message)}
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Business Report (Optional)</h4>
            <FileUpload
              auditId={auditId}
              fileType="business_report"
              onUploadComplete={() => handleFileUpload('business_report')}
              onError={(error) => alert(error.message)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProceed}
          disabled={!canProceed}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Analysis ({uploadedFiles.size} files uploaded)
        </button>
      </div>
    </div>
  )
}