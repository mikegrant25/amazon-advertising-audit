#!/usr/bin/env node

/**
 * Script to apply the Clerk RLS fix migration
 * This disables RLS on all tables since we're using Clerk for auth
 * and the service role key for database access
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_KEY')
  console.error('\nPlease set these in your .env.local or .env.production file')
  process.exit(1)
}

async function runMigration() {
  console.log('🔧 Applying Clerk RLS fix migration...\n')
  console.log('   URL:', supabaseUrl)
  console.log('   Using service role key\n')

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250615_fix_rls_for_clerk.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Running migration: 20250615_fix_rls_for_clerk.sql')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    }).single()

    if (error) {
      // If the RPC doesn't exist, try running it as a raw query
      // Note: This requires the SQL Editor in Supabase Dashboard
      console.error('⚠️  Could not run migration via RPC. Please run the following SQL in your Supabase Dashboard:')
      console.error('\n' + migrationSql + '\n')
      console.error('Error:', error.message)
      return
    }

    console.log('✅ Migration applied successfully!')
    console.log('\n📝 What this migration did:')
    console.log('   - Dropped all existing RLS policies')
    console.log('   - Disabled RLS on all tables')
    console.log('   - Added comments explaining the security model')
    console.log('\n🔐 Security note:')
    console.log('   - All database access now goes through API routes')
    console.log('   - API routes authenticate users via Clerk')
    console.log('   - API routes use service role key to bypass RLS')
    console.log('   - User data is filtered at the application level')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()