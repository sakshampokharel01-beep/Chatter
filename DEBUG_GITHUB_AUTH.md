# Debug GitHub Authentication

## Issue: GitHub Sign-In Button Not Working

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and go to the Console tab. Look for any error messages when you click the GitHub button.

#### Common Error Messages and Solutions:

**1. `auth/operation-not-allowed`**
- **Problem**: GitHub sign-in is not enabled in Firebase Console
- **Solution**: 
  1. Go to https://console.firebase.google.com/project/chatapp-eb6e3/authentication/providers
  2. Click on "GitHub" 
  3. Toggle "Enable" to ON
  4. Make sure you saved the Client ID and Client Secret

**2. `auth/invalid-oauth-client-id` or `auth/configuration-not-found`**
- **Problem**: Client ID/Secret not properly configured in Firebase
- **Solution**:
  1. Go back to Firebase Console → Authentication → Sign-in method → GitHub
  2. Verify Client ID and Client Secret are correctly entered
  3. Click Save again

**3. `auth/unauthorized-domain`**
- **Problem**: Your domain is not authorized in Firebase
- **Solution**:
  1. Go to Firebase Console → Authentication → Settings → Authorized domains
  2. Add these domains:
     - `localhost` (for local testing)
     - `chatter-talk.vercel.app` (for production)
     - `chatapp-eb6e3.firebaseapp.com` (Firebase hosting)

**4. `auth/popup-blocked`**
- **Problem**: Browser is blocking the popup
- **Solution**: Allow popups for your site in browser settings

**5. GitHub OAuth Error: "The redirect_uri MUST match..."**
- **Problem**: Callback URL mismatch between GitHub and Firebase
- **Solution**: 
  1. Go to https://github.com/settings/developers
  2. Edit your OAuth App
  3. Make sure Authorization callback URL is EXACTLY:
     ```
     https://chatapp-eb6e3.firebaseapp.com/__/auth/handler
     ```

### Step 2: Verify Firebase Configuration

Check that your `.env` file has all required Firebase credentials:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=chatapp-eb6e3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chatapp-eb6e3
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Step 3: Verify GitHub OAuth App Settings

Go to https://github.com/settings/developers and check:

1. **Application name**: Can be anything
2. **Homepage URL**: `https://chatter-talk.vercel.app`
3. **Authorization callback URL**: `https://chatapp-eb6e3.firebaseapp.com/__/auth/handler`
4. **Client ID**: Should be visible
5. **Client Secret**: Should be generated

### Step 4: Test the Button

1. Open your app in the browser
2. Open Developer Tools (F12) → Console tab
3. Click the "Sign in with GitHub" button
4. Watch for error messages in the console
5. Copy the EXACT error message

### Step 5: Check if Button is Clickable

Add this test to verify the button is working:

1. Open your app
2. Right-click the GitHub button
3. Select "Inspect Element"
4. Check if the button has `disabled` attribute
5. Check if `onClick` handler is attached

### Step 6: Force Reload

Sometimes the browser cache causes issues:

1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) to hard reload
2. Or clear browser cache completely
3. Try the button again

### Step 7: Test Google Sign-In First

If Google sign-in works but GitHub doesn't:
- The issue is specific to GitHub configuration
- Double-check GitHub OAuth App and Firebase GitHub settings

If Google sign-in also doesn't work:
- The issue might be with Firebase initialization or authentication setup
- Check browser console for Firebase initialization errors

### Step 8: Restart Development Server

If testing locally:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
```

## What to Send Me

If none of the above works, please send me:

1. **Browser Console Error** (exact error message when clicking the button)
2. **Screenshot** of Firebase Console → Authentication → Sign-in method → GitHub settings
3. **Screenshot** of your GitHub OAuth App settings
4. **Confirmation** that the button appears on screen and is clickable

## Quick Test Command

Run this in your browser console when on the auth screen:

```javascript
// Test if signInWithGithub function exists
console.log('signInWithGithub:', typeof signInWithGithub);

// Test Firebase auth
console.log('Firebase auth initialized:', !!window.firebase || !!auth);
```

## Expected Behavior

When working correctly:
1. Click "Sign in with GitHub" button
2. Popup window opens with GitHub login
3. You authorize the app
4. Popup closes
5. You're logged into Chatter with your GitHub profile

## Still Not Working?

Let me know the exact error message from the browser console, and I'll help you fix it!
