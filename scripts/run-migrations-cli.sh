#!/bin/bash

# Script to run Supabase migrations on production using Supabase CLI
# Usage: 
#   1. Set environment variables: export SUPABASE_DB_URL="postgresql://..."
#   2. Run: ./run-migrations-cli.sh

set -e

echo "🚀 Supabase Production Migration Runner"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Check for database URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL environment variable not set"
    echo ""
    echo "To get your database URL:"
    echo "1. Go to https://app.supabase.com"
    echo "2. Select your project"
    echo "3. Go to Settings → Database"
    echo "4. Copy the Connection String (URI)"
    echo ""
    echo "Then run:"
    echo "export SUPABASE_DB_URL=\"postgresql://postgres:[password]@[host]:[port]/postgres\""
    echo ""
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔗 Database URL: ${SUPABASE_DB_URL:0:30}..."
echo ""

# Run migrations
echo "🔄 Running migrations..."
echo ""

# Use the combined migration file for easier execution
if [ -f "supabase/migrations/all_migrations_combined.sql" ]; then
    echo "📄 Using combined migrations file"
    echo ""
    
    # Run the combined migration
    supabase db push --db-url "$SUPABASE_DB_URL" --include "supabase/migrations/all_migrations_combined.sql"
    
    echo ""
    echo "✅ Migrations completed!"
else
    echo "❌ Error: Combined migrations file not found"
    echo "Please ensure supabase/migrations/all_migrations_combined.sql exists"
    exit 1
fi

echo ""
echo "🔍 Verifying tables..."
echo ""

# Verify tables were created
psql "$SUPABASE_DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null || {
    echo "⚠️  Could not verify tables (psql not installed)"
    echo "Please check your Supabase dashboard to confirm tables were created"
}

echo ""
echo "✅ Migration process complete!"
echo ""
echo "Next steps:"
echo "1. Verify tables in Supabase Dashboard"
echo "2. Check that RLS policies are active"
echo "3. Confirm storage buckets were created"