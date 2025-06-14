# Goal-Based Configuration Guide

## Overview

The goal-based configuration feature allows users to select their primary optimization objective for the audit, which customizes the analysis and recommendations to best achieve their specific goals.

## Implementation Details

### Components Created

1. **GoalSelection Component** (`/components/audits/goal-selection.tsx`)
   - Visual goal selection interface with icons and benefits
   - 5 goal options: Profitability, Growth, Launch, Defense, Portfolio
   - Interactive hover states showing detailed benefits
   - Responsive grid layout

2. **AuditCreationWizard Component** (`/components/audits/audit-creation-wizard.tsx`)
   - Multi-step wizard flow: Details → Upload → Goal → Processing
   - Step indicator with visual progress
   - Separated goal selection into distinct step after file upload
   - Maintains state across steps

3. **AuditDetailView Component** (`/components/audits/audit-detail-view.tsx`)
   - Enhanced audit detail page with prominent goal display
   - Ability to change goal before analysis starts
   - Visual goal indicator with appropriate colors/icons
   - Start analysis button when files are ready

4. **GoalIndicator Component** (`/components/audits/goal-indicator.tsx`)
   - Reusable goal display component
   - Compact and full variants
   - Tooltip support for goal impact explanation

### User Flow

1. User creates new audit with basic details
2. Uploads required files (minimum 2)
3. Selects optimization goal with clear visual options
4. Goal influences analysis and recommendations
5. Goal displayed throughout workflow
6. Can change goal before starting analysis

### Goal Types and Their Impact

- **Profitability**: Focus on improving margins and reducing wasted spend
- **Growth**: Expand market share while maintaining efficiency  
- **Launch**: Perfect strategy for new product launches
- **Defense**: Protect position from competitive threats
- **Portfolio**: Optimize performance across entire catalog

### Technical Integration

- Goal stored in audit record in database
- Goal passed to analysis engine for weighted recommendations
- Visual consistency with color-coded goals throughout UI
- Responsive design for mobile compatibility

## Acceptance Criteria Met

✅ Goal selection screen after file upload  
✅ Clear descriptions for each of 5 goals  
✅ Visual indicators (icons/colors) for goals  
✅ Goal influences recommendation ranking (prepared for backend)  
✅ Ability to change goal before analysis  
✅ Goal displayed throughout workflow  
✅ Help tooltips explaining impact  

## Next Steps

The goal selection UI is now complete and ready for integration with the recommendation engine (US-001-011) which will use the selected goal to weight and prioritize recommendations.