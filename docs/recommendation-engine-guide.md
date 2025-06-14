# Recommendation Engine UI Guide

## Overview

The recommendation engine UI displays personalized, goal-weighted optimization recommendations based on flywheel analysis and performance metrics. Each recommendation is prioritized according to the selected audit goal.

## Implementation Details

### Components Created

1. **RecommendationCard Component** (`/components/recommendations/recommendation-card.tsx`)
   - Visual card design for individual recommendations
   - Type categories: Quick Win, Strategic, Defensive, Growth
   - Impact levels with color coding
   - Confidence indicators (1-3 dots)
   - Detailed metrics showing current vs projected values
   - Estimated savings and implementation time
   - Context tags (ASIN, keyword, campaign)

2. **RecommendationsDashboard Component** (`/components/recommendations/recommendations-dashboard.tsx`)
   - Main dashboard displaying 10-15 recommendations
   - Summary stats: total savings, quick wins, strategic items
   - Filtering by type and impact level
   - Export to CSV functionality
   - Goal-based sorting and prioritization
   - Responsive grid layout

3. **RecommendationGenerator Class** (`/lib/analysis/recommendation-generator.ts`)
   - Goal-based recommendation scoring
   - Generates recommendations from multiple sources:
     - Flywheel opportunities (reduce spend)
     - High ACoS campaigns (improve efficiency)
     - Low CTR ad groups (improve relevance)
     - High performers (scale up)
   - Priority calculation based on value and goal alignment

4. **Recommendations Page** (`/app/dashboard/audits/[id]/recommendations/`)
   - Dedicated page for viewing recommendations
   - Loads analysis data from API
   - Shows goal context throughout
   - Back navigation to audit details

### Goal-Based Weighting System

Each goal emphasizes different recommendation types:

- **Profitability**: Quick wins (1.5x), Cost reduction (2.0x)
- **Growth**: Growth opportunities (1.5x), Revenue scaling (2.0x)
- **Launch**: Growth (1.3x), Quick wins (1.2x)
- **Defense**: Defensive actions (1.5x), Market protection (2.0x)
- **Portfolio**: Strategic balance (1.3x), Portfolio optimization (2.0x)

### Recommendation Types

1. **Quick Wins** (Green/Zap icon)
   - Easy to implement (1-2 days)
   - Immediate impact
   - Low risk changes

2. **Strategic** (Blue/Target icon)
   - Longer implementation (3-7 days)
   - Significant impact
   - Requires planning

3. **Defensive** (Orange/Shield icon)
   - Protect market position
   - Prevent competitor gains
   - Brand defense focus

4. **Growth** (Purple/TrendingUp icon)
   - Scale opportunities
   - Market expansion
   - Revenue increase focus

### Data Sources

Recommendations are generated from:
- Flywheel analysis results (ad attribution trends)
- Performance metrics (CTR, CVR, ACoS, ROAS)
- Campaign/ad group level data
- Goal-specific priorities

## Acceptance Criteria Met

✅ Display 10-15 prioritized recommendations  
✅ Goal-based weighting applied  
✅ Clear action items with impact estimates  
✅ Flywheel insights prominently featured  
✅ Quick wins vs strategic changes categorized  
✅ Confidence indicators shown  
✅ Export recommendations list  

## API Integration

- `GET /api/audits/[auditId]/recommendations` - Generate recommendations
- Stores recommendations in audit record for faster access
- Updates recommendations_generated_at timestamp

## User Experience

1. Complete analysis generates initial recommendations
2. View recommendations from audit detail page
3. Filter by type or impact level
4. Export for offline review/sharing
5. Each recommendation shows:
   - Clear title and description
   - Current vs projected metrics
   - Specific action to take
   - Estimated monthly savings
   - Implementation timeframe
   - Confidence level

## Next Steps

The recommendation engine is ready for integration with PDF report generation (US-001-012), where top recommendations will be included in the executive summary and detailed sections.