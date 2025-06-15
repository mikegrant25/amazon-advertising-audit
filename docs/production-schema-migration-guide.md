# Production Schema Migration Guide

## Overview

This guide outlines the migration from the current MVP schema to a production-optimized schema designed for enterprise scale, multi-tenancy, and high performance.

## Key Architectural Improvements

### 1. **Schema Organization**
- **Before**: Everything in public schema
- **After**: Domain-driven schemas (tenant, audit, analytics, storage_meta, cache, logs)
- **Benefits**: 
  - Better organization and maintainability
  - Clearer security boundaries
  - Easier to manage permissions
  - Supports future microservices architecture

### 2. **Multi-Tenant Architecture**
- **Before**: Single-tenant with user_id references
- **After**: Full organization/tenant model with membership and roles
- **Benefits**:
  - Supports agencies managing multiple clients
  - Role-based access control (RBAC)
  - API key management for integrations
  - White-labeling capabilities
  - Organization-level quotas and limits

### 3. **Table Partitioning**
- **Before**: Single large tables
- **After**: Partitioned tables for audits and logs
- **Benefits**:
  - Faster queries on large datasets
  - Easier data archival
  - Parallel query execution
  - Reduced index maintenance overhead

### 4. **Performance Optimizations**

#### Denormalized Analytics Tables
```sql
-- Before: Complex joins for every query
SELECT ... FROM audits 
JOIN audit_files ON ...
JOIN (complex subqueries) ON ...

-- After: Pre-aggregated metrics
SELECT * FROM analytics.metrics 
WHERE audit_id = ? AND metric_type = ?
```

#### Materialized Views
- Organization dashboard metrics
- Top performers by category
- Refresh periodically, not on every query

#### Compressed Data Storage
- Parsed CSV data compressed with GZIP
- Chunked storage for parallel processing
- Hash partitioning for even distribution

### 5. **Enhanced Security**

#### Row Level Security (RLS)
- Organization-based isolation
- Helper functions for cleaner policies
- Separate policies for different operations

#### API Key Management
- Hashed storage (never plain text)
- Scoped permissions
- Rate limiting built-in
- Audit trail for API usage

### 6. **Scalability Features**

#### Storage Optimization
- File deduplication via SHA256 hashing
- Chunked data storage for large files
- Configurable storage quotas
- Automatic archival policies

#### Query Performance
- Strategic indexes for common patterns
- Full-text search on audit names/descriptions
- GiST indexes for date range queries
- GIN indexes for JSONB queries

## Migration Strategy

### Phase 1: Schema Creation (Non-Breaking)
1. Create new schemas alongside existing tables
2. Set up new tables without dropping old ones
3. Create migration functions

### Phase 2: Data Migration
```sql
-- Example migration for organizations
INSERT INTO tenant.organizations (name, slug, created_at)
SELECT DISTINCT 
    COALESCE(company_name, email) as name,
    regexp_replace(lower(COALESCE(company_name, email)), '[^a-z0-9]+', '-', 'g') as slug,
    MIN(created_at) as created_at
FROM public.users
GROUP BY company_name, email;

-- Migrate users to organization members
INSERT INTO tenant.organization_members (organization_id, clerk_id, email, full_name)
SELECT 
    o.id,
    u.clerk_id,
    u.email,
    u.full_name
FROM public.users u
JOIN tenant.organizations o ON ...;
```

### Phase 3: Application Updates
1. Update application code to use new schema
2. Implement organization context
3. Update RLS policies to use new functions

### Phase 4: Cutover
1. Stop writes to old tables
2. Final data sync
3. Switch application to new tables
4. Monitor for issues

### Phase 5: Cleanup
1. Drop old tables after verification
2. Remove migration functions
3. Optimize new tables (VACUUM ANALYZE)

## Implementation Checklist

### Database Setup
- [ ] Create new schemas
- [ ] Create custom types
- [ ] Create utility functions
- [ ] Create new tables with partitions
- [ ] Set up indexes
- [ ] Enable RLS
- [ ] Create policies
- [ ] Set up materialized views
- [ ] Configure storage buckets

### Data Migration
- [ ] Migrate users to organizations
- [ ] Migrate audits with organization links
- [ ] Migrate files and parse data
- [ ] Migrate analytics results
- [ ] Verify data integrity
- [ ] Run reconciliation reports

### Application Updates
- [ ] Update Supabase client configuration
- [ ] Implement organization context
- [ ] Update API endpoints
- [ ] Update authentication flow
- [ ] Add organization switcher UI
- [ ] Update file upload paths

### Testing
- [ ] Test multi-tenant isolation
- [ ] Test performance with large datasets
- [ ] Test role-based permissions
- [ ] Test API key authentication
- [ ] Load test with concurrent users
- [ ] Test backup and restore

## Performance Benchmarks

### Expected Improvements
- **Query Performance**: 10-50x faster for analytics queries
- **Concurrent Users**: Support 1000+ concurrent users
- **Data Volume**: Handle 100M+ rows efficiently
- **File Processing**: Process 100MB files in <30 seconds
- **API Response**: <100ms for dashboard queries

### Monitoring Queries
```sql
-- Check partition sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'audits_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor slow queries
SELECT * FROM logs.slow_queries
ORDER BY mean_time_ms DESC
LIMIT 20;

-- Check cache hit rates
SELECT 
    COUNT(*) as total_requests,
    SUM(hit_count) as cache_hits,
    ROUND(AVG(hit_count)::numeric, 2) as avg_hits_per_key
FROM cache.analysis_results
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

## Security Considerations

### Data Isolation
- Organization data is completely isolated
- RLS policies prevent cross-tenant access
- API keys scoped to organization

### Compliance Features
- Full audit trail in activity_log
- Data retention policies
- GDPR-compliant data deletion
- Encryption at rest (Supabase default)

### Best Practices
1. Always use organization context
2. Validate API key scopes
3. Log sensitive operations
4. Regular security audits
5. Monitor for unusual access patterns

## Rollback Plan

### If Issues Arise
1. Application can be quickly pointed back to old schema
2. Data remains in old tables during migration
3. Rollback scripts prepared for each phase

### Rollback Commands
```sql
-- Revert application to old schema
UPDATE app_config SET use_new_schema = false;

-- Sync any new data back to old tables
INSERT INTO public.audits 
SELECT ... FROM audit.audits 
WHERE created_at > {migration_start_time};
```

## Future Enhancements

### Phase 2 Features
- [ ] Real-time collaboration
- [ ] Audit templates
- [ ] Custom fields
- [ ] Workflow automation
- [ ] Advanced permissions

### Phase 3 Features  
- [ ] Data warehousing integration
- [ ] Machine learning pipeline
- [ ] Custom analytics
- [ ] Multi-region support
- [ ] Federated queries

## Support and Troubleshooting

### Common Issues

1. **RLS Policy Violations**
   - Check user's organization membership
   - Verify auth.uid() is set correctly
   - Use EXPLAIN to debug queries

2. **Performance Degradation**
   - Check materialized view refresh schedule
   - Analyze query plans
   - Verify indexes are being used

3. **Storage Quota Exceeded**
   - Run storage usage function
   - Archive old audits
   - Increase organization quota

### Monitoring Dashboard Queries
```sql
-- Organization health check
SELECT * FROM analytics.organization_metrics
WHERE organization_id = ?;

-- Audit funnel analysis  
SELECT * FROM analytics.get_audit_funnel(?org_id, ?date_from, ?date_to);

-- Storage usage
SELECT * FROM tenant.calculate_storage_usage(?org_id);
```

## Conclusion

This production-optimized schema provides:
- **Scalability**: Handle thousands of organizations and millions of audits
- **Performance**: Sub-second query responses with proper indexing
- **Security**: Complete data isolation and comprehensive audit trails
- **Flexibility**: JSONB fields and partitioning for future growth
- **Maintainability**: Clear schema organization and documentation

The migration can be executed in phases with minimal downtime and full rollback capability.