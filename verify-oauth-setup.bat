@echo off
REM OAuth Configuration Verification Script for Profytron (Windows)

echo.
echo ============================================
echo Profytron OAuth Configuration Checker
echo ============================================
echo.

REM Check 1: Environment variables
echo Step 1: Checking Environment Variables...
type apps\web\.env.local | find "NEXT_PUBLIC_SUPABASE_URL" >nul
if %errorlevel% equ 0 (
    echo    [OK] NEXT_PUBLIC_SUPABASE_URL is set
) else (
    echo    [FAIL] NEXT_PUBLIC_SUPABASE_URL is MISSING
)

type apps\web\.env.local | find "NEXT_PUBLIC_SUPABASE_ANON_KEY" >nul
if %errorlevel% equ 0 (
    echo    [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
) else (
    echo    [FAIL] NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING
)
echo.

REM Check 2: Auth callback page exists
echo Step 2: Checking Auth Callback Page...
if exist "apps\web\src\app\(public)\auth\callback\page.tsx" (
    echo    [OK] Auth callback page exists
) else (
    echo    [FAIL] Auth callback page is MISSING
)
echo.

REM Check 3: Frontend is accessible
echo Step 3: Checking Frontend...
for /f %%i in ('powershell -Command "try { (Invoke-WebRequest -UseBasicParsing http://localhost:3000 -TimeoutSec 2 -ErrorAction Stop).StatusCode } catch { '999' }"') do set FRONTEND_RESPONSE=%%i
if "%FRONTEND_RESPONSE%"=="200" (
    echo    [OK] Frontend is running on http://localhost:3000
) else (
    echo    [WARNING] Frontend returned status %FRONTEND_RESPONSE% ^(should be 200^)
)
echo.

REM Check 4: Backend is accessible
echo Step 4: Checking Backend...
for /f %%i in ('powershell -Command "try { (Invoke-WebRequest -UseBasicParsing http://localhost:4000/health -TimeoutSec 2 -ErrorAction Stop).StatusCode } catch { '999' }"') do set BACKEND_RESPONSE=%%i
if "%BACKEND_RESPONSE%"=="200" (
    echo    [OK] Backend is running on http://localhost:4000
) else (
    echo    [WARNING] Backend returned status %BACKEND_RESPONSE% ^(should be 200^)
)
echo.

echo ============================================
echo REQUIRED: Manual OAuth Configuration
echo ============================================
echo.
echo You should have received the error:
echo   "Error 400: redirect_uri_mismatch"
echo.
echo This means you need to add the redirect URI to:
echo   1. Supabase Console
echo   2. Google Cloud Console
echo.
echo Follow these steps:
echo.
echo STEP 1: Supabase Configuration
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   1. Go to: https://app.supabase.com
echo   2. Log in with your account
echo   3. Select your PROJECT: nghlhhsdtewrchdeyean
echo   4. Go to: Authentication ^> Providers ^> Google
echo   5. Enable Google Provider if not already enabled
echo   6. Find: "Authorized redirect URIs" section
echo   7. ADD THIS URL (if not already there):
echo      ► http://localhost:3000/auth/callback
echo   8. SAVE
echo.
echo STEP 2: Google Cloud Console
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   1. Go to: https://console.cloud.google.com
echo   2. Select your PROJECT: profytron-44bdc
echo   3. Go to: APIs ^& Services ^> Credentials
echo   4. Find your OAuth 2.0 Client ID ^(Web application^)
echo   5. Click on it to EDIT
echo   6. Find: "Authorized redirect URIs" section
echo   7. ADD BOTH of these URLs (if not already there^):
echo      ► http://localhost:3000/auth/callback
echo      ► https://nghlhhsdtewrchdeyean.supabase.co/auth/v1/callback
echo   8. SAVE
echo.
echo STEP 3: Test the OAuth Flow
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   1. Open: http://localhost:3000/register
echo   2. Click the "Google" button
echo   3. You should be redirected to Google login
echo   4. After auth, you should be redirected back to the app
echo   5. If you still get redirect_uri_mismatch:
echo      - Clear browser cache (Ctrl+Shift+Delete)
echo      - Try incognito/private window
echo      - Wait 2-3 min for changes to sync
echo      - Check URLs are EXACTLY the same (case-sensitive!)
echo.
echo ============================================
echo Useful Links:
echo ============================================
echo.
echo Supabase OAuth Guide:
echo   https://supabase.com/docs/guides/auth/social-login/auth-google
echo.
echo Google OAuth Setup:
echo   https://developers.google.com/identity/protocols/oauth2
echo.
echo Supabase Project:
echo   https://app.supabase.com/project/nghlhhsdtewrchdeyean
echo.
echo Google Cloud Project:
echo   https://console.cloud.google.com/apis/credentials
echo.
echo ============================================
