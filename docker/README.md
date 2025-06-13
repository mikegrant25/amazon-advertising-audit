# Docker Setup for Local Development

## Quick Start

1. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Check database is running:**
   ```bash
   docker-compose ps
   ```

3. **Access PostgreSQL:**
   ```bash
   docker exec -it audit-postgres psql -U postgres -d audit_tool
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Database Connection

Use these credentials for local development:
- Host: localhost
- Port: 5432
- Database: audit_tool
- Username: postgres
- Password: password

Connection string:
```
postgresql://postgres:password@localhost:5432/audit_tool
```

## Troubleshooting

If port 5432 is already in use:
1. Stop the conflicting service, or
2. Change the port in docker-compose.yml:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```