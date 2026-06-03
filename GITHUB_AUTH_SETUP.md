# GitHub Authentication Setup Guide

## What's Been Added

✅ GitHub login button on auth screen  
✅ GitHub authentication handler  
✅ GitHub icon and styling  

## Setup Instructions

To enable GitHub login, you need to configure it in both GitHub and Firebase:

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"** (or "New GitHub App")
3. Fill in the details:
   - **Application name**: `Chatter` (or your app name)
   - **Homepage URL**: `https://your-app-url.web.app` (your deployed URL)
   - **Authorization callback URL**: 
     - For Firebase: `https://your-project-id.firebaseapp.com/__/auth/handler`
     - Example: `https://chatter-abc123.firebaseapp.com/__/auth/handler`
4. Click **"Register application"**
5. **Copy the Client ID** and **Client Secret** (you'll need these for Firebase)

### Step 2: Enable GitHub Auth in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Find **GitHub** in the list and click on it
5. Click **"Enable"**
6. Paste your **Client ID** and **Client Secret** from GitHub
7. Copy the **Authorization callback URL** shown by Firebase
8. Click **"Save"**

### Step 3: Update GitHub OAuth App (if needed)

1. Go back to your GitHub OAuth App settings
2. Make sure the **Authorization callback URL** matches what Firebase provided
3. Save changes

### Step 4: Test

1. Run your app locally: `npm run dev`
2. Click **"Sign in with GitHub"**
3. Authorize the app
4. You should be logged in!

## Local Testing

For localhost testing, you also need to add:
- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: Use the one from Firebase (it handles localhost automatically)

## Troubleshooting

### "auth/operation-not-allowed"
- GitHub sign-in is not enabled in Firebase Console
- Go to Authentication → Sign-in method → Enable GitHub

### "auth/unauthorized-domain"
- Your domain is not authorized in Firebase
- Go to Authentication → Settings → Authorized domains
- Add your production domain and `localhost` for testing

### "auth/popup-blocked"
- Browser blocked the popup
- Allow popups for your site

### "auth/account-exists-with-different-credential"
- A user with this email already exists using a different sign-in method (Google, Email, etc.)
- They need to sign in with their original method first
- You can enable account linking in Firebase if needed

## Security Notes

- Never commit your GitHub Client Secret to version control
- Firebase stores it securely on their servers
- The Client Secret is only used server-side by Firebase
- Users only see the Client ID in the OAuth flow

## Features

- ✅ Automatic user profile creation with GitHub username and avatar
- ✅ Same user experience as Google login
- ✅ Secure popup-based authentication
- ✅ Error handling and user-friendly messages

