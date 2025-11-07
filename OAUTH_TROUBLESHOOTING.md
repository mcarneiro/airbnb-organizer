# Google OAuth Troubleshooting Guide

If you're getting an "Access Blocked" or authorization error, follow these steps to fix it.

## Quick Fix (Most Common Issue)

The most common cause is that your app is in **Testing mode** but your email isn't added as a test user.

### Solution 1: Add Test User (Recommended for personal use)

1. Go to [Google Cloud Console - OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll down to **"Test users"** section
3. Click **"ADD USERS"**
4. Enter your Gmail or Google Workspace email address
5. Click **"Save"**
6. Return to the app and click **"Sign in with Google"** again

### Solution 2: Publish the App (For multiple users)

1. Go to [Google Cloud Console - OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Click **"PUBLISH APP"**
3. Confirm the action
4. Your app will show as "unverified" but will work for any Google user

**Note:** For personal use, you don't need to go through Google's verification process. The app will show a warning that it's "unverified," but you can click "Advanced" → "Go to [App Name] (unsafe)" to proceed.

## Complete OAuth Setup Checklist

### 1. OAuth Consent Screen Configuration

✅ **App Information:**
- App name: `Airbnb Organizer` (or your choice)
- User support email: Your email
- Developer contact email: Your email

✅ **Scopes:**
- Must include: `https://www.googleapis.com/auth/spreadsheets`
- Description: "See, edit, create, and delete all your Google Sheets spreadsheets"

✅ **Publishing Status:**
- Either "Testing" with your email added as test user
- OR "In Production" (published)

✅ **Test Users (if in Testing mode):**
- Your Gmail/Google Workspace email must be listed

### 2. OAuth Client ID Configuration

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Click the edit icon (pencil)

✅ **Authorized JavaScript origins:**
```
http://localhost:5173
```

✅ **Authorized redirect URIs:**
These are optional for JavaScript origins, but if you have them:
```
http://localhost:5173
http://localhost:5173/
```

### 3. Environment Variable Configuration

Check your `.env` file:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

✅ Client ID should end with `.apps.googleusercontent.com`
✅ No quotes around the value
✅ File is named exactly `.env` (not `.env.local` or `.env.example`)

### 4. Enable Required APIs

1. Go to [Google Cloud Console - API Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Sheets API"
3. Make sure it shows **"API Enabled"** (green checkmark)

If not enabled:
- Click "Enable API"
- Wait a few seconds for it to activate

## Common Error Messages

### "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen is not properly configured or scopes are missing

**Fix:**
1. Go to OAuth consent screen
2. Check that the scope `../auth/spreadsheets` is added
3. Save and try again

### "Access blocked: [App Name] has not completed the Google verification process"

**Cause:** App is in production but not verified, and user isn't a test user

**Fix:**
1. Go to OAuth consent screen
2. Switch to "Testing" mode
3. Add your email as a test user

**OR** continue with the unverified app:
- Click "Advanced" on the warning screen
- Click "Go to [App Name] (unsafe)"

### "redirect_uri_mismatch"

**Cause:** The redirect URI doesn't match what's configured

**Fix:**
1. Go to OAuth Client ID settings
2. Add `http://localhost:5173` to Authorized JavaScript origins
3. Make sure you're accessing the app from exactly `http://localhost:5173`

### "idpiframe_initialization_failed"

**Cause:** Third-party cookies are blocked or privacy settings are too strict

**Fix:**
1. Enable third-party cookies in your browser
2. Or try in an incognito/private window
3. Or try a different browser

### Pop-up Blocked

**Cause:** Browser is blocking the OAuth pop-up window

**Fix:**
1. Look for a pop-up blocked icon in your browser's address bar
2. Click it and select "Always allow pop-ups from localhost"
3. Try signing in again

## Testing Your Configuration

### Step 1: Verify Environment Variables

Open browser console (F12) and run:
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
```

Should show your Client ID. If it shows `undefined`, check your `.env` file.

### Step 2: Check OAuth Initialization

Look for these logs in the browser console:
- ✅ No errors about "gapi is not defined"
- ✅ No errors about "Client ID not configured"

### Step 3: Test Sign-In

1. Click "Sign in with Google"
2. Check browser console for errors
3. Common error keywords to look for:
   - `popup_closed_by_user` - You closed the pop-up (try again)
   - `access_denied` - Need to add test user or publish app
   - `invalid_client` - Check Client ID in .env file
   - `redirect_uri_mismatch` - Check authorized origins

## Still Having Issues?

### 1. Clear Browser Cache

```bash
# Chrome/Edge DevTools
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
```

### 2. Check Browser Console

Open browser console (F12) and look for error messages. Common patterns:

- Red errors starting with `gapi`
- Errors mentioning `auth2`
- Network errors to `accounts.google.com`

### 3. Verify Project Settings

Go to [Google Cloud Console Dashboard](https://console.cloud.google.com/):
1. Make sure you're in the correct project (check project name in top bar)
2. Verify Google Sheets API is enabled
3. Check that OAuth credentials exist

### 4. Create a New OAuth Client

If nothing works, create a fresh OAuth Client ID:

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Authorized JavaScript origins: `http://localhost:5173`
5. Click "Create"
6. Copy the new Client ID
7. Update your `.env` file
8. Restart the dev server (`npm run dev`)

## For Production Deployment

When deploying to production (e.g., Vercel, Netlify):

1. Add your production domain to Authorized JavaScript origins:
   ```
   https://your-domain.com
   ```

2. Update environment variable on your hosting platform:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

3. If using a different domain for staging, add that too:
   ```
   https://your-domain.com
   https://staging.your-domain.com
   ```

## Security Notes

- **Client ID is not a secret** - It's used in client-side JavaScript and is public
- **Never expose Client Secret** - This app doesn't use Client Secret, only Client ID
- **OAuth token stays in browser** - Data never goes through a backend server
- **Scopes are limited** - App only requests access to Google Sheets, nothing else

## Need More Help?

1. Check [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
2. Review [Google Sheets API Guides](https://developers.google.com/sheets/api/guides/concepts)
3. Open an issue on GitHub with:
   - Error message from browser console
   - Screenshots of OAuth consent screen configuration
   - Steps you've already tried
