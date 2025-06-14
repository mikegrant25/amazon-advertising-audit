# Amazon Advertising Audit Tool - Frontend

Next.js 14 application for analyzing Amazon advertising performance through the paid-organic flywheel strategy.

## 🚀 Features

### Implemented (Sprint 1 & 2)
- ✅ **Authentication**: Clerk integration with user sync to Supabase
- ✅ **File Upload**: Drag-and-drop CSV upload with validation
- ✅ **CSV Processing**: Real-time parsing with progress tracking
- ✅ **Data Validation**: Support for all 5 Amazon report types
- ✅ **Flywheel Analysis**: Ad attribution calculation and recommendations
- ✅ **Performance Metrics**: CTR, CVR, ACoS, ROAS calculations
- ✅ **Protected Routes**: Secure dashboard and API endpoints
- ✅ **API Endpoints**: Analysis triggers and data aggregation

### Completed (Sprint 3) ✅
- ✅ **Goal Configuration**: Interactive goal selector with descriptions and icons
- ✅ **Recommendation Engine**: Goal-based recommendations with confidence levels
- ✅ **Analysis Dashboard**: Real-time visualization of flywheel metrics
- ✅ **Enhanced UX**: Loading states, error handling, and progress indicators
- ✅ **PDF Report Generation**: Professional report export with charts and branding
- ✅ **End-to-End Integration**: Complete workflow from upload to PDF download
- ✅ **Audit History**: Search and filter past audits with quick navigation
- ✅ **Workflow Progress Tracking**: Visual indicators for each step
- ✅ **Error Boundaries**: Graceful error recovery throughout application

### Remaining (Sprint 3)
- 🔄 **Pilot Onboarding**: Materials and feedback collection (US-001-014)

## 🛠 Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.0
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **CSV Parsing**: Papa Parse
- **File Upload**: react-dropzone
- **Testing**: Vitest, Playwright
- **Code Quality**: ESLint, Prettier, Husky
- **PDF Generation**: @react-pdf/renderer

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── audits/       # Audit CRUD and analysis endpoints
│   │   │   ├── analyze/  # Flywheel analysis trigger
│   │   │   └── [id]/     # Audit-specific endpoints
│   │   │       └── performance/  # Performance metrics
│   │   ├── files/        # File processing endpoints
│   │   └── webhooks/     # Clerk webhook handler
│   ├── dashboard/         # Protected dashboard pages
│   └── (auth)/           # Authentication pages
├── components/            # React components
│   ├── audits/           # Audit-related components
│   ├── recommendations/  # Recommendation display
│   ├── reports/          # PDF report generation
│   ├── workflow/         # Workflow tracking
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and business logic
│   ├── analysis/         # Flywheel analysis engine
│   ├── csv/              # CSV parsing and validation
│   ├── supabase/         # Database clients
│   └── hooks/            # Custom React hooks
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Clerk account
- Supabase account

### Environment Variables

Create `.env.local`:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Webhook (for Clerk user sync)
WEBHOOK_SECRET=whsec_...
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run production build
npm start
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types
- `npm test` - Run unit tests
- `npm run test:e2e` - Run Playwright tests
- `npm run storybook` - Start Storybook

## 🧪 Testing

### Unit Tests (Vitest)
```bash
# Run all tests
npm test

# Run specific test file
npm test src/lib/csv/__tests__/parser.test.ts

# Watch mode
npm test -- --watch
```

### E2E Tests (Playwright)
```bash
# Install browsers
npx playwright install

# Run tests
npm run test:e2e

# Debug mode
npm run test:e2e -- --debug
```

## 📊 Key Components

### File Upload
```tsx
import { FileUploadWithProcessing } from '@/components/audits/file-upload-with-processing'

<FileUploadWithProcessing
  auditId={auditId}
  fileType="sponsored_products"
  onUploadComplete={(fileId) => console.log('Uploaded:', fileId)}
  onProcessingComplete={(fileId, status) => console.log('Processed:', status)}
  onError={(error) => console.error(error)}
/>
```

### CSV Processing
- Validates column structure for 5 report types
- Handles column name variations
- Processes files up to 500MB in batches
- Real-time validation feedback
- Stores parsed data in JSONB format

### Flywheel Analysis
- Calculates ad attribution percentage by ASIN
- Linear regression trend analysis (R² > 0.3)
- Generates 0-100 flywheel score
- Graduated spend reduction recommendations (25%/50%)
- Confidence levels based on data availability

### Performance Metrics
- Campaign and ad group aggregation
- Standard metrics: CTR, CVR, ACoS, ROAS
- TACoS calculation with organic data
- Top/bottom performer identification
- Performance ratings with benchmarks

## 🔐 Security

- Authentication required for all dashboard routes
- Clerk webhook validates signatures
- Row Level Security (RLS) in Supabase
- File uploads restricted to CSV format
- Maximum file size: 500MB

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker
```bash
# Build image
docker build -t amazon-audit-frontend .

# Run container
docker run -p 3000:3000 amazon-audit-frontend
```

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript errors after schema changes**
   ```bash
   npm run supabase:types
   ```

3. **Clerk authentication issues**
   - Verify environment variables
   - Check webhook configuration
   - Ensure user sync is working

4. **Build warnings**
   - Supabase realtime-js warning is expected
   - See `docs/supabase-warning-resolution.md`

## 📚 Documentation

- [CSV Parsing Guide](../docs/csv-parsing-guide.md)
- [Flywheel Analysis Guide](../docs/flywheel-analysis-guide.md)
- [Authentication Setup](../docs/authentication-setup.md)
- [Supabase Setup](../docs/supabase-setup.md)

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Run `npm run lint` before committing
5. Use conventional commits

---

**Last Updated**: January 14, 2025

## 🎯 MVP Features Complete

The frontend now provides a complete audit workflow:
1. **Upload** - Drag & drop CSV files with validation
2. **Configure** - Select business goal for customized analysis
3. **Analyze** - Real-time flywheel and performance calculations
4. **Review** - Interactive recommendations dashboard
5. **Export** - Professional PDF report generation

All core MVP features are implemented and tested. The application is ready for pilot agency testing.