# Goal-Based Test Scenarios

## Overview
Comprehensive test scenarios for each of the 5 goal types to ensure recommendations and insights align with user objectives.

## 1. Increase Revenue Goal Tests

### Scenario 1.1: Growth Opportunities Prioritized
**Given**: Audit with "Increase Revenue" goal
**When**: Processing completes with mixed opportunities
**Then**: 
- Top 5 recommendations focus on revenue growth
- Keyword expansion opportunities ranked first
- Budget increase suggestions prominent
- New market opportunities highlighted

**Test Data**:
```python
revenue_test_data = {
    "untapped_keywords": 50,  # High growth potential
    "budget_constrained_campaigns": 5,
    "low_impression_share": 30,  # Market opportunity
    "wasted_spend": 1000,  # Lower priority for this goal
}
```

### Scenario 1.2: Flywheel De-emphasized
**Given**: Revenue goal with flywheel opportunities
**When**: Both growth and efficiency opportunities exist
**Then**:
- Growth opportunities appear before flywheel
- Flywheel savings shown but not primary focus
- Volume metrics emphasized over efficiency

### Scenario 1.3: Report Organization
**Given**: Revenue goal selected
**When**: PDF report generated
**Then**:
- Executive summary leads with growth potential
- Revenue opportunity section appears first
- Charts show revenue projections prominently

## 2. Improve Efficiency Goal Tests

### Scenario 2.1: Cost Reduction Priority
**Given**: Audit with "Improve Efficiency" goal
**When**: Processing identifies waste and inefficiencies
**Then**:
- Negative keyword additions ranked first
- High ACoS campaigns flagged for optimization
- Wasted spend elimination prioritized
- Bid reduction strategies prominent

**Test Data**:
```python
efficiency_test_data = {
    "wasted_spend": 5000,  # High priority
    "negative_keyword_opportunities": 200,
    "overbidding_keywords": 50,
    "poor_performing_campaigns": 10,
    "growth_opportunities": 20,  # Lower priority
}
```

### Scenario 2.2: ACoS Improvement Focus
**Given**: Campaigns with varying ACoS levels
**When**: Efficiency goal selected
**Then**:
- Recommendations sorted by ACoS impact
- Specific ACoS reduction targets provided
- ROI improvement calculations shown

### Scenario 2.3: Flywheel as Efficiency Tool
**Given**: Efficiency goal with flywheel opportunities
**When**: Organic strength improving
**Then**:
- Flywheel opportunities framed as cost savings
- Monthly savings prominently displayed
- Bid reduction timeline provided

## 3. Acquire New Customers Goal Tests

### Scenario 3.1: Non-Branded Focus
**Given**: Audit with "Acquire Customers" goal
**When**: Mix of branded and non-branded campaigns
**Then**:
- Non-branded keyword opportunities prioritized
- Competitor conquest strategies highlighted
- Brand awareness campaigns suggested
- Customer acquisition cost (CAC) metrics shown

**Test Data**:
```python
acquisition_test_data = {
    "branded_campaigns": {"count": 5, "performance": "high"},
    "non_branded_campaigns": {"count": 10, "performance": "medium"},
    "competitor_terms": ["competitor1", "competitor2"],
    "category_terms": ["wireless headphones", "bluetooth speakers"],
    "branded_traffic_percent": 60,  # Too high for acquisition
}
```

### Scenario 3.2: Market Share Opportunities
**Given**: Search term report with competitor visibility
**When**: Customer acquisition goal active
**Then**:
- Competitor gap analysis prominent
- New market segment opportunities shown
- Conquest campaign recommendations

### Scenario 3.3: New-to-Brand Metrics
**Given**: Customer acquisition goal
**When**: Report generated
**Then**:
- New-to-brand metrics highlighted
- Market penetration opportunities shown
- CAC optimization strategies included

## 4. Optimize TACoS Goal Tests

### Scenario 4.1: Flywheel Opportunities First
**Given**: Audit with "Optimize TACoS" goal
**When**: Multiple flywheel opportunities exist
**Then**:
- Flywheel analysis appears first in results
- Organic/paid balance prominently displayed
- TACoS reduction projections shown
- Graduated bid reduction plans provided

**Test Data**:
```python
tacos_test_data = {
    "high_ad_attribution_asins": [
        {"asin": "B001", "ad_percent": 85, "trend": "improving"},
        {"asin": "B002", "ad_percent": 78, "trend": "stable"},
        {"asin": "B003", "ad_percent": 90, "trend": "improving"},
    ],
    "current_tacos": 25,
    "organic_growth_rate": 15,  # Monthly
    "total_ad_spend": 50000,
}
```

### Scenario 4.2: Organic Transition Strategy
**Given**: Products with improving organic performance
**When**: TACoS optimization selected
**Then**:
- Specific bid reduction schedules provided
- Organic ranking tracking recommended
- Risk mitigation strategies included

### Scenario 4.3: Balanced Metrics
**Given**: TACoS goal
**When**: Viewing recommendations
**Then**:
- Both efficiency and volume considered
- Total sales impact shown alongside TACoS
- Organic revenue projections included

## 5. General Health Check Goal Tests

### Scenario 5.1: Balanced Recommendations
**Given**: Audit with "General Health Check" goal
**When**: Various opportunities identified
**Then**:
- Recommendations evenly distributed across categories
- No single strategy dominates
- Comprehensive overview provided
- All analysis sections weighted equally

**Test Data**:
```python
general_test_data = {
    "performance_issues": 5,
    "growth_opportunities": 5,
    "efficiency_gains": 5,
    "flywheel_opportunities": 5,
    "seasonal_insights": 5,
    # All categories represented equally
}
```

### Scenario 5.2: Comprehensive Reporting
**Given**: General health check goal
**When**: Report generated
**Then**:
- All sections included with equal prominence
- Executive summary covers all areas
- No specific metric prioritized
- Balanced scorecard approach

### Scenario 5.3: Discovery Focus
**Given**: First-time audit with general goal
**When**: Analysis completes
**Then**:
- Educational content included
- Baseline metrics established
- Improvement areas identified
- Next steps for specialization suggested

## Cross-Goal Validation Tests

### Scenario X.1: Goal Switching
**Given**: Audit completed with one goal
**When**: User wants to view with different goal lens
**Then**:
- Can regenerate recommendations with new goal
- Original analysis preserved
- Clear indication of active goal

### Scenario X.2: Conflicting Optimizations
**Given**: Recommendation conflicts between goals
**When**: Different goals would suggest opposite actions
**Then**:
- Clear trade-offs explained
- Goal-specific context provided
- User informed of implications

### Scenario X.3: Goal Achievement Tracking
**Given**: Any goal selected
**When**: Viewing results
**Then**:
- Goal-specific KPIs displayed
- Progress indicators relevant to goal
- Success metrics aligned with objective

## Test Implementation Examples

### Unit Test: Goal Weighting
```python
def test_revenue_goal_weights():
    engine = RecommendationEngine()
    weights = engine.get_goal_weights(AuditGoal.INCREASE_REVENUE)
    
    assert weights['volume_growth'] > weights['cost_reduction']
    assert weights['new_keywords'] > weights['negative_keywords']
    assert weights['budget_increase'] > weights['bid_decrease']
```

### Integration Test: Goal-Based Processing
```python
@pytest.mark.asyncio
async def test_efficiency_goal_processing():
    # Create audit with efficiency goal
    audit = await create_audit(goal=AuditGoal.IMPROVE_EFFICIENCY)
    
    # Upload test data with known inefficiencies
    await upload_test_files(audit.id, "efficiency_test_set")
    
    # Process audit
    result = await process_audit(audit.id)
    
    # Validate recommendations
    assert result.recommendations[0].category == "waste_reduction"
    assert "negative keywords" in result.recommendations[0].title.lower()
    assert result.total_savings > 0
```

### E2E Test: Complete Goal Flow
```javascript
test('TACoS optimization goal flow', async ({ page }) => {
  // Upload files
  await uploadTestFiles(page, 'tacos_test_set');
  
  // Select TACoS goal
  await page.click('text=Optimize TACoS');
  await page.click('button:has-text("Continue")');
  
  // Wait for processing
  await page.waitForSelector('text=Analysis Complete');
  
  // Verify flywheel prominence
  await expect(page.locator('.flywheel-section')).toBeVisible();
  await expect(page.locator('.flywheel-section')).toBe
  
  // Check first recommendation is flywheel-related
  const firstRec = page.locator('.recommendation-card').first();
  await expect(firstRec).toContainText('organic');
});
```

## Acceptance Criteria for Goal Tests

### Each Goal Must:
1. ✓ Generate 15-25 relevant recommendations
2. ✓ Prioritize insights according to goal
3. ✓ Display goal-specific metrics prominently
4. ✓ Organize report sections by relevance
5. ✓ Provide actionable next steps aligned with goal

### Goal Selection Must:
1. ✓ Be required before processing
2. ✓ Be clearly displayed throughout UI
3. ✓ Affect all aspects of analysis
4. ✓ Be included in all exports
5. ✓ Be tracked for success metrics

---
*These scenarios should be automated where possible and manually tested for nuanced validation.*