# Production Setup Instructions

## Domain Configuration

You'll need to replace `[SUBDOMAIN].[YOURDOMAIN].com` throughout the setup process.

For example, if you own `example.com` and want to use the subdomain `audit`:
- Replace `[SUBDOMAIN]` with `audit`
- Replace `[YOURDOMAIN]` with `example`
- Result: `audit.example.com`

## Quick Setup Steps

### 1. DNS Configuration (Spaceship)

Add ONE DNS record:
- Type: `CNAME`
- Name: `[SUBDOMAIN]` (e.g., "audit")
- Value: `cname.vercel-dns.com`
- TTL: 3600

### 2. Vercel Setup

```bash
# Add subdomain to Vercel
vercel domains add [SUBDOMAIN].[YOURDOMAIN].com
```

### 3. Clerk Production Setup

When Clerk asks for domain, enter:
```
[SUBDOMAIN].[YOURDOMAIN].com
```

### 4. Environment Variables

In Vercel Dashboard, set these for Production:
```
NEXT_PUBLIC_APP_URL=https://[SUBDOMAIN].[YOURDOMAIN].com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### 5. Deploy

```bash
vercel --prod
```

## What You DON'T Need to Do

Since you're only using a subdomain:
- ❌ Don't change nameservers
- ❌ Don't add A records
- ❌ Don't configure the main domain
- ❌ Don't worry about MX records (email will keep working)

## Testing

After DNS propagates (5-30 minutes):
```bash
# Test DNS
dig cname [SUBDOMAIN].[YOURDOMAIN].com

# Test site
curl -I https://[SUBDOMAIN].[YOURDOMAIN].com
```

## Your Main Domain

Your main domain remains untouched and available for:
- Future website
- Email (if configured)
- Other subdomains
- Selling (if desired)

The ONLY thing we're adding is one CNAME record for the subdomain.