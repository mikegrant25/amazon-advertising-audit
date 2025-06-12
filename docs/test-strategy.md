# Test Strategy: Amazon Advertising Audit Tool

## Testing Philosophy

### Core Principles
- **Quality Built-In**: Testing integrated from Sprint 1, not an afterthought
- **Fast Feedback**: Automated tests run on every commit
- **Goal-Based Validation**: Each goal type thoroughly tested
- **Multi-Tenant Safety**: Strict isolation verification between organizations

### Quality Goals
- **Reliability**: 99.9% uptime for pilot agencies
- **Performance**: <5 minute processing for audits up to 500k rows
- **Security**: OWASP Top 10 protection, secure file handling
- **Accessibility**: WCAG 2.1 AA compliance for agency users

## Test Level Strategy

### Unit Testing
**Scope**: Individual functions and components in isolation
- **Frontend Tools**: Vitest + React Testing Library
- **Component Development**: Storybook for isolated UI development
- **Backend Tools**: pytest + pytest-asyncio
- **Location**: `__tests__` folders co-located with source
- **Coverage Target**: 80% for business logic, 60% overall
- **Accessibility**: eslint-plugin-jsx-a11y + Storybook addon-a11y

**Key Areas**:
- Flywheel algorithm calculations
- Goal-based recommendation weighting
- File parsing and validation logic
- Authentication token handling
- Data transformation functions

**Example Test**:
```python
def test_flywheel_high_opportunity():
    asin_data = AssetData(
        ad_revenue=8500,
        total_revenue=10000,
        trend="improving"
    )
    result = analyze_flywheel_opportunity(asin_data)
    assert result.score > 0.9
    assert "reduce bids" in result.action.lower()
```

### Integration Testing
**Scope**: Component interactions and service boundaries
- **Tools**: pytest with real Supabase test instance
- **Location**: `/tests/integration`
- **Environment**: Dockerized PostgreSQL + test Supabase

**Test Categories**:
- **API Endpoints**: Each endpoint with auth validation
- **File Processing**: CSV/Excel parsing with Supabase Storage
- **Inngest Workflows**: Event triggering and processing
- **Multi-Tenant Isolation**: Organization data separation

**Critical Integration Tests**:
```python
async def test_audit_creation_with_goal():
    # Create audit with specific goal
    response = await client.post("/api/v1/audits", 
        json={"goal": "improve_efficiency"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["goal"] == "improve_efficiency"
```

### End-to-End Testing
**Scope**: Complete user workflows from UI to database
- **Tools**: Playwright for cross-browser testing
- **Environment**: Staging environment with test data

**Critical User Journeys**:

1. **Complete Audit Flow**:
   - Sign up → Create org → Upload files → Select goal → Process → View results → Download report

2. **Goal-Based Analysis Paths**:
   - Revenue goal → Growth recommendations prioritized
   - Efficiency goal → Cost savings highlighted
   - TACoS goal → Flywheel opportunities first

3. **Multi-File Upload Scenarios**:
   - All 4 file types uploaded
   - Missing optional files
   - Invalid file rejection
   - Large file handling (>100MB)

4. **Organization Switching**:
   - Switch between organizations
   - Verify data isolation
   - Check permissions

## Specialized Testing

### Performance Testing
**Tools**: k6 for load testing, custom scripts for processing

**Test Scenarios**:
| Scenario | Target | Measurement |
|----------|--------|-------------|
| Small Audit (10k rows) | <1 minute | End-to-end time |
| Medium Audit (100k rows) | <3 minutes | End-to-end time |
| Large Audit (500k rows) | <5 minutes | End-to-end time |
| Concurrent Audits | 10 per org | No degradation |
| File Upload | 500MB | <2 minutes |

**Performance Test Script**:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
};

export default function() {
  // Upload files
  const files = {
    campaign: open('test-data/campaign-100k.csv', 'b'),
    keyword: open('test-data/keyword-100k.csv', 'b'),
  };
  
  const response = http.post(`${API_URL}/audits`, files);
  check(response, {
    'upload successful': (r) => r.status === 201,
    'processing time < 3min': (r) => r.timings.duration < 180000,
  });
}
```

### Security Testing
**Approach**: OWASP Testing Guide + Amazon-specific concerns

**Test Areas**:

1. **Authentication & Authorization**:
   - JWT token validation
   - Organization isolation
   - Session management
   - Password policies

2. **File Upload Security**:
   - Malicious file rejection
   - File size limits enforced
   - Path traversal prevention
   - Virus scanning (future)

3. **Data Protection**:
   - PII handling in reports
   - Encryption verification
   - SQL injection prevention
   - XSS in file names

**Security Test Cases**:
```python
def test_organization_isolation():
    # Create data in org1
    audit1 = create_audit(org1_token, files)
    
    # Try to access from org2
    response = get_audit(audit1.id, org2_token)
    assert response.status_code == 403
```

### Goal-Based Testing
**Unique to our application - thorough testing of goal impacts**

**Test Matrix**:
| Goal Type | Expected Behavior | Validation |
|-----------|------------------|------------|
| Revenue | Growth recs first | Check recommendation order |
| Efficiency | Cost savings prioritized | Verify savings calculations |
| New Customers | Non-branded focus | Ensure keyword filtering |
| TACoS | Flywheel prominent | Validate flywheel scoring |
| General | Balanced approach | Even distribution |

**Goal Validation Tests**:
```python
@pytest.mark.parametrize("goal,expected_first_category", [
    ("increase_revenue", "keyword_expansion"),
    ("improve_efficiency", "negative_keywords"),
    ("optimize_tacos", "flywheel_opportunities"),
])
def test_goal_recommendation_priority(goal, expected_first_category):
    result = process_audit_with_goal(sample_data, goal)
    assert result.recommendations[0].category == expected_first_category
```

## Testing Environments

### Local Development
**Setup Requirements**:
- Docker Desktop for PostgreSQL
- Supabase CLI for local instance
- Test data seeders
- Mock Inngest server

### Continuous Integration
**GitHub Actions Pipeline**:
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Frontend Tests
        run: |
          cd frontend
          npm test -- --coverage
      - name: Backend Tests
        run: |
          cd backend
          pytest --cov=app tests/
      - name: Integration Tests
        run: |
          docker-compose -f test.yml up -d
          pytest tests/integration/
```

### Staging Environment
**Purpose**: Full integration testing before production
- **Data**: Anonymized production-like datasets
- **Configuration**: Matches production settings
- **Access**: QA team + beta agencies

## Quality Assurance Process

### Sprint Testing Activities

**Sprint 1 (Auth & Upload)**:
- Unit tests for Clerk integration
- File validation test cases
- Multi-tenant isolation tests

**Sprint 2 (Goals & Processing)**:
- Goal selection UI tests
- Processing pipeline tests
- Real-time update tests

**Sprint 3 (Analysis Engine)**:
- Flywheel algorithm validation
- Performance analysis tests
- Recommendation engine tests

**Sprint 4 (Insights & UI)**:
- Frontend component tests
- Chart rendering tests
- Goal-based display tests

**Sprint 5 (Reports)**:
- PDF generation tests
- Excel formula validation
- Download functionality tests

**Sprint 6 (Polish)**:
- Full regression suite
- Performance benchmarking
- Security penetration testing

### Definition of Done
A story is complete when:
- [ ] All acceptance criteria have tests
- [ ] Unit test coverage >80% for new code
- [ ] Integration tests pass
- [ ] Goal-specific scenarios tested
- [ ] Performance targets met
- [ ] Security scan passed
- [ ] Accessibility scan passed (UI changes)

## Test Data Strategy

### Test Data Categories

1. **Small Dataset** (Happy Path):
   - 1k rows per file
   - Clean, valid data
   - All file types present

2. **Medium Dataset** (Typical):
   - 50k rows per file
   - Some data quality issues
   - Missing optional files

3. **Large Dataset** (Stress):
   - 500k rows per file
   - Complex calculations
   - Performance validation

4. **Edge Cases**:
   - Empty files
   - Malformed CSVs
   - Special characters
   - Missing columns

### Data Generation Scripts
```python
# Generate test data with known flywheel opportunities
def generate_flywheel_test_data():
    return pd.DataFrame({
        'asin': ['B001', 'B002', 'B003'],
        'ad_sales': [8500, 6000, 2000],
        'total_sales': [10000, 10000, 10000],
        'trend': ['improving', 'stable', 'declining']
    })
```

## Quality Metrics and Monitoring

### Test Metrics
**Coverage Requirements**:
- Unit Tests: 80% line coverage
- Integration Tests: All API endpoints
- E2E Tests: 5 critical user journeys
- Goal Tests: All 5 goal types

**Test Performance**:
- Unit tests: <2 minutes
- Integration tests: <5 minutes  
- E2E tests: <10 minutes
- Full suite: <20 minutes

### Production Monitoring
**Key Metrics**:
- Processing time per audit size
- Goal selection distribution
- Recommendation accuracy
- Report generation success rate
- Error rates by component

**Alerts**:
- Processing time >5 minutes
- Error rate >1%
- Failed report generation
- Organization isolation breach

## Risk-Based Testing Focus

### High-Risk Areas (Priority 1)
1. **Multi-tenant data isolation**
2. **File parsing accuracy**
3. **Flywheel calculations**
4. **Payment processing (future)**

### Medium-Risk Areas (Priority 2)
1. **Report generation**
2. **Real-time updates**
3. **Goal weighting logic**
4. **Large file handling**

### Low-Risk Areas (Priority 3)
1. **UI polish**
2. **Help documentation**
3. **Export formats**

---
*This test strategy will evolve throughout development. Update based on discoveries and changing requirements.*