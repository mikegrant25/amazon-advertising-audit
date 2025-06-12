# Development Environment Setup Guide

## Prerequisites

### Required Software
- **Node.js**: v20+ (use nvm for version management)
- **Python**: 3.11+ (use pyenv for version management)
- **Git**: Latest version
- **Docker**: For local PostgreSQL (optional)
- **VS Code**: Recommended editor with extensions

### Required VS Code Extensions
- ESLint
- Prettier - Code formatter
- Python
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- Vitest (for test integration)
- Playwright Test for VSCode

### Recommended VS Code Extensions
- Error Lens (highlights errors inline)
- GitLens (Git supercharged)
- Thunder Client (API testing)
- MDX (for Storybook stories)
- GitHub Copilot (AI assistance)

## Account Setup

### 1. Clerk (Authentication)
1. Sign up at https://clerk.com
2. Create new application
3. Enable "Organizations" feature
4. Get publishable and secret keys
5. Configure OAuth providers (optional)

### 2. Supabase (Database & Storage)
1. Sign up at https://supabase.com
2. Create new project
3. Save database URL and anon key
4. Enable Storage from dashboard
5. Create storage bucket named "audits"

### 3. Railway (Backend Hosting)
1. Sign up at https://railway.app
2. Create new project
3. Add Python service
4. Configure environment variables
5. Note deployment URL

### 4. Vercel (Frontend Hosting)
1. Sign up at https://vercel.com
2. Connect GitHub account
3. Will auto-deploy from main branch

### 5. Inngest (Workflow Orchestration)
1. Sign up at https://inngest.com
2. Create new app
3. Get Event Key and Signing Key
4. Install Inngest Dev Server locally

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/amazon-audit-tool.git
cd amazon-audit-tool
```

### 2. Frontend Setup (Next.js)

```bash
cd frontend
npm install

# Install development tooling
npm install -D @storybook/react @storybook/nextjs @storybook/addon-essentials \
  prettier eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
  vitest @testing-library/react @testing-library/jest-dom @vitest/ui \
  @playwright/test @next/bundle-analyzer \
  husky lint-staged msw @commitlint/cli @commitlint/config-conventional

# Setup Husky for git hooks
npm run prepare

# Initialize Storybook
npx storybook@latest init

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

NEXT_PUBLIC_API_URL=http://localhost:8000
INNGEST_EVENT_KEY=test_...
EOF

# Start development server
npm run dev

# In a separate terminal, start Storybook
npm run storybook
```

Frontend will be available at http://localhost:3000
Storybook will be available at http://localhost:6006

### 3. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cat > .env << EOF
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...  # Service role key

DATABASE_URL=postgresql://postgres:password@localhost:5432/audit_tool

INNGEST_EVENT_KEY=test_...
INNGEST_SIGNING_KEY=signkey_test_...

ENVIRONMENT=development
EOF

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### 4. Database Setup (Local PostgreSQL)

```bash
# Using Docker
docker run --name audit-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Create database
docker exec -it audit-postgres psql -U postgres -c "CREATE DATABASE audit_tool;"

# Or use Supabase local development
npx supabase init
npx supabase start
```

### 5. Inngest Dev Server

```bash
# Install globally
npm install -g inngest-cli

# Start dev server
inngest dev

# In another terminal, start event forwarder
cd backend
python -m inngest.dev_server
```

Inngest dashboard at http://localhost:8288

## Project Structure

```
amazon-audit-tool/
├── frontend/               # Next.js application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and clients
│   └── public/           # Static assets
├── backend/               # FastAPI application
│   ├── api/              # API endpoints
│   ├── core/             # Core business logic
│   ├── models/           # Database models
│   ├── services/         # Analysis services
│   └── workers/          # Inngest functions
├── docs/                  # Project documentation
└── scripts/              # Development scripts
```

## Development Workflow

### 1. Feature Branch
```bash
git checkout -b feature/US-XXX-feature-name
```

### 2. Frontend Development

#### Development Commands
```bash
cd frontend

# Start development servers
npm run dev          # Next.js on :3000
npm run storybook    # Storybook on :6006

# Code Quality (runs automatically on commit)
npm run lint         # ESLint with a11y checks
npm run lint:fix     # Auto-fix issues
npm run format       # Prettier formatting
npm run format:check # Check formatting
npm run typecheck    # TypeScript checking

# Testing
npm run test         # Vitest unit tests
npm run test:watch   # Watch mode
npm run test:ui      # Vitest UI
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode

# Build & Analysis
npm run build        # Production build
npm run analyze      # Bundle size analysis
npm run build:storybook # Static Storybook
```

#### Pre-commit Hooks (Automatic)
Husky will automatically run:
1. ESLint on staged files
2. Prettier formatting
3. TypeScript type checking
4. Relevant unit tests

### 3. Backend Development
```bash
cd backend
# Activate virtual environment
uvicorn main:app --reload
# Make changes
pytest
black .
mypy .
```

### 4. Testing Integration
1. Start all services locally
2. Test complete flow
3. Check Inngest dashboard for events
4. Verify Supabase data

### 5. Commit and Push
```bash
git add .
git commit -m "feat: implement user story US-XXX"
git push origin feature/US-XXX-feature-name
```

## Common Issues

### Clerk Integration
- Ensure public key is URL-safe encoded
- Check CORS settings for localhost
- Verify organization feature enabled

### Supabase Connection
- Check if service role key is used for admin operations
- Ensure RLS policies don't block in development
- Use anon key for client-side

### Inngest Events
- Dev server must be running
- Check event names match exactly
- Verify signing key configuration

### Railway Deployment
- Environment variables must match exactly
- Python version specified in runtime.txt
- Requirements.txt must be complete

## Debugging Tips

### Frontend Debugging
```bash
# Check Clerk auth state
window.Clerk.user

# Check Supabase connection
const { data, error } = await supabase.auth.getUser()

# Enable React Query devtools
npm install @tanstack/react-query-devtools
```

### Backend Debugging
```python
# Add debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Check JWT decode
from app.core.auth import decode_jwt
claims = decode_jwt(token)

# Test Supabase connection
from app.core.database import supabase
response = supabase.table('audits').select('*').execute()
```

### Database Debugging
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'audits';

-- Test organization isolation
SET request.jwt.claim.org_id = 'org_123';
SELECT * FROM audits;
```

## Configuration Files

### ESLint Configuration (.eslintrc.json)
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "jsx-a11y/anchor-is-valid": "warn"
  }
}
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Husky + Lint-staged (.husky/pre-commit)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Lint-staged Configuration (.lintstagedrc.js)
```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml}': ['prettier --write'],
  '*.{css,scss}': ['prettier --write'],
}
```

### Vitest Configuration (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### Playwright Configuration (playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Bundle Analyzer (next.config.js addition)
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... existing Next.js config
})
```

## Production Readiness Checklist

- [ ] All environment variables documented
- [ ] Secrets stored securely (not in code)
- [ ] Database migrations tested
- [ ] Error handling comprehensive
- [ ] Logging configured properly
- [ ] Monitoring set up
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Performance optimized
- [ ] Storybook components documented
- [ ] Unit test coverage >80%
- [ ] E2E tests for critical paths
- [ ] Bundle size monitored
- [ ] Accessibility audit passed

---
*Last Updated*: Jan 6, 2025