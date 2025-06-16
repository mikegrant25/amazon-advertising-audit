import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase/create-clerk-client'

export async function GET() {
  try {
    // Get Clerk auth details
    const { userId, sessionId, getToken } = await auth()
    
    // Get the JWT token
    const token = await getToken()
    
    // Decode the JWT to see what's in it (without verifying signature)
    let decodedToken = null
    if (token) {
      const parts = token.split('.')
      if (parts.length === 3) {
        try {
          decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        } catch (e) {
          decodedToken = 'Failed to decode'
        }
      }
    }
    
    // Try to query the users table to see if RLS works
    let userQuery = null
    let userError = null
    try {
      const supabase = await createClerkSupabaseClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, clerk_id, email')
        .eq('clerk_id', userId || '')
        .single()
      
      userQuery = data
      userError = error
    } catch (e) {
      userError = e
    }
    
    return NextResponse.json({
      clerk: {
        userId,
        sessionId,
        hasToken: !!token,
        tokenLength: token?.length || 0
      },
      jwt: {
        decoded: decodedToken,
        hasSub: decodedToken?.sub === userId,
        sub: decodedToken?.sub
      },
      database: {
        userQuery,
        userError: userError ? {
          message: userError.message || userError,
          code: userError.code,
          details: userError.details
        } : null
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Debug JWT error:', error)
    return NextResponse.json({ 
      error: 'Failed to debug JWT',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
}