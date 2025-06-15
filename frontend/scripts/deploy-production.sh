#!/bin/bash

# Production Deployment Script
# This script helps deploy to production with safety checks

echo "🚀 Amazon Advertising Audit Tool - Production Deployment"
echo "======================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: You must be on the main branch to deploy to production${NC}"
    echo "Current branch: $BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes before deploying"
    git status --short
    exit 1
fi

# Pull latest changes
echo -e "\n${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin main

# Run validation
echo -e "\n${YELLOW}🔍 Running build validation...${NC}"
./scripts/validate-build.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build validation failed${NC}"
    exit 1
fi

# Confirm deployment
echo -e "\n${YELLOW}⚠️  Production Deployment Confirmation${NC}"
echo "This will deploy to the LIVE production environment"
echo -e "Branch: ${GREEN}$BRANCH${NC}"
echo -e "Commit: ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo ""
read -p "Are you sure you want to deploy to production? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Tag the release
echo -e "\n${YELLOW}🏷️  Creating release tag...${NC}"
VERSION=$(date +%Y.%m.%d-%H%M)
git tag -a "v$VERSION" -m "Production deployment $VERSION"
echo -e "Tagged as: ${GREEN}v$VERSION${NC}"

# Push to trigger deployment
echo -e "\n${YELLOW}🚀 Pushing to production...${NC}"
git push origin main --tags

echo -e "\n${GREEN}✅ Deployment triggered successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor deployment at: https://vercel.com/dashboard"
echo "2. Check production site once deployed"
echo "3. Run smoke tests"
echo "4. Monitor error tracking"
echo ""
echo -e "${YELLOW}📊 Production URLs:${NC}"
echo "App: https://audit.verexiq.com"
echo "Health: https://audit.verexiq.com/api/health"
echo ""
echo -e "${GREEN}Good luck with the deployment! 🎉${NC}"