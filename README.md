# Amazon Advertising Audit Tool

[![Frontend CI](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/ci.yml)
[![Deploy to Vercel](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/deploy.yml/badge.svg)](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/deploy.yml)

A comprehensive SaaS platform designed to help e-commerce brands analyze and optimize their Amazon advertising performance through the paid-organic flywheel strategy.

🚀 **Production**: [https://audit.verexiq.com](https://audit.verexiq.com)  
📊 **Status**: Production deployed with known issues - see [Known Issues](#-known-issues) below

## 🎯 Vision

Transform how e-commerce brands approach Amazon advertising by revealing the hidden connections between paid ads and organic performance, enabling data-driven decisions that maximize both immediate ROI and long-term growth.

## 🚀 Key Features

### Core Functionality
- **Paid-Organic Flywheel Analysis**: Understand how your ads impact organic rankings
- **Goal-Based Customization**: Tailored analysis for 5 distinct business objectives
- **Automated Recommendations**: AI-powered insights for optimization
- **Multi-Format Reports**: Export findings as PDF or Excel
- **Team Collaboration**: Share insights across your organization

### Goal Types
1. **Profitability Focus**: Maximize profit margins across your portfolio
2. **Growth Mode**: Scale revenue while maintaining efficiency
3. **New Product Launch**: Optimize launch strategies for maximum impact
4. **Market Defense**: Protect market share from competitors
5. **Portfolio Optimization**: Balance performance across product lines

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **State Management**: Zustand
- **Testing**: Vitest, Playwright
- **CSV Parsing**: Papa Parse
- **File Upload**: react-dropzone

### Backend
- **API**: FastAPI (Python)
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage
- **Background Jobs**: Inngest
- **Deployment**: Railway

### Infrastructure
- **Frontend Hosting**: Vercel (Production at audit.verexiq.com)
- **Backend**: Supabase Edge Functions
- **Database & Storage**: Supabase (PostgreSQL with RLS)
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics
- **CDN**: Vercel Edge Network
- **Domain**: verexiq.com (Subdomain configured)

## 📁 Project Structure

```
amazon-advertising-audit/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities and clients
│   │   └── types/         # TypeScript types
│   └── tests/             # Test files
├── backend/                 # FastAPI application
│   ├── api/               # API endpoints
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── tests/            # Backend tests
├── docs/                   # Project documentation
│   ├── PRD.md            # Product requirements
│   ├── architecture.md   # System design
│   └── stories/          # User stories
└── bmad-agent/           # BMAD methodology files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL (via Docker)
- GitHub account
- Vercel account
- Supabase account
- Clerk account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikegrant25/amazon-advertising-audit.git
   cd amazon-advertising-audit
   ```

2. **Set up frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Add your API keys to .env.local
   npm run dev
   ```

3. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Add your API keys to .env
   uvicorn main:app --reload
   ```

4. **Start local database**
   ```bash
   docker-compose up -d
   ```

## 📊 Development Progress

### Completed: Sprint 1 ✅
- ✅ US-001-001: Project Scaffolding
- ✅ US-001-002: Development Environment Setup
- ✅ US-001-003: CI/CD Pipeline
- ✅ US-001-004: Database Schema & Supabase Setup
- ✅ US-001-005: Basic Authentication (Clerk)
- ✅ US-001-006: File Upload Infrastructure

### Completed: Sprint 2 ✅
- ✅ US-001-007: CSV Parsing and Data Validation
- ✅ US-001-008: Basic Flywheel Metrics Calculation
- ✅ US-001-009: Basic Performance Metrics Calculator

### Completed: Sprint 3 (MVP Completion) ✅ - 100% Complete
- ✅ US-001-010: Goal-Based Configuration UI
- ✅ US-001-011: Recommendation Engine
- ✅ US-001-012: PDF Report Generation
- ✅ US-001-013: End-to-End Workflow Integration
- ✅ US-001-014: Pilot Agency Onboarding

### Epic Overview
1. **Epic 1**: Flywheel Validation (14 stories) - ✅ COMPLETE
2. **Epic 2**: Goal Customization (8 stories) - Next Phase
3. **Epic 3**: Report Export (5 stories)
4. **Epic 4**: Team Collaboration (5 stories)
5. **Epic 5**: API & Integrations (5 stories)
6. **Epic 6**: Performance Optimization (6 stories)
7. **Epic 7**: Enterprise Features (7 stories)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/US-XXX-description`
2. Make your changes following existing patterns
3. Run tests: `npm test` (frontend) / `pytest` (backend)
4. Create a pull request with clear description

## 📝 Documentation

### Core Documentation
- [Product Requirements Document](docs/PRD.md)
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api-specification.md)
- [Development Guide](docs/development-guide.md)

### Feature Guides
- [CSV Parsing Guide](docs/csv-parsing-guide.md)
- [Flywheel Analysis Guide](docs/flywheel-analysis-guide.md)
- [Performance Metrics Guide](docs/performance-metrics-guide.md)

### Sprint Documentation
- [Sprint 1 Validation](docs/sprint-1-validation.md)
- [Sprint 2 Progress](docs/sprint-2-progress.md)
- [Sprint 2 Validation](docs/sprint-2-validation.md)

### Setup Guides
- [GitHub Secrets Setup](docs/github-secrets-setup.md)
- [Authentication Setup](docs/authentication-setup.md)
- [Supabase Setup](docs/supabase-setup.md)

## 🔐 Security

- All data encrypted in transit and at rest
- Row Level Security (RLS) on all database tables
- Regular security audits
- SOC 2 compliance roadmap (Month 6)

## 📄 License

This project is proprietary software. All rights reserved.

---

**Repository**: https://github.com/mikegrant25/amazon-advertising-audit  
**Production**: https://audit.verexiq.com  
**Last Updated**: January 15, 2025

## 🎉 Production Status

**Production Deployment Complete!** The application is now live at audit.verexiq.com with:
- Complete audit workflow from file upload to PDF report
- Goal-based analysis customization for 5 business objectives
- AI-powered recommendations with confidence levels
- Professional report generation with charts and branding
- Full end-to-end integration with <5 minute processing
- Multi-tenant architecture with Clerk authentication
- Supabase database with all migrations applied
- Performance optimizations for scalability

**Production Infrastructure** 
- ✅ Deployed to custom domain: audit.verexiq.com
- ✅ SSL certificates configured
- ✅ Database migrations applied to production
- ✅ Row Level Security (RLS) policies active with Clerk JWT integration
- ✅ Storage buckets configured with proper permissions
- ✅ Authentication flows tested and working
- ✅ Monitoring and analytics configured

## 🚨 Known Issues

**Current Production Issues (January 2025)**:
1. **Missing Report Types**: 
   - DSP report upload functionality not implemented
   - Campaign Performance report upload not implemented
   
2. **File Format Limitation**: 
   - Only accepts CSV files
   - Excel (.xlsx) support not yet implemented
   
3. **Email Deliverability**: 
   - Notification emails going to junk/spam folders
   - Email authentication (SPF/DKIM) needs configuration
   
4. **Authentication & RLS**: 
   - Authentication works but file upload has RLS permission issues
   - Clerk JWT template needs proper configuration for Supabase integration

**Workarounds**:
- Use only CSV format for report uploads
- Check spam/junk folders for email notifications
- Contact support for DSP/Campaign Performance analysis needs

## 📚 Key Documentation
- [Launch Readiness Checklist](docs/launch-readiness-checklist.md)
- [Production Deployment Guide](docs/production-deployment-checklist.md)
- [Testing & Validation Guide](docs/testing-validation-guide.md)
- [Monitoring Setup Guide](docs/monitoring-setup.md)
- [Post-MVP Roadmap](docs/post-mvp-roadmap.md)

### 🚨 Critical Setup Documentation
- [Clerk JWT Configuration Guide](docs/clerk-jwt-configuration.md) - **MUST READ** for RLS to work
- [Authentication Setup](docs/authentication-setup.md) - Complete Clerk integration guide
- [Supabase Setup](docs/supabase-setup.md) - Database and storage configuration