# DNS Resolution Fix for clerk.audit.verexiq.com

## The Issue
Your browser cannot resolve `clerk.audit.verexiq.com` even though the DNS record is properly configured globally.

## Immediate Solutions

### Option 1: Force DNS Update (macOS)
```bash
# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Test resolution
dig clerk.audit.verexiq.com
```

### Option 2: Add to Hosts File (Temporary)
Add this line to `/etc/hosts`:
```
104.18.34.146 clerk.audit.verexiq.com
```

To edit:
```bash
sudo nano /etc/hosts
# Add the line above
# Save with Ctrl+X, then Y, then Enter
```

### Option 3: Change DNS Server
1. System Preferences → Network → Advanced → DNS
2. Add Google DNS: 8.8.8.8 and 8.8.4.4
3. Apply changes

### Option 4: Test from Different Network
- Use your phone on cellular data
- Try a different WiFi network
- Use a VPN

## Verification
Once DNS resolves, you should be able to:
1. Run: `curl -I https://clerk.audit.verexiq.com`
2. Visit: https://audit.verexiq.com/sign-up without errors

## Long-term Solution
The DNS will propagate naturally within 1-2 hours. The above are just temporary fixes to unblock you immediately.