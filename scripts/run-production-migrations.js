#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// IMPORTANT: Set these environment variables before running
// You can either:
// 1. Set them in your shell: export SUPABASE_URL=https://xxx.supabase.co
// 2. Create a .env.production.local file with these values
// 3. Pass them when running: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node run-production-migrations.js

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please set:');
  console.error('  - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('  - SUPABASE_SERVICE_KEY');
  console.error('');
  console.error('Example:');
  console.error('SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node run-production-migrations.js');
  process.exit(1);
}

// Initialize Supabase client with service key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  }
});

// Migration files in order
const migrations = [
  '20250111_initial_schema.sql',
  '20250111_storage_buckets.sql',
  '20250114_add_parsed_data_to_audit_files.sql',
  '20250114_analysis_results.sql',
  '20250114_csv_processing.sql',
  '20250114_performance_metrics.sql',
  '20250114_recommendations.sql',
  '004_pilot_tracking.sql'
];

// Create migrations tracking table if it doesn't exist
async function createMigrationsTable() {
  const { error } = await supabase.rpc('query', {
    query: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
  });
  
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

// Check if migration has been run
async function hasBeenRun(filename) {
  const { data, error } = await supabase
    .from('migrations')
    .select('filename')
    .eq('filename', filename)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }
  
  return !!data;
}

// Record migration as complete
async function recordMigration(filename) {
  const { error } = await supabase
    .from('migrations')
    .insert({ filename });
  
  if (error) {
    throw error;
  }
}

// Run a single migration
async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = await fs.readFile(filePath, 'utf8');
  
  // Split by semicolons but be careful with functions
  const statements = sql
    .split(/;(?=\s*(?:--|$|CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|GRANT|REVOKE|TRUNCATE|COMMENT))/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('query', {
        query: statement + ';'
      });
      
      if (error) {
        console.error(`Error in statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    } catch (err) {
      // Some statements might fail if they already exist, that's okay
      if (!err.message.includes('already exists') && 
          !err.message.includes('duplicate key')) {
        throw err;
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Running Supabase production migrations');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log('');
  
  try {
    // First, ensure we have a migrations table
    console.log('📋 Creating migrations tracking table...');
    await createMigrationsTable();
    
    // Run each migration
    for (const migration of migrations) {
      const alreadyRun = await hasBeenRun(migration);
      
      if (alreadyRun) {
        console.log(`⏭️  Skipping ${migration} (already run)`);
        continue;
      }
      
      console.log(`🔄 Running ${migration}...`);
      try {
        await runMigration(migration);
        await recordMigration(migration);
        console.log(`✅ Completed ${migration}`);
      } catch (error) {
        console.error(`❌ Failed ${migration}:`, error.message);
        throw error;
      }
    }
    
    console.log('');
    console.log('✅ All migrations completed successfully!');
    
    // Verify tables exist
    console.log('');
    console.log('🔍 Verifying database schema...');
    const { data: tables, error: tablesError } = await supabase.rpc('query', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      console.error('Could not verify tables:', tablesError.message);
    } else {
      console.log('📊 Tables created:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };