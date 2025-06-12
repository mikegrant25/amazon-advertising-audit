# User Flows - Amazon Advertising Audit Tool

## 1. New User Onboarding Flow

```mermaid
graph TD
    A[Land on Homepage] --> B{Has Account?}
    B -->|No| C[Sign Up with Clerk]
    B -->|Yes| D[Sign In]
    C --> E[Email Verification]
    E --> F[Create Organization]
    F --> G[Organization Setup]
    G --> H[Invite Team Members]
    H --> I[Dashboard Tour]
    I --> J[Ready to Start]
    D --> K{Has Organization?}
    K -->|No| F
    K -->|Yes| L[Select Organization]
    L --> J
```

### Key Screens:
1. **Sign Up**: Email, password, agency name
2. **Organization Setup**: Company details, timezone, branding
3. **Team Invites**: Optional bulk invite via email
4. **Dashboard Tour**: Interactive tooltips for first-time users

## 2. Core Audit Creation Flow

```mermaid
graph TD
    A[Dashboard] --> B[Click New Audit]
    B --> C[Upload Files Screen]
    C --> D{Files Valid?}
    D -->|No| E[Show Validation Errors]
    E --> C
    D -->|Yes| F[Select Goal]
    F --> G[Configure Analysis]
    G --> H[Start Processing]
    H --> I[Processing Screen]
    I --> J{Processing Complete?}
    J -->|Error| K[Show Error + Retry]
    K --> C
    J -->|Success| L[View Results]
    L --> M[Download Reports]
```

### Detailed Steps:

#### 2.1 File Upload Process
```mermaid
graph LR
    A[Drop Zone] --> B[Select Files]
    B --> C[Validate Format]
    C --> D{Valid?}
    D -->|Yes| E[Show Preview]
    D -->|No| F[Show Error]
    E --> G[Check Required Files]
    G --> H{All Required?}
    H -->|Yes| I[Enable Continue]
    H -->|No| J[Show Missing]
```

#### 2.2 Goal Selection
```mermaid
graph LR
    A[Files Uploaded] --> B[Goal Selection Screen]
    B --> C{Goal Selected}
    C -->|Revenue| D[Revenue Focus]
    C -->|Efficiency| E[Efficiency Focus]
    C -->|New Customers| F[Customer Focus]
    C -->|TACoS| G[TACoS Focus]
    C -->|General| H[Balanced Focus]
    D --> I[Configure with Goal]
    E --> I
    F --> I
    G --> I
    H --> I
```

#### 2.3 Processing States
```mermaid
stateDiagram-v2
    [*] --> Uploading
    Uploading --> Validating
    Validating --> GoalProcessing: Apply goal weights
    GoalProcessing --> Analyzing
    Analyzing --> Generating
    Generating --> Complete
    Validating --> Failed
    GoalProcessing --> Failed
    Failed --> [*]
    Complete --> [*]
```

## 3. Results Exploration Flow

```mermaid
graph TD
    A[Audit Complete] --> B[View Overview]
    B --> C[Goal Achievement Summary]
    C --> D{Explore Section}
    D -->|Flywheel| E[Flywheel Analysis]
    D -->|Performance| F[Performance Metrics]
    D -->|Seasonality| G[Seasonal Patterns]
    D -->|Competitors| H[Competitor Gaps]
    E --> I[Goal-Prioritized Opportunities]
    F --> J[Goal-Relevant Metrics]
    I --> K[Filter/Sort by Impact]
    K --> L[View Details]
    L --> M[Add to Report]
```

## 4. Report Generation Flow

```mermaid
graph TD
    A[View Results] --> B[Click Download]
    B --> C[Select Format]
    C --> D{Format Type}
    D -->|PDF| E[Configure PDF Options]
    D -->|Excel| F[Configure Excel Options]
    E --> G[Goal-Focused Sections]
    F --> G
    G --> H[Add Branding]
    H --> I[Generate Report]
    I --> J[Processing with Goal Context]
    J --> K[Download Ready]
    K --> L[Auto-Download]
```

### Report Options:
- **PDF**: Goal-specific executive summary, prioritized insights, relevant charts
- **Excel**: Goal-weighted recommendations, implementation tracker, ROI projections

## 5. Multi-Client Management Flow

```mermaid
graph TD
    A[Agency Dashboard] --> B[Client Switcher]
    B --> C[Select Client]
    C --> D[Client Context]
    D --> E{Action}
    E -->|New Audit| F[Audit Flow]
    E -->|View History| G[Audit List]
    E -->|Compare| H[Multi-Audit View]
    G --> I[Filter by Date]
    H --> J[Select Audits]
    J --> K[Comparison View]
```

## 6. Flywheel Opportunity Flow (Unique Feature)

```mermaid
graph TD
    A[Flywheel Tab] --> B[View Opportunities]
    B --> C[Sort by Savings]
    C --> D[Select ASIN/Keyword]
    D --> E[View Details]
    E --> F{Analysis}
    F -->|High Ad %| G[Show Organic Weak]
    F -->|Improving Trend| H[Show Reduction Plan]
    G --> I[Recommend Strategy]
    H --> J[Graduated Timeline]
    I --> K[Add to Plan]
    J --> K
    K --> L[Export Strategy]
```

### Flywheel Decision Tree:
```
IF goal = TACoS_OPTIMIZATION
  THEN weight_flywheel_opportunities = 1.8x
  
IF ad_attribution% > 80% AND trend = improving
  THEN "High opportunity - reduce bids gradually"
  IF goal = EFFICIENCY 
    THEN priority = HIGH
  IF goal = REVENUE
    THEN priority = MEDIUM
    
ELSE IF ad_attribution% > 80% AND trend = stable
  THEN "Monitor - may need organic boost first"
  
ELSE IF ad_attribution% < 40% AND sales = high
  THEN "Strong organic - minimize ad spend"
  IF goal = EFFICIENCY
    THEN priority = CRITICAL
```

## 7. Error Recovery Flows

### 7.1 Upload Failure
```mermaid
graph TD
    A[Upload Error] --> B{Error Type}
    B -->|File Too Large| C[Show Size Limit]
    B -->|Wrong Format| D[Show Accepted Formats]
    B -->|Missing Columns| E[Show Requirements]
    C --> F[Suggest Solutions]
    D --> G[Provide Template]
    E --> H[Column Mapping Tool]
    F --> I[Retry Upload]
    G --> I
    H --> I
```

### 7.2 Processing Failure
```mermaid
graph TD
    A[Processing Failed] --> B[Show Error Message]
    B --> C{User Action}
    C -->|Retry| D[Reprocess]
    C -->|Contact Support| E[Support Form]
    C -->|Download Partial| F[Partial Results]
    D --> G{Success?}
    G -->|Yes| H[Continue]
    G -->|No| B
```

## 8. Empty States & First-Time Experiences

### 8.1 No Audits Yet
- Illustration of audit process
- "Start Your First Audit" CTA
- Sample report preview link
- Video tutorial option

### 8.2 No Flywheel Opportunities
- Educational content about flywheel concept
- Tips for improving organic performance
- Link to knowledge base

### 8.3 Processing First Audit
- Extended tooltips explaining each step
- Goal selection helper: "Not sure? Start with General Health Check"
- Real-time status updates
- Estimated completion time
- "What to expect" sidebar with goal-specific insights

## 9. Mobile Experience Flow

```mermaid
graph TD
    A[Mobile Landing] --> B[Sign In]
    B --> C[View-Only Dashboard]
    C --> D{Select Action}
    D -->|View Audit| E[Results Summary]
    D -->|Download| F[Email Report]
    E --> G[Key Metrics]
    G --> H[Top Recommendations]
    F --> I[Send to Email]
```

### Mobile Limitations:
- No file upload capability
- Simplified charts and tables
- Focus on key insights only
- Email report delivery

## 10. User Preference Management

```mermaid
graph TD
    A[Settings] --> B{Preference Type}
    B -->|Notifications| C[Email Preferences]
    B -->|Display| D[Dashboard Layout]
    B -->|Export| E[Default Options]
    C --> F[Save Preferences]
    D --> F
    E --> F
    F --> G[Apply Changes]
```

---

## Key Interaction Principles

1. **Progressive Disclosure**: Don't overwhelm with all options at once
2. **Clear Feedback**: Every action has immediate visual response
3. **Graceful Degradation**: Errors don't break the flow
4. **Contextual Help**: Tooltips and hints where needed
5. **Consistent Patterns**: Similar actions work the same way everywhere

## Success Metrics for Flows

- **Onboarding**: 80% complete first audit within 10 minutes
- **Goal Selection**: 85% select specific goal (not general)
- **Upload Success**: 95% successful on first attempt
- **Report Generation**: <30 seconds for any format
- **Goal Achievement**: 70% report improved metrics for selected goal
- **Error Recovery**: 90% self-service resolution
- **Mobile Engagement**: 60% check results on mobile