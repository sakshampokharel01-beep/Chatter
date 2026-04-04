# Deploy Storage Rules NOW

## Quick Deploy

Run this command to deploy storage rules:

```bash
firebase deploy --only storage
```

## If you get an error about Storage not being enabled:

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click **Storage** in the left menu
4. Click **Get Started**
5. Choose **Start in production mode** (we have custom rules)
6. Click **Done**
7. Run the deploy command again

## Verify it worked:

After deploying, you should see:
```
✔  Deploy complete!
```

Then test voice recording again in your app.

## If voice messages still don't work:

Check browser console (F12) for errors. The most common issues are:

1. **Storage not enabled** - Follow steps above
2. **Rules not deployed** - Run `firebase deploy --only storage`
3. **Permission denied** - Make sure you're friends with the person you're messaging
4. **Microphone blocked** - Allow microphone access in browser

## Alternative: Test with file upload first

If voice recording still doesn't work, try uploading a regular file (image/document) first:
1. Click the 📎 (paperclip) button
2. Select any image or PDF
3. If this works, the issue is with voice recording specifically
4. If this fails too, Storage rules aren't deployed

## Need help?

Check the browser console (F12 → Console tab) and look for error messages.
Common errors:
- "Permission denied" → Storage rules not deployed
- "Storage bucket not configured" → Storage not enabled in Firebase
- "Invalid audio format" → Browser compatibility issue (try Chrome)
