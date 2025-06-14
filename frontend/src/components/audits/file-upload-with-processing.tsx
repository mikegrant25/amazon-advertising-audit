'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

type FileType = 'sponsored_products' | 'sponsored_brands' | 'sponsored_display' | 'search_terms' | 'business_report'

interface FileUploadProps {
  auditId: string
  fileType: FileType
  onUploadComplete?: (fileId: string) => void
  onProcessingComplete?: (fileId: string, status: string) => void
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

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error' | 'warning'

interface ValidationSummary {
  errorCount: number
  warningCount: number
  totalRows: number
  validRows: number
}

export function FileUploadWithProcessing({ auditId, fileType, onUploadComplete, onProcessingComplete, onError }: FileUploadProps) {
  const { userId } = useAuth()
  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.endsWith('.csv')) {
      return 'Please upload a CSV file'
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 500MB'
    }
    
    return null
  }, [])

  const processFile = useCallback(async (fileId: string) => {
    setStatus('processing')
    
    try {
      const response = await fetch('/api/files/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process file')
      }
      
      const result = await response.json()
      
      // Update status based on result
      if (result.result.status === 'error') {
        setStatus('error')
        setErrorMessage(result.result.error || 'Validation failed')
        if (result.result.validation) {
          setValidationSummary({
            errorCount: result.result.validation.errors.length,
            warningCount: result.result.validation.warnings.length,
            totalRows: result.result.validation.stats.totalRows,
            validRows: result.result.validation.stats.validRows
          })
        }
      } else if (result.result.status === 'warning') {
        setStatus('warning')
        setValidationSummary({
          errorCount: 0,
          warningCount: result.result.validation.warnings.length,
          totalRows: result.result.validation.stats.totalRows,
          validRows: result.result.validation.stats.validRows
        })
      } else {
        setStatus('completed')
        setValidationSummary({
          errorCount: 0,
          warningCount: 0,
          totalRows: result.result.validation.stats.totalRows,
          validRows: result.result.validation.stats.validRows
        })
      }
      
      onProcessingComplete?.(fileId, result.result.status)
      
    } catch (error) {
      console.error('Processing error:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Processing failed')
      onError?.(error as Error)
    }
  }, [onProcessingComplete, onError])

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

    setStatus('uploading')
    setUploadProgress(0)
    setErrorMessage(null)
    setValidationSummary(null)

    try {
      const supabase = createClient()
      
      // Generate unique file path
      const timestamp = Date.now()
      const fileName = `${auditId}/${fileType}_${timestamp}.csv`
      
      // Upload to Supabase Storage
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
      setFileId(fileRecord.id)
      setUploadProgress(100)
      onUploadComplete?.(fileRecord.id)
      
      // Automatically start processing
      await processFile(fileRecord.id)
      
    } catch (error) {
      console.error('Upload error:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      onError?.(error as Error)
    }
  }, [auditId, fileType, userId, validateFile, onUploadComplete, onError, processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: status !== 'idle' && status !== 'error'
  })

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-12 h-12 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`
      case 'processing':
        return 'Processing file...'
      case 'completed':
        return `Processed successfully: ${validationSummary?.validRows} rows`
      case 'warning':
        return `Processed with ${validationSummary?.warningCount} warnings`
      case 'error':
        return errorMessage || 'Processing failed'
      default:
        return null
    }
  }

  const getBorderColor = () => {
    if (isDragActive) return 'border-blue-500 bg-blue-50'
    
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      case 'uploading':
      case 'processing':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-300 hover:border-gray-400'
    }
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          getBorderColor(),
          (status === 'uploading' || status === 'processing') && "cursor-not-allowed opacity-75",
          status === 'completed' && "cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        {status === 'idle' ? (
          <div className="space-y-2">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600">
              {isDragActive ? 'Drop the file here' : `Drag and drop your ${fileTypeLabels[fileType]} here`}
            </p>
            <p className="text-sm text-gray-500">or click to select a CSV file (max 500MB)</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(status === 'uploading' || status === 'processing') ? (
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              getStatusIcon()
            )}
            
            {uploadedFile && (
              <p className="text-sm text-gray-600 font-medium">{uploadedFile}</p>
            )}
            
            <p className={cn(
              "font-medium",
              status === 'completed' && "text-green-700",
              status === 'warning' && "text-yellow-700",
              status === 'error' && "text-red-700",
              (status === 'uploading' || status === 'processing') && "text-blue-700"
            )}>
              {getStatusMessage()}
            </p>
            
            {status === 'uploading' && (
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            
            {validationSummary && (status === 'error' || status === 'warning') && (
              <div className="text-sm text-gray-600 mt-2">
                {validationSummary.errorCount > 0 && (
                  <p>{validationSummary.errorCount} validation errors found</p>
                )}
                {validationSummary.warningCount > 0 && (
                  <p>{validationSummary.warningCount} warnings</p>
                )}
                <p>Total rows: {validationSummary.totalRows}</p>
              </div>
            )}
            
            {status === 'error' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setStatus('idle')
                  setUploadedFile(null)
                  setFileId(null)
                  setErrorMessage(null)
                  setValidationSummary(null)
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try another file
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}