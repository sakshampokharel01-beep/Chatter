# Phase 1 Sidebar Features - Deployment Guide

## Overview

This guide covers deploying the Phase 1 essential sidebar features:
1. **Global Search** - Search across messages, users, and DMs
2. **Saved Messages** - Bookmark messages for later reference
3. **Sidebar Integration** - New navigation items

## Prerequisites

- Firebase project with Firestore enabled
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase CLI (`firebase login`)

## Step 1: Create Firestore Indexes

You need to create composite indexes for the `savedMessages` collection.

### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Create the following indexes:

**Index 1:**
- Collection ID: `savedMessages`
- Fields to index:
  - `userId` - Ascending
  - `savedAt` - Descending
- Query scope: Collection

**Index 2:**
- Collection ID: `savedMessages`
- Fields to index:
  - `userId` - Ascending
  - `messageId` - Ascending
- Query scope: Collection

### Option B: Using firestore.indexes.json

Create a file `firestore.indexes.json` in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "savedMessages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "savedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "savedMessages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "messageId",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

## Step 2: Deploy Firestore Security Rules

The `firestore.rules` file has been updated with security rules for the `savedMessages` collection.

Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

### Verify Rules

The new rules should include:

```javascript
// 9. SAVED MESSAGES (Bookmarks)
match /savedMessages/{docId} {
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow create: if isSignedIn() && 
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.messageId is string &&
    request.resource.data.conversationType in ['global', 'dm'] &&
    request.resource.data.messageText is string &&
    request.resource.data.messageText.size() <= 500;
  allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow update: if isSignedIn() && 
    resource.data.userId == request.auth.uid &&
    request.resource.data.userId == resource.data.userId &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['note']);
}
```

## Step 3: Build and Deploy Application

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Build the application**:
```bash
npm run build
```

3. **Deploy to hosting**:

For Vercel:
```bash
vercel --prod
```

For Firebase Hosting:
```bash
firebase deploy --only hosting
```

For other platforms, follow their deployment instructions.

## Step 4: Verify Deployment

### Test Global Search

1. Log in to your application
2. Click the **Search** icon in the sidebar (magnifying glass)
3. Type at least 2 characters
4. Verify search results appear for:
   - Messages (if you have global messages)
   - Users (if you have other users)
   - DMs (if you have private conversations)
5. Click a result to navigate to it

### Test Saved Messages

1. Hover over any message in Global Chat
2. Click the **star icon** (save button)
3. Verify you see a "Message saved" notification
4. Click **Saved** in the sidebar
5. Verify the message appears in Saved Messages
6. Click "Go to message" to navigate back
7. Click the star icon again to remove the bookmark
8. Verify you see a "Message removed" notification

### Test Mobile Responsiveness

1. Open the app on a mobile device or use browser dev tools
2. Verify the search modal is full-screen on mobile
3. Verify Saved Messages view works on mobile
4. Test navigation between views

## Step 5: Monitor for Errors

### Check Browser Console

1. Open browser developer tools (F12)
2. Check the Console tab for any errors
3. Common issues:
   - **Permission denied**: Firestore rules not deployed
   - **Index required**: Firestore indexes not created
   - **Module not found**: Missing dependencies

### Check Firestore Console

1. Go to Firebase Console → Firestore Database
2. Verify `savedMessages` collection is created when you save a message
3. Check document structure matches the design:
   - `userId`
   - `messageId`
   - `conversationType`
   - `conversationId`
   - `messageText`
   - `messageSender`
   - `messageSenderPhoto`
   - `messageTimestamp`
   - `savedAt`
   - `note`

## Troubleshooting

### Search Not Working

**Issue**: Search returns no results

**Solutions**:
1. Verify you have messages in the database
2. Check browser console for errors
3. Verify Firestore rules allow reading messages
4. Try searching for exact text from a message

### Saved Messages Not Saving

**Issue**: "Failed to save message" error

**Solutions**:
1. Verify Firestore rules are deployed
2. Check `savedMessages` collection rules in Firebase Console
3. Verify user is authenticated
4. Check browser console for detailed error

### Indexes Not Working

**Issue**: "The query requires an index" error

**Solutions**:
1. Click the link in the error message to create the index automatically
2. Or manually create indexes as described in Step 1
3. Wait 2-5 minutes for indexes to build
4. Refresh the page and try again

### Search Modal Not Closing

**Issue**: Can't close search modal

**Solutions**:
1. Press Escape key
2. Click outside the modal
3. Click the X button in the top right
4. Refresh the page if stuck

## Performance Optimization

### Enable Firestore Caching

The search hook already implements 30-second caching. To improve performance further:

1. Enable Firestore persistence in `src/firebase.js`:

```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// After initializing Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});
```

### Monitor Query Performance

1. Go to Firebase Console → Firestore Database → Usage tab
2. Monitor read/write operations
3. Check for expensive queries
4. Optimize if needed

## Next Steps

After successful deployment:

1. **Gather user feedback** on search and saved messages
2. **Monitor usage** in Firebase Analytics
3. **Consider Phase 2 features**:
   - Friends/Contacts panel with online status
   - Friend request management
   - Quick DM access from friends list

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all deployment steps were completed
3. Check Firebase Console for quota limits
4. Review Firestore security rules

---

**Deployment Checklist:**

- [ ] Firestore indexes created
- [ ] Firestore security rules deployed
- [ ] Application built successfully
- [ ] Application deployed to hosting
- [ ] Global Search tested
- [ ] Saved Messages tested
- [ ] Mobile responsiveness verified
- [ ] No console errors
- [ ] Firestore collections working

**Status**: Ready for Deployment
**Created**: 2026
**Version**: 1.0.0
