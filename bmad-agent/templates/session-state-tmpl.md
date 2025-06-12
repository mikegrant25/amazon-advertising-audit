---
type: template
id: session-state-tmpl
title: Session State Template
created_by: orchestrator
validates_with: []
phase: all
used_in_tasks: [core-dump]
produces: session-state
---

# Session State: [Project Name]

**Session ID**: [Timestamp or unique identifier]  
**Date**: [Current date]  
**Phase**: [Discovery/Design/Implementation/Testing/Deployment]

## BMAD Session Context

### Active Persona
**Current Persona**: [analyst|pm|architect|designer|developer|devops|qa|data-engineer|orchestrator]
**Persona File**: `bmad-agent/personas/[persona].md`

### Current Workflow
**Active Task**: [create-prd|create-architecture|implement-story|etc.]
**Task File**: `bmad-agent/tasks/[task].md`
**Workflow Position**: [Brief description of where within the persona's process we stopped]

### Pending Handoffs
```yaml
pending_handoffs:
  - to: [target-persona]
    context: "[Brief context for transition]"
    deliverables: ["[artifact-1.md]", "[artifact-2.md]"]
    next_action: "[recommended-task]"
```

### Multi-Persona Coordination
**Coordination Mode**: [single-persona|multi-persona|orchestrated]
**Feature Complexity**: [simple|complex|epic-level]

```yaml
coordination_state:
  personas_involved: ["analyst", "pm", "architect"]
  completed_contributions:
    - persona: analyst
      deliverable: "research-findings.md"
      status: complete
    - persona: pm
      deliverable: "prd.md"
      status: in-progress
  blocked_dependencies: []
  integration_points:
    - description: "Architecture must align with PRD requirements"
      status: pending
```

## Traditional Context

### What We're Working On
[Brief description of current focus area]

### Last Completed
[What was finished in the previous session]

### Next Priority
[What should be tackled next]

## Key Decisions Made

### Architecture Decisions
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

### Technology Choices
- [Choice 1]: [Why selected]
- [Choice 2]: [Why selected]

### Design Decisions
- [Pattern 1]: [Why chosen]
- [Pattern 2]: [Why chosen]

## Active Work Items

### In Progress
- [ ] [Task/Story ID]: [Brief description] - [Status/Blockers]
- [ ] [Task/Story ID]: [Brief description] - [Status/Blockers]

### Ready to Start
- [ ] [Task/Story ID]: [Brief description]
- [ ] [Task/Story ID]: [Brief description]

### Blocked
- [ ] [Task/Story ID]: [Brief description] - [Blocker reason]

## Important Information

### API Endpoints
[Key endpoints developed/modified this session]

### Database Changes
[Schema modifications, migrations needed]

### Configuration
[Environment variables, settings changed]

### Known Issues
- [Issue 1]: [Description and impact]
- [Issue 2]: [Description and impact]

## File Changes

### Created
- `path/to/file.ext` - [Purpose]

### Modified
- `path/to/file.ext` - [What changed]

### Deleted
- `path/to/file.ext` - [Why removed]

## Testing Status

### Tests Written
- [Test area]: [Coverage/status]

### Tests Failing
- [Test name]: [Failure reason]

### Manual Testing Needed
- [Feature]: [What to verify]

## Dependencies & Integration

### External Services
- [Service]: [Integration status]

### Libraries Added
- [Library]: [Version] - [Purpose]

### API Changes
- [Endpoint]: [Change description]

## Questions & Blockers

### Unresolved Questions
- [ ] [Question needing answer]
- [ ] [Decision pending]

### Technical Blockers
- [Blocker]: [What's needed to resolve]

### Business Blockers
- [Blocker]: [Who can resolve]

## Session Notes
[Free-form notes about important context, gotchas, or reminders]

## Handoff Instructions

### To Continue This Work
1. [Step 1 to resume]
2. [Step 2 to resume]
3. [Important context to know]

### Environment Setup
[Any special setup needed to continue]

### Credentials/Access
[What access is needed - do not store actual credentials]

## Next Session Checklist

### Must Do First
- [ ] [Critical task]
- [ ] [Prerequisite for other work]

### Should Complete
- [ ] [Important but not blocking]
- [ ] [Would unblock others]

### Nice to Have
- [ ] [If time permits]

---

## Session Metrics

- **Started**: [Time]
- **Ended**: [Time]
- **Duration**: [Hours]
- **Velocity**: [Stories/points completed]

## Links & References

### Documentation
- [Link to relevant docs]

### Related Sessions
- [Previous session]: [Link/ID]
- [Related session]: [Link/ID]

### External Resources
- [Useful reference]: [URL]

---
*This session state should be committed to the repository to maintain continuity across sessions.*