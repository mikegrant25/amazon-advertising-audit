# API Specification - Amazon Advertising Audit Tool

> **Note**: This specification reflects the original FastAPI design. The project has migrated to Next.js API routes. 
> See [Current API Specification](./api-specification-updated.md) for the implemented endpoints.

## Overview
RESTful API built with FastAPI on Railway, supporting goal-based audits for Amazon Advertising data analysis.

## Authentication
All endpoints require Clerk JWT authentication tokens.

```
Authorization: Bearer <clerk_jwt_token>
```

## Base URL
```
Production: https://api.adaudit.railway.app/api/v1
Staging: https://api-staging.adaudit.railway.app/api/v1
```

## Endpoints

### Audits

#### Create Audit
```http
POST /audits
```

Creates a new audit with goal selection.

**Request Body:**
```json
{
  "goal": "increase_revenue" | "improve_efficiency" | "acquire_customers" | "optimize_tacos" | "general_health",
  "client_name": "string (optional)",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-03-31"
  }
}
```

**Response:**
```json
{
  "id": "audit_123abc",
  "organization_id": "org_456def",
  "goal": "increase_revenue",
  "status": "created",
  "created_at": "2024-01-06T12:00:00Z",
  "upload_urls": {
    "campaign": "https://...",
    "keyword": "https://...",
    "search_term": "https://...",
    "product": "https://..."
  }
}
```

#### List Audits
```http
GET /audits?limit=20&offset=0&goal=increase_revenue
```

Lists all audits for the current organization.

**Query Parameters:**
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)
- `goal`: Filter by goal type (optional)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "audits": [
    {
      "id": "audit_123abc",
      "goal": "increase_revenue",
      "client_name": "Client A",
      "status": "completed",
      "created_at": "2024-01-06T12:00:00Z",
      "completed_at": "2024-01-06T12:05:00Z",
      "metrics": {
        "recommendations_count": 18,
        "flywheel_opportunities": 5,
        "projected_savings": 3400
      }
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### Get Audit Details
```http
GET /audits/{audit_id}
```

**Response:**
```json
{
  "id": "audit_123abc",
  "goal": "increase_revenue",
  "status": "completed",
  "goal_metrics": {
    "baseline": 125000,
    "projected": 156000,
    "improvement_percent": 24.8
  },
  "insights": {
    "top_opportunities": [
      {
        "type": "keyword_expansion",
        "impact": "high",
        "projected_revenue": 8500,
        "effort": "low"
      }
    ],
    "flywheel_summary": {
      "opportunities_count": 5,
      "total_savings": 3400,
      "top_asin": "B08XYZ123"
    }
  }
}
```

#### Update Audit Goal
```http
PATCH /audits/{audit_id}/goal
```

Updates the goal for an audit (before processing starts).

**Request Body:**
```json
{
  "goal": "improve_efficiency"
}
```

### File Upload

#### Upload Files
```http
POST /audits/{audit_id}/files
```

Uploads files directly to Supabase Storage.

**Request Body (multipart/form-data):**
- `campaign`: Campaign report file
- `keyword`: Keyword report file
- `search_term`: Search term report file (optional)
- `product`: Product ads report file (optional)

**Response:**
```json
{
  "uploaded_files": {
    "campaign": "path/to/campaign.csv",
    "keyword": "path/to/keyword.csv"
  },
  "validation_status": "valid",
  "ready_to_process": true
}
```

### Processing

#### Start Processing
```http
POST /audits/{audit_id}/process
```

Triggers audit processing with goal-based analysis.

**Response:**
```json
{
  "status": "processing",
  "estimated_completion": "2024-01-06T12:05:00Z",
  "job_id": "job_789xyz"
}
```

### Insights

#### Get Flywheel Opportunities
```http
GET /insights/flywheel/{audit_id}
```

Returns flywheel opportunities prioritized by audit goal.

**Response:**
```json
{
  "opportunities": [
    {
      "asin": "B08XYZ123",
      "keyword": "wireless headphones",
      "ad_attribution_percent": 85,
      "trend": "improving",
      "monthly_savings": 850,
      "recommendation": "Reduce bids by 20% over 4 weeks",
      "goal_relevance_score": 0.95
    }
  ],
  "total_monthly_savings": 3400,
  "goal_alignment": "high"
}
```

#### Get Goal-Specific Insights
```http
GET /insights/goals/{audit_id}
```

Returns insights specifically tailored to the audit's goal.

**Response:**
```json
{
  "goal": "increase_revenue",
  "key_metrics": {
    "current_revenue": 125000,
    "revenue_opportunities": 31000,
    "top_growth_keywords": ["keyword1", "keyword2"]
  },
  "recommendations": [
    {
      "title": "Expand high-converting keywords",
      "impact": "high",
      "projected_revenue": 8500,
      "implementation": "Add 15 keywords from search term report"
    }
  ]
}
```

### Reports

#### Generate Report
```http
POST /reports/{audit_id}/generate
```

Generates goal-focused report in specified format.

**Request Body:**
```json
{
  "format": "pdf" | "excel",
  "sections": ["executive_summary", "flywheel", "recommendations"],
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#8b5cf6"
  }
}
```

**Response:**
```json
{
  "report_id": "report_abc123",
  "status": "generating",
  "estimated_completion": "2024-01-06T12:06:00Z"
}
```

#### Download Report
```http
GET /reports/{audit_id}/download?format=pdf
```

Downloads the generated report.

**Response:** Binary file stream

### Organizations

#### Get Current Organization
```http
GET /organizations/current
```

**Response:**
```json
{
  "id": "org_456def",
  "name": "Agency Name",
  "plan": "professional",
  "audits_this_month": 15,
  "audits_limit": 50
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_GOAL",
    "message": "Goal must be one of: increase_revenue, improve_efficiency, acquire_customers, optimize_tacos, general_health",
    "field": "goal"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Invalid or missing auth token
- `FORBIDDEN`: No access to resource
- `NOT_FOUND`: Resource not found
- `INVALID_FILE`: File validation failed
- `QUOTA_EXCEEDED`: Monthly audit limit reached
- `PROCESSING_ERROR`: Analysis failed

## Rate Limits

- 100 requests per minute per organization
- 10 concurrent audits per organization
- 500MB max file size per upload

## Webhooks (Future)

Organizations can register webhooks for audit events:

```json
{
  "event": "audit.completed",
  "audit_id": "audit_123abc",
  "goal": "increase_revenue",
  "timestamp": "2024-01-06T12:05:00Z"
}
```