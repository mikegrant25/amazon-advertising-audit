# Amazon Advertising Audit Tool - Planning Journal

## Project Overview
Building a SaaS tool to help e-commerce brands analyze their Amazon advertising performance and optimize their paid-organic flywheel strategy.

## Development Progress

### January 6, 2025 - US-001-002: Development Environment Setup

**Context**: After completing US-001-001 (project scaffolding), we encountered several dependency conflicts that needed resolution.

**Key Decisions Made**:

1. **Dependency Version Downgrades**
   - React: 19.0.0 → 18.3.1 (Storybook 7 doesn't support React 19)
   - Next.js: 15.3.3 → 14.2.5 (for React 18 compatibility)
   - Tailwind CSS: 4.0 → 3.4.0 (v4 syntax not widely supported)
   - ESLint: 9.0 → 8.57.0 (eslint-config-next compatibility)

2. **Configuration Changes**
   - Converted `next.config.ts` to `next.config.js` (Next.js 14 requirement)
   - Updated `tailwind.config.js` for v3 syntax
   - Modified `postcss.config.mjs` for v3 plugins
   - Updated `globals.css` from Tailwind v4 to v3 directives

3. **Development Environment**
   - Created `docker-compose.yml` for PostgreSQL
   - Set up `.env.local` with placeholder values
   - Fixed Husky configuration for monorepo structure
   - Verified development server runs successfully

**Challenges Resolved**:
- npm dependency resolution errors
- Husky installation in subdirectory
- Next.js configuration file format
- Tailwind CSS version incompatibility

**Next Steps**:
- US-001-003: CI/CD Pipeline Setup
- Configure GitHub Actions
- Set up Vercel and Railway deployments

### January 6, 2025 - US-001-001: Project Scaffolding

**Completed**:
- Initial Next.js 14 setup with TypeScript
- Storybook integration
- Testing framework (Vitest, Playwright)
- Code quality tooling (ESLint, Prettier, Husky)
- Project folder structure

### Earlier Planning Sessions

**Epic Structure**:
- Epic 1: Flywheel Validation (14 stories)
- Epic 2: Goal Customization (8 stories)
- Epic 3: Report Export (5 stories)
- Epic 4: Team Collaboration (5 stories)
- Epic 5: API & Integrations (5 stories)
- Epic 6: Performance Optimization (6 stories)
- Epic 7: Enterprise Features (7 stories)

**Technology Stack**:
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Clerk
- Backend: FastAPI (Python), Supabase, Railway
- Infrastructure: Vercel, Railway, Supabase, Inngest

**Key Features**:
- Paid-organic flywheel analysis
- Goal-based customization (5 goal types)
- Automated recommendations
- Report generation (PDF/Excel)
- Multi-tenant architecture

### January 6, 2025 - US-001-002: Final Configuration

**Additional Setup Completed**:
- Fixed ESLint configuration (removed prettier extension)
- Renamed vitest.config.ts to .mts for build compatibility
- Configured Clerk authentication credentials
- Set up Supabase project with storage bucket
- Verified development server runs successfully
- Created comprehensive frontend README

**Services Configured**:
- ✅ Clerk Authentication (dashboard.clerk.com)
- ✅ Supabase Database & Storage (supabase.com)
- ⏳ Inngest (to be configured when needed)
- ⏳ Railway & Vercel (for deployment phase)

### January 11, 2025 - US-001-003: CI/CD Pipeline Setup

**Completed**:
- GitHub Actions workflows for frontend CI
- Multi-job pipeline: lint, typecheck, test, build, e2e, storybook
- Vercel deployment configuration
- Automated preview deployments for PRs
- Environment variable documentation

**Key Files Created**:
1. `.github/workflows/ci.yml` - Comprehensive CI pipeline
2. `.github/workflows/deploy.yml` - Vercel deployment automation
3. `vercel.json` - Vercel project configuration
4. `docs/github-secrets-setup.md` - Secrets configuration guide

**CI/CD Features**:
- Parallel job execution for faster feedback
- Build artifact caching between jobs
- Coverage reporting with Codecov
- Playwright test reports
- Storybook build verification
- Preview URL comments on PRs

### January 11, 2025 - CI/CD Deployment Complete

**Repository & Deployment**:
- GitHub repository: https://github.com/mikegrant25/amazon-advertising-audit
- Production URL: https://frontend-jmr3t6qov-mikes-projects-0e238c9d.vercel.app
- All GitHub secrets configured
- Vercel project linked and deployed
- CI/CD pipeline tested and working

**Configuration Steps Completed**:
1. Authenticated GitHub CLI with personal access token
2. Created public repository with `gh repo create`
3. Configured all required GitHub Actions secrets
4. Set up Vercel project with proper root directory
5. Fixed build configuration issues
6. Successfully deployed to production

**Lessons Learned**:
- Vercel needs root directory set to `frontend` for monorepo
- Build commands should not include `cd` when root directory is set
- GitHub CLI authentication works better with tokens than device flow

**Next Steps**:
- US-001-004: Database Schema & Supabase Setup

### January 11, 2025 - US-001-004: Database Schema & Supabase Setup

**Completed**:
- Designed comprehensive database schema for audit tool
- Created migration files with proper SQL structure
- Implemented Row Level Security (RLS) policies
- Configured storage buckets for file uploads and reports
- Set up Supabase client configuration for Next.js
- Generated TypeScript types from database schema

**Key Design Decisions**:

1. **Database Schema**:
   - `users` table for Clerk authentication sync
   - `audits` table with JSONB for flexible analysis results
   - `audit_files` table with file deduplication support
   - Proper foreign key relationships and constraints
   - Updated_at triggers for all tables

2. **Security Implementation**:
   - RLS enabled on all tables
   - Policies tied to Clerk authentication (clerk_id)
   - Storage buckets with proper access controls
   - Service role access for backend processing

3. **Storage Configuration**:
   - `audit-files` bucket for user uploads (50MB limit)
   - `audit-reports` bucket for generated reports (100MB)
   - MIME type restrictions for security
   - Folder structure based on audit IDs

4. **Integration Setup**:
   - Supabase SSR client for Next.js App Router
   - Separate clients for browser/server/middleware
   - Type-safe database queries with generated types
   - Setup script for easy configuration

**Files Created**:
- `supabase/migrations/20250111_initial_schema.sql`
- `supabase/migrations/20250111_storage_buckets.sql`
- `frontend/src/lib/supabase/client.ts`
- `frontend/src/lib/supabase/server.ts`
- `frontend/src/lib/supabase/middleware.ts`
- `frontend/src/types/database.types.ts`
- `docs/supabase-setup.md`
- `scripts/setup-supabase.sh`

**Next Steps**:
- US-001-005: Basic Authentication (Clerk integration)

### January 11, 2025 - US-001-005: Basic Authentication

**Completed**:
- Integrated Clerk authentication with Next.js
- Created authentication middleware for route protection
- Implemented webhook handler for user sync with Supabase
- Built sign-in and sign-up pages with Clerk components
- Added dashboard layout with user button
- Created custom hook for current user data
- Set up protected routes configuration

**Key Implementation Details**:

1. **Clerk Integration**:
   - ClerkProvider wrapping the app in layout.tsx
   - Middleware protecting dashboard and API routes
   - Pre-built UI components for auth flows
   - Automatic redirect after authentication

2. **User Synchronization**:
   - Webhook endpoint at `/api/webhooks/clerk`
   - Handles user.created, user.updated, user.deleted events
   - Syncs user data to Supabase users table
   - Maintains clerk_id for RLS policies

3. **Protected Routes**:
   - Middleware configuration with route matchers
   - Dashboard routes require authentication
   - API routes protected by default
   - Public routes explicitly allowed

4. **Developer Experience**:
   - useCurrentUser hook for easy user data access
   - Type-safe user queries with generated types
   - Server and client component patterns documented
   - Clear separation of auth concerns

**Files Created/Modified**:
- `src/app/layout.tsx` - Added ClerkProvider
- `src/middleware.ts` - Authentication middleware
- `src/app/api/webhooks/clerk/route.ts` - User sync webhook
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
- `src/app/dashboard/layout.tsx` - Dashboard with UserButton
- `src/app/dashboard/page.tsx` - Protected dashboard page
- `src/lib/hooks/use-current-user.ts` - User data hook
- `docs/authentication-setup.md` - Setup documentation

**Next Steps**:
- US-001-006: File Upload Infrastructure

### January 11, 2025 - US-001-006: File Upload Infrastructure

**Completed**:
- Built drag-and-drop file upload component with react-dropzone
- Implemented file validation (CSV format, 500MB size limit)
- Created upload progress tracking with visual progress bar
- Integrated with Supabase Storage for file storage
- Built audit creation workflow with multi-step process
- Added file metadata tracking in database
- Created audit detail page showing uploaded files

**Key Implementation Details**:

1. **File Upload Component**:
   - Drag-and-drop interface with visual feedback
   - File type validation (CSV only)
   - Size limit enforcement (500MB)
   - Progress tracking during upload
   - Success/error state handling

2. **Audit Creation Flow**:
   - Form for audit metadata (name, goal, date range)
   - Multi-file upload support
   - Required minimum 2 files to proceed
   - Automatic navigation to audit detail page

3. **Storage Structure**:
   - Files stored in user-specific folders
   - Path format: `{audit_id}/{file_type}_{timestamp}.csv`
   - Metadata stored in audit_files table
   - File deduplication support via hash

4. **User Experience**:
   - Clear visual states for drag, upload, and completion
   - Error messages for validation failures
   - Progress indication during upload
   - File type labels and descriptions

**Files Created**:
- `src/components/audits/file-upload.tsx` - Reusable upload component
- `src/components/audits/audit-creation-form.tsx` - Multi-step audit creation
- `src/app/dashboard/audits/new/page.tsx` - New audit page
- `src/app/dashboard/audits/[id]/page.tsx` - Audit detail page
- `src/lib/utils.ts` - Utility functions

**Sprint 1 Complete!**
All infrastructure stories are now complete. The foundation is ready for Sprint 2's core analysis features.

**Next Steps**:
- Sprint 2: US-001-007: CSV Parsing and Data Validation

### January 14, 2025 - US-001-007: CSV Parsing and Data Validation

**Completed**:
- Integrated Papa Parse for robust CSV parsing
- Created comprehensive validation schemas for all 5 report types
- Built file processing queue with batch inserts
- Enhanced file upload UI with real-time processing status
- Added validation result storage and error reporting
- Wrote unit tests covering edge cases
- Created detailed documentation

**Key Implementation Details**:

1. **CSV Parser Architecture**:
   - Schema-based validation for flexibility
   - Support for alternate column names (Amazon variations)
   - Auto-detection of file type from headers
   - Type coercion for common formats (%, $, dates)
   - Streaming support for large files

2. **Processing Workflow**:
   - Queue-based processing prevents memory issues
   - Batch inserts (1000 rows) for performance
   - Real-time status updates via API
   - Validation results stored for debugging
   - Graceful error handling with retry capability

3. **Enhanced UI Experience**:
   - Visual processing states (uploading → processing → complete)
   - Color-coded status indicators
   - Validation error/warning display
   - Automatic processing after upload
   - Retry button for failed uploads

4. **Database Updates**:
   - Added `parsed_data` table with JSONB storage
   - Extended `audit_files` with validation results
   - Proper indexes for query performance
   - RLS policies maintain security

**Technical Decisions**:
- Papa Parse chosen for maturity and streaming support
- JSONB storage for flexibility with varying schemas
- Batch processing to handle files up to 500MB
- Separate errors vs warnings for better UX

**Challenges Resolved**:
- TypeScript types manually updated after migration
- Webpack warning from Supabase investigated and documented
- Build process optimized for large component

**Testing & Validation**:
- 16 unit tests covering parser logic
- Edge cases tested (empty files, bad formats)
- Production build successful
- Manual testing with real Amazon CSVs

**Documentation Created**:
- `docs/csv-parsing-guide.md` - Comprehensive usage guide
- Updated planning journal with implementation details
- Code comments for complex logic

**Performance Metrics**:
- Small files (<10MB): ~5 seconds processing
- Medium files (10-50MB): ~30 seconds
- Large files (50-500MB): 1-3 minutes

**Next Steps**:
- US-001-008: Basic Flywheel Metrics Calculation
- Use parsed data to calculate ad attribution %
- Identify ASINs ready for reduced ad spend

### January 14, 2025 - US-001-008: Basic Flywheel Metrics Calculation

**Completed**:
- Designed comprehensive flywheel metrics types and interfaces
- Built metrics calculator with trend analysis using linear regression
- Created data aggregator to combine advertising and business reports
- Implemented flywheel score algorithm (0-100 scale)
- Built recommendation engine for spend reduction strategies
- Created API endpoint for triggering analysis
- Stored results in database with top opportunities
- Wrote comprehensive unit tests
- Created detailed documentation

**Key Implementation Details**:

1. **Flywheel Score Algorithm**:
   - Base score from ad attribution % (inverted - lower is better)
   - Trend bonus for decreasing ad dependency (+30 points)
   - Organic conversion rate comparison (+20 points)
   - ROAS performance factor (+10 points)
   - Results in 0-100 score (higher = ready for reduction)

2. **Recommendation Engine**:
   - Four actions: reduce_spend, maintain, increase_spend, pause
   - Graduated reduction: 25% (score 70-84), 50% (score 85+)
   - Confidence levels based on data availability
   - Special handling for edge cases (high ACoS, low attribution)

3. **Data Aggregation**:
   - Combines all ad report types (SP, SB, SD)
   - Merges with business report for organic metrics
   - Creates time series for trend analysis
   - Handles different attribution windows

4. **Performance Optimization**:
   - Batch data fetching by file type
   - Parallel ASIN processing
   - 2-minute target processing time
   - Top 100 ASINs stored in detail

**Technical Decisions**:
- Linear regression for trend detection (simple, interpretable)
- JSONB storage for flexibility with results
- R-squared threshold of 0.3 for trend confidence
- 30-day default window for trend analysis

**Challenges Resolved**:
- TypeScript types for Supabase client in server context
- Handling different attribution windows (7 vs 14 day)
- Balancing score factors for meaningful recommendations
- Test precision for floating-point calculations

**Testing & Validation**:
- 18 unit tests covering all calculations
- Edge case handling (division by zero, insufficient data)
- Trend detection validation
- Recommendation logic verification

**Documentation Created**:
- `docs/flywheel-analysis-guide.md` - Complete implementation guide
- Detailed API documentation
- Business impact expectations

**Next Steps**:
- US-001-009: Basic Analysis UI
- Display flywheel scores and recommendations
- Create visualization for ad attribution trends

---

## US-001-009: Basic Performance Metrics Calculator
*Completed: January 14, 2025*

**Summary**: Implemented standard Amazon advertising metrics calculator to complement flywheel analysis.

**Key Features Implemented**:

1. **Core Metrics**:
   - CTR (Click-Through Rate): (Clicks/Impressions) * 100
   - CVR (Conversion Rate): (Orders/Clicks) * 100
   - ACoS (Advertising Cost of Sales): (Spend/Revenue) * 100
   - ROAS (Return on Ad Spend): Revenue/Spend
   - TACoS (Total ACoS): Spend/Total Sales (when organic data available)

2. **Aggregation Levels**:
   - Campaign-level metrics with full aggregation
   - Ad group-level metrics with granular detail
   - Account-level metrics with weighted averages
   - Support for multiple report types (SP, SB, SD)

3. **Performance Analysis**:
   - Top performers by CTR, CVR, and ROAS
   - Bottom performers by CTR, CVR, and ACoS
   - Performance ratings (poor/average/good/excellent)
   - Minimum data thresholds for meaningful analysis

4. **Data Processing**:
   - Handles column name variations across reports
   - Robust edge case handling (division by zero)
   - Currency and number parsing
   - Efficient batch aggregation

**Technical Implementation**:
- `PerformanceMetricsCalculator`: Static utility class for calculations
- `PerformanceAggregator`: Data extraction and aggregation
- API endpoint: `/api/audits/[auditId]/performance`
- JSONB storage in `performance_metrics` column
- 30 unit tests with full coverage

**Benchmarks Applied**:
- CTR: 0.47% average (excellent >0.5%)
- CVR: 9.5% average (excellent >15%)
- ACoS: 29% average (excellent <15%)
- ROAS: 3 average (excellent >4)

**Integration Benefits**:
- Complements flywheel analysis with efficiency metrics
- Identifies optimization opportunities
- Provides baseline for spend reduction decisions
- Enables comprehensive audit reports

**Documentation Created**:
- `docs/performance-metrics-guide.md` - Complete implementation guide
- Detailed metric explanations
- API usage examples
- Performance rating system

**Next Steps**:
- Create UI components to display metrics
- Add visualization for top/bottom performers
- Integrate with report generation

---
*This journal tracks key decisions, challenges, and progress throughout the development process.*