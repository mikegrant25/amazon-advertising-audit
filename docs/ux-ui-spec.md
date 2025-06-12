# Frontend Specification: Amazon Advertising Audit Tool

## Design Overview
A professional, data-driven interface designed for Amazon advertising agencies to efficiently conduct comprehensive audits. The design emphasizes clarity in data visualization, streamlined multi-file uploads, and actionable insights presentation, particularly highlighting our unique paid-organic flywheel analysis.

## Design System

### Visual Foundation

#### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #8b5cf6 | Main CTAs, flywheel highlights, brand |
| Secondary | #3b82f6 | Supporting actions, links, accents |
| Success | #10b981 | Positive metrics, savings, improvements |
| Warning | #f59e0b | Cautions, attention areas |
| Error | #ef4444 | Errors, negative trends, issues |
| Neutral | #64748b | Text, borders, secondary content |
| Background | #fafafa | Main background |
| Surface | #ffffff | Cards, panels |
| Dark | #1e293b | Headers, primary text |

#### Typography
| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | Inter | 32px | 700 | 1.2 |
| H2 | Inter | 24px | 600 | 1.3 |
| H3 | Inter | 20px | 600 | 1.4 |
| Body | Inter | 16px | 400 | 1.5 |
| Small | Inter | 14px | 400 | 1.5 |
| Caption | Inter | 12px | 400 | 1.4 |

#### Spacing System
- Base unit: 4px
- Scale: xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

#### Grid System
- Columns: 12
- Gutter: 24px
- Max width: 1440px
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Component Library

#### Buttons
- **Primary**: Solid purple background, white text, hover darkens
  - States: Default, Hover, Active, Disabled, Loading
- **Secondary**: White background, purple border, purple text
  - States: Default, Hover, Active, Disabled
- **Ghost**: Transparent background, purple text, hover shows background
- **Icon**: Square aspect, subtle background on hover

#### Forms
- **File Upload Zone**: 
  - Large drop area with dashed border
  - Drag state shows purple border
  - Shows file type icons for CSV/Excel
  - Progress bars during upload
  - File validation feedback inline
- **Select/Dropdown**: Shadcn/ui select with search capability
- **Date Range**: Preset options (Last 30/60/90 days, Custom)
- **Organization Switcher**: Clerk-powered org dropdown in header

#### Navigation
- **Header**: 
  - Fixed position, white background with subtle shadow
  - Logo left, org switcher center, user menu right
  - Height: 64px
- **Sidebar** (Desktop only):
  - 280px width, collapsible to 64px
  - Icon + label navigation items
  - Active state with purple background
- **Breadcrumbs**: Slash-separated, truncate long names
- **Tabs**: Underline style for sub-navigation

#### Feedback
- **Toast**: Bottom-right position, 5s duration, dismissible
- **Modal**: Centered, dark overlay, max-width 600px
- **Loading States**:
  - Skeleton screens for content areas
  - Circular progress for file processing
  - Step indicators for multi-stage processes
- **Empty States**: 
  - Illustration + helpful message
  - Clear CTA to get started

#### Data Display
- **Audit Cards**: 
  - White background, subtle shadow
  - Status badge (Processing, Complete, Failed)
  - Goal icon and label (e.g., 📈 Revenue)
  - Key metrics preview
  - Goal achievement indicator
  - Hover shows additional actions
- **Metrics Cards**:
  - Large number display
  - Trend indicator (up/down arrow)
  - Sparkline for context
- **Flywheel Chart**:
  - Dual-axis line chart
  - Purple for ad attribution %
  - Green for potential savings
  - Interactive tooltips
- **Recommendation Cards**:
  - Impact level indicator (High/Medium/Low)
  - Effort badge (Quick Win/Strategic)
  - Estimated savings highlighted

## Page Layouts

### Dashboard
#### Desktop Layout
```
+---------------------------+
|         Header            |
+-------+-------------------+
| Side  | Welcome Banner    |
| bar   +-------------------+
|       | Recent Audits     |
|       | +-+ +-+ +-+ +-+   |
|       | |1| |2| |3| |4|   |
|       | +-+ +-+ +-+ +-+   |
|       +-------------------+
|       | Quick Stats       |
|       | [4 metric cards]  |
+-------+-------------------+
```

#### Mobile Layout
```
+---------------+
|    Header     |
+---------------+
| Quick Actions |
| [+ New Audit] |
+---------------+
| Recent Audits |
| +-----+       |
| |  1  |       |
| +-----+       |
| |  2  |       |
| +-----+       |
+---------------+
```

#### Key Elements
- **Welcome Banner**: Personalized greeting with quick action CTA
- **Recent Audits**: Card grid showing last 8 audits with status
- **Quick Stats**: Total audits, time saved, insights found, active clients

### New Audit Flow
#### Step 1: Upload Files
```
+---------------------------+
|    Upload Your Files      |
+---------------------------+
| +---------------------+   |
| |                     |   |
| |   Drop files here   |   |
| |    or browse        |   |
| |                     |   |
| +---------------------+   |
|                           |
| Required Files:           |
| ✓ Campaign Report         |
| ✓ Keyword Report          |
| ○ Search Term Report      |
| ○ Product Report          |
|                           |
| [Continue →]              |
+---------------------------+
```

#### Step 2: Configure Analysis
```
+---------------------------+
|   Configure Analysis      |
+---------------------------+
| Date Range:               |
| [Last 90 Days      ▼]     |
|                           |
| Focus Areas:              |
| ☑ Performance Analysis    |
| ☑ Flywheel Opportunities  |
| ☑ Seasonality Patterns    |
| ☑ Competitor Gaps         |
|                           |
| Client Name: (optional)   |
| [___________________]     |
|                           |
| [← Back] [Start Analysis] |
+---------------------------+
```

#### Step 3: Processing
```
+---------------------------+
|    Analyzing Data...      |
+---------------------------+
|                           |
|   [=========>    ] 67%    |
|                           |
| ✓ Files validated         |
| ✓ Data parsed             |
| ⟳ Running flywheel analysis|
| ○ Generating insights     |
| ○ Creating report         |
|                           |
| Estimated time: 2 mins    |
+---------------------------+
```

### Audit Results View
#### Desktop Layout
```
+--------------------------------+
|          Header                |
+--------+-----------------------+
| Side   | Audit: Client Name    |
| bar    | Status: Complete       |
|        +-----------+-----------+
|        | Overview  | Flywheel  |
|        | (active)  |           |
|        +-----------+-----------+
|        | Key Metrics Summary   |
|        | [4 large cards]       |
|        +-----------------------+
|        | Recommendations (15)  |
|        | +-------+ +-------+   |
|        | |Quick  | |Impact |   |
|        | |Wins(5)| |High(3)|   |
|        | +-------+ +-------+   |
|        +-----------------------+
|        | [Download Report ↓]   |
+--------+-----------------------+
```

## Interaction Patterns

### Navigation Flow
1. **Dashboard** → View recent audits or start new
2. **New Audit** → 4-step wizard (Upload → Goal → Configure → Process)
3. **Results** → Tabbed sections (Overview, Flywheel, Seasonality, Competitors) ordered by goal
4. **Export** → Generate goal-focused PDF/Excel with progress indicator

### Micro-interactions
- **Hover States**: Cards lift with shadow, buttons darken
- **Focus States**: 2px purple outline, high contrast
- **Transitions**: 200ms ease-out for all transitions
- **Feedback**: Success checkmarks animate in, errors shake

### File Upload Interactions
- **Drag & Drop**: Border highlights, background color change
- **Progress**: Individual file progress bars
- **Validation**: Inline error messages with specific issues
- **Success**: Checkmark animation, file preview

## Responsive Behavior

### Breakpoint Strategy
- **Desktop-First**: Primary workflows optimized for desktop
- **Tablet**: Simplified layout, touch-friendly targets
- **Mobile**: View-only for results, no upload capability

### Adaptive Components
- **Navigation**: Sidebar becomes bottom nav on mobile
- **Cards**: Stack vertically on mobile, 2-column on tablet
- **Charts**: Simplified on mobile, full interactive on desktop
- **Tables**: Horizontal scroll on mobile with frozen first column

## Accessibility Requirements

### WCAG Compliance
- **Level**: AA
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Management**: Logical tab order, skip to content link
- **Screen Reader**: ARIA labels for all interactive elements

### Keyboard Navigation
- **Tab Order**: Header → Sidebar → Main content → Footer
- **Shortcuts**: 
  - Cmd/Ctrl + N: New audit
  - Cmd/Ctrl + /: Search
  - Esc: Close modals
- **Focus Trapping**: Modals and dropdowns trap focus

### Alternative Content
- **Charts**: Data tables available as alternative view
- **Icons**: Descriptive labels and tooltips
- **Progress**: Text updates for screen readers

## Motion & Animation

### Principles
- **Purpose**: Guide attention, show relationships, provide feedback
- **Duration**: 200ms for micro, 300ms for larger transitions
- **Easing**: ease-out for enter, ease-in for exit

### System Animations
- **Page Transitions**: Fade between routes (200ms)
- **Chart Animations**: Lines draw in sequentially
- **Loading States**: Skeleton pulse effect
- **Success States**: Checkmark draws in with bounce

### Reduced Motion
- Respect prefers-reduced-motion
- Instant transitions, no decorative animations

## Content Guidelines

### Voice & Tone
- **Personality**: Professional yet approachable
- **Language**: Clear, avoiding Amazon jargon where possible
- **Perspective**: "We" for system, "Your" for user's data

### Messaging Patterns
- **Error Messages**: 
  - "Upload failed: File exceeds 500MB limit. Please reduce file size and try again."
- **Empty States**: 
  - "No audits yet! Upload your Amazon Advertising data to get started."
- **Success Messages**: 
  - "Analysis complete! Found 12 flywheel opportunities worth $3,400/month."
- **Loading Messages**: 
  - "Analyzing your campaign performance..." 
  - "Identifying flywheel opportunities..."

### Microcopy
- **Button Labels**: "Start Analysis" not "Submit"
- **Form Labels**: "Campaign Report (Required)" with helper text
- **Tooltips**: "Ad-attributed revenue percentage indicates organic strength"

## Asset Requirements

### Icons
- **Library**: Lucide React (successor to Feather)
- **Style**: 24px default, 2px stroke
- **Custom Icons**: Flywheel, Amazon Ads file types

### Charts
- **Library**: Recharts
- **Colors**: Use semantic colors from palette
- **Interactions**: Hover tooltips, click to filter

### Illustrations
- **Style**: Minimal, geometric, purple accent color
- **Usage**: Empty states, error pages, onboarding

## Browser & Device Support

### Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Devices
- **Desktop**: Primary experience, 1280px minimum
- **Tablet**: Responsive layout, touch optimized
- **Mobile**: View-only for results, no file upload

## Performance Targets

### Loading
- **Initial Load**: < 3 seconds
- **Route Changes**: < 500ms
- **File Upload**: Show progress immediately

### Bundle Size
- **CSS**: < 100kb gzipped
- **JavaScript**: < 300kb gzipped
- **Lazy Load**: Charts and heavy components

## Implementation Notes

### CSS Architecture
- **Tailwind CSS**: Utility-first with custom config
- **CSS Modules**: For complex component styles
- **Design Tokens**: CSS variables for theming

### Component Architecture
- **Shadcn/ui**: Base component library
- **Composition**: Small, focused components
- **Props**: TypeScript interfaces for all props

### State Management
- **Server State**: TanStack Query for API data
- **Client State**: Zustand for UI state
- **Form State**: React Hook Form with Zod

## Design Handoff

### Design Tools
- **Source Files**: Figma (link to be added)
- **Prototypes**: Interactive Figma prototype
- **Assets**: Exported to `/public/assets`

### Developer Resources
- **Component Stories**: Storybook for all components
- **Design Tokens**: `/styles/tokens.css`
- **Icon Sprite**: SVG sprite sheet

---
*This specification defines the MVP user experience. Post-MVP enhancements will include dark mode, advanced filtering, and white-label customization.*