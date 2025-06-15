# Subdomain Setup Checklist

Use this checklist to track your progress setting up your subdomain.

## Pre-Setup
- [ ] Decided on subdomain name: ________________
- [ ] Have access to Spaceship DNS management
- [ ] Have access to Vercel dashboard
- [ ] Have access to Clerk dashboard

## Vercel Setup
- [ ] Logged into Vercel CLI: `vercel login`
- [ ] Added subdomain to Vercel: `vercel domains add [subdomain.domain.com]`
- [ ] Noted any instructions from Vercel

## Spaceship DNS Configuration
- [ ] Logged into Spaceship
- [ ] Navigated to DNS management
- [ ] Added CNAME record:
  - Name: ________ (subdomain only)
  - Value: `cname.vercel-dns.com`
  - TTL: 3600
- [ ] Saved DNS changes

## DNS Verification (wait 5-15 minutes)
- [ ] Ran `dig cname [subdomain.domain.com]`
- [ ] Confirmed CNAME points to `cname.vercel-dns.com`

## Clerk Production Setup
- [ ] Entered subdomain in Clerk production setup
- [ ] Added allowed origin: `https://[subdomain.domain.com]`
- [ ] Configured webhook URL: `https://[subdomain.domain.com]/api/webhooks/clerk`
- [ ] Copied production keys:
  - [ ] Publishable Key (pk_live_...)
  - [ ] Secret Key (sk_live_...)
  - [ ] Webhook Secret (whsec_...)

## Vercel Environment Variables
- [ ] Opened Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Added NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (Production)
- [ ] Added CLERK_SECRET_KEY (Production)
- [ ] Added CLERK_WEBHOOK_SECRET (Production)
- [ ] Added NEXT_PUBLIC_APP_URL = https://[subdomain.domain.com] (Production)
- [ ] Verified Supabase keys are present

## Deployment
- [ ] Ran `vercel --prod` to deploy
- [ ] Deployment completed successfully
- [ ] SSL certificate automatically provisioned

## Testing
- [ ] Visited https://[subdomain.domain.com]
- [ ] Site loads with SSL (padlock icon)
- [ ] Clicked "Sign Up" - Clerk auth works
- [ ] Created test account
- [ ] Signed in successfully
- [ ] Uploaded test CSV file
- [ ] Completed audit workflow
- [ ] Downloaded PDF report

## Final Steps
- [ ] Updated any documentation with new URL
- [ ] Shared subdomain with team/stakeholders
- [ ] Set up monitoring alerts
- [ ] Ready for pilot launch! 🎉

## Troubleshooting Commands
```bash
# Check DNS propagation
dig cname [subdomain.domain.com]

# Check SSL certificate
curl -I https://[subdomain.domain.com]

# Check health endpoint
curl https://[subdomain.domain.com]/api/health

# View Vercel deployment logs
vercel logs --prod
```

## Common Issues
1. **DNS not resolving**: Wait up to 24 hours for full propagation
2. **SSL errors**: Vercel auto-provisions SSL, may take 10-15 minutes
3. **Clerk errors**: Double-check production keys in Vercel env vars
4. **404 errors**: Ensure domain is linked to correct Vercel project