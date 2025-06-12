# User Story Realignment Plan

**Date**: June 12, 2025  
**Orchestrator**: Coordinating realignment of user stories to Epic structure

## Current State Analysis

### Existing User Stories (US-001 to US-007)
These stories focus on features without following the Epic 1 sequence:
- US-001: User Authentication with Organizations
- US-002: File Upload  
- US-003: Goal Selection
- US-004: Data Processing
- US-005: Flywheel Analysis
- US-006: Recommendations Engine
- US-007: Report Generation

### Epic 1 Stories (1.1 to 1.14)
These follow the proper development sequence:
1. **Sprint 1 - Foundation** (Stories 1.1-1.6)
   - 1.1: Project Scaffolding and Initial Setup
   - 1.2: Development Environment Configuration
   - 1.3: CI/CD Pipeline Setup
   - 1.4: Supabase Integration and Database Schema
   - 1.5: Authentication Implementation (Clerk)
   - 1.6: File Upload Infrastructure

2. **Sprint 2 - Core Analysis** (Stories 1.7-1.10)
   - 1.7: CSV Parsing and Data Validation
   - 1.8: Flywheel Analysis Engine
   - 1.9: Basic Performance Metrics Calculator
   - 1.10: Goal-Based Configuration UI

3. **Sprint 3 - MVP Completion** (Stories 1.11-1.14)
   - 1.11: Recommendation Engine
   - 1.12: PDF Report Generation
   - 1.13: End-to-End Workflow Integration
   - 1.14: Pilot Agency Onboarding

## Realignment Strategy

### Mapping Analysis
Current US stories map to Epic stories as follows:
- US-001 → Maps to Story 1.5 (Authentication)
- US-002 → Maps to Story 1.6 (File Upload)
- US-003 → Maps to Story 1.10 (Goal Selection)
- US-004 → Maps to Story 1.7 (CSV Parsing)
- US-005 → Maps to Story 1.8 (Flywheel Analysis)
- US-006 → Maps to Story 1.11 (Recommendations)
- US-007 → Maps to Story 1.12 (Report Generation)

### Missing Foundation Stories
The current US stories skip critical foundation work:
- Project scaffolding (Story 1.1)
- Dev environment setup (Story 1.2)
- CI/CD pipeline (Story 1.3)
- Database schema (Story 1.4)
- Performance metrics (Story 1.9)
- E2E workflow (Story 1.13)
- Pilot onboarding (Story 1.14)

## Execution Plan

### Phase 1: Create New Story Files
Create story files for all Epic 1 stories using the naming convention:
- US-1-01-project-scaffolding.md (from Story 1.1)
- US-1-02-dev-environment.md (from Story 1.2)
- US-1-03-cicd-pipeline.md (from Story 1.3)
- US-1-04-database-schema.md (from Story 1.4)
- US-1-05-authentication.md (from Story 1.5)
- US-1-06-file-upload.md (from Story 1.6)
- US-1-07-csv-parsing.md (from Story 1.7)
- US-1-08-flywheel-analysis.md (from Story 1.8)
- US-1-09-performance-metrics.md (from Story 1.9)
- US-1-10-goal-selection.md (from Story 1.10)
- US-1-11-recommendations.md (from Story 1.11)
- US-1-12-report-generation.md (from Story 1.12)
- US-1-13-e2e-workflow.md (from Story 1.13)
- US-1-14-pilot-onboarding.md (from Story 1.14)

### Phase 2: Migrate Existing Content
For stories that have existing US files:
1. Preserve valuable implementation details from existing files
2. Merge with Epic story requirements
3. Ensure proper sequencing and dependencies

### Phase 3: Archive Old Files
Move existing US-001 through US-007 to an archive folder to preserve history while avoiding confusion.

### Phase 4: Update References
Update all documentation that references the old story IDs to use the new Epic-aligned structure.

## Benefits of Realignment

1. **Proper Sequencing**: Start with foundation before features
2. **Clear Dependencies**: Each story builds on previous work
3. **Sprint Alignment**: Stories grouped by sprint for better planning
4. **Epic Tracking**: Clear connection to Epic 1 objectives
5. **Missing Work Captured**: Foundation stories now included

## Next Steps

1. PM persona to create the new story files
2. Developer persona to review technical details
3. QA persona to validate story completeness
4. Update sprint planning with new story structure

## Success Criteria

- All 14 Epic 1 stories have corresponding user story files
- Stories follow the US-1-XX naming convention
- Dependencies are clearly mapped
- Sprint assignments match Epic plan
- Old stories are archived but preserved