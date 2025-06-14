# Flywheel Analysis Guide

This guide documents the flywheel analysis engine implemented in US-001-008.

## Overview

The flywheel analysis identifies products that are gaining organic momentum and no longer need aggressive advertising support. By analyzing the relationship between ad-attributed revenue and total revenue over time, we can recommend strategic spend reductions without impacting sales.

## Core Concept

The "flywheel effect" occurs when a product gains enough organic visibility and customer trust that it continues to sell well even with reduced advertising. Key indicators include:

- Decreasing ad attribution percentage over time
- Strong organic conversion rates
- High ROAS (Return on Ad Spend)
- Stable or growing total revenue

## Architecture

```
Data Aggregation → Metrics Calculation → Trend Analysis → Score Generation → Recommendations
        ↓                    ↓                 ↓                ↓                    ↓
   Combine Reports    Ad Attribution %    Time Series    Flywheel Score    Spend Reduction
```

## Components

### 1. Data Aggregator (`/src/lib/analysis/data-aggregator.ts`)

Combines data from multiple report types:

**Advertising Reports** (Sponsored Products/Brands/Display):
- Ad-attributed sales, orders, units
- Impressions, clicks, spend
- Campaign/ad group performance

**Business Report**:
- Total sales (includes organic)
- Sessions and page views
- Conversion rates
- Product titles

**Key Features:**
- Handles multiple attribution windows (7-day, 14-day)
- Merges data by ASIN
- Creates time series for trend analysis

### 2. Metrics Calculator (`/src/lib/analysis/metrics-calculator.ts`)

Core calculations:

**Ad Attribution Percentage:**
```typescript
adAttributionPercent = (adRevenue / totalRevenue) * 100
```

**Standard Metrics:**
- ACoS = (Ad Spend / Ad Sales) × 100
- ROAS = Ad Sales / Ad Spend
- CTR = (Clicks / Impressions) × 100
- CVR = (Orders / Clicks) × 100

**Trend Analysis:**
- Linear regression on time series data
- Calculates slope and R-squared confidence
- Detects increasing/stable/decreasing patterns

**Flywheel Score (0-100):**
- Base score from ad attribution % (lower is better)
- Trend bonus for decreasing ad dependency
- Organic conversion rate comparison
- ROAS performance factor

### 3. Flywheel Analyzer (`/src/lib/analysis/flywheel-analyzer.ts`)

Orchestrates the complete analysis:

1. Fetches and validates audit data
2. Aggregates data by ASIN
3. Calculates metrics for each product
4. Generates recommendations
5. Stores results in database

**Processing Time:** Target < 2 minutes for typical audits

### 4. Analysis API (`/src/app/api/audits/analyze/route.ts`)

REST endpoint for triggering analysis:

**POST /api/audits/analyze**
```json
{
  "auditId": "uuid"
}
```

**Response:**
```json
{
  "totalASINs": 150,
  "totalRevenue": 500000,
  "totalAdSpend": 50000,
  "overallACoS": 10,
  "overallROAS": 10,
  "recommendations": {
    "readyForReduction": 25,
    "potentialSavings": 12500,
    "topOpportunities": [...]
  }
}
```

## Recommendation Engine

### Action Types

1. **`reduce_spend`** - Product has strong organic momentum
   - 25% reduction for scores 70-84
   - 50% reduction for scores 85+
   - Additional reduction for very low ad attribution (<10%)

2. **`maintain`** - Current spend level is appropriate
   - Moderate flywheel scores (30-69)
   - Stable performance metrics

3. **`increase_spend`** - Product needs more advertising support
   - Low flywheel score with acceptable efficiency
   - Growth potential identified

4. **`pause`** - Advertising is inefficient
   - High ACoS (>30%) or low ROAS (<2)
   - Poor overall performance

### Confidence Levels

- **High**: 30+ days of data
- **Medium**: 7-30 days of data  
- **Low**: <7 days of data

### Special Cases

- **High ACoS Override**: Increases reduction percentage or suggests pause
- **Very Low Ad Attribution**: Triggers aggressive reduction (50%+)
- **New Products**: Requires minimum data threshold

## Database Schema

### Analysis Results Storage

**audits.analysis_result** (JSONB):
```json
{
  "summary": {
    "totalASINs": 150,
    "totalRevenue": 500000,
    "totalAdSpend": 50000,
    "overallACoS": 10,
    "overallROAS": 10,
    "readyForReduction": 25,
    "potentialSavings": 12500
  },
  "topOpportunities": [
    {
      "asin": "B08XYZ123",
      "productTitle": "Example Product",
      "flywheelScore": 85,
      "recommendedSpendReduction": 50,
      "currentSpend": 1000,
      "potentialSavings": 500
    }
  ]
}
```

## Usage Example

```typescript
// Trigger analysis after all files are processed
const response = await fetch('/api/audits/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ auditId })
})

const result = await response.json()

// Display recommendations
result.recommendations.topOpportunities.forEach(opp => {
  console.log(`${opp.productTitle}: Reduce spend by ${opp.recommendedSpendReduction}%`)
})
```

## Testing

Run the test suite:
```bash
npm test src/lib/analysis/__tests__/metrics-calculator.test.ts
```

**Test Coverage:**
- Standard metrics calculations
- Ad attribution percentage
- Trend detection algorithms
- Flywheel score generation
- Recommendation logic
- Edge cases and error handling

## Performance Optimization

### Batch Processing
- Fetches data in bulk by file type
- Processes ASINs in parallel
- Stores results in single transaction

### Data Limits
- Top 100 ASINs stored in detail
- Summary metrics for all products
- 30-day trend window by default

### Caching Considerations
- Results stored with audit
- Re-analysis updates existing results
- No real-time recalculation

## Troubleshooting

### Common Issues

1. **"No data found for analysis"**
   - Ensure files are processed successfully
   - Check for both ad and business reports
   - Verify date ranges overlap

2. **"Analysis timeout"**
   - Large audits may exceed 2-minute target
   - Consider reducing date range
   - Check for data aggregation bottlenecks

3. **"Low confidence recommendations"**
   - Insufficient historical data
   - Upload more date range
   - Wait for more data accumulation

### Debug Mode

Enable detailed logging:
```typescript
const analyzer = new FlywheelAnalyzer(supabase)
// Check server logs for detailed processing info
```

## Business Impact

### Expected Outcomes
- 10-30% reduction in ad spend for mature products
- Maintained or improved total revenue
- Better budget allocation to growth products
- Improved overall account efficiency

### Success Metrics
- Potential savings identified
- Recommendation adoption rate
- Post-implementation revenue stability
- Overall ACoS improvement

---

Last Updated: January 14, 2025