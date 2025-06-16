import { NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase/server-with-clerk'
import { z } from 'zod'

// Schema for audit creation
const createAuditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  goal: z.enum(['profitability', 'growth', 'launch', 'defense', 'portfolio']),
  date_range_start: z.string().min(1, 'Start date is required'),
  date_range_end: z.string().min(1, 'End date is required')
})

// Create a new audit
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = createAuditSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { name, goal, date_range_start, date_range_end } = validationResult.data

    // Get authenticated client with user context
    const { supabase, user } = await createAuthenticatedClient()

    // Create the audit
    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        name,
        goal,
        date_range_start,
        date_range_end,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating audit:', error)
      return NextResponse.json(
        { error: 'Failed to create audit' },
        { status: 500 }
      )
    }

    return NextResponse.json({ audit })
  } catch (error) {
    console.error('Audit creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create audit' },
      { status: 500 }
    )
  }
}

// Update an audit
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { auditId, ...updates } = body

    if (!auditId) {
      return NextResponse.json(
        { error: 'Audit ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated client with user context
    const { supabase, user } = await createAuthenticatedClient()

    // Update the audit (only if user owns it)
    const { data: audit, error } = await supabase
      .from('audits')
      .update(updates)
      .eq('id', auditId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !audit) {
      console.error('Error updating audit:', error)
      return NextResponse.json(
        { error: 'Failed to update audit or audit not found' },
        { status: error ? 500 : 404 }
      )
    }

    return NextResponse.json({ audit })
  } catch (error) {
    console.error('Audit update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update audit' },
      { status: 500 }
    )
  }
}

// Get user's audits
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get authenticated client with user context
    const { supabase, user } = await createAuthenticatedClient()

    // Get user's audits
    const { data: audits, error, count } = await supabase
      .from('audits')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching audits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audits' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      audits: audits || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Audit fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audits' },
      { status: 500 }
    )
  }
}