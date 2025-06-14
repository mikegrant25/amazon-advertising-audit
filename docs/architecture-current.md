# Amazon Advertising Audit Tool - Current Architecture

## 1. Architecture Overview

### Current Implementation (Post-Sprint 2)
The system has evolved to a **simplified Next.js monolith** with integrated analysis capabilities:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│  Next.js API     │────▶│ Analysis Engine │
│  (React/Next)   │     │  Routes          │     │  (TypeScript)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │                         │
         │                        └─────────────────────────┘
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│     Clerk       │              │    Supabase      │
│    (Auth)       │              │  (DB + Storage)  │
└─────────────────┘              └──────────────────┘
```

### Key Architectural Decisions
1. **Monolithic Next.js**: Simplified from microservices for faster MVP
2. **TypeScript Analysis**: Moved from Python to TypeScript for consistency
3. **Integrated Processing**: File processing happens in API routes vs separate workers
4. **JSONB Storage**: Flexible schema for parsed data and results

## 2. Technology Stack (Current)

### Frontend
- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript
- **UI Components**: Custom components with Tailwind CSS
- **File Upload**: react-dropzone
- **CSV Parsing**: Papa Parse
- **Charts**: (Planned for Sprint 3)
- **Auth**: Clerk with middleware protection
- **Hosting**: Vercel

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Subscriptions
- **Analysis**: TypeScript modules

### Data Processing
- **CSV Parser**: Papa Parse with streaming
- **Validation**: Schema-based with TypeScript
- **Analysis Engine**: 
  - Flywheel scoring algorithm
  - Linear regression for trends
  - Performance metrics calculation
- **Batch Processing**: 1000-row batches for large files

## 3. Core Components (Implemented)

### 3.1 File Upload & Processing
```typescript
// Current implementation
interface FileProcessor {
  // Validates and queues file for processing
  queueFileForProcessing(fileId: string, fileType: FileType): Promise<void>
  
  // Processes CSV in batches
  processFile(fileId: string): Promise<ProcessingResult>
  
  // Updates status in real-time
  updateFileStatus(fileId: string, status: FileStatus): Promise<void>
}

type FileType = 'sponsored_products' | 'sponsored_brands' | 
                'sponsored_display' | 'search_terms' | 'business_report'

type FileStatus = 'pending' | 'processing' | 'completed' | 'error' | 'warning'
```

### 3.2 CSV Parsing System
```typescript
// Schema-driven validation
interface CSVParser {
  constructor(fileType: FileType)
  parseFile(file: File): Promise<ParseResult>
  validateData(data: ParsedData): ValidationResult
}

// Flexible column matching
interface ReportSchema {
  columns: ColumnDefinition[]
  minimumRows: number
  dateFormat: string
}
```

### 3.3 Flywheel Analysis Engine
```typescript
interface FlywheelAnalyzer {
  // Main analysis entry point
  analyzeAudit(auditId: string): Promise<FlywheelAnalysis>
  
  // Core calculations
  calculateFlywheelScore(metrics: FlywheelMetrics): number
  detectTrend(dataPoints: MetricDataPoint[]): TrendAnalysis
  generateRecommendation(score: number, trend: string): Recommendation
}

// Key metrics tracked
interface FlywheelMetrics {
  adAttributionPercentage: number
  adAttributionTrend: 'increasing' | 'stable' | 'decreasing'
  conversionRate: number
  organicConversionRate: number
  roas: number
  trendConfidence: number
}
```

### 3.4 Performance Metrics Calculator
```typescript
interface PerformanceCalculator {
  // Standard advertising metrics
  calculateCTR(clicks: number, impressions: number): number
  calculateCVR(orders: number, clicks: number): number
  calculateACoS(spend: number, revenue: number): number
  calculateROAS(revenue: number, spend: number): number
  
  // Aggregation levels
  aggregateByCampaign(data: ParsedData): CampaignMetrics[]
  aggregateByAdGroup(data: ParsedData): AdGroupMetrics[]
  calculateAccountMetrics(campaigns: CampaignMetrics[]): AccountMetrics
  
  // Performance identification
  identifyTopPerformers(campaigns: CampaignMetrics[]): TopPerformers
  identifyBottomPerformers(campaigns: CampaignMetrics[]): BottomPerformers
}
```

## 4. Data Flow (Current)

### Upload → Analysis Flow
1. **File Upload**: User uploads CSV via drag-drop interface
2. **Validation**: Immediate client-side validation
3. **Storage**: File saved to Supabase Storage
4. **Queue**: Processing job created in database
5. **Parse**: Papa Parse processes CSV with streaming
6. **Validate**: Schema validation with error reporting
7. **Store**: Parsed data saved as JSONB
8. **Analyze**: Flywheel and performance calculations
9. **Results**: Analysis results stored and displayed

### Database Schema
```sql
-- Core tables
audits (
  id, user_id, name, goal, status,
  analysis_result JSONB,
  performance_metrics JSONB
)

audit_files (
  id, audit_id, file_type, status,
  parsed_data JSONB,
  validation_result JSONB
)

-- Parsed data structure in JSONB
{
  "columns": ["Date", "Campaign Name", ...],
  "rows": [
    { "Date": "2024-01-01", "Campaign Name": "...", ... }
  ],
  "stats": {
    "totalRows": 1000,
    "validRows": 998,
    "invalidRows": 2
  }
}
```

## 5. API Endpoints (Implemented)

### File Processing
- `POST /api/files/process` - Queue file for processing

### Analysis
- `POST /api/audits/analyze` - Trigger flywheel analysis
- `GET /api/audits/[id]/performance` - Get performance metrics
- `POST /api/audits/[id]/performance` - Calculate performance metrics

### Webhooks
- `POST /api/webhooks/clerk` - User sync from Clerk

## 6. Security Implementation

### Authentication
- Clerk middleware on all `/dashboard` routes
- API routes protected with `auth()` check
- User ID validation on all operations

### Data Access
- Row Level Security (RLS) in Supabase
- User can only access their own audits
- File access restricted by audit ownership

### File Security
- File type validation (CSV only)
- Size limits (500MB)
- Content validation before processing

## 7. Performance Optimizations

### Current
- Batch processing for large files (1000 rows)
- JSONB indexes for fast queries
- Streaming CSV parsing
- Efficient aggregation algorithms

### Planned
- Redis caching for analysis results
- Background job queue for long operations
- CDN for static assets

## 8. Monitoring & Observability

### Current
- Vercel deployment logs
- Supabase dashboard metrics
- Client-side error boundaries

### Planned (Sprint 3+)
- Sentry error tracking
- Custom analytics dashboard
- Performance monitoring

## 9. Future Architecture Evolution

### Near Term (Sprint 3)
- Add visualization components
- Implement PDF generation
- Build recommendation UI

### Medium Term (Post-MVP)
- Extract analysis engine to Edge Functions
- Add Redis for caching
- Implement webhook system for Amazon API

### Long Term
- Microservices for heavy processing
- Machine learning pipeline
- Multi-region deployment

## 10. Key Architecture Benefits

1. **Simplicity**: Single codebase, one language
2. **Performance**: Edge deployment, efficient algorithms
3. **Scalability**: Serverless functions, managed database
4. **Maintainability**: TypeScript throughout, clear separation
5. **Cost-Effective**: Pay-per-use infrastructure

## 11. Trade-offs & Decisions

### Why Not Python Backend?
- Simplified deployment (one platform)
- TypeScript consistency
- Adequate performance for MVP
- Easier team scaling

### Why JSONB vs Normalized Tables?
- Flexible schema for different report types
- Faster development iteration
- Good enough query performance
- Easier data versioning

### Why Monolith vs Microservices?
- Faster MVP delivery
- Reduced operational complexity
- Sufficient for current scale
- Easy to extract services later