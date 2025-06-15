const fs = require('fs');
const path = require('path');

// Read all migration files in order
const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📁 Found ${files.length} migration files\n`);

let combinedSql = `-- Combined Supabase Migrations
-- Generated on ${new Date().toISOString()}
-- Run this in Supabase SQL Editor\n\n`;

// Add transaction wrapper
combinedSql += `BEGIN;\n\n`;

files.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
  
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  
  combinedSql += `-- ============================================\n`;
  combinedSql += `-- Migration: ${file}\n`;
  combinedSql += `-- ============================================\n\n`;
  combinedSql += content;
  combinedSql += `\n\n`;
});

// Close transaction
combinedSql += `COMMIT;\n`;

// Write combined file
const outputPath = path.join(migrationsDir, 'all_migrations_combined.sql');
fs.writeFileSync(outputPath, combinedSql);

console.log(`\n✅ Combined migration file created:`);
console.log(`   ${outputPath}`);
console.log(`\n📋 Instructions:`);
console.log(`1. Go to Supabase Dashboard: https://supabase.com/dashboard`);
console.log(`2. Select your project (uvqjuktvqnjtlhfxkybl)`);
console.log(`3. Navigate to SQL Editor`);
console.log(`4. Create a new query`);
console.log(`5. Copy and paste the contents of:`);
console.log(`   /supabase/migrations/all_migrations_combined.sql`);
console.log(`6. Click "Run" to execute all migrations`);
console.log(`\n⚠️  The file is ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);