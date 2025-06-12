#!/bin/bash

# Amazon Advertising Audit Tool - Initial Setup Script

echo "🚀 Setting up Amazon Advertising Audit Tool..."

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "Checking prerequisites..."
check_command "node"
check_command "npm"
check_command "git"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites satisfied"

# Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "chore: initial project setup with BMAD scaffolding"
fi

# Frontend setup
echo "Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing dependencies (this may take a few minutes)..."
npm install

# Set up git hooks
echo "Setting up git hooks..."
npm run prepare

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual credentials"
fi

echo "✅ Frontend setup complete"

cd ..

echo "
========================================
✅ Project scaffolding complete!
========================================

Next steps:
1. Update frontend/.env.local with your Clerk and Supabase credentials
2. Run 'cd frontend && npm run dev' to start the development server
3. Run 'cd frontend && npm run storybook' to start Storybook
4. Begin with US-001-002: Development Environment Setup

For more information, see:
- Frontend README: frontend/README.md
- Development Setup: docs/dev-environment-setup.md
"