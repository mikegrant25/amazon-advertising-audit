# User Story US-002-001: Advanced Profitability Analysis

## Story
As an **agency user**, I want **deep profitability analysis tools** so that **I can make data-driven decisions about budget allocation based on true profit margins**.

## Acceptance Criteria
1. **Margin Calculator**
   - Import and apply product cost data (COGS)
   - Calculate true profit margins per SKU
   - Factor in Amazon fees (referral, FBA, storage)
   - Display profit metrics alongside standard metrics

2. **Cost Allocation**
   - Allocate ad spend by profitability tiers
   - Show profit-weighted ROAS (not just revenue ROAS)
   - Identify products with negative unit economics
   - Flag campaigns spending on unprofitable products

3. **Profitability Forecasting**
   - Project profits based on current trends
   - Model impact of budget changes on profits
   - Scenario planning for margin changes
   - Break-even analysis for new products

4. **Budget Reallocation**
   - Generate profit-optimized budget recommendations
   - Suggest moving spend from low to high margin products
   - Calculate expected profit impact of changes
   - Provide one-click budget adjustment templates

5. **Visualization**
   - Profit margin heatmaps by product/campaign
   - Trend charts showing profit evolution
   - Contribution margin analysis
   - Portfolio profit distribution

## Technical Notes
- Need COGS data input mechanism (CSV upload or manual entry)
- Store cost data securely with encryption
- Calculate Amazon fees accurately (consider all fee types)
- Real-time profit calculations as data updates

## Definition of Done
- [ ] COGS data import functionality implemented
- [ ] Profit calculations integrated into all metrics
- [ ] Forecasting algorithms developed and tested
- [ ] Budget recommendations engine created
- [ ] All visualizations rendering correctly
- [ ] Documentation updated
- [ ] Feature tested with sample data
- [ ] Performance validated (<10 second calculations)

## Priority
P1 - Critical for Epic 2

## Effort Estimate
8 Story Points

## Dependencies
- Requires completion of Epic 1 core metrics
- Need fee calculation service
- Database schema updates for cost data

## Risks
- Complexity of Amazon fee calculations
- Data quality issues with COGS imports
- Performance with large product catalogs