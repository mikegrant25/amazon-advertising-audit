# Frontend Package.json Updates

## ⚠️ IMPORTANT: Compatibility Updates (Jan 6, 2025)

Due to compatibility issues with Next.js 14 and Storybook 7, the following versions were used:
- React: 18.3.1 (downgraded from 19.0.0)
- Next.js: 14.2.5 (compatible with React 18)
- Tailwind CSS: 3.4.0 (downgraded from 4.0)
- ESLint: 8.57.0 (for eslint-config-next compatibility)

## Scripts to Add

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "storybook": "storybook dev -p 6006",
    "build:storybook": "storybook build",
    "analyze": "ANALYZE=true next build",
    "prepare": "cd .. && husky install frontend/.husky",
    "commit": "cz"
  }
}
```

## DevDependencies to Add

```json
{
  "devDependencies": {
    // Storybook
    "@storybook/addon-essentials": "^7.6.10",
    "@storybook/addon-interactions": "^7.6.10",
    "@storybook/addon-links": "^7.6.10",
    "@storybook/addon-a11y": "^7.6.10",
    "@storybook/blocks": "^7.6.10",
    "@storybook/nextjs": "^7.6.10",
    "@storybook/react": "^7.6.10",
    "@storybook/testing-library": "^0.2.2",
    "@chromatic-com/storybook": "^1.0.0",
    
    // Testing
    "vitest": "^1.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.2",
    "@playwright/test": "^1.41.0",
    "jsdom": "^23.2.0",
    
    // Code Quality
    "prettier": "^3.2.4",
    "prettier-plugin-tailwindcss": "^0.5.11",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    
    // Git Hooks
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "commitizen": "^4.3.0",
    "@commitlint/cli": "^18.4.4",
    "@commitlint/config-conventional": "^18.4.4",
    
    // Utilities
    "@next/bundle-analyzer": "^14.1.0",
    "msw": "^2.1.2",
    
    // Types
    "@types/testing-library__jest-dom": "^6.0.0"
  }
}
```

## Configuration Files

## Additional Configuration Files Created

### tailwind.config.js (v3 syntax)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### postcss.config.mjs (updated for v3)
```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

### next.config.js (converted from TypeScript)
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

### .lintstagedrc.js
```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'vitest related --run',
  ],
  '*.{json,md,yml}': ['prettier --write'],
  '*.{css,scss}': ['prettier --write'],
}
```

### commitlint.config.js
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
      ],
    ],
  },
}
```

### .czrc
```json
{
  "path": "@commitlint/cz-commitlint"
}
```

## VS Code Settings (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "testing.automaticallyOpenPeekView": "never"
}
```

## GitHub Actions Update

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run build:storybook
```

## Storybook Best Practices

1. **Story Organization**:
   ```
   components/
   ├── ui/                    # shadcn/ui base components
   │   └── button.stories.tsx
   ├── audits/               # Audit-specific components
   │   └── FlywheelChart.stories.tsx
   ├── common/               # Shared components
   │   └── FileUpload.stories.tsx
   └── layouts/              # Layout components
       └── DashboardNav.stories.tsx
   ```

2. **Story Template**:
   ```typescript
   import type { Meta, StoryObj } from '@storybook/react'
   import { ComponentName } from './ComponentName'

   const meta: Meta<typeof ComponentName> = {
     title: 'Category/ComponentName',
     component: ComponentName,
     parameters: {
       layout: 'centered', // or 'fullscreen', 'padded'
     },
     tags: ['autodocs'],
     argTypes: {
       // Define controls here
     },
   }

   export default meta
   type Story = StoryObj<typeof meta>

   export const Default: Story = {
     args: {
       // Default props
     },
   }

   // Add more story variants
   ```

3. **MSW for API Mocking**:
   ```typescript
   // .storybook/mocks/handlers.ts
   import { rest } from 'msw'

   export const handlers = [
     rest.get('/api/audits', (req, res, ctx) => {
       return res(
         ctx.json({
           audits: mockAudits,
         })
       )
     }),
   ]
   ```

## Bundle Size Monitoring

Add to package.json:
```json
{
  "bundlesize": [
    {
      "path": ".next/static/chunks/**.js",
      "maxSize": "150 kB"
    },
    {
      "path": ".next/static/css/**.css", 
      "maxSize": "50 kB"
    }
  ]
}
```

Run analysis:
```bash
npm run analyze
# Opens bundle visualizer in browser
```

## Performance Budget

Target metrics:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 500KB
- CSS Bundle: < 100KB
- Largest JS Chunk: < 150KB

## CSS Updates

The global CSS file was updated from Tailwind v4 syntax to v3:

### src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```