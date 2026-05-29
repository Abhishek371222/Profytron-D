#!/bin/bash
# OAuth Configuration Verification Script for Profytron

echo "🔍 Profytron OAuth Configuration Checker"
echo "======================================="
echo ""

# Check 1: Environment variables
echo "✅ Step 1: Checking Environment Variables..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL=" apps/web/.env.local; then
    echo "   ✓ NEXT_PUBLIC_SUPABASE_URL is set"
else
    echo "   ❌ NEXT_PUBLIC_SUPABASE_URL is MISSING"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" apps/web/.env.local; then
    echo "   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
else
    echo "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING"
fi
echo ""

# Check 2: Auth callback page exists
echo "✅ Step 2: Checking Auth Callback Page..."
if [ -f "apps/web/src/app/(public)/auth/callback/page.tsx" ]; then
    echo "   ✓ Auth callback page exists"
else
    echo "   ❌ Auth callback page is MISSING"
fi
echo ""

# Check 3: Frontend is accessible
echo "✅ Step 3: Checking Frontend Accessibility..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✓ Frontend is running on http://localhost:3000"
else
    echo "   ⚠️  Frontend returned status $FRONTEND_RESPONSE (should be 200)"
fi
echo ""

# Check 4: Backend is accessible
echo "✅ Step 4: Checking Backend Accessibility..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo "   ✓ Backend is running on http://localhost:4000"
else
    echo "   ⚠️  Backend returned status $BACKEND_RESPONSE (should be 200)"
fi
echo ""

echo "======================================="
echo "📋 Manual Configuration Checklist:"
echo "======================================="
echo ""
echo "To complete OAuth setup, visit:"
echo "1. https://app.supabase.com (your Supabase project)"
echo "2. Go to: Authentication > Providers > Google"
echo "3. Make sure these URLs are in 'Authorized redirect URIs':"
echo "   - http://localhost:3000/auth/callback"
echo "   - (and production URLs if deploying)"
echo ""
echo "Also check Google Cloud Console:"
echo "1. https://console.cloud.google.com"
echo "2. Go to: APIs & Services > Credentials"
echo "3. Edit your OAuth Client ID"
echo "4. Add to 'Authorized redirect URIs':"
echo "   - http://localhost:3000/auth/callback"
echo "   - https://nghlhhsdtewrchdeyean.supabase.co/auth/v1/callback"
echo ""
echo "======================================="
echo "✨ Setup complete? Try signing up now!"
echo "======================================="
