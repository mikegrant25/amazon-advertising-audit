# Testing & Validation Guide

## Overview
Comprehensive testing strategy to ensure the Amazon Advertising Audit Tool meets quality standards before and after deployment.

## 1. Testing Pyramid

### Unit Tests (60%)
Fast, isolated tests for individual components and functions.

### Integration Tests (30%)
Test interactions between components and external services.

### E2E Tests (10%)
Full user journey tests simulating real user behavior.

## 2. Frontend Testing

### Unit Testing Setup

#### Install Testing Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest @vitejs/plugin-react jsdom
```

#### Configure Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

### Component Testing Examples

#### Goal Selection Component
```typescript
// src/components/audits/__tests__/goal-selection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { GoalSelection } from '../goal-selection'

describe('GoalSelection', () => {
  it('renders all 5 goal options', () => {
    render(<GoalSelection onGoalSelect={jest.fn()} />)
    
    expect(screen.getByText('Profitability Focus')).toBeInTheDocument()
    expect(screen.getByText('Growth Mode')).toBeInTheDocument()
    expect(screen.getByText('New Product Launch')).toBeInTheDocument()
    expect(screen.getByText('Market Defense')).toBeInTheDocument()
    expect(screen.getByText('Portfolio Optimization')).toBeInTheDocument()
  })

  it('calls onGoalSelect when goal is clicked', () => {
    const mockSelect = jest.fn()
    render(<GoalSelection onGoalSelect={mockSelect} />)
    
    fireEvent.click(screen.getByText('Growth Mode'))
    expect(mockSelect).toHaveBeenCalledWith('growth')
  })
})
```

#### File Upload Component
```typescript
// src/components/audits/__tests__/file-upload.test.tsx
describe('FileUpload', () => {
  it('accepts CSV files', async () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const { getByTestId } = render(<FileUpload />)
    
    const input = getByTestId('file-input')
    await userEvent.upload(input, file)
    
    expect(screen.getByText('test.csv')).toBeInTheDocument()
  })

  it('rejects non-CSV files', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const { getByTestId } = render(<FileUpload />)
    
    const input = getByTestId('file-input')
    await userEvent.upload(input, file)
    
    expect(screen.getByText('Only CSV files are allowed')).toBeInTheDocument()
  })

  it('enforces 500MB file size limit', async () => {
    const largeFile = new File(['x'.repeat(501 * 1024 * 1024)], 'large.csv', { type: 'text/csv' })
    // Test rejection of large files
  })
})
```

### API Integration Tests

```typescript
// src/lib/__tests__/api.test.ts
import { createAudit, uploadFile, processFile } from '../api'

describe('API Integration', () => {
  it('creates audit successfully', async () => {
    const audit = await createAudit({
      name: 'Test Audit',
      goal: 'growth',
      dateRange: { start: '2024-01-01', end: '2024-12-31' }
    })
    
    expect(audit).toHaveProperty('id')
    expect(audit.status).toBe('pending')
  })

  it('handles file upload and processing', async () => {
    const file = new File(['Campaign,Clicks\nTest,100'], 'test.csv')
    const upload = await uploadFile(file, 'sponsored_products')
    
    expect(upload.status).toBe('uploaded')
    
    const processed = await processFile(upload.id)
    expect(processed.status).toBe('completed')
  })
})
```

## 3. Backend Testing

### CSV Parsing Validation
```python
# tests/test_csv_parser.py
import pytest
from services.csv_parser import parse_sponsored_products

def test_parse_valid_sponsored_products():
    csv_content = """Campaign,Ad Group,Targeting,Match Type,Clicks,Spend,Sales
    Summer Sale,Yoga Mats,yoga mat,EXACT,150,45.50,450.00
    Summer Sale,Yoga Mats,exercise mat,BROAD,75,22.30,180.00"""
    
    result = parse_sponsored_products(csv_content)
    assert result['status'] == 'success'
    assert result['row_count'] == 2
    assert len(result['data']) == 2

def test_parse_missing_columns():
    csv_content = """Campaign,Clicks
    Test,100"""
    
    result = parse_sponsored_products(csv_content)
    assert result['status'] == 'error'
    assert 'Missing required columns' in result['error']

def test_parse_invalid_data_types():
    csv_content = """Campaign,Clicks,Spend
    Test,invalid,45.50"""
    
    result = parse_sponsored_products(csv_content)
    assert result['status'] == 'warning'
    assert len(result['warnings']) > 0
```

### Flywheel Analysis Testing
```python
# tests/test_flywheel.py
def test_flywheel_calculation():
    data = {
        'asin': 'B001234567',
        'ad_revenue': 1000,
        'total_revenue': 5000,
        'trend_data': [80, 70, 60, 50, 40]  # Declining ad attribution
    }
    
    result = calculate_flywheel_score(data)
    assert result['score'] > 0.7  # High flywheel score
    assert result['recommendation'] == 'reduce_spend'
    assert result['confidence'] == 'high'

def test_new_product_detection():
    data = {
        'asin': 'B009876543',
        'launch_date': '2024-01-01',
        'data_points': 15  # Less than 30 days
    }
    
    result = calculate_flywheel_score(data)
    assert result['recommendation'] == 'insufficient_data'
    assert 'New product' in result['message']
```

## 4. End-to-End Testing

### Playwright Setup
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Critical User Journeys

#### Complete Audit Flow
```typescript
// e2e/audit-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete audit from start to PDF', async ({ page }) => {
  // 1. Login
  await page.goto('/sign-in')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'testpassword')
  await page.click('button[type="submit"]')
  
  // 2. Create new audit
  await page.goto('/dashboard/audits/new')
  await page.fill('[name="auditName"]', 'E2E Test Audit')
  await page.selectOption('[name="dateRange"]', '30days')
  await page.click('button:has-text("Create Audit")')
  
  // 3. Upload files
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.click('button:has-text("Upload Files")')
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles('./test-data/sponsored-products.csv')
  
  // 4. Select goal
  await page.click('button:has-text("Growth Mode")')
  await page.click('button:has-text("Start Analysis")')
  
  // 5. Wait for analysis
  await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 300000 })
  
  // 6. View recommendations
  await page.click('button:has-text("View Recommendations")')
  await expect(page.locator('.recommendation-card')).toHaveCount(15)
  
  // 7. Download PDF
  const downloadPromise = page.waitForEvent('download')
  await page.click('button:has-text("Download Report")')
  const download = await downloadPromise
  
  expect(download.suggestedFilename()).toContain('.pdf')
})
```

#### File Upload Validation
```typescript
test('validates file requirements', async ({ page }) => {
  await page.goto('/dashboard/audits/123/upload')
  
  // Test wrong file type
  await page.setInputFiles('input[type="file"]', './test.txt')
  await expect(page.locator('text=Only CSV files')).toBeVisible()
  
  // Test file too large
  // Create a large file in memory
  const largeFile = Buffer.alloc(501 * 1024 * 1024)
  await page.setInputFiles('input[type="file"]', {
    name: 'large.csv',
    mimeType: 'text/csv',
    buffer: largeFile
  })
  await expect(page.locator('text=File too large')).toBeVisible()
})
```

## 5. Performance Testing

### Load Testing with k6
```javascript
// k6/load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
}

export default function () {
  // Test file upload
  const file = open('./test-data/sample.csv', 'b')
  const response = http.post('https://api.example.com/upload', {
    file: http.file(file, 'sample.csv'),
  })
  
  check(response, {
    'upload successful': (r) => r.status === 200,
    'processing started': (r) => r.json('fileId') !== undefined,
  })
  
  sleep(1)
}
```

### Performance Benchmarks
- Page load: < 3 seconds
- File upload: < 10 seconds for 100MB
- Analysis processing: < 5 minutes for typical audit
- PDF generation: < 30 seconds
- API response time: < 500ms (p95)

## 6. Data Validation Testing

### Sample Data Sets
Create test files for each scenario:

#### Valid Data
- `test-data/valid-sponsored-products.csv`
- `test-data/valid-search-terms.csv`
- `test-data/valid-business-report.csv`

#### Edge Cases
- Empty files
- Single row files
- Maximum size files (500MB)
- Special characters in data
- Missing optional columns
- Extra columns

#### Invalid Data
- Wrong column names
- Invalid data types
- Corrupted encoding
- Malformed CSV structure

### Validation Test Suite
```typescript
describe('CSV Validation', () => {
  const testCases = [
    { file: 'valid-basic.csv', expected: 'success' },
    { file: 'missing-columns.csv', expected: 'error' },
    { file: 'wrong-encoding.csv', expected: 'error' },
    { file: 'special-chars.csv', expected: 'warning' },
    { file: 'empty.csv', expected: 'error' },
  ]
  
  testCases.forEach(({ file, expected }) => {
    it(`validates ${file} correctly`, async () => {
      const result = await validateCSV(`./test-data/${file}`)
      expect(result.status).toBe(expected)
    })
  })
})
```

## 7. Security Testing

### Authentication Tests
```typescript
test('requires authentication for protected routes', async () => {
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/audits',
    '/api/audits',
    '/api/files/upload',
  ]
  
  for (const route of protectedRoutes) {
    const response = await fetch(route)
    expect(response.status).toBe(401)
  }
})
```

### File Upload Security
```typescript
test('prevents malicious file uploads', async () => {
  const maliciousFiles = [
    { name: 'script.csv.exe', type: 'application/x-msdownload' },
    { name: '../../../etc/passwd', type: 'text/csv' },
    { name: 'xss<script>alert(1)</script>.csv', type: 'text/csv' },
  ]
  
  for (const file of maliciousFiles) {
    const result = await uploadFile(file)
    expect(result.error).toBeDefined()
  }
})
```

## 8. Accessibility Testing

### Automated Testing
```bash
npm install --save-dev @axe-core/playwright
```

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage accessibility', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('dashboard accessibility', async ({ page }) => {
  await page.goto('/dashboard')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

### Manual Testing Checklist
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Loading states are communicated

## 9. Browser Compatibility

### Test Matrix
| Browser | Versions | Status |
|---------|----------|--------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Edge | 90+ | ✅ |
| Mobile Chrome | Latest | ✅ |
| Mobile Safari | Latest | ✅ |

### Cross-Browser Test Script
```typescript
const browsers = ['chromium', 'firefox', 'webkit']

browsers.forEach(browserName => {
  test.describe(`${browserName} tests`, () => {
    test.use({ browserName })
    
    test('audit flow works', async ({ page }) => {
      // Run core tests in each browser
    })
  })
})
```

## 10. Testing Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing on staging
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Accessibility audit passed
- [ ] Cross-browser testing done
- [ ] Load testing completed

### Post-Deployment
- [ ] Smoke tests on production
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test with real pilot data
- [ ] Confirm email delivery
- [ ] Validate PDF generation
- [ ] Check feedback submission

### Regression Testing
Run after each deployment:
```bash
# Quick smoke test suite (5 min)
npm run test:smoke

# Full regression suite (30 min)
npm run test:regression

# Performance suite (15 min)
npm run test:performance
```

## 11. Test Data Management

### Test Account Setup
```
Email: pilot-test-1@example.com through pilot-test-10@example.com
Password: TestPilot2024!
```

### Sample Data Repository
```
/test-data/
  /small/        # <1MB files for quick tests
  /medium/       # 10-50MB files
  /large/        # 100-500MB files
  /edge-cases/   # Special scenarios
  /invalid/      # Error testing
```

### Data Reset Script
```bash
# scripts/reset-test-data.sh
#!/bin/bash

# Clear test accounts
supabase db reset --db-url $TEST_DATABASE_URL

# Recreate test users
node scripts/create-test-users.js

# Upload sample data
node scripts/upload-test-files.js
```

## 12. Continuous Testing

### CI Pipeline Tests
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npx playwright install
      - run: npm run test:e2e
      - run: npm run test:accessibility
```

### Daily Test Runs
Schedule comprehensive tests:
```yaml
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM daily
```

---

**Created**: January 14, 2025  
**Status**: Ready for implementation  
**Priority**: Critical - Complete before pilot launch  
**Owner**: QA Team