#!/bin/bash

# Build Validation Script
# Run this before deployment to ensure everything is working

echo "🔍 Amazon Advertising Audit Tool - Build Validation"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# 1. Check Node version
echo -e "\n📋 Checking environment..."
NODE_VERSION=$(node --version)
echo "Node version: $NODE_VERSION"
if [[ $NODE_VERSION == v20.* ]] || [[ $NODE_VERSION == v18.* ]]; then
    check_status "Node version compatible"
else
    echo -e "${RED}✗ Node version should be 18+ or 20+${NC}"
    FAILED=$((FAILED + 1))
fi

# 2. Install dependencies
echo -e "\n📦 Installing dependencies..."
npm ci --silent
check_status "Dependencies installed"

# 3. Type checking
echo -e "\n🔍 Running TypeScript checks..."
npx tsc --noEmit
check_status "TypeScript compilation"

# 4. Linting
echo -e "\n🧹 Running ESLint..."
npm run lint --silent
check_status "ESLint checks"

# 5. Build the application
echo -e "\n🏗️  Building application..."
npm run build
check_status "Production build"

# 6. Check for required environment variables
echo -e "\n🔐 Checking environment variables..."
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "SUPABASE_SERVICE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠ Missing: $var${NC}"
    else
        echo -e "${GREEN}✓ Found: $var${NC}"
    fi
done

# 7. Check critical files exist
echo -e "\n📁 Checking critical files..."
CRITICAL_FILES=(
    ".next/BUILD_ID"
    "src/components/feedback/feedback-widget.tsx"
    "src/components/reports/pdf-document.tsx"
    "src/components/workflow/workflow-progress.tsx"
    "src/lib/analytics.ts"
    "src/types/database.types.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ Missing: $file${NC}"
        FAILED=$((FAILED + 1))
    fi
done

# 8. Run unit tests if they exist
echo -e "\n🧪 Running tests..."
if [ -f "vitest.config.ts" ]; then
    npm run test:unit --silent
    check_status "Unit tests"
else
    echo -e "${YELLOW}⚠ No unit tests configured${NC}"
fi

# 9. Check bundle size
echo -e "\n📊 Checking bundle sizes..."
PAGES_DIR=".next/server/app"
if [ -d "$PAGES_DIR" ]; then
    echo "Page sizes:"
    find "$PAGES_DIR" -name "*.js" -type f -exec du -h {} \; | sort -rh | head -10
else
    echo -e "${YELLOW}⚠ Build directory not found${NC}"
fi

# 10. Summary
echo -e "\n=================================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo -e "${GREEN}The build is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED validation checks failed${NC}"
    echo -e "${RED}Please fix the issues before deploying.${NC}"
    exit 1
fi