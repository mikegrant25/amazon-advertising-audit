# SOC 2 Shared Responsibility Model

## The Reality: You Still Need Your Own SOC 2

**Short Answer**: No, your vendors' SOC 2 certifications don't cover you. You need your own.

## Why Vendor SOC 2s Don't Cover You

### What Vendor SOC 2s Cover (Their Responsibility)
```yaml
Supabase SOC 2 Covers:
- Their database infrastructure security
- Their employee access to systems
- Their backup procedures
- Their data center physical security
- Their platform availability

Clerk SOC 2 Covers:
- Their authentication infrastructure
- Their user data protection
- Their API security
- Their internal processes

Railway SOC 2 Covers:
- Their deployment platform security
- Their container isolation
- Their network security
- Their operational procedures
```

### What YOU'RE Still Responsible For
```yaml
Your Application SOC 2 Covers:
- How YOU use these services
- YOUR application code security
- YOUR employee access controls
- YOUR data handling procedures
- YOUR customer data protection
- YOUR incident response
- YOUR business logic security
- YOUR API design and access controls
```

## Real-World Example

### Scenario: Data Breach
```
If customer data is exposed because:
- Supabase had a vulnerability → Supabase's SOC 2 applies ✓
- YOUR code had SQL injection → YOUR SOC 2 needed ✗
- YOU misconfigured RLS policies → YOUR SOC 2 needed ✗
- YOUR employee leaked credentials → YOUR SOC 2 needed ✗
```

### What Auditors Actually Check
```python
# They don't just ask "Does Supabase have SOC 2?"
# They ask:

audit_questions = [
    "How do YOU control access to customer data?",
    "Show YOUR password policies for employees",
    "Demonstrate YOUR change management process",
    "Prove YOUR security training program",
    "Document YOUR incident response procedures",
    "Show YOUR vendor management process",
    "Demonstrate YOUR backup testing",
    "Prove YOUR access reviews"
]
```

## The Shared Responsibility Breakdown

### Security Controls Mapping

| Control | Vendor Covers | You Must Cover |
|---------|--------------|----------------|
| Infrastructure Security | ✓ | Configuration of infrastructure |
| Physical Security | ✓ | N/A |
| Network Security | ✓ | Application firewall rules |
| Platform Patches | ✓ | Application patches |
| Platform Availability | ✓ | Application availability |
| Data Encryption at Rest | ✓ | Encryption key management |
| Platform Access Logs | ✓ | Application audit logs |
| Their Employee Access | ✓ | YOUR employee access |
| Their Incident Response | ✓ | YOUR incident response |

## What You Actually Need for SOC 2

### 1. Organizational Controls
```yaml
Required Regardless of Vendors:
- Information Security Policy
- Acceptable Use Policy  
- Incident Response Plan
- Business Continuity Plan
- Vendor Management Policy
- Change Management Process
- Employee Onboarding/Offboarding
- Security Awareness Training
```

### 2. Technical Controls You Own
```python
# Even with SOC 2 vendors, YOU must implement:

your_controls = {
    "access_control": {
        "employee_access_reviews": "Quarterly",
        "privilege_management": "Least privilege principle",
        "mfa_enforcement": "All employees",
        "password_policies": "Your standards"
    },
    "application_security": {
        "secure_coding": "OWASP guidelines",
        "code_reviews": "All changes",
        "vulnerability_scanning": "Your code",
        "penetration_testing": "Annual"
    },
    "data_protection": {
        "data_classification": "Your schema",
        "retention_policies": "Your requirements",
        "deletion_procedures": "Your process",
        "backup_testing": "Your validation"
    },
    "monitoring": {
        "application_logs": "Your logging",
        "security_monitoring": "Your alerts",
        "incident_detection": "Your rules",
        "performance_monitoring": "Your SLAs"
    }
}
```

### 3. Evidence Collection
```bash
# You need to prove YOUR controls work:
- Access review spreadsheets
- Training completion records
- Incident response test results
- Change approval documentation
- Security scan reports
- Penetration test results
- Policy acknowledgments
- Vendor assessment records
```

## The Good News: Vendor SOC 2s Help

### How They Actually Help
1. **Reduced Scope** - You don't audit the infrastructure layer
2. **Inherited Controls** - Some controls are partially covered
3. **Evidence** - You can reference their SOC 2s in your audit
4. **Trust** - Auditors trust certified vendors more

### Documentation You'll Need from Vendors
```yaml
For Your SOC 2 Audit:
- Current SOC 2 reports from all critical vendors
- Shared responsibility matrices
- SLAs and uptime guarantees
- Incident notification procedures
- Data processing agreements
```

## Cost & Effort Comparison

### Without SOC 2 Vendors
- Audit scope: 100+ controls
- Timeline: 9-12 months
- Cost: $50-100k
- Effort: Massive

### With SOC 2 Vendors (Your Situation)
- Audit scope: 60-80 controls
- Timeline: 3-6 months
- Cost: $25-50k
- Effort: Significant but manageable

## Practical Steps for Your SOC 2

### 1. Gap Assessment (Month 1)
```python
# Auditor will check:
gap_assessment = {
    "policies": check_all_required_policies(),
    "procedures": verify_documented_procedures(),
    "technical_controls": scan_your_implementation(),
    "evidence": review_last_3_months_data(),
    "training": check_employee_records()
}
```

### 2. Remediation (Months 2-3)
- Write missing policies
- Implement technical controls
- Start collecting evidence
- Train your team
- Document everything

### 3. Type I Audit (Month 4)
- Point-in-time assessment
- ~$15-25k cost
- 2-4 week process
- Gets you "SOC 2 Type I" status

### 4. Type II Preparation (Months 5-10)
- 6+ months of evidence
- Continuous monitoring
- Regular reviews
- Process maturity

### 5. Type II Audit (Month 11)
- Period of time assessment
- ~$25-35k cost
- 4-6 week process
- Annual renewal required

## Vendor SOC 2 Integration Strategy

### Smart Approach
```yaml
Do:
- Choose SOC 2 compliant vendors (you did! ✓)
- Get their current reports
- Map their controls to yours
- Reference them in your policies
- Include in vendor management

Don't:
- Assume you're covered
- Skip your own controls
- Ignore shared responsibilities
- Forget ongoing monitoring
- Miss renewal dates
```

### Your Vendor Assessment
```python
vendors_status = {
    "Supabase": {
        "soc2": True,
        "report_needed": True,
        "critical": True
    },
    "Clerk": {
        "soc2": True,  # Verify current status
        "report_needed": True,
        "critical": True
    },
    "Railway": {
        "soc2": "Check status",
        "report_needed": True,
        "critical": True
    },
    "Vercel": {
        "soc2": True,
        "report_needed": True,
        "critical": True
    },
    "Inngest": {
        "soc2": "Check status",
        "report_needed": False,  # Less critical
        "critical": False
    }
}
```

## The Bottom Line

**Customer Question**: "Are you SOC 2 compliant?"

**Wrong Answer**: "Yes, we use SOC 2 compliant vendors"

**Right Answer**: "Yes, we have our own SOC 2 Type II certification, and we additionally ensure all our critical infrastructure providers maintain their own SOC 2 compliance"

## Money-Saving Tips

1. **Start with Type I** - Faster, cheaper, opens doors
2. **Use a platform** - Vanta, Drata, or Secureframe (~$1k/month)
3. **Choose the right auditor** - Prescient, A-LIGN, or Schellman
4. **Automate evidence** - Connect your tools to compliance platform
5. **Don't over-scope** - Start with Security trust criteria only

---

## Summary

Your vendors' SOC 2s are like having a secure building (good foundation) but you still need to lock your own office door, manage your own keys, and train your own employees. Their compliance makes your compliance easier and cheaper, but doesn't eliminate the need for your own SOC 2 certification.

For enterprise sales, customers will explicitly ask for YOUR SOC 2 report, not your vendors'.

---
*Pro tip: Start collecting evidence now (access reviews, training records, incident logs) even before formal SOC 2 prep. It's much easier than trying to recreate 6 months of history later.*