@echo off
REM OAuth Configuration Verification Script for Profytron (Windows)
setlocal EnableDelayedExpansion

set "EXPECTED_GOOGLE_CLIENT_ID=507164728830-r5meeu6mocu22lhmbu4lk83lbadlg7j8.apps.googleusercontent.com"
set "SUPABASE_PROJECT_REF=latlennltsqzjveovldf"
set "SUPABASE_CALLBACK=https://%SUPABASE_PROJECT_REF%.supabase.co/auth/v1/callback"

echo.
echo ============================================
echo Profytron OAuth Configuration Checker
echo ============================================
echo.

REM Step 1: Web Supabase env
echo Step 1: Checking Web Environment (apps\web\.env.local)...
type apps\web\.env.local 2>nul | find "NEXT_PUBLIC_SUPABASE_URL" >nul
if %errorlevel% equ 0 (
    echo    [OK] NEXT_PUBLIC_SUPABASE_URL is set
) else (
    echo    [FAIL] NEXT_PUBLIC_SUPABASE_URL is MISSING
)

type apps\web\.env.local 2>nul | find "NEXT_PUBLIC_SUPABASE_ANON_KEY" >nul
if %errorlevel% equ 0 (
    echo    [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
) else (
    type apps\web\.env.local 2>nul | find "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" >nul
    if !errorlevel! equ 0 (
        echo    [OK] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set
    ) else (
        echo    [FAIL] Supabase anon/publishable key is MISSING
    )
)
echo    [INFO] Web app does NOT need GOOGLE_CLIENT_ID — OAuth runs through Supabase
echo.

REM Step 2: API Google credentials
echo Step 2: Checking API Google Credentials...
type apps\api\.env 2>nul | find "GOOGLE_CLIENT_ID=%EXPECTED_GOOGLE_CLIENT_ID%" >nul
if %errorlevel% equ 0 (
    echo    [OK] GOOGLE_CLIENT_ID matches expected value in apps\api\.env
) else (
    type apps\api\.env 2>nul | find "GOOGLE_CLIENT_ID=" >nul
    if %errorlevel% equ 0 (
        echo    [FAIL] GOOGLE_CLIENT_ID in apps\api\.env does NOT match expected value
        echo           Expected: %EXPECTED_GOOGLE_CLIENT_ID%
    ) else (
        echo    [FAIL] GOOGLE_CLIENT_ID is MISSING in apps\api\.env
    )
)

type apps\api\.env 2>nul | find "GOOGLE_CLIENT_SECRET=" >nul
if %errorlevel% equ 0 (
    echo    [OK] GOOGLE_CLIENT_SECRET is set in apps\api\.env
) else (
    echo    [FAIL] GOOGLE_CLIENT_SECRET is MISSING in apps\api\.env
)

if exist render.env (
    type render.env 2>nul | find "GOOGLE_CLIENT_ID=%EXPECTED_GOOGLE_CLIENT_ID%" >nul
    if %errorlevel% equ 0 (
        echo    [OK] GOOGLE_CLIENT_ID matches in render.env
    ) else (
        echo    [FAIL] GOOGLE_CLIENT_ID missing or wrong in render.env
    )
    type render.env 2>nul | find "GOOGLE_CLIENT_SECRET=" >nul
    if %errorlevel% equ 0 (
        echo    [OK] GOOGLE_CLIENT_SECRET is set in render.env
    ) else (
        echo    [FAIL] GOOGLE_CLIENT_SECRET is MISSING in render.env
    )
) else (
    echo    [WARN] render.env not found
)
echo.

REM Step 3: Supabase backend sync
echo Step 3: Checking Supabase Backend Sync (POST /auth/supabase)...
type apps\api\.env 2>nul | find "SUPABASE_URL=https://%SUPABASE_PROJECT_REF%.supabase.co" >nul
if %errorlevel% equ 0 (
    echo    [OK] SUPABASE_URL points to project %SUPABASE_PROJECT_REF%
) else (
    echo    [FAIL] SUPABASE_URL missing or wrong in apps\api\.env
)
type apps\api\.env 2>nul | find "SUPABASE_SERVICE_ROLE_KEY=" >nul
if %errorlevel% equ 0 (
    echo    [OK] SUPABASE_SERVICE_ROLE_KEY is set
) else (
    echo    [FAIL] SUPABASE_SERVICE_ROLE_KEY is MISSING
)
echo.

REM Step 4: Auth callback page
echo Step 4: Checking Auth Callback Page...
if exist "apps\web\src\app\(public)\auth\callback\page.tsx" (
    echo    [OK] Auth callback page exists
) else (
    echo    [FAIL] Auth callback page is MISSING
)
echo.

echo ============================================
echo REQUIRED: Manual OAuth Configuration
echo ============================================
echo.
echo PRIMARY FLOW: Login/Register -^> Supabase OAuth -^> /auth/callback -^> POST /auth/supabase
echo (NOT the legacy /api/auth/google or /v1/auth/google routes)
echo.
echo -- Supabase Dashboard (REQUIRED) --
echo Project: https://app.supabase.com/project/%SUPABASE_PROJECT_REF%
echo.
echo 1. Authentication ^> Providers ^> Google
echo    - Enable Google provider
echo    - Client ID (paste exactly^):
echo      %EXPECTED_GOOGLE_CLIENT_ID%
echo    - Client Secret: same as GOOGLE_CLIENT_SECRET in apps\api\.env / render.env
echo.
echo 2. Authentication ^> URL Configuration
echo    - Site URL: https://www.profytron.com
echo    - Redirect URLs:
echo      * http://localhost:3000/auth/callback
echo      * https://www.profytron.com/auth/callback
echo      * https://profytron.com/auth/callback
echo.
echo -- Google Cloud Console (REQUIRED) --
echo https://console.cloud.google.com/apis/credentials
echo OAuth 2.0 Client -^> Authorized redirect URIs:
echo    * %SUPABASE_CALLBACK%
echo Optional legacy NestJS only:
echo    * https://profytron-api.onrender.com/v1/auth/google/callback
echo.
echo -- Render (profytron-api) --
echo Set from render.env:
echo    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
echo    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
echo.
echo ============================================
echo Useful Links:
echo ============================================
echo Supabase OAuth Guide:
echo   https://supabase.com/docs/guides/auth/social-login/auth-google
echo Supabase Project:
echo   https://app.supabase.com/project/%SUPABASE_PROJECT_REF%
echo ============================================
