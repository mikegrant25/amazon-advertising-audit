# Performance Testing Plan

## Performance Requirements

### Critical Performance Targets
| Metric | Target | Priority |
|--------|--------|----------|
| Audit Processing Time (100k rows) | <3 minutes | P0 |
| Audit Processing Time (500k rows) | <5 minutes | P0 |
| File Upload (500MB) | <2 minutes | P0 |
| PDF Report Generation | <30 seconds | P1 |
| Dashboard Load Time | <2 seconds | P1 |
| Real-time Updates | <500ms latency | P1 |

### Capacity Targets
- Concurrent audits per organization: 10
- Total concurrent audits system-wide: 100
- Maximum file size: 500MB per file
- Storage per organization: 10GB

## Performance Test Scenarios

### 1. File Upload Performance

#### Test 1.1: Single Large File Upload
```javascript
// k6 test script
import http from 'k6/http';
import { check } from 'k6';

export function testLargeFileUpload() {
  const file = open('test-data/campaign-500mb.csv', 'b');
  
  const start = Date.now();
  const response = http.post(
    `${API_URL}/audits/${auditId}/files`,
    { file: http.file(file, 'campaign.csv') },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const duration = Date.now() - start;
  
  check(response, {
    'upload successful': r => r.status === 200,
    'upload under 2 min': () => duration < 120000,
  });
}
```

#### Test 1.2: Multiple File Concurrent Upload
- Upload 4 files simultaneously (Campaign, Keyword, Search Term, Product)
- Each file ~100MB
- Measure total time and individual file completion

#### Test 1.3: Network Conditions
- Test with simulated network conditions:
  - 3G: 1.6 Mbps
  - 4G: 12 Mbps
  - Broadband: 100 Mbps

### 2. Processing Pipeline Performance

#### Test 2.1: Small Dataset (10k rows)
```python
# Performance benchmark
def test_small_dataset_processing():
    start = time.time()
    
    # Upload test files
    files = upload_test_dataset("small_10k")
    
    # Trigger processing
    result = process_audit(audit_id, goal="general_health")
    
    duration = time.time() - start
    
    assert duration < 60  # Less than 1 minute
    assert result.recommendations_count >= 15
    assert result.status == "completed"
```

#### Test 2.2: Medium Dataset (100k rows)
- Test data characteristics:
  - 100k campaign rows
  - 150k keyword rows
  - 80k search term rows
  - Complex ASIN relationships

#### Test 2.3: Large Dataset (500k rows)
- Stress test with maximum supported data
- Monitor memory usage during processing
- Verify all analysis modules complete

#### Test 2.4: Edge Cases
- Very wide files (200+ columns)
- Files with 90% duplicate data
- Unicode and special characters
- Deeply nested campaign structures

### 3. Analysis Engine Performance

#### Test 3.1: Flywheel Calculation Speed
```python
def benchmark_flywheel_analysis():
    # Test with varying dataset sizes
    for size in [1000, 10000, 100000]:
        asins = generate_test_asins(size)
        
        start = time.time()
        results = flywheel_analyzer.analyze(asins)
        duration = time.time() - start
        
        # Should scale linearly
        assert duration < size * 0.001  # 1ms per ASIN
```

#### Test 3.2: Goal-Based Recommendation Sorting
- Measure impact of goal weighting on performance
- Test with maximum recommendations (1000+)
- Verify sorting doesn't exceed 100ms

#### Test 3.3: Parallel Analysis Execution
- Ensure all analysis modules run concurrently
- Monitor CPU utilization
- Verify no module blocks others

### 4. Real-time Updates

#### Test 4.1: WebSocket Latency
```javascript
// Measure update latency
const WebSocket = require('ws');

function testRealtimeUpdates() {
  const ws = new WebSocket(`${WS_URL}/audits/${auditId}`);
  
  const latencies = [];
  
  ws.on('message', (data) => {
    const update = JSON.parse(data);
    const latency = Date.now() - update.timestamp;
    latencies.push(latency);
  });
  
  // After test completes
  const p95 = percentile(latencies, 95);
  assert(p95 < 500, 'P95 latency exceeds 500ms');
}
```

#### Test 4.2: Concurrent Update Streams
- 50 concurrent audit status streams
- Measure message delivery rate
- Verify no message loss

### 5. Report Generation Performance

#### Test 5.1: PDF Generation Speed
```python
def test_pdf_generation_performance():
    # Test with varying data sizes
    test_cases = [
        ("small", 10, 5),    # 10 pages, 5 charts
        ("medium", 50, 20),  # 50 pages, 20 charts
        ("large", 100, 50),  # 100 pages, 50 charts
    ]
    
    for name, pages, charts in test_cases:
        audit_data = generate_test_audit(pages, charts)
        
        start = time.time()
        pdf_path = generate_pdf_report(audit_data)
        duration = time.time() - start
        
        assert duration < 30  # Under 30 seconds
        assert os.path.getsize(pdf_path) < 50_000_000  # Under 50MB
```

#### Test 5.2: Excel Generation with Formulas
- Generate Excel with 10k rows
- Include pivot tables and formulas
- Verify file opens without errors

### 6. System Load Testing

#### Test 6.1: Concurrent Audit Processing
```javascript
// k6 load test configuration
export const options = {
  scenarios: {
    concurrent_audits: {
      executor: 'constant-vus',
      vus: 10,  // 10 concurrent users
      duration: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% under 3s
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

export default function() {
  // Complete audit workflow
  const auditId = createAudit();
  uploadFiles(auditId);
  selectGoal(auditId, 'improve_efficiency');
  startProcessing(auditId);
  waitForCompletion(auditId);
  downloadReport(auditId);
}
```

#### Test 6.2: Organization Isolation Under Load
- 5 organizations processing simultaneously
- Verify no cross-org data leakage
- Monitor query performance with RLS

### 7. Database Performance

#### Test 7.1: Query Performance
```sql
-- Test key query performance
EXPLAIN ANALYZE
SELECT 
  a.*,
  COUNT(r.id) as recommendation_count,
  AVG(f.savings) as avg_flywheel_savings
FROM audits a
LEFT JOIN recommendations r ON r.audit_id = a.id
LEFT JOIN flywheel_opportunities f ON f.audit_id = a.id
WHERE a.organization_id = 'org_123'
  AND a.created_at > NOW() - INTERVAL '30 days'
GROUP BY a.id
ORDER BY a.created_at DESC
LIMIT 20;

-- Should execute in <50ms
```

#### Test 7.2: Index Effectiveness
- Monitor slow query log
- Verify all foreign keys indexed
- Check index usage statistics

### 8. Frontend Performance

#### Test 8.1: Initial Load Performance
```javascript
// Lighthouse CI configuration
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/dashboard'],
      numberOfRuns: 5,
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

#### Test 8.2: Large Data Rendering
- Render 1000 recommendations
- Test virtual scrolling performance
- Measure memory usage

## Performance Monitoring

### Key Metrics to Track
1. **Processing Pipeline**
   - Job queue depth
   - Average processing time by dataset size
   - Success/failure rates

2. **API Performance**
   - Response time percentiles (p50, p95, p99)
   - Throughput (requests/second)
   - Error rates by endpoint

3. **Database Performance**
   - Query execution time
   - Connection pool utilization
   - Lock wait times

4. **Infrastructure**
   - CPU utilization (Railway)
   - Memory usage patterns
   - Network I/O

### Alerting Thresholds
```yaml
alerts:
  - name: SlowAuditProcessing
    condition: processing_time > 300s
    severity: warning
    
  - name: HighErrorRate
    condition: error_rate > 1%
    severity: critical
    
  - name: DatabaseSlowQuery
    condition: query_time > 1s
    severity: warning
    
  - name: MemoryPressure
    condition: memory_usage > 90%
    severity: critical
```

## Performance Optimization Strategies

### 1. Processing Optimizations
- Stream large CSV files instead of loading into memory
- Use connection pooling for database
- Implement caching for repeated calculations
- Parallelize independent analysis modules

### 2. Database Optimizations
- Partition large tables by organization_id
- Use materialized views for complex aggregations
- Implement query result caching
- Regular VACUUM and ANALYZE

### 3. Frontend Optimizations
- Lazy load heavy components
- Implement virtual scrolling for long lists
- Use React.memo for expensive renders
- Bundle splitting by route

### 4. Infrastructure Scaling
- Auto-scale Railway dynos based on CPU
- Use CDN for static assets
- Implement read replicas for reporting
- Queue long-running jobs

## Performance Test Execution Schedule

### During Development
- Run unit performance tests on every commit
- Weekly load tests on staging environment
- Ad-hoc stress tests for new features

### Pre-Release
- Full performance test suite
- 24-hour endurance test
- Chaos engineering tests
- Performance regression analysis

### Post-Release
- Daily performance monitoring
- Weekly trend analysis
- Monthly capacity planning review

---
*Performance targets will be refined based on pilot agency feedback and usage patterns.*