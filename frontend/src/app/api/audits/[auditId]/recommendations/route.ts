import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase/server-with-clerk'
import { RecommendationGenerator } from '@/lib/analysis/recommendation-generator'
import { AuditGoal } from '@/components/audits/goal-selection'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  try {
    const { auditId } = await params
    
    // Get authenticated client with user context
    const { supabase, user } = await createAuthenticatedClient()

    // Get audit details (scoped to user)
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Get analysis results
    const analysisResult = audit.analysis_result as any
    const performanceMetrics = audit.performance_metrics as any

    if (!analysisResult || !performanceMetrics) {
      return NextResponse.json({ 
        error: 'Analysis not complete. Please run analysis first.' 
      }, { status: 400 })
    }

    // Generate recommendations based on goal
    const generator = new RecommendationGenerator(audit.goal as AuditGoal)
    
    const recommendations = generator.getAllRecommendations(
      analysisResult.asinMetrics || [],
      performanceMetrics,
      null // No competitor data yet
    )

    // Store recommendations in audit record
    const { error: updateError } = await supabase
      .from('audits')
      .update({ 
        recommendations: recommendations as any,
        recommendations_generated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('Error storing recommendations:', updateError)
    }

    return NextResponse.json({
      recommendations,
      goal: audit.goal,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}