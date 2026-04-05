# Apple Sign-In Setup Guide

This guide will help you add Apple Sign-In to your Chatter app.

## Prerequisites
- Apple Developer Account ($99/year)
- Your app must be served over HTTPS (works on localhost for testing)
- Firebase project

## Step 1: Configure Apple Developer Account

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → Continue
5. Fill in:
   - Description: `Chatter Web App`
   - Bundle ID: `com.yourcompany.chatter` (use your domain)
   - Check **Sign In with Apple**
6. Click **Continue** → **Register**

## Step 2: Create Service ID

1. In Apple Developer Portal, click **Identifiers** → **+**
2. Select **Services IDs** → Continue
3. Fill in:
   - Description: `Chatter Web Sign In`
   - Identifier: `com.yourcompany.chatter.web` (must be different from App ID)
   - Check **Sign In with Apple**
4. Click **Continue** → **Register**
5. Click on your new Service ID
6. Check **Sign In with Apple** → **Configure**
7. Add domains and return URLs:
   - **Primary App ID**: Select your App ID from Step 1
   - **Domains**: Add your domain (e.g., `chatter-talk.vercel.app`)
   - **Return URLs**: Add `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`
     - Find YOUR-PROJECT-ID in Firebase Console → Project Settings
8. Click **Save** → **Continue** → **Save**

## Step 3: Create Private Key

1. In Apple Developer Portal, go to **Keys** → **+**
2. Fill in:
   - Key Name: `Chatter Sign In Key`
   - Check **Sign In with Apple**
   - Click **Configure** → Select your Primary App ID
3. Click **Continue** → **Register**
4. **Download the .p8 key file** (you can only download once!)
5. Note the **Key ID** (10 characters)

## Step 4: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Click **Apple** → **Enable**
5. Fill in:
   - **Service ID**: Your Service ID from Step 2 (e.g., `com.yourcompany.chatter.web`)
   - **Apple Team ID**: Found in Apple Developer Portal → Membership
   - **Key ID**: From Step 3
   - **Private Key**: Open the .p8 file and paste the entire content
6. Click **Save**
7. Copy the **OAuth redirect URI** and add it to your Apple Service ID (if not already done)

## Step 5: Update Code

The code changes have been prepared for you. Run these commands:

```bash
# The changes are already committed, just pull if needed
git pull
```

## Step 6: Test

1. Start your dev server: `npm run dev`
2. Click "Sign in with Apple"
3. You should see the Apple sign-in popup
4. Sign in with your Apple ID
5. Choose whether to share your email or hide it

## Troubleshooting

### "Invalid client" error
- Check that your Service ID matches exactly in Firebase
- Verify the OAuth redirect URI is added to your Apple Service ID

### "Invalid redirect URI" error
- Make sure you added the Firebase redirect URI to your Apple Service ID
- Check that your domain is listed in Apple Service ID configuration

### "Invalid key" error
- Verify you pasted the entire .p8 file content including BEGIN/END lines
- Check that the Key ID matches

### Testing on localhost
- Apple Sign-In works on localhost for development
- For production, you must use HTTPS

## Security Notes

- Never commit your .p8 private key file to git
- The private key is stored securely in Firebase
- Apple Sign-In provides strong privacy features (email hiding)
- Users can revoke access anytime from their Apple ID settings

## Cost
- Apple Developer Account: $99/year (required)
- Firebase: Free tier supports Apple Sign-In

## Next Steps

After setup is complete:
1. Test thoroughly on different devices
2. Add Apple Sign-In button to your landing page
3. Update your privacy policy to mention Apple Sign-In
4. Consider adding "Sign in with Apple" as the primary option (Apple requires this if you offer other social logins)
