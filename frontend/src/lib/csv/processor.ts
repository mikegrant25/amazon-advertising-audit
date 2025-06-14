import { createClient } from '@/lib/supabase/client'
import { CSVParser } from './parser'
import { FileType, ValidationResult } from './types'

export interface ProcessingResult {
  fileId: string
  status: 'success' | 'error' | 'warning'
  validation: ValidationResult
  processedAt: string
  error?: string
}

export class CSVProcessor {
  private supabase = createClient()
  
  async processFile(fileId: string, storagePath: string, fileType: FileType): Promise<ProcessingResult> {
    const startTime = new Date().toISOString()
    
    try {
      // Update file status to processing
      await this.updateFileStatus(fileId, 'processing')
      
      // Download file from Supabase storage
      const fileData = await this.downloadFile(storagePath)
      if (!fileData) {
        throw new Error('Failed to download file from storage')
      }
      
      // Parse and validate CSV
      const parser = new CSVParser(fileType)
      const { parsedData, validation } = await parser.parseFile(fileData)
      
      if (!validation.isValid) {
        // Update file status to error with validation results
        await this.updateFileStatus(fileId, 'error', validation)
        
        return {
          fileId,
          status: 'error',
          validation,
          processedAt: new Date().toISOString(),
          error: 'File validation failed'
        }
      }
      
      // Store parsed data in processing tables
      if (parsedData) {
        await this.storeParsedData(fileId, fileType, parsedData.data)
      }
      
      // Update file status to completed
      const finalStatus = validation.warnings.length > 0 ? 'warning' : 'completed'
      await this.updateFileStatus(fileId, finalStatus, validation)
      
      return {
        fileId,
        status: validation.warnings.length > 0 ? 'warning' : 'success',
        validation,
        processedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('File processing error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Update file status to error
      await this.updateFileStatus(fileId, 'error', undefined, errorMessage)
      
      return {
        fileId,
        status: 'error',
        validation: {
          isValid: false,
          errors: [{ message: errorMessage, severity: 'error' }],
          warnings: [],
          stats: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            columns: []
          }
        },
        processedAt: new Date().toISOString(),
        error: errorMessage
      }
    }
  }
  
  private async downloadFile(storagePath: string): Promise<File | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from('audit-files')
        .download(storagePath)
      
      if (error) {
        console.error('Storage download error:', error)
        return null
      }
      
      // Convert blob to File object
      const file = new File([data], storagePath.split('/').pop() || 'file.csv', {
        type: 'text/csv'
      })
      
      return file
    } catch (error) {
      console.error('Download error:', error)
      return null
    }
  }
  
  private async updateFileStatus(
    fileId: string, 
    status: string, 
    validation?: ValidationResult,
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      processed_at: new Date().toISOString()
    }
    
    if (validation) {
      updateData.validation_result = {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        stats: validation.stats,
        errors: validation.errors.slice(0, 10), // Store first 10 errors
        warnings: validation.warnings.slice(0, 10) // Store first 10 warnings
      }
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage
    }
    
    const { error } = await this.supabase
      .from('audit_files')
      .update(updateData)
      .eq('id', fileId)
    
    if (error) {
      console.error('Failed to update file status:', error)
    }
  }
  
  private async storeParsedData(fileId: string, fileType: FileType, data: any[]) {
    // For now, we'll store the parsed data in a generic parsed_data table
    // In production, you might want separate tables for each report type
    
    const batchSize = 1000 // Insert in batches to avoid timeouts
    const totalBatches = Math.ceil(data.length / batchSize)
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, data.length)
      const batch = data.slice(start, end)
      
      const records = batch.map((row, index) => ({
        file_id: fileId,
        file_type: fileType,
        row_number: start + index + 1,
        data: row,
        created_at: new Date().toISOString()
      }))
      
      const { error } = await this.supabase
        .from('parsed_data')
        .insert(records)
      
      if (error) {
        console.error(`Failed to insert batch ${i + 1}/${totalBatches}:`, error)
        throw new Error(`Failed to store parsed data: ${error.message}`)
      }
    }
  }
}

// Singleton instance for processing queue
let processingQueue: Promise<ProcessingResult>[] = []
let isProcessing = false

export async function queueFileForProcessing(
  fileId: string, 
  storagePath: string, 
  fileType: FileType
): Promise<ProcessingResult> {
  const processor = new CSVProcessor()
  
  // Add to queue
  const processingPromise = new Promise<ProcessingResult>(async (resolve) => {
    // Wait for turn in queue
    while (isProcessing) {
      await new Promise(r => setTimeout(r, 100))
    }
    
    isProcessing = true
    try {
      const result = await processor.processFile(fileId, storagePath, fileType)
      resolve(result)
    } finally {
      isProcessing = false
    }
  })
  
  processingQueue.push(processingPromise)
  
  // Clean up completed promises
  processingPromise.finally(() => {
    processingQueue = processingQueue.filter(p => p !== processingPromise)
  })
  
  return processingPromise
}