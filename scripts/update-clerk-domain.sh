#!/bin/bash

# Update Clerk instance domain to production URL
# Replace YOUR_CLERK_SECRET_KEY with your actual production secret key

CLERK_SECRET_KEY="YOUR_CLERK_SECRET_KEY"
PRODUCTION_URL="https://audit.verexiq.com"

curl -XPOST \
  -H "Authorization: Bearer ${CLERK_SECRET_KEY}" \
  -H "Content-type: application/json" \
  -d "{\"home_url\": \"${PRODUCTION_URL}\"}" \
  'https://api.clerk.com/v1/instance/change_domain'

echo "Domain update request sent. Check response for success."