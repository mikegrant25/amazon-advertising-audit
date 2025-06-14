# API Specification - Amazon Advertising Audit Tool

## Overview
RESTful API built with Next.js API routes, supporting file upload, CSV processing, and multi-level analysis for Amazon Advertising data.

## Authentication
All endpoints require Clerk authentication. The API uses Clerk's Next.js middleware for protection.

```typescript
// Handled automatically by middleware
const { userId } = await auth()
```

## Base URL
```
Production: https://app.adaudit.com/api
Development: http://localhost:3000/api
```

## Implemented Endpoints

### File Processing

#### Process CSV File
```http
POST /api/files/process
```

Queues a file for CSV parsing and validation.

**Request Body:**
```json
{
  "fileId": "file_123abc",
  "fileType": "sponsored_products" | "sponsored_brands" | "sponsored_display" | "search_terms" | "business_report"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File queued for processing"
}
```

**Error Response:**
```json
{
  "error": "File not found or already processed"
}
```

### Analysis Endpoints

#### Trigger Flywheel Analysis
```http
POST /api/audits/analyze
```

Runs flywheel analysis on all processed files for an audit.

**Request Body:**
```json
{
  "auditId": "audit_123abc",
  "options": {
    "includeTopAsins": 100,
    "trendWindow": 30
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "asinMetrics": [
      {
        "asin": "B001234567",
        "productTitle": "Product Name",
        "totalRevenue": 10000,
        "adRevenue": 2000,
        "organicRevenue": 8000,
        "adAttributionPercentage": 20,
        "adAttributionTrend": "decreasing",
        "trendConfidence": 0.85,
        "conversionRate": 12.5,
        "organicConversionRate": 11.8,
        "roas": 4.5,
        "flywheelScore": 82,
        "recommendation": {
          "action": "reduce_spend",
          "confidence": "high",
          "reason": "Strong organic momentum with decreasing ad dependency",
          "spendReduction": 25
        }
      }
    ],
    "summary": {
      "totalAsins": 150,
      "readyForReduction": 23,
      "totalPotentialSavings": 5600.50,
      "avgFlywheelScore": 68
    },
    "metadata": {
      "analysisDate": "2025-01-14T12:00:00Z",
      "dataDateRange": {
        "start": "2024-12-01",
        "end": "2024-12-31"
      }
    }
  }
}
```

#### Get Performance Metrics
```http
GET /api/audits/{auditId}/performance
```

Retrieves calculated performance metrics for an audit.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "accountMetrics": {
      "totalImpressions": 1000000,
      "totalClicks": 5000,
      "totalCost": 2500.00,
      "totalSales": 10000.00,
      "totalOrders": 250,
      "avgCtr": 0.5,
      "avgCvr": 5.0,
      "overallAcos": 25.0,
      "overallRoas": 4.0,
      "tacos": 12.5
    },
    "campaignMetrics": [
      {
        "campaignId": "camp_123",
        "campaignName": "Brand Campaign",
        "impressions": 100000,
        "clicks": 1000,
        "cost": 500.00,
        "sales": 2500.00,
        "orders": 50,
        "ctr": 1.0,
        "cvr": 5.0,
        "acos": 20.0,
        "roas": 5.0
      }
    ],
    "topPerformers": {
      "byCtr": [...],
      "byCvr": [...],
      "byRoas": [...]
    },
    "bottomPerformers": {
      "byCtr": [...],
      "byCvr": [...],
      "byAcos": [...]
    }
  }
}
```

#### Calculate Performance Metrics
```http
POST /api/audits/{auditId}/performance
```

Triggers performance metrics calculation for an audit.

**Response:**
```json
{
  "success": true,
  "analysis": { /* Same as GET response */ }
}
```

### Webhooks

#### Clerk User Sync
```http
POST /api/webhooks/clerk
```

Webhook endpoint for Clerk user events. Automatically syncs users to Supabase.

**Headers:**
```
svix-id: msg_123
svix-timestamp: 1234567890
svix-signature: v1,xxx...
```

**Event Types Handled:**
- `user.created`
- `user.updated`
- `user.deleted`

## Data Models

### File Status
```typescript
type FileStatus = 'pending' | 'processing' | 'completed' | 'error' | 'warning'
```

### File Types
```typescript
type FileType = 
  | 'sponsored_products' 
  | 'sponsored_brands' 
  | 'sponsored_display' 
  | 'search_terms' 
  | 'business_report'
```

### Audit Status
```typescript
type AuditStatus = 'pending' | 'processing' | 'completed' | 'failed'
```

### Flywheel Metrics
```typescript
interface FlywheelMetrics {
  asin: string
  productTitle: string
  adAttributionPercentage: number
  adAttributionTrend: 'increasing' | 'stable' | 'decreasing'
  trendConfidence: number
  flywheelScore: number
  recommendation: {
    action: 'maintain' | 'reduce_spend' | 'increase_spend' | 'pause'
    confidence: 'high' | 'medium' | 'low'
    reason: string
    spendReduction?: number
  }
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  ctr: number    // Click-Through Rate %
  cvr: number    // Conversion Rate %
  acos: number   // Advertising Cost of Sales %
  roas: number   // Return on Ad Spend
  tacos?: number // Total ACoS % (when organic data available)
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional context (optional)",
  "code": "ERROR_CODE (optional)"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (business logic errors)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Future considerations:
- 100 requests per minute per user
- 10 concurrent file uploads per audit
- 1 analysis per audit per minute

## Upcoming Endpoints (Sprint 3)

### Goal Configuration
```http
PUT /api/audits/{auditId}/goal
```

### Report Generation
```http
POST /api/audits/{auditId}/report
GET /api/audits/{auditId}/report/{reportId}
```

### Recommendations
```http
GET /api/audits/{auditId}/recommendations
```

## Migration Notes

This API specification reflects the current Next.js implementation. The original FastAPI design on Railway is being migrated to Next.js API routes for simplified deployment and maintenance.