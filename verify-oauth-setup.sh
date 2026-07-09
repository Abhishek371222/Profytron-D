#!/bin/bash
# OAuth Configuration Verification Script for Profytron

EXPECTED_GOOGLE_CLIENT_ID="507164728830-r5meeu6mocu22lhmbu4lk83lbadlg7j8.apps.googleusercontent.com"
SUPABASE_PROJECT_REF="latlennltsqzjveovldf"
SUPABASE_CALLBACK="https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback"

echo "🔍 Profytron OAuth Configuration Checker"
echo "======================================="
echo ""

# Check 1: Web Supabase env (social login UI — no GOOGLE_CLIENT_ID on web)
echo "✅ Step 1: Checking Web Environment (apps/web/.env.local)..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL=" apps/web/.env.local 2>/dev/null; then
    echo "   ✓ NEXT_PUBLIC_SUPABASE_URL is set"
else
    echo "   ❌ NEXT_PUBLIC_SUPABASE_URL is MISSING"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=\|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=" apps/web/.env.local 2>/dev/null; then
    echo "   ✓ Supabase anon/publishable key is set"
else
    echo "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING"
fi
echo "   ℹ  Web app does NOT need GOOGLE_CLIENT_ID — OAuth runs through Supabase"
echo ""

# Check 2: API Google OAuth credentials (legacy NestJS + Render sync)
echo "✅ Step 2: Checking API Google Credentials..."
if grep -q "GOOGLE_CLIENT_ID=${EXPECTED_GOOGLE_CLIENT_ID}" apps/api/.env 2>/dev/null; then
    echo "   ✓ GOOGLE_CLIENT_ID matches expected value in apps/api/.env"
elif grep -q "GOOGLE_CLIENT_ID=" apps/api/.env 2>/dev/null; then
    echo "   ❌ GOOGLE_CLIENT_ID in apps/api/.env does NOT match expected value"
    echo "      Expected: ${EXPECTED_GOOGLE_CLIENT_ID}"
else
    echo "   ❌ GOOGLE_CLIENT_ID is MISSING in apps/api/.env"
fi

if grep -qE "^GOOGLE_CLIENT_SECRET=.+$" apps/api/.env 2>/dev/null; then
    echo "   ✓ GOOGLE_CLIENT_SECRET is set in apps/api/.env"
else
    echo "   ❌ GOOGLE_CLIENT_SECRET is MISSING in apps/api/.env"
fi

if [ -f "render.env" ]; then
    if grep -q "GOOGLE_CLIENT_ID=${EXPECTED_GOOGLE_CLIENT_ID}" render.env 2>/dev/null; then
        echo "   ✓ GOOGLE_CLIENT_ID matches in render.env (paste into Render Dashboard)"
    else
        echo "   ❌ GOOGLE_CLIENT_ID missing or wrong in render.env"
    fi
    if grep -qE "^GOOGLE_CLIENT_SECRET=.+$" render.env 2>/dev/null; then
        echo "   ✓ GOOGLE_CLIENT_SECRET is set in render.env"
    else
        echo "   ❌ GOOGLE_CLIENT_SECRET is MISSING in render.env"
    fi
else
    echo "   ⚠️  render.env not found (generate from apps/api/.env for Render deploy)"
fi
echo ""

# Check 3: Supabase keys for POST /auth/supabase sync
echo "✅ Step 3: Checking Supabase Backend Sync (POST /auth/supabase)..."
if grep -q "SUPABASE_URL=https://${SUPABASE_PROJECT_REF}.supabase.co" apps/api/.env 2>/dev/null; then
    echo "   ✓ SUPABASE_URL points to project ${SUPABASE_PROJECT_REF}"
else
    echo "   ❌ SUPABASE_URL missing or wrong in apps/api/.env"
fi
if grep -qE "^SUPABASE_SERVICE_ROLE_KEY=.+$" apps/api/.env 2>/dev/null; then
    echo "   ✓ SUPABASE_SERVICE_ROLE_KEY is set (required for token verification)"
else
    echo "   ❌ SUPABASE_SERVICE_ROLE_KEY is MISSING in apps/api/.env"
fi
echo ""

# Check 4: Auth callback page exists
echo "✅ Step 4: Checking Auth Callback Page..."
if [ -f "apps/web/src/app/(public)/auth/callback/page.tsx" ]; then
    echo "   ✓ Auth callback page exists"
else
    echo "   ❌ Auth callback page is MISSING"
fi
echo ""

# Check 5: Frontend is accessible
echo "✅ Step 5: Checking Frontend Accessibility..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✓ Frontend is running on http://localhost:3000"
else
    echo "   ⚠️  Frontend returned status $FRONTEND_RESPONSE (should be 200)"
fi
echo ""

# Check 6: Backend is accessible
echo "✅ Step 6: Checking Backend Accessibility..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null || echo "000")
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo "   ✓ Backend is running on http://localhost:4000"
else
    echo "   ⚠️  Backend returned status $BACKEND_RESPONSE (should be 200)"
fi
echo ""

echo "======================================="
echo "📋 Manual Configuration Checklist"
echo "======================================="
echo ""
echo "PRIMARY FLOW: Login/Register → Supabase OAuth → /auth/callback → POST /auth/supabase"
echo "(NOT the legacy /api/auth/google or /v1/auth/google routes)"
echo ""
echo "── Supabase Dashboard (REQUIRED) ──"
echo "Project: https://app.supabase.com/project/${SUPABASE_PROJECT_REF}"
echo ""
echo "1. Authentication → Providers → Google"
echo "   • Enable Google provider"
echo "   • Client ID (paste exactly):"
echo "     ${EXPECTED_GOOGLE_CLIENT_ID}"
echo "   • Client Secret: same value as GOOGLE_CLIENT_SECRET in apps/api/.env / render.env"
echo ""
echo "2. Authentication → URL Configuration"
echo "   • Site URL: https://www.profytron.com"
echo "   • Redirect URLs (add all):"
echo "     - http://localhost:3000/auth/callback"
echo "     - https://www.profytron.com/auth/callback"
echo "     - https://profytron.com/auth/callback"
echo ""
echo "── Google Cloud Console (REQUIRED) ──"
echo "https://console.cloud.google.com/apis/credentials"
echo "OAuth 2.0 Client → Authorized redirect URIs:"
echo "   • ${SUPABASE_CALLBACK}"
echo "(Optional legacy NestJS route only:)"
echo "   • https://profytron-api.onrender.com/v1/auth/google/callback"
echo ""
echo "── Render (profytron-api) ──"
echo "Ensure these env vars are set (values from render.env):"
echo "   • GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (legacy NestJS OAuth)"
echo "   • SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (POST /auth/supabase sync)"
echo ""
echo "======================================="
echo "✨ Setup complete? Try signing in at /login with Google"
echo "======================================="
