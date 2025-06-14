# Performance Metrics Guide

## Overview

The performance metrics system calculates standard Amazon advertising metrics (CTR, CVR, ACoS, ROAS) and identifies top/bottom performing campaigns. This guide covers the implementation details and usage.

## Architecture

### Core Components

1. **PerformanceMetricsCalculator** (`/src/lib/analysis/performance-metrics.ts`)
   - Static utility class for metric calculations
   - Handles edge cases (division by zero)
   - Provides performance ratings based on benchmarks

2. **PerformanceAggregator** (`/src/lib/analysis/performance-aggregator.ts`)
   - Aggregates data from parsed CSV files
   - Groups by campaign and ad group
   - Integrates with Supabase for data retrieval

3. **API Endpoint** (`/src/app/api/audits/[auditId]/performance`)
   - Triggers performance analysis
   - Stores results in database
   - Provides GET endpoint for retrieval

## Metrics Calculated

### 1. Click-Through Rate (CTR)
```typescript
CTR = (Clicks / Impressions) * 100
```
- Measures ad visibility effectiveness
- Benchmark: 0.47% average on Amazon
- Good: >0.3%, Excellent: >0.5%

### 2. Conversion Rate (CVR)
```typescript
CVR = (Orders / Clicks) * 100
```
- Measures listing/offer effectiveness
- Benchmark: 9.5% average on Amazon
- Good: >10%, Excellent: >15%

### 3. Advertising Cost of Sales (ACoS)
```typescript
ACoS = (Ad Spend / Ad Revenue) * 100
```
- Measures advertising efficiency
- Lower is better
- Good: <25%, Excellent: <15%

### 4. Return on Ad Spend (ROAS)
```typescript
ROAS = Ad Revenue / Ad Spend
```
- Inverse of ACoS
- Higher is better
- Good: >3, Excellent: >4

### 5. Total ACoS (TACoS)
```typescript
TACoS = (Ad Spend / Total Sales) * 100
```
- Measures overall business impact
- Requires business report data
- Shows true advertising dependency

## Data Aggregation

### Campaign Level
- Aggregates all ad groups within a campaign
- Combines data from multiple report types
- Handles different attribution windows (7 vs 14 day)

### Ad Group Level
- Provides granular performance data
- Maintains campaign relationship
- Useful for optimization decisions

### Account Level
- Overall performance metrics
- Weighted averages across campaigns
- Optional TACoS with organic sales data

## Performance Analysis

### Top Performers
Identifies campaigns excelling in:
- **CTR**: High visibility engagement
- **CVR**: Strong conversion ability
- **ROAS**: Efficient ad spend

### Bottom Performers
Identifies campaigns needing attention:
- **Low CTR**: Poor ad relevance
- **Low CVR**: Weak listing/offer
- **High ACoS**: Inefficient spending

### Filtering Criteria
- Minimum 100 impressions for CTR analysis
- Minimum 10 clicks for CVR analysis
- Active campaigns only (cost > 0)

## Usage

### Triggering Analysis

```bash
POST /api/audits/{auditId}/performance
```

Requirements:
- At least one processed advertising file
- User must own the audit
- Files must be in 'processed' status

### Retrieving Results

```bash
GET /api/audits/{auditId}/performance
```

Returns:
```json
{
  "success": true,
  "analysis": {
    "accountMetrics": {...},
    "campaignMetrics": [...],
    "adGroupMetrics": [...],
    "topPerformers": {...},
    "bottomPerformers": {...}
  }
}
```

## Database Schema

Performance metrics are stored in the `audits` table:

```sql
ALTER TABLE audits 
ADD COLUMN performance_metrics JSONB;
```

Structure:
```typescript
{
  accountMetrics: {
    totalImpressions: number
    totalClicks: number
    totalCost: number
    totalSales: number
    totalOrders: number
    avgCtr: number
    avgCvr: number
    overallAcos: number
    overallRoas: number
    tacos?: number
  },
  campaignMetrics: CampaignMetrics[],
  adGroupMetrics: AdGroupMetrics[],
  topPerformers: {
    byCtr: CampaignMetrics[]
    byCvr: CampaignMetrics[]
    byRoas: CampaignMetrics[]
  },
  bottomPerformers: {
    byCtr: CampaignMetrics[]
    byCvr: CampaignMetrics[]
    byAcos: CampaignMetrics[]
  }
}
```

## Edge Cases Handled

1. **Division by Zero**
   - CTR with 0 impressions → 0%
   - CVR with 0 clicks → 0%
   - ACoS with 0 revenue → 999% (capped)
   - ROAS with 0 spend → 0

2. **Missing Data**
   - Handles various column name formats
   - Defaults to 0 for missing values
   - Skips rows without campaign names

3. **Data Quality**
   - Filters campaigns with insufficient data
   - Validates numeric values
   - Handles currency formatting

## Performance Ratings

The system provides qualitative ratings:

| Metric | Poor | Average | Good | Excellent |
|--------|------|---------|------|-----------|
| CTR | <0.1% | 0.1-0.3% | 0.3-0.5% | >0.5% |
| CVR | <5% | 5-10% | 10-15% | >15% |
| ACoS | >35% | 25-35% | 15-25% | <15% |
| ROAS | <2 | 2-3 | 3-4 | >4 |

## Testing

Comprehensive test coverage includes:
- All metric calculations
- Edge case handling
- Aggregation logic
- Performance ratings
- Top/bottom performer identification

Run tests:
```bash
npm test src/lib/analysis/__tests__/performance-metrics.test.ts
```

## Integration with Flywheel Analysis

Performance metrics complement flywheel analysis by:
- Providing baseline efficiency metrics
- Identifying campaigns ready for optimization
- Supporting spend reduction decisions
- Validating flywheel recommendations

## Next Steps

With performance metrics in place, the next features include:
- Visualization components for metrics
- Trend analysis over time
- Goal-based metric weighting
- Export functionality for reports