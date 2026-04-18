# Google OAuth Login Troubleshooting Guide

## Problem
User reports: "not able to login using google"

## Environment
- **Supabase Project**: nghlhhsdtewrchdeyean
- **Supabase URL**: https://nghlhhsdtewrchdeyean.supabase.co
- **Local Dev URL**: http://localhost:3000
- **Callback URL**: http://localhost:3000/auth/callback

## Step-by-Step Diagnostic & Fix

### Step 1: Check Supabase Google Provider Configuration ✅
1. Go to: https://app.supabase.com/project/nghlhhsdtewrchdeyean/auth/providers
2. Click on "Google" provider in the list
3. Verify it's **ENABLED** (toggle should be ON/green)
4. If disabled, click the toggle to enable it
5. **IMPORTANT**: You need Google OAuth 2.0 credentials to enable it

### Step 2: Configure Google Cloud OAuth 2.0 Credentials
1. Go to: https://console.cloud.google.com/
2. Create or select project: "profytron-44bdc" (from NEXT_PUBLIC_FIREBASE_PROJECT_ID)
3. Navigate to: APIs & Services → Credentials
4. Create OAuth 2.0 credentials (Web Application type):
   - Application Name: "Profytron"
   - Authorized Redirect URIs **MUST include BOTH**:
     - `http://localhost:3000/auth/callback` (local development)
     - `https://nghlhhsdtewrchdeyean.supabase.co/auth/v1/callback` (production)
5. Copy the **Client ID** and **Client Secret**

### Step 3: Add Google Credentials to Supabase
1. Return to: https://app.supabase.com/project/nghlhhsdtewrchdeyean/auth/providers
2. Click on Google provider
3. Paste your Google OAuth credentials:
   - **Client ID**: [from Google Cloud Console]
   - **Client Secret**: [from Google Cloud Console]
4. Click "Save"
5. **WAIT 2 MINUTES** for Supabase to sync with Google

### Step 4: Test Google OAuth Login
1. Open browser DevTools: F12 → Console tab
2. Go to: http://localhost:3000/login
3. Click "Sign in with Google" button
4. **Expected Behavior**:
   - Browser opens Google login popup
   - After login, redirects to http://localhost:3000/auth/callback
   - Then redirects to http://localhost:3000/dashboard
5. **If it fails**, check DevTools Console for specific error message

### Step 5: Interpret Common Errors

#### Error: "The redirect URI provided does not match the configured Redirect URIs"
- **Cause**: Redirect URI not in Google Cloud Console
- **Fix**: Add both redirect URIs in Google Cloud → Credentials → Edit OAuth App

#### Error: "Client ID mismatch" or "invalid_client"
- **Cause**: Wrong Client ID/Secret or not enabled in Supabase
- **Fix**: 
  1. Verify credentials copied correctly (no spaces/typos)
  2. Re-enable Google provider in Supabase
  3. Wait 2 minutes and try again

#### Error: "redirect_uri_mismatch"
- **Cause**: Callback URL doesn't match exactly
- **Fix**: 
  - Make sure callback URL includes `/auth/callback` exactly
  - Check for typos or extra slashes
  - Both URLs must be present in Google Console

#### Error: No redirect after clicking Google button
- **Cause**: Supabase provider not properly configured
- **Fix**: 
  1. Verify provider is ENABLED in Supabase
  2. Check that credentials are saved (look for green checkmark)
  3. Clear browser cache and cookies
  4. Try incognito/private mode

### Step 6: Fallback: Use Demo Login
If Google OAuth still doesn't work, use demo credentials for testing:
- **Email**: demo@profytron.com
- **Password**: Demo@123

This allows you to access the dashboard while fixing Google OAuth configuration.

## Code Configuration (Already In Place)
✅ Login component: `/apps/web/src/app/(public)/login/page.tsx`
  - OAuth handler implemented
  - Console logging enabled for debugging
  - Redirect URL correctly set

✅ Auth callback handler: `/apps/web/src/app/(public)/auth/callback/page.tsx`
  - Handles Supabase session exchange
  - Extracts user metadata (name, picture)
  - Syncs user to local API

✅ Supabase client: `/apps/web/src/lib/supabase.ts`
  - Configured with project URL and Anon Key
  - OAuth flow properly initialized

## Debugging with Browser Console
Open DevTools (F12) and look for logs with pattern:
```
[GOOGLE] Initiating OAuth flow...
[GOOGLE] Redirect URL: http://localhost:3000/auth/callback
[GOOGLE] OAuth flow initiated successfully
```

If you see errors, share them for more targeted troubleshooting.

## Quick Checklist
- [ ] Google provider ENABLED in Supabase console
- [ ] Google OAuth credentials obtained from Google Cloud Console
- [ ] Client ID and Secret added to Supabase
- [ ] Redirect URI includes both localhost AND production URLs
- [ ] 2 minutes waited for Supabase to sync
- [ ] Browser cache cleared
- [ ] Tested in incognito/private mode
- [ ] Checked browser console for errors (F12 → Console)
