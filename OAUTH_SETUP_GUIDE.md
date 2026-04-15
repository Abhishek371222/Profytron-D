# OAuth Setup Guide for Profytron

## Issue: "redirect_uri_mismatch" Error

If you're seeing "Error 400: redirect_uri_mismatch" when trying to sign up or login with Google, follow these steps to configure OAuth properly.

---

## Step 1: Configure Google OAuth in Supabase Console

### 1.1 Access Your Supabase Project
- Go to [https://app.supabase.com](https://app.supabase.com)
- Sign in with your account
- Select your **Profytron** project (Project ID: `nghlhhsdtewrchdeyean`)

### 1.2 Navigate to Authentication Providers
- In the left sidebar, go to **Authentication** > **Providers**
- Find and click on **Google**

### 1.3 Enable Google OAuth
If not already enabled:
- Toggle **Enable Google** to ON
- Copy your **Client ID** from Google Cloud Console (see Step 2 if you don't have it)

### 1.4 Add Redirect URIs
In the **Authorized redirect URIs** section, make sure these URLs are added:

**For Development (Local):**
```
http://localhost:3000/auth/callback
```

**For Staging:**
```
https://staging.profytron.com/auth/callback
```

**For Production:**
```
https://profytron.com/auth/callback
```

> ⚠️ **Important:** Each redirect URI must match EXACTLY, including the protocol (http vs https) and path.

---

## Step 2: Verify Google Cloud OAuth Credentials

### 2.1 Access Google Cloud Console
- Go to [https://console.cloud.google.com](https://console.cloud.google.com)
- Select your **Profytron** project

### 2.2 Navigate to OAuth Credentials
- Go to **APIs & Services** > **Credentials**
- Find your **OAuth 2.0 Client IDs** (type: Web application)
- Click on the client ID to edit

### 2.3 Add Authorized Redirect URIs
Under **Authorized redirect URIs**, add:

```
http://localhost:3000/auth/callback
https://nghlhhsdtewrchdeyean.supabase.co/auth/v1/callback
https://staging.profytron.com/auth/callback
https://profytron.com/auth/callback
```

> **Note:** Supabase uses a special callback URL at your Supabase domain. This is automatically handled by Supabase.

### 2.4 Save Changes
- Click **Create** (if new) or **Save** (if existing)
- Copy the **Client ID** and **Client Secret**

---

## Step 3: Update Supabase with Google Credentials

### 3.1 Go to Supabase Authentication Settings
- In Supabase console, go to **Authentication** > **Providers** > **Google**

### 3.2 Enter Credentials
- **Client ID:** Paste the Client ID from Google Cloud Console
- **Client Secret:** Paste the Client Secret from Google Cloud Console

### 3.3 Save
- Click **Save configuration**

---

## Step 4: Test the OAuth Flow

### 4.1 Open Your App
- Go to [http://localhost:3000/register](http://localhost:3000/register) (or login page)

### 4.2 Click "Google" Button
- The Google login window should open
- If you see the redirect_uri_mismatch error again, the redirect URI wasn't saved properly
- Go back to Step 3 and verify the configuration

### 4.3 Success
- After Google authentication, you should be redirected to `/auth/callback`
- The page will exchange the OAuth code for a session
- You'll be redirected to `/onboarding` (for signup flow)

---

## Step 5: Configure GitHub OAuth (Optional)

The same process applies to GitHub OAuth:

### 5.1 Create GitHub OAuth App
- Go to [https://github.com/settings/developers](https://github.com/settings/developers)
- Click **New OAuth App**
- **Application Name:** Profytron
- **Homepage URL:** `http://localhost:3000` (or your production URL)
- **Authorization callback URL:** `http://localhost:3000/auth/callback`

### 5.2 Add to Supabase
- In Supabase console, go to **Authentication** > **Providers** > **GitHub**
- Enable GitHub
- Enter the **Client ID** and **Client Secret** from GitHub
- Save

---

## Common Issues & Solutions

### Issue: Still getting redirect_uri_mismatch after setup

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Incognito/Private browsing mode
3. Wait 2-3 minutes for Supabase to sync changes
4. Verify uppercase/lowercase - URLs are case-sensitive
5. Verify protocol - `http://` vs `https://` matters

### Issue: Stuck on /auth/callback page

**Solutions:**
1. Check browser console for errors (F12 > Console tab)
2. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
3. Verify `/auth/callback` page exists at `apps/web/src/app/(public)/auth/callback/page.tsx`

### Issue: Can sign in with Google but can't sign up

**Solutions:**
1. Check that user doesn't already exist with that email
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
3. Check if your Supabase auth is in development mode (disable JWT expiry for testing)

---

## Environment Variables

Make sure these are set in `apps/web/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nghlhhsdtewrchdeyean.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Troubleshooting Checklist

- [ ] Google OAuth Client ID and Secret are entered in Supabase
- [ ] `http://localhost:3000/auth/callback` is in the Authorized redirect URIs
- [ ] Redirect URI matches EXACTLY (case-sensitive, protocol matters)
- [ ] Browser cache is cleared
- [ ] Environment variables are set correctly
- [ ] Web app is running on `http://localhost:3000`
- [ ] `/auth/callback` page exists and is accessible
- [ ] Supabase backend is reachable (test with curl or browser)

---

## Need Help?

1. **Supabase Docs:** [https://supabase.com/docs/guides/auth/social-login/auth-google](https://supabase.com/docs/guides/auth/social-login/auth-google)
2. **Google OAuth Docs:** [https://developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
3. **Check Service Status:** [https://status.supabase.com](https://status.supabase.com)
