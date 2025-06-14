#!/bin/bash

# Supabase Setup Script
# This script helps set up the Supabase project for the Amazon Advertising Audit Tool

set -e

echo "🚀 Supabase Setup Script"
echo "========================"
echo ""

# Check if .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Error: frontend/.env.local not found"
    echo "Please copy frontend/.env.example to frontend/.env.local first"
    exit 1
fi

# Check for Supabase URL
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=" frontend/.env.local || grep -q "NEXT_PUBLIC_SUPABASE_URL=$" frontend/.env.local; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in frontend/.env.local"
    echo ""
    echo "Please:"
    echo "1. Create a Supabase project at https://app.supabase.com"
    echo "2. Get your project URL and anon key from Settings → API"
    echo "3. Add them to frontend/.env.local"
    echo ""
    echo "Example:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."
    exit 1
fi

echo "✅ Environment variables found"
echo ""

# Extract Supabase project ref from URL
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" frontend/.env.local | cut -d'=' -f2)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

echo "📋 Project Reference: $PROJECT_REF"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "To install Supabase CLI:"
    echo "npm install -g supabase"
    echo ""
    echo "Or run migrations manually in Supabase Dashboard SQL Editor"
    exit 0
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "📝 Please log in to Supabase:"
    supabase login
fi

# Link project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF

# Run migrations
echo "🗄️  Running database migrations..."
supabase db push

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Generate TypeScript types: cd frontend && npm run supabase:types"
echo "2. Verify tables in Supabase Dashboard"
echo "3. Continue with US-001-005: Basic Authentication"