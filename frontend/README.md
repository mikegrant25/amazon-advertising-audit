# Amazon Advertising Audit Tool - Frontend

A Next.js 14 application for automated Amazon Advertising performance audits.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **Database/Storage**: Supabase
- **Testing**: Vitest + Playwright
- **Component Development**: Storybook

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 10+
- Git

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
- `CLERK_SECRET_KEY`: From Clerk dashboard
- `NEXT_PUBLIC_SUPABASE_URL`: From Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase project settings

### 3. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Storybook (Component Development)

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) for Storybook.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run storybook` - Start Storybook
- `npm run analyze` - Analyze bundle size

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui base components
│   ├── audits/      # Audit-specific components
│   ├── common/      # Shared components
│   └── layouts/     # Layout components
├── lib/             # Utilities and business logic
│   ├── api/         # API client functions
│   ├── utils/       # Helper functions
│   └── hooks/       # Custom React hooks
├── types/           # TypeScript type definitions
└── config/          # App configuration

test/                # Unit test setup
e2e/                 # Playwright E2E tests
```

## Development Workflow

1. Create a new branch for your feature
2. Write tests first (TDD approach)
3. Implement the feature
4. Ensure all tests pass
5. Run linting and formatting
6. Commit using conventional commits

## Testing

### Unit Tests
```bash
npm run test          # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### E2E Tests
```bash
npm run test:e2e      # Headless
npm run test:e2e:ui   # With UI
```

## Code Quality

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **lint-staged** for pre-commit checks
- **commitlint** for commit message standards

## Deployment

The application is configured for deployment on Vercel. See the [deployment documentation](../docs/deployment.md) for details.
