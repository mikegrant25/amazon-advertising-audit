import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { PerformanceAggregator } from '@/lib/analysis/performance-aggregator'

export async function POST(
  request: Request,
  { params }: { params: { auditId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createClient()

    const { auditId } = params

    // Verify user owns this audit
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, user_id, status')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    if (audit.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if we have processed files
    const { data: files, error: filesError } = await supabase
      .from('audit_files')
      .select('id, file_type, status')
      .eq('audit_id', auditId)
      .eq('status', 'completed')

    if (filesError) {
      return NextResponse.json({ error: 'Failed to check files' }, { status: 500 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No processed files found. Please upload and process files first.' },
        { status: 400 }
      )
    }

    // Check for at least one advertising report
    const hasAdReport = files.some((f: any) => 
      ['sponsored_products', 'sponsored_brands', 'sponsored_display'].includes(f.file_type)
    )

    if (!hasAdReport) {
      return NextResponse.json(
        { error: 'At least one advertising report is required for performance analysis' },
        { status: 400 }
      )
    }

    // Update audit status
    const { error: statusError } = await supabase
      .from('audits')
      .update({ status: 'processing' })
      .eq('id', auditId)

    if (statusError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Perform performance analysis
    const aggregator = new PerformanceAggregator(supabase)
    const analysis = await aggregator.analyzePerformance(auditId)

    // Update audit status to processed
    const { error: completeError } = await supabase
      .from('audits')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (completeError) {
      console.error('Failed to update completion status:', completeError)
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Performance analysis error:', error)
    
    // Try to update audit status back to draft
    try {
      const supabase = await createClient()
      await supabase
        .from('audits')
        .update({ status: 'pending' })
        .eq('id', params.auditId)
    } catch {}

    return NextResponse.json(
      { error: 'Performance analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { auditId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createClient()

    const { auditId } = params

    // Get audit with performance metrics
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, user_id, performance_metrics')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    if (audit.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!audit.performance_metrics) {
      return NextResponse.json({ error: 'No performance analysis found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      analysis: audit.performance_metrics,
    })
  } catch (error) {
    console.error('Get performance analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve performance analysis' },
      { status: 500 }
    )
  }
}