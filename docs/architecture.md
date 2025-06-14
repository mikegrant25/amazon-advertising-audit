# Amazon Advertising Audit Tool - System Architecture

> **Note**: This document reflects the original architecture design. The implementation has evolved to a simplified Next.js architecture.
> See [Current Architecture](./architecture-current.md) for the implemented system design.

## 1. Architecture Overview

### Design Philosophy
Build a **cloud-native, serverless architecture** optimized for:
- Rapid MVP delivery (3 months)
- Cost-effective scaling for agencies
- Simple operational maintenance
- Future API integration capability

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│  Railway API     │────▶│ Python Workers  │
│  (Next.js)      │     │  (FastAPI)       │     │  (Processing)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                 │
         │                    ┌────────────────────────────┼
         ▼                    ▼                            ▼
┌─────────────────┐  ┌──────────────────┐      ┌──────────────────┐
│     Clerk       │  │    Supabase      │      │     Inngest      │
│    (Auth)       │  │  (DB + Storage)  │      │  (Orchestration) │
└─────────────────┘  └──────────────────┘      └──────────────────┘
```

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript (App Router)
- **State Management**: Zustand (client) + TanStack Query (server)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts (for data visualization)
- **Auth**: Clerk (with organizations)
- **Hosting**: Vercel

**Rationale**: Next.js provides SSR/SSG capabilities, shadcn/ui offers flexibility, Clerk simplifies multi-tenant auth.

### Backend
- **Runtime**: Python 3.11 on Railway
- **API**: FastAPI (async REST API)
- **Validation**: Pydantic (runtime type safety)
- **Workers**: Celery with Redis
- **Hosting**: Railway containers

**Rationale**: FastAPI provides modern Python APIs with automatic docs, Railway simplifies deployment, Python excels at data analysis.

### Data Processing
- **Analysis Engine**: Python 3.11 workers
- **Libraries**: 
  - Pandas (data manipulation)
  - NumPy (calculations)
  - OpenPyXL (Excel processing)
- **PDF Generation**: ReportLab
- **Orchestration**: Inngest (event-driven workflows)

**Rationale**: Event-driven architecture with Inngest provides reliability without complexity of Temporal.

### Storage
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage (S3-compatible)
- **Real-time**: Supabase Subscriptions
- **Vector Search**: Supabase pgvector (future)

**Rationale**: Integrated database + storage reduces complexity, built-in RLS for multi-tenancy.

### Infrastructure
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Railway (container hosting)
- **Database**: Supabase (managed PostgreSQL)
- **Monitoring**: Vercel Analytics + Railway metrics
- **CI/CD**: GitHub Actions
- **Secrets**: Environment variables in each platform

## 3. Core Components

### 3.1 File Upload Service
```typescript
interface FileUploadService {
  // Generates pre-signed S3 URLs for multiple file uploads
  getUploadUrls(userId: string, auditId: string, fileTypes: FileType[]): Promise<UploadUrl[]>
  
  // Validates multiple file formats and completeness
  validateFiles(files: File[]): ValidationResult
  
  // Ensures all required files are present
  checkRequiredFiles(uploadedFiles: string[]): FileCompleteness
  
  // Triggers processing after all uploads complete
  initiateProcessing(auditId: string): Promise<JobId>
}

enum FileType {
  CAMPAIGN = 'campaign',
  KEYWORD = 'keyword',
  SEARCH_TERM = 'searchTerm',
  PRODUCT = 'productAds',
  PORTFOLIO = 'portfolio'
}
```

### 3.2 Data Processing Pipeline
```python
class AuditProcessor:
    def process_audit(self, audit_id: str, goal: AuditGoal) -> AuditResult:
        # 1. Load multiple files from Supabase Storage
        files = self.load_all_export_files(audit_id)
        
        # 2. Parse and merge data from multiple sources
        merged_data = self.merge_campaign_data(files)
        
        # 3. Run comprehensive analysis modules
        performance = self.analyze_performance(merged_data)
        flywheel = self.analyze_flywheel_opportunities(merged_data)
        waste = self.identify_wasted_spend(merged_data)
        seasonality = self.analyze_seasonality_patterns(merged_data)
        competitors = self.analyze_competitor_gaps(merged_data)
        
        # 4. Generate 15-25 goal-weighted recommendations
        recommendations = self.generate_recommendations(
            performance, flywheel, waste, seasonality, competitors,
            goal=goal  # Weight based on selected goal
        )
        
        # 5. Create goal-focused outputs (PDF + Excel)
        self.generate_pdf_report(audit_id, recommendations, goal)
        self.generate_excel_plan(audit_id, recommendations, goal)
        
        return AuditResult(audit_id, recommendations, goal)
```

### 3.3 Flywheel Analysis Engine
```python
class FlywheelAnalyzer:
    def analyze_flywheel_opportunities(self, data: CampaignData) -> List[Opportunity]:
        opportunities = []
        
        for asin in data.asins:
            # Calculate ad-attributed revenue percentage
            ad_revenue_pct = asin.ad_revenue / asin.total_revenue
            
            # Track trend over time
            trend = self.calculate_trend(asin.historical_data)
            
            if ad_revenue_pct > 0.8 and trend.improving:
                # High opportunity: mostly paid, improving organic
                opportunities.append(
                    FlywheelOpportunity(
                        asin=asin,
                        current_ad_dependency=ad_revenue_pct,
                        organic_growth_rate=trend.rate,
                        recommended_action="Gradually reduce bids",
                        savings_potential=self.calculate_savings(asin)
                    )
                )
        
        return opportunities
```

### 3.4 Seasonality Analysis Engine
```python
class SeasonalityAnalyzer:
    def analyze_seasonality_patterns(self, data: MergedCampaignData) -> SeasonalityInsights:
        insights = []
        
        # Analyze performance across time periods
        for metric in ['impressions', 'clicks', 'sales', 'acos']:
            pattern = self.detect_seasonal_pattern(
                data.time_series[metric]
            )
            
            if pattern.is_significant:
                insights.append(
                    SeasonalityInsight(
                        metric=metric,
                        pattern_type=pattern.type,  # weekly, monthly, holiday
                        peak_periods=pattern.peaks,
                        recommendations=self.generate_seasonal_recommendations(pattern)
                    )
                )
        
        return insights
```

### 3.5 Competitor Analysis Engine
```python
class CompetitorAnalyzer:
    def analyze_competitor_gaps(self, data: MergedCampaignData) -> CompetitorInsights:
        gaps = []
        
        # Analyze search term reports for missed opportunities
        search_terms = data.search_term_report
        
        # Find high-converting terms not being targeted
        for term in search_terms:
            if (term.conversions > 0 and 
                term.campaign_type == 'AUTO' and
                not self.is_targeted_manually(term)):
                
                gaps.append(
                    CompetitorGap(
                        search_term=term.query,
                        current_position=term.impression_rank,
                        conversion_rate=term.conversion_rate,
                        recommendation="Add as exact match keyword"
                    )
                )
        
        return gaps
```

### 3.6 Goal-Based Recommendation Engine
```python
class RecommendationEngine:
    def generate_recommendations(
        self, 
        analysis_results: Dict,
        goal: AuditGoal
    ) -> List[Recommendation]:
        
        # Base scoring weights
        weights = self.get_goal_weights(goal)
        
        all_recommendations = []
        
        # Collect recommendations from each analysis
        all_recommendations.extend(self.performance_recommendations(analysis_results['performance']))
        all_recommendations.extend(self.flywheel_recommendations(analysis_results['flywheel']))
        all_recommendations.extend(self.waste_recommendations(analysis_results['waste']))
        all_recommendations.extend(self.seasonality_recommendations(analysis_results['seasonality']))
        all_recommendations.extend(self.competitor_recommendations(analysis_results['competitors']))
        
        # Score and rank based on goal
        for rec in all_recommendations:
            rec.score = self.calculate_goal_score(rec, goal, weights)
        
        # Sort by score and return top 15-25
        ranked = sorted(all_recommendations, key=lambda x: x.score, reverse=True)
        return ranked[:25]
    
    def get_goal_weights(self, goal: AuditGoal) -> Dict:
        if goal == AuditGoal.INCREASE_REVENUE:
            return {
                'volume': 1.5,
                'efficiency': 0.5,
                'new_keywords': 1.3,
                'budget_increase': 1.2,
                'flywheel': 0.8
            }
        elif goal == AuditGoal.IMPROVE_EFFICIENCY:
            return {
                'volume': 0.5,
                'efficiency': 1.5,
                'negative_keywords': 1.3,
                'bid_optimization': 1.4,
                'flywheel': 1.0
            }
        elif goal == AuditGoal.OPTIMIZE_TACOS:
            return {
                'flywheel': 1.8,  # Heavily weight flywheel opportunities
                'organic_transition': 1.6,
                'efficiency': 1.2,
                'volume': 0.7
            }
        # ... other goal weights
```

### 3.7 Report Generation Service
```python
class ReportGenerator:
    def generate_pdf_report(self, audit_id: str, data: AuditData, goal: AuditGoal) -> str:
        # Professional PDF with goal-focused sections
        pdf = PDFReport()
        
        # Goal-specific executive summary
        pdf.add_executive_summary(data.key_findings, goal)
        
        # Reorder sections based on goal
        if goal == AuditGoal.OPTIMIZE_TACOS:
            pdf.add_flywheel_analysis(data.flywheel_opportunities)
            pdf.add_performance_metrics(data.performance)
        else:
            pdf.add_performance_metrics(data.performance)
            pdf.add_flywheel_analysis(data.flywheel_opportunities)
            
        pdf.add_seasonality_insights(data.seasonality)
        pdf.add_competitor_gaps(data.competitors)
        
        # Goal-prioritized recommendations
        pdf.add_recommendations(data.recommendations, goal)
        
        # Save to Supabase Storage
        return self.save_to_storage(pdf, f"{audit_id}/report.pdf")
```

## 4. Data Models

### Audit Metadata (Supabase PostgreSQL)
```typescript
interface Audit {
  id: string                    // UUID primary key
  organization_id: string       // Clerk organization ID
  user_id: string              // Clerk user ID
  goal: AuditGoal              // Selected optimization goal
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  created_at: Date             // Timestamp
  completed_at?: Date
  file_count: number
  total_rows: number
  processing_time?: number      // Seconds
  recommendations_count?: number
  flywheel_opportunities?: number
  goal_metrics?: {              // Goal-specific success metrics
    baseline: number
    projected: number
    improvement_percent: number
  }
}

enum AuditGoal {
  INCREASE_REVENUE = 'increase_revenue',
  IMPROVE_EFFICIENCY = 'improve_efficiency', 
  ACQUIRE_CUSTOMERS = 'acquire_customers',
  OPTIMIZE_TACOS = 'optimize_tacos',
  GENERAL_HEALTH = 'general_health'
}
```

### File Processing Schema
```typescript
interface CampaignFile {
  columns: string[]
  requiredColumns: string[]
  dateRange: { start: Date, end: Date }
  accountId: string
  marketplace: string
}
```

## 5. Security Architecture

### Data Protection
- **Encryption at Rest**: S3 SSE-S3, DynamoDB encryption
- **Encryption in Transit**: TLS 1.3 everywhere
- **Data Isolation**: Separate S3 prefixes per agency
- **Access Control**: IAM roles with least privilege

### Authentication & Authorization
- **MVP**: Clerk with email/password + organizations
- **Multi-tenancy**: Organization-based data isolation
- **API Security**: Clerk JWT validation + rate limiting
- **Database**: Supabase RLS policies per organization
- **CORS**: Configured for Vercel frontend only

### Compliance (MVP)
- **Data Retention**: 90-day automatic deletion
- **Audit Logs**: CloudTrail for all API calls
- **PII Handling**: No storage of advertiser PII
- **Right to Delete**: Manual data purging on request

### Future Compliance (Post-MVP)
- SOC 2 Type II certification
- Automated GDPR compliance workflows
- Enhanced audit logging

## 6. Scalability Plan

### Current MVP Scale
- 100 concurrent audits
- 500MB max file size
- 5-minute processing time

### Growth Path
1. **Month 4-6**: Add Redis cache for repeat analyses
2. **Month 7-9**: Implement API integration with SQS buffering
3. **Month 10-12**: Add OpenSearch for historical insights
4. **Year 2**: Multi-region deployment for global agencies

### Cost Optimization
- Lambda reserved capacity for predictable workloads
- S3 lifecycle policies to Glacier for old audits
- DynamoDB on-demand for variable traffic
- CloudFront caching for static assets

## 7. Development & Deployment

### Environments
- **Development**: Separate AWS account
- **Staging**: Production-like with test data
- **Production**: Blue-green deployment ready

### CI/CD Pipeline
```yaml
# Simplified GitHub Actions workflow
on:
  push:
    branches: [main]

jobs:
  deploy:
    steps:
      - Run tests
      - Build Lambda functions
      - Deploy CDK stack
      - Run E2E tests
      - Invalidate CloudFront
```

### Monitoring
- **Application**: CloudWatch Logs + X-Ray tracing
- **Business**: Custom CloudWatch metrics for audits/day
- **Alerts**: SNS for failures, slow processing
- **Dashboards**: Real-time audit processing status

## 8. Future API Architecture

### Amazon Advertising API Integration
```typescript
interface AmazonAdsConnector {
  // OAuth2 flow for account connection
  authorize(agencyId: string): Promise<AuthUrl>
  
  // Periodic data sync
  syncCampaignData(accountId: string): Promise<SyncResult>
  
  // Real-time optimization webhook
  onPerformanceChange(handler: ChangeHandler): void
}
```

### API Structure (FastAPI on Railway)
```
/api/v1/
  /audits
    POST   /audits                    # Create new audit with goal
    GET    /audits                    # List org's audits  
    GET    /audits/{audit_id}         # Get audit status/results
    POST   /audits/{audit_id}/files   # Upload files to Supabase
    PATCH  /audits/{audit_id}/goal    # Update audit goal
  /reports  
    POST   /reports/{audit_id}/generate  # Generate report
    GET    /reports/{audit_id}/download  # Download report
  /insights
    GET    /insights/flywheel/{audit_id}  # Flywheel opportunities
    GET    /insights/goals/{audit_id}     # Goal-specific insights
  /organizations
    GET    /organizations/current      # Current org details
    PATCH  /organizations/branding     # Update org branding
```

## 9. Performance Optimizations

### File Processing
- Stream large files instead of loading to memory
- Parallel processing of multiple files
- Chunked upload for large files

### Analysis Speed
- Pre-calculate common metrics
- Cache repeated calculations
- Use NumPy vectorized operations

### Report Generation
- Template-based PDF generation
- Async report creation with progress updates
- CDN delivery of generated reports

## 10. Architecture Decision Records

### ADR-001: Serverless vs Containers
**Decision**: Serverless (Lambda)
**Rationale**: No ops overhead, automatic scaling, pay-per-use perfect for variable agency workloads

### ADR-002: Python for Both API and Analysis  
**Decision**: Python FastAPI for API, Python workers for analysis
**Rationale**: Single language reduces complexity, FastAPI provides modern async APIs, Python's data science ecosystem is unmatched

### ADR-003: PostgreSQL via Supabase
**Decision**: Supabase PostgreSQL
**Rationale**: Relational data model fits multi-tenant SaaS, built-in RLS for security, integrated with storage

### ADR-004: REST vs GraphQL
**Decision**: REST for MVP
**Rationale**: Simpler to implement, agencies familiar with REST, GraphQL over-engineering for current needs

### ADR-005: Multiple File Handling
**Decision**: Require all export types for comprehensive analysis
**Rationale**: Single file type insufficient for flywheel analysis and competitor gaps. Need cross-file insights.

### ADR-008: Goal-Based Audits
**Decision**: Add goal selection to audit creation flow
**Rationale**: Agencies need targeted insights for specific client objectives. Goals drive recommendation prioritization and report focus.

### ADR-006: Seasonality Analysis in MVP
**Decision**: Include basic seasonality detection
**Rationale**: Agencies expect this as table stakes for comprehensive audits. Simple time-series analysis achievable.

### ADR-007: No ML/Pattern Recognition in MVP
**Decision**: Statistical analysis only, no ML models
**Rationale**: Reduces complexity, faster time to market, prove value with simpler algorithms first