# Monitoring & Analytics Setup Guide

## Overview
This guide covers the monitoring, analytics, and observability setup for the Amazon Advertising Audit Tool in production.

## 1. Application Monitoring

### Vercel Analytics
Already integrated in the application. To activate:

1. Go to Vercel Dashboard > Project Settings > Analytics
2. Enable Web Analytics (included in Pro plan)
3. Analytics will automatically track:
   - Page views
   - Unique visitors
   - Page load performance
   - Geographic distribution
   - Device types

### Custom Analytics Events
The application already tracks these events via `lib/analytics.ts`:

```typescript
// Already implemented events:
- AUDIT_CREATED
- GOAL_SELECTED
- FILES_UPLOADED
- ANALYSIS_STARTED
- ANALYSIS_COMPLETED
- RECOMMENDATIONS_VIEWED
- PDF_DOWNLOADED
- FEEDBACK_SUBMITTED
```

## 2. Error Tracking Setup

### Option 1: Sentry (Recommended)

1. Create account at sentry.io
2. Create new Next.js project
3. Install Sentry:
   ```bash
   npm install --save @sentry/nextjs
   ```
4. Run setup wizard:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
5. Add to environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_ORG=your_org
   SENTRY_PROJECT=your_project
   ```

### Option 2: LogRocket
For session replay and error tracking:
1. Create account at logrocket.com
2. Install: `npm install --save logrocket`
3. Initialize in `app/layout.tsx`

## 3. Performance Monitoring

### Core Web Vitals
Monitor via Vercel Analytics:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms  
- CLS (Cumulative Layout Shift) < 0.1

### Custom Performance Metrics
Track in `lib/analytics.ts`:
```typescript
// File upload time
analytics.trackTiming('file_upload', uploadDuration)

// Analysis processing time
analytics.trackTiming('analysis_processing', processingDuration)

// PDF generation time
analytics.trackTiming('pdf_generation', generationDuration)
```

## 4. Database Monitoring

### Supabase Dashboard
Monitor via Supabase dashboard:
- Query performance
- Active connections
- Storage usage
- API request volume

### Custom Metrics to Track
- Audit completion rate
- Average file sizes
- Processing success rate
- User retention

## 5. Uptime Monitoring

### Option 1: BetterUptime
1. Sign up at betteruptime.com
2. Add monitors for:
   - Homepage: https://your-domain.com
   - API health: https://your-domain.com/api/health
   - Auth check: https://your-domain.com/dashboard

### Option 2: Uptime Robot
Free tier available:
1. Create monitors for critical endpoints
2. Set up alerts via email/Slack
3. Configure status page

## 6. Business Metrics Dashboard

### Key Metrics to Track

#### User Engagement
- Daily/Monthly Active Users
- Signup to first audit conversion
- Average audits per user
- Feature adoption rates

#### Performance Metrics
- Average processing time by file size
- Error rates by feature
- API response times
- Database query performance

#### Business KPIs
- Pilot agency engagement
- Feedback submission rate
- Recommendation acceptance rate
- Report download rate

### Implementation with Mixpanel

1. Sign up at mixpanel.com
2. Install SDK:
   ```bash
   npm install --save mixpanel-browser
   ```
3. Create tracking service:
   ```typescript
   // lib/mixpanel.ts
   import mixpanel from 'mixpanel-browser'
   
   mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!)
   
   export const track = (event: string, properties?: any) => {
     if (process.env.NODE_ENV === 'production') {
       mixpanel.track(event, properties)
     }
   }
   ```

## 7. Alerting Setup

### Critical Alerts
Configure immediate alerts for:
- Error rate > 5%
- Response time > 5 seconds
- Failed logins > 10/minute
- Database connection failures
- Storage quota exceeded

### Warning Alerts
Configure delayed alerts for:
- Error rate > 2%
- Response time > 3 seconds
- High memory usage
- Unusual traffic patterns

### Alert Channels
1. Email (primary)
2. Slack webhook (recommended)
3. PagerDuty (for critical issues)
4. SMS (for system-wide failures)

## 8. Logging Strategy

### Application Logs
Use structured logging:
```typescript
console.log(JSON.stringify({
  level: 'info',
  event: 'audit_completed',
  userId: user.id,
  auditId: audit.id,
  duration: processingTime,
  timestamp: new Date().toISOString()
}))
```

### Log Aggregation
Options:
1. **Vercel Logs** (included)
2. **Datadog** (comprehensive)
3. **New Relic** (APM focus)
4. **Papertrail** (simple)

## 9. Security Monitoring

### Track Security Events
- Failed login attempts
- Suspicious file uploads
- Rate limit violations
- API authentication failures

### Implement Rate Limiting
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
```

## 10. Monthly Reporting

### Automated Reports
Set up monthly reports including:
- Total audits processed
- User growth metrics
- System performance stats
- Error trends
- Feature usage analytics

### Pilot Feedback Tracking
- NPS scores
- Feature requests
- Bug reports
- Usage patterns

## Implementation Checklist

### Week 1 - Basic Monitoring
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Create health check endpoint

### Week 2 - Advanced Analytics
- [ ] Implement Mixpanel/Amplitude
- [ ] Set up custom event tracking
- [ ] Create business dashboards
- [ ] Configure alerting rules

### Week 3 - Optimization
- [ ] Set up log aggregation
- [ ] Implement performance tracking
- [ ] Create monitoring runbooks
- [ ] Train team on tools

## Monitoring Costs (Monthly Estimate)

### Essential ($150-300/month)
- Vercel Pro: $20/user
- Sentry Team: $26+
- Uptime monitoring: $7+
- Basic analytics: Free tier

### Recommended ($500-800/month)
- All Essential items
- Mixpanel Growth: $25+
- Datadog Pro: $15/host
- LogRocket: $99+

### Enterprise ($1500+/month)
- All Recommended items
- New Relic Pro
- PagerDuty
- Advanced security monitoring

---

**Created**: January 14, 2025  
**Priority**: High - Implement before pilot launch  
**Owner**: DevOps Team