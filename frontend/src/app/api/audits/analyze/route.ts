import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { FlywheelAnalyzer } from '@/lib/analysis/flywheel-analyzer'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { auditId } = await request.json()
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user owns this audit
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, status, user_id')
      .eq('id', auditId)
      .single()
    
    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    
    if (audit.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Check if all files are processed
    const { data: files, error: filesError } = await supabase
      .from('audit_files')
      .select('id, status')
      .eq('audit_id', auditId)
    
    if (filesError || !files) {
      return NextResponse.json({ error: 'Failed to check file status' }, { status: 500 })
    }
    
    const unprocessedFiles = files.filter(f => f.status !== 'completed' && f.status !== 'warning')
    if (unprocessedFiles.length > 0) {
      return NextResponse.json({ 
        error: 'All files must be processed before analysis',
        unprocessedCount: unprocessedFiles.length 
      }, { status: 400 })
    }
    
    // Check minimum file requirements
    const fileTypes = await supabase
      .from('audit_files')
      .select('file_type')
      .eq('audit_id', auditId)
      .eq('status', 'completed')
    
    const hasAdData = fileTypes.data?.some(f => 
      ['sponsored_products', 'sponsored_brands', 'sponsored_display'].includes(f.file_type)
    )
    const hasBusinessData = fileTypes.data?.some(f => f.file_type === 'business_report')
    
    if (!hasAdData || !hasBusinessData) {
      return NextResponse.json({ 
        error: 'Analysis requires at least one advertising report and one business report' 
      }, { status: 400 })
    }
    
    // Update audit status to processing
    await supabase
      .from('audits')
      .update({ status: 'processing' })
      .eq('id', auditId)
    
    // Run analysis
    try {
      const analyzer = new FlywheelAnalyzer(supabase)
      const result = await analyzer.analyzeAudit(auditId)
      
      return NextResponse.json({
        message: 'Analysis completed successfully',
        result: {
          totalASINs: result.totalASINs,
          totalRevenue: result.totalRevenue,
          totalAdSpend: result.totalAdSpend,
          overallACoS: result.overallACoS,
          overallROAS: result.overallROAS,
          recommendations: result.recommendations
        }
      })
      
    } catch (analysisError) {
      // Update audit status to failed
      await supabase
        .from('audits')
        .update({ status: 'failed' })
        .eq('id', auditId)
      
      throw analysisError
    }
    
  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze audit' },
      { status: 500 }
    )
  }
}

// Get analysis status/results
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get audit with analysis results
    const { data: audit, error } = await supabase
      .from('audits')
      .select('id, status, analysis_result, completed_at, user_id')
      .eq('id', auditId)
      .single()
    
    if (error || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    
    if (audit.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    return NextResponse.json({
      auditId: audit.id,
      status: audit.status,
      completedAt: audit.completed_at,
      analysisResult: audit.analysis_result
    })
    
  } catch (error) {
    console.error('Get analysis status error:', error)
    return NextResponse.json(
      { error: 'Failed to get analysis status' },
      { status: 500 }
    )
  }
}