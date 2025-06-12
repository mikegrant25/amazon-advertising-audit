# Product Requirements Document
## Amazon Advertising Audit Automation Tool

---

### Document Status & Phase Tracking

**Current Phase**: MVP Epic 1 - Flywheel Validation  
**Sprint**: Pre-Sprint 1 (Planning)  
**Version**: 2.0  
**Last Updated**: June 12, 2025  
**Document Type**: Living Document - Iterative PRD

### Current Sprint Focus Box
```
┌──────────────────────────────────────────────────────────────────┐
│ SPRINT 1-3 FOCUS: Epic 1 - Flywheel Validation                  │
│                                                                  │
│ Building:                                                        │
│ • Basic authentication (Clerk)                                   │
│ • File upload infrastructure (4 report types)                   │
│ • Flywheel analysis engine (CORE HYPOTHESIS)                    │
│ • Basic performance metrics (ACoS, ROAS)                        │
│ • Goal-based configuration                                      │
│ • Simple PDF report generation                                  │
│                                                                  │
│ Success Criteria:                                                │
│ • Validate ad-attribution % as organic proxy                    │
│ • Process files in <5 minutes                                   │
│ • 10 pilot agencies confirm flywheel value                      │
│                                                                  │
│ NOT Building Yet: Seasonality, Competitor Analysis, Dashboard    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Product Vision & Objectives

### Vision Statement
Empower every Amazon agency to deliver Fortune 500-quality audits in under 30 minutes, uncovering hidden revenue opportunities that even experienced strategists miss—making expert-level optimization accessible to all.

### Strategic Objectives
1. **Efficiency**: Reduce audit time by 80% (from 3-5 hours to 30 minutes)
2. **Quality**: Surface 20% more optimization opportunities than manual audits
3. **Differentiation**: Provide unique paid-organic flywheel analysis unavailable elsewhere
4. **Scale**: Enable agencies to audit 10x more accounts annually
5. **Consistency**: Eliminate human error and standardize audit quality

### Phase-Specific Objectives

#### 🚀 MVP Phase (Epic 1) - CURRENT
1. **Validate Core Hypothesis**: Prove that ad-attribution % trends correlate with organic performance
2. **Deliver Time Savings**: Demonstrate significant reduction over manual methods
3. **Generate Agency Interest**: Acquire 10 pilot agencies to validate flywheel value
4. **Prove Technical Feasibility**: Process real agency data reliably within 5 minutes
5. **Fast Iteration**: Complete validation in 3 sprints to minimize risk

#### 🔮 Future Phase (Epic 2)
1. **Complete Analysis Suite**: Add seasonality and competitor insights
2. **Scale Agency Operations**: Multi-client dashboard and management
3. **Professional Outputs**: Enhanced visualizations and white-labeling
4. **Market Penetration**: 50+ active agencies within 12 months

---

## 2. Target Users

### Primary User: Amazon Advertising Agency Strategist
**Profile**:
- Works at 10-50 person Amazon-focused agency
- Senior level with 3+ years Amazon advertising experience
- Manages 5-20 client accounts
- Conducts 2-5 audits per month

**MVP Focus**: Single audit workflow, flywheel insights validation

### Secondary User: Independent Amazon Consultant
**Profile**:
- Solo practitioner or small team (1-5 people)
- Deep Amazon expertise but limited time
- Manages 10-30 clients

**Epic 2 Focus**: Batch processing, time-saving features

### Tertiary User: Enterprise In-House Team
**Future Consideration**: Complex workflows, team collaboration

---

## 3. Jobs-to-be-Done Framework

### Primary JTBD: Complete Thorough Audits Faster
**When** I need to audit a client's Amazon advertising account  
**I want to** analyze all campaigns, keywords, and performance data comprehensively  
**So I can** deliver strategic recommendations without spending 3-5 hours on manual analysis

#### 🚀 MVP Acceptance Criteria (Epic 1)
- Process 4 standard Amazon export files
- Complete flywheel analysis in under 5 minutes
- Surface paid-to-organic transition opportunities
- Generate basic PDF with insights

#### 🔮 Future Acceptance Criteria (Epic 2)
- Add seasonality and competitor insights
- Professional visualizations
- Excel implementation plans
- White-labeled outputs

### Supporting Jobs

#### 1. Uncover Hidden Opportunities
**MVP Feature**: Flywheel analysis reveals organic momentum  
**Future Features**: Seasonality patterns, competitor gaps

#### 2. Differentiate Agency Value
**MVP Feature**: Unique flywheel insights no competitor offers  
**Future Features**: Professional branding, comprehensive analysis

---

## 4. Core Features & Requirements

### 4.1 Data Ingestion & Processing

#### 🚀 File Upload System (Epic 1 - BUILDING NOW)
**Requirements**:
- Accept CSV files from Amazon Advertising
- Support 4 report types: Campaign, Keyword, Search Term, Product
- Handle files up to 500MB
- Basic validation and error messaging
- Single audit workflow

**User Story**: As an agency strategist, I want to upload my client's export files so I can get flywheel insights quickly.

#### 🔮 Enhanced Upload System (Epic 2 - FUTURE)
- Excel file support (XLSX, XLS)
- Bulk upload for multiple accounts
- Advanced validation with fix suggestions
- Batch processing capabilities

### 4.2 Goal-Based Configuration

#### 🚀 Audit Goal Selection (Epic 1 - BUILDING NOW)
**Requirements**:
- Present 5 goal options during setup
- Use goal to weight recommendations
- Store with audit metadata

**Goal Types**:
1. **Increase Revenue**: Growth opportunities focus
2. **Improve Efficiency**: ACoS/ROAS optimization
3. **Acquire New Customers**: Non-branded emphasis
4. **Optimize TACoS**: Flywheel opportunities prioritized
5. **General Health Check**: Balanced analysis

### 4.3 Analysis Engine

#### 🚀 MVP Analysis Components (Epic 1 - BUILDING NOW)

##### Flywheel Analysis Engine (KEY DIFFERENTIATOR)
**Core Hypothesis to Validate**:
- Calculate ad-attributed revenue % by ASIN
- Track conversion rate changes over time
- Identify ASINs with improving organic performance
- Generate graduated ad spend reduction strategies

**Innovation**: Use ad-attribution % as inverse proxy for organic strength:
- High ad-attribution % (>80%) = Weak organic presence
- Declining ad-attribution % = Improving organic rank
- Low ad-attribution % (<30%) = Strong organic, reduce ad spend

##### Basic Performance Analysis
**Requirements**:
- Calculate ACoS, ROAS, CTR, CVR
- Identify underperforming campaigns
- Surface obvious optimization opportunities

#### 🔮 Future Analysis Components (Epic 2)

##### Seasonality Analysis Engine
- Identify performance patterns over time
- Detect seasonal trends and anomalies
- Time-based optimization recommendations

##### Competitor Analysis Engine
- Gap identification from search terms
- Competitor conquest opportunities
- Market share insights

### 4.4 Output Generation

#### 🚀 MVP Outputs (Epic 1 - BUILDING NOW)

##### Simple PDF Report
**Requirements**:
- Basic formatting with insights
- Flywheel analysis findings
- Top 10-15 recommendations
- Goal-weighted priorities
- 5-10 page document

#### 🔮 Future Outputs (Epic 2)

##### Professional PDF Reports
- Agency branding/white-label
- Advanced visualizations
- 20-30 page comprehensive analysis
- Executive summary

##### Excel Implementation Plan
- Detailed action items
- Timeline and priorities
- Resource requirements
- Progress tracking

### 4.5 User Interface

#### 🚀 MVP Interface (Epic 1 - BUILDING NOW)
**Requirements**:
- Simple 4-step workflow
- File upload → Goal selection → Processing → Download
- Basic progress indication
- Minimal but functional design

#### 🔮 Future Interface (Epic 2)
**Requirements**:
- Full agency dashboard
- Multi-client management
- Audit history and tracking
- Advanced visualizations
- Real-time processing updates
- Professional UI/UX

---

## 5. Implementation Roadmap

### Epic 1: Flywheel Validation & Core Foundation ← WE ARE HERE
**Timeline**: Sprints 1-3 (6 weeks)  
**Value**: Validate core hypothesis with minimum viable product

#### Sprint 1: Foundation (Weeks 1-2)
- [ ] Basic authentication setup (Clerk)
- [ ] File upload infrastructure
- [ ] Database schema for audits
- [ ] Basic UI framework

#### Sprint 2: Core Analysis (Weeks 3-4)
- [ ] Flywheel analysis algorithm
- [ ] Basic performance calculations
- [ ] Goal-based weighting logic
- [ ] Initial testing with sample data

#### Sprint 3: MVP Completion (Weeks 5-6)
- [ ] PDF report generation
- [ ] End-to-end workflow
- [ ] Pilot agency onboarding
- [ ] Hypothesis validation

**Success Gate**: 10 agencies validate flywheel value → Proceed to Epic 2

### Epic 2: Complete Analysis & Agency Experience
**Timeline**: Sprints 4-8 (10 weeks)  
**Value**: Expand to full analysis suite for professional use

#### Key Additions:
- Seasonality analysis engine
- Competitor analysis from search terms
- Agency dashboard with multi-client view
- Professional PDF reports
- Excel implementation plans
- White-label capabilities

### Post-MVP Future Features
- API integration with Amazon Advertising
- Third-party tool integrations
- Automated scheduling
- Client portals
- Advanced ML recommendations

---

## 6. Success Metrics & KPIs

### 🚀 MVP Success Metrics (Epic 1)
- **Hypothesis Validation**: Ad-attribution % proves useful as organic proxy
- **Processing Speed**: <5 minutes per audit
- **Pilot Feedback**: 8/10 agencies want to continue
- **Unique Value**: Flywheel insights rated "highly valuable"

### 🔮 Future Success Metrics (Epic 2+)
- **Active Users**: 50+ agencies within 12 months
- **Audit Volume**: 500+ audits/month
- **Time Savings**: 80% reduction confirmed
- **Revenue/User**: $500+/month average

---

## 7. Technical Requirements

### 🚀 MVP Technical Stack (Epic 1)
- **Frontend**: Next.js with TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Processing**: Edge Functions for analysis
- **File Handling**: Direct uploads to Supabase Storage
- **PDF Generation**: React PDF library

### 🔮 Future Technical Enhancements (Epic 2)
- **Caching**: Redis for performance
- **Queue System**: For batch processing
- **Monitoring**: Advanced analytics
- **Security**: SOC 2 compliance path

---

## 8. Risks & Mitigation

### 🚀 MVP-Specific Risks (Epic 1)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flywheel hypothesis invalid | Critical | Fast validation with pilots, ready to pivot |
| Ad-attribution % unreliable | High | Multiple calculation methods, pilot feedback |
| Processing too slow | Medium | Optimize algorithms, set expectations |

### 🔮 Future Risks (Epic 2+)
- Competitive response → Focus on unique value
- Scaling challenges → Cloud-native architecture
- Feature creep → Strict prioritization

---

## 9. Document History

### Version 2.0 - June 12, 2025
- Restructured as living document with phase headers
- Added current sprint focus box
- Separated MVP (Epic 1) from Future (Epic 2) features
- Added clear "BUILDING NOW" vs "FUTURE" markers
- Created progressive disclosure structure

### Version 1.0 - June 12, 2025
- Initial PRD creation
- Full feature set documented
- Epic structure defined

---

## Quick Reference: What We're Building NOW

### Epic 1 Checklist (Current Sprint 1-3 Focus)
- [x] Defined: Basic authentication (Clerk)
- [x] Defined: File upload for 4 report types
- [x] Defined: Flywheel analysis algorithm
- [x] Defined: Basic performance metrics
- [x] Defined: Goal-based configuration
- [x] Defined: Simple PDF output
- [ ] Built: All of the above
- [ ] Validated: Flywheel hypothesis with pilots

### NOT in Current Scope
- ❌ Seasonality analysis
- ❌ Competitor analysis
- ❌ Agency dashboard
- ❌ White-labeling
- ❌ Excel exports
- ❌ Batch processing

Remember: **Focus on proving the flywheel hypothesis first. Everything else comes after validation.**