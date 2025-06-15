import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const startTime = Date.now()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      api: 'operational',
      database: 'checking',
      storage: 'checking',
      auth: 'checking'
    },
    responseTime: 0
  }

  try {
    // Check database connection
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    health.checks.database = dbError ? 'degraded' : 'operational'

    // Check storage
    const { error: storageError } = await supabase
      .storage
      .from('audit-files')
      .list('', { limit: 1 })
    
    health.checks.storage = storageError ? 'degraded' : 'operational'

    // Check auth (Clerk) - just verify env vars exist
    health.checks.auth = process.env.CLERK_SECRET_KEY ? 'operational' : 'degraded'

    // Calculate overall status
    const allOperational = Object.values(health.checks).every(
      status => status === 'operational'
    )
    health.status = allOperational ? 'healthy' : 'degraded'

  } catch (error) {
    health.status = 'unhealthy'
    health.checks.api = 'error'
    console.error('Health check error:', error)
  }

  health.responseTime = Date.now() - startTime

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': health.status
    }
  })
}