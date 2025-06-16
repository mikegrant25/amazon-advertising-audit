import { NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase/server-with-clerk'
import { queueFileForProcessing } from '@/lib/csv/processor'
import { FileType } from '@/lib/csv/types'

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }
    
    // Get authenticated client with user context
    const { supabase, user } = await createAuthenticatedClient()
    
    // Get file details - ensure it belongs to user's audit
    const { data: file, error: fileError } = await supabase
      .from('audit_files')
      .select('*, audits!inner(id, user_id)')
      .eq('id', fileId)
      .eq('audits.user_id', user.id)
      .single()
    
    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Check if file is already processed or processing
    if (file.status !== 'pending') {
      return NextResponse.json({ 
        error: 'File is already being processed or has been processed' 
      }, { status: 400 })
    }
    
    // Queue file for processing
    const result = await queueFileForProcessing(
      file.id,
      file.storage_path,
      file.file_type as FileType
    )
    
    return NextResponse.json({
      message: 'File processing completed',
      result
    })
    
  } catch (error) {
    console.error('File processing API error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}

// Get processing status
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get file status
    const { data: file, error } = await supabase
      .from('audit_files')
      .select('id, status, validation_result, error_message, processed_at, audits!inner(user_id)')
      .eq('id', fileId)
      .single()
    
    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Verify user owns this file
    if (file.audits.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    return NextResponse.json({
      fileId: file.id,
      status: file.status,
      validationResult: file.validation_result,
      errorMessage: file.error_message,
      processedAt: file.processed_at
    })
    
  } catch (error) {
    console.error('Get file status error:', error)
    return NextResponse.json(
      { error: 'Failed to get file status' },
      { status: 500 }
    )
  }
}