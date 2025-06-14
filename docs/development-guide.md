# Development Guide

This guide provides comprehensive instructions for setting up and developing the Amazon Advertising Audit Tool.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- Docker Desktop
- Git
- GitHub account
- Accounts for: Vercel, Supabase, Clerk

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikegrant25/amazon-advertising-audit.git
   cd amazon-advertising-audit
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Frontend
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your API keys
   
   # Backend
   cd ../backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Set up Supabase**
   ```bash
   # Run the setup script
   ./scripts/setup-supabase.sh
   
   # Or manually:
   # 1. Create project at app.supabase.com
   # 2. Add credentials to .env files
   # 3. Run migrations in SQL Editor
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Frontend
   cd frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend
   uvicorn main:app --reload
   
   # Terminal 3: Database
   docker-compose up -d
   ```

## 📁 Project Structure

```
amazon-advertising-audit/
├── frontend/                    # Next.js 14 application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Base UI components
│   │   │   ├── audits/        # Audit-specific components
│   │   │   ├── common/        # Shared components
│   │   │   └── layouts/       # Layout components
│   │   ├── lib/               # Utilities and clients
│   │   │   ├── api/          # API client functions
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   └── utils/        # Helper functions
│   │   ├── types/            # TypeScript types
│   │   └── config/           # Configuration files
│   ├── tests/                # Test files
│   └── .github/workflows/    # CI/CD pipelines
├── backend/                    # FastAPI application
│   ├── api/                  # API endpoints
│   ├── models/               # Database models
│   ├── services/             # Business logic
│   ├── core/                 # Core utilities
│   └── tests/               # Backend tests
├── docs/                      # Documentation
│   ├── PRD.md               # Product requirements
│   ├── architecture.md      # System design
│   ├── api-specification.md # API docs
│   └── stories/             # User stories
└── bmad-agent/              # BMAD methodology

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.0
- **State Management**: Zustand
- **Authentication**: Clerk
- **API Client**: Axios
- **Testing**: Vitest + Playwright
- **Component Development**: Storybook

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Testing**: Pytest
- **Background Jobs**: Inngest
- **File Storage**: Supabase Storage

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics

## 🔧 Development Workflow

### Git Branch Strategy
```bash
main                    # Production branch
├── develop            # Integration branch
└── feature/US-XXX-*   # Feature branches
```

### Creating a New Feature
1. Create branch: `git checkout -b feature/US-XXX-description`
2. Make changes following existing patterns
3. Write/update tests
4. Run linting: `npm run lint` / `ruff check`
5. Run tests: `npm test` / `pytest`
6. Commit: `git commit -m "feat: description"`
7. Push: `git push origin feature/US-XXX-description`
8. Create PR to `develop`

### Code Style
- **Frontend**: ESLint + Prettier (auto-formatted on commit)
- **Backend**: Ruff + Black
- **Commits**: Conventional Commits format
- **PRs**: Must pass all CI checks

## 🧪 Testing

### Frontend Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage

# Component testing
npm run storybook
```

### Backend Testing
```bash
# All tests
pytest

# With coverage
pytest --cov=app

# Specific module
pytest tests/test_api.py
```

## 🚀 Deployment

### CI/CD Pipeline
- **Trigger**: Push to main or PR
- **Steps**: Lint → Type Check → Test → Build → Deploy
- **Environments**: Preview (PRs) and Production (main)

### Manual Deployment
```bash
# Frontend (Vercel)
vercel --prod

# Backend (Railway)
railway up
```

## 📊 Development Status

We are currently in Sprint 1 of Epic 1 (Flywheel Validation):

- ✅ US-001-001: Project Scaffolding (COMPLETED)
- ✅ US-001-002: Development Environment Setup (COMPLETED)
- ✅ US-001-003: CI/CD Pipeline (COMPLETED)
- ✅ US-001-004: Database Schema & Supabase Setup (COMPLETED)
- ✅ US-001-005: Basic Authentication (COMPLETED)
- ⏳ US-001-006: File Upload Infrastructure

### Deployment Information

- **Repository**: https://github.com/mikegrant25/amazon-advertising-audit
- **Production URL**: https://frontend-jmr3t6qov-mikes-projects-0e238c9d.vercel.app
- **CI/CD Status**: [![Frontend CI](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/ci.yml)

## 🔐 Environment Variables

### Frontend (.env.local)
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Inngest (when needed)
INNGEST_APP_ID=amazon-audit
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx
```

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Clerk
CLERK_SECRET_KEY=sk_test_...

# Inngest
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection failed**
   ```bash
   # Ensure Docker is running
   docker-compose up -d
   
   # Check logs
   docker-compose logs postgres
   ```

3. **Module not found errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Project PRD](./PRD.md)
- [Architecture Overview](./architecture.md)

---

Last Updated: January 11, 2025