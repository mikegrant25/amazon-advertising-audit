# Deployment Guide

This guide covers deploying the Amazon Advertising Audit Tool to production.

## 🚀 Overview

The application uses a modern deployment stack:
- **Frontend**: Vercel (automatic deployments from GitHub)
- **Backend**: Railway (coming in future sprints)
- **Database**: Supabase (managed PostgreSQL)
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

Before deploying, ensure you have:
- GitHub repository with code
- Vercel account linked to GitHub
- Supabase project created
- Clerk application configured
- All required API keys

## 🔧 Initial Setup

### 1. GitHub Repository

Repository is already created at: https://github.com/mikegrant25/amazon-advertising-audit

### 2. GitHub Secrets Configuration

Add these secrets at: https://github.com/[username]/[repo]/settings/secrets/actions

```bash
# Frontend Build
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Backend (for future use)
CLERK_SECRET_KEY

# Vercel Deployment
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### 3. Vercel Setup

#### First-time setup:
```bash
cd frontend
vercel
```

Follow prompts to:
1. Link to your Vercel account
2. Create/select project
3. Configure project settings

#### Project Settings:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

#### Environment Variables:
Add in Vercel Dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 🚀 Deployment Process

### Automatic Deployments

1. **Production**: Push to `main` branch
   ```bash
   git push origin main
   ```
   - Triggers GitHub Actions CI
   - Auto-deploys to Vercel on success

2. **Preview**: Create pull request
   ```bash
   git push origin feature/branch
   # Create PR on GitHub
   ```
   - Runs CI checks
   - Creates preview deployment
   - Comments preview URL on PR

### Manual Deployment

If needed, deploy manually:
```bash
cd frontend
vercel --prod
```

## 🔍 Monitoring Deployments

### GitHub Actions
- View workflows: https://github.com/[username]/[repo]/actions
- Check build logs for errors
- Monitor test results

### Vercel Dashboard
- View deployments: https://vercel.com/[team]/[project]
- Check build logs
- Monitor performance metrics
- View preview deployments

## 🛠 Troubleshooting

### Build Failures

1. **Environment variables missing**
   - Check Vercel environment variables
   - Ensure all required vars are set

2. **Type errors**
   ```bash
   npm run typecheck
   ```

3. **Test failures**
   ```bash
   npm test
   ```

### Deployment Issues

1. **Vercel build error**
   - Check build logs in Vercel dashboard
   - Verify root directory is set to `frontend`
   - Ensure Node.js version matches

2. **GitHub Actions failing**
   - Check workflow logs
   - Verify all secrets are configured
   - Ensure permissions are correct

## 📊 Current Deployment

- **Production URL**: https://frontend-jmr3t6qov-mikes-projects-0e238c9d.vercel.app
- **Repository**: https://github.com/mikegrant25/amazon-advertising-audit
- **Status**: [![Deploy to Vercel](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/deploy.yml/badge.svg)](https://github.com/mikegrant25/amazon-advertising-audit/actions/workflows/deploy.yml)

## 🔐 Security Considerations

1. **Secrets Management**
   - Never commit secrets to repository
   - Use GitHub Secrets for CI/CD
   - Use Vercel environment variables
   - Rotate tokens periodically

2. **Access Control**
   - Limit deployment permissions
   - Use branch protection rules
   - Require PR reviews for main

3. **Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking
   - Monitor performance metrics

## 📝 Deployment Checklist

Before each deployment:
- [ ] All tests passing locally
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Environment variables configured
- [ ] Database migrations ready (if needed)
- [ ] PR approved (for production)

## 🚨 Rollback Procedures

If issues occur after deployment:

1. **Vercel Instant Rollback**
   - Go to Vercel dashboard
   - Click on previous deployment
   - Click "Promote to Production"

2. **Git Revert**
   ```bash
   git revert HEAD
   git push origin main
   ```

## 📅 Future Deployments

### Backend (Railway) - Coming Soon
- FastAPI application
- Automated deployments from GitHub
- Environment sync with frontend

### Database Migrations - Coming Soon
- Automated migration runner
- Rollback procedures
- Backup strategies

---

Last Updated: January 11, 2025