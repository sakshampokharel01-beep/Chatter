# Deploy DM Permission Fix

## Issue
Users getting "Missing or insufficient permissions" error when trying to create DM conversations.

## Root Cause
The Firestore rule for DMs was blocking `update` operations completely, but when using `setDoc` with `{ merge: true }`, Firestore treats it as an update if the document already exists.

## Fix Applied

### 1. Updated Firestore Rules
Changed the DM rules to allow updates when:
- User is a participant
- Participants array is not being modified
- This allows merge operations to work

### 2. Added Better Error Logging
Added validation and detailed error logging in DirectMessages.jsx to help debug issues.

## Deployment Steps

### Step 1: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or manually in Firebase Console:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Rules" tab
4. Copy the contents of `firestore.rules`
5. Click "Publish"

### Step 2: Deploy Code to Vercel

The code changes are already pushed to GitHub. Vercel will auto-deploy.

Or manually:
```bash
git add -A
git commit -m "fix: DM creation permission error"
git push origin master
```

### Step 3: Verify Fix

1. Hard refresh browser (Ctrl+Shift+R)
2. Try to open a DM with a friend
3. Check browser console for errors
4. Should see no "Missing or insufficient permissions" errors

## Testing

After deployment, test:
1. ✅ Create new DM conversation
2. ✅ Open existing DM conversation
3. ✅ Send messages in DM
4. ✅ No permission errors in console

## Firestore Rule Changes

**Before:**
```
allow update, delete: if false;
```

**After:**
```
allow update: if isSignedIn() && 
  isParticipant() &&
  request.resource.data.participants == resource.data.participants;
allow delete: if false;
```

This allows merge operations while still preventing:
- Modifying the participants array
- Deleting DM documents
- Non-participants from accessing

## Date
April 2, 2026
