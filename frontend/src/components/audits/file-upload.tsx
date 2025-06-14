'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

type FileType = 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'

interface FileUploadProps {
  auditId: string
  fileType: FileType
  onUploadComplete?: (fileId: string) => void
  onError?: (error: Error) => void
}

const fileTypeLabels: Record<FileType, string> = {
  sponsored_products: 'Sponsored Products Report',
  sponsored_brands: 'Sponsored Brands Report',
  sponsored_display: 'Sponsored Display Report',
  search_terms: 'Search Terms Report',
  business_report: 'Business Report'
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export function FileUpload({ auditId, fileType, onUploadComplete, onError }: FileUploadProps) {
  const { userId } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.endsWith('.csv')) {
      return 'Please upload a CSV file'
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 500MB'
    }
    
    return null
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    const error = validateFile(file)
    
    if (error) {
      onError?.(new Error(error))
      return
    }

    if (!userId) {
      onError?.(new Error('You must be logged in to upload files'))
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      
      // Generate unique file path
      const timestamp = Date.now()
      const fileName = `${auditId}/${fileType}_${timestamp}.csv`
      
      // Upload to Supabase Storage
      // Note: Supabase doesn't support progress tracking natively
      // Set to 50% when upload starts
      setUploadProgress(50)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audit-files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Create database record
      const { data: fileRecord, error: dbError } = await supabase
        .from('audit_files')
        .insert({
          audit_id: auditId,
          file_type: fileType,
          original_filename: file.name,
          storage_path: uploadData.path,
          file_size_bytes: file.size,
          status: 'pending'
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadedFile(file.name)
      onUploadComplete?.(fileRecord.id)
    } catch (error) {
      console.error('Upload error:', error)
      onError?.(error as Error)
    } finally {
      setIsUploading(false)
    }
  }, [auditId, fileType, userId, validateFile, onUploadComplete, onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isUploading || !!uploadedFile
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-blue-500 bg-blue-50",
          isUploading && "cursor-not-allowed opacity-50",
          uploadedFile && "border-green-500 bg-green-50 cursor-not-allowed",
          !isDragActive && !isUploading && !uploadedFile && "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        
        {uploadedFile ? (
          <div className="space-y-2">
            <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 font-medium">Uploaded: {uploadedFile}</p>
          </div>
        ) : isUploading ? (
          <div className="space-y-2">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Uploading... {uploadProgress}%</p>
            <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600">
              {isDragActive ? 'Drop the file here' : `Drag and drop your ${fileTypeLabels[fileType]} here`}
            </p>
            <p className="text-sm text-gray-500">or click to select a CSV file (max 500MB)</p>
          </div>
        )}
      </div>
    </div>
  )
}