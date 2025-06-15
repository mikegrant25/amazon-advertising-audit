# Verexiq.com Setup Checklist

## Domain: verexiq.com
## Subdomain: audit.verexiq.com

### ✅ What We're Setting Up
- Subdomain `audit.verexiq.com` → Amazon Advertising Audit Tool
- Main domain `verexiq.com` → Stays free for future use

### 📋 Setup Steps

#### 1. Spaceship DNS Configuration
- [ ] Log into Spaceship
- [ ] Navigate to verexiq.com
- [ ] Go to DNS Settings
- [ ] Add CNAME record:
  - Host: `audit`
  - Points to: `cname.vercel-dns.com`
  - TTL: 3600
- [ ] Save changes

#### 2. Vercel Setup
- [ ] Run `vercel login`
- [ ] Run `vercel domains add audit.verexiq.com`
- [ ] Confirm domain added successfully

#### 3. DNS Verification (wait 5-15 minutes)
- [ ] Run `dig cname audit.verexiq.com`
- [ ] Verify it shows: `audit.verexiq.com. → cname.vercel-dns.com.`

#### 4. Clerk Production Setup
- [ ] Go to Clerk Dashboard
- [ ] Enter domain: `audit.verexiq.com`
- [ ] Configure:
  - Allowed origin: `https://audit.verexiq.com`
  - Webhook URL: `https://audit.verexiq.com/api/webhooks/clerk`
- [ ] Copy keys:
  - [ ] Publishable Key: pk_live_________________
  - [ ] Secret Key: sk_live_________________
  - [ ] Webhook Secret: whsec_________________

#### 5. Vercel Environment Variables
- [ ] Go to Vercel Dashboard → Project Settings → Environment Variables
- [ ] Add for Production:
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = [your pk_live key]
  - [ ] `CLERK_SECRET_KEY` = [your sk_live key]
  - [ ] `CLERK_WEBHOOK_SECRET` = [your whsec key]
  - [ ] `NEXT_PUBLIC_APP_URL` = https://audit.verexiq.com

#### 6. Deploy
- [ ] Run `vercel --prod`
- [ ] Wait for deployment to complete
- [ ] Note deployment URL

#### 7. Testing
- [ ] Visit https://audit.verexiq.com
- [ ] Verify SSL certificate (padlock icon)
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Upload test CSV
- [ ] Run audit
- [ ] Download PDF report

### 🎯 Quick Commands

```bash
# Check DNS
dig cname audit.verexiq.com

# Deploy to production
vercel --prod

# Check health endpoint
curl https://audit.verexiq.com/api/health

# View logs
vercel logs --prod
```

### 📝 Future Considerations

1. **Main Domain (verexiq.com)**
   - Currently unused and available
   - Could add a landing page later
   - Could sell if not needed
   - Email can be configured anytime

2. **Additional Subdomains**
   - `api.verexiq.com` - For future API
   - `docs.verexiq.com` - For documentation
   - `blog.verexiq.com` - For content marketing
   - `app2.verexiq.com` - For next tool

### ⚠️ Important Notes

- We're ONLY adding one CNAME record
- Main domain remains completely untouched
- No nameserver changes needed
- Email (if any) continues to work normally
- Can add more subdomains anytime

### 🚀 Final URLs

- **Production App**: https://audit.verexiq.com
- **Health Check**: https://audit.verexiq.com/api/health
- **Main Domain**: verexiq.com (available for future use)