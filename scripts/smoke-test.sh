#!/usr/bin/env bash
# FitPulse Deployment Smoke Test Script
# Usage: ./scripts/smoke-test.sh [TARGET_URL]

set -e

TARGET_URL="${1:-http://localhost:3000}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="smoke_${TIMESTAMP}@fitclub.com"
TEST_PASSWORD="SmokeTestPassword123!"

echo "========================================================="
echo "🔥 Running Post-Deployment Smoke Tests against: ${TARGET_URL}"
echo "========================================================="

# 1. Health Check Endpoint
echo "[CHECK 1/3] Testing GET ${TARGET_URL}/api/health-check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET_URL}/api/health-check" || echo "000")
if [ "$HEALTH_STATUS" -ne 200 ]; then
  echo "❌ [FAIL] Health check endpoint returned HTTP status: ${HEALTH_STATUS}"
  exit 1
fi
echo "✅ [PASS] Health check endpoint returned HTTP 200 OK"

# 2. Member Registration Endpoint
echo "[CHECK 2/3] Testing POST ${TARGET_URL}/api/auth/register (${TEST_EMAIL})..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"name\":\"Smoke Tester\",\"role\":\"member\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ne 201 ]; then
  echo "❌ [FAIL] Member registration returned HTTP ${HTTP_CODE}. Body: ${BODY}"
  exit 1
fi
echo "✅ [PASS] Member registration succeeded with HTTP 201 Created"

# 3. User Login & Authenticated Endpoint Check
echo "[CHECK 3/3] Testing POST ${TARGET_URL}/api/auth/login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

LOGIN_HTTP=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_HTTP" -ne 200 ]; then
  echo "❌ [FAIL] User login returned HTTP ${LOGIN_HTTP}. Body: ${LOGIN_BODY}"
  exit 1
fi
echo "✅ [PASS] User authentication verified successfully"

echo "========================================================="
echo "🎉 ALL POST-DEPLOYMENT SMOKE TESTS PASSED SUCCESSFULLY!"
echo "========================================================="
exit 0
