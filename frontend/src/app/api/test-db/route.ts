import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check env vars (without exposing sensitive data)
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    }

    // Try database connection
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    return NextResponse.json({
      envCheck,
      dbTest: {
        success: !error,
        error: error?.message || null,
        dataReceived: !!data,
        rowCount: data?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Caught exception',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}