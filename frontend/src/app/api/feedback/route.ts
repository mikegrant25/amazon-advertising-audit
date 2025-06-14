import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feedback, type, auditId, url, userAgent } = body

    if (!feedback || !type) {
      return NextResponse.json(
        { error: 'Feedback and type are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Store feedback in database
    const { data, error } = await supabase
      .from('pilot_feedback')
      .insert({
        user_id: userId,
        feedback_text: feedback,
        feedback_type: type,
        audit_id: auditId || null,
        page_url: url,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing feedback:', error)
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      )
    }

    // In production, you might also want to:
    // 1. Send an email notification to the team
    // 2. Post to a Slack channel
    // 3. Create a ticket in your support system

    return NextResponse.json({
      success: true,
      message: 'Feedback received successfully',
      feedbackId: data.id
    })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}