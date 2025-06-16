import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, properties, timestamp, url, referrer } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Store analytics event
    const { error } = await supabase
      .from('pilot_analytics')
      .insert({
        user_id: userId,
        event_name: event,
        event_properties: properties || {},
        page_url: url,
        referrer: referrer,
        created_at: timestamp || new Date().toISOString()
      })

    if (error) {
      console.error('Error storing analytics:', error)
      // Don't fail the request if analytics fails
      // We don't want to break the user experience
    }

    // In production, you might also want to:
    // 1. Send to Google Analytics
    // 2. Send to Mixpanel/Amplitude
    // 3. Aggregate metrics for dashboards

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing analytics:', error)
    // Return success even on error to not break the app
    return NextResponse.json({ success: true })
  }
}