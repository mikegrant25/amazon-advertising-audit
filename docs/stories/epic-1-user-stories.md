# Epic 1: Flywheel Validation & Core Foundation - User Stories

**Epic**: Epic 1 - Flywheel Validation & Core Foundation  
**Timeline**: Sprints 1-3 (6 weeks)  
**Status**: ✅ 100% Complete (14/14 stories)  
**Last Updated**: January 14, 2025  
**Story Points Total**: 89 points

## Epic Overview

This epic focuses on validating our core hypothesis that ad-attribution percentage trends can serve as a proxy for organic performance. We'll build the minimum viable product to test this with pilot agencies.

## Story Sequencing Strategy

Stories are sequenced to:
1. Establish development foundation first (1.1-1.3)
2. Build core infrastructure (1.4-1.6)
3. Implement analysis capabilities (1.7-1.9)
4. Complete user-facing features (1.10-1.11)

---

## Sprint 1 Stories (Weeks 1-2) - Foundation Setup

### Story 1.1: Project Scaffolding and Initial Setup (US-001-001)
**Priority**: P0 - Blocker  
**Story Points**: 5  
**Dependencies**: None

**As a** development team  
**I want to** set up the initial project structure with Next.js and TypeScript  
**So that** we have a solid foundation for building the application

#### Acceptance Criteria:
- [ ] Next.js 14+ project initialized with TypeScript
- [ ] Project structure follows best practices (app router, src directory)
- [ ] ESLint and Prettier configured with agreed rules
- [ ] Git repository initialized with proper .gitignore
- [ ] README with setup instructions created
- [ ] Package.json configured with necessary scripts
- [ ] Tailwind CSS configured for styling
- [ ] Basic layout component created

#### Technical Notes:
- Use `create-next-app` with TypeScript template
- Configure absolute imports via tsconfig paths
- Set up conventional commit messages
- Include pre-commit hooks with Husky

---

### Story 1.2: Development Environment Configuration (US-001-002)
**Priority**: P0 - Blocker  
**Story Points**: 3  
**Dependencies**: Story 1.1

**As a** developer  
**I want to** configure the development environment with necessary tools  
**So that** all team members can work efficiently with the same setup

#### Acceptance Criteria:
- [ ] Docker compose file for local development
- [ ] Environment variable structure defined (.env.example)
- [ ] VS Code workspace settings configured
- [ ] Development database setup (PostgreSQL via Docker)
- [ ] Hot reload working properly
- [ ] Debug configurations created
- [ ] Development seeds/fixtures defined

#### Technical Notes:
- Use Docker for PostgreSQL to ensure consistency
- Document all environment variables
- Include VS Code recommended extensions
- Set up database migration tooling (Prisma/Drizzle)

---

### Story 1.3: CI/CD Pipeline Setup (US-001-003)
**Priority**: P0 - Blocker  
**Story Points**: 5  
**Dependencies**: Story 1.1

**As a** development team  
**I want to** establish automated testing and deployment pipelines  
**So that** we can maintain code quality and deploy reliably

#### Acceptance Criteria:
- [ ] GitHub Actions workflow for PR checks
- [ ] Automated linting and type checking
- [ ] Unit test runner configured
- [ ] Build verification on every commit
- [ ] Staging deployment pipeline to Vercel
- [ ] Production deployment pipeline (manual trigger)
- [ ] Environment secrets properly configured

#### Technical Notes:
- Use GitHub Actions for CI/CD
- Configure Vercel for preview deployments
- Set up branch protection rules
- Include test coverage reporting

---

### Story 1.4: Supabase Integration and Database Schema (US-001-004)
**Priority**: P0 - Blocker  
**Story Points**: 8  
**Dependencies**: Story 1.2

**As a** developer  
**I want to** integrate Supabase and define the initial database schema  
**So that** we can store user data and audit information

#### Acceptance Criteria:
- [ ] Supabase project created and connected
- [ ] Database schema for users table
- [ ] Database schema for audits table
- [ ] Database schema for audit_files table
- [ ] Row Level Security (RLS) policies defined
- [ ] Database migrations set up
- [ ] Supabase client configured in Next.js
- [ ] Type generation from database schema

#### Technical Notes:
```sql
-- Basic schema structure
users (id, email, created_at, updated_at)
audits (id, user_id, goal, status, created_at, completed_at)
audit_files (id, audit_id, file_type, file_url, size, status)
```

---

### Story 1.5: Authentication Implementation (Clerk) (US-001-005)
**Priority**: P0 - Blocker  
**Story Points**: 5  
**Dependencies**: Story 1.4

**As a** user  
**I want to** sign up and log in securely  
**So that** I can access my audit history and keep my data private

#### Acceptance Criteria:
- [ ] Clerk authentication integrated
- [ ] Sign up flow with email/password
- [ ] Sign in flow functional
- [ ] Password reset capability
- [ ] Session management working
- [ ] Protected routes configured
- [ ] User profile synced to Supabase
- [ ] Logout functionality

#### Technical Notes:
- Use Clerk's Next.js SDK
- Implement middleware for route protection
- Sync Clerk user ID with Supabase users table
- Handle webhook for user creation

---

### Story 1.6: File Upload Infrastructure (US-001-006)
**Priority**: P0 - Blocker  
**Story Points**: 8  
**Dependencies**: Story 1.4

**As a** user  
**I want to** upload my Amazon export files  
**So that** the system can analyze my advertising data

#### Acceptance Criteria:
- [ ] File upload UI component (drag & drop + button)
- [ ] Support for 4 file types (Campaign, Keyword, Search Term, Product)
- [ ] File validation (CSV format, size limits)
- [ ] Upload progress indication
- [ ] Files stored in Supabase Storage
- [ ] File metadata saved to database
- [ ] Error handling for invalid files
- [ ] Maximum 500MB file size enforced

#### Technical Notes:
- Use react-dropzone for upload UI
- Implement chunked uploads for large files
- Validate CSV headers match expected format
- Store files in user-specific folders

---

## Sprint 2 Stories (Weeks 3-4) - Core Analysis

### Story 1.7: CSV Parsing and Data Validation (US-001-007)
**Priority**: P0 - Blocker  
**Story Points**: 8  
**Dependencies**: Story 1.6

**As a** system  
**I want to** parse and validate uploaded CSV files  
**So that** I can ensure data quality before analysis

#### Acceptance Criteria:
- [ ] CSV parser implemented for all 4 file types
- [ ] Column validation for each report type
- [ ] Data type validation (numbers, dates, etc.)
- [ ] Handle encoding issues gracefully
- [ ] Missing required columns detected
- [ ] Row count and basic stats logged
- [ ] Validation errors clearly reported
- [ ] Parsed data stored in processing tables

#### Technical Notes:
- Use Papa Parse or similar for CSV parsing
- Define schema for each report type
- Consider streaming for large files
- Store validation results for debugging

---

### Story 1.8: Flywheel Analysis Engine (Core Hypothesis) (US-001-008)
**Priority**: P0 - Critical  
**Story Points**: 13  
**Dependencies**: Story 1.7

**As a** user  
**I want to** see which products are gaining organic momentum  
**So that** I can reduce ad spend on products that no longer need it

#### Acceptance Criteria:
- [ ] Calculate ad-attributed revenue % by ASIN
- [ ] Track conversion rate trends over time
- [ ] Identify ASINs with declining ad-attribution %
- [ ] Generate flywheel score for each ASIN
- [ ] Recommend graduated spend reduction strategies
- [ ] Handle edge cases (new products, limited data)
- [ ] Process calculations within 2 minutes
- [ ] Results stored for report generation

#### Technical Notes:
```typescript
// Core calculation logic
adAttributionPercent = (adRevenue / totalRevenue) * 100
flywheelScore = calculateTrend(adAttributionPercent, timeRange)
// High score = ready for reduced ad spend
```

---

### Story 1.9: Basic Performance Metrics Calculator (US-001-009)
**Priority**: P1 - High  
**Story Points**: 5  
**Dependencies**: Story 1.7

**As a** user  
**I want to** see standard performance metrics  
**So that** I can understand my campaign efficiency

#### Acceptance Criteria:
- [ ] Calculate ACoS (Ad Cost of Sales)
- [ ] Calculate ROAS (Return on Ad Spend)
- [ ] Calculate CTR (Click-Through Rate)
- [ ] Calculate CVR (Conversion Rate)
- [ ] Aggregate metrics by campaign/ad group
- [ ] Identify top/bottom performers
- [ ] Calculate account-level metrics
- [ ] Store results for reporting

#### Technical Notes:
- Standard formulas for all metrics
- Handle division by zero cases
- Consider time period aggregations
- Cache calculations for performance

---

### Story 1.10: Goal-Based Configuration UI (US-001-010)
**Priority**: P1 - High  
**Story Points**: 5  
**Dependencies**: Story 1.5

**As a** user  
**I want to** select my optimization goal  
**So that** recommendations are tailored to my objectives

#### Acceptance Criteria:
- [ ] Goal selection screen after file upload
- [ ] 5 goal options clearly explained
- [ ] Goal stored with audit record
- [ ] Goal influences recommendation ranking
- [ ] Default goal if none selected
- [ ] Ability to change goal before processing
- [ ] Goal shown in final report
- [ ] Help text for each goal option

#### Technical Notes:
```typescript
enum AuditGoal {
  INCREASE_REVENUE = "Increase Revenue",
  IMPROVE_EFFICIENCY = "Improve Efficiency", 
  ACQUIRE_CUSTOMERS = "Acquire New Customers",
  OPTIMIZE_TACOS = "Optimize TACoS",
  GENERAL_HEALTH = "General Health Check"
}
```

---

## Sprint 3 Stories (Weeks 5-6) - MVP Completion

### Story 1.11: Recommendation Engine (US-001-011)
**Priority**: P0 - Critical  
**Story Points**: 8  
**Dependencies**: Stories 1.8, 1.9, 1.10

**As a** user  
**I want to** receive actionable recommendations  
**So that** I can improve my advertising performance

#### Acceptance Criteria:
- [ ] Generate 10-15 recommendations per audit
- [ ] Recommendations based on goal weighting
- [ ] Flywheel recommendations prioritized
- [ ] Include specific action items
- [ ] Estimate impact of each recommendation
- [ ] Sort by priority/impact
- [ ] Clear explanation for each recommendation
- [ ] Mix of quick wins and strategic changes

#### Technical Notes:
- Rule-based engine for MVP
- Weight recommendations by selected goal
- Include flywheel insights prominently
- Template-based recommendation text

---

### Story 1.12: PDF Report Generation (US-001-012)
**Priority**: P0 - Critical  
**Story Points**: 8  
**Dependencies**: Story 1.11

**As a** user  
**I want to** download a PDF report of my audit  
**So that** I can share findings with clients or team members

#### Acceptance Criteria:
- [ ] Generate 5-10 page PDF report
- [ ] Include executive summary
- [ ] Flywheel analysis section with insights
- [ ] Performance metrics overview
- [ ] Top recommendations with priorities
- [ ] Basic charts/visualizations
- [ ] Professional formatting
- [ ] Download triggers automatically

#### Technical Notes:
- Use React PDF or similar library
- Include basic styling/branding
- Optimize file size
- Generate asynchronously if needed

---

### Story 1.13: End-to-End Workflow Integration (US-001-013)
**Priority**: P0 - Critical  
**Story Points**: 5  
**Dependencies**: All previous stories

**As a** user  
**I want to** complete an entire audit workflow  
**So that** I can validate the tool provides value

#### Acceptance Criteria:
- [ ] Complete workflow from login to PDF
- [ ] Progress indication throughout
- [ ] Error recovery at each step
- [ ] Process completes in <5 minutes
- [ ] All features integrated smoothly
- [ ] Audit history saved and accessible
- [ ] Can start new audit after completion
- [ ] Basic success metrics tracked

#### Technical Notes:
- Implement state management for workflow
- Add progress tracking
- Include error boundaries
- Log completion metrics

---

### Story 1.14: Pilot Agency Onboarding (US-001-014)
**Priority**: P1 - High  
**Story Points**: 3  
**Dependencies**: Story 1.13

**As a** product team  
**I want to** onboard pilot agencies  
**So that** we can validate the flywheel hypothesis

#### Acceptance Criteria:
- [ ] Welcome email template created
- [ ] Basic onboarding documentation
- [ ] Feedback collection mechanism
- [ ] Support channel established
- [ ] Success metrics tracking
- [ ] 10 agencies identified and invited
- [ ] Consent for data analysis obtained
- [ ] Follow-up schedule defined

#### Technical Notes:
- Use TypeForm or similar for feedback
- Track usage metrics in Supabase
- Schedule weekly check-ins
- Document all feedback

---

## Story Point Summary

**Sprint 1 (Foundation)**: 31 points
- Story 1.1 (US-001-001): 5 points
- Story 1.2 (US-001-002): 3 points  
- Story 1.3 (US-001-003): 5 points
- Story 1.4 (US-001-004): 8 points
- Story 1.5 (US-001-005): 5 points
- Story 1.6 (US-001-006): 8 points

**Sprint 2 (Core Analysis)**: 31 points
- Story 1.7 (US-001-007): 8 points
- Story 1.8 (US-001-008): 13 points
- Story 1.9 (US-001-009): 5 points
- Story 1.10 (US-001-010): 5 points

**Sprint 3 (MVP Completion)**: 24 points
- Story 1.11 (US-001-011): 8 points
- Story 1.12 (US-001-012): 8 points
- Story 1.13 (US-001-013): 5 points
- Story 1.14 (US-001-014): 3 points

**Total**: 89 points

## Definition of Done

Each story is considered complete when:
1. All acceptance criteria are met
2. Code is peer-reviewed and approved
3. Unit tests written and passing
4. Integration tests for critical paths
5. Documentation updated
6. Deployed to staging environment
7. Product Owner acceptance received

## Risk Mitigation Notes

**Technical Risks**:
- Large file processing: Implement streaming/chunking early
- Flywheel calculations: Build with sample data first
- PDF generation: Have backup library option

**Process Risks**:
- Pilot agency recruitment: Start outreach in Sprint 1
- Hypothesis validation: Define clear success metrics upfront
- Timeline pressure: Focus on core features, defer nice-to-haves

## Next Steps

After Epic 1 completion and hypothesis validation:
- Analyze pilot feedback thoroughly
- Refine flywheel algorithm based on results
- Plan Epic 2 stories for enhanced features
- Consider performance optimizations
- Evaluate technical debt from MVP sprint