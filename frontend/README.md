# Amazon Advertising Audit Tool - Frontend

[![Frontend CI](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/ci.yml)
[![Deploy to Vercel](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/deploy.yml/badge.svg)](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/deploy.yml)

## Overview
Next.js 14 application for analyzing Amazon advertising performance and optimizing paid-organic flywheel strategy.

## Tech Stack
- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.0
- **Authentication**: Clerk
- **Database/Storage**: Supabase
- **Testing**: Vitest, Playwright
- **Component Development**: Storybook

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Configured `.env.local` with API keys

### Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
- Clerk: Get from https://dashboard.clerk.com
- Supabase: Get from https://supabase.com/dashboard
- Inngest: Get from https://inngest.com (optional for now)

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run typecheck    # Check TypeScript
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run storybook    # Start Storybook
```

## Project Structure
```
src/
├── app/             # Next.js App Router pages
├── components/      # React components
│   ├── ui/         # Base UI components
│   ├── audits/     # Audit-specific components
│   ├── common/     # Shared components
│   └── layouts/    # Layout components
├── lib/            # Utilities and clients
│   ├── api/       # API client functions
│   ├── hooks/     # Custom React hooks
│   └── utils/     # Helper functions
├── types/          # TypeScript types
└── config/         # Configuration files
```

## Development Status
- ✅ Project scaffolding (US-001-001)
- ✅ Development environment (US-001-002)
- ✅ CI/CD Pipeline (US-001-003)
- ⏳ Next: Database Schema & Supabase Setup (US-001-004)

## CI/CD Setup
See [GitHub Secrets Setup Guide](../docs/github-secrets-setup.md) for configuring CI/CD environment variables.

### GitHub Actions
- **CI Pipeline**: Runs on all PRs (lint, typecheck, test, build)
- **Deploy Pipeline**: Auto-deploys main branch to Vercel
- **Preview Deployments**: Creates preview URLs for PRs

### Required Secrets
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Known Issues
- Vitest config uses .mts extension for compatibility

## Contributing
1. Create feature branch: `git checkout -b feature/US-XXX-description`
2. Make changes following existing patterns
3. Run tests and linting
4. Commit with conventional commits
5. Create pull request

---
Last updated: January 6, 2025