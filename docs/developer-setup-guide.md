# Developer Setup Guide

This guide helps new developers quickly set up their environment to work on the Amazon Advertising Audit Tool.

## 🚀 Quick Start

**Production URL**: https://audit.verexiq.com  
**Repository**: https://github.com/mikegrant25/amazon-advertising-audit

## 📋 Prerequisites

- Node.js 20+ (use nvm for version management)
- Git
- VS Code (recommended) or your preferred editor
- GitHub account with repository access
- Access to team Slack/Discord for support

## 🛠 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mikegrant25/amazon-advertising-audit.git
cd amazon-advertising-audit
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Environment Variables

Create `frontend/.env.local` with the following:

```env
# Get these from the team lead or Vercel dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase (use staging instance for development)
NEXT_PUBLIC_SUPABASE_URL=https://[staging-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Webhook secret for Clerk
WEBHOOK_SECRET=whsec_...
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## 🏗 Project Structure

```
amazon-advertising-audit/
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/         # Business logic & utilities
│   │   └── types/       # TypeScript definitions
│   └── public/          # Static assets
├── docs/                  # Project documentation
├── supabase/             # Database migrations
└── scripts/              # Utility scripts
```

## 🔧 Key Technologies

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks + Zustand
- **Authentication**: Clerk
- **Database Client**: Supabase

### Key Libraries
- **CSV Parsing**: Papa Parse
- **File Upload**: react-dropzone
- **PDF Generation**: @react-pdf/renderer
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## 💻 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow existing patterns:
- Components in `src/components/`
- API routes in `src/app/api/`
- Business logic in `src/lib/`
- Types in `src/types/`

### 3. Test Your Changes

```bash
# Run unit tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### 4. Commit Changes

Use conventional commits:
```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve issue with..."
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test parser.test.ts    # Specific file
```

### E2E Tests (Playwright)
```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # With UI mode
```

## 🚀 Building for Production

```bash
npm run build              # Build production bundle
npm start                  # Run production server locally
```

## 📝 Common Tasks

### Adding a New Component

1. Create component file: `src/components/category/component-name.tsx`
2. Add TypeScript types if needed
3. Export from category index if applicable
4. Use existing UI components from `src/components/ui/`

### Adding an API Route

1. Create route file: `src/app/api/route-name/route.ts`
2. Implement GET/POST/etc handlers
3. Add authentication check if needed
4. Use Supabase client for database operations

### Working with the Database

1. Use Supabase client from `src/lib/supabase/`
2. Check existing queries in `src/lib/api/`
3. Always consider Row Level Security (RLS)
4. Test with staging database first

## 🐛 Debugging Tips

### Common Issues

1. **"Module not found" errors**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript errors**
   - Check for missing types in `src/types/`
   - Run `npm run typecheck` to see all errors

3. **Supabase connection issues**
   - Verify environment variables
   - Check if using correct project URL
   - Ensure anon key is valid

4. **Build failures**
   - Check for unused imports
   - Verify all environment variables are set
   - Look for TypeScript errors

## 📚 Resources

### Documentation
- [Project README](../README.md)
- [Architecture Overview](./architecture.md)
- [API Documentation](./api-specification.md)
- [Database Schema](./database-schema.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Getting Help

1. Check existing documentation
2. Search closed GitHub issues
3. Ask in team Slack/Discord
4. Create a GitHub issue if needed

## 🔐 Security Notes

- Never commit `.env.local` files
- Don't share API keys or secrets
- Use environment variables for sensitive data
- Follow existing security patterns

## 🎯 Code Standards

### TypeScript
- Always use TypeScript
- Define types for all props
- Avoid `any` type
- Use interfaces for object shapes

### React
- Use functional components
- Follow hooks rules
- Keep components focused
- Extract reusable logic to hooks

### Styling
- Use Tailwind classes
- Follow existing patterns
- Keep responsive design in mind
- Use CSS variables for theming

---

**Last Updated**: January 15, 2025  
**Production URL**: https://audit.verexiq.com  
**Questions?** Contact the development team